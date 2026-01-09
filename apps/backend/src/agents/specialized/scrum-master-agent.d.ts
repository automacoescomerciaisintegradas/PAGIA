/**
 * PAGIA - Scrum Master Agent
 * Agente de Gestão Ágil e Planejamento
 *
 * Baseado no BMAD Method
 *
 * @module agents/specialized/scrum-master-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
/**
 * ScrumMasterAgent - Responsável por gestão ágil, sprints e facilitação
 */
export declare class ScrumMasterAgent extends BaseAgent {
    readonly name = "Scrum Master";
    readonly role = "Facilitador \u00C1gil e Gestor de Sprints";
    readonly description = "Agente especializado em metodologias \u00E1geis, gest\u00E3o de sprints, facilita\u00E7\u00E3o de cerim\u00F4nias e remo\u00E7\u00E3o de impedimentos. Converte planos de alto n\u00EDvel em tasks execut\u00E1veis.";
    readonly module = "core";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    execute(input: AgentInput): Promise<AgentOutput>;
}
export declare const scrumMasterAgent: ScrumMasterAgent;
//# sourceMappingURL=scrum-master-agent.d.ts.map