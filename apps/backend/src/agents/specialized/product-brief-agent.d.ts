/**
 * PAGIA - Product Brief Agent
 * Agente especializado em geração de briefs de produto
 *
 * @module agents/specialized/product-brief-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
import type { AIProvider } from '../../types/index.js';
export declare class ProductBriefAgent extends BaseAgent {
    readonly name = "Product Brief Agent";
    readonly role = "Especialista em resumos executivos de produto";
    readonly description = "Gera briefs de produto com vis\u00E3o geral, p\u00FAblico-alvo, proposta de valor e roadmap";
    readonly module = "core";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    constructor(aiProvider?: Partial<AIProvider>);
    execute(input: AgentInput): Promise<AgentOutput>;
}
export declare const productBriefAgent: ProductBriefAgent;
//# sourceMappingURL=product-brief-agent.d.ts.map