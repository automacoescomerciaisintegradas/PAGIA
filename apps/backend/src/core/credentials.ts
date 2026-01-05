/**
 * PAGIA - Credentials Manager
 * Gerencia credenciais/API keys de forma segura
 * Seguindo padrão de CLIs como Claude Code, Cursor e Windsurf
 * 
 * @author Automações Comerciais Integradas
 * @version 1.0.0
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { getCredentialsDir } from './paths.js';

/**
 * Supported AI providers for credential storage
 */
export type CredentialProvider =
    | 'gemini'
    | 'openai'
    | 'anthropic'
    | 'groq'
    | 'deepseek'
    | 'mistral'
    | 'openrouter'
    | 'ollama'
    | 'azure'
    | 'cohere'
    | 'custom'
    | 'qwen'
    | 'coder'
    | 'claude-coder';

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
 * Encryption configuration
 */
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get a machine-specific key for encryption
 * Uses a combination of machine identifiers for security
 */
function getMachineKey(): string {
    // Use a combination of environment variables and constants
    // This provides machine-specific encryption without requiring user input
    const machineId = [
        process.env.COMPUTERNAME || process.env.HOSTNAME || 'localhost',
        process.env.USERNAME || process.env.USER || 'user',
        'PAGIA-Secure-Storage-v1',
    ].join(':');

    return createHash('sha256').update(machineId).digest('hex').slice(0, KEY_LENGTH);
}

/**
 * Encrypt a value
 */
function encrypt(plaintext: string): string {
    const key = Buffer.from(getMachineKey());
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine iv + authTag + encrypted data
    return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

/**
 * Decrypt a value
 */
function decrypt(ciphertext: string): string {
    try {
        const key = Buffer.from(getMachineKey());

        // Extract iv, authTag, and encrypted data
        const iv = Buffer.from(ciphertext.slice(0, IV_LENGTH * 2), 'hex');
        const authTag = Buffer.from(ciphertext.slice(IV_LENGTH * 2, IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2), 'hex');
        const encrypted = ciphertext.slice(IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2);

        const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        throw new Error('Failed to decrypt credential. The credential may have been created on a different machine.');
    }
}

/**
 * Credentials Manager
 * Handles secure storage of API keys and credentials
 */
export class CredentialsManager {
    private static instance: CredentialsManager | null = null;
    private credentialsDir: string;

    private constructor() {
        this.credentialsDir = getCredentialsDir();
    }

    /**
     * Get singleton instance
     */
    static getInstance(): CredentialsManager {
        if (!CredentialsManager.instance) {
            CredentialsManager.instance = new CredentialsManager();
        }
        return CredentialsManager.instance;
    }

    /**
     * Ensure credentials directory exists
     */
    private ensureDir(): void {
        if (!existsSync(this.credentialsDir)) {
            mkdirSync(this.credentialsDir, { recursive: true });
        }
    }

    /**
     * Get file path for a provider
     */
    private getCredentialPath(provider: CredentialProvider): string {
        return join(this.credentialsDir, `${provider}.enc`);
    }

    /**
     * Store a credential
     */
    async store(provider: CredentialProvider, apiKey: string, options?: {
        baseUrl?: string;
        model?: string;
        metadata?: Record<string, unknown>;
    }): Promise<void> {
        this.ensureDir();

        const credential: Credential = {
            provider,
            apiKey,
            baseUrl: options?.baseUrl,
            model: options?.model,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: options?.metadata,
        };

        const encrypted = encrypt(JSON.stringify(credential));
        const filePath = this.getCredentialPath(provider);

        writeFileSync(filePath, encrypted, 'utf-8');
    }

    /**
     * Retrieve a credential
     */
    async get(provider: CredentialProvider): Promise<Credential | null> {
        const filePath = this.getCredentialPath(provider);

        if (!existsSync(filePath)) {
            return null;
        }

        try {
            const encrypted = readFileSync(filePath, 'utf-8');
            const decrypted = decrypt(encrypted);
            return JSON.parse(decrypted) as Credential;
        } catch (error) {
            console.error(`Failed to retrieve credential for ${provider}:`, error);
            return null;
        }
    }

    /**
     * Get API key for a provider
     */
    async getApiKey(provider: CredentialProvider): Promise<string | null> {
        const credential = await this.get(provider);
        return credential?.apiKey || null;
    }

    /**
     * Update a credential
     */
    async update(provider: CredentialProvider, updates: Partial<Credential>): Promise<void> {
        const existing = await this.get(provider);

        if (!existing) {
            throw new Error(`No credential found for provider: ${provider}`);
        }

        const updated: Credential = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        const encrypted = encrypt(JSON.stringify(updated));
        const filePath = this.getCredentialPath(provider);

        writeFileSync(filePath, encrypted, 'utf-8');
    }

    /**
     * Delete a credential
     */
    async delete(provider: CredentialProvider): Promise<boolean> {
        const filePath = this.getCredentialPath(provider);

        if (!existsSync(filePath)) {
            return false;
        }

        try {
            unlinkSync(filePath);
            return true;
        } catch (error) {
            console.error(`Failed to delete credential for ${provider}:`, error);
            return false;
        }
    }

    /**
     * List all stored providers
     */
    async listProviders(): Promise<CredentialProvider[]> {
        if (!existsSync(this.credentialsDir)) {
            return [];
        }

        const files = readdirSync(this.credentialsDir);
        return files
            .filter(f => f.endsWith('.enc'))
            .map(f => f.replace('.enc', '') as CredentialProvider);
    }

    /**
     * Check if a provider has stored credentials
     */
    async has(provider: CredentialProvider): Promise<boolean> {
        const filePath = this.getCredentialPath(provider);
        return existsSync(filePath);
    }

    /**
     * Get the best available provider based on stored credentials
     * Priority: gemini > openai > anthropic > groq > others
     */
    async getBestProvider(): Promise<CredentialProvider | null> {
        const priority: CredentialProvider[] = [
            'gemini',
            'openai',
            'anthropic',
            'groq',
            'deepseek',
            'mistral',
            'openrouter',
            'ollama',
            'qwen',
            'coder',
            'claude-coder',
        ];

        for (const provider of priority) {
            const credential = await this.get(provider);
            if (credential?.apiKey) {
                return provider;
            }
        }

        return null;
    }

    /**
     * Import credentials from environment variables
     */
    async importFromEnvironment(): Promise<CredentialProvider[]> {
        const envMap: Record<string, CredentialProvider> = {
            'GEMINI_API_KEY': 'gemini',
            'OPENAI_API_KEY': 'openai',
            'ANTHROPIC_API_KEY': 'anthropic',
            'GROQ_API_KEY': 'groq',
            'DEEPSEEK_API_KEY': 'deepseek',
            'MISTRAL_API_KEY': 'mistral',
            'OPENROUTER_API_KEY': 'openrouter',
            'QWEN_API_KEY': 'qwen',
            'CODER_API_KEY': 'coder',
        };

        const imported: CredentialProvider[] = [];

        for (const [envVar, provider] of Object.entries(envMap)) {
            const apiKey = process.env[envVar];

            if (apiKey && apiKey.length > 10 && !apiKey.includes('your_')) {
                const existing = await this.has(provider);

                if (!existing) {
                    await this.store(provider, apiKey);
                    imported.push(provider);
                }
            }
        }

        return imported;
    }

    /**
     * Validate a credential by checking if it looks valid
     */
    validateApiKey(provider: CredentialProvider, apiKey: string): boolean {
        if (!apiKey || apiKey.length < 10) return false;

        // Check for placeholder patterns
        if (apiKey.includes('your_') || apiKey.includes('_here')) return false;

        // Provider-specific validation
        switch (provider) {
            case 'gemini':
                return apiKey.length >= 39; // Gemini keys are typically 39 chars
            case 'openai':
                return apiKey.startsWith('sk-');
            case 'anthropic':
                return apiKey.startsWith('sk-ant-');
            case 'groq':
                return apiKey.startsWith('gsk_');
            case 'qwen':
                return apiKey.length >= 32; // Qwen keys are typically long
            case 'coder':
                return apiKey.length >= 20; // Generic validation for coder APIs
            case 'claude-coder':
                return apiKey.startsWith('sk-ant-'); // Same as anthropic
            default:
                return true;
        }
    }
}

// Export singleton getter
export function getCredentialsManager(): CredentialsManager {
    return CredentialsManager.getInstance();
}
