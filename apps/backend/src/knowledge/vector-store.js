/**
 * PAGIA - Vector Store
 * Armazenamento vetorial local para busca semântica
 *
 * @module knowledge/vector-store
 * @author Automações Comerciais Integradas
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ensureDir } from '../utils/file-utils.js';
import { embeddingsService } from './embeddings.js';
/**
 * Classe VectorStore - Armazenamento vetorial local
 */
export class VectorStore {
    documents = new Map();
    storagePath;
    dimensions;
    autoSave;
    dirty = false;
    constructor(storagePath, dimensions = 768) {
        this.storagePath = storagePath;
        this.dimensions = dimensions;
        this.autoSave = true;
        this.load();
    }
    /**
     * Carrega documentos do disco
     */
    load() {
        const filePath = this.getFilePath();
        if (!existsSync(filePath)) {
            return;
        }
        try {
            const content = readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            for (const doc of data.documents) {
                this.documents.set(doc.id, {
                    ...doc,
                    createdAt: new Date(doc.createdAt),
                });
            }
        }
        catch (error) {
            console.error('Erro ao carregar vector store:', error);
        }
    }
    /**
     * Salva documentos no disco
     */
    async save() {
        ensureDir(this.storagePath);
        const filePath = this.getFilePath();
        const data = {
            dimensions: this.dimensions,
            documents: Array.from(this.documents.values()),
            savedAt: new Date().toISOString(),
        };
        writeFileSync(filePath, JSON.stringify(data), 'utf-8');
        this.dirty = false;
    }
    /**
     * Obtém caminho do arquivo de armazenamento
     */
    getFilePath() {
        return join(this.storagePath, 'vectors.json');
    }
    /**
     * Insere um documento no store
     */
    async insert(id, content, vector, metadata = {}) {
        // Gerar embedding se não fornecido
        const embedding = vector || await embeddingsService.embed(content);
        // Validar dimensões
        if (embedding.length !== this.dimensions) {
            throw new Error(`Dimensões incompatíveis: esperado ${this.dimensions}, recebido ${embedding.length}`);
        }
        const document = {
            id,
            vector: embedding,
            content,
            metadata,
            createdAt: new Date(),
        };
        this.documents.set(id, document);
        this.dirty = true;
        if (this.autoSave) {
            await this.save();
        }
    }
    /**
     * Insere múltiplos documentos
     */
    async insertBatch(documents) {
        const contents = documents.map((d) => d.content);
        const embeddings = await embeddingsService.embedBatch(contents);
        for (let i = 0; i < documents.length; i++) {
            const doc = documents[i];
            const embedding = embeddings[i];
            const vectorDoc = {
                id: doc.id,
                vector: embedding,
                content: doc.content,
                metadata: doc.metadata || {},
                createdAt: new Date(),
            };
            this.documents.set(doc.id, vectorDoc);
        }
        this.dirty = true;
        if (this.autoSave) {
            await this.save();
        }
    }
    /**
     * Busca documentos similares a uma query
     */
    async search(query, k = 5, threshold = 0) {
        if (this.documents.size === 0) {
            return [];
        }
        // Gerar embedding da query
        const queryEmbedding = await embeddingsService.embed(query);
        // Calcular similaridades
        const results = [];
        for (const doc of this.documents.values()) {
            const similarity = embeddingsService.cosineSimilarity(queryEmbedding, doc.vector);
            if (similarity >= threshold) {
                results.push({
                    id: doc.id,
                    content: doc.content,
                    metadata: doc.metadata,
                    similarity,
                });
            }
        }
        // Ordenar e limitar
        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, k);
    }
    /**
     * Busca por vetor diretamente
     */
    searchByVector(vector, k = 5, threshold = 0) {
        const results = [];
        for (const doc of this.documents.values()) {
            const similarity = embeddingsService.cosineSimilarity(vector, doc.vector);
            if (similarity >= threshold) {
                results.push({
                    id: doc.id,
                    content: doc.content,
                    metadata: doc.metadata,
                    similarity,
                });
            }
        }
        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, k);
    }
    /**
     * Atualiza um documento
     */
    async update(id, updates) {
        const existing = this.documents.get(id);
        if (!existing) {
            return false;
        }
        if (updates.content) {
            existing.content = updates.content;
            existing.vector = await embeddingsService.embed(updates.content);
        }
        if (updates.metadata) {
            existing.metadata = { ...existing.metadata, ...updates.metadata };
        }
        this.dirty = true;
        if (this.autoSave) {
            await this.save();
        }
        return true;
    }
    /**
     * Remove um documento
     */
    async delete(id) {
        const deleted = this.documents.delete(id);
        if (deleted) {
            this.dirty = true;
            if (this.autoSave) {
                await this.save();
            }
        }
        return deleted;
    }
    /**
     * Obtém um documento por ID
     */
    get(id) {
        return this.documents.get(id);
    }
    /**
     * Verifica se documento existe
     */
    has(id) {
        return this.documents.has(id);
    }
    /**
     * Lista todos os IDs
     */
    listIds() {
        return Array.from(this.documents.keys());
    }
    /**
     * Lista todos os documentos
     */
    listAll() {
        return Array.from(this.documents.values());
    }
    /**
     * Número de documentos
     */
    count() {
        return this.documents.size;
    }
    /**
     * Limpa todos os documentos
     */
    async clear() {
        this.documents.clear();
        this.dirty = true;
        if (this.autoSave) {
            await this.save();
        }
    }
    /**
     * Obtém estatísticas
     */
    getStats() {
        const documents = Array.from(this.documents.values());
        const lastDoc = documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
        // Estimar tamanho
        const avgVectorSize = this.dimensions * 8; // 8 bytes per float64
        const avgMetadataSize = 100; // estimate
        const sizeBytes = this.documents.size * (avgVectorSize + avgMetadataSize);
        return {
            documentCount: this.documents.size,
            dimensions: this.dimensions,
            sizeBytes,
            lastUpdated: lastDoc?.createdAt || null,
        };
    }
    /**
     * Filtra documentos por metadata
     */
    filterByMetadata(filter) {
        return Array.from(this.documents.values()).filter((doc) => {
            for (const [key, value] of Object.entries(filter)) {
                if (doc.metadata[key] !== value) {
                    return false;
                }
            }
            return true;
        });
    }
    /**
     * Habilita/desabilita auto-save
     */
    setAutoSave(enabled) {
        this.autoSave = enabled;
    }
    /**
     * Verifica se há mudanças não salvas
     */
    isDirty() {
        return this.dirty;
    }
}
/**
 * Factory para criar VectorStore
 */
export function createVectorStore(storagePath, dimensions) {
    return new VectorStore(storagePath, dimensions);
}
//# sourceMappingURL=vector-store.js.map