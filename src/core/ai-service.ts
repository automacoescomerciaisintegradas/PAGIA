/**
 * PAGIA - AI Provider Service
 * Integração com múltiplos provedores de IA
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
}

export class AIService {
    private provider: AIProvider;
    private geminiClient?: GoogleGenerativeAI;
    private openaiClient?: OpenAI;

    constructor(provider: AIProvider) {
        this.provider = provider;
        this.initializeClient();
    }

    private initializeClient(): void {
        switch (this.provider.type) {
            case 'gemini':
                this.geminiClient = new GoogleGenerativeAI(this.provider.apiKey);
                break;
            case 'openai':
                this.openaiClient = new OpenAI({ apiKey: this.provider.apiKey });
                break;
            case 'anthropic':
                // Anthropic uses fetch-based API
                break;
            case 'local':
                // Local model support (Ollama, etc.)
                break;
        }
    }

    async chat(messages: AIMessage[]): Promise<AIResponse> {
        switch (this.provider.type) {
            case 'gemini':
                return this.chatGemini(messages);
            case 'openai':
                return this.chatOpenAI(messages);
            case 'anthropic':
                return this.chatAnthropic(messages);
            default:
                throw new Error(`Provider ${this.provider.type} not supported`);
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

        const model = this.geminiClient.getGenerativeModel({
            model: this.provider.model || 'gemini-2.0-flash-exp',
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

        const chat = model.startChat({
            history: chatHistory.slice(0, -1) as any,
            generationConfig: {
                temperature: this.provider.temperature || 0.7,
                maxOutputTokens: this.provider.maxTokens || 8192,
            },
            systemInstruction: systemInstruction || undefined,
        });

        const lastMessage = chatHistory[chatHistory.length - 1];
        const result = await chat.sendMessage(lastMessage.parts[0].text);
        const response = result.response;

        return {
            content: response.text(),
            provider: 'gemini',
            model: this.provider.model,
            tokensUsed: response.usageMetadata?.totalTokenCount,
        };
    }

    private async chatOpenAI(messages: AIMessage[]): Promise<AIResponse> {
        if (!this.openaiClient) {
            throw new Error('OpenAI client not initialized');
        }

        const completion = await this.openaiClient.chat.completions.create({
            model: this.provider.model || 'gpt-4o',
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
            temperature: this.provider.temperature || 0.7,
            max_tokens: this.provider.maxTokens || 4096,
        });

        return {
            content: completion.choices[0]?.message?.content || '',
            provider: 'openai',
            model: this.provider.model,
            tokensUsed: completion.usage?.total_tokens,
        };
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
}

// Factory function
export function createAIService(config?: Partial<AIProvider>): AIService {
    const provider: AIProvider = {
        type: (config?.type || process.env.AI_PROVIDER || 'gemini') as AIProviderType,
        apiKey: config?.apiKey || process.env.GEMINI_API_KEY || '',
        model: config?.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
        temperature: config?.temperature || 0.7,
        maxTokens: config?.maxTokens || 8192,
    };

    // Override API key based on provider
    if (provider.type === 'openai' && !config?.apiKey) {
        provider.apiKey = process.env.OPENAI_API_KEY || '';
        provider.model = process.env.OPENAI_MODEL || 'gpt-4o';
    } else if (provider.type === 'anthropic' && !config?.apiKey) {
        provider.apiKey = process.env.ANTHROPIC_API_KEY || '';
        provider.model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
    }

    return new AIService(provider);
}
