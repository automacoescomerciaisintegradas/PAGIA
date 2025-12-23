/**
 * PAGIA - Code Optimizer Agent
 * Agente especializado em otimização de código
 * 
 * @module agents/specialized/code-optimizer
 * @author Automações Comerciais Integradas
 */

import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
import type { AIProvider } from '../../types/index.js';

export type OptimizationTarget = 'performance' | 'readability' | 'security' | 'size' | 'all';
export type CodeLanguage = 'typescript' | 'javascript' | 'python' | 'go' | 'rust' | 'java' | 'csharp' | 'auto';

interface OptimizationOptions {
    target: OptimizationTarget;
    language: CodeLanguage;
    explain: boolean;
    preserveComments: boolean;
}

/**
 * Classe CodeOptimizerAgent - Agente para otimização de código
 */
export class CodeOptimizerAgent extends BaseAgent {
    readonly name = 'Otimizador de Código';
    readonly role = 'Especialista em otimização e refatoração de código';
    readonly description = 'Analisa e otimiza código para melhor performance, legibilidade e segurança';
    readonly module = 'core';

    capabilities = [
        'análise de código',
        'otimização de performance',
        'refatoração',
        'detecção de code smells',
        'sugestões de melhorias',
        'análise de complexidade',
        'revisão de segurança',
    ];

    instructions = `
Você é um especialista em otimização de código com anos de experiência.

Diretrizes:
1. Analise o código fornecido em detalhes
2. Identifique problemas de performance, legibilidade e segurança
3. Forneça sugestões claras e acionáveis
4. Quando possível, forneça código refatorado
5. Explique o raciocínio por trás de cada sugestão
6. Priorize mudanças de alto impacto
7. Mantenha compatibilidade backward quando possível

Formato de resposta:
- Use markdown para formatação
- Inclua blocos de código com syntax highlighting
- Organize por categorias (Performance, Legibilidade, Segurança)
- Forneça métricas quando aplicável
  `;

    menu = [
        { trigger: '/analyze', description: 'Analisar código completo' },
        { trigger: '/optimize', description: 'Otimizar para performance' },
        { trigger: '/refactor', description: 'Refatorar para legibilidade' },
        { trigger: '/security', description: 'Análise de segurança' },
        { trigger: '/complexity', description: 'Análise de complexidade' },
    ];

    private defaultOptions: OptimizationOptions = {
        target: 'all',
        language: 'auto',
        explain: true,
        preserveComments: true,
    };

    constructor(aiProvider?: Partial<AIProvider>) {
        super(aiProvider);
    }

    /**
     * Executa análise e otimização de código
     */
    async execute(input: AgentInput): Promise<AgentOutput> {
        const startTime = Date.now();

        const options = this.parseOptions(input);
        const prompt = this.buildPrompt(input.prompt, options);

        try {
            const response = await this.callAI(prompt, input.context);

            const content = this.formatOutput(response.content);
            const suggestedActions = this.extractSuggestedActions(content);

            return this.createOutput(content, response.tokensUsed, startTime, suggestedActions);
        } catch (error) {
            throw new Error(`Erro na otimização: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Parseia opções do input
     */
    private parseOptions(input: AgentInput): OptimizationOptions {
        const context = input.context || {};

        return {
            target: (context.target as OptimizationTarget) || this.defaultOptions.target,
            language: (context.language as CodeLanguage) || this.defaultOptions.language,
            explain: context.explain !== false,
            preserveComments: context.preserveComments !== false,
        };
    }

    /**
     * Constrói prompt específico para otimização
     */
    private buildPrompt(userPrompt: string, options: OptimizationOptions): string {
        let prompt = '';

        // Detectar comando
        if (userPrompt.startsWith('/analyze')) {
            prompt = this.buildAnalyzePrompt(userPrompt.replace('/analyze', '').trim(), options);
        } else if (userPrompt.startsWith('/optimize')) {
            prompt = this.buildOptimizePrompt(userPrompt.replace('/optimize', '').trim(), options);
        } else if (userPrompt.startsWith('/refactor')) {
            prompt = this.buildRefactorPrompt(userPrompt.replace('/refactor', '').trim(), options);
        } else if (userPrompt.startsWith('/security')) {
            prompt = this.buildSecurityPrompt(userPrompt.replace('/security', '').trim(), options);
        } else if (userPrompt.startsWith('/complexity')) {
            prompt = this.buildComplexityPrompt(userPrompt.replace('/complexity', '').trim(), options);
        } else {
            prompt = this.buildGeneralPrompt(userPrompt, options);
        }

        return prompt;
    }

    /**
     * Prompt para análise completa
     */
    private buildAnalyzePrompt(code: string, options: OptimizationOptions): string {
        return `
Analise o seguinte código e forneça uma avaliação completa:

\`\`\`${options.language !== 'auto' ? options.language : ''}
${code}
\`\`\`

Por favor, analise:
1. **Qualidade Geral**: Nota de 1-10 e justificativa
2. **Performance**: Identifique gargalos e sugestões
3. **Legibilidade**: Avalie clareza e organização
4. **Segurança**: Identifique vulnerabilidades potenciais
5. **Manutenibilidade**: Avalie facilidade de manutenção
6. **Code Smells**: Liste anti-patterns encontrados
7. **Recomendações**: Priorize melhorias por impacto
    `.trim();
    }

    /**
     * Prompt para otimização de performance
     */
    private buildOptimizePrompt(code: string, options: OptimizationOptions): string {
        return `
Otimize o seguinte código para MÁXIMA PERFORMANCE:

\`\`\`${options.language !== 'auto' ? options.language : ''}
${code}
\`\`\`

Foque em:
1. Complexidade de tempo (Big O)
2. Complexidade de espaço
3. Operações de I/O
4. Alocações de memória
5. Loops e iterações
6. Estruturas de dados

${options.explain ? 'Explique cada otimização realizada.' : ''}
${options.preserveComments ? 'Preserve comentários importantes.' : ''}

Forneça o código otimizado com métricas de melhoria estimadas.
    `.trim();
    }

    /**
     * Prompt para refatoração
     */
    private buildRefactorPrompt(code: string, options: OptimizationOptions): string {
        return `
Refatore o seguinte código para MÁXIMA LEGIBILIDADE:

\`\`\`${options.language !== 'auto' ? options.language : ''}
${code}
\`\`\`

Aplique:
1. Clean Code principles
2. SOLID principles (quando aplicável)
3. Naming conventions apropriadas
4. Extração de funções/métodos
5. Redução de complexidade ciclomática
6. Documentação adequada

${options.explain ? 'Explique cada refatoração realizada.' : ''}

Forneça o código refatorado mantendo a funcionalidade original.
    `.trim();
    }

    /**
     * Prompt para análise de segurança
     */
    private buildSecurityPrompt(code: string, options: OptimizationOptions): string {
        return `
Realize uma ANÁLISE DE SEGURANÇA no seguinte código:

\`\`\`${options.language !== 'auto' ? options.language : ''}
${code}
\`\`\`

Verifique:
1. Injeção (SQL, XSS, Command)
2. Validação de entrada
3. Autenticação/Autorização
4. Exposição de dados sensíveis
5. Gerenciamento de segredos
6. Dependências vulneráveis
7. OWASP Top 10

Para cada vulnerabilidade encontrada:
- Descreva o risco
- Classifique a severidade (Crítica/Alta/Média/Baixa)
- Forneça solução

Forneça código corrigido quando aplicável.
    `.trim();
    }

    /**
     * Prompt para análise de complexidade
     */
    private buildComplexityPrompt(code: string, options: OptimizationOptions): string {
        return `
Analise a COMPLEXIDADE do seguinte código:

\`\`\`${options.language !== 'auto' ? options.language : ''}
${code}
\`\`\`

Calcule e explique:
1. Complexidade Ciclomática
2. Complexidade Cognitiva
3. Profundidade de Aninhamento
4. Número de Parâmetros
5. Linhas de Código (LOC)
6. Acoplamento e Coesão

Forneça:
- Métricas numéricas
- Comparação com thresholds recomendados
- Visualização em markdown (se útil)
- Sugestões para reduzir complexidade
    `.trim();
    }

    /**
     * Prompt geral
     */
    private buildGeneralPrompt(userPrompt: string, options: OptimizationOptions): string {
        return `
Analise e otimize o código conforme solicitado:

${userPrompt}

Alvo de otimização: ${options.target}
${options.language !== 'auto' ? `Linguagem: ${options.language}` : ''}
${options.explain ? 'Forneça explicações detalhadas.' : ''}
${options.preserveComments ? 'Preserve comentários.' : ''}
    `.trim();
    }

    /**
     * Formata output com seções
     */
    protected formatOutput(content: string): string {
        // Adicionar cabeçalho se não existir
        if (!content.startsWith('#')) {
            return `## 📊 Análise de Código\n\n${content}`;
        }
        return content;
    }

    /**
     * Analisa código diretamente
     */
    async analyzeCode(
        code: string,
        language: CodeLanguage = 'auto',
        target: OptimizationTarget = 'all'
    ): Promise<AgentOutput> {
        return this.execute({
            prompt: `/analyze ${code}`,
            context: { language, target },
        });
    }

    /**
     * Otimiza código diretamente
     */
    async optimizeCode(
        code: string,
        language: CodeLanguage = 'auto'
    ): Promise<AgentOutput> {
        return this.execute({
            prompt: `/optimize ${code}`,
            context: { language, target: 'performance' },
        });
    }

    /**
     * Refatora código diretamente
     */
    async refactorCode(
        code: string,
        language: CodeLanguage = 'auto'
    ): Promise<AgentOutput> {
        return this.execute({
            prompt: `/refactor ${code}`,
            context: { language, target: 'readability' },
        });
    }

    /**
     * Análise de segurança direta
     */
    async securityAudit(
        code: string,
        language: CodeLanguage = 'auto'
    ): Promise<AgentOutput> {
        return this.execute({
            prompt: `/security ${code}`,
            context: { language, target: 'security' },
        });
    }
}

// Criar instância padrão
export const codeOptimizerAgent = new CodeOptimizerAgent();
