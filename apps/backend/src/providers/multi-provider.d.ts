/**
 * PAGIA - Multi-Provider AI Gateway
 * Suporta: OpenAI, Gemini, Anthropic, Groq, Mistral, OpenRouter, Qwen, DeepSeek, Ollama, Local
 */
import { AIProvider, AIProviderOptions } from '../cli-core/types.js';
type ProviderName = 'openai' | 'gemini' | 'anthropic' | 'groq' | 'mistral' | 'openrouter' | 'qwen' | 'deepseek' | 'ollama' | 'local';
export declare class MultiProvider implements AIProvider {
    name: string;
    private config;
    constructor(providerName?: ProviderName);
    ask(prompt: string, options?: AIProviderOptions): Promise<string>;
    private callOpenAICompatible;
    private callGemini;
    private callOllama;
    static listAvailableProviders(): {
        name: string;
        configured: boolean;
        model: string;
    }[];
}
export declare const multiProvider: MultiProvider;
export {};
//# sourceMappingURL=multi-provider.d.ts.map