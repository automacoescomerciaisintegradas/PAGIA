/**
 * PAGIA - Module Loader
 * Carregamento dinâmico de módulos
 *
 * @module core/module-loader
 * @author Automações Comerciais Integradas
 */
import type { ModuleManifest, ModuleConfig } from '../types/index.js';
interface LoadedModule {
    manifest: ModuleManifest;
    path: string;
    loaded: boolean;
    error?: string;
}
/**
 * Classe ModuleLoader - Carregamento dinâmico de módulos PAGIA
 */
export declare class ModuleLoader {
    private static instance;
    private modules;
    private modulesPath;
    private constructor();
    /**
     * Obtém a instância singleton do ModuleLoader
     */
    static getInstance(): ModuleLoader;
    /**
     * Define o caminho base para os módulos
     * @param path Caminho para a pasta de módulos
     */
    setModulesPath(path: string): void;
    /**
     * Descobre todos os módulos disponíveis
     * @param searchPaths Caminhos adicionais para buscar módulos
     */
    discover(searchPaths?: string[]): Promise<ModuleManifest[]>;
    /**
     * Carrega o manifesto de um módulo
     * @param modulePath Caminho para o módulo
     */
    private loadManifest;
    /**
     * Carrega um módulo pelo ID
     * @param moduleId ID do módulo
     */
    load(moduleId: string): Promise<LoadedModule | null>;
    /**
     * Carrega múltiplos módulos
     * @param moduleIds IDs dos módulos a carregar
     */
    loadMultiple(moduleIds: string[]): Promise<Map<string, LoadedModule | null>>;
    /**
     * Descarrega um módulo
     * @param moduleId ID do módulo
     */
    unload(moduleId: string): Promise<boolean>;
    /**
     * Verifica se um módulo está carregado
     * @param moduleId ID do módulo
     */
    isLoaded(moduleId: string): boolean;
    /**
     * Obtém um módulo carregado
     * @param moduleId ID do módulo
     */
    get(moduleId: string): LoadedModule | undefined;
    /**
     * Lista todos os módulos
     * @param onlyLoaded Se true, lista apenas módulos carregados
     */
    list(onlyLoaded?: boolean): LoadedModule[];
    /**
     * Obtém o grafo de dependências
     */
    getDependencyGraph(): Map<string, string[]>;
    /**
     * Valida se todas as dependências estão disponíveis
     * @param moduleId ID do módulo
     */
    validateDependencies(moduleId: string): {
        valid: boolean;
        missing: string[];
    };
    /**
     * Recarrega um módulo
     * @param moduleId ID do módulo
     */
    reload(moduleId: string): Promise<LoadedModule | null>;
    /**
     * Obtém configuração de um módulo
     * @param moduleId ID do módulo
     */
    getConfig(moduleId: string): ModuleConfig | null;
    /**
     * Limpa todos os módulos carregados
     */
    clear(): void;
}
export declare const moduleLoader: ModuleLoader;
export {};
//# sourceMappingURL=module-loader.d.ts.map