/**
 * PAGIA - Router Manager
 * Gerenciador de roteamento de modelos estilo claude-code-router
 *
 * @author Automações Comerciais Integradas
 * @version 1.0.0
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import { getGlobalConfigDir, getProjectDirectoryStructure, isInPagiaProject } from './paths.js';
import { getCredentialsManager } from './credentials.js';
/**
 * Get the router config file path
 */
function getRouterConfigPath() {
    // Priority 1: Project-local config in .pagia/router.json
    if (isInPagiaProject()) {
        const projectPath = getProjectDirectoryStructure(process.cwd()).router;
        if (existsSync(projectPath)) {
            return projectPath;
        }
        // Also check root .pagia/ (not in subfolders)
        const rootPagiaRouter = join(process.cwd(), '.pagia', 'router.json');
        if (existsSync(rootPagiaRouter))
            return rootPagiaRouter;
    }
    // Priority 2: Global config
    return join(getGlobalConfigDir(), 'router.json');
}
/**
 * Get the presets directory path
 */
function getPresetsDir() {
    return join(getGlobalConfigDir(), 'presets');
}
/**
 * Router Manager - Manages model routing configuration
 */
export class RouterManager {
    static instance = null;
    config = null;
    constructor() { }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!RouterManager.instance) {
            RouterManager.instance = new RouterManager();
        }
        return RouterManager.instance;
    }
    /**
     * Initialize router configuration
     */
    async initialize() {
        const configPath = getRouterConfigPath();
        if (!existsSync(configPath)) {
            await this.createDefaultConfig();
        }
        this.config = this.loadConfig();
        // Ensure presets directory exists
        const presetsDir = getPresetsDir();
        if (!existsSync(presetsDir)) {
            mkdirSync(presetsDir, { recursive: true });
        }
    }
    /**
     * Create default router configuration
     */
    async createDefaultConfig() {
        const credentials = getCredentialsManager();
        const providers = [];
        // Auto-configure providers from stored credentials
        const storedProviders = await credentials.listProviders();
        for (const providerName of storedProviders) {
            const credential = await credentials.get(providerName);
            if (credential) {
                const providerConfig = this.createProviderConfig(providerName, credential.apiKey);
                if (providerConfig) {
                    providers.push(providerConfig);
                }
            }
        }
        // Determine default provider
        const defaultProvider = providers.length > 0 ? providers[0].name : 'gemini';
        const defaultModel = providers.length > 0 ? providers[0].models[0] : 'gemini-2.0-flash-exp';
        const config = {
            version: '1.0.0',
            providers,
            router: {
                default: { provider: defaultProvider, model: defaultModel },
                background: providers.find(p => p.name === 'groq')
                    ? { provider: 'groq', model: 'llama3-8b-8192' }
                    : { provider: defaultProvider, model: defaultModel },
                think: providers.find(p => p.name === 'anthropic')
                    ? { provider: 'anthropic', model: 'claude-3-opus-20240229' }
                    : { provider: defaultProvider, model: defaultModel },
                longContext: providers.find(p => p.name === 'gemini')
                    ? { provider: 'gemini', model: 'gemini-1.5-pro' }
                    : { provider: defaultProvider, model: defaultModel },
                longContextThreshold: 60000,
                code: { provider: defaultProvider, model: defaultModel },
            },
            settings: {
                apiTimeout: 120000,
                disableTelemetry: true,
                disableCostWarnings: false,
                logLevel: 'info',
            },
        };
        await this.saveConfig(config);
    }
    /**
     * Create provider configuration from provider name
     */
    createProviderConfig(providerName, apiKey) {
        const providerConfigs = {
            gemini: {
                name: 'gemini',
                api_base_url: 'https://generativelanguage.googleapis.com/v1beta/chat/completions',
                models: [
                    'gemini-2.0-flash',
                    'gemini-2.0-flash-exp',
                    'gemini-2.0-flash-lite',
                    'gemini-1.5-flash',
                    'gemini-1.5-pro',
                ],
                transformer: { use: ['gemini'] },
                description: 'Google Gemini API',
            },
            openai: {
                name: 'openai',
                api_base_url: 'https://api.openai.com/v1/chat/completions',
                models: [
                    'gpt-4-turbo',
                    'gpt-4o',
                    'gpt-4o-mini',
                    'gpt-4',
                    'gpt-3.5-turbo',
                ],
                transformer: { use: ['openai'] },
                description: 'OpenAI API',
            },
            anthropic: {
                name: 'anthropic',
                api_base_url: 'https://api.anthropic.com/v1/messages',
                models: [
                    'claude-3-opus-20240229',
                    'claude-3-5-sonnet-20241022',
                    'claude-3-sonnet-20240229',
                    'claude-3-haiku-20240307',
                ],
                transformer: { use: ['anthropic'] },
                description: 'Anthropic Claude API',
            },
            groq: {
                name: 'groq',
                api_base_url: 'https://api.groq.com/openai/v1/chat/completions',
                models: [
                    'llama3-70b-8192',
                    'llama3-8b-8192',
                    'mixtral-8x7b-32768',
                    'gemma2-9b-it',
                ],
                transformer: { use: ['groq'] },
                description: 'Groq API (Fast inference)',
            },
            deepseek: {
                name: 'deepseek',
                api_base_url: 'https://api.deepseek.com/chat/completions',
                models: [
                    'deepseek-chat',
                    'deepseek-coder',
                    'deepseek-reasoner',
                ],
                transformer: { use: ['deepseek'] },
                description: 'DeepSeek API',
            },
            mistral: {
                name: 'mistral',
                api_base_url: 'https://api.mistral.ai/v1/chat/completions',
                models: [
                    'mistral-large-latest',
                    'mistral-medium-latest',
                    'mistral-small-latest',
                    'codestral-latest',
                ],
                transformer: { use: ['mistral'] },
                description: 'Mistral AI API',
            },
            openrouter: {
                name: 'openrouter',
                api_base_url: 'https://openrouter.ai/api/v1/chat/completions',
                models: [
                    'google/gemini-2.5-pro-preview',
                    'anthropic/claude-sonnet-4',
                    'anthropic/claude-3.5-sonnet',
                    'openai/gpt-4o',
                    'meta-llama/llama-3.1-405b-instruct',
                ],
                transformer: { use: ['openrouter'] },
                description: 'OpenRouter API (Multi-provider)',
            },
            ollama: {
                name: 'ollama',
                api_base_url: 'http://localhost:11434/api/chat',
                models: [
                    'llama3',
                    'codellama',
                    'mistral',
                    'phi3',
                ],
                transformer: { use: ['ollama'] },
                description: 'Ollama (Local models)',
            },
        };
        const baseConfig = providerConfigs[providerName];
        if (!baseConfig)
            return null;
        return {
            ...baseConfig,
            api_key: apiKey,
            enabled: true,
        };
    }
    /**
     * Load router configuration
     */
    loadConfig() {
        const configPath = getRouterConfigPath();
        if (!existsSync(configPath)) {
            return {
                version: '1.0.0',
                providers: [],
                router: {
                    default: { provider: 'gemini', model: 'gemini-2.0-flash-exp' },
                },
                settings: {
                    apiTimeout: 120000,
                    disableTelemetry: true,
                    logLevel: 'info',
                },
            };
        }
        try {
            const content = readFileSync(configPath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return {
                version: '1.0.0',
                providers: [],
                router: {
                    default: { provider: 'gemini', model: 'gemini-2.0-flash-exp' },
                },
                settings: {},
            };
        }
    }
    /**
     * Save router configuration
     */
    async saveConfig(config) {
        const configPath = getRouterConfigPath();
        const configDir = getGlobalConfigDir();
        if (!existsSync(configDir)) {
            mkdirSync(configDir, { recursive: true });
        }
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        this.config = config;
    }
    /**
     * Get current configuration
     */
    getConfig() {
        if (!this.config) {
            this.config = this.loadConfig();
        }
        return this.config;
    }
    /**
     * Get all providers
     */
    getProviders() {
        return this.getConfig().providers;
    }
    /**
     * Get a specific provider
     */
    getProvider(name) {
        return this.getProviders().find(p => p.name === name);
    }
    /**
     * Add a new provider
     */
    async addProvider(provider) {
        const config = this.getConfig();
        // Check if provider already exists
        const existingIndex = config.providers.findIndex(p => p.name === provider.name);
        if (existingIndex >= 0) {
            config.providers[existingIndex] = provider;
        }
        else {
            config.providers.push(provider);
        }
        await this.saveConfig(config);
    }
    /**
     * Remove a provider
     */
    async removeProvider(name) {
        const config = this.getConfig();
        const initialLength = config.providers.length;
        config.providers = config.providers.filter(p => p.name !== name);
        if (config.providers.length !== initialLength) {
            await this.saveConfig(config);
            return true;
        }
        return false;
    }
    /**
     * Add a model to a provider
     */
    async addModel(providerName, model) {
        const config = this.getConfig();
        const provider = config.providers.find(p => p.name === providerName);
        if (!provider)
            return false;
        if (!provider.models.includes(model)) {
            provider.models.push(model);
            await this.saveConfig(config);
        }
        return true;
    }
    /**
     * Remove a model from a provider
     */
    async removeModel(providerName, model) {
        const config = this.getConfig();
        const provider = config.providers.find(p => p.name === providerName);
        if (!provider)
            return false;
        const initialLength = provider.models.length;
        provider.models = provider.models.filter(m => m !== model);
        if (provider.models.length !== initialLength) {
            await this.saveConfig(config);
            return true;
        }
        return false;
    }
    /**
     * Get router configuration
     */
    getRouter() {
        return this.getConfig().router;
    }
    /**
     * Set router for a specific type
     */
    async setRouter(type, provider, model) {
        const config = this.getConfig();
        if (type === 'longContextThreshold') {
            config.router[type] = parseInt(model);
        }
        else {
            config.router[type] = { provider, model };
        }
        await this.saveConfig(config);
    }
    /**
     * Route a request to the appropriate model
     */
    async route(request) {
        const config = this.getConfig();
        const router = config.router;
        let routerEntry = router.default;
        let reason = 'Default routing';
        // Determine routing based on request
        if (request.taskType) {
            switch (request.taskType) {
                case 'background':
                    if (router.background) {
                        routerEntry = router.background;
                        reason = 'Background task routing';
                    }
                    break;
                case 'think':
                    if (router.think) {
                        routerEntry = router.think;
                        reason = 'Thinking/reasoning task routing';
                    }
                    break;
                case 'longContext':
                    if (router.longContext) {
                        routerEntry = router.longContext;
                        reason = 'Long context routing';
                    }
                    break;
                case 'webSearch':
                    if (router.webSearch) {
                        routerEntry = router.webSearch;
                        reason = 'Web search routing';
                    }
                    break;
                case 'image':
                    if (router.image) {
                        routerEntry = router.image;
                        reason = 'Image task routing';
                    }
                    break;
                case 'code':
                    if (router.code) {
                        routerEntry = router.code;
                        reason = 'Code generation routing';
                    }
                    break;
            }
        }
        // Check for long context threshold
        if (request.tokenCount && router.longContext) {
            const threshold = router.longContextThreshold || 60000;
            if (request.tokenCount > threshold) {
                routerEntry = router.longContext;
                reason = `Token count (${request.tokenCount}) exceeds threshold (${threshold})`;
            }
        }
        // Find the provider
        const provider = config.providers.find(p => p.name === routerEntry.provider);
        if (!provider) {
            throw new Error(`Provider not found: ${routerEntry.provider}`);
        }
        return {
            provider: provider.name,
            model: routerEntry.model,
            apiBaseUrl: provider.api_base_url,
            apiKey: provider.api_key,
            transformer: provider.transformer,
            reason,
        };
    }
    // ==================== PRESET MANAGEMENT ====================
    /**
     * Export current configuration as a preset
     */
    async exportPreset(name, options) {
        const config = this.getConfig();
        const presetsDir = getPresetsDir();
        const presetDir = join(presetsDir, name);
        if (!existsSync(presetDir)) {
            mkdirSync(presetDir, { recursive: true });
        }
        // Sanitize API keys
        const sanitizedConfig = {
            ...config,
            providers: config.providers.map(p => ({
                ...p,
                api_key: `{{${p.name.toUpperCase()}_API_KEY}}`,
            })),
        };
        const manifest = {
            name,
            version: config.version,
            description: options?.description || `PAGIA preset: ${name}`,
            author: options?.author,
            tags: options?.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            config: sanitizedConfig,
            inputs: config.providers.map(p => ({
                name: `${p.name.toUpperCase()}_API_KEY`,
                description: `API key for ${p.name}`,
                type: 'password',
                required: true,
                placeholder: `Enter your ${p.name} API key`,
            })),
        };
        const manifestPath = join(presetDir, 'manifest.json');
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
        return presetDir;
    }
    /**
     * List all installed presets
     */
    listPresets() {
        const presetsDir = getPresetsDir();
        if (!existsSync(presetsDir)) {
            return [];
        }
        return readdirSync(presetsDir).filter(name => {
            const manifestPath = join(presetsDir, name, 'manifest.json');
            return existsSync(manifestPath);
        });
    }
    /**
     * Get preset information
     */
    getPreset(name) {
        const manifestPath = join(getPresetsDir(), name, 'manifest.json');
        if (!existsSync(manifestPath)) {
            return null;
        }
        try {
            const content = readFileSync(manifestPath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    /**
     * Install a preset
     */
    async installPreset(presetPath, inputs) {
        const manifestPath = join(presetPath, 'manifest.json');
        if (!existsSync(manifestPath)) {
            throw new Error(`Preset manifest not found: ${manifestPath}`);
        }
        const content = readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(content);
        // Replace placeholders with actual values
        const config = manifest.config;
        config.providers = config.providers.map(p => {
            const keyName = `${p.name.toUpperCase()}_API_KEY`;
            return {
                ...p,
                api_key: inputs[keyName] || p.api_key,
            };
        });
        await this.saveConfig(config);
    }
    /**
     * Delete a preset
     */
    deletePreset(name) {
        const presetDir = join(getPresetsDir(), name);
        if (!existsSync(presetDir)) {
            return false;
        }
        rmSync(presetDir, { recursive: true, force: true });
        return true;
    }
    // ==================== ENVIRONMENT ACTIVATION ====================
    /**
     * Generate activation script for shell
     */
    getActivationScript(shell = 'bash') {
        const config = this.getConfig();
        const defaultRoute = config.router.default;
        const provider = config.providers.find(p => p.name === defaultRoute.provider);
        if (!provider) {
            throw new Error('Default provider not configured');
        }
        const envVars = {
            PAGIA_PROVIDER: defaultRoute.provider,
            PAGIA_MODEL: defaultRoute.model,
            PAGIA_API_KEY: provider.api_key,
            PAGIA_API_BASE_URL: provider.api_base_url,
            API_TIMEOUT_MS: String(config.settings.apiTimeout || 120000),
            DISABLE_TELEMETRY: config.settings.disableTelemetry ? 'true' : 'false',
        };
        // Add provider-specific env vars
        for (const p of config.providers) {
            const envKeyName = `${p.name.toUpperCase()}_API_KEY`;
            envVars[envKeyName] = p.api_key;
        }
        switch (shell) {
            case 'powershell':
                return Object.entries(envVars)
                    .map(([key, value]) => `$env:${key}="${value}"`)
                    .join('\n');
            case 'cmd':
                return Object.entries(envVars)
                    .map(([key, value]) => `set ${key}=${value}`)
                    .join('\n');
            default: // bash/zsh
                return Object.entries(envVars)
                    .map(([key, value]) => `export ${key}="${value}"`)
                    .join('\n');
        }
    }
    /**
     * Get environment variables as object
     */
    getEnvironmentVariables() {
        const config = this.getConfig();
        const defaultRoute = config.router.default;
        const provider = config.providers.find(p => p.name === defaultRoute.provider);
        const envVars = {
            PAGIA_PROVIDER: defaultRoute.provider,
            PAGIA_MODEL: defaultRoute.model,
        };
        if (provider) {
            envVars.PAGIA_API_KEY = provider.api_key;
            envVars.PAGIA_API_BASE_URL = provider.api_base_url;
        }
        // Add all provider API keys
        for (const p of config.providers) {
            const envKeyName = `${p.name.toUpperCase()}_API_KEY`;
            envVars[envKeyName] = p.api_key;
        }
        envVars.API_TIMEOUT_MS = String(config.settings.apiTimeout || 120000);
        envVars.DISABLE_TELEMETRY = config.settings.disableTelemetry ? 'true' : 'false';
        return envVars;
    }
}
// Export singleton getter
export function getRouterManager() {
    return RouterManager.getInstance();
}
//# sourceMappingURL=router-manager.js.map