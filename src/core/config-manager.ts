/**
 * PAGIA - Configuration Manager
 * Gerenciamento de configurações do projeto
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { PAGIAConfig, ModuleConfig, AIProvider } from '../types/index.js';

const CONFIG_FILE = 'config.yaml';
const DEFAULT_PAGIA_FOLDER = '.pagia';

export class ConfigManager {
    private projectRoot: string;
    private pagiaFolder: string;
    private config: PAGIAConfig | null = null;

    constructor(projectRoot?: string) {
        this.projectRoot = projectRoot || process.cwd();
        this.pagiaFolder = join(this.projectRoot, DEFAULT_PAGIA_FOLDER);
    }

    /**
     * Initialize PAGIA configuration in the project
     */
    async initialize(options: Partial<PAGIAConfig> = {}): Promise<PAGIAConfig> {
        // Create PAGIA directory structure
        this.createDirectoryStructure();

        // Create default configuration
        const config = this.createDefaultConfig(options);

        // Save configuration
        await this.save(config);

        return config;
    }

    /**
     * Create the PAGIA directory structure
     */
    private createDirectoryStructure(): void {
        const directories = [
            this.pagiaFolder,
            join(this.pagiaFolder, '_cfg'),
            join(this.pagiaFolder, '_cfg', 'agents'),
            join(this.pagiaFolder, 'core'),
            join(this.pagiaFolder, 'core', 'agents'),
            join(this.pagiaFolder, 'core', 'tasks'),
            join(this.pagiaFolder, 'core', 'workflows'),
            join(this.pagiaFolder, 'modules'),
            join(this.pagiaFolder, 'plans'),
            join(this.pagiaFolder, 'plans', 'global'),
            join(this.pagiaFolder, 'plans', 'stages'),
            join(this.pagiaFolder, 'plans', 'prompts'),
            join(this.pagiaFolder, 'plans', 'ai'),
            join(this.pagiaFolder, '_cache'),
        ];

        for (const dir of directories) {
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
        }
    }

    /**
     * Create default PAGIA configuration
     */
    private createDefaultConfig(options: Partial<PAGIAConfig>): PAGIAConfig {
        const aiProvider: AIProvider = {
            type: options.aiProvider?.type || 'gemini',
            apiKey: options.aiProvider?.apiKey || process.env.GEMINI_API_KEY || '',
            model: options.aiProvider?.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
            temperature: options.aiProvider?.temperature || 0.7,
            maxTokens: options.aiProvider?.maxTokens || 8192,
        };

        return {
            projectRoot: this.projectRoot,
            pagiaFolder: DEFAULT_PAGIA_FOLDER,
            language: options.language || process.env.PAGIA_LANGUAGE || 'pt-BR',
            userName: options.userName || process.env.USER_NAME || 'Developer',
            debug: options.debug || process.env.PAGIA_DEBUG === 'true',
            aiProvider,
            modules: options.modules || this.getDefaultModules(),
        };
    }

    /**
     * Get default modules configuration
     */
    private getDefaultModules(): ModuleConfig[] {
        return [
            {
                code: 'core',
                name: 'Core',
                enabled: true,
                config: {},
            },
            {
                code: 'global-plan',
                name: 'Plano de Ação Global',
                enabled: true,
                config: {},
            },
            {
                code: 'stage-plan',
                name: 'Plano de Ação por Etapa',
                enabled: true,
                config: {},
            },
            {
                code: 'prompt-plan',
                name: 'Plano de Ação por Prompt',
                enabled: true,
                config: {},
            },
            {
                code: 'ai-plan',
                name: 'Plano de Ação Controlado pela IA',
                enabled: true,
                config: {},
            },
        ];
    }

    /**
     * Check if PAGIA is initialized in the project
     */
    isInitialized(): boolean {
        const configPath = join(this.pagiaFolder, '_cfg', CONFIG_FILE);
        return existsSync(configPath);
    }

    /**
     * Load configuration from file
     */
    load(): PAGIAConfig | null {
        if (this.config) {
            return this.config;
        }

        const configPath = join(this.pagiaFolder, '_cfg', CONFIG_FILE);

        if (!existsSync(configPath)) {
            return null;
        }

        try {
            const content = readFileSync(configPath, 'utf-8');
            this.config = parseYaml(content) as PAGIAConfig;

            // Resolve environment variables in apiKey
            if (this.config.aiProvider) {
                const apiKey = this.config.aiProvider.apiKey;

                // Check if apiKey is a placeholder or env variable reference
                if (!apiKey ||
                    apiKey.includes('your_') ||
                    apiKey.includes('_here') ||
                    apiKey.startsWith('${')) {

                    // Resolve from environment based on provider type
                    const envKey = this.config.aiProvider.type === 'openai'
                        ? process.env.OPENAI_API_KEY
                        : this.config.aiProvider.type === 'anthropic'
                            ? process.env.ANTHROPIC_API_KEY
                            : process.env.GEMINI_API_KEY;

                    this.config.aiProvider.apiKey = envKey || '';
                }
            }

            return this.config;
        } catch (error) {
            console.error('Error loading configuration:', error);
            return null;
        }
    }

    /**
     * Save configuration to file
     */
    async save(config: PAGIAConfig): Promise<void> {
        const configPath = join(this.pagiaFolder, '_cfg', CONFIG_FILE);

        // Ensure directory exists
        const configDir = join(this.pagiaFolder, '_cfg');
        if (!existsSync(configDir)) {
            mkdirSync(configDir, { recursive: true });
        }

        const content = stringifyYaml(config, {
            indent: 2,
            lineWidth: 120,
        });

        writeFileSync(configPath, content, 'utf-8');
        this.config = config;
    }

    /**
     * Update specific configuration values
     */
    async update(updates: Partial<PAGIAConfig>): Promise<PAGIAConfig> {
        const current = this.load();
        if (!current) {
            throw new Error('PAGIA not initialized. Run `pagia init` first.');
        }

        const updated = { ...current, ...updates };
        await this.save(updated);
        return updated;
    }

    /**
     * Get configuration value by path (dot notation)
     */
    get<T = unknown>(path: string): T | undefined {
        const config = this.load();
        if (!config) return undefined;

        return path.split('.').reduce((obj: any, key) => obj?.[key], config) as T;
    }

    /**
     * Set configuration value by path (dot notation)
     */
    async set(path: string, value: unknown): Promise<void> {
        const config = this.load();
        if (!config) {
            throw new Error('PAGIA not initialized. Run `pagia init` first.');
        }

        const keys = path.split('.');
        const lastKey = keys.pop()!;
        const target = keys.reduce((obj: any, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, config);

        target[lastKey] = value;
        await this.save(config);
    }

    /**
     * Get the PAGIA folder path
     */
    getPagiaFolder(): string {
        return this.pagiaFolder;
    }

    /**
     * Get the project root path
     */
    getProjectRoot(): string {
        return this.projectRoot;
    }

    /**
     * Resolve a path relative to the project root
     */
    resolvePath(relativePath: string): string {
        return resolve(this.projectRoot, relativePath);
    }

    /**
     * Resolve a path relative to the PAGIA folder
     */
    resolvePagiaPath(relativePath: string): string {
        return resolve(this.pagiaFolder, relativePath);
    }
}

// Singleton instance
let configManagerInstance: ConfigManager | null = null;

export function getConfigManager(projectRoot?: string): ConfigManager {
    if (!configManagerInstance || projectRoot) {
        configManagerInstance = new ConfigManager(projectRoot);
    }
    return configManagerInstance;
}
