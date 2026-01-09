/**
 * PAGIA Gateway AI Provider
 * Conecta ao LLM Gateway local (serve-llm)
 */
import { AIProvider, AIProviderOptions } from '../cli-core/types.js';
export declare class GatewayProvider implements AIProvider {
    name: string;
    private baseUrl;
    constructor(baseUrl?: string);
    ask(prompt: string, options?: AIProviderOptions): Promise<string>;
}
export declare const gatewayProvider: GatewayProvider;
//# sourceMappingURL=gateway.provider.d.ts.map