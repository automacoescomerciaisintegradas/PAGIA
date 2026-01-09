/**
 * PAGIA - AI Provider Service
 * Integração com múltiplos provedores de IA
 * Suporta: Gemini, OpenAI, Anthropic, Groq, Ollama, DeepSeek, Mistral, OpenRouter
 *
 * RECURSO: Fallback automático entre modelos quando quota/tokens acabam
 */
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
 * Ordem: do mais preferido para o menos preferido (modelos disponíveis em 2026)
 */
export declare const GEMINI_FALLBACK_MODELS: string[];
/**
 * Lista de modelos OpenRouter com fallback automático
 */
export declare const OPENROUTER_FALLBACK_MODELS: string[];
export declare class AIService {
    private provider;
    private geminiClient?;
    private openaiCompatibleClient?;
    private fallbackEnabled;
    private currentFallbackIndex;
    private originalModel;
    constructor(provider: AIProvider);
    /**
     * Habilita ou desabilita o fallback automático
     */
    setFallbackEnabled(enabled: boolean): void;
    private initializeClient;
    /**
     * Inicializa cliente compatível com OpenAI API (Groq, DeepSeek, Mistral, OpenRouter)
     */
    private initOpenAICompatibleClient;
    /**
     * Inicializa cliente Ollama (usa formato OpenAI)
     */
    private initOllamaClient;
    chat(messages: AIMessage[]): Promise<AIResponse>;
    /**
     * Chat com fallback automático entre modelos
     * Quando quota/rate limit é atingido, tenta o próximo modelo
     */
    private chatWithFallback;
    /**
     * Verifica se o erro é relacionado a quota/rate limit
     */
    private isQuotaError;
    /**
     * Obtém a lista de modelos de fallback baseado no provedor
     */
    private getFallbackModels;
    /**
     * Chat interno que executa a chamada real à API
     */
    private chatInternal;
    generate(prompt: string, systemPrompt?: string): Promise<AIResponse>;
    private chatGemini;
    /**
     * Fallback direto via REST API para caso a SDK esteja usando endpoints/versões incompatíveis
     */
    private chatGeminiREST;
    /**
     * Chat usando API compatível com OpenAI (OpenAI, Groq, DeepSeek, Mistral, OpenRouter, Ollama)
     */
    private chatOpenAICompatible;
    private chatAnthropic;
    /**
     * Retorna informações do provedor atual
     */
    getProviderInfo(): {
        type: AIProviderType;
        model: string;
        displayName: string;
    };
}
export declare function createAIService(config?: Partial<AIProvider>): AIService;
/**
 * Lista todos os provedores disponíveis com suas informações
 */
export declare function getAvailableProviders(): Array<{
    type: AIProviderType;
    name: string;
    description: string;
    requiresApiKey: boolean;
}>;
//# sourceMappingURL=ai-service.d.ts.map