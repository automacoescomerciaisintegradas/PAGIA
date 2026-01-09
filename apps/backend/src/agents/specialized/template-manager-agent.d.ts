/**
 * PAGIA - Template Manager Agent
 * Agente Especializado em Gerenciamento de Templates de Agentes
 *
 * Baseado nos padrões do projeto PAGIA
 *
 * @module agents/specialized/template-manager-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
/**
 * TemplateManagerAgent - Especialista em gerenciamento de templates de agentes
 */
export declare class TemplateManagerAgent extends BaseAgent {
    readonly name = "Template Manager";
    readonly role = "Especialista em Gerenciamento de Templates de Agentes";
    readonly description = "Agente especializado em gerenciar, atualizar e padronizar templates de agentes no ecossistema PAGIA. Respons\u00E1vel por garantir consist\u00EAncia na assinatura e estrutura dos agentes.";
    readonly module = "template-management";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    execute(input: AgentInput): Promise<AgentOutput>;
    private generateAgentName;
}
export declare const templateManagerAgent: TemplateManagerAgent;
//# sourceMappingURL=template-manager-agent.d.ts.map