/**
 * PAGIA - Planner Agent
 * Agente especializado em planejamento de projetos
 * 
 * @module agents/specialized/planner-agent
 * @author Automações Comerciais Integradas
 */

import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
import type { AIProvider } from '../../types/index.js';

export type PlanType = 'global' | 'stage' | 'sprint' | 'feature' | 'task';
export type PlanFormat = 'markdown' | 'yaml' | 'json';

interface PlanningOptions {
    type: PlanType;
    format: PlanFormat;
    includeEstimates: boolean;
    includeDependencies: boolean;
    includeRisks: boolean;
}

/**
 * Classe PlannerAgent - Agente para planejamento de projetos
 */
export class PlannerAgent extends BaseAgent {
    readonly name = 'Agente Planejador';
    readonly role = 'Especialista em planejamento e gestão de projetos';
    readonly description = 'Cria planos de ação detalhados, decompõe tarefas e gerencia cronogramas';
    readonly module = 'core';

    capabilities = [
        'planejamento estratégico',
        'decomposição de tarefas',
        'estimativa de esforço',
        'identificação de riscos',
        'análise de dependências',
        'criação de roadmaps',
        'gestão de sprints',
    ];

    instructions = `
Você é um gerente de projetos experiente com expertise em metodologias ágeis e tradicionais.

Diretrizes:
1. Decomponha requisitos em tarefas acionáveis
2. Identifique dependências entre tarefas
3. Estime esforço de forma realista
4. Antecipe riscos e proponha mitigações
5. Priorize com base em valor e urgência
6. Use frameworks adequados (Scrum, Kanban, etc.)
7. Forneça entregas incrementais

Formato:
- Use markdown estruturado
- Inclua checklists quando apropriado
- Forneça estimativas em horas ou story points
- Organize hierarquicamente
  `;

    menu = [
        { trigger: '/plan', description: 'Criar plano de ação' },
        { trigger: '/decompose', description: 'Decompor em tarefas' },
        { trigger: '/estimate', description: 'Estimar esforço' },
        { trigger: '/risks', description: 'Análise de riscos' },
        { trigger: '/roadmap', description: 'Criar roadmap' },
        { trigger: '/sprint', description: 'Planejar sprint' },
    ];

    private defaultOptions: PlanningOptions = {
        type: 'global',
        format: 'markdown',
        includeEstimates: true,
        includeDependencies: true,
        includeRisks: true,
    };

    constructor(aiProvider?: Partial<AIProvider>) {
        super(aiProvider);
    }

    /**
     * Executa planejamento
     */
    async execute(input: AgentInput): Promise<AgentOutput> {
        const startTime = Date.now();

        const options = this.parseOptions(input);
        const prompt = this.buildPrompt(input.prompt, options);

        try {
            const response = await this.callAI(prompt, input.context);

            let content = response.content;

            // Converter formato se necessário
            if (options.format !== 'markdown') {
                content = this.convertFormat(content, options.format);
            }

            const suggestedActions = this.extractSuggestedActions(content);

            return this.createOutput(content, response.tokensUsed, startTime, suggestedActions);
        } catch (error) {
            throw new Error(`Erro no planejamento: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Parseia opções do input
     */
    private parseOptions(input: AgentInput): PlanningOptions {
        const context = input.context || {};

        return {
            type: (context.type as PlanType) || this.defaultOptions.type,
            format: (context.format as PlanFormat) || this.defaultOptions.format,
            includeEstimates: context.includeEstimates !== false,
            includeDependencies: context.includeDependencies !== false,
            includeRisks: context.includeRisks !== false,
        };
    }

    /**
     * Constrói prompt específico
     */
    private buildPrompt(userPrompt: string, options: PlanningOptions): string {
        // Detectar comando
        if (userPrompt.startsWith('/plan')) {
            return this.buildPlanPrompt(userPrompt.replace('/plan', '').trim(), options);
        } else if (userPrompt.startsWith('/decompose')) {
            return this.buildDecomposePrompt(userPrompt.replace('/decompose', '').trim(), options);
        } else if (userPrompt.startsWith('/estimate')) {
            return this.buildEstimatePrompt(userPrompt.replace('/estimate', '').trim(), options);
        } else if (userPrompt.startsWith('/risks')) {
            return this.buildRisksPrompt(userPrompt.replace('/risks', '').trim(), options);
        } else if (userPrompt.startsWith('/roadmap')) {
            return this.buildRoadmapPrompt(userPrompt.replace('/roadmap', '').trim(), options);
        } else if (userPrompt.startsWith('/sprint')) {
            return this.buildSprintPrompt(userPrompt.replace('/sprint', '').trim(), options);
        }

        return this.buildGeneralPrompt(userPrompt, options);
    }

    /**
     * Prompt para criar plano
     */
    private buildPlanPrompt(requirement: string, options: PlanningOptions): string {
        return `
Crie um PLANO DE AÇÃO ${options.type.toUpperCase()} para:

${requirement}

O plano deve incluir:
1. **Objetivo Principal**: Meta clara e mensurável
2. **Escopo**: O que está incluído e excluído
3. **Etapas Principais**: Fases do projeto
4. **Tarefas Detalhadas**: Ações específicas por etapa
5. **Marcos (Milestones)**: Pontos de verificação
${options.includeEstimates ? '6. **Estimativas**: Tempo e esforço por tarefa' : ''}
${options.includeDependencies ? '7. **Dependências**: Relações entre tarefas' : ''}
${options.includeRisks ? '8. **Riscos**: Potenciais problemas e mitigações' : ''}
9. **Critérios de Sucesso**: Como medir o sucesso

Use formato hierárquico com checklists.
    `.trim();
    }

    /**
     * Prompt para decomposição
     */
    private buildDecomposePrompt(feature: string, options: PlanningOptions): string {
        return `
Decomponha a seguinte funcionalidade em TAREFAS ACIONÁVEIS:

${feature}

Para cada tarefa, forneça:
- [ ] **Nome da Tarefa**
  - Descrição breve
  ${options.includeEstimates ? '- Estimativa: X horas/pontos' : ''}
  ${options.includeDependencies ? '- Depende de: [lista]' : ''}
  - Critério de Aceite: Quando está pronto

Organize as tarefas em ordem de execução.
Use formato de checklist markdown.
    `.trim();
    }

    /**
     * Prompt para estimativas
     */
    private buildEstimatePrompt(tasks: string, options: PlanningOptions): string {
        return `
Estime o ESFORÇO para as seguintes tarefas:

${tasks}

Para cada tarefa, forneça:
1. **Estimativa Otimista** (melhor caso)
2. **Estimativa Mais Provável** 
3. **Estimativa Pessimista** (pior caso)
4. **PERT**: (Otimista + 4×Provável + Pessimista) / 6

Considere:
- Complexidade técnica
- Incertezas
- Dependências externas
- Experiência da equipe

Forneça em formato de tabela:
| Tarefa | Otimista | Provável | Pessimista | PERT |
    `.trim();
    }

    /**
     * Prompt para análise de riscos
     */
    private buildRisksPrompt(project: string, options: PlanningOptions): string {
        return `
Realize uma ANÁLISE DE RISCOS para:

${project}

Para cada risco identificado:
1. **Descrição**: O que pode acontecer
2. **Probabilidade**: Alta/Média/Baixa
3. **Impacto**: Alto/Médio/Baixo
4. **Score**: Probabilidade × Impacto
5. **Mitigação**: Ações preventivas
6. **Contingência**: Plano B se ocorrer

Categorias de risco:
- Técnicos
- Organizacionais
- Externos
- Gestão de Projeto
- Recursos

Forneça uma matriz de riscos visual.
    `.trim();
    }

    /**
     * Prompt para roadmap
     */
    private buildRoadmapPrompt(project: string, options: PlanningOptions): string {
        return `
Crie um ROADMAP para:

${project}

O roadmap deve ter:
1. **Visão de Longo Prazo**: Objetivo final
2. **Fases/Trimestres**: Divisão temporal
3. **Funcionalidades por Fase**: O que será entregue
4. **Marcos Principais**: Datas/pontos chave
5. **Dependências entre Fases**

Formato visual em texto:
\`\`\`
Q1 2025     Q2 2025     Q3 2025     Q4 2025
|           |           |           |
├─ Feature1 ├─ Feature3 ├─ Feature5 ├─ Feature7
├─ Feature2 ├─ Feature4 ├─ Feature6 ├─ Release
\`\`\`

Inclua descrição de cada item do roadmap.
    `.trim();
    }

    /**
     * Prompt para planejamento de sprint
     */
    private buildSprintPrompt(backlog: string, options: PlanningOptions): string {
        return `
Planeje uma SPRINT com base no backlog:

${backlog}

O plano de sprint deve incluir:
1. **Objetivo da Sprint**: Meta clara
2. **Capacidade da Equipe**: Pontos/horas disponíveis
3. **Itens Selecionados**: User stories priorizadas
4. **Critérios de Aceite**: Por item
5. **Riscos da Sprint**: Possíveis impedimentos

Para cada item:
- [ ] US-XX: [Título]
  - Pontos: X
  - Prioridade: Alta/Média/Baixa
  - Critérios de Aceite:
    - [ ] Critério 1
    - [ ] Critério 2

Sugira capacidade realista baseada no backlog.
    `.trim();
    }

    /**
     * Prompt geral
     */
    private buildGeneralPrompt(userPrompt: string, options: PlanningOptions): string {
        return `
Auxilie no planejamento conforme solicitado:

${userPrompt}

Tipo de plano: ${options.type}
${options.includeEstimates ? 'Incluir estimativas de esforço.' : ''}
${options.includeDependencies ? 'Incluir análise de dependências.' : ''}
${options.includeRisks ? 'Incluir análise de riscos.' : ''}

Use formato estruturado com checklists quando apropriado.
    `.trim();
    }

    /**
     * Converte formato do output
     */
    private convertFormat(content: string, format: PlanFormat): string {
        if (format === 'yaml') {
            // Adicionar wrapper YAML
            return `# Plano de Ação\n---\n${content}`;
        } else if (format === 'json') {
            // Tentar extrair estrutura para JSON
            return `{\n  "plan": ${JSON.stringify(content)}\n}`;
        }
        return content;
    }

    /**
     * Cria plano de ação diretamente
     */
    async createPlan(
        requirement: string,
        type: PlanType = 'global',
        format: PlanFormat = 'markdown'
    ): Promise<AgentOutput> {
        return this.execute({
            prompt: `/plan ${requirement}`,
            context: { type, format },
        });
    }

    /**
     * Decompõe feature em tarefas
     */
    async decomposeTasks(feature: string): Promise<AgentOutput> {
        return this.execute({
            prompt: `/decompose ${feature}`,
        });
    }

    /**
     * Estima esforço de tarefas
     */
    async estimateEffort(tasks: string): Promise<AgentOutput> {
        return this.execute({
            prompt: `/estimate ${tasks}`,
        });
    }

    /**
     * Analisa riscos
     */
    async analyzeRisks(project: string): Promise<AgentOutput> {
        return this.execute({
            prompt: `/risks ${project}`,
        });
    }

    /**
     * Cria roadmap
     */
    async createRoadmap(project: string): Promise<AgentOutput> {
        return this.execute({
            prompt: `/roadmap ${project}`,
        });
    }

    /**
     * Planeja sprint
     */
    async planSprint(backlog: string): Promise<AgentOutput> {
        return this.execute({
            prompt: `/sprint ${backlog}`,
        });
    }
}

// Criar instância padrão
export const plannerAgent = new PlannerAgent();
