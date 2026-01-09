/**
 * PAGIA - Agent Registry
 * Registro centralizado de agentes
 *
 * @module agents/agent-registry
 * @author Automações Comerciais Integradas
 */
import { BaseAgent } from './base-agent.js';
/**
 * Classe AgentRegistry - Registro centralizado de agentes
 */
export declare class AgentRegistry {
    private static instance;
    private agents;
    private constructor();
    /**
     * Obtém a instância singleton do AgentRegistry
     */
    static getInstance(): AgentRegistry;
    /**
     * Registra um agente
     */
    register(agent: BaseAgent, tags?: string[]): Promise<void>;
    /**
     * Remove registro de um agente
     */
    unregister(agentId: string): Promise<boolean>;
    /**
     * Obtém um agente pelo ID
     */
    get(agentId: string): BaseAgent | undefined;
    /**
     * Obtém um agente pelo nome
     */
    getByName(name: string): BaseAgent | undefined;
    /**
     * Lista todos os agentes registrados
     */
    list(options?: {
        enabled?: boolean;
        module?: string;
    }): BaseAgent[];
    /**
     * Busca agentes por capacidade
     */
    findByCapability(capability: string): BaseAgent[];
    /**
     * Busca agentes por tag
     */
    findByTag(tag: string): BaseAgent[];
    /**
     * Busca agentes por módulo
     */
    findByModule(module: string): BaseAgent[];
    /**
     * Busca agentes por papel (role)
     */
    findByRole(role: string): BaseAgent[];
    /**
     * Busca avançada de agentes
     */
    search(query: {
        name?: string;
        role?: string;
        module?: string;
        capabilities?: string[];
        tags?: string[];
        enabled?: boolean;
    }): BaseAgent[];
    /**
     * Habilita um agente
     */
    enable(agentId: string): boolean;
    /**
     * Desabilita um agente
     */
    disable(agentId: string): boolean;
    /**
     * Verifica se um agente está registrado
     */
    has(agentId: string): boolean;
    /**
     * Verifica se um agente está habilitado
     */
    isEnabled(agentId: string): boolean;
    /**
     * Adiciona tags a um agente
     */
    addTags(agentId: string, tags: string[]): boolean;
    /**
     * Remove tags de um agente
     */
    removeTags(agentId: string, tags: string[]): boolean;
    /**
     * Obtém número de agentes registrados
     */
    count(enabledOnly?: boolean): number;
    /**
     * Obtém estatísticas do registro
     */
    getStats(): {
        total: number;
        enabled: number;
        disabled: number;
        byModule: Record<string, number>;
    };
    /**
     * Limpa o registro
     */
    clear(): void;
    /**
     * Exporta agentes para JSON
     */
    toJSON(): Record<string, unknown>[];
}
export declare const agentRegistry: AgentRegistry;
//# sourceMappingURL=agent-registry.d.ts.map