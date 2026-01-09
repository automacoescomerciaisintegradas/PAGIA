/**
 * PAGIA - Knowledge Base
 * Base de conhecimento com RAG para contexto de projeto
 *
 * @module knowledge/knowledge-base
 * @author Automações Comerciais Integradas
 */
import { v4 as uuidv4 } from 'uuid';
import { existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { createVectorStore } from './vector-store.js';
import { Chunker } from './chunker.js';
import { eventBus, PAGIAEvents } from '../core/event-bus.js';
import { readFile, listFiles } from '../utils/file-utils.js';
const DEFAULT_SEARCH_OPTIONS = {
    limit: 5,
    threshold: 0.3,
    includeChunks: true,
};
/**
 * Classe KnowledgeBase - Base de conhecimento RAG
 */
export class KnowledgeBase {
    static instance;
    vectorStore;
    chunker;
    documents = new Map();
    storagePath;
    constructor(storagePath) {
        this.storagePath = storagePath;
        this.vectorStore = createVectorStore(join(storagePath, 'vectors'));
        this.chunker = new Chunker();
        this.loadDocuments();
    }
    /**
     * Obtém instância singleton
     */
    static getInstance(storagePath) {
        if (!KnowledgeBase.instance) {
            KnowledgeBase.instance = new KnowledgeBase(storagePath);
        }
        return KnowledgeBase.instance;
    }
    /**
     * Carrega documentos salvos
     */
    loadDocuments() {
        const docsPath = join(this.storagePath, 'documents.json');
        if (!existsSync(docsPath)) {
            return;
        }
        try {
            const content = readFile(docsPath);
            const docs = JSON.parse(content);
            for (const doc of docs) {
                this.documents.set(doc.id, {
                    ...doc,
                    createdAt: new Date(doc.createdAt),
                    updatedAt: new Date(doc.updatedAt),
                });
            }
        }
        catch (error) {
            console.error('Erro ao carregar documentos:', error);
        }
    }
    /**
     * Salva documentos
     */
    async saveDocuments() {
        const docsPath = join(this.storagePath, 'documents.json');
        const docs = Array.from(this.documents.values());
        const { writeFile, ensureDir } = await import('../utils/file-utils.js');
        ensureDir(this.storagePath);
        writeFile(docsPath, JSON.stringify(docs, null, 2));
    }
    /**
     * Adiciona documento à base de conhecimento
     */
    async add(content, options = {}) {
        const id = uuidv4();
        const now = new Date();
        // Detectar tipo
        const type = options.type || this.detectType(content, options.source);
        // Chunkar conteúdo
        const chunks = this.chunker.chunk(content, options.source || id);
        // Inserir chunks no vector store
        for (const chunk of chunks) {
            await this.vectorStore.insert(chunk.id, chunk.content, undefined, { documentId: id, ...chunk.metadata });
        }
        // Criar documento
        const document = {
            id,
            title: options.title || this.extractTitle(content) || `Documento ${id.slice(0, 8)}`,
            content,
            source: options.source || 'manual',
            type,
            chunks,
            metadata: {
                author: options.metadata?.author,
                tags: options.metadata?.tags || [],
                language: options.metadata?.language,
                version: options.metadata?.version,
                custom: options.metadata?.custom || {},
            },
            createdAt: now,
            updatedAt: now,
        };
        this.documents.set(id, document);
        await this.saveDocuments();
        await eventBus.emit(PAGIAEvents.KNOWLEDGE_ADDED, { documentId: id });
        return document;
    }
    /**
     * Adiciona arquivo à base de conhecimento
     */
    async addFile(filePath, metadata) {
        const content = readFile(filePath);
        const title = basename(filePath);
        return this.add(content, {
            title,
            source: filePath,
            metadata,
        });
    }
    /**
     * Adiciona diretório à base de conhecimento
     */
    async addDirectory(dirPath, options = {}) {
        const extensions = options.extensions || ['md', 'txt', 'ts', 'js', 'py', 'yaml', 'yml', 'json'];
        const files = listFiles(dirPath, { recursive: options.recursive, extensions });
        const documents = [];
        for (const file of files) {
            try {
                const doc = await this.addFile(file, options.metadata);
                documents.push(doc);
            }
            catch (error) {
                console.error(`Erro ao adicionar ${file}:`, error);
            }
        }
        return documents;
    }
    /**
     * Busca documentos relevantes
     */
    async search(query, options = {}) {
        const opts = { ...DEFAULT_SEARCH_OPTIONS, ...options };
        // Buscar no vector store
        const vectorResults = await this.vectorStore.search(query, opts.limit * 3, opts.threshold);
        // Agrupar por documento
        const documentChunks = new Map();
        for (const result of vectorResults) {
            const docId = result.metadata.documentId;
            if (!documentChunks.has(docId)) {
                documentChunks.set(docId, []);
            }
            documentChunks.get(docId).push(result);
        }
        // Construir resultados
        const results = [];
        for (const [docId, chunks] of documentChunks) {
            const document = this.documents.get(docId);
            if (!document)
                continue;
            // Aplicar filtros
            if (opts.filterByType && !opts.filterByType.includes(document.type)) {
                continue;
            }
            if (opts.filterByTags) {
                const hasTag = opts.filterByTags.some((tag) => document.metadata.tags.includes(tag));
                if (!hasTag)
                    continue;
            }
            // Calcular similaridade geral
            const overallSimilarity = chunks.reduce((sum, c) => sum + c.similarity, 0) / chunks.length;
            results.push({
                document,
                relevantChunks: opts.includeChunks
                    ? chunks.map((c) => ({ content: c.content, similarity: c.similarity }))
                    : [],
                overallSimilarity,
            });
        }
        // Ordenar e limitar
        await eventBus.emit(PAGIAEvents.KNOWLEDGE_SEARCHED, { query, resultsCount: results.length });
        return results
            .sort((a, b) => b.overallSimilarity - a.overallSimilarity)
            .slice(0, opts.limit);
    }
    /**
     * Obtém contexto para prompt de IA
     */
    async getContext(query, maxTokens = 4000) {
        const results = await this.search(query, { limit: 10, includeChunks: true });
        let context = '';
        let tokenCount = 0;
        const estimatedTokensPerChar = 0.25;
        for (const result of results) {
            for (const chunk of result.relevantChunks) {
                const chunkTokens = Math.ceil(chunk.content.length * estimatedTokensPerChar);
                if (tokenCount + chunkTokens > maxTokens) {
                    break;
                }
                context += `\n---\nFonte: ${result.document.title}\n${chunk.content}\n`;
                tokenCount += chunkTokens;
            }
            if (tokenCount >= maxTokens)
                break;
        }
        return context.trim();
    }
    /**
     * Atualiza documento
     */
    async update(id, updates) {
        const document = this.documents.get(id);
        if (!document) {
            return false;
        }
        if (updates.content) {
            // Remover chunks antigos
            for (const chunk of document.chunks) {
                await this.vectorStore.delete(chunk.id);
            }
            // Criar novos chunks
            const newChunks = this.chunker.chunk(updates.content, document.source);
            for (const chunk of newChunks) {
                await this.vectorStore.insert(chunk.id, chunk.content, undefined, { documentId: id, ...chunk.metadata });
            }
            document.content = updates.content;
            document.chunks = newChunks;
        }
        if (updates.metadata) {
            document.metadata = { ...document.metadata, ...updates.metadata };
        }
        document.updatedAt = new Date();
        await this.saveDocuments();
        await eventBus.emit(PAGIAEvents.KNOWLEDGE_UPDATED, { documentId: id });
        return true;
    }
    /**
     * Remove documento
     */
    async delete(id) {
        const document = this.documents.get(id);
        if (!document) {
            return false;
        }
        // Remover chunks do vector store
        for (const chunk of document.chunks) {
            await this.vectorStore.delete(chunk.id);
        }
        this.documents.delete(id);
        await this.saveDocuments();
        return true;
    }
    /**
     * Obtém documento por ID
     */
    get(id) {
        return this.documents.get(id);
    }
    /**
     * Lista documentos
     */
    list(options) {
        let docs = Array.from(this.documents.values());
        if (options?.type) {
            docs = docs.filter((d) => d.type === options.type);
        }
        if (options?.tags) {
            docs = docs.filter((d) => options.tags.some((tag) => d.metadata.tags.includes(tag)));
        }
        return docs;
    }
    /**
     * Obtém estatísticas
     */
    getStats() {
        const docs = Array.from(this.documents.values());
        const byType = {};
        const allTags = new Set();
        let totalChunks = 0;
        let totalChars = 0;
        for (const doc of docs) {
            byType[doc.type] = (byType[doc.type] || 0) + 1;
            totalChunks += doc.chunks.length;
            totalChars += doc.content.length;
            for (const tag of doc.metadata.tags) {
                allTags.add(tag);
            }
        }
        return {
            documentCount: docs.length,
            chunkCount: totalChunks,
            totalCharacters: totalChars,
            byType,
            tags: Array.from(allTags),
        };
    }
    /**
     * Limpa base de conhecimento
     */
    async clear() {
        this.documents.clear();
        await this.vectorStore.clear();
        await this.saveDocuments();
    }
    /**
     * Detecta tipo de documento
     */
    detectType(content, source) {
        if (source) {
            const ext = extname(source).toLowerCase();
            const typeMap = {
                '.md': 'markdown',
                '.markdown': 'markdown',
                '.ts': 'code',
                '.js': 'code',
                '.py': 'code',
                '.json': 'json',
                '.yaml': 'yaml',
                '.yml': 'yaml',
                '.txt': 'text',
            };
            return typeMap[ext] || 'other';
        }
        // Detectar por conteúdo
        if (content.startsWith('{') || content.startsWith('['))
            return 'json';
        if (content.match(/^#\s/m))
            return 'markdown';
        if (content.match(/^(function|const|let|var|class|import)/m))
            return 'code';
        return 'text';
    }
    /**
     * Extrai título do conteúdo
     */
    extractTitle(content) {
        // Heading markdown
        const headingMatch = content.match(/^#\s+(.+)$/m);
        if (headingMatch)
            return headingMatch[1];
        // Primeira linha significativa
        const firstLine = content.split('\n').find((l) => l.trim().length > 0);
        if (firstLine && firstLine.length < 100) {
            return firstLine.trim();
        }
        return null;
    }
    /**
     * Configura chunker
     */
    setChunkerOptions(options) {
        this.chunker.setOptions(options);
    }
}
/**
 * Factory para criar KnowledgeBase
 */
export function createKnowledgeBase(storagePath) {
    return KnowledgeBase.getInstance(storagePath);
}
//# sourceMappingURL=knowledge-base.js.map