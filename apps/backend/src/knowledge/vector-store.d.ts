/**
 * PAGIA - Vector Store
 * Armazenamento vetorial local para busca semântica
 *
 * @module knowledge/vector-store
 * @author Automações Comerciais Integradas
 */
export interface VectorDocument {
    id: string;
    vector: number[];
    content: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
}
export interface VectorSearchResult {
    id: string;
    content: string;
    metadata: Record<string, unknown>;
    similarity: number;
}
export interface VectorStoreStats {
    documentCount: number;
    dimensions: number;
    sizeBytes: number;
    lastUpdated: Date | null;
}
/**
 * Classe VectorStore - Armazenamento vetorial local
 */
export declare class VectorStore {
    private documents;
    private storagePath;
    private dimensions;
    private autoSave;
    private dirty;
    constructor(storagePath: string, dimensions?: number);
    /**
     * Carrega documentos do disco
     */
    private load;
    /**
     * Salva documentos no disco
     */
    save(): Promise<void>;
    /**
     * Obtém caminho do arquivo de armazenamento
     */
    private getFilePath;
    /**
     * Insere um documento no store
     */
    insert(id: string, content: string, vector?: number[], metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Insere múltiplos documentos
     */
    insertBatch(documents: Array<{
        id: string;
        content: string;
        metadata?: Record<string, unknown>;
    }>): Promise<void>;
    /**
     * Busca documentos similares a uma query
     */
    search(query: string, k?: number, threshold?: number): Promise<VectorSearchResult[]>;
    /**
     * Busca por vetor diretamente
     */
    searchByVector(vector: number[], k?: number, threshold?: number): VectorSearchResult[];
    /**
     * Atualiza um documento
     */
    update(id: string, updates: {
        content?: string;
        metadata?: Record<string, unknown>;
    }): Promise<boolean>;
    /**
     * Remove um documento
     */
    delete(id: string): Promise<boolean>;
    /**
     * Obtém um documento por ID
     */
    get(id: string): VectorDocument | undefined;
    /**
     * Verifica se documento existe
     */
    has(id: string): boolean;
    /**
     * Lista todos os IDs
     */
    listIds(): string[];
    /**
     * Lista todos os documentos
     */
    listAll(): VectorDocument[];
    /**
     * Número de documentos
     */
    count(): number;
    /**
     * Limpa todos os documentos
     */
    clear(): Promise<void>;
    /**
     * Obtém estatísticas
     */
    getStats(): VectorStoreStats;
    /**
     * Filtra documentos por metadata
     */
    filterByMetadata(filter: Record<string, unknown>): VectorDocument[];
    /**
     * Habilita/desabilita auto-save
     */
    setAutoSave(enabled: boolean): void;
    /**
     * Verifica se há mudanças não salvas
     */
    isDirty(): boolean;
}
/**
 * Factory para criar VectorStore
 */
export declare function createVectorStore(storagePath: string, dimensions?: number): VectorStore;
//# sourceMappingURL=vector-store.d.ts.map