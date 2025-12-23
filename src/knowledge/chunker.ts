/**
 * PAGIA - Document Chunker
 * Sistema de divisão de documentos para embeddings
 * 
 * @module knowledge/chunker
 * @author Automações Comerciais Integradas
 */

import { readFileSync } from 'fs';
import { extname } from 'path';

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
    chunkSize: number;        // Tamanho máximo em caracteres
    overlap: number;          // Sobreposição entre chunks
    splitBy: SplitStrategy;   // Estratégia de divisão
    preserveHeaders: boolean; // Manter cabeçalhos em cada chunk
    minChunkSize: number;     // Tamanho mínimo para criar chunk
}

export type SplitStrategy = 'sentence' | 'paragraph' | 'line' | 'token' | 'semantic';

const DEFAULT_OPTIONS: ChunkOptions = {
    chunkSize: 1000,
    overlap: 200,
    splitBy: 'paragraph',
    preserveHeaders: true,
    minChunkSize: 100,
};

/**
 * Classe Chunker - Divisão inteligente de documentos
 */
export class Chunker {
    private options: ChunkOptions;

    constructor(options: Partial<ChunkOptions> = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Divide texto em chunks
     */
    chunk(content: string, source: string = 'unknown'): Chunk[] {
        const chunks: Chunk[] = [];

        // Pré-processar
        const cleanContent = this.preprocess(content);

        // Dividir com base na estratégia
        const segments = this.split(cleanContent);

        // Agrupar em chunks respeitando tamanho
        const groupedChunks = this.groupIntoChunks(segments);

        // Criar chunks com metadata
        for (let i = 0; i < groupedChunks.length; i++) {
            const chunkContent = groupedChunks[i].content;
            const startIndex = groupedChunks[i].startIndex;

            chunks.push({
                id: `${source}-chunk-${i}`,
                content: chunkContent,
                startIndex,
                endIndex: startIndex + chunkContent.length,
                metadata: {
                    source,
                    chunkIndex: i,
                    totalChunks: groupedChunks.length,
                    overlap: i > 0 ? this.options.overlap : 0,
                    tokens: this.estimateTokens(chunkContent),
                },
            });
        }

        return chunks;
    }

    /**
     * Divide arquivo em chunks
     */
    async chunkFile(filePath: string): Promise<Chunk[]> {
        const content = readFileSync(filePath, 'utf-8');
        const ext = extname(filePath).toLowerCase();

        // Processar baseado no tipo de arquivo
        let processedContent: string;

        switch (ext) {
            case '.md':
            case '.markdown':
                processedContent = this.processMarkdown(content);
                break;
            case '.json':
                processedContent = this.processJSON(content);
                break;
            case '.yaml':
            case '.yml':
                processedContent = content; // YAML já é legível
                break;
            case '.ts':
            case '.js':
            case '.py':
                processedContent = this.processCode(content);
                break;
            default:
                processedContent = content;
        }

        return this.chunk(processedContent, filePath);
    }

    /**
     * Pré-processa o conteúdo
     */
    private preprocess(content: string): string {
        return content
            .replace(/\r\n/g, '\n')        // Normalizar quebras de linha
            .replace(/\t/g, '  ')          // Tabs para espaços
            .replace(/\n{3,}/g, '\n\n')    // Múltiplas quebras para dupla
            .trim();
    }

    /**
     * Divide conteúdo em segmentos
     */
    private split(content: string): string[] {
        switch (this.options.splitBy) {
            case 'sentence':
                return this.splitBySentence(content);
            case 'paragraph':
                return this.splitByParagraph(content);
            case 'line':
                return this.splitByLine(content);
            case 'semantic':
                return this.splitSemantic(content);
            default:
                return this.splitByParagraph(content);
        }
    }

    /**
     * Divide por sentenças
     */
    private splitBySentence(content: string): string[] {
        // Regex para detectar fim de sentença
        const sentencePattern = /[^.!?]*[.!?]+/g;
        const matches = content.match(sentencePattern);

        if (!matches) {
            return [content];
        }

        return matches.map((s) => s.trim()).filter((s) => s.length > 0);
    }

    /**
     * Divide por parágrafos
     */
    private splitByParagraph(content: string): string[] {
        return content
            .split(/\n\n+/)
            .map((p) => p.trim())
            .filter((p) => p.length > 0);
    }

    /**
     * Divide por linhas
     */
    private splitByLine(content: string): string[] {
        return content
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
    }

    /**
     * Divisão semântica (baseada em estrutura)
     */
    private splitSemantic(content: string): string[] {
        const segments: string[] = [];
        const lines = content.split('\n');
        let currentSegment = '';

        for (const line of lines) {
            // Detectar cabeçalhos markdown
            if (line.match(/^#{1,6}\s/)) {
                if (currentSegment.trim()) {
                    segments.push(currentSegment.trim());
                }
                currentSegment = line + '\n';
                continue;
            }

            // Detectar listas
            if (line.match(/^[\s]*[-*+]\s/) || line.match(/^[\s]*\d+\.\s/)) {
                currentSegment += line + '\n';
                continue;
            }

            // Detectar blocos de código
            if (line.match(/^```/)) {
                currentSegment += line + '\n';
                continue;
            }

            // Linha vazia indica possível fim de seção
            if (line.trim() === '') {
                if (currentSegment.trim()) {
                    segments.push(currentSegment.trim());
                    currentSegment = '';
                }
                continue;
            }

            currentSegment += line + '\n';
        }

        // Adicionar último segmento
        if (currentSegment.trim()) {
            segments.push(currentSegment.trim());
        }

        return segments;
    }

    /**
     * Agrupa segmentos em chunks respeitando limites
     */
    private groupIntoChunks(segments: string[]): Array<{ content: string; startIndex: number }> {
        const chunks: Array<{ content: string; startIndex: number }> = [];
        let currentChunk = '';
        let currentStartIndex = 0;
        let overlapBuffer = '';
        let globalIndex = 0;

        for (const segment of segments) {
            const segmentWithSpace = currentChunk ? '\n\n' + segment : segment;

            // Se adicionar este segmento excede o tamanho
            if (currentChunk.length + segmentWithSpace.length > this.options.chunkSize) {
                // Salvar chunk atual se atende mínimo
                if (currentChunk.length >= this.options.minChunkSize) {
                    chunks.push({
                        content: currentChunk,
                        startIndex: currentStartIndex,
                    });

                    // Calcular overlap para próximo chunk
                    overlapBuffer = this.getOverlapText(currentChunk);
                    currentStartIndex = globalIndex - overlapBuffer.length;
                }

                // Iniciar novo chunk com overlap
                currentChunk = overlapBuffer + (overlapBuffer ? '\n\n' : '') + segment;
            } else {
                currentChunk += segmentWithSpace;
            }

            globalIndex += segment.length + 2; // +2 para \n\n
        }

        // Adicionar último chunk
        if (currentChunk.length >= this.options.minChunkSize) {
            chunks.push({
                content: currentChunk,
                startIndex: currentStartIndex,
            });
        }

        return chunks;
    }

    /**
     * Obtém texto para overlap
     */
    private getOverlapText(content: string): string {
        if (this.options.overlap === 0) {
            return '';
        }

        const lastPart = content.slice(-this.options.overlap);

        // Tentar cortar em uma fronteira natural (sentença, parágrafo)
        const lastSentence = lastPart.match(/[.!?]\s+[^.!?]*$/);
        if (lastSentence) {
            return lastPart.slice(lastSentence.index! + 2);
        }

        return lastPart;
    }

    /**
     * Processa markdown
     */
    private processMarkdown(content: string): string {
        // Remover elementos não textuais mas preservar estrutura
        return content
            .replace(/!\[.*?\]\(.*?\)/g, '')           // Imagens
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // Links -> texto
            .replace(/`{3}[\s\S]*?`{3}/g, (match) => { // Blocos de código
                const language = match.match(/^```(\w+)/)?.[1] || '';
                return `[Código ${language}]`;
            });
    }

    /**
     * Processa JSON
     */
    private processJSON(content: string): string {
        try {
            const obj = JSON.parse(content);
            return this.flattenObject(obj);
        } catch {
            return content;
        }
    }

    /**
     * Achata objeto para texto
     */
    private flattenObject(obj: unknown, prefix: string = ''): string {
        const lines: string[] = [];

        if (typeof obj !== 'object' || obj === null) {
            return `${prefix}: ${String(obj)}`;
        }

        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                lines.push(this.flattenObject(item, `${prefix}[${index}]`));
            });
        } else {
            for (const [key, value] of Object.entries(obj)) {
                const newPrefix = prefix ? `${prefix}.${key}` : key;
                lines.push(this.flattenObject(value, newPrefix));
            }
        }

        return lines.join('\n');
    }

    /**
     * Processa código
     */
    private processCode(content: string): string {
        // Remover comentários muito longos, preservar estrutura
        const lines = content.split('\n');
        const processedLines: string[] = [];
        let inBlockComment = false;

        for (const line of lines) {
            if (line.includes('/*')) inBlockComment = true;
            if (line.includes('*/')) {
                inBlockComment = false;
                continue;
            }

            if (!inBlockComment && !line.trim().startsWith('//')) {
                processedLines.push(line);
            }
        }

        return processedLines.join('\n');
    }

    /**
     * Estima número de tokens
     */
    private estimateTokens(content: string): number {
        // Estimativa: ~4 caracteres por token
        return Math.ceil(content.length / 4);
    }

    /**
     * Atualiza opções
     */
    setOptions(options: Partial<ChunkOptions>): void {
        this.options = { ...this.options, ...options };
    }

    /**
     * Obtém opções atuais
     */
    getOptions(): ChunkOptions {
        return { ...this.options };
    }
}

// Instância padrão
export const chunker = new Chunker();
