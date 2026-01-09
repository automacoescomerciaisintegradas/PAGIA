/**
 * PAGIA - Example Agent
 * Agente de demonstração para servir como exemplo de implementação de agente
 */
import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
export declare class ExampleAgent extends BaseAgent {
    readonly name = "Example Agent";
    readonly role = "Agente de Exemplo";
    readonly description = "Agente simples que demonstra a implementa\u00E7\u00E3o, uso de prompts e formata\u00E7\u00E3o de sa\u00EDda.";
    readonly module = "examples";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    execute(input: AgentInput): Promise<AgentOutput>;
}
export declare const exampleAgent: ExampleAgent;
//# sourceMappingURL=example-agent.d.ts.map