/**
 * PAGIA - MCP Server
 * Servidor Model Context Protocol para integração com IDEs
 *
 * @module mcp/mcp-server
 * @author Automações Comerciais Integradas
 */
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    handler: (params: Record<string, unknown>) => Promise<unknown>;
}
export interface MCPResource {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
    getter: () => Promise<string>;
}
/**
 * Classe MCPServer - Servidor Model Context Protocol
 */
export declare class MCPServer {
    private static instance;
    private app;
    private server;
    private wss;
    private tools;
    private resources;
    private clients;
    private port;
    private constructor();
    /**
     * Obtém instância singleton
     */
    static getInstance(): MCPServer;
    /**
     * Configura middleware
     */
    private setupMiddleware;
    /**
     * Configura rotas
     */
    private setupRoutes;
    /**
     * Processa mensagem JSON-RPC
     */
    private handleRPCMessage;
    /**
     * Registra ferramentas padrão
     */
    private registerDefaultTools;
    /**
     * Registra recursos padrão
     */
    private registerDefaultResources;
    /**
     * Registra uma ferramenta
     */
    registerTool(tool: MCPTool): void;
    /**
     * Remove uma ferramenta
     */
    unregisterTool(name: string): void;
    /**
     * Registra um recurso
     */
    registerResource(resource: MCPResource): void;
    /**
     * Remove um recurso
     */
    unregisterResource(uri: string): void;
    /**
     * Inicia o servidor
     */
    start(port?: number): Promise<void>;
    /**
     * Para o servidor
     */
    stop(): Promise<void>;
    /**
     * Envia atualização para todos os clientes
     */
    private broadcastUpdate;
    /**
     * Verifica se o servidor está rodando
     */
    isRunning(): boolean;
    /**
     * Obtém porta atual
     */
    getPort(): number;
}
export declare const mcpServer: MCPServer;
//# sourceMappingURL=mcp-server.d.ts.map