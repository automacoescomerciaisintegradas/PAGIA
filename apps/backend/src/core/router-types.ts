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
    [modelName: string]: (string | [string, TransformerOptions])[] | { use: (string | [string, TransformerOptions])[] };
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

    // Rate limiting
    rateLimit?: {
        requestsPerMinute?: number;
        tokensPerMinute?: number;
    };

    // Timeout
    timeout?: number;
}

/**
 * Router configuration - determines which model to use for different scenarios
 */
export interface RouterConfig {
    // Default model for general tasks
    default: {
        provider: string;
        model: string;
    };

    // Model for background tasks (can be smaller/cheaper)
    background?: {
        provider: string;
        model: string;
    };

    // Model for reasoning/thinking tasks (Planning Mode)
    think?: {
        provider: string;
        model: string;
    };

    // Model for long context handling (> 60K tokens)
    longContext?: {
        provider: string;
        model: string;
    };

    // Threshold for triggering long context model
    longContextThreshold?: number;

    // Model for web search tasks
    webSearch?: {
        provider: string;
        model: string;
    };

    // Model for image-related tasks
    image?: {
        provider: string;
        model: string;
    };

    // Model for code generation
    code?: {
        provider: string;
        model: string;
    };

    // Model for embeddings
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

    // Global settings
    settings: {
        apiTimeout?: number;
        disableTelemetry?: boolean;
        disableCostWarnings?: boolean;
        proxyUrl?: string;
        logLevel?: 'debug' | 'info' | 'warn' | 'error';
    };

    // Custom router path
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

    // Configuration (with sanitized API keys)
    config: RouterSystemConfig;

    // Input schema for dynamic configuration
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
export type BuiltinTransformer =
    | 'anthropic'
    | 'deepseek'
    | 'gemini'
    | 'openai'
    | 'openrouter'
    | 'groq'
    | 'mistral'
    | 'ollama'
    | 'azure'
    | 'maxtoken'
    | 'tooluse'
    | 'reasoning'
    | 'sampling'
    | 'enhancetool'
    | 'cleancache';

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
export function getDefaultRouterConfig(): RouterSystemConfig {
    return {
        version: '1.0.0',
        providers: [],
        router: {
            default: {
                provider: 'gemini',
                model: 'gemini-2.0-flash-exp',
            },
        },
        settings: {
            apiTimeout: 120000,
            disableTelemetry: true,
            disableCostWarnings: false,
            logLevel: 'info',
        },
    };
}
