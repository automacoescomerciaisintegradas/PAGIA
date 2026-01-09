/**
 * PAGIA - Workflow Building Master Agent
 * Agente Especializado em Criação e Edição de Workflows BMAD
 *
 * Baseado no BMAD Method
 *
 * @module agents/specialized/workflow-building-master-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
/**
 * WorkflowBuildingMasterAgent - Especialista em arquitetura e design de workflows
 */
export declare class WorkflowBuildingMasterAgent extends BaseAgent {
    readonly name = "Workflow Building Master";
    readonly role = "Especialista em Arquitetura de Workflows";
    readonly description = "Agente especializado em cria\u00E7\u00E3o, edi\u00E7\u00E3o e valida\u00E7\u00E3o de workflows BMAD com melhores pr\u00E1ticas. Especializado em criar workflows eficientes, escal\u00E1veis e integrados aos sistemas BMAD.";
    readonly module = "bmb";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    execute(input: AgentInput): Promise<AgentOutput>;
}
export declare const workflowBuildingMasterAgent: WorkflowBuildingMasterAgent;
//# sourceMappingURL=workflow-building-master-agent.d.ts.map