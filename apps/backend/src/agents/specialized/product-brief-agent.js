/**
 * PAGIA - Product Brief Agent
 * Agente especializado em geração de briefs de produto
 *
 * @module agents/specialized/product-brief-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent } from '../base-agent.js';
export class ProductBriefAgent extends BaseAgent {
    name = 'Product Brief Agent';
    role = 'Especialista em resumos executivos de produto';
    description = 'Gera briefs de produto com visão geral, público-alvo, proposta de valor e roadmap';
    module = 'core';
    capabilities = [
        'visão geral do produto',
        'público-alvo',
        'proposta de valor',
        'principais recursos',
        'concorrência',
        'roadmap de alto nível',
    ];
    instructions = `
Você é um estrategista de produto. 
Gere briefs objetivos que comuniquem valor, mercado e diferenciais. 
- Comece com uma visão geral do produto, alvo, necessidade do usuário
- Inclua propostas de valor claras e métricas de sucesso
- Destaque recursos-chave e diferenciais competitivos
- Mantenha o tom conciso, adequado para execuções rápidas
  `.trim();
    menu = [
        { trigger: '/brief', description: 'Gerar brief de produto' },
        { trigger: '/summarize', description: 'Resumir informações de produto' },
    ];
    constructor(aiProvider) {
        super(aiProvider);
    }
    async execute(input) {
        const startTime = Date.now();
        // Use input.prompt to guide the brief; delegate to AI
        const prompt = input.prompt?.trim() || 'Gere um brief de produto';
        const response = await this.callAI(prompt, input.context);
        return this.createOutput(response.content, response.tokensUsed, startTime);
    }
}
// Criar instância padrão
export const productBriefAgent = new ProductBriefAgent();
//# sourceMappingURL=product-brief-agent.js.map