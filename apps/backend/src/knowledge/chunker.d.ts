/**
 * PAGIA - Document Chunker
 * Sistema de divisão de documentos para embeddings
 *
 * @module knowledge/chunker
 * @author Automações Comerciais Integradas
 */
export interface Chunk {
    id: string;
    content: string;
    startIndex: number;
    endIndex: number;
    metadata: ChunkMetadata;
}
export interface ChunkMetadata {
    source: string;
    chunkIndex: number;
    totalChunks: number;
    overlap: number;
    tokens?: number;
}
export interface ChunkOptions {
    chunkSize: number;
    overlap: number;
    splitBy: SplitStrategy;
    preserveHeaders: boolean;
    minChunkSize: number;
}
export type SplitStrategy = 'sentence' | 'paragraph' | 'line' | 'token' | 'semantic';
/**
 * Classe Chunker - Divisão inteligente de documentos
 */
export declare class Chunker {
    private options;
    constructor(options?: Partial<ChunkOptions>);
    /**
     * Divide texto em chunks
     */
    chunk(content: string, source?: string): Chunk[];
    /**
     * Divide arquivo em chunks
     */
    chunkFile(filePath: string): Promise<Chunk[]>;
    /**
     * Pré-processa o conteúdo
     */
    private preprocess;
    /**
     * Divide conteúdo em segmentos
     */
    private split;
    /**
     * Divide por sentenças
     */
    private splitBySentence;
    /**
     * Divide por parágrafos
     */
    private splitByParagraph;
    /**
     * Divide por linhas
     */
    private splitByLine;
    /**
     * Divisão semântica (baseada em estrutura)
     */
    private splitSemantic;
    /**
     * Agrupa segmentos em chunks respeitando limites
     */
    private groupIntoChunks;
    /**
     * Obtém texto para overlap
     */
    private getOverlapText;
    /**
     * Processa markdown
     */
    private processMarkdown;
    /**
     * Processa JSON
     */
    private processJSON;
    /**
     * Achata objeto para texto
     */
    private flattenObject;
    /**
     * Processa código
     */
    private processCode;
    /**
     * Estima número de tokens
     */
    private estimateTokens;
    /**
     * Atualiza opções
     */
    setOptions(options: Partial<ChunkOptions>): void;
    /**
     * Obtém opções atuais
     */
    getOptions(): ChunkOptions;
}
export declare const chunker: Chunker;
//# sourceMappingURL=chunker.d.ts.map