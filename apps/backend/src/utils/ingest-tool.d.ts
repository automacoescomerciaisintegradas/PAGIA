/**
 * PAGIA - Ingest Tool Integration
 * Integração com a ferramenta CLI ingest para parsing de código
 *
 * @see https://github.com/sammcj/ingest
 * @module utils/ingest-tool
 * @author Automações Comerciais Integradas
 */
/**
 * Opções para o comando ingest
 */
export interface IngestOptions {
    /** Diretório ou arquivo a processar */
    path: string;
    /** Padrões glob para incluir */
    include?: string[];
    /** Padrões glob para excluir */
    exclude?: string[];
    /** Incluir diff do git */
    gitDiff?: boolean;
    /** Incluir log do git */
    gitLog?: boolean;
    /** Comprimir código usando Tree-sitter */
    compress?: boolean;
    /** Arquivo de saída */
    output?: string;
    /** Processar URLs web */
    web?: boolean;
    /** Domínios permitidos para crawling */
    webDomains?: string[];
    /** Profundidade do crawling */
    webDepth?: number;
    /** Saída em JSON */
    json?: boolean;
}
/**
 * Resultado do comando ingest
 */
export interface IngestResult {
    success: boolean;
    content?: string;
    tokens?: number;
    error?: string;
    outputPath?: string;
}
/**
 * Estatísticas de VRAM
 */
export interface VRAMStats {
    model: string;
    estimatedVRAM?: string;
    maxContext?: number;
    fitsInMemory?: boolean;
}
/**
 * Classe IngestTool - Wrapper para o CLI ingest
 */
export declare class IngestTool {
    private static instance;
    private ingestPath;
    private isAvailable;
    private cacheDir;
    private constructor();
    /**
     * Obtém instância singleton
     */
    static getInstance(): IngestTool;
    /**
     * Inicializa e verifica disponibilidade do ingest
     */
    initialize(): Promise<boolean>;
    /**
     * Verifica se o ingest está disponível
     */
    checkAvailability(): boolean;
    /**
     * Executa o comando ingest
     */
    run(options: IngestOptions): Promise<IngestResult>;
    /**
     * Constrói argumentos do comando
     */
    private buildArgs;
    /**
     * Processa um diretório de código
     */
    processDirectory(dirPath: string, options?: Partial<IngestOptions>): Promise<IngestResult>;
    /**
     * Processa código e retorna conteúdo otimizado para LLM
     */
    processForLLM(path: string, options?: {
        compress?: boolean;
        maxTokens?: number;
        includePatterns?: string[];
        excludePatterns?: string[];
    }): Promise<IngestResult>;
    /**
     * Processa uma URL ou website
     */
    processURL(url: string, options?: {
        depth?: number;
        domains?: string[];
    }): Promise<IngestResult>;
    /**
     * Estima uso de VRAM para o conteúdo gerado
     */
    estimateVRAM(path: string, model: string, options?: {
        memory?: number;
        quant?: string;
        context?: number;
    }): Promise<VRAMStats>;
    /**
     * Salva resultado em cache
     */
    saveToCache(key: string, content: string): Promise<string>;
    /**
     * Carrega do cache
     */
    loadFromCache(key: string): Promise<string | null>;
    /**
     * Gera contexto para agentes PAGIA
     */
    generateAgentContext(projectPath: string, agentType: 'code' | 'docs' | 'test' | 'review'): Promise<IngestResult>;
}
export declare const ingestTool: IngestTool;
/**
 * Função auxiliar para processar código rapidamente
 */
export declare function ingestCode(path: string): Promise<string | null>;
/**
 * Função auxiliar para processar URL
 */
export declare function ingestURL(url: string, depth?: number): Promise<string | null>;
//# sourceMappingURL=ingest-tool.d.ts.map