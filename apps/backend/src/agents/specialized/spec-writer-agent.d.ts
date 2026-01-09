/**
 * PAGIA - Spec Writer Agent
 * Agente Especializado em Escrita de Especificações Técnicas
 *
 * Baseado nos padrões do projeto PAGIA
 *
 * @module agents/specialized/spec-writer-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
/**
 * SpecWriterAgent - Especialista em criação de especificações técnicas
 */
export declare class SpecWriterAgent extends BaseAgent {
    readonly name = "Spec Writer";
    readonly role = "Especialista em Especifica\u00E7\u00F5es T\u00E9cnicas";
    readonly description = "Agente especializado em criar documentos de especifica\u00E7\u00E3o detalhados e abrangentes para desenvolvimento de software, seguindo os padr\u00F5es e conven\u00E7\u00F5es do projeto PAGIA.";
    readonly module = "specifications";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    execute(input: AgentInput): Promise<AgentOutput>;
}
export declare const specWriterAgent: SpecWriterAgent;
//# sourceMappingURL=spec-writer-agent.d.ts.map