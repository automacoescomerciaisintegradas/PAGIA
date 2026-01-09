/**
 * PAGIA - Router Manager
 * Gerenciador de roteamento de modelos estilo claude-code-router
 *
 * @author Automações Comerciais Integradas
 * @version 1.0.0
 */
import type { RouterSystemConfig, ProviderConfig, RouterConfig, RoutingRequest, RoutingResult, PresetManifest } from './router-types.js';
/**
 * Router Manager - Manages model routing configuration
 */
export declare class RouterManager {
    private static instance;
    private config;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): RouterManager;
    /**
     * Initialize router configuration
     */
    initialize(): Promise<void>;
    /**
     * Create default router configuration
     */
    private createDefaultConfig;
    /**
     * Create provider configuration from provider name
     */
    private createProviderConfig;
    /**
     * Load router configuration
     */
    loadConfig(): RouterSystemConfig;
    /**
     * Save router configuration
     */
    saveConfig(config: RouterSystemConfig): Promise<void>;
    /**
     * Get current configuration
     */
    getConfig(): RouterSystemConfig;
    /**
     * Get all providers
     */
    getProviders(): ProviderConfig[];
    /**
     * Get a specific provider
     */
    getProvider(name: string): ProviderConfig | undefined;
    /**
     * Add a new provider
     */
    addProvider(provider: ProviderConfig): Promise<void>;
    /**
     * Remove a provider
     */
    removeProvider(name: string): Promise<boolean>;
    /**
     * Add a model to a provider
     */
    addModel(providerName: string, model: string): Promise<boolean>;
    /**
     * Remove a model from a provider
     */
    removeModel(providerName: string, model: string): Promise<boolean>;
    /**
     * Get router configuration
     */
    getRouter(): RouterConfig;
    /**
     * Set router for a specific type
     */
    setRouter(type: keyof RouterConfig, provider: string, model: string): Promise<void>;
    /**
     * Route a request to the appropriate model
     */
    route(request: RoutingRequest): Promise<RoutingResult>;
    /**
     * Export current configuration as a preset
     */
    exportPreset(name: string, options?: {
        description?: string;
        author?: string;
        tags?: string[];
    }): Promise<string>;
    /**
     * List all installed presets
     */
    listPresets(): string[];
    /**
     * Get preset information
     */
    getPreset(name: string): PresetManifest | null;
    /**
     * Install a preset
     */
    installPreset(presetPath: string, inputs: Record<string, string>): Promise<void>;
    /**
     * Delete a preset
     */
    deletePreset(name: string): boolean;
    /**
     * Generate activation script for shell
     */
    getActivationScript(shell?: 'bash' | 'powershell' | 'cmd'): string;
    /**
     * Get environment variables as object
     */
    getEnvironmentVariables(): Record<string, string>;
}
export declare function getRouterManager(): RouterManager;
//# sourceMappingURL=router-manager.d.ts.map