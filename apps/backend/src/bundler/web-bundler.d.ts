/**
 * PAGIA - Web Bundler
 * Sistema de empacotamento de agentes para uso web
 *
 * @module bundler/web-bundler
 * @author Automações Comerciais Integradas
 */
import { BaseAgent } from '../agents/base-agent.js';
export type BundlePlatform = 'chatgpt' | 'claude' | 'gemini' | 'generic';
export interface Bundle {
    id: string;
    name: string;
    platform: BundlePlatform;
    agents: AgentBundle[];
    content: string;
    metadata: BundleMetadata;
    createdAt: Date;
}
export interface AgentBundle {
    id: string;
    name: string;
    role: string;
    content: string;
}
export interface BundleMetadata {
    version: string;
    author: string;
    description: string;
    tags: string[];
    tokenEstimate: number;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    tokenCount: number;
}
export interface BundleOptions {
    name?: string;
    version?: string;
    author?: string;
    description?: string;
    includeInstructions?: boolean;
    includeMenu?: boolean;
    format?: 'markdown' | 'xml' | 'yaml';
    maxTokens?: number;
}
/**
 * Classe WebBundler - Empacotamento de agentes
 */
export declare class WebBundler {
    private static instance;
    private templates;
    private templatesPath;
    private constructor();
    /**
     * Obtém instância singleton
     */
    static getInstance(): WebBundler;
    /**
     * Registra templates padrão embutidos
     */
    private registerDefaultTemplates;
    /**
     * Carrega template de arquivo
     */
    loadTemplate(platform: string, filePath: string): void;
    /**
     * Empacota agentes para uma plataforma
     */
    bundle(agents: BaseAgent[], platform: BundlePlatform, options?: BundleOptions): Promise<Bundle>;
    /**
     * Empacota agentes por IDs
     */
    bundleByIds(agentIds: string[], platform: BundlePlatform, options?: BundleOptions): Promise<Bundle>;
    /**
     * Formata conteúdo de um agente
     */
    private formatAgentContent;
    /**
     * Valida um bundle
     */
    validate(bundle: Bundle): ValidationResult;
    /**
     * Exporta bundle para arquivo
     */
    export(bundle: Bundle, outputPath: string): Promise<void>;
    /**
     * Exporta bundle com metadados (JSON)
     */
    exportWithMetadata(bundle: Bundle, outputPath: string): Promise<void>;
    /**
     * Carrega bundle de arquivo JSON
     */
    load(filePath: string): Bundle;
    /**
     * Estima número de tokens
     */
    private estimateTokens;
    /**
     * Obtém limite de tokens para plataforma
     */
    getTokenLimit(platform: BundlePlatform): number;
    /**
     * Lista plataformas suportadas
     */
    getSupportedPlatforms(): BundlePlatform[];
    /**
     * Define caminho de templates
     */
    setTemplatesPath(path: string): void;
    /**
     * Carrega todos os templates de um diretório
     */
    loadTemplatesFromDir(dirPath: string): void;
}
export declare const webBundler: WebBundler;
//# sourceMappingURL=web-bundler.d.ts.map