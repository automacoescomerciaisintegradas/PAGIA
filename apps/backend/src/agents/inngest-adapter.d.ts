/**
 * PAGIA - Inngest AgentKit Adapter
 * Adaptador para integração com @inngest/agent-kit
 *
 * @module agents/inngest-adapter
 * @author Automações Comerciais Integradas
 */
import { createAgent } from '@inngest/agent-kit';
import type { BaseAgent } from './base-agent.js';
/**
 * Tipos de provedor suportados pelo AgentKit
 */
export type AgentKitProviderType = 'gemini' | 'openai' | 'anthropic';
/**
 * Configuração do modelo para AgentKit
 */
export interface AgentKitModelConfig {
    provider: AgentKitProviderType;
    model: string;
    apiKey?: string;
}
/**
 * Resultado da conversão de agente PAGIA para AgentKit
 */
export interface AgentKitAgent {
    agent: ReturnType<typeof createAgent>;
    pagiaAgentId: string;
    name: string;
}
/**
 * Classe InngestAdapter - Converte agentes PAGIA para AgentKit
 */
export declare class InngestAdapter {
    private static instance;
    private convertedAgents;
    private defaultModelConfig;
    private constructor();
    /**
     * Obtém instância singleton
     */
    static getInstance(): InngestAdapter;
    /**
     * Obtém configuração padrão do modelo baseado em variáveis de ambiente
     */
    private getDefaultModelConfig;
    /**
     * Cria modelo AgentKit baseado no provedor configurado
     */
    private createModel;
    /**
     * Converte um agente PAGIA para AgentKit
     */
    convertPAGIAAgent(pagiaAgent: BaseAgent, modelConfig?: Partial<AgentKitModelConfig>): AgentKitAgent;
    /**
     * Converte todos os agentes registrados no PAGIA
     */
    convertAllAgents(modelConfig?: Partial<AgentKitModelConfig>): AgentKitAgent[];
    /**
     * Cria tools a partir das capacidades do agente
     */
    private createToolsFromCapabilities;
    /**
     * Constrói o system prompt do agente para AgentKit
     */
    private buildSystemPrompt;
    /**
     * Obtém um agente convertido pelo ID do PAGIA
     */
    getConvertedAgent(pagiaAgentId: string): AgentKitAgent | undefined;
    /**
     * Obtém todos os agentes convertidos
     */
    getAllConvertedAgents(): AgentKitAgent[];
    /**
     * Limpa cache de agentes convertidos
     */
    clearCache(): void;
    /**
     * Estatísticas do adapter
     */
    getStats(): {
        total: number;
        cached: number;
    };
}
export declare const inngestAdapter: InngestAdapter;
//# sourceMappingURL=inngest-adapter.d.ts.map