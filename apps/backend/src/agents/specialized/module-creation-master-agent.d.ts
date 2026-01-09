/**
 * PAGIA - Module Creation Master Agent
 * Agente Especializado em Criação e Edição de Módulos BMAD
 *
 * Baseado no BMAD Method
 *
 * @module agents/specialized/module-creation-master-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
/**
 * ModuleCreationMasterAgent - Especialista em arquitetura e design de módulos
 */
export declare class ModuleCreationMasterAgent extends BaseAgent {
    readonly name = "Module Creation Master";
    readonly role = "Especialista em Arquitetura de M\u00F3dulos";
    readonly description = "Agente especializado em cria\u00E7\u00E3o, edi\u00E7\u00E3o e valida\u00E7\u00E3o de m\u00F3dulos BMAD completos com melhores pr\u00E1ticas. Especializado em criar m\u00F3dulos coesos, escal\u00E1veis e que entregam funcionalidade completa.";
    readonly module = "bmb";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    execute(input: AgentInput): Promise<AgentOutput>;
}
export declare const moduleCreationMasterAgent: ModuleCreationMasterAgent;
//# sourceMappingURL=module-creation-master-agent.d.ts.map