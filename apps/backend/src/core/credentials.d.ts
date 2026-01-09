/**
 * PAGIA - Credentials Manager
 * Gerencia credenciais/API keys de forma segura
 * Seguindo padrão de CLIs como Claude Code, Cursor e Windsurf
 *
 * @author Automações Comerciais Integradas
 * @version 1.0.0
 */
/**
 * Supported AI providers for credential storage
 */
export type CredentialProvider = 'gemini' | 'openai' | 'anthropic' | 'groq' | 'deepseek' | 'mistral' | 'openrouter' | 'ollama' | 'azure' | 'cohere' | 'custom' | 'qwen' | 'nvidia' | 'together' | 'replicate' | 'zai' | 'coder' | 'claude-coder';
/**
 * Credential entry structure
 */
export interface Credential {
    provider: CredentialProvider;
    apiKey: string;
    baseUrl?: string;
    model?: string;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, unknown>;
}
/**
 * Credentials Manager
 * Handles secure storage of API keys and credentials
 */
export declare class CredentialsManager {
    private static instance;
    private credentialsDir;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): CredentialsManager;
    /**
     * Ensure credentials directory exists
     */
    private ensureDir;
    /**
     * Get file path for a provider
     */
    private getCredentialPath;
    /**
     * Store a credential
     */
    store(provider: CredentialProvider, apiKey: string, options?: {
        baseUrl?: string;
        model?: string;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    /**
     * Retrieve a credential
     */
    get(provider: CredentialProvider): Promise<Credential | null>;
    /**
     * Get API key for a provider
     */
    getApiKey(provider: CredentialProvider): Promise<string | null>;
    /**
     * Update a credential
     */
    update(provider: CredentialProvider, updates: Partial<Credential>): Promise<void>;
    /**
     * Delete a credential
     */
    delete(provider: CredentialProvider): Promise<boolean>;
    /**
     * List all stored providers
     */
    listProviders(): Promise<CredentialProvider[]>;
    /**
     * Check if a provider has stored credentials
     */
    has(provider: CredentialProvider): Promise<boolean>;
    /**
     * Get the best available provider based on stored credentials
     * Priority: gemini > openai > anthropic > groq > others
     */
    getBestProvider(): Promise<CredentialProvider | null>;
    /**
     * Import credentials from environment variables
     */
    importFromEnvironment(): Promise<CredentialProvider[]>;
    /**
     * Validate a credential by checking if it looks valid
     */
    validateApiKey(provider: CredentialProvider, apiKey: string): boolean;
}
export declare function getCredentialsManager(): CredentialsManager;
//# sourceMappingURL=credentials.d.ts.map