/**
 * PAGIA - CLI Configuration Reader
 * Leitor do arquivo .pagia/config.yml
 *
 * @author Automações Comerciais Integradas
 */
export interface PAGIACLIConfig {
    version: string;
    base_install: boolean;
    ai_provider: {
        default: string;
        fallback: string;
        timeout: number;
        max_retries: number;
    };
    claude_code_commands: boolean;
    use_claude_code_subagents: boolean;
    standards_as_claude_code_skills: boolean;
    pagia_commands: boolean;
    commands_folder: string;
    agents: {
        folder: string;
        enabled: string[];
        composition_strategy: 'pipeline' | 'parallel' | 'voting';
        execution_mode: 'interactive' | 'autonomous';
    };
    plans: {
        folder: string;
        types: string[];
        auto_sync: boolean;
        export_format: 'yaml' | 'json' | 'markdown';
    };
    knowledge: {
        folder: string;
        supported_types: string[];
        auto_index: boolean;
        embedding_model: string;
    };
    mcp: {
        enabled: boolean;
        port: number;
        tools: string[];
        ide_configs: string[];
    };
    tdd: {
        enabled: boolean;
        test_framework: string;
        test_command: string;
        min_coverage: number;
    };
    llm_gateway: {
        enabled: boolean;
        port: number;
        local_llm_url: string;
        providers: string[];
    };
    interface: {
        theme: 'light' | 'dark' | 'auto';
        language: string;
        show_banner: boolean;
        show_tips: boolean;
        debug: boolean;
    };
    profile: string;
    profiles: Record<string, ProfileConfig>;
}
export interface ProfileConfig {
    ai_provider?: string;
    agents?: string[];
    execution_mode?: 'interactive' | 'autonomous';
    tdd?: {
        enabled?: boolean;
        min_coverage?: number;
    };
}
declare const DEFAULT_CONFIG: PAGIACLIConfig;
declare class CLIConfigReader {
    private config;
    private configPath;
    constructor(projectRoot?: string);
    /**
     * Load configuration from .pagia/config.yml
     */
    load(): PAGIACLIConfig;
    /**
     * Get a specific config value
     */
    get<T>(path: string): T | undefined;
    /**
     * Get the active profile configuration
     */
    getActiveProfile(): ProfileConfig;
    /**
     * Get the default AI provider
     */
    getDefaultProvider(): string;
    /**
     * Get enabled agents
     */
    getEnabledAgents(): string[];
    /**
     * Get execution mode
     */
    getExecutionMode(): 'interactive' | 'autonomous';
    /**
     * Check if a feature is enabled
     */
    isEnabled(feature: 'mcp' | 'tdd' | 'llm_gateway' | 'claude_code_commands' | 'pagia_commands'): boolean;
    /**
     * Get LLM Gateway config
     */
    getLLMGatewayConfig(): {
        port: number;
        localUrl: string;
        providers: string[];
    };
    /**
     * Get MCP config
     */
    getMCPConfig(): {
        port: number;
        tools: string[];
    };
    /**
     * Get interface config
     */
    getInterfaceConfig(): {
        theme: string;
        language: string;
        showBanner: boolean;
        showTips: boolean;
        debug: boolean;
    };
    /**
     * Merge parsed config with defaults
     */
    private mergeWithDefaults;
    /**
     * Reload configuration from file
     */
    reload(): PAGIACLIConfig;
}
export declare function getCLIConfig(projectRoot?: string): CLIConfigReader;
export { CLIConfigReader, DEFAULT_CONFIG };
//# sourceMappingURL=cli-config.d.ts.map