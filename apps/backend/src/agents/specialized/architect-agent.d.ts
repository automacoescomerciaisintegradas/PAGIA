/**
 * PAGIA - Architect Agent
 * Agente de Arquitetura de Software
 *
 * Baseado no BMAD Method
 *
 * @module agents/specialized/architect-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
/**
 * ArchitectAgent - Responsável por design de sistema e arquitetura técnica
 */
export declare class ArchitectAgent extends BaseAgent {
    readonly name = "Architect";
    readonly role = "Arquiteto de Software";
    readonly description = "Agente especializado em arquitetura de software, design de sistemas, escolha de tecnologias e documenta\u00E7\u00E3o t\u00E9cnica. Cria ADRs, diagramas de arquitetura e define padr\u00F5es t\u00E9cnicos.";
    readonly module = "core";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    execute(input: AgentInput): Promise<AgentOutput>;
}
export declare const architectAgent: ArchitectAgent;
//# sourceMappingURL=architect-agent.d.ts.map