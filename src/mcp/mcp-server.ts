/**
 * PAGIA - MCP Server
 * Servidor Model Context Protocol para integração com IDEs
 * 
 * @module mcp/mcp-server
 * @author Automações Comerciais Integradas
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer, Server } from 'http';
import { eventBus, PAGIAEvents } from '../core/event-bus.js';
import { agentRegistry } from '../agents/agent-registry.js';
import { createKnowledgeBase } from '../knowledge/knowledge-base.js';
import { getConfigManager } from '../core/config-manager.js';
import { logger } from '../utils/logger.js';
import { pagiaNetwork } from '../agents/inngest-network.js';
import { ingestTool } from '../utils/ingest-tool.js';
import { getN8NClient, N8NConfig } from '../utils/n8n-client.js';
import { getN8NMCPClient, N8NMCPConfig } from '../utils/n8n-mcp-client.js';

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

interface MCPMessage {
    jsonrpc: '2.0';
    id?: string | number;
    method?: string;
    params?: unknown;
    result?: unknown;
    error?: { code: number; message: string; data?: unknown };
}

/**
 * Classe MCPServer - Servidor Model Context Protocol
 */
export class MCPServer {
    private static instance: MCPServer;
    private app: Express;
    private server: Server | null = null;
    private wss: WebSocketServer | null = null;
    private tools: Map<string, MCPTool> = new Map();
    private resources: Map<string, MCPResource> = new Map();
    private clients: Set<WebSocket> = new Set();
    private port: number = 3100;

    private constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.registerDefaultTools();
        this.registerDefaultResources();
    }

    /**
     * Obtém instância singleton
     */
    static getInstance(): MCPServer {
        if (!MCPServer.instance) {
            MCPServer.instance = new MCPServer();
        }
        return MCPServer.instance;
    }

    /**
     * Configura middleware
     */
    private setupMiddleware(): void {
        this.app.use(cors());
        this.app.use(express.json());

        // Logging middleware
        this.app.use((req: Request, _res: Response, next: NextFunction) => {
            logger.debug(`MCP ${req.method} ${req.path}`);
            next();
        });
    }

    /**
     * Configura rotas
     */
    private setupRoutes(): void {
        // Health check
        this.app.get('/health', (_req: Request, res: Response) => {
            res.json({ status: 'ok', version: '1.0.0' });
        });

        // Lista de ferramentas
        this.app.get('/tools', (_req: Request, res: Response) => {
            const tools = Array.from(this.tools.values()).map((t) => ({
                name: t.name,
                description: t.description,
                inputSchema: t.inputSchema,
            }));
            res.json({ tools });
        });

        // Executar ferramenta
        this.app.post('/tools/:name', async (req: Request, res: Response) => {
            try {
                const tool = this.tools.get(req.params.name);

                if (!tool) {
                    res.status(404).json({ error: 'Ferramenta não encontrada' });
                    return;
                }

                const result = await tool.handler(req.body);
                await eventBus.emit(PAGIAEvents.MCP_TOOL_CALLED, { tool: tool.name, params: req.body });
                res.json({ result });
            } catch (error) {
                res.status(500).json({ error: String(error) });
            }
        });

        // Lista de recursos
        this.app.get('/resources', (_req: Request, res: Response) => {
            const resources = Array.from(this.resources.values()).map((r) => ({
                uri: r.uri,
                name: r.name,
                description: r.description,
                mimeType: r.mimeType,
            }));
            res.json({ resources });
        });

        // Obter recurso
        this.app.get('/resources/:uri', async (req: Request, res: Response) => {
            try {
                const uri = `pagia://${req.params.uri}`;
                const resource = this.resources.get(uri);

                if (!resource) {
                    res.status(404).json({ error: 'Recurso não encontrado' });
                    return;
                }

                const content = await resource.getter();
                res.type(resource.mimeType).send(content);
            } catch (error) {
                res.status(500).json({ error: String(error) });
            }
        });

        // JSON-RPC endpoint
        this.app.post('/rpc', async (req: Request, res: Response) => {
            try {
                const message = req.body as MCPMessage;
                const response = await this.handleRPCMessage(message);
                res.json(response);
            } catch (error) {
                res.status(500).json({
                    jsonrpc: '2.0',
                    error: { code: -32000, message: String(error) },
                });
            }
        });
    }

    /**
     * Processa mensagem JSON-RPC
     */
    private async handleRPCMessage(message: MCPMessage): Promise<MCPMessage> {
        if (!message.method) {
            return {
                jsonrpc: '2.0',
                id: message.id,
                error: { code: -32600, message: 'Método não especificado' },
            };
        }

        switch (message.method) {
            case 'initialize':
                return {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: {
                        protocolVersion: '1.0',
                        serverInfo: { name: 'PAGIA MCP Server', version: '1.0.0' },
                        capabilities: {
                            tools: { listChanged: true },
                            resources: { subscribe: true },
                        },
                    },
                };

            case 'tools/list':
                return {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: {
                        tools: Array.from(this.tools.values()).map((t) => ({
                            name: t.name,
                            description: t.description,
                            inputSchema: t.inputSchema,
                        })),
                    },
                };

            case 'tools/call': {
                const params = message.params as { name: string; arguments: Record<string, unknown> };
                const tool = this.tools.get(params.name);

                if (!tool) {
                    return {
                        jsonrpc: '2.0',
                        id: message.id,
                        error: { code: -32601, message: 'Ferramenta não encontrada' },
                    };
                }

                try {
                    const result = await tool.handler(params.arguments);
                    return {
                        jsonrpc: '2.0',
                        id: message.id,
                        result: { content: [{ type: 'text', text: JSON.stringify(result) }] },
                    };
                } catch (error) {
                    return {
                        jsonrpc: '2.0',
                        id: message.id,
                        error: { code: -32000, message: String(error) },
                    };
                }
            }

            case 'resources/list':
                return {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: {
                        resources: Array.from(this.resources.values()).map((r) => ({
                            uri: r.uri,
                            name: r.name,
                            description: r.description,
                            mimeType: r.mimeType,
                        })),
                    },
                };

            case 'resources/read': {
                const params = message.params as { uri: string };
                const resource = this.resources.get(params.uri);

                if (!resource) {
                    return {
                        jsonrpc: '2.0',
                        id: message.id,
                        error: { code: -32601, message: 'Recurso não encontrado' },
                    };
                }

                const content = await resource.getter();
                return {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: { contents: [{ uri: resource.uri, mimeType: resource.mimeType, text: content }] },
                };
            }

            default:
                return {
                    jsonrpc: '2.0',
                    id: message.id,
                    error: { code: -32601, message: 'Método não suportado' },
                };
        }
    }

    /**
     * Registra ferramentas padrão
     */
    private registerDefaultTools(): void {
        // Ferramenta: Listar agentes
        this.registerTool({
            name: 'pagia.listAgents',
            description: 'Lista todos os agentes PAGIA disponíveis',
            inputSchema: {
                type: 'object',
                properties: {
                    module: { type: 'string', description: 'Filtrar por módulo' },
                },
            },
            handler: async (params) => {
                const agents = agentRegistry.list({ module: params.module as string });
                return agents.map((a) => ({ id: a.id, name: a.name, role: a.role, module: a.module }));
            },
        });

        // Ferramenta: Executar agente
        this.registerTool({
            name: 'pagia.executeAgent',
            description: 'Executa um agente PAGIA com um prompt',
            inputSchema: {
                type: 'object',
                properties: {
                    agentId: { type: 'string', description: 'ID do agente' },
                    prompt: { type: 'string', description: 'Prompt para o agente' },
                },
                required: ['agentId', 'prompt'],
            },
            handler: async (params) => {
                const agent = agentRegistry.get(params.agentId as string);
                if (!agent) throw new Error('Agente não encontrado');
                const result = await agent.safeExecute({ prompt: params.prompt as string });
                return result.content;
            },
        });

        // Ferramenta: Buscar conhecimento
        this.registerTool({
            name: 'pagia.searchKnowledge',
            description: 'Busca na base de conhecimento do projeto',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Termo de busca' },
                    limit: { type: 'number', description: 'Número máximo de resultados' },
                },
                required: ['query'],
            },
            handler: async (params) => {
                const configManager = getConfigManager();
                const kb = createKnowledgeBase(configManager.resolvePagiaPath('knowledge'));
                const results = await kb.search(params.query as string, { limit: (params.limit as number) || 5 });
                return results.map((r) => ({ title: r.document.title, similarity: r.overallSimilarity, chunks: r.relevantChunks }));
            },
        });

        // Ferramenta: Status
        this.registerTool({
            name: 'pagia.status',
            description: 'Obtém status do PAGIA',
            inputSchema: { type: 'object', properties: {} },
            handler: async () => {
                const stats = agentRegistry.getStats();
                const networkStats = pagiaNetwork.getStats();
                return {
                    agents: stats,
                    networks: networkStats,
                    serverUptime: process.uptime()
                };
            },
        });

        // Ferramenta: Criar rede AgentKit
        this.registerTool({
            name: 'pagia.createNetwork',
            description: 'Cria uma rede de agentes usando AgentKit',
            inputSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Nome da rede' },
                    type: { type: 'string', description: 'Tipo: default ou custom', enum: ['default', 'custom'] },
                    agentIds: { type: 'array', items: { type: 'string' }, description: 'IDs dos agentes (para custom)' },
                },
                required: ['name'],
            },
            handler: async (params) => {
                const name = params.name as string;
                const type = (params.type as string) || 'default';

                if (type === 'custom' && params.agentIds) {
                    await pagiaNetwork.createCustomNetwork(name, params.agentIds as string[]);
                } else {
                    pagiaNetwork.createDefaultNetwork({ name });
                }

                return { success: true, network: name };
            },
        });

        // Ferramenta: Executar rede
        this.registerTool({
            name: 'pagia.runNetwork',
            description: 'Executa uma rede de agentes com uma tarefa',
            inputSchema: {
                type: 'object',
                properties: {
                    network: { type: 'string', description: 'Nome da rede' },
                    input: { type: 'string', description: 'Tarefa/input para a rede' },
                },
                required: ['network', 'input'],
            },
            handler: async (params) => {
                const result = await pagiaNetwork.runNetwork(
                    params.network as string,
                    params.input as string
                );
                return result;
            },
        });

        // Ferramenta: Listar redes
        this.registerTool({
            name: 'pagia.listNetworks',
            description: 'Lista todas as redes de agentes disponíveis',
            inputSchema: { type: 'object', properties: {} },
            handler: async () => {
                return pagiaNetwork.listNetworks();
            },
        });

        // Ferramenta: Ingest código
        this.registerTool({
            name: 'pagia.ingestCode',
            description: 'Processa diretório de código para contexto de LLM',
            inputSchema: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Caminho do diretório' },
                    compress: { type: 'boolean', description: 'Comprimir código (default: true)' },
                    maxTokens: { type: 'number', description: 'Limite de tokens' },
                },
                required: ['path'],
            },
            handler: async (params) => {
                const result = await ingestTool.processForLLM(
                    params.path as string,
                    {
                        compress: (params.compress as boolean) ?? true,
                        maxTokens: params.maxTokens as number,
                    }
                );
                return {
                    success: result.success,
                    tokens: result.tokens,
                    preview: result.content?.substring(0, 500),
                    error: result.error,
                };
            },
        });

        // Ferramenta: Ingest URL
        this.registerTool({
            name: 'pagia.ingestURL',
            description: 'Processa URL/website para contexto de LLM',
            inputSchema: {
                type: 'object',
                properties: {
                    url: { type: 'string', description: 'URL a processar' },
                    depth: { type: 'number', description: 'Profundidade de crawling' },
                },
                required: ['url'],
            },
            handler: async (params) => {
                const result = await ingestTool.processURL(
                    params.url as string,
                    { depth: params.depth as number }
                );
                return {
                    success: result.success,
                    tokens: result.tokens,
                    preview: result.content?.substring(0, 500),
                    error: result.error,
                };
            },
        });

        // ========================================
        // Ferramentas de integração com N8N
        // ========================================

        // Ferramenta: Configurar N8N
        this.registerTool({
            name: 'pagia.n8n.configure',
            description: 'Configura a conexão com o N8N',
            inputSchema: {
                type: 'object',
                properties: {
                    baseUrl: { type: 'string', description: 'URL base do N8N (ex: http://localhost:5678)' },
                    apiKey: { type: 'string', description: 'API Key do N8N (opcional)' },
                },
                required: ['baseUrl'],
            },
            handler: async (params) => {
                const config: N8NConfig = {
                    baseUrl: params.baseUrl as string,
                    apiKey: params.apiKey as string | undefined,
                };
                const client = getN8NClient(config);
                const test = await client.testConnection();
                return test;
            },
        });

        // Ferramenta: Listar ferramentas do N8N
        this.registerTool({
            name: 'pagia.n8n.listTools',
            description: 'Lista todas as ferramentas/nodes disponíveis nos workflows ativos do N8N',
            inputSchema: {
                type: 'object',
                properties: {
                    baseUrl: { type: 'string', description: 'URL base do N8N (opcional se já configurado)' },
                    apiKey: { type: 'string', description: 'API Key do N8N (opcional)' },
                },
            },
            handler: async (params) => {
                let client = getN8NClient();

                // Se forneceu URL, reconfigurar
                if (params.baseUrl) {
                    client = getN8NClient({
                        baseUrl: params.baseUrl as string,
                        apiKey: params.apiKey as string | undefined,
                    });
                }

                const tools = await client.listTools();
                return {
                    count: tools.length,
                    tools: tools.map(t => ({
                        name: t.name,
                        description: t.description,
                        workflowName: t.workflowName,
                        nodeType: t.nodeType,
                        parameters: t.parameters,
                    })),
                };
            },
        });

        // Ferramenta: Listar workflows do N8N
        this.registerTool({
            name: 'pagia.n8n.listWorkflows',
            description: 'Lista todos os workflows do N8N',
            inputSchema: {
                type: 'object',
                properties: {
                    activeOnly: { type: 'boolean', description: 'Listar apenas workflows ativos' },
                },
            },
            handler: async (params) => {
                const client = getN8NClient();
                let workflows = await client.listWorkflows();

                if (params.activeOnly) {
                    workflows = workflows.filter(w => w.active);
                }

                return {
                    count: workflows.length,
                    workflows: workflows.map(w => ({
                        id: w.id,
                        name: w.name,
                        active: w.active,
                        updatedAt: w.updatedAt,
                    })),
                };
            },
        });

        // Ferramenta: Chamar webhook do N8N
        this.registerTool({
            name: 'pagia.n8n.callWebhook',
            description: 'Chama um webhook do N8N',
            inputSchema: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Path do webhook (sem /webhook/)' },
                    data: { type: 'object', description: 'Dados a enviar para o webhook' },
                    method: { type: 'string', enum: ['GET', 'POST'], description: 'Método HTTP (default: POST)' },
                },
                required: ['path'],
            },
            handler: async (params) => {
                const client = getN8NClient();
                const result = await client.callWebhook(
                    params.path as string,
                    params.data as Record<string, unknown>,
                    (params.method as 'GET' | 'POST') || 'POST'
                );
                return result;
            },
        });

        // Ferramenta: Executar workflow do N8N
        this.registerTool({
            name: 'pagia.n8n.executeWorkflow',
            description: 'Executa um workflow do N8N por ID',
            inputSchema: {
                type: 'object',
                properties: {
                    workflowId: { type: 'string', description: 'ID do workflow' },
                    data: { type: 'object', description: 'Dados de entrada para o workflow' },
                },
                required: ['workflowId'],
            },
            handler: async (params) => {
                const client = getN8NClient();
                const result = await client.executeWorkflow(
                    params.workflowId as string,
                    params.data as Record<string, unknown>
                );
                return {
                    executionId: result.id,
                    status: result.status,
                    finished: result.finished,
                };
            },
        });

        // Ferramenta: Testar conexão N8N
        this.registerTool({
            name: 'pagia.n8n.testConnection',
            description: 'Testa a conexão com o N8N',
            inputSchema: {
                type: 'object',
                properties: {
                    baseUrl: { type: 'string', description: 'URL base do N8N (opcional se já configurado)' },
                    apiKey: { type: 'string', description: 'API Key do N8N (opcional)' },
                },
            },
            handler: async (params) => {
                let client = getN8NClient();

                if (params.baseUrl) {
                    client = getN8NClient({
                        baseUrl: params.baseUrl as string,
                        apiKey: params.apiKey as string | undefined,
                    });
                }

                return await client.testConnection();
            },
        });

        // ========================================
        // Ferramentas MCP para servidor MCP do N8N
        // ========================================

        // Ferramenta: Configurar conexão MCP com N8N
        this.registerTool({
            name: 'pagia.n8n.mcp.configure',
            description: 'Configura conexão com o servidor MCP do N8N',
            inputSchema: {
                type: 'object',
                properties: {
                    mcpUrl: { type: 'string', description: 'URL do servidor MCP do N8N (ex: https://n8n.example.com/mcp-server/http)' },
                    authToken: { type: 'string', description: 'Token de autenticação (Bearer token ou API Key)' },
                    authType: { type: 'string', enum: ['bearer', 'header'], description: 'Tipo de autenticação (default: bearer)' },
                },
                required: ['mcpUrl'],
            },
            handler: async (params) => {
                const config: N8NMCPConfig = {
                    mcpUrl: params.mcpUrl as string,
                    authToken: params.authToken as string | undefined,
                    authType: (params.authType as 'bearer' | 'header') || 'bearer',
                };
                const client = getN8NMCPClient(config);
                const test = await client.testConnection();
                return test;
            },
        });

        // Ferramenta: Listar tools do servidor MCP do N8N
        this.registerTool({
            name: 'pagia.n8n.mcp.listTools',
            description: 'Lista todas as ferramentas disponíveis no servidor MCP do N8N',
            inputSchema: {
                type: 'object',
                properties: {
                    mcpUrl: { type: 'string', description: 'URL do servidor MCP do N8N (opcional se já configurado)' },
                    authToken: { type: 'string', description: 'Token de autenticação (opcional se já configurado)' },
                },
            },
            handler: async (params) => {
                let client = getN8NMCPClient();

                if (params.mcpUrl) {
                    client = getN8NMCPClient({
                        mcpUrl: params.mcpUrl as string,
                        authToken: params.authToken as string | undefined,
                    });
                }

                const toolsInfo = await client.getToolsInfo();
                return {
                    count: toolsInfo.length,
                    tools: toolsInfo,
                };
            },
        });

        // Ferramenta: Chamar tool no servidor MCP do N8N
        this.registerTool({
            name: 'pagia.n8n.mcp.callTool',
            description: 'Chama uma ferramenta no servidor MCP do N8N',
            inputSchema: {
                type: 'object',
                properties: {
                    toolName: { type: 'string', description: 'Nome da ferramenta a chamar' },
                    args: { type: 'object', description: 'Argumentos para a ferramenta' },
                },
                required: ['toolName'],
            },
            handler: async (params) => {
                const client = getN8NMCPClient();
                const result = await client.callTool(
                    params.toolName as string,
                    params.args as Record<string, unknown>
                );
                return result;
            },
        });

        // Ferramenta: Testar conexão MCP com N8N
        this.registerTool({
            name: 'pagia.n8n.mcp.testConnection',
            description: 'Testa a conexão com o servidor MCP do N8N',
            inputSchema: {
                type: 'object',
                properties: {
                    mcpUrl: { type: 'string', description: 'URL do servidor MCP do N8N' },
                    authToken: { type: 'string', description: 'Token de autenticação' },
                },
            },
            handler: async (params) => {
                let client = getN8NMCPClient();

                if (params.mcpUrl) {
                    client = getN8NMCPClient({
                        mcpUrl: params.mcpUrl as string,
                        authToken: params.authToken as string | undefined,
                    });
                }

                return await client.testConnection();
            },
        });
    }

    /**
     * Registra recursos padrão
     */
    private registerDefaultResources(): void {
        // Recurso: Configuração
        this.registerResource({
            uri: 'pagia://config',
            name: 'Configuração PAGIA',
            description: 'Configuração atual do projeto',
            mimeType: 'application/json',
            getter: async () => {
                const configManager = getConfigManager();
                const config = configManager.load();
                return JSON.stringify(config, null, 2);
            },
        });

        // Recurso: Agentes
        this.registerResource({
            uri: 'pagia://agents',
            name: 'Lista de Agentes',
            description: 'Agentes registrados no PAGIA',
            mimeType: 'application/json',
            getter: async () => {
                const agents = agentRegistry.list();
                return JSON.stringify(agents.map((a) => a.toJSON()), null, 2);
            },
        });
    }

    /**
     * Registra uma ferramenta
     */
    registerTool(tool: MCPTool): void {
        this.tools.set(tool.name, tool);
        this.broadcastUpdate('tools/list_changed');
    }

    /**
     * Remove uma ferramenta
     */
    unregisterTool(name: string): void {
        this.tools.delete(name);
        this.broadcastUpdate('tools/list_changed');
    }

    /**
     * Registra um recurso
     */
    registerResource(resource: MCPResource): void {
        this.resources.set(resource.uri, resource);
    }

    /**
     * Remove um recurso
     */
    unregisterResource(uri: string): void {
        this.resources.delete(uri);
    }

    /**
     * Inicia o servidor
     */
    async start(port?: number): Promise<void> {
        this.port = port || this.port;

        return new Promise((resolve) => {
            this.server = createServer(this.app);

            // Setup WebSocket
            this.wss = new WebSocketServer({ server: this.server });

            this.wss.on('connection', (ws: WebSocket) => {
                this.clients.add(ws);
                logger.info('Cliente MCP conectado');

                ws.on('message', async (data: Buffer) => {
                    try {
                        const message = JSON.parse(data.toString()) as MCPMessage;
                        const response = await this.handleRPCMessage(message);
                        ws.send(JSON.stringify(response));
                    } catch (error) {
                        ws.send(JSON.stringify({
                            jsonrpc: '2.0',
                            error: { code: -32700, message: 'Parse error' },
                        }));
                    }
                });

                ws.on('close', () => {
                    this.clients.delete(ws);
                    logger.info('Cliente MCP desconectado');
                });
            });

            this.server.listen(this.port, () => {
                logger.success(`Servidor MCP iniciado em http://localhost:${this.port}`);
                eventBus.emit(PAGIAEvents.MCP_CONNECTED, { port: this.port });
                resolve();
            });
        });
    }

    /**
     * Para o servidor
     */
    async stop(): Promise<void> {
        return new Promise((resolve) => {
            if (this.wss) {
                this.clients.forEach((client) => client.close());
                this.wss.close();
            }

            if (this.server) {
                this.server.close(() => {
                    logger.info('Servidor MCP parado');
                    eventBus.emit(PAGIAEvents.MCP_DISCONNECTED, {});
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Envia atualização para todos os clientes
     */
    private broadcastUpdate(type: string): void {
        const message = JSON.stringify({
            jsonrpc: '2.0',
            method: 'notifications/' + type,
        });

        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    /**
     * Verifica se o servidor está rodando
     */
    isRunning(): boolean {
        return this.server !== null && this.server.listening;
    }

    /**
     * Obtém porta atual
     */
    getPort(): number {
        return this.port;
    }
}

// Singleton exportado
export const mcpServer = MCPServer.getInstance();
