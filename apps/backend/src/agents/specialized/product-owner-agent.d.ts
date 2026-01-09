/**
 * PAGIA - Product Owner Agent
 * Agente de Gerenciamento de Produto
 *
 * Baseado no BMAD Method
 *
 * @module agents/specialized/product-owner-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
/**
 * ProductOwnerAgent - Responsável por requisitos, especificações e gestão de produto
 */
export declare class ProductOwnerAgent extends BaseAgent {
    readonly name = "Product Owner";
    readonly role = "Gerente de Produto e Requisitos";
    readonly description = "Agente especializado em gerenciamento de produto, levantamento de requisitos, cria\u00E7\u00E3o de PRDs, user stories e prioriza\u00E7\u00E3o de backlog. Traduz necessidades de neg\u00F3cio em especifica\u00E7\u00F5es t\u00E9cnicas.";
    readonly module = "core";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    execute(input: AgentInput): Promise<AgentOutput>;
}
export declare const productOwnerAgent: ProductOwnerAgent;
//# sourceMappingURL=product-owner-agent.d.ts.map