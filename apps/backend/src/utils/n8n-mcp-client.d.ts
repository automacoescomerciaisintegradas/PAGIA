/**
 * PAGIA - N8N MCP Client
 * Cliente para conectar ao servidor MCP do N8N
 *
 * @module utils/n8n-mcp-client
 * @author Automações Comerciais Integradas
 */
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
/**
 * Cliente MCP para conectar ao servidor MCP do N8N
 */
export declare class N8NMCPClient {
    private config;
    private headers;
    private requestId;
    constructor(config: N8NMCPConfig);
    /**
     * Faz requisição JSON-RPC para o servidor MCP
     */
    private rpcRequest;
    /**
     * Parseia resposta SSE do servidor MCP
     */
    private parseSSEResponse;
    /**
     * Inicializa conexão com o servidor MCP
     */
    initialize(): Promise<{
        protocolVersion: string;
        serverInfo: {
            name: string;
            version: string;
        };
        capabilities: Record<string, unknown>;
    }>;
    /**
     * Lista todas as ferramentas disponíveis no servidor MCP do N8N
     */
    listTools(): Promise<{
        tools: MCPToolDefinition[];
    }>;
    /**
     * Chama uma ferramenta no servidor MCP do N8N
     */
    callTool(name: string, args?: Record<string, unknown>): Promise<{
        content: Array<{
            type: string;
            text?: string;
            data?: unknown;
        }>;
        isError?: boolean;
    }>;
    /**
     * Lista recursos disponíveis
     */
    listResources(): Promise<{
        resources: MCPResourceDefinition[];
    }>;
    /**
     * Lê um recurso
     */
    readResource(uri: string): Promise<{
        contents: Array<{
            uri: string;
            mimeType?: string;
            text?: string;
        }>;
    }>;
    /**
     * Testa a conexão com o servidor MCP do N8N
     */
    testConnection(): Promise<{
        success: boolean;
        serverInfo?: {
            name: string;
            version: string;
        };
        toolCount?: number;
        error?: string;
    }>;
    /**
     * Obtém informações detalhadas das ferramentas
     */
    getToolsInfo(): Promise<Array<{
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    }>>;
}
/**
 * Obtém ou cria instância do cliente MCP do N8N
 */
export declare function getN8NMCPClient(config?: N8NMCPConfig): N8NMCPClient;
/**
 * Reseta a instância do cliente (para testes)
 */
export declare function resetN8NMCPClient(): void;
//# sourceMappingURL=n8n-mcp-client.d.ts.map