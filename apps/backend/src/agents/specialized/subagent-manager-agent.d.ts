/**
 * PAGIA - Subagent Manager Agent
 * Agente Especializado em Gerenciamento de Subagentes
 *
 * Baseado nos padrões do projeto PAGIA
 *
 * @module agents/specialized/subagent-manager-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
/**
 * SubagentManagerAgent - Especialista em gerenciamento de subagentes
 */
export declare class SubagentManagerAgent extends BaseAgent {
    readonly name = "Subagent Manager";
    readonly role = "Especialista em Gerenciamento de Subagentes";
    readonly description = "Agente especializado em criar, configurar e gerenciar subagentes dentro do ecossistema PAGIA. Facilita a defini\u00E7\u00E3o de pap\u00E9is especializados, configura\u00E7\u00E3o de permiss\u00F5es e atribui\u00E7\u00E3o de ferramentas espec\u00EDficas.";
    readonly module = "agent-management";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    execute(input: AgentInput): Promise<AgentOutput>;
    private generateValidName;
}
export declare const subagentManagerAgent: SubagentManagerAgent;
//# sourceMappingURL=subagent-manager-agent.d.ts.map