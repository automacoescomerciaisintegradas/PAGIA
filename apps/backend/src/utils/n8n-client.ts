/**
 * PAGIA - N8N Client
 * Cliente para integração com N8N via API
 * 
 * @module utils/n8n-client
 * @author Automações Comerciais Integradas
 */

import { logger } from './logger.js';

export interface N8NConfig {
    baseUrl: string;
    apiKey?: string;
}

export interface N8NWorkflow {
    id: string;
    name: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    nodes?: N8NNode[];
    tags?: Array<{ id: string; name: string }>;
}

export interface N8NNode {
    id: string;
    name: string;
    type: string;
    typeVersion: number;
    position: [number, number];
    parameters?: Record<string, unknown>;
    credentials?: Record<string, unknown>;
}

export interface N8NTool {
    name: string;
    description: string;
    workflowId: string;
    workflowName: string;
    nodeType: string;
    parameters?: Record<string, unknown>;
}

export interface N8NCredential {
    id: string;
    name: string;
    type: string;
    createdAt: string;
    updatedAt: string;
}

export interface N8NExecution {
    id: string;
    workflowId: string;
    finished: boolean;
    startedAt: string;
    stoppedAt?: string;
    status: string;
    data?: Record<string, unknown>;
}

/**
 * Cliente N8N para integração com a API
 */
export class N8NClient {
    private config: N8NConfig;
    private headers: Record<string, string>;

    constructor(config: N8NConfig) {
        this.config = {
            baseUrl: config.baseUrl.replace(/\/$/, ''), // Remove trailing slash
            apiKey: config.apiKey
        };

        this.headers = {
            'Content-Type': 'application/json',
        };

        if (this.config.apiKey) {
            this.headers['X-N8N-API-KEY'] = this.config.apiKey;
        }
    }

    /**
     * Faz requisição para a API do n8n
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.config.baseUrl}/api/v1${endpoint}`;

        logger.debug(`N8N Request: ${options.method || 'GET'} ${url}`);

        const response = await fetch(url, {
            ...options,
            headers: {
                ...this.headers,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`N8N API Error (${response.status}): ${error}`);
        }

        return response.json() as Promise<T>;
    }

    /**
     * Lista todos os workflows
     */
    async listWorkflows(): Promise<N8NWorkflow[]> {
        const response = await this.request<{ data: N8NWorkflow[] }>('/workflows');
        return response.data || [];
    }

    /**
     * Obtém um workflow específico
     */
    async getWorkflow(id: string): Promise<N8NWorkflow> {
        return this.request<N8NWorkflow>(`/workflows/${id}`);
    }

    /**
     * Lista todas as credenciais
     */
    async listCredentials(): Promise<N8NCredential[]> {
        const response = await this.request<{ data: N8NCredential[] }>('/credentials');
        return response.data || [];
    }

    /**
     * Executa um workflow
     */
    async executeWorkflow(
        id: string,
        data?: Record<string, unknown>
    ): Promise<N8NExecution> {
        return this.request<N8NExecution>(`/workflows/${id}/execute`, {
            method: 'POST',
            body: JSON.stringify({ data }),
        });
    }

    /**
     * Lista execuções de um workflow
     */
    async listExecutions(workflowId?: string): Promise<N8NExecution[]> {
        const endpoint = workflowId
            ? `/executions?workflowId=${workflowId}`
            : '/executions';
        const response = await this.request<{ data: N8NExecution[] }>(endpoint);
        return response.data || [];
    }

    /**
     * Extrai ferramentas/nodes de todos os workflows ativos
     */
    async listTools(): Promise<N8NTool[]> {
        const workflows = await this.listWorkflows();
        const tools: N8NTool[] = [];

        // Node types que são considerados "tools"
        const toolNodeTypes = [
            'n8n-nodes-base.httpRequest',
            'n8n-nodes-base.function',
            'n8n-nodes-base.webhook',
            'n8n-nodes-base.executeWorkflow',
            '@n8n/n8n-nodes-langchain.toolWorkflow',
            '@n8n/n8n-nodes-langchain.toolCode',
            '@n8n/n8n-nodes-langchain.toolHttp',
            'n8n-nodes-base.code',
            'n8n-nodes-base.set',
        ];

        for (const workflow of workflows) {
            if (!workflow.active) continue;

            // Buscar detalhes do workflow para obter os nodes
            try {
                const fullWorkflow = await this.getWorkflow(workflow.id);

                if (fullWorkflow.nodes) {
                    for (const node of fullWorkflow.nodes) {
                        // Verificar se é um tipo de node que pode ser usado como tool
                        if (toolNodeTypes.includes(node.type)) {
                            tools.push({
                                name: `${workflow.name}.${node.name}`.replace(/\s+/g, '_'),
                                description: `Node "${node.name}" do workflow "${workflow.name}"`,
                                workflowId: workflow.id,
                                workflowName: workflow.name,
                                nodeType: node.type,
                                parameters: node.parameters,
                            });
                        }

                        // Webhook como trigger = workflow acessível via HTTP
                        if (node.type === 'n8n-nodes-base.webhook') {
                            const webhookPath = (node.parameters?.path as string) || workflow.id;
                            tools.push({
                                name: `webhook.${workflow.name}`.replace(/\s+/g, '_'),
                                description: `Webhook: ${workflow.name} - POST ${this.config.baseUrl}/webhook/${webhookPath}`,
                                workflowId: workflow.id,
                                workflowName: workflow.name,
                                nodeType: 'webhook',
                                parameters: {
                                    url: `${this.config.baseUrl}/webhook/${webhookPath}`,
                                    method: 'POST'
                                },
                            });
                        }
                    }
                }
            } catch (error) {
                logger.warn(`Não foi possível obter detalhes do workflow ${workflow.id}: ${error}`);
            }
        }

        return tools;
    }

    /**
     * Chama um webhook do n8n
     */
    async callWebhook(
        path: string,
        data?: Record<string, unknown>,
        method: 'GET' | 'POST' = 'POST'
    ): Promise<unknown> {
        const url = `${this.config.baseUrl}/webhook/${path}`;

        logger.debug(`N8N Webhook: ${method} ${url}`);

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: method === 'POST' ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`N8N Webhook Error (${response.status}): ${error}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            return response.json();
        }
        return response.text();
    }

    /**
     * Testa a conexão com o n8n
     */
    async testConnection(): Promise<{ success: boolean; version?: string; error?: string }> {
        try {
            // Tentar endpoint de health ou listar workflows
            const workflows = await this.listWorkflows();
            return {
                success: true,
                version: 'connected',
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}

// Instância configurável
let n8nClientInstance: N8NClient | null = null;

/**
 * Obtém ou cria instância do cliente N8N
 */
export function getN8NClient(config?: N8NConfig): N8NClient {
    if (config) {
        n8nClientInstance = new N8NClient(config);
    }

    if (!n8nClientInstance) {
        // Tentar configuração padrão via variáveis de ambiente
        const baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
        const apiKey = process.env.N8N_API_KEY;

        n8nClientInstance = new N8NClient({ baseUrl, apiKey });
    }

    return n8nClientInstance;
}

/**
 * Reseta a instância do cliente (para testes)
 */
export function resetN8NClient(): void {
    n8nClientInstance = null;
}
