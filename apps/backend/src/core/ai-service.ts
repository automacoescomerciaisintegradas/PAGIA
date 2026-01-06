/**
 * PAGIA - AI Provider Service
 * Integração com múltiplos provedores de IA
 * Suporta: Gemini, OpenAI, Anthropic, Groq, Ollama, DeepSeek, Mistral, OpenRouter
 * 
 * RECURSO: Fallback automático entre modelos quando quota/tokens acabam
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import type { AIProvider, AIProviderType } from '../types/index.js';
import { getRouterManager } from './router-manager.js';

export interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AIResponse {
    content: string;
    provider: AIProviderType;
    model: string;
    tokensUsed?: number;
    usedFallback?: boolean;
    originalModel?: string;
}

/**
 * Configuração específica por provedor
 */
export interface ProviderEndpoint {
    baseUrl: string;
    apiKeyEnv: string;
    modelEnv: string;
    defaultModel: string;
}

/**
 * Lista de modelos Gemini com fallback automático
 * Ordem: do mais preferido para o menos preferido (modelos disponíveis em 2026)
 */
export const GEMINI_FALLBACK_MODELS = [
    'gemini-2.0-flash',                  // Gemini 2.0 Flash (recomendado)
    'gemini-2.0-flash-exp',              // Gemini 2.0 Flash Experimental
    'gemini-2.0-flash-lite',             // Gemini 2.0 Flash Lite
    'gemini-1.5-flash',                  // Gemini 1.5 Flash (estável)
    'gemini-1.5-pro',                    // Gemini 1.5 Pro (estável)
];

/**
 * Lista de modelos OpenRouter com fallback automático
 */
export const OPENROUTER_FALLBACK_MODELS = [
    'anthropic/claude-sonnet-4',         // Claude Sonnet 4.5
    'anthropic/claude-sonnet-4:thinking', // Claude Sonnet 4.5 (Thinking)
    'anthropic/claude-opus-4:thinking',  // Claude Opus 4.5 (Thinking)
    'openai/gpt-4o',                     // GPT-4o
    'meta-llama/llama-3.1-405b-instruct', // GPT-OSS 120B equivalente
];

const PROVIDER_CONFIGS: Record<string, ProviderEndpoint> = {
    openai: {
        baseUrl: 'https://api.openai.com/v1',
        apiKeyEnv: 'OPENAI_API_KEY',
        modelEnv: 'OPENAI_MODEL',
        defaultModel: 'gpt-4o',
    },
    groq: {
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKeyEnv: 'GROQ_API_KEY',
        modelEnv: 'GROQ_MODEL',
        defaultModel: 'llama-3.3-70b-versatile',
    },
    deepseek: {
        baseUrl: 'https://api.deepseek.com/v1',
        apiKeyEnv: 'DEEPSEEK_API_KEY',
        modelEnv: 'DEEPSEEK_MODEL',
        defaultModel: 'deepseek-chat',
    },
    'deepseek-beta': {
        baseUrl: 'https://api.deepseek.com/beta',
        apiKeyEnv: 'DEEPSEEK_API_KEY',
        modelEnv: 'DEEPSEEK_MODEL',
        defaultModel: 'deepseek-coder',
    },
    mistral: {
        baseUrl: 'https://api.mistral.ai/v1',
        apiKeyEnv: 'MISTRAL_API_KEY',
        modelEnv: 'MISTRAL_MODEL',
        defaultModel: 'mistral-large-latest',
    },
    openrouter: {
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKeyEnv: 'OPENROUTER_API_KEY',
        modelEnv: 'OPENROUTER_MODEL',
        defaultModel: 'anthropic/claude-sonnet-4',
    },
    ollama: {
        baseUrl: process.env.OLLAMA_HOST || process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        apiKeyEnv: '',
        modelEnv: 'OLLAMA_MODEL',
        defaultModel: process.env.OLLAMA_MODEL || 'llama3.1:latest',
    },
    qwen: {
        baseUrl: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKeyEnv: 'QWEN_API_KEY',
        modelEnv: 'QWEN_MODEL',
        defaultModel: 'qwen-max',
    },
    coder: {
        baseUrl: process.env.CODER_BASE_URL || 'https://api.coder.com/v1',
        apiKeyEnv: 'CODER_API_KEY',
        modelEnv: 'CODER_MODEL',
        defaultModel: 'deepseek-coder-v2',
    },
    'claude-coder': {
        baseUrl: process.env.CLAUDE_CODER_BASE_URL || 'https://api.anthropic.com/v1',
        apiKeyEnv: 'ANTHROPIC_API_KEY',
        modelEnv: 'CLAUDE_CODER_MODEL',
        defaultModel: 'claude-3-5-sonnet-20241022',
    },
    nvidia: {
        baseUrl: 'https://integrate.api.nvidia.com/v1',
        apiKeyEnv: 'NVIDIA_API_KEY',
        modelEnv: 'NVIDIA_MODEL',
        defaultModel: 'nvidia/llama-3.1-nemotron-70b-instruct',
    },

};

export class AIService {
    private provider: AIProvider;
    private geminiClient?: GoogleGenerativeAI;
    private openaiCompatibleClient?: OpenAI;
    private fallbackEnabled: boolean = true;
    private currentFallbackIndex: number = 0;
    private originalModel: string;

    constructor(provider: AIProvider) {
        this.provider = provider;
        this.originalModel = provider.model;
        this.initializeClient();
    }

    /**
     * Habilita ou desabilita o fallback automático
     */
    setFallbackEnabled(enabled: boolean): void {
        this.fallbackEnabled = enabled;
    }

    private initializeClient(): void {
        switch (this.provider.type) {
            case 'gemini':
                this.geminiClient = new GoogleGenerativeAI(this.provider.apiKey);
                break;
            case 'openai':
            case 'groq':
            case 'deepseek':
            case 'deepseek-beta':
            case 'mistral':
            case 'openrouter':
            case 'qwen':
            case 'coder':
            case 'nvidia':
                this.initOpenAICompatibleClient();
                break;
            case 'ollama':
            case 'local':
                this.initOllamaClient();
                break;
            case 'anthropic':
            case 'claude-coder':
                // Anthropic uses fetch-based API
                break;
        }
    }

    /**
     * Inicializa cliente compatível com OpenAI API (Groq, DeepSeek, Mistral, OpenRouter)
     */
    private initOpenAICompatibleClient(): void {
        const config = PROVIDER_CONFIGS[this.provider.type];
        if (!config) return;

        // Sanitize baseURL for OpenAI client: remove /chat/completions if present as the client adds it
        let baseURL = process.env[`${this.provider.type.toUpperCase()}_BASE_URL`] || config.baseUrl;
        if (baseURL.endsWith('/chat/completions')) {
            baseURL = baseURL.replace('/chat/completions', '');
        }

        const clientConfig: any = {
            apiKey: this.provider.apiKey,
            baseURL,
        };

        // OpenRouter requer headers extras
        if (this.provider.type === 'openrouter') {
            clientConfig.defaultHeaders = {
                'HTTP-Referer': 'https://pagia.dev',
                'X-Title': 'PAGIA - AI Action Plan Manager',
            };
        }

        this.openaiCompatibleClient = new OpenAI(clientConfig);
    }

    /**
     * Inicializa cliente Ollama (usa formato OpenAI)
     */
    private initOllamaClient(): void {
        const baseURL = process.env.OLLAMA_HOST || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

        // Se estiver usando DeepSeek local conforme flag do usuário
        if (process.env.DEEPSEEK_USE_LOCAL === 'true' && process.env.DEEPSEEK_MODEL) {
            this.provider.model = process.env.DEEPSEEK_MODEL;
        }

        this.openaiCompatibleClient = new OpenAI({
            apiKey: 'ollama', // Ollama não precisa de API key
            baseURL: `${baseURL}/v1`,
        });
    }

    async chat(messages: AIMessage[]): Promise<AIResponse> {
        return this.chatWithFallback(messages);
    }

    /**
     * Chat com fallback automático entre modelos
     * Quando quota/rate limit é atingido, tenta o próximo modelo
     */
    private async chatWithFallback(messages: AIMessage[], fallbackIndex: number = 0): Promise<AIResponse> {
        const fallbackModels = this.getFallbackModels();
        const currentModel = fallbackIndex === 0 ? this.provider.model : fallbackModels[fallbackIndex];

        try {
            const response = await this.chatInternal(messages, currentModel);

            // Se usou fallback, informar qual modelo original era
            if (fallbackIndex > 0) {
                response.usedFallback = true;
                response.originalModel = this.originalModel;
                console.log(`⚠️  Fallback: usando ${currentModel} (original: ${this.originalModel})`);
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            // Verificar se é erro de quota/rate limit
            if (this.isQuotaError(errorMessage) && this.fallbackEnabled) {
                const nextIndex = fallbackIndex + 1;

                if (nextIndex < fallbackModels.length) {
                    console.log(`⚠️  Quota atingida para ${currentModel}, tentando ${fallbackModels[nextIndex]}...`);
                    return this.chatWithFallback(messages, nextIndex);
                } else {
                    throw new Error(`Todos os modelos de fallback foram esgotados. Erro original: ${errorMessage}`);
                }
            }

            throw error;
        }
    }

    /**
     * Verifica se o erro é relacionado a quota/rate limit
     */
    private isQuotaError(errorMessage: string): boolean {
        const quotaKeywords = [
            'quota',
            'rate limit',
            'rate_limit',
            'too many requests',
            'resource exhausted',
            'exceeded',
            '429',
            'RESOURCE_EXHAUSTED',
            'tokens',
            'RPM',
            'TPM',
        ];
        const lowerError = errorMessage.toLowerCase();
        return quotaKeywords.some(keyword => lowerError.includes(keyword.toLowerCase()));
    }

    /**
     * Obtém a lista de modelos de fallback baseado no provedor
     */
    private getFallbackModels(): string[] {
        switch (this.provider.type) {
            case 'gemini':
                return GEMINI_FALLBACK_MODELS;
            case 'openrouter':
                return OPENROUTER_FALLBACK_MODELS;
            default:
                return [this.provider.model]; // Sem fallback para outros provedores
        }
    }

    /**
     * Chat interno que executa a chamada real à API
     */
    private async chatInternal(messages: AIMessage[], modelOverride?: string): Promise<AIResponse> {
        const originalModel = this.provider.model;
        if (modelOverride) {
            this.provider.model = modelOverride;
        }

        try {
            switch (this.provider.type) {
                case 'gemini':
                    return await this.chatGemini(messages);
                case 'openai':
                case 'groq':
                case 'deepseek':
                case 'deepseek-beta':
                case 'mistral':
                case 'openrouter':
                case 'qwen':
                case 'coder':
                case 'nvidia':
                case 'ollama':
                    return await this.chatOpenAICompatible(messages);
                case 'anthropic':
                case 'claude-coder':
                    return await this.chatAnthropic(messages);
                default:
                    throw new Error(`Provider ${this.provider.type} not supported`);
            }
        } finally {
            if (modelOverride) {
                this.provider.model = originalModel;
            }
        }
    }

    async generate(prompt: string, systemPrompt?: string): Promise<AIResponse> {
        const messages: AIMessage[] = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        return this.chat(messages);
    }

    private async chatGemini(messages: AIMessage[]): Promise<AIResponse> {
        if (!this.geminiClient) {
            throw new Error('Gemini client not initialized');
        }

        // Convert messages to Gemini format (shared logic)
        const systemInstruction = messages
            .filter((m) => m.role === 'system')
            .map((m) => m.content)
            .join('\n');

        const chatHistory = messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            }));

        const lastMessage = chatHistory[chatHistory.length - 1];
        const historyForChat = chatHistory.slice(0, -1) as any;

        // Models to try in order of preference (confirmed available from API - 2026)
        const modelsToTry = [
            this.provider.model || 'gemini-2.0-flash',
            'gemini-2.0-flash',
            'gemini-2.0-flash-exp',
            'gemini-2.0-flash-lite',
            'gemini-1.5-flash',
            'gemini-1.5-pro',
        ];

        // Remove duplicates
        const uniqueModels = [...new Set(modelsToTry)];

        let lastError: any;

        for (const modelName of uniqueModels) {
            try {
                // If debug mode, log which model we are trying (safely)
                if (process.env.PAGIA_DEBUG === 'true') {
                    console.log(`[Gemini] Tentando modelo: ${modelName}`);
                }

                const model = this.geminiClient.getGenerativeModel({
                    model: modelName,
                });

                const chat = model.startChat({
                    history: historyForChat,
                    generationConfig: {
                        temperature: this.provider.temperature || 0.7,
                        maxOutputTokens: this.provider.maxTokens || 8192,
                    },
                    systemInstruction: systemInstruction ? { role: 'user', parts: [{ text: systemInstruction }] } : undefined,
                });

                const result = await chat.sendMessage(lastMessage.parts[0].text);
                const response = result.response;

                return {
                    content: response.text(),
                    provider: 'gemini',
                    model: modelName,
                    tokensUsed: response.usageMetadata?.totalTokenCount,
                };

            } catch (error: any) {
                lastError = error;
                const errorMessage = error.message || String(error);

                // If it's a 404 (Model not found) or 400 (Not supported), try next model
                if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('not supported')) {
                    continue;
                }

                // If it's a permission/key issue (403), failing for one means failing for all usually, but let's keep trying just in case.
                // If "API key not valid", break immediately? No, maybe different models have different access? Unlikely.
                if (errorMessage.includes('API key not valid')) {
                    throw new Error(`API Key inválida. Verifique a chave em .env (GEMINI_API_KEY).`);
                }
            }
        }

        // If all SDK attempts fail, try direct REST API v1 as a last resort
        try {
            if (process.env.PAGIA_DEBUG === 'true') {
                console.log(`[Gemini] Tentando fallback via REST API (gemini-2.0-flash)`);
            }
            return await this.chatGeminiREST(messages, 'gemini-2.0-flash');
        } catch (e) {
            // Ignore error here to throw the main SDK error later
        }

        // If even REST failed, throw the last SDK error
        const errorMsg = lastError?.message || String(lastError);

        if (errorMsg.includes('fetch failed')) {
            throw new Error(`Erro de conexão com Gemini API. Verifique sua internet.`);
        }
        if (errorMsg.includes('quota')) {
            throw new Error(`Cota excedida no Gemini. Tente mais tarde.`);
        }

        throw new Error(`Falha ao gerar conteúdo com Gemini (Tentados: ${uniqueModels.join(', ')}). Erro: ${errorMsg}`);
    }

    /**
     * Fallback direto via REST API para caso a SDK esteja usando endpoints/versões incompatíveis
     */
    private async chatGeminiREST(messages: AIMessage[], model: string): Promise<AIResponse> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.provider.apiKey}`;

        const contents = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        // System prompt fix for REST
        const systemMsg = messages.find(m => m.role === 'system');
        let systemInstruction;
        if (systemMsg) {
            systemInstruction = { parts: [{ text: systemMsg.content }] };
            // filter out system from contents
        }
        const chatContents = contents.filter(c => c.role !== 'system');

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: chatContents,
                systemInstruction,
                generationConfig: {
                    temperature: this.provider.temperature || 0.7,
                    maxOutputTokens: this.provider.maxTokens || 8192,
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`REST Error ${response.status}: ${errText}`);
        }

        const data = await response.json() as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error('Empty response from REST API');

        return {
            content: text,
            provider: 'gemini',
            model: model,
            tokensUsed: data.usageMetadata?.totalTokenCount
        };
    }

    /**
     * Chat usando API compatível com OpenAI (OpenAI, Groq, DeepSeek, Mistral, OpenRouter, Ollama)
     */
    private async chatOpenAICompatible(messages: AIMessage[]): Promise<AIResponse> {
        if (!this.openaiCompatibleClient) {
            throw new Error(`${this.provider.type} client not initialized`);
        }

        const config = PROVIDER_CONFIGS[this.provider.type];
        const modelName = this.provider.model || config?.defaultModel || 'gpt-4o';

        try {
            const completion = await this.openaiCompatibleClient.chat.completions.create({
                model: modelName,
                messages: messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                })),
                temperature: this.provider.temperature || 0.7,
                max_tokens: this.provider.maxTokens || 4096,
            });

            return {
                content: completion.choices[0]?.message?.content || '',
                provider: this.provider.type,
                model: modelName,
                tokensUsed: completion.usage?.total_tokens,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            if (errorMessage.includes('API key')) {
                throw new Error(`API Key inválida para ${this.provider.type}. Verifique a configuração.`);
            }
            if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
                throw new Error(`Limite de taxa excedido para ${this.provider.type}. Aguarde e tente novamente.`);
            }
            if (errorMessage.includes('ECONNREFUSED') && this.provider.type === 'ollama') {
                throw new Error(`Ollama não está rodando. Inicie com: ollama serve`);
            }

            throw new Error(`Erro ${this.provider.type}: ${errorMessage}`);
        }
    }

    private async chatAnthropic(messages: AIMessage[]): Promise<AIResponse> {
        const systemMessage = messages.find((m) => m.role === 'system');
        const chatMessages = messages.filter((m) => m.role !== 'system');

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.provider.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: this.provider.model || 'claude-3-5-sonnet-20241022',
                max_tokens: this.provider.maxTokens || 4096,
                system: systemMessage?.content,
                messages: chatMessages.map((m) => ({
                    role: m.role,
                    content: m.content,
                })),
            }),
        });

        const data = await response.json() as {
            content?: Array<{ text?: string }>;
            usage?: { input_tokens?: number; output_tokens?: number };
        };

        return {
            content: data.content?.[0]?.text || '',
            provider: 'anthropic',
            model: this.provider.model,
            tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        };
    }

    /**
     * Retorna informações do provedor atual
     */
    getProviderInfo(): { type: AIProviderType; model: string; displayName: string } {
        const displayNames: Record<AIProviderType, string> = {
            gemini: 'Google Gemini',
            openai: 'OpenAI',
            anthropic: 'Anthropic Claude',
            groq: 'Groq',
            ollama: 'Ollama (Local)',
            deepseek: 'DeepSeek',
            'deepseek-beta': 'DeepSeek Beta',
            mistral: 'Mistral AI',
            openrouter: 'OpenRouter',
            local: 'Local Model',
            qwen: 'Alibaba Qwen',
            coder: 'AI Coder',
            'claude-coder': 'Claude Coder',
            nvidia: 'NVIDIA NIM',
        };

        return {
            type: this.provider.type,
            model: this.provider.model,
            displayName: displayNames[this.provider.type] || this.provider.type,
        };
    }
}

/**
 * Obtém a API key apropriada baseada no provedor
 */
function getApiKeyForProvider(type: AIProviderType, configApiKey?: string): string {
    if (configApiKey) return configApiKey;

    const envMapping: Record<AIProviderType, string> = {
        gemini: 'GEMINI_API_KEY',
        openai: 'OPENAI_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY',
        groq: 'GROQ_API_KEY',
        ollama: '', // Ollama não precisa de API key
        deepseek: 'DEEPSEEK_API_KEY',
        'deepseek-beta': 'DEEPSEEK_API_KEY',
        mistral: 'MISTRAL_API_KEY',
        openrouter: 'OPENROUTER_API_KEY',
        local: '',
        qwen: 'QWEN_API_KEY',
        coder: 'CODER_API_KEY',
        'claude-coder': 'ANTHROPIC_API_KEY',
        nvidia: 'NVIDIA_API_KEY',
    };

    const envVar = envMapping[type];
    return envVar ? (process.env[envVar] || '') : '';
}

/**
 * Obtém o modelo padrão baseado no provedor
 */
function getDefaultModelForProvider(type: AIProviderType, configModel?: string): string {
    if (configModel) return configModel;

    const defaults: Record<AIProviderType, string> = {
        gemini: process.env.GEMINI_MODEL || 'gemini-2.0-flash', // Gemini 2.0 Flash (estável)
        openai: process.env.OPENAI_MODEL || 'gpt-4o',
        anthropic: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        groq: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        ollama: process.env.OLLAMA_MODEL || 'llama3.2',
        deepseek: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        'deepseek-beta': process.env.DEEPSEEK_MODEL || 'deepseek-coder',
        mistral: process.env.MISTRAL_MODEL || 'mistral-large-latest',
        openrouter: process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4',
        local: 'local-model',
        qwen: process.env.QWEN_MODEL || 'qwen-max',
        coder: process.env.CODER_MODEL || 'deepseek-coder-v2',
        'claude-coder': process.env.CLAUDE_CODER_MODEL || 'claude-3-5-sonnet-20241022',
        nvidia: process.env.NVIDIA_MODEL || 'nvidia/llama-3.1-nemotron-70b-instruct',
    };

    return defaults[type];
}

// Factory function
export function createAIService(config?: Partial<AIProvider>): AIService {
    const router = getRouterManager();
    // Use a sync load since AIService might be created in many places
    const routerConfig = router.getConfig();

    let type = (config?.type || process.env.AI_PROVIDER) as AIProviderType;
    let model = config?.model;
    let apiKey = config?.apiKey;
    let temp = config?.temperature;
    let tokens = config?.maxTokens;

    // If no explicit config/env, try to get from router.json
    if (!type && routerConfig && routerConfig.router?.default) {
        type = routerConfig.router.default.provider as AIProviderType;
        model = routerConfig.router.default.model;

        const providerData = routerConfig.providers.find(p => p.name === type);
        if (providerData) {
            apiKey = providerData.api_key;
        }
    }

    // Default to gemini if still nothing
    if (!type) type = 'gemini';

    const provider: AIProvider = {
        type,
        apiKey: apiKey || getApiKeyForProvider(type),
        model: model || getDefaultModelForProvider(type),
        temperature: temp || 0.7,
        maxTokens: tokens || 8192,
    };

    return new AIService(provider);
}

/**
 * Lista todos os provedores disponíveis com suas informações
 */
export function getAvailableProviders(): Array<{ type: AIProviderType; name: string; description: string; requiresApiKey: boolean }> {
    return [
        { type: 'gemini', name: 'Google Gemini', description: 'Modelos Gemini (Flash, Pro)', requiresApiKey: true },
        { type: 'openai', name: 'OpenAI', description: 'GPT-4, GPT-4o, o1', requiresApiKey: true },
        { type: 'anthropic', name: 'Anthropic Claude', description: 'Claude 3.5 Sonnet, Opus', requiresApiKey: true },
        { type: 'groq', name: 'Groq', description: 'LLaMA 3, Mixtral (muito rápido)', requiresApiKey: true },
        { type: 'ollama', name: 'Ollama (Local)', description: 'Modelos locais sem API key', requiresApiKey: false },
        { type: 'deepseek', name: 'DeepSeek', description: 'DeepSeek Chat, Coder', requiresApiKey: true },
        { type: 'mistral', name: 'Mistral AI', description: 'Mistral Large, Medium', requiresApiKey: true },
        { type: 'openrouter', name: 'OpenRouter', description: 'Acesso a múltiplos provedores', requiresApiKey: true },
        { type: 'qwen', name: 'Alibaba Qwen', description: 'Modelos Qwen (Max, Plus)', requiresApiKey: true },
        { type: 'coder', name: 'AI Coder', description: 'Modelos especializados em codificação', requiresApiKey: true },
        { type: 'claude-coder', name: 'Claude Coder', description: 'Claude especializado em codificação', requiresApiKey: true },
        { type: 'nvidia', name: 'NVIDIA', description: 'NVIDIA NIM Microservices', requiresApiKey: true },
    ];
}

