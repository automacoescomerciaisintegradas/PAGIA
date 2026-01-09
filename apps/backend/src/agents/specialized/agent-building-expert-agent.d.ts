/**
 * PAGIA - Agent Building Expert Agent
 * Agente Especializado em Criação e Edição de Agentes BMAD
 *
 * Baseado no BMAD Method
 *
 * @module agents/specialized/agent-building-expert-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
/**
 * AgentBuildingExpertAgent - Especialista em arquitetura e design de agentes
 */
export declare class AgentBuildingExpertAgent extends BaseAgent {
    readonly name = "Agent Building Expert";
    readonly role = "Especialista em Arquitetura de Agentes";
    readonly description = "Agente especializado em cria\u00E7\u00E3o, edi\u00E7\u00E3o e valida\u00E7\u00E3o de agentes BMAD com melhores pr\u00E1ticas. Especializado em criar agentes robustos, mant\u00EDveis e em conformidade com os padr\u00F5es BMAD Core.";
    readonly module = "bmb";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    execute(input: AgentInput): Promise<AgentOutput>;
}
export declare const agentBuildingExpertAgent: AgentBuildingExpertAgent;
//# sourceMappingURL=agent-building-expert-agent.d.ts.map