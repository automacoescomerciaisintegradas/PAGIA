/**
 * PAGIA - Example Agent
 * Agente de demonstração para servir como exemplo de implementação de agente
 */
import { BaseAgent } from '../base-agent.js';
export class ExampleAgent extends BaseAgent {
    name = 'Example Agent';
    role = 'Agente de Exemplo';
    description = 'Agente simples que demonstra a implementação, uso de prompts e formatação de saída.';
    module = 'examples';
    capabilities = ['exemplo', 'demo'];
    instructions = `Seja objetivo. Responda com um resumo em até 3 frases e sugira uma ação no formato [ACTION:command:RunExample:run-example] quando aplicável.`;
    menu = [
        { trigger: 'example', description: 'Executa o agente de exemplo' },
    ];
    async execute(input) {
        const startTime = Date.now();
        // Enriquecer prompt com instruções e contexto
        const prompt = `Receba a solicitação abaixo e responda com um resumo em até 3 frases. Solicitação: ${input.prompt}`;
        const response = await this.callAI(prompt, input.context);
        const formatted = this.formatOutput(response.content);
        const suggested = this.extractSuggestedActions(response.content);
        return this.createOutput(formatted, response.tokensUsed, startTime, suggested);
    }
}
export const exampleAgent = new ExampleAgent();
//# sourceMappingURL=example-agent.js.map