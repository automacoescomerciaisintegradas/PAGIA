/**
 * PAGIA - Router Configuration Types
 * Sistema de roteamento de modelos estilo claude-code-router
 *
 * @author Automações Comerciais Integradas
 * @version 1.0.0
 */
/**
 * Transformer options for request/response adaptation
 */
export interface TransformerOptions {
    max_tokens?: number;
    provider?: {
        only?: string[];
        order?: string[];
    };
    project?: string;
    [key: string]: unknown;
}
/**
 * Transformer configuration
 */
export interface TransformerConfig {
    use: (string | [string, TransformerOptions])[];
    [modelName: string]: (string | [string, TransformerOptions])[] | {
        use: (string | [string, TransformerOptions])[];
    };
}
/**
 * Provider configuration
 */
export interface ProviderConfig {
    name: string;
    api_base_url: string;
    api_key: string;
    models: string[];
    transformer?: TransformerConfig;
    enabled?: boolean;
    priority?: number;
    description?: string;
    rateLimit?: {
        requestsPerMinute?: number;
        tokensPerMinute?: number;
    };
    timeout?: number;
}
/**
 * Router configuration - determines which model to use for different scenarios
 */
export interface RouterConfig {
    default: {
        provider: string;
        model: string;
    };
    background?: {
        provider: string;
        model: string;
    };
    think?: {
        provider: string;
        model: string;
    };
    longContext?: {
        provider: string;
        model: string;
    };
    longContextThreshold?: number;
    webSearch?: {
        provider: string;
        model: string;
    };
    image?: {
        provider: string;
        model: string;
    };
    code?: {
        provider: string;
        model: string;
    };
    embeddings?: {
        provider: string;
        model: string;
    };
}
/**
 * Custom transformer definition
 */
export interface CustomTransformer {
    path: string;
    options?: Record<string, unknown>;
}
/**
 * Full router configuration
 */
export interface RouterSystemConfig {
    version: string;
    providers: ProviderConfig[];
    router: RouterConfig;
    transformers?: CustomTransformer[];
    settings: {
        apiTimeout?: number;
        disableTelemetry?: boolean;
        disableCostWarnings?: boolean;
        proxyUrl?: string;
        logLevel?: 'debug' | 'info' | 'warn' | 'error';
    };
    customRouterPath?: string;
}
/**
 * Preset manifest structure
 */
export interface PresetManifest {
    name: string;
    version: string;
    description?: string;
    author?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    config: RouterSystemConfig;
    inputs?: PresetInput[];
}
/**
 * Preset input for dynamic configuration
 */
export interface PresetInput {
    name: string;
    description: string;
    type: 'string' | 'password' | 'select' | 'boolean' | 'number';
    required: boolean;
    default?: unknown;
    options?: string[];
    placeholder?: string;
}
/**
 * Built-in transformer types
 */
export type BuiltinTransformer = 'anthropic' | 'deepseek' | 'gemini' | 'openai' | 'openrouter' | 'groq' | 'mistral' | 'ollama' | 'azure' | 'maxtoken' | 'tooluse' | 'reasoning' | 'sampling' | 'enhancetool' | 'cleancache';
/**
 * Model routing request
 */
export interface RoutingRequest {
    messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string | unknown[];
    }>;
    tokenCount?: number;
    taskType?: 'default' | 'background' | 'think' | 'longContext' | 'webSearch' | 'image' | 'code';
    metadata?: Record<string, unknown>;
}
/**
 * Model routing result
 */
export interface RoutingResult {
    provider: string;
    model: string;
    apiBaseUrl: string;
    apiKey: string;
    transformer?: TransformerConfig;
    reason: string;
}
/**
 * Default router configuration
 */
export declare function getDefaultRouterConfig(): RouterSystemConfig;
//# sourceMappingURL=router-types.d.ts.map