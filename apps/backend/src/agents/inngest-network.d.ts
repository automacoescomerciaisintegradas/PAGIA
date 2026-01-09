/**
 * PAGIA - Inngest AgentKit Network
 * Rede de agentes orquestrada com @inngest/agent-kit
 *
 * @module agents/inngest-network
 * @author Automações Comerciais Integradas
 */
import { createNetwork } from '@inngest/agent-kit';
type AgentKitNetwork = ReturnType<typeof createNetwork>;
/**
 * Configuração da rede de agentes
 */
export interface NetworkConfig {
    name: string;
    defaultModel?: {
        provider: 'gemini' | 'openai' | 'anthropic';
        model: string;
    };
    maxIterations?: number;
}
/**
 * Estado compartilhado da rede
 */
export interface NetworkState {
    currentTask?: string;
    plan?: string[];
    results: Record<string, string>;
    context?: Record<string, unknown>;
    completed: boolean;
}
/**
 * Resultado da execução da rede
 */
export interface NetworkRunResult {
    success: boolean;
    result?: string;
    state?: Record<string, unknown>;
    error?: string;
}
/**
 * Classe PAGIANetwork - Rede de agentes PAGIA com AgentKit
 */
export declare class PAGIANetwork {
    private static instance;
    private networks;
    private defaultConfig;
    private constructor();
    /**
     * Obtém instância singleton
     */
    static getInstance(): PAGIANetwork;
    /**
     * Cria modelo AgentKit - usando apenas Gemini para simplificar tipos
     * TODO: Adicionar suporte a outros providers quando os tipos estabilizarem
     */
    private createModel;
    /**
     * Cria ferramentas compartilhadas para todos os agentes
     */
    private createSharedTools;
    /**
     * Cria agente planejador
     */
    private createPlannerAgent;
    /**
     * Cria agente executor
     */
    private createExecutorAgent;
    /**
     * Cria agente revisor
     */
    private createReviewerAgent;
    /**
     * Cria agente supervisor (roteador)
     */
    private createSupervisorAgent;
    /**
     * Cria a rede padrão do PAGIA
     */
    createDefaultNetwork(config?: Partial<NetworkConfig>): AgentKitNetwork;
    /**
     * Cria rede customizada com agentes PAGIA
     */
    createCustomNetwork(name: string, agentIds: string[], config?: Partial<NetworkConfig>): Promise<AgentKitNetwork>;
    /**
     * Executa uma rede
     */
    runNetwork(networkName: string, input: string): Promise<NetworkRunResult>;
    /**
     * Obtém uma rede pelo nome
     */
    getNetwork(name: string): AgentKitNetwork | undefined;
    /**
     * Lista todas as redes
     */
    listNetworks(): string[];
    /**
     * Remove uma rede
     */
    removeNetwork(name: string): boolean;
    /**
     * Estatísticas das redes
     */
    getStats(): {
        total: number;
        networks: string[];
    };
}
export declare const pagiaNetwork: PAGIANetwork;
export {};
//# sourceMappingURL=inngest-network.d.ts.map