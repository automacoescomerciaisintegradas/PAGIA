/**
 * PAGIA - Embeddings Service
 * Serviço de geração de embeddings para busca semântica
 * 
 * @module knowledge/embeddings
 * @author Automações Comerciais Integradas
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
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
export class EmbeddingsService {
    private static instance: EmbeddingsService;
    private geminiClient?: GoogleGenerativeAI;
    private provider: AIProvider;
    private model: string;
    private cache: Map<string, number[]> = new Map();
    private cacheEnabled: boolean = true;

    private constructor(provider?: Partial<AIProvider>) {
        this.provider = {
            type: provider?.type || 'gemini',
            apiKey: provider?.apiKey || process.env.GEMINI_API_KEY || '',
            model: provider?.model || 'text-embedding-004',
        };
        this.model = this.provider.model;
        this.initializeClient();
    }

    /**
     * Obtém instância singleton
     */
    static getInstance(provider?: Partial<AIProvider>): EmbeddingsService {
        if (!EmbeddingsService.instance) {
            EmbeddingsService.instance = new EmbeddingsService(provider);
        }
        return EmbeddingsService.instance;
    }

    /**
     * Inicializa cliente
     */
    private initializeClient(): void {
        if (this.provider.type === 'gemini') {
            this.geminiClient = new GoogleGenerativeAI(this.provider.apiKey);
        }
    }

    /**
     * Gera embedding para um texto
     */
    async embed(text: string): Promise<number[]> {
        // Verificar cache
        if (this.cacheEnabled) {
            const cached = this.cache.get(text);
            if (cached) {
                return cached;
            }
        }

        const embedding = await this.generateEmbedding(text);

        // Salvar no cache
        if (this.cacheEnabled) {
            this.cache.set(text, embedding);
        }

        return embedding;
    }

    /**
     * Gera embeddings para múltiplos textos
     */
    async embedBatch(texts: string[]): Promise<number[][]> {
        const results: number[][] = [];

        // Processar em lotes de 100
        const batchSize = 100;

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map((text) => this.embed(text))
            );
            results.push(...batchResults);
        }

        return results;
    }

    /**
     * Gera embedding via provider configurado
     */
    private async generateEmbedding(text: string): Promise<number[]> {
        switch (this.provider.type) {
            case 'gemini':
                return this.embedGemini(text);
            case 'openai':
                return this.embedOpenAI(text);
            default:
                throw new Error(`Provider ${this.provider.type} não suporta embeddings`);
        }
    }

    /**
     * Gera embedding via Gemini
     */
    private async embedGemini(text: string): Promise<number[]> {
        if (!this.geminiClient) {
            throw new Error('Cliente Gemini não inicializado');
        }

        const model = this.geminiClient.getGenerativeModel({
            model: this.model,
        });

        const result = await model.embedContent(text);
        return result.embedding.values;
    }

    /**
     * Gera embedding via OpenAI
     */
    private async embedOpenAI(text: string): Promise<number[]> {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.provider.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model || 'text-embedding-3-small',
                input: text,
            }),
        });

        const data = await response.json() as {
            data?: Array<{ embedding: number[] }>;
            error?: { message: string };
        };

        if (data.error) {
            throw new Error(data.error.message);
        }

        return data.data?.[0]?.embedding || [];
    }

    /**
     * Calcula similaridade de cosseno entre dois vetores
     */
    cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            throw new Error('Vetores devem ter o mesmo tamanho');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (normA * normB);
    }

    /**
     * Calcula distância euclidiana entre dois vetores
     */
    euclideanDistance(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            throw new Error('Vetores devem ter o mesmo tamanho');
        }

        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            sum += Math.pow(a[i] - b[i], 2);
        }

        return Math.sqrt(sum);
    }

    /**
     * Encontra os K vetores mais similares
     */
    findMostSimilar(
        query: number[],
        vectors: Array<{ id: string; vector: number[] }>,
        k: number = 5,
        threshold: number = 0
    ): Array<{ id: string; similarity: number }> {
        const similarities = vectors.map((v) => ({
            id: v.id,
            similarity: this.cosineSimilarity(query, v.vector),
        }));

        return similarities
            .filter((s) => s.similarity >= threshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, k);
    }

    /**
     * Normaliza vetor para unit length
     */
    normalize(vector: number[]): number[] {
        const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));

        if (norm === 0) {
            return vector;
        }

        return vector.map((v) => v / norm);
    }

    /**
     * Calcula centróide de múltiplos vetores
     */
    centroid(vectors: number[][]): number[] {
        if (vectors.length === 0) {
            return [];
        }

        const dimensions = vectors[0].length;
        const result = new Array(dimensions).fill(0);

        for (const vector of vectors) {
            for (let i = 0; i < dimensions; i++) {
                result[i] += vector[i];
            }
        }

        return result.map((v) => v / vectors.length);
    }

    /**
     * Define modelo de embedding
     */
    setModel(model: string): void {
        this.model = model;
    }

    /**
     * Habilita/desabilita cache
     */
    setCacheEnabled(enabled: boolean): void {
        this.cacheEnabled = enabled;
    }

    /**
     * Limpa cache de embeddings
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Obtém tamanho do cache
     */
    getCacheSize(): number {
        return this.cache.size;
    }

    /**
     * Obtém dimensões do modelo atual
     */
    getDimensions(): number {
        // Dimensões conhecidas por modelo
        const dimensions: Record<string, number> = {
            'text-embedding-004': 768,
            'text-embedding-3-small': 1536,
            'text-embedding-3-large': 3072,
            'text-embedding-ada-002': 1536,
        };

        return dimensions[this.model] || 768;
    }
}

// Singleton exportado
export const embeddingsService = EmbeddingsService.getInstance();
