/**
 * PAGIA - Global Configuration Manager
 * Gerencia configurações globais do usuário (AppData/Roaming/PAGIA)
 * Seguindo padrão de CLIs como Claude Code, Cursor e Windsurf
 * 
 * @author Automações Comerciais Integradas
 * @version 1.0.0
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
    getGlobalConfigDir,
    getGlobalSettingsPath,
    getGlobalInstructionsPath,
    getUserSettingsDir,
    ensureGlobalDirectories,
    getGlobalDirectoryStructure,
    getLogsDir,
} from './paths.js';

/**
 * Global settings structure following VS Code fork patterns
 */
export interface GlobalSettings {
    // User info
    user: {
        name: string;
        email?: string;
    };

    // Editor preferences
    editor: {
        theme: 'light' | 'dark' | 'auto';
        language: string;
        fontSize: number;
    };

    // AI configuration
    ai: {
        defaultProvider: string;
        defaultModel: string;
        temperature: number;
        maxTokens: number;
        streamResponses: boolean;
    };

    // Telemetry and analytics
    telemetry: {
        enabled: boolean;
        crashReports: boolean;
    };

    // Agent defaults
    agents: {
        defaultTimeout: number;
        autoSave: boolean;
        showThinking: boolean;
    };

    // MCP configuration
    mcp: {
        autoConnect: boolean;
        servers: Record<string, MCPServerConfig>;
    };

    // Extension preferences
    extensions: {
        autoUpdate: boolean;
        checkForUpdates: boolean;
    };

    // Recent workspaces
    recentWorkspaces: string[];

    // Custom settings
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
 * Default global settings
 */
function getDefaultGlobalSettings(): GlobalSettings {
    return {
        user: {
            name: process.env.USER || process.env.USERNAME || 'Developer',
        },
        editor: {
            theme: 'auto',
            language: 'pt-BR',
            fontSize: 14,
        },
        ai: {
            defaultProvider: 'gemini',
            defaultModel: 'gemini-2.0-flash-exp',
            temperature: 0.7,
            maxTokens: 8192,
            streamResponses: true,
        },
        telemetry: {
            enabled: false,
            crashReports: false,
        },
        agents: {
            defaultTimeout: 300000, // 5 minutes
            autoSave: true,
            showThinking: true,
        },
        mcp: {
            autoConnect: true,
            servers: {},
        },
        extensions: {
            autoUpdate: true,
            checkForUpdates: true,
        },
        recentWorkspaces: [],
    };
}

/**
 * Global Configuration Manager
 * Singleton that manages user-wide settings in AppData/Roaming/PAGIA
 */
export class GlobalConfigManager {
    private static instance: GlobalConfigManager | null = null;
    private settings: GlobalSettings | null = null;
    private initialized: boolean = false;

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get singleton instance
     */
    static getInstance(): GlobalConfigManager {
        if (!GlobalConfigManager.instance) {
            GlobalConfigManager.instance = new GlobalConfigManager();
        }
        return GlobalConfigManager.instance;
    }

    /**
     * Initialize global configuration
     * Creates directory structure if it doesn't exist
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        // Ensure all global directories exist
        ensureGlobalDirectories();

        // Create default settings if not exists
        const settingsPath = getGlobalSettingsPath();
        if (!existsSync(settingsPath)) {
            await this.createDefaultSettings();
        }

        // Create default PAGIA.md if not exists
        const instructionsPath = getGlobalInstructionsPath();
        if (!existsSync(instructionsPath)) {
            await this.createDefaultInstructions();
        }

        // Load settings
        this.settings = this.loadSettings();
        this.initialized = true;
    }

    /**
     * Check if global config is initialized
     */
    isInitialized(): boolean {
        return existsSync(getGlobalConfigDir());
    }

    /**
     * Get the global config directory path
     */
    getConfigDir(): string {
        return getGlobalConfigDir();
    }

    /**
     * Get the global directory structure
     */
    getDirectoryStructure() {
        return getGlobalDirectoryStructure();
    }

    /**
     * Load settings from file
     */
    loadSettings(): GlobalSettings {
        const settingsPath = getGlobalSettingsPath();

        if (!existsSync(settingsPath)) {
            return getDefaultGlobalSettings();
        }

        try {
            const content = readFileSync(settingsPath, 'utf-8');
            const loaded = JSON.parse(content) as Partial<GlobalSettings>;

            // Merge with defaults to ensure all fields exist
            return this.mergeWithDefaults(loaded);
        } catch (error) {
            console.error('Error loading global settings:', error);
            return getDefaultGlobalSettings();
        }
    }

    /**
     * Save settings to file
     */
    async saveSettings(settings: GlobalSettings): Promise<void> {
        const settingsPath = getGlobalSettingsPath();
        const userDir = getUserSettingsDir();

        if (!existsSync(userDir)) {
            mkdirSync(userDir, { recursive: true });
        }

        const content = JSON.stringify(settings, null, 2);
        writeFileSync(settingsPath, content, 'utf-8');
        this.settings = settings;
    }

    /**
     * Get current settings
     */
    getSettings(): GlobalSettings {
        if (!this.settings) {
            this.settings = this.loadSettings();
        }
        return this.settings;
    }

    /**
     * Update specific settings
     */
    async updateSettings(updates: Partial<GlobalSettings>): Promise<GlobalSettings> {
        const current = this.getSettings();
        const updated = this.deepMerge(current, updates) as GlobalSettings;
        await this.saveSettings(updated);
        return updated;
    }

    /**
     * Get a specific setting by path (dot notation)
     */
    get<T = unknown>(path: string): T | undefined {
        const settings = this.getSettings();
        return path.split('.').reduce((obj: any, key) => obj?.[key], settings) as T;
    }

    /**
     * Set a specific setting by path (dot notation)
     */
    async set(path: string, value: unknown): Promise<void> {
        const settings = this.getSettings();
        const keys = path.split('.');
        const lastKey = keys.pop()!;
        const target = keys.reduce((obj: any, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, settings);

        target[lastKey] = value;
        await this.saveSettings(settings);
    }

    /**
     * Add a workspace to recent list
     */
    async addRecentWorkspace(workspacePath: string): Promise<void> {
        const settings = this.getSettings();

        // Remove if already exists
        settings.recentWorkspaces = settings.recentWorkspaces.filter(w => w !== workspacePath);

        // Add to beginning
        settings.recentWorkspaces.unshift(workspacePath);

        // Keep only last 20
        settings.recentWorkspaces = settings.recentWorkspaces.slice(0, 20);

        await this.saveSettings(settings);
    }

    /**
     * Get global instructions (PAGIA.md content)
     */
    getGlobalInstructions(): string {
        const instructionsPath = getGlobalInstructionsPath();

        if (!existsSync(instructionsPath)) {
            return '';
        }

        try {
            return readFileSync(instructionsPath, 'utf-8');
        } catch {
            return '';
        }
    }

    /**
     * Save global instructions
     */
    async saveGlobalInstructions(content: string): Promise<void> {
        const instructionsPath = getGlobalInstructionsPath();
        writeFileSync(instructionsPath, content, 'utf-8');
    }

    /**
     * Create default settings file
     */
    private async createDefaultSettings(): Promise<void> {
        const settings = getDefaultGlobalSettings();
        await this.saveSettings(settings);
    }

    /**
     * Create default PAGIA.md instructions file
     */
    private async createDefaultInstructions(): Promise<void> {
        const content = `# PAGIA - Instruções Globais

Este arquivo contém instruções globais que serão aplicadas em todos os projetos.
Edite este arquivo para personalizar o comportamento do PAGIA.

## Preferências de Código

- Linguagem preferida: TypeScript/JavaScript
- Framework preferido: Node.js
- Estilo de código: Clean Code com comentários

## Convenções de Nomenclatura

- Funções: camelCase
- Classes: PascalCase
- Constantes: UPPER_SNAKE_CASE
- Arquivos: kebab-case

## Instruções Personalizadas

Adicione suas instruções personalizadas abaixo:

---

<!-- Suas instruções customizadas aqui -->
`;
        await this.saveGlobalInstructions(content);
    }

    /**
     * Merge loaded settings with defaults
     */
    private mergeWithDefaults(loaded: Partial<GlobalSettings>): GlobalSettings {
        const defaults = getDefaultGlobalSettings();
        return this.deepMerge(defaults, loaded) as GlobalSettings;
    }

    /**
     * Deep merge two objects
     */
    private deepMerge(target: any, source: any): any {
        const result = { ...target };

        for (const key in source) {
            if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    /**
     * Get logs directory
     */
    getLogsDir(): string {
        return getLogsDir();
    }

    /**
     * Write to a log file
     */
    appendToLog(logName: string, message: string): void {
        const logsDir = this.getLogsDir();

        if (!existsSync(logsDir)) {
            mkdirSync(logsDir, { recursive: true });
        }

        const logPath = join(logsDir, `${logName}.log`);
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] ${message}\n`;

        try {
            const existingContent = existsSync(logPath) ? readFileSync(logPath, 'utf-8') : '';
            writeFileSync(logPath, existingContent + logLine, 'utf-8');
        } catch (error) {
            // Silently fail for logging
        }
    }
}

// Export singleton getter
export function getGlobalConfig(): GlobalConfigManager {
    return GlobalConfigManager.getInstance();
}
