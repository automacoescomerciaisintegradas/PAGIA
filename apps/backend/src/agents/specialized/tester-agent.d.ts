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
/**
 * Classe TesterAgent - Agente para geração de testes e TDD
 */
export declare class TesterAgent extends BaseAgent {
    readonly name = "Agente de Testes";
    readonly role = "Especialista em TDD e Quality Assurance";
    readonly description = "Gera testes automatizados, analisa cobertura e guia desenvolvimento TDD";
    readonly module = "core";
    capabilities: string[];
    instructions: string;
    menu: {
        trigger: string;
        description: string;
    }[];
    private defaultOptions;
    constructor(aiProvider?: Partial<AIProvider>);
    /**
     * Executa geração/análise de testes
     */
    execute(input: AgentInput): Promise<AgentOutput>;
    /**
     * Parseia opções do input
     */
    private parseOptions;
    /**
     * Constrói prompt específico
     */
    private buildPrompt;
    /**
     * Prompt para gerar testes
     */
    private buildGeneratePrompt;
    /**
     * Prompt para ciclo TDD
     */
    private buildTDDPrompt;
    /**
     * Prompt para análise de cobertura
     */
    private buildCoveragePrompt;
    /**
     * Prompt para gerar mocks
     */
    private buildMockPrompt;
    /**
     * Prompt para corrigir teste falhando
     */
    private buildFixPrompt;
    /**
     * Prompt para sugerir edge cases
     */
    private buildEdgeCasesPrompt;
    /**
     * Prompt geral
     */
    private buildGeneralPrompt;
    /**
     * Detecta framework baseado na linguagem
     */
    private detectFramework;
    /**
     * Gera testes diretamente
     */
    generateTests(code: string, language?: string, framework?: TestFramework): Promise<AgentOutput>;
    /**
     * Inicia ciclo TDD
     */
    startTDD(requirement: string, language?: string): Promise<AgentOutput>;
    /**
     * Analisa cobertura
     */
    analyzeCoverage(code: string, language?: string): Promise<AgentOutput>;
    /**
     * Gera mocks
     */
    generateMocks(dependencies: string, language?: string): Promise<AgentOutput>;
    /**
     * Corrige teste
     */
    fixTest(failingTest: string, framework?: TestFramework): Promise<AgentOutput>;
    /**
     * Sugere edge cases
     */
    suggestEdgeCases(code: string, language?: string): Promise<AgentOutput>;
}
export declare const testerAgent: TesterAgent;
//# sourceMappingURL=tester-agent.d.ts.map