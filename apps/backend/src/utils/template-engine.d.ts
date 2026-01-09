/**
 * PAGIA - Template Engine
 * Motor de templates baseado em Handlebars
 *
 * @module utils/template-engine
 * @author Automações Comerciais Integradas
 */
import Handlebars from 'handlebars';
interface TemplateContext {
    [key: string]: unknown;
}
/**
 * Classe TemplateEngine - Motor de templates com Handlebars
 */
export declare class TemplateEngine {
    private static instance;
    private templates;
    private templatesPath;
    private constructor();
    /**
     * Obtém a instância singleton do TemplateEngine
     */
    static getInstance(): TemplateEngine;
    /**
     * Registra helpers personalizados do Handlebars
     */
    private registerHelpers;
    /**
     * Define o caminho base para templates
     */
    setTemplatesPath(path: string): void;
    /**
     * Carrega todos os templates de um diretório
     */
    loadTemplates(templatesDir?: string): void;
    /**
     * Carrega um template específico
     */
    loadTemplate(name: string, filePath: string): void;
    /**
     * Compila uma string de template
     */
    compile(source: string): Handlebars.TemplateDelegate;
    /**
     * Registra um template a partir de uma string
     */
    register(name: string, source: string): void;
    /**
     * Registra um partial
     */
    registerPartial(name: string, source: string): void;
    /**
     * Registra um helper customizado
     */
    registerHelper(name: string, helper: Handlebars.HelperDelegate): void;
    /**
     * Renderiza um template registrado
     */
    render(templateName: string, context?: TemplateContext): string;
    /**
     * Renderiza uma string de template
     */
    renderString(source: string, context?: TemplateContext): string;
    /**
     * Renderiza um arquivo de template
     */
    renderFile(filePath: string, context?: TemplateContext): string;
    /**
     * Renderiza e salva em arquivo
     */
    renderToFile(templateName: string, outputPath: string, context?: TemplateContext): void;
    /**
     * Verifica se um template está registrado
     */
    has(templateName: string): boolean;
    /**
     * Lista templates registrados
     */
    list(): string[];
    /**
     * Remove um template
     */
    remove(templateName: string): boolean;
    /**
     * Limpa todos os templates
     */
    clear(): void;
    /**
     * Recarrega um template
     */
    reload(templateName: string): void;
}
export declare const templateEngine: TemplateEngine;
export {};
//# sourceMappingURL=template-engine.d.ts.map