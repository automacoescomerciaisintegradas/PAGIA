/**
 * PAGIA - Knowledge Base
 * Base de conhecimento com RAG para contexto de projeto
 *
 * @module knowledge/knowledge-base
 * @author Automações Comerciais Integradas
 */
import { Chunk, ChunkOptions } from './chunker.js';
export interface KnowledgeDocument {
    id: string;
    title: string;
    content: string;
    source: string;
    type: DocumentType;
    chunks: Chunk[];
    metadata: DocumentMetadata;
    createdAt: Date;
    updatedAt: Date;
}
export type DocumentType = 'markdown' | 'code' | 'text' | 'json' | 'yaml' | 'other';
export interface DocumentMetadata {
    author?: string;
    tags: string[];
    language?: string;
    version?: string;
    custom: Record<string, unknown>;
}
export interface SearchOptions {
    limit: number;
    threshold: number;
    includeChunks: boolean;
    filterByType?: DocumentType[];
    filterByTags?: string[];
}
export interface SearchResult {
    document: KnowledgeDocument;
    relevantChunks: Array<{
        content: string;
        similarity: number;
    }>;
    overallSimilarity: number;
}
export interface KnowledgeStats {
    documentCount: number;
    chunkCount: number;
    totalCharacters: number;
    byType: Record<string, number>;
    tags: string[];
}
/**
 * Classe KnowledgeBase - Base de conhecimento RAG
 */
export declare class KnowledgeBase {
    private static instance;
    private vectorStore;
    private chunker;
    private documents;
    private storagePath;
    private constructor();
    /**
     * Obtém instância singleton
     */
    static getInstance(storagePath: string): KnowledgeBase;
    /**
     * Carrega documentos salvos
     */
    private loadDocuments;
    /**
     * Salva documentos
     */
    private saveDocuments;
    /**
     * Adiciona documento à base de conhecimento
     */
    add(content: string, options?: {
        title?: string;
        source?: string;
        type?: DocumentType;
        metadata?: Partial<DocumentMetadata>;
    }): Promise<KnowledgeDocument>;
    /**
     * Adiciona arquivo à base de conhecimento
     */
    addFile(filePath: string, metadata?: Partial<DocumentMetadata>): Promise<KnowledgeDocument>;
    /**
     * Adiciona diretório à base de conhecimento
     */
    addDirectory(dirPath: string, options?: {
        extensions?: string[];
        recursive?: boolean;
        metadata?: Partial<DocumentMetadata>;
    }): Promise<KnowledgeDocument[]>;
    /**
     * Busca documentos relevantes
     */
    search(query: string, options?: Partial<SearchOptions>): Promise<SearchResult[]>;
    /**
     * Obtém contexto para prompt de IA
     */
    getContext(query: string, maxTokens?: number): Promise<string>;
    /**
     * Atualiza documento
     */
    update(id: string, updates: {
        content?: string;
        metadata?: Partial<DocumentMetadata>;
    }): Promise<boolean>;
    /**
     * Remove documento
     */
    delete(id: string): Promise<boolean>;
    /**
     * Obtém documento por ID
     */
    get(id: string): KnowledgeDocument | undefined;
    /**
     * Lista documentos
     */
    list(options?: {
        type?: DocumentType;
        tags?: string[];
    }): KnowledgeDocument[];
    /**
     * Obtém estatísticas
     */
    getStats(): KnowledgeStats;
    /**
     * Limpa base de conhecimento
     */
    clear(): Promise<void>;
    /**
     * Detecta tipo de documento
     */
    private detectType;
    /**
     * Extrai título do conteúdo
     */
    private extractTitle;
    /**
     * Configura chunker
     */
    setChunkerOptions(options: Partial<ChunkOptions>): void;
}
/**
 * Factory para criar KnowledgeBase
 */
export declare function createKnowledgeBase(storagePath: string): KnowledgeBase;
//# sourceMappingURL=knowledge-base.d.ts.map