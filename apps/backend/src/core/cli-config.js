/**
 * PAGIA - CLI Configuration Reader
 * Leitor do arquivo .pagia/config.yml
 *
 * @author Automações Comerciais Integradas
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
// ═══════════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ═══════════════════════════════════════════════════════════════
const DEFAULT_CONFIG = {
    version: '1.0.0',
    base_install: true,
    ai_provider: {
        default: 'groq',
        fallback: 'gemini',
        timeout: 60,
        max_retries: 3,
    },
    claude_code_commands: true,
    use_claude_code_subagents: true,
    standards_as_claude_code_skills: false,
    pagia_commands: true,
    commands_folder: '.pagia/commands',
    agents: {
        folder: '.pagia/agents',
        enabled: ['analyst', 'architect', 'coder', 'tester', 'planner', 'conductor'],
        composition_strategy: 'pipeline',
        execution_mode: 'interactive',
    },
    plans: {
        folder: '.pagia/plans',
        types: ['global', 'stages', 'prompts', 'ai'],
        auto_sync: true,
        export_format: 'yaml',
    },
    knowledge: {
        folder: '.pagia/knowledge',
        supported_types: ['markdown', 'typescript', 'javascript', 'python', 'yaml', 'json'],
        auto_index: true,
        embedding_model: 'text-embedding-3-small',
    },
    mcp: {
        enabled: true,
        port: 3100,
        tools: ['read_plan', 'update_plan', 'list_agents', 'run_agent', 'search_knowledge'],
        ide_configs: ['cursor', 'vscode', 'claude'],
    },
    tdd: {
        enabled: true,
        test_framework: 'vitest',
        test_command: 'npm test',
        min_coverage: 80,
    },
    llm_gateway: {
        enabled: true,
        port: 3000,
        local_llm_url: 'http://localhost:8080',
        providers: ['local', 'openai', 'gemini', 'anthropic', 'groq', 'deepseek'],
    },
    interface: {
        theme: 'auto',
        language: 'pt-BR',
        show_banner: true,
        show_tips: true,
        debug: false,
    },
    profile: 'default',
    profiles: {
        default: {
            ai_provider: 'groq',
            agents: ['analyst', 'coder'],
            execution_mode: 'interactive',
        },
    },
};
// ═══════════════════════════════════════════════════════════════
// CLI CONFIG READER
// ═══════════════════════════════════════════════════════════════
class CLIConfigReader {
    config = null;
    configPath;
    constructor(projectRoot) {
        const root = projectRoot || process.cwd();
        this.configPath = join(root, '.pagia', 'config.yml');
    }
    /**
     * Load configuration from .pagia/config.yml
     */
    load() {
        if (this.config) {
            return this.config;
        }
        // Check for config.yml first, then config.yaml
        let configFile = this.configPath;
        if (!existsSync(configFile)) {
            configFile = configFile.replace('.yml', '.yaml');
        }
        if (!existsSync(configFile)) {
            // Return default config if no file exists
            this.config = { ...DEFAULT_CONFIG };
            return this.config;
        }
        try {
            const content = readFileSync(configFile, 'utf-8');
            const parsed = parseYaml(content);
            // Merge with defaults
            this.config = this.mergeWithDefaults(parsed);
            return this.config;
        }
        catch (error) {
            console.warn(`Warning: Could not parse config file: ${error}`);
            this.config = { ...DEFAULT_CONFIG };
            return this.config;
        }
    }
    /**
     * Get a specific config value
     */
    get(path) {
        const config = this.load();
        const parts = path.split('.');
        let current = config;
        for (const part of parts) {
            if (current === undefined || current === null) {
                return undefined;
            }
            current = current[part];
        }
        return current;
    }
    /**
     * Get the active profile configuration
     */
    getActiveProfile() {
        const config = this.load();
        const profileName = config.profile || 'default';
        return config.profiles[profileName] || config.profiles.default || {};
    }
    /**
     * Get the default AI provider
     */
    getDefaultProvider() {
        const profile = this.getActiveProfile();
        return profile.ai_provider || this.get('ai_provider.default') || 'groq';
    }
    /**
     * Get enabled agents
     */
    getEnabledAgents() {
        const profile = this.getActiveProfile();
        return profile.agents || this.get('agents.enabled') || ['analyst', 'coder'];
    }
    /**
     * Get execution mode
     */
    getExecutionMode() {
        const profile = this.getActiveProfile();
        return profile.execution_mode || this.get('agents.execution_mode') || 'interactive';
    }
    /**
     * Check if a feature is enabled
     */
    isEnabled(feature) {
        switch (feature) {
            case 'mcp':
                return this.get('mcp.enabled') ?? true;
            case 'tdd':
                return this.get('tdd.enabled') ?? true;
            case 'llm_gateway':
                return this.get('llm_gateway.enabled') ?? true;
            case 'claude_code_commands':
                return this.get('claude_code_commands') ?? true;
            case 'pagia_commands':
                return this.get('pagia_commands') ?? true;
            default:
                return false;
        }
    }
    /**
     * Get LLM Gateway config
     */
    getLLMGatewayConfig() {
        return {
            port: this.get('llm_gateway.port') || 3000,
            localUrl: this.get('llm_gateway.local_llm_url') || 'http://localhost:8080',
            providers: this.get('llm_gateway.providers') || ['local'],
        };
    }
    /**
     * Get MCP config
     */
    getMCPConfig() {
        return {
            port: this.get('mcp.port') || 3100,
            tools: this.get('mcp.tools') || [],
        };
    }
    /**
     * Get interface config
     */
    getInterfaceConfig() {
        return {
            theme: this.get('interface.theme') || 'auto',
            language: this.get('interface.language') || 'pt-BR',
            showBanner: this.get('interface.show_banner') ?? true,
            showTips: this.get('interface.show_tips') ?? true,
            debug: this.get('interface.debug') ?? false,
        };
    }
    /**
     * Merge parsed config with defaults
     */
    mergeWithDefaults(parsed) {
        return {
            ...DEFAULT_CONFIG,
            ...parsed,
            ai_provider: { ...DEFAULT_CONFIG.ai_provider, ...parsed.ai_provider },
            agents: { ...DEFAULT_CONFIG.agents, ...parsed.agents },
            plans: { ...DEFAULT_CONFIG.plans, ...parsed.plans },
            knowledge: { ...DEFAULT_CONFIG.knowledge, ...parsed.knowledge },
            mcp: { ...DEFAULT_CONFIG.mcp, ...parsed.mcp },
            tdd: { ...DEFAULT_CONFIG.tdd, ...parsed.tdd },
            llm_gateway: { ...DEFAULT_CONFIG.llm_gateway, ...parsed.llm_gateway },
            interface: { ...DEFAULT_CONFIG.interface, ...parsed.interface },
            profiles: { ...DEFAULT_CONFIG.profiles, ...parsed.profiles },
        };
    }
    /**
     * Reload configuration from file
     */
    reload() {
        this.config = null;
        return this.load();
    }
}
// ═══════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════
let instance = null;
export function getCLIConfig(projectRoot) {
    if (!instance) {
        instance = new CLIConfigReader(projectRoot);
    }
    return instance;
}
export { CLIConfigReader, DEFAULT_CONFIG };
//# sourceMappingURL=cli-config.js.map