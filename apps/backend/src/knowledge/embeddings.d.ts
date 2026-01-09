/**
 * PAGIA - Embeddings Service
 * Serviço de geração de embeddings para busca semântica
 *
 * @module knowledge/embeddings
 * @author Automações Comerciais Integradas
 */
import type { AIProvider } from '../types/index.js';
export interface EmbeddingResult {
    embedding: number[];
    model: string;
    dimensions: number;
}
export interface EmbeddingBatchResult {
    embeddings: number[][];
    model: string;
    dimensions: number;
}
/**
 * Classe EmbeddingsService - Geração de embeddings para RAG
 */
export declare class EmbeddingsService {
    private static instance;
    private geminiClient?;
    private provider;
    private model;
    private cache;
    private cacheEnabled;
    private constructor();
    /**
     * Obtém instância singleton
     */
    static getInstance(provider?: Partial<AIProvider>): EmbeddingsService;
    /**
     * Inicializa cliente
     */
    private initializeClient;
    /**
     * Gera embedding para um texto
     */
    embed(text: string): Promise<number[]>;
    /**
     * Gera embeddings para múltiplos textos
     */
    embedBatch(texts: string[]): Promise<number[][]>;
    /**
     * Gera embedding via provider configurado
     */
    private generateEmbedding;
    /**
     * Gera embedding via Gemini
     */
    private embedGemini;
    /**
     * Gera embedding via OpenAI
     */
    private embedOpenAI;
    /**
     * Calcula similaridade de cosseno entre dois vetores
     */
    cosineSimilarity(a: number[], b: number[]): number;
    /**
     * Calcula distância euclidiana entre dois vetores
     */
    euclideanDistance(a: number[], b: number[]): number;
    /**
     * Encontra os K vetores mais similares
     */
    findMostSimilar(query: number[], vectors: Array<{
        id: string;
        vector: number[];
    }>, k?: number, threshold?: number): Array<{
        id: string;
        similarity: number;
    }>;
    /**
     * Normaliza vetor para unit length
     */
    normalize(vector: number[]): number[];
    /**
     * Calcula centróide de múltiplos vetores
     */
    centroid(vectors: number[][]): number[];
    /**
     * Define modelo de embedding
     */
    setModel(model: string): void;
    /**
     * Habilita/desabilita cache
     */
    setCacheEnabled(enabled: boolean): void;
    /**
     * Limpa cache de embeddings
     */
    clearCache(): void;
    /**
     * Obtém tamanho do cache
     */
    getCacheSize(): number;
    /**
     * Obtém dimensões do modelo atual
     */
    getDimensions(): number;
}
export declare const embeddingsService: EmbeddingsService;
//# sourceMappingURL=embeddings.d.ts.map