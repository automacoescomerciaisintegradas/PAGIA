/**
 * PAGIA - MCP Server
 * Servidor Model Context Protocol para integração com IDEs
 *
 * @module mcp/mcp-server
 * @author Automações Comerciais Integradas
 */
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { eventBus, PAGIAEvents } from '../core/event-bus.js';
import { agentRegistry } from '../agents/agent-registry.js';
import { createKnowledgeBase } from '../knowledge/knowledge-base.js';
import { getConfigManager } from '../core/config-manager.js';
import { logger } from '../utils/logger.js';
import { pagiaNetwork } from '../agents/inngest-network.js';
import { ingestTool } from '../utils/ingest-tool.js';
import { getN8NClient } from '../utils/n8n-client.js';
import { getN8NMCPClient } from '../utils/n8n-mcp-client.js';
/**
 * Classe MCPServer - Servidor Model Context Protocol
 */
export class MCPServer {
    static instance;
    app;
    server = null;
    wss = null;
    tools = new Map();
    resources = new Map();
    clients = new Set();
    port = 3100;
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.registerDefaultTools();
        this.registerDefaultResources();
    }
    /**
     * Obtém instância singleton
     */
    static getInstance() {
        if (!MCPServer.instance) {
            MCPServer.instance = new MCPServer();
        }
        return MCPServer.instance;
    }
    /**
     * Configura middleware
     */
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        // Logging middleware
        this.app.use((req, _res, next) => {
            logger.debug(`MCP ${req.method} ${req.path}`);
            next();
        });
    }
    /**
     * Configura rotas
     */
    setupRoutes() {
        // Health check
        this.app.get('/health', (_req, res) => {
            res.json({ status: 'ok', version: '1.0.0' });
        });
        // Lista de ferramentas
        this.app.get('/tools', (_req, res) => {
            const tools = Array.from(this.tools.values()).map((t) => ({
                name: t.name,
                description: t.description,
                inputSchema: t.inputSchema,
            }));
            res.json({ tools });
        });
        // Executar ferramenta
        this.app.post('/tools/:name', async (req, res) => {
            try {
                const tool = this.tools.get(req.params.name);
                if (!tool) {
                    res.status(404).json({ error: 'Ferramenta não encontrada' });
                    return;
                }
                const result = await tool.handler(req.body);
                await eventBus.emit(PAGIAEvents.MCP_TOOL_CALLED, { tool: tool.name, params: req.body });
                res.json({ result });
            }
            catch (error) {
                res.status(500).json({ error: String(error) });
            }
        });
        // Lista de recursos
        this.app.get('/resources', (_req, res) => {
            const resources = Array.from(this.resources.values()).map((r) => ({
                uri: r.uri,
                name: r.name,
                description: r.description,
                mimeType: r.mimeType,
            }));
            res.json({ resources });
        });
        // Obter recurso
        this.app.get('/resources/:uri', async (req, res) => {
            try {
                const uri = `pagia://${req.params.uri}`;
                const resource = this.resources.get(uri);
                if (!resource) {
                    res.status(404).json({ error: 'Recurso não encontrado' });
                    return;
                }
                const content = await resource.getter();
                res.type(resource.mimeType).send(content);
            }
            catch (error) {
                res.status(500).json({ error: String(error) });
            }
        });
        // JSON-RPC endpoint
        this.app.post('/rpc', async (req, res) => {
            try {
                const message = req.body;
                const response = await this.handleRPCMessage(message);
                res.json(response);
            }
            catch (error) {
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
    async handleRPCMessage(message) {
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
                const params = message.params;
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
                }
                catch (error) {
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
                const params = message.params;
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
    registerDefaultTools() {
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
                const agents = agentRegistry.list({ module: params.module });
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
                const agent = agentRegistry.get(params.agentId);
                if (!agent)
                    throw new Error('Agente não encontrado');
                const result = await agent.safeExecute({ prompt: params.prompt });
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
                const results = await kb.search(params.query, { limit: params.limit || 5 });
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
                const name = params.name;
                const type = params.type || 'default';
                if (type === 'custom' && params.agentIds) {
                    await pagiaNetwork.createCustomNetwork(name, params.agentIds);
                }
                else {
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
                const result = await pagiaNetwork.runNetwork(params.network, params.input);
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
                const result = await ingestTool.processForLLM(params.path, {
                    compress: params.compress ?? true,
                    maxTokens: params.maxTokens,
                });
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
                const result = await ingestTool.processURL(params.url, { depth: params.depth });
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
                const config = {
                    baseUrl: params.baseUrl,
                    apiKey: params.apiKey,
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
                        baseUrl: params.baseUrl,
                        apiKey: params.apiKey,
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
                const result = await client.callWebhook(params.path, params.data, params.method || 'POST');
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
                const result = await client.executeWorkflow(params.workflowId, params.data);
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
                        baseUrl: params.baseUrl,
                        apiKey: params.apiKey,
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
                const config = {
                    mcpUrl: params.mcpUrl,
                    authToken: params.authToken,
                    authType: params.authType || 'bearer',
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
                        mcpUrl: params.mcpUrl,
                        authToken: params.authToken,
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
                const result = await client.callTool(params.toolName, params.args);
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
                        mcpUrl: params.mcpUrl,
                        authToken: params.authToken,
                    });
                }
                return await client.testConnection();
            },
        });
        // ========================================
        // Ferramentas de Gerenciamento de Planos
        // ========================================
        // Ferramenta: Criar plano
        this.registerTool({
            name: 'pagia.plan.create',
            description: 'Cria um novo plano de ação PAGIA',
            inputSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Nome do plano' },
                    type: { type: 'string', enum: ['global', 'stage', 'prompt', 'ai'], description: 'Tipo de plano (default: global)' },
                    description: { type: 'string', description: 'Descrição do plano' },
                    objectives: { type: 'array', items: { type: 'string' }, description: 'Lista de objetivos' },
                    stages: { type: 'array', items: { type: 'string' }, description: 'Lista de etapas' },
                    milestones: { type: 'array', items: { type: 'string' }, description: 'Lista de marcos' },
                },
                required: ['name'],
            },
            handler: async (params) => {
                const { existsSync, writeFileSync, mkdirSync } = await import('fs');
                const { stringify: stringifyYaml } = await import('yaml');
                const configManager = getConfigManager();
                const planType = params.type || 'global';
                const planName = params.name;
                const planFolder = configManager.resolvePagiaPath(`plans/${planType === 'ai' ? 'ai' : planType}`);
                // Criar diretório se não existir
                if (!existsSync(planFolder)) {
                    mkdirSync(planFolder, { recursive: true });
                }
                // Gerar ID único
                const id = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
                const filename = planName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') + '.yaml';
                const planFile = `${planFolder}/${filename}`;
                const plan = {
                    id,
                    name: planName,
                    description: params.description || '',
                    objectives: params.objectives || [],
                    stages: params.stages || [],
                    milestones: params.milestones || [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                writeFileSync(planFile, stringifyYaml(plan, { indent: 2 }), 'utf-8');
                return {
                    success: true,
                    plan: {
                        id,
                        name: planName,
                        type: planType,
                        file: planFile,
                    },
                };
            },
        });
        // Ferramenta: Listar planos
        this.registerTool({
            name: 'pagia.plan.list',
            description: 'Lista todos os planos de ação PAGIA',
            inputSchema: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: ['global', 'stage', 'prompt', 'ai', 'all'], description: 'Filtrar por tipo (default: all)' },
                },
            },
            handler: async (params) => {
                const { existsSync, readdirSync, readFileSync } = await import('fs');
                const { parse: parseYaml } = await import('yaml');
                const configManager = getConfigManager();
                const planTypes = ['global', 'stages', 'prompts', 'ai'];
                const filterType = params.type;
                const plans = [];
                for (const type of planTypes) {
                    if (filterType && filterType !== 'all' && type !== filterType && type !== filterType + 's') {
                        continue;
                    }
                    const folder = configManager.resolvePagiaPath(`plans/${type}`);
                    if (!existsSync(folder))
                        continue;
                    const files = readdirSync(folder).filter(f => f.endsWith('.yaml'));
                    for (const file of files) {
                        try {
                            const content = readFileSync(`${folder}/${file}`, 'utf-8');
                            const plan = parseYaml(content);
                            plans.push({
                                type: type === 'stages' ? 'stage' : type === 'prompts' ? 'prompt' : type,
                                name: plan.name || file.replace('.yaml', ''),
                                id: plan.id || '',
                                description: plan.description || '',
                            });
                        }
                        catch {
                            // Ignorar arquivos inválidos
                        }
                    }
                }
                return {
                    count: plans.length,
                    plans,
                };
            },
        });
        // Ferramenta: Visualizar plano
        this.registerTool({
            name: 'pagia.plan.view',
            description: 'Visualiza detalhes de um plano específico',
            inputSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Nome do plano' },
                },
                required: ['name'],
            },
            handler: async (params) => {
                const { existsSync, readdirSync, readFileSync } = await import('fs');
                const { parse: parseYaml } = await import('yaml');
                const configManager = getConfigManager();
                const planName = params.name;
                const searchName = planName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const planTypes = ['global', 'stages', 'prompts', 'ai'];
                for (const type of planTypes) {
                    const folder = configManager.resolvePagiaPath(`plans/${type}`);
                    if (!existsSync(folder))
                        continue;
                    const files = readdirSync(folder).filter(f => f.endsWith('.yaml'));
                    for (const file of files) {
                        if (file.includes(searchName) || file === `${searchName}.yaml`) {
                            const content = readFileSync(`${folder}/${file}`, 'utf-8');
                            const plan = parseYaml(content);
                            return {
                                found: true,
                                type: type === 'stages' ? 'stage' : type === 'prompts' ? 'prompt' : type,
                                plan,
                            };
                        }
                    }
                }
                return { found: false, error: `Plano "${planName}" não encontrado` };
            },
        });
        // Ferramenta: Atualizar plano
        this.registerTool({
            name: 'pagia.plan.update',
            description: 'Atualiza um plano existente',
            inputSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Nome do plano a atualizar' },
                    description: { type: 'string', description: 'Nova descrição' },
                    objectives: { type: 'array', items: { type: 'string' }, description: 'Novos objetivos (substitui existentes)' },
                    stages: { type: 'array', items: { type: 'string' }, description: 'Novas etapas (substitui existentes)' },
                    milestones: { type: 'array', items: { type: 'string' }, description: 'Novos marcos (substitui existentes)' },
                    addObjective: { type: 'string', description: 'Adicionar um objetivo' },
                    addStage: { type: 'string', description: 'Adicionar uma etapa' },
                    addMilestone: { type: 'string', description: 'Adicionar um marco' },
                },
                required: ['name'],
            },
            handler: async (params) => {
                const { existsSync, readdirSync, readFileSync, writeFileSync } = await import('fs');
                const { parse: parseYaml, stringify: stringifyYaml } = await import('yaml');
                const configManager = getConfigManager();
                const planName = params.name;
                const searchName = planName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const planTypes = ['global', 'stages', 'prompts', 'ai'];
                for (const type of planTypes) {
                    const folder = configManager.resolvePagiaPath(`plans/${type}`);
                    if (!existsSync(folder))
                        continue;
                    const files = readdirSync(folder).filter(f => f.endsWith('.yaml'));
                    for (const file of files) {
                        if (file.includes(searchName) || file === `${searchName}.yaml`) {
                            const filePath = `${folder}/${file}`;
                            const content = readFileSync(filePath, 'utf-8');
                            const plan = parseYaml(content);
                            // Atualizar campos
                            if (params.description !== undefined)
                                plan.description = params.description;
                            if (params.objectives !== undefined)
                                plan.objectives = params.objectives;
                            if (params.stages !== undefined)
                                plan.stages = params.stages;
                            if (params.milestones !== undefined)
                                plan.milestones = params.milestones;
                            // Adicionar itens individuais
                            if (params.addObjective) {
                                plan.objectives = plan.objectives || [];
                                plan.objectives.push(params.addObjective);
                            }
                            if (params.addStage) {
                                plan.stages = plan.stages || [];
                                plan.stages.push(params.addStage);
                            }
                            if (params.addMilestone) {
                                plan.milestones = plan.milestones || [];
                                plan.milestones.push(params.addMilestone);
                            }
                            plan.updatedAt = new Date().toISOString();
                            writeFileSync(filePath, stringifyYaml(plan, { indent: 2 }), 'utf-8');
                            return {
                                success: true,
                                plan,
                            };
                        }
                    }
                }
                return { success: false, error: `Plano "${planName}" não encontrado` };
            },
        });
        // Ferramenta: Deletar plano
        this.registerTool({
            name: 'pagia.plan.delete',
            description: 'Remove um plano existente',
            inputSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Nome do plano a deletar' },
                },
                required: ['name'],
            },
            handler: async (params) => {
                const { existsSync, readdirSync, unlinkSync } = await import('fs');
                const configManager = getConfigManager();
                const planName = params.name;
                const searchName = planName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const planTypes = ['global', 'stages', 'prompts', 'ai'];
                for (const type of planTypes) {
                    const folder = configManager.resolvePagiaPath(`plans/${type}`);
                    if (!existsSync(folder))
                        continue;
                    const files = readdirSync(folder).filter(f => f.endsWith('.yaml'));
                    for (const file of files) {
                        if (file.includes(searchName) || file === `${searchName}.yaml`) {
                            const filePath = `${folder}/${file}`;
                            unlinkSync(filePath);
                            return {
                                success: true,
                                deleted: planName,
                                file: filePath,
                            };
                        }
                    }
                }
                return { success: false, error: `Plano "${planName}" não encontrado` };
            },
        });
    }
    /**
     * Registra recursos padrão
     */
    registerDefaultResources() {
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
    registerTool(tool) {
        this.tools.set(tool.name, tool);
        this.broadcastUpdate('tools/list_changed');
    }
    /**
     * Remove uma ferramenta
     */
    unregisterTool(name) {
        this.tools.delete(name);
        this.broadcastUpdate('tools/list_changed');
    }
    /**
     * Registra um recurso
     */
    registerResource(resource) {
        this.resources.set(resource.uri, resource);
    }
    /**
     * Remove um recurso
     */
    unregisterResource(uri) {
        this.resources.delete(uri);
    }
    /**
     * Inicia o servidor
     */
    async start(port) {
        this.port = port || this.port;
        return new Promise((resolve) => {
            this.server = createServer(this.app);
            // Setup WebSocket
            this.wss = new WebSocketServer({ server: this.server });
            this.wss.on('connection', (ws) => {
                this.clients.add(ws);
                logger.info('Cliente MCP conectado');
                ws.on('message', async (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        const response = await this.handleRPCMessage(message);
                        ws.send(JSON.stringify(response));
                    }
                    catch (error) {
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
    async stop() {
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
            }
            else {
                resolve();
            }
        });
    }
    /**
     * Envia atualização para todos os clientes
     */
    broadcastUpdate(type) {
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
    isRunning() {
        return this.server !== null && this.server.listening;
    }
    /**
     * Obtém porta atual
     */
    getPort() {
        return this.port;
    }
}
// Singleton exportado
export const mcpServer = MCPServer.getInstance();
//# sourceMappingURL=mcp-server.js.map