/**
 * PAGIA CLI Types
 */
export interface CLICommand {
    name: string;
    description: string;
    run(args: string[]): Promise<void>;
}
export interface AIProvider {
    name: string;
    ask(prompt: string, options?: AIProviderOptions): Promise<string>;
}
export interface AIProviderOptions {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
}
//# sourceMappingURL=types.d.ts.map