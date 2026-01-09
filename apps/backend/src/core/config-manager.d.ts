/**
 * PAGIA - Configuration Manager
 * Gerenciamento de configurações do projeto
 */
import type { PAGIAConfig } from '../types/index.js';
export declare class ConfigManager {
    private projectRoot;
    private pagiaFolder;
    private config;
    constructor(projectRoot?: string);
    /**
     * Initialize PAGIA configuration in the project
     */
    initialize(options?: Partial<PAGIAConfig>): Promise<PAGIAConfig>;
    /**
     * Create the PAGIA directory structure
     */
    private createDirectoryStructure;
    /**
     * Create default PAGIA configuration
     */
    private createDefaultConfig;
    /**
     * Get default modules configuration
     */
    private getDefaultModules;
    /**
     * Check if PAGIA is initialized in the project
     */
    isInitialized(): boolean;
    /**
     * Load configuration from file
     */
    load(): PAGIAConfig | null;
    /**
     * Save configuration to file
     */
    save(config: PAGIAConfig): Promise<void>;
    /**
     * Update specific configuration values
     */
    update(updates: Partial<PAGIAConfig>): Promise<PAGIAConfig>;
    /**
     * Get configuration value by path (dot notation)
     */
    get<T = unknown>(path: string): T | undefined;
    /**
     * Set configuration value by path (dot notation)
     */
    set(path: string, value: unknown): Promise<void>;
    /**
     * Get the PAGIA folder path
     */
    getPagiaFolder(): string;
    /**
     * Get the project root path
     */
    getProjectRoot(): string;
    /**
     * Resolve a path relative to the project root
     */
    resolvePath(relativePath: string): string;
    /**
     * Resolve a path relative to the PAGIA folder
     */
    resolvePagiaPath(relativePath: string): string;
}
export declare function getConfigManager(projectRoot?: string): ConfigManager;
//# sourceMappingURL=config-manager.d.ts.map