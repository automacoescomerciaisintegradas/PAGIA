/**
 * PAGIA Gateway AI Provider
 * Conecta ao LLM Gateway local (serve-llm)
 */

import { AIProvider, AIProviderOptions } from '../cli-core/types.js';

export class GatewayProvider implements AIProvider {
    name = 'gateway';
    private baseUrl: string;

    constructor(baseUrl: string = 'http://localhost:3000/v1') {
        this.baseUrl = baseUrl;
    }

    async ask(prompt: string, options?: AIProviderOptions): Promise<string> {
        const messages: any[] = [];

        if (options?.systemPrompt) {
            messages.push({ role: 'system', content: options.systemPrompt });
        }

        messages.push({ role: 'user', content: prompt });

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages,
                model: 'local',
                provider: 'local',
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 4096,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gateway error: ${response.status} - ${errorText}`);
        }

        const data = await response.json() as any;

        if (data.error) {
            throw new Error(data.error);
        }

        return data.choices?.[0]?.message?.content || '(Resposta vazia)';
    }
}

// Singleton instance
export const gatewayProvider = new GatewayProvider(
    process.env.LLM_GATEWAY_URL || 'http://localhost:3000/v1'
);
