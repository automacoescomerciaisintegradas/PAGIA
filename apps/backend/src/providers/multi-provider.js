/**
 * PAGIA - Multi-Provider AI Gateway
 * Suporta: OpenAI, Gemini, Anthropic, Groq, Mistral, OpenRouter, Qwen, DeepSeek, Ollama, Local
 */
import { getRouterManager } from '../core/router-manager.js';
// Configurações dos providers baseadas em variáveis de ambiente e router.json
function getProviderConfigs() {
    const baseConfigs = {
        openai: {
            name: 'openai',
            baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
            apiKey: process.env.OPENAI_API_KEY || '',
            model: process.env.OPENAI_MODEL || 'gpt-4o',
        },
        gemini: {
            name: 'gemini',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            apiKey: process.env.GEMINI_API_KEY || '',
            model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        },
        anthropic: {
            name: 'anthropic',
            baseUrl: 'https://api.anthropic.com/v1',
            apiKey: process.env.ANTHROPIC_API_KEY || '',
            model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        },
        groq: {
            name: 'groq',
            baseUrl: 'https://api.groq.com/openai/v1',
            apiKey: process.env.GROQ_API_KEY || '',
            model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        },
        mistral: {
            name: 'mistral',
            baseUrl: 'https://api.mistral.ai/v1',
            apiKey: process.env.MISTRAL_API_KEY || '',
            model: process.env.MISTRAL_MODEL || 'mistral-large-latest',
        },
        openrouter: {
            name: 'openrouter',
            baseUrl: 'https://openrouter.ai/api/v1',
            apiKey: process.env.OPENROUTER_API_KEY || '',
            model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
            headers: {
                'HTTP-Referer': 'https://pagia.dev',
                'X-Title': 'PAGIA CLI',
            },
        },
        qwen: {
            name: 'qwen',
            baseUrl: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            apiKey: process.env.QWEN_API_KEY || '',
            model: process.env.QWEN_MODEL || 'qwen-turbo',
        },
        deepseek: {
            name: 'deepseek',
            baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
            apiKey: process.env.DEEPSEEK_API_KEY || '',
            model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        },
        ollama: {
            name: 'ollama',
            baseUrl: process.env.OLLAMA_HOST || 'http://localhost:11434',
            apiKey: '',
            model: process.env.OLLAMA_MODEL || 'llama3.2',
        },
        local: {
            name: 'local',
            baseUrl: process.env.LOCAL_LLM_URL || 'http://localhost:8080/v1',
            apiKey: '',
            model: 'local',
        },
    };
    // Override with router.json if it exists
    try {
        const router = getRouterManager();
        const rConfig = router.getConfig();
        if (rConfig && rConfig.providers) {
            for (const p of rConfig.providers) {
                if (baseConfigs[p.name]) {
                    const bc = baseConfigs[p.name];
                    bc.apiKey = p.api_key || bc.apiKey;
                    bc.baseUrl = p.api_base_url || bc.baseUrl;
                    bc.model = p.models[0] || bc.model;
                }
                else {
                    // New dynamic provider from router.json
                    baseConfigs[p.name] = {
                        name: p.name,
                        baseUrl: p.api_base_url,
                        apiKey: p.api_key,
                        model: p.models[0]
                    };
                }
            }
        }
    }
    catch { /* ignore */ }
    return baseConfigs;
}
export class MultiProvider {
    name;
    config;
    constructor(providerName) {
        const configs = getProviderConfigs();
        const router = getRouterManager();
        const rConfig = router.getConfig();
        let selectedProvider = (providerName || process.env.AI_PROVIDER);
        // If no explicit provider, try the router's default
        if (!selectedProvider && rConfig?.router?.default) {
            selectedProvider = rConfig.router.default.provider;
        }
        // Fallback to groq as it was the original default
        if (!selectedProvider || !configs[selectedProvider]) {
            selectedProvider = 'groq';
        }
        this.config = configs[selectedProvider];
        // If router has a specific model for this provider, use it
        if (rConfig?.router?.default?.provider === selectedProvider) {
            this.config.model = rConfig.router.default.model;
        }
        this.name = selectedProvider;
    }
    async ask(prompt, options) {
        // Gemini usa API diferente
        if (this.config.name === 'gemini') {
            return this.callGemini(prompt, options);
        }
        // Ollama usa endpoint diferente
        if (this.config.name === 'ollama') {
            return this.callOllama(prompt, options);
        }
        // Todos os outros usam formato OpenAI-compatible
        return this.callOpenAICompatible(prompt, options);
    }
    async callOpenAICompatible(prompt, options) {
        const messages = [];
        if (options?.systemPrompt) {
            messages.push({ role: 'system', content: options.systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }
        // Headers extras (ex: OpenRouter)
        if (this.config.headers) {
            Object.assign(headers, this.config.headers);
        }
        // Sanitize baseURL: remove /chat/completions if present (the fetch call below adds it)
        let baseURL = this.config.baseUrl;
        if (baseURL.endsWith('/chat/completions')) {
            baseURL = baseURL.replace('/chat/completions', '');
        }
        const response = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: this.config.model,
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 4096,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`[${this.config.name}] HTTP ${response.status}: ${errorText.slice(0, 200)}`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(`[${this.config.name}] ${data.error.message || data.error}`);
        }
        return data.choices?.[0]?.message?.content || '(Resposta vazia)';
    }
    async callGemini(prompt, options) {
        const url = `${this.config.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
        const contents = [];
        if (options?.systemPrompt) {
            contents.push({ role: 'user', parts: [{ text: options.systemPrompt }] });
            contents.push({ role: 'model', parts: [{ text: 'Entendido.' }] });
        }
        contents.push({ role: 'user', parts: [{ text: prompt }] });
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: options?.temperature ?? 0.7,
                    maxOutputTokens: options?.maxTokens ?? 4096,
                },
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`[gemini] HTTP ${response.status}: ${errorText.slice(0, 200)}`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(`[gemini] ${data.error.message}`);
        }
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '(Resposta vazia)';
    }
    async callOllama(prompt, options) {
        const response = await fetch(`${this.config.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.config.model,
                messages: [
                    ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
                    { role: 'user', content: prompt },
                ],
                stream: false,
                options: {
                    temperature: options?.temperature ?? 0.7,
                },
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`[ollama] HTTP ${response.status}: ${errorText.slice(0, 200)}`);
        }
        const data = await response.json();
        return data.message?.content || '(Resposta vazia)';
    }
    static listAvailableProviders() {
        const configs = getProviderConfigs();
        return Object.entries(configs).map(([name, config]) => ({
            name,
            configured: name === 'local' || name === 'ollama' || !!config.apiKey,
            model: config.model,
        }));
    }
}
// Singleton padrão
export const multiProvider = new MultiProvider();
//# sourceMappingURL=multi-provider.js.map