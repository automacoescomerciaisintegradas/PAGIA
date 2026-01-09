/**
 * PAGIA - Global Configuration Manager
 * Gerencia configurações globais do usuário (AppData/Roaming/PAGIA)
 * Seguindo padrão de CLIs como Claude Code, Cursor e Windsurf
 *
 * @author Automações Comerciais Integradas
 * @version 1.0.0
 */
/**
 * Global settings structure following VS Code fork patterns
 */
export interface GlobalSettings {
    user: {
        name: string;
        email?: string;
    };
    editor: {
        theme: 'light' | 'dark' | 'auto';
        language: string;
        fontSize: number;
    };
    ai: {
        defaultProvider: string;
        defaultModel: string;
        temperature: number;
        maxTokens: number;
        streamResponses: boolean;
    };
    telemetry: {
        enabled: boolean;
        crashReports: boolean;
    };
    agents: {
        defaultTimeout: number;
        autoSave: boolean;
        showThinking: boolean;
    };
    mcp: {
        autoConnect: boolean;
        servers: Record<string, MCPServerConfig>;
    };
    extensions: {
        autoUpdate: boolean;
        checkForUpdates: boolean;
    };
    recentWorkspaces: string[];
    custom?: Record<string, unknown>;
}
/**
 * MCP Server configuration
 */
export interface MCPServerConfig {
    command: string;
    args?: string[];
    env?: Record<string, string>;
    enabled?: boolean;
}
/**
 * Global Configuration Manager
 * Singleton that manages user-wide settings in AppData/Roaming/PAGIA
 */
export declare class GlobalConfigManager {
    private static instance;
    private settings;
    private initialized;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): GlobalConfigManager;
    /**
     * Initialize global configuration
     * Creates directory structure if it doesn't exist
     */
    initialize(): Promise<void>;
    /**
     * Check if global config is initialized
     */
    isInitialized(): boolean;
    /**
     * Get the global config directory path
     */
    getConfigDir(): string;
    /**
     * Get the global directory structure
     */
    getDirectoryStructure(): import("./paths.js").GlobalDirectoryStructure;
    /**
     * Load settings from file
     */
    loadSettings(): GlobalSettings;
    /**
     * Save settings to file
     */
    saveSettings(settings: GlobalSettings): Promise<void>;
    /**
     * Get current settings
     */
    getSettings(): GlobalSettings;
    /**
     * Update specific settings
     */
    updateSettings(updates: Partial<GlobalSettings>): Promise<GlobalSettings>;
    /**
     * Get a specific setting by path (dot notation)
     */
    get<T = unknown>(path: string): T | undefined;
    /**
     * Set a specific setting by path (dot notation)
     */
    set(path: string, value: unknown): Promise<void>;
    /**
     * Add a workspace to recent list
     */
    addRecentWorkspace(workspacePath: string): Promise<void>;
    /**
     * Get global instructions (PAGIA.md content)
     */
    getGlobalInstructions(): string;
    /**
     * Save global instructions
     */
    saveGlobalInstructions(content: string): Promise<void>;
    /**
     * Create default settings file
     */
    private createDefaultSettings;
    /**
     * Create default PAGIA.md instructions file
     */
    private createDefaultInstructions;
    /**
     * Merge loaded settings with defaults
     */
    private mergeWithDefaults;
    /**
     * Deep merge two objects
     */
    private deepMerge;
    /**
     * Get logs directory
     */
    getLogsDir(): string;
    /**
     * Write to a log file
     */
    appendToLog(logName: string, message: string): void;
}
export declare function getGlobalConfig(): GlobalConfigManager;
//# sourceMappingURL=global-config.d.ts.map