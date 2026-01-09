/**
 * PAGIA - QA Agent
 * Agente de Qualidade e Testes
 *
 * Baseado no BMAD Method
 *
 * @module agents/specialized/qa-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
/**
 * QAAgent - Responsável por qualidade, testes e validação
 */
export declare class QAAgent extends BaseAgent {
    readonly name = "QA";
    readonly role = "Engenheiro de Qualidade e Testes";
    readonly description = "Agente especializado em garantia de qualidade, cria\u00E7\u00E3o de planos de teste, casos de teste, automa\u00E7\u00E3o de testes e valida\u00E7\u00E3o de requisitos. Previne d\u00E9bito t\u00E9cnico e garante qualidade cont\u00EDnua.";
    readonly module = "core";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    execute(input: AgentInput): Promise<AgentOutput>;
}
export declare const qaAgent: QAAgent;
//# sourceMappingURL=qa-agent.d.ts.map