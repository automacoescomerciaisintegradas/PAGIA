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
export class AnalystAgent extends BaseAgent {
    readonly name = 'Analyst';
    readonly role = 'Analista de Mercado e Pesquisa';
    readonly description = 'Agente especializado em análise de mercado, pesquisa competitiva, análise de tendências e ideação de projetos. Gera briefs de projeto, documentos de análise de mercado e pesquisa competitiva.';
    readonly module = 'core';

    capabilities = [
        'Pesquisa de mercado e análise de tendências',
        'Análise competitiva e benchmarking',
        'Ideação de projetos e brainstorming',
        'Criação de briefs de projeto',
        'Identificação de oportunidades de mercado',
        'Análise SWOT e PEST',
        'Pesquisa de usuário e personas',
        'Validação de ideias de produto',
    ];

    instructions = `Como Analista de Mercado e Pesquisa, você deve:

1. **Pesquisa de Mercado:**
   - Analisar tendências atuais do mercado
   - Identificar oportunidades e ameaças
   - Avaliar tamanho de mercado (TAM, SAM, SOM)

2. **Análise Competitiva:**
   - Mapear concorrentes diretos e indiretos
   - Analisar pontos fortes e fracos dos concorrentes
   - Identificar gaps no mercado

3. **Ideação de Projetos:**
   - Facilitar sessões de brainstorming
   - Gerar conceitos e ideias inovadoras
   - Validar ideias com dados de mercado

4. **Documentação:**
   - Criar briefs de projeto claros e acionáveis
   - Documentar análises em formatos padronizados
   - Fornecer recomendações baseadas em dados

Sempre forneça análises baseadas em dados quando possível e seja objetivo nas recomendações.`;

    menu = [
        { trigger: '/analyze-market', description: 'Analisar um mercado específico' },
        { trigger: '/competitive', description: 'Realizar análise competitiva' },
        { trigger: '/swot', description: 'Gerar análise SWOT' },
        { trigger: '/brief', description: 'Criar brief de projeto' },
        { trigger: '/trends', description: 'Identificar tendências' },
        { trigger: '/personas', description: 'Criar personas de usuário' },
    ];

    async execute(input: AgentInput): Promise<AgentOutput> {
        const startTime = Date.now();

        try {
            // Detectar tipo de análise pelo prompt
            const prompt = input.prompt.toLowerCase();
            let enhancedPrompt = input.prompt;

            if (prompt.includes('/analyze-market') || prompt.includes('mercado')) {
                enhancedPrompt = `Realize uma análise de mercado detalhada para: ${input.prompt.replace('/analyze-market', '').trim()}

Inclua:
- Tamanho do mercado (TAM/SAM/SOM)
- Principais players
- Tendências atuais
- Oportunidades e ameaças
- Barreiras de entrada`;
            } else if (prompt.includes('/swot')) {
                enhancedPrompt = `Crie uma análise SWOT completa para: ${input.prompt.replace('/swot', '').trim()}

Estruture em:
## Forças (Strengths)
## Fraquezas (Weaknesses)
## Oportunidades (Opportunities)
## Ameaças (Threats)

Finalize com recomendações estratégicas.`;
            } else if (prompt.includes('/competitive')) {
                enhancedPrompt = `Realize uma análise competitiva detalhada para: ${input.prompt.replace('/competitive', '').trim()}

Inclua:
- Mapeamento de concorrentes (diretos e indiretos)
- Comparativo de features
- Posicionamento de preço
- Pontos fortes e fracos de cada concorrente
- Gaps de mercado identificados`;
            } else if (prompt.includes('/brief')) {
                enhancedPrompt = `Crie um Project Brief profissional para: ${input.prompt.replace('/brief', '').trim()}

Estruture com:
## Resumo Executivo
## Contexto e Problema
## Objetivos
## Público-Alvo
## Escopo
## Métricas de Sucesso
## Riscos e Mitigações
## Próximos Passos`;
            } else if (prompt.includes('/personas')) {
                enhancedPrompt = `Crie personas de usuário detalhadas para: ${input.prompt.replace('/personas', '').trim()}

Para cada persona, inclua:
- Nome e foto fictícia
- Demografia
- Comportamentos
- Objetivos e motivações
- Dores e frustrações
- Jornada do usuário`;
            }

            const response = await this.callAI(enhancedPrompt, input.context);

            return this.createOutput(
                response.content,
                response.tokensUsed,
                startTime,
                this.extractSuggestedActions(response.content)
            );
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return this.createOutput(`Erro na análise: ${errorMsg}`, undefined, startTime);
        }
    }
}

// Singleton
export const analystAgent = new AnalystAgent();
