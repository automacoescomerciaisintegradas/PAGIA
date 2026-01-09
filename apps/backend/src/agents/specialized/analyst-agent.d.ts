/**
 * PAGIA - Analyst Agent
 * Agente de Análise de Mercado e Pesquisa
 *
 * Baseado no BMAD Method
 *
 * @module agents/specialized/analyst-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
/**
 * AnalystAgent - Responsável por análise de mercado, pesquisa competitiva e ideação
 */
export declare class AnalystAgent extends BaseAgent {
    readonly name = "Analyst";
    readonly role = "Analista de Mercado e Pesquisa";
    readonly description = "Agente especializado em an\u00E1lise de mercado, pesquisa competitiva, an\u00E1lise de tend\u00EAncias e idea\u00E7\u00E3o de projetos. Gera briefs de projeto, documentos de an\u00E1lise de mercado e pesquisa competitiva.";
    readonly module = "core";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    execute(input: AgentInput): Promise<AgentOutput>;
}
export declare const analystAgent: AnalystAgent;
//# sourceMappingURL=analyst-agent.d.ts.map