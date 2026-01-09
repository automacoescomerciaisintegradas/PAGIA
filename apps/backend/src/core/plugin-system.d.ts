/**
 * PAGIA - Plugin System
 * Sistema de plugins extensível
 *
 * @module core/plugin-system
 * @author Automações Comerciais Integradas
 */
export interface PluginCommand {
    name: string;
    description: string;
    handler: string;
}
export interface PluginAgent {
    name: string;
    file: string;
}
export interface PluginHook {
    event: 'SessionStart' | 'SessionEnd' | 'PreToolUse' | 'PostToolUse' | 'PreAgentRun' | 'PostAgentRun' | 'OnError';
    handler: string;
}
export interface PluginManifest {
    name: string;
    version: string;
    description: string;
    author: string;
    commands?: PluginCommand[];
    agents?: PluginAgent[];
    hooks?: PluginHook[];
    skills?: string[];
    dependencies?: string[];
}
export interface LoadedPlugin {
    manifest: PluginManifest;
    path: string;
    enabled: boolean;
}
/**
 * Plugin Manager - Gerenciador de plugins PAGIA
 */
export declare class PluginManager {
    private static instance;
    private plugins;
    private pluginsDir;
    private globalPluginsDir;
    private constructor();
    static getInstance(): PluginManager;
    private ensurePluginDirs;
    /**
     * Carrega todos os plugins
     */
    loadAll(): Promise<void>;
    /**
     * Carrega plugins de um diretório
     */
    private loadPluginsFromDir;
    /**
     * Lista todos os plugins carregados
     */
    list(): LoadedPlugin[];
    /**
     * Obtém um plugin pelo nome
     */
    get(name: string): LoadedPlugin | undefined;
    /**
     * Instala um plugin
     */
    install(source: string): Promise<void>;
    /**
     * Instala um plugin via Git
     */
    private installFromGit;
    /**
     * Instala um plugin localmente
     */
    private installFromLocal;
    /**
     * Instala um plugin via npm
     */
    private installFromNpm;
    /**
     * Remove um plugin
     */
    remove(name: string): Promise<boolean>;
    /**
     * Cria um novo plugin
     */
    create(name: string, options?: Partial<PluginManifest>): Promise<string>;
    /**
     * Obtém todos os comandos de todos os plugins
     */
    getAllCommands(): Array<{
        plugin: string;
        command: PluginCommand;
    }>;
    /**
     * Obtém todos os agentes de todos os plugins
     */
    getAllAgents(): Array<{
        plugin: string;
        agent: PluginAgent;
        path: string;
    }>;
    /**
     * Obtém todos os hooks de um tipo específico
     */
    getHooks(event: PluginHook['event']): Array<{
        plugin: string;
        hook: PluginHook;
        path: string;
    }>;
    /**
     * Executa hooks de um evento
     */
    executeHooks(event: PluginHook['event'], context: any): Promise<void>;
}
export declare const pluginManager: PluginManager;
//# sourceMappingURL=plugin-system.d.ts.map