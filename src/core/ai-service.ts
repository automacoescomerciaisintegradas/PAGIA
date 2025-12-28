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
 * Ordem: do mais preferido para o menos preferido
 */
export const GEMINI_FALLBACK_MODELS = [
    'gemini-2.5-pro-preview-06-05',      // Gemini 3 Pro (Low) - Padrão
    'gemini-2.5-flash-preview-05-20',    // Gemini 3 Flash
    'gemini-2.0-flash-exp',              // Gemini 2.0 Flash Experimental
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
            case 'mistral':
            case 'openrouter':
                this.initOpenAICompatibleClient();
                break;
            case 'ollama':
                this.initOllamaClient();
                break;
            case 'anthropic':
                // Anthropic uses fetch-based API
                break;
            case 'local':
                // Local model support (Ollama, etc.)
                break;
        }
    }

    /**
     * Inicializa cliente compatível com OpenAI API (Groq, DeepSeek, Mistral, OpenRouter)
     */
    private initOpenAICompatibleClient(): void {
        const config = PROVIDER_CONFIGS[this.provider.type];
        if (!config) return;

        const baseURL = process.env[`${this.provider.type.toUpperCase()}_BASE_URL`] || config.baseUrl;

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
                case 'mistral':
                case 'openrouter':
                case 'ollama':
                    return await this.chatOpenAICompatible(messages);
                case 'anthropic':
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

        // Use stable model, with fallback
        const modelName = this.provider.model || 'gemini-1.5-flash';

        const model = this.geminiClient.getGenerativeModel({
            model: modelName,
        });

        // Convert messages to Gemini format
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

        try {
            const chat = model.startChat({
                history: chatHistory.slice(0, -1) as any,
                generationConfig: {
                    temperature: this.provider.temperature || 0.7,
                    maxOutputTokens: this.provider.maxTokens || 8192,
                },
                systemInstruction: systemInstruction ? { role: 'user', parts: [{ text: systemInstruction }] } : undefined,
            });

            const lastMessage = chatHistory[chatHistory.length - 1];
            const result = await chat.sendMessage(lastMessage.parts[0].text);
            const response = result.response;

            return {
                content: response.text(),
                provider: 'gemini',
                model: modelName,
                tokensUsed: response.usageMetadata?.totalTokenCount,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            // Check for common errors
            if (errorMessage.includes('fetch failed')) {
                throw new Error(`Erro de conexão com Gemini API. Verifique sua internet e tente novamente.`);
            }
            if (errorMessage.includes('API key not valid')) {
                throw new Error(`API Key inválida. Verifique a chave em .env (GEMINI_API_KEY).`);
            }
            if (errorMessage.includes('quota')) {
                throw new Error(`Cota excedida. Aguarde alguns minutos ou use outra API key.`);
            }

            throw new Error(`Erro Gemini: ${errorMessage}`);
        }
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
            mistral: 'Mistral AI',
            openrouter: 'OpenRouter',
            local: 'Local Model',
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
        mistral: 'MISTRAL_API_KEY',
        openrouter: 'OPENROUTER_API_KEY',
        local: '',
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
        gemini: process.env.GEMINI_MODEL || 'gemini-2.5-pro-preview-06-05', // Gemini 3 Pro (Low)
        openai: process.env.OPENAI_MODEL || 'gpt-4o',
        anthropic: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        groq: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        ollama: process.env.OLLAMA_MODEL || 'llama3.2',
        deepseek: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        mistral: process.env.MISTRAL_MODEL || 'mistral-large-latest',
        openrouter: process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4',
        local: 'local-model',
    };

    return defaults[type];
}

// Factory function
export function createAIService(config?: Partial<AIProvider>): AIService {
    const type = (config?.type || process.env.AI_PROVIDER || 'gemini') as AIProviderType;

    const provider: AIProvider = {
        type,
        apiKey: getApiKeyForProvider(type, config?.apiKey),
        model: getDefaultModelForProvider(type, config?.model),
        temperature: config?.temperature || 0.7,
        maxTokens: config?.maxTokens || 8192,
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
    ];
}

