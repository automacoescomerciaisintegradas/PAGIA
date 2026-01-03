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
export class VectorStore {
    private documents: Map<string, VectorDocument> = new Map();
    private storagePath: string;
    private dimensions: number;
    private autoSave: boolean;
    private dirty: boolean = false;

    constructor(storagePath: string, dimensions: number = 768) {
        this.storagePath = storagePath;
        this.dimensions = dimensions;
        this.autoSave = true;

        this.load();
    }

    /**
     * Carrega documentos do disco
     */
    private load(): void {
        const filePath = this.getFilePath();

        if (!existsSync(filePath)) {
            return;
        }

        try {
            const content = readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content) as { documents: VectorDocument[] };

            for (const doc of data.documents) {
                this.documents.set(doc.id, {
                    ...doc,
                    createdAt: new Date(doc.createdAt),
                });
            }
        } catch (error) {
            console.error('Erro ao carregar vector store:', error);
        }
    }

    /**
     * Salva documentos no disco
     */
    async save(): Promise<void> {
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
    private getFilePath(): string {
        return join(this.storagePath, 'vectors.json');
    }

    /**
     * Insere um documento no store
     */
    async insert(
        id: string,
        content: string,
        vector?: number[],
        metadata: Record<string, unknown> = {}
    ): Promise<void> {
        // Gerar embedding se não fornecido
        const embedding = vector || await embeddingsService.embed(content);

        // Validar dimensões
        if (embedding.length !== this.dimensions) {
            throw new Error(`Dimensões incompatíveis: esperado ${this.dimensions}, recebido ${embedding.length}`);
        }

        const document: VectorDocument = {
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
    async insertBatch(
        documents: Array<{ id: string; content: string; metadata?: Record<string, unknown> }>
    ): Promise<void> {
        const contents = documents.map((d) => d.content);
        const embeddings = await embeddingsService.embedBatch(contents);

        for (let i = 0; i < documents.length; i++) {
            const doc = documents[i];
            const embedding = embeddings[i];

            const vectorDoc: VectorDocument = {
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
    async search(query: string, k: number = 5, threshold: number = 0): Promise<VectorSearchResult[]> {
        if (this.documents.size === 0) {
            return [];
        }

        // Gerar embedding da query
        const queryEmbedding = await embeddingsService.embed(query);

        // Calcular similaridades
        const results: VectorSearchResult[] = [];

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
    searchByVector(vector: number[], k: number = 5, threshold: number = 0): VectorSearchResult[] {
        const results: VectorSearchResult[] = [];

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
    async update(id: string, updates: { content?: string; metadata?: Record<string, unknown> }): Promise<boolean> {
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
    async delete(id: string): Promise<boolean> {
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
    get(id: string): VectorDocument | undefined {
        return this.documents.get(id);
    }

    /**
     * Verifica se documento existe
     */
    has(id: string): boolean {
        return this.documents.has(id);
    }

    /**
     * Lista todos os IDs
     */
    listIds(): string[] {
        return Array.from(this.documents.keys());
    }

    /**
     * Lista todos os documentos
     */
    listAll(): VectorDocument[] {
        return Array.from(this.documents.values());
    }

    /**
     * Número de documentos
     */
    count(): number {
        return this.documents.size;
    }

    /**
     * Limpa todos os documentos
     */
    async clear(): Promise<void> {
        this.documents.clear();
        this.dirty = true;

        if (this.autoSave) {
            await this.save();
        }
    }

    /**
     * Obtém estatísticas
     */
    getStats(): VectorStoreStats {
        const documents = Array.from(this.documents.values());
        const lastDoc = documents.sort((a, b) =>
            b.createdAt.getTime() - a.createdAt.getTime()
        )[0];

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
    filterByMetadata(filter: Record<string, unknown>): VectorDocument[] {
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
    setAutoSave(enabled: boolean): void {
        this.autoSave = enabled;
    }

    /**
     * Verifica se há mudanças não salvas
     */
    isDirty(): boolean {
        return this.dirty;
    }
}

/**
 * Factory para criar VectorStore
 */
export function createVectorStore(storagePath: string, dimensions?: number): VectorStore {
    return new VectorStore(storagePath, dimensions);
}
