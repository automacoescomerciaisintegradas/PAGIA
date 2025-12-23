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
                return { agents: stats, serverUptime: process.uptime() };
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
