/**
 * PAGIA - N8N MCP Client
 * Cliente para conectar ao servidor MCP do N8N
 * 
 * @module utils/n8n-mcp-client
 * @author Automações Comerciais Integradas
 */

import { logger } from './logger.js';

export interface N8NMCPConfig {
    /** URL do servidor MCP do N8N (ex: https://n8n.example.com/mcp-server/http) */
    mcpUrl: string;
    /** Token de autenticação (Bearer token ou API Key) */
    authToken?: string;
    /** Tipo de autenticação: 'bearer' ou 'header' */
    authType?: 'bearer' | 'header';
    /** Nome do header de autenticação (default: Authorization) */
    authHeader?: string;
}

export interface MCPToolDefinition {
    name: string;
    description?: string;
    inputSchema?: {
        type: string;
        properties?: Record<string, unknown>;
        required?: string[];
    };
}

export interface MCPResourceDefinition {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}

interface MCPResponse<T = unknown> {
    jsonrpc: '2.0';
    id?: string | number;
    result?: T;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
}

/**
 * Cliente MCP para conectar ao servidor MCP do N8N
 */
export class N8NMCPClient {
    private config: N8NMCPConfig;
    private headers: Record<string, string>;
    private requestId: number = 0;

    constructor(config: N8NMCPConfig) {
        this.config = {
            mcpUrl: config.mcpUrl.replace(/\/$/, ''),
            authToken: config.authToken,
            authType: config.authType || 'bearer',
            authHeader: config.authHeader || 'Authorization',
        };

        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
        };

        if (this.config.authToken) {
            if (this.config.authType === 'bearer') {
                this.headers[this.config.authHeader!] = `Bearer ${this.config.authToken}`;
            } else {
                this.headers[this.config.authHeader!] = this.config.authToken;
            }
        }
    }

    /**
     * Faz requisição JSON-RPC para o servidor MCP
     */
    private async rpcRequest<T>(method: string, params?: Record<string, unknown>): Promise<T> {
        const id = ++this.requestId;
        const body = {
            jsonrpc: '2.0',
            method,
            params: params || {},
            id,
        };

        logger.debug(`N8N MCP Request: ${method} -> ${this.config.mcpUrl}`);

        const response = await fetch(this.config.mcpUrl, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`N8N MCP Error (${response.status}): ${errorText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        const responseText = await response.text();

        // Processar resposta SSE (Server-Sent Events)
        if (contentType.includes('text/event-stream') || responseText.startsWith('event:')) {
            const result = this.parseSSEResponse<T>(responseText);
            return result;
        }

        // Processar resposta JSON normal
        const result = JSON.parse(responseText) as MCPResponse<T>;

        if (result.error) {
            throw new Error(`MCP Error (${result.error.code}): ${result.error.message}`);
        }

        return result.result as T;
    }

    /**
     * Parseia resposta SSE do servidor MCP
     */
    private parseSSEResponse<T>(sseText: string): T {
        const lines = sseText.split('\n');
        let lastData: string | null = null;

        for (const line of lines) {
            if (line.startsWith('data:')) {
                lastData = line.substring(5).trim();
            }
        }

        if (!lastData) {
            throw new Error('No data found in SSE response');
        }

        const parsed = JSON.parse(lastData) as MCPResponse<T>;

        if (parsed.error) {
            throw new Error(`MCP Error (${parsed.error.code}): ${parsed.error.message}`);
        }

        return parsed.result as T;
    }

    /**
     * Inicializa conexão com o servidor MCP
     */
    async initialize(): Promise<{
        protocolVersion: string;
        serverInfo: { name: string; version: string };
        capabilities: Record<string, unknown>;
    }> {
        return this.rpcRequest('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
                name: 'PAGIA',
                version: '1.0.0',
            },
        });
    }

    /**
     * Lista todas as ferramentas disponíveis no servidor MCP do N8N
     */
    async listTools(): Promise<{ tools: MCPToolDefinition[] }> {
        return this.rpcRequest('tools/list');
    }

    /**
     * Chama uma ferramenta no servidor MCP do N8N
     */
    async callTool(
        name: string,
        args?: Record<string, unknown>
    ): Promise<{
        content: Array<{ type: string; text?: string; data?: unknown }>;
        isError?: boolean;
    }> {
        return this.rpcRequest('tools/call', {
            name,
            arguments: args || {},
        });
    }

    /**
     * Lista recursos disponíveis
     */
    async listResources(): Promise<{ resources: MCPResourceDefinition[] }> {
        return this.rpcRequest('resources/list');
    }

    /**
     * Lê um recurso
     */
    async readResource(uri: string): Promise<{
        contents: Array<{ uri: string; mimeType?: string; text?: string }>;
    }> {
        return this.rpcRequest('resources/read', { uri });
    }

    /**
     * Testa a conexão com o servidor MCP do N8N
     */
    async testConnection(): Promise<{
        success: boolean;
        serverInfo?: { name: string; version: string };
        toolCount?: number;
        error?: string;
    }> {
        try {
            const initResult = await this.initialize();
            const toolsResult = await this.listTools();

            return {
                success: true,
                serverInfo: initResult.serverInfo,
                toolCount: toolsResult.tools?.length || 0,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Obtém informações detalhadas das ferramentas
     */
    async getToolsInfo(): Promise<Array<{
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    }>> {
        const result = await this.listTools();

        return (result.tools || []).map(tool => ({
            name: tool.name,
            description: tool.description || 'Sem descrição',
            parameters: tool.inputSchema?.properties || {},
        }));
    }
}

// Instância configurável
let n8nMCPClientInstance: N8NMCPClient | null = null;

/**
 * Obtém ou cria instância do cliente MCP do N8N
 */
export function getN8NMCPClient(config?: N8NMCPConfig): N8NMCPClient {
    if (config) {
        n8nMCPClientInstance = new N8NMCPClient(config);
    }

    if (!n8nMCPClientInstance) {
        // Tentar configuração padrão via variáveis de ambiente
        const mcpUrl = process.env.N8N_MCP_URL || 'http://localhost:5678/mcp-server/http';
        const authToken = process.env.N8N_MCP_TOKEN || process.env.N8N_API_KEY;

        n8nMCPClientInstance = new N8NMCPClient({ mcpUrl, authToken });
    }

    return n8nMCPClientInstance;
}

/**
 * Reseta a instância do cliente (para testes)
 */
export function resetN8NMCPClient(): void {
    n8nMCPClientInstance = null;
}
