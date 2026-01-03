/**
 * PAGIA - Tester Agent
 * Agente especializado em testes e TDD
 * 
 * @module agents/specialized/tester-agent
 * @author Automações Comerciais Integradas
 */

import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';
import type { AIProvider } from '../../types/index.js';

export type TestFramework = 'jest' | 'vitest' | 'mocha' | 'pytest' | 'unittest' | 'auto';
export type TestType = 'unit' | 'integration' | 'e2e' | 'all';

interface TestingOptions {
    framework: TestFramework;
    testType: TestType;
    language: string;
    coverage: boolean;
    mocks: boolean;
}

/**
 * Classe TesterAgent - Agente para geração de testes e TDD
 */
export class TesterAgent extends BaseAgent {
    readonly name = 'Agente de Testes';
    readonly role = 'Especialista em TDD e Quality Assurance';
    readonly description = 'Gera testes automatizados, analisa cobertura e guia desenvolvimento TDD';
    readonly module = 'core';

    capabilities = [
        'geração de testes unitários',
        'geração de testes de integração',
        'testes end-to-end',
        'análise de cobertura',
        'TDD workflow',
        'mocking',
        'test debugging',
    ];

    instructions = `
Você é um especialista em Quality Assurance e Test-Driven Development.

Diretrizes:
1. Siga o ciclo TDD: Red → Green → Refactor
2. Escreva testes claros e focados
3. Use arrange-act-assert pattern
4. Nomeie testes de forma descritiva
5. Cubra edge cases e error handling
6. Use mocks apropriadamente
7. Mantenha testes independentes

Boas práticas:
- Um assert por teste quando possível
- Testes devem ser determinísticos
- Evite lógica complexa nos testes
- Documente cenários não óbvios
  `;

    menu = [
        { trigger: '/generate', description: 'Gerar testes para código' },
        { trigger: '/tdd', description: 'Iniciar ciclo TDD' },
        { trigger: '/coverage', description: 'Analisar cobertura' },
        { trigger: '/mock', description: 'Gerar mocks' },
        { trigger: '/fix', description: 'Corrigir teste falhando' },
        { trigger: '/edge-cases', description: 'Sugerir edge cases' },
    ];

    private defaultOptions: TestingOptions = {
        framework: 'auto',
        testType: 'unit',
        language: 'typescript',
        coverage: true,
        mocks: true,
    };

    constructor(aiProvider?: Partial<AIProvider>) {
        super(aiProvider);
    }

    /**
     * Executa geração/análise de testes
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
            throw new Error(`Erro nos testes: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Parseia opções do input
     */
    private parseOptions(input: AgentInput): TestingOptions {
        const context = input.context || {};

        return {
            framework: (context.framework as TestFramework) || this.defaultOptions.framework,
            testType: (context.testType as TestType) || this.defaultOptions.testType,
            language: (context.language as string) || this.defaultOptions.language,
            coverage: context.coverage !== false,
            mocks: context.mocks !== false,
        };
    }

    /**
     * Constrói prompt específico
     */
    private buildPrompt(userPrompt: string, options: TestingOptions): string {
        if (userPrompt.startsWith('/generate')) {
            return this.buildGeneratePrompt(userPrompt.replace('/generate', '').trim(), options);
        } else if (userPrompt.startsWith('/tdd')) {
            return this.buildTDDPrompt(userPrompt.replace('/tdd', '').trim(), options);
        } else if (userPrompt.startsWith('/coverage')) {
            return this.buildCoveragePrompt(userPrompt.replace('/coverage', '').trim(), options);
        } else if (userPrompt.startsWith('/mock')) {
            return this.buildMockPrompt(userPrompt.replace('/mock', '').trim(), options);
        } else if (userPrompt.startsWith('/fix')) {
            return this.buildFixPrompt(userPrompt.replace('/fix', '').trim(), options);
        } else if (userPrompt.startsWith('/edge-cases')) {
            return this.buildEdgeCasesPrompt(userPrompt.replace('/edge-cases', '').trim(), options);
        }

        return this.buildGeneralPrompt(userPrompt, options);
    }

    /**
     * Prompt para gerar testes
     */
    private buildGeneratePrompt(code: string, options: TestingOptions): string {
        const framework = options.framework === 'auto'
            ? this.detectFramework(options.language)
            : options.framework;

        return `
Gere TESTES ${options.testType.toUpperCase()} para o seguinte código:

\`\`\`${options.language}
${code}
\`\`\`

Framework: ${framework}
Linguagem: ${options.language}

Requisitos:
1. Cubra todos os caminhos de código
2. Teste casos de sucesso e erro
3. Use describe/it pattern
4. Nomes descritivos em português
5. ${options.mocks ? 'Inclua mocks necessários' : 'Evite mocks complexos'}

Estrutura esperada:
\`\`\`${options.language}
describe('NomeDaClasse/Função', () => {
  describe('nomeDoMétodo', () => {
    it('deve fazer X quando Y', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
\`\`\`

Forneça testes completos e executáveis.
    `.trim();
    }

    /**
     * Prompt para ciclo TDD
     */
    private buildTDDPrompt(requirement: string, options: TestingOptions): string {
        return `
Inicie um CICLO TDD para o requisito:

${requirement}

Framework: ${options.framework === 'auto' ? this.detectFramework(options.language) : options.framework}
Linguagem: ${options.language}

## Fase 1: RED (Escreva o teste primeiro)

Crie um teste que falha para o requisito.
O código de implementação ainda NÃO existe.

## Fase 2: GREEN (Implementação mínima)

Após os testes, forneça a implementação MÍNIMA 
para fazer o teste passar.

## Fase 3: REFACTOR (Melhoria)

Sugira refatorações mantendo os testes verdes.

---

Para cada fase, forneça:
1. Código completo
2. Explicação da decisão
3. Próximos passos

Comece pela Fase 1 (RED).
    `.trim();
    }

    /**
     * Prompt para análise de cobertura
     */
    private buildCoveragePrompt(code: string, options: TestingOptions): string {
        return `
Analise a COBERTURA DE TESTES para:

\`\`\`${options.language}
${code}
\`\`\`

Identifique:
1. **Linhas cobertas**: O que está testado
2. **Linhas não cobertas**: O que falta testar
3. **Branches não cobertas**: Condicionais não testadas
4. **Funções não testadas**: Métodos sem teste

Para cada gap, sugira:
- Teste específico
- Por que é importante
- Prioridade (Alta/Média/Baixa)

Forneça uma métrica estimada:
- Cobertura de linhas: X%
- Cobertura de branches: X%
- Cobertura de funções: X%

Sugira testes para atingir 80%+ de cobertura.
    `.trim();
    }

    /**
     * Prompt para gerar mocks
     */
    private buildMockPrompt(dependencies: string, options: TestingOptions): string {
        return `
Gere MOCKS para as seguintes dependências:

${dependencies}

Framework: ${options.framework === 'auto' ? this.detectFramework(options.language) : options.framework}
Linguagem: ${options.language}

Para cada dependência:
1. **Mock básico**: Implementação mínima
2. **Mock com comportamento**: Retornos configuráveis
3. **Spy**: Para verificar chamadas

Inclua:
- Tipos TypeScript (se aplicável)
- Funções helper para setup
- Reset entre testes
- Exemplos de uso

\`\`\`${options.language}
// Mock Factory
const createMock[Dependency] = (overrides = {}) => ({
  // métodos mockados
  ...overrides
});

// Spy
const spy = jest.spyOn(objeto, 'metodo');
\`\`\`
    `.trim();
    }

    /**
     * Prompt para corrigir teste falhando
     */
    private buildFixPrompt(failingTest: string, options: TestingOptions): string {
        return `
Analise e corrija o TESTE FALHANDO:

${failingTest}

Framework: ${options.framework === 'auto' ? this.detectFramework(options.language) : options.framework}

Diagnóstico:
1. **Causa provável**: Por que está falhando
2. **Setup incorreto?**: Problemas no Arrange
3. **Assertion errada?**: Assert incompatível
4. **Timing issue?**: Assincronicidade
5. **Mock incorreto?**: Dependência mal configurada

Solução:
1. Explique o problema
2. Forneça o teste corrigido
3. Explique a correção
4. Sugira como evitar no futuro

Se o teste está correto e a implementação errada,
indique o que precisa mudar na implementação.
    `.trim();
    }

    /**
     * Prompt para sugerir edge cases
     */
    private buildEdgeCasesPrompt(code: string, options: TestingOptions): string {
        return `
Sugira EDGE CASES para testar:

\`\`\`${options.language}
${code}
\`\`\`

Categorias a considerar:
1. **Inputs extremos**: null, undefined, vazio, máximo
2. **Tipos inválidos**: Tipos inesperados
3. **Limites**: 0, 1, -1, MAX_INT, MIN_INT
4. **Strings**: Vazia, muito longa, caracteres especiais, Unicode
5. **Arrays/Listas**: Vazio, um elemento, muitos elementos
6. **Async**: Timeout, rejeição, race conditions
7. **Estado**: Estado inicial, transitório, final
8. **Concorrência**: Chamadas simultâneas

Para cada edge case:
- Descrição do cenário
- Input de teste
- Comportamento esperado
- Por que é importante testar

Priorize por risco de bug real.
    `.trim();
    }

    /**
     * Prompt geral
     */
    private buildGeneralPrompt(userPrompt: string, options: TestingOptions): string {
        return `
Auxilie com testes conforme solicitado:

${userPrompt}

Framework: ${options.framework}
Tipo de teste: ${options.testType}
Linguagem: ${options.language}
${options.coverage ? 'Considere cobertura de código.' : ''}
${options.mocks ? 'Pode usar mocks quando necessário.' : ''}

Forneça código de teste completo e executável.
    `.trim();
    }

    /**
     * Detecta framework baseado na linguagem
     */
    private detectFramework(language: string): string {
        const frameworks: Record<string, string> = {
            typescript: 'vitest',
            javascript: 'jest',
            python: 'pytest',
            java: 'junit',
            csharp: 'xunit',
            go: 'testing',
            rust: 'cargo test',
        };
        return frameworks[language.toLowerCase()] || 'jest';
    }

    /**
     * Gera testes diretamente
     */
    async generateTests(
        code: string,
        language: string = 'typescript',
        framework: TestFramework = 'auto'
    ): Promise<AgentOutput> {
        return this.execute({
            prompt: `/generate ${code}`,
            context: { language, framework },
        });
    }

    /**
     * Inicia ciclo TDD
     */
    async startTDD(
        requirement: string,
        language: string = 'typescript'
    ): Promise<AgentOutput> {
        return this.execute({
            prompt: `/tdd ${requirement}`,
            context: { language },
        });
    }

    /**
     * Analisa cobertura
     */
    async analyzeCoverage(code: string, language: string = 'typescript'): Promise<AgentOutput> {
        return this.execute({
            prompt: `/coverage ${code}`,
            context: { language },
        });
    }

    /**
     * Gera mocks
     */
    async generateMocks(dependencies: string, language: string = 'typescript'): Promise<AgentOutput> {
        return this.execute({
            prompt: `/mock ${dependencies}`,
            context: { language },
        });
    }

    /**
     * Corrige teste
     */
    async fixTest(failingTest: string, framework: TestFramework = 'auto'): Promise<AgentOutput> {
        return this.execute({
            prompt: `/fix ${failingTest}`,
            context: { framework },
        });
    }

    /**
     * Sugere edge cases
     */
    async suggestEdgeCases(code: string, language: string = 'typescript'): Promise<AgentOutput> {
        return this.execute({
            prompt: `/edge-cases ${code}`,
            context: { language },
        });
    }
}

// Criar instância padrão
export const testerAgent = new TesterAgent();
