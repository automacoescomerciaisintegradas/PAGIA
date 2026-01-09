/**
 * PAGIA - N8N Client
 * Cliente para integração com N8N via API
 *
 * @module utils/n8n-client
 * @author Automações Comerciais Integradas
 */
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
    tags?: Array<{
        id: string;
        name: string;
    }>;
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
export declare class N8NClient {
    private config;
    private headers;
    constructor(config: N8NConfig);
    /**
     * Faz requisição para a API do n8n
     */
    private request;
    /**
     * Lista todos os workflows
     */
    listWorkflows(): Promise<N8NWorkflow[]>;
    /**
     * Obtém um workflow específico
     */
    getWorkflow(id: string): Promise<N8NWorkflow>;
    /**
     * Lista todas as credenciais
     */
    listCredentials(): Promise<N8NCredential[]>;
    /**
     * Executa um workflow
     */
    executeWorkflow(id: string, data?: Record<string, unknown>): Promise<N8NExecution>;
    /**
     * Lista execuções de um workflow
     */
    listExecutions(workflowId?: string): Promise<N8NExecution[]>;
    /**
     * Extrai ferramentas/nodes de todos os workflows ativos
     */
    listTools(): Promise<N8NTool[]>;
    /**
     * Chama um webhook do n8n
     */
    callWebhook(path: string, data?: Record<string, unknown>, method?: 'GET' | 'POST'): Promise<unknown>;
    /**
     * Testa a conexão com o n8n
     */
    testConnection(): Promise<{
        success: boolean;
        version?: string;
        error?: string;
    }>;
}
/**
 * Obtém ou cria instância do cliente N8N
 */
export declare function getN8NClient(config?: N8NConfig): N8NClient;
/**
 * Reseta a instância do cliente (para testes)
 */
export declare function resetN8NClient(): void;
//# sourceMappingURL=n8n-client.d.ts.map