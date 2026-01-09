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
/**
 * Classe CodeOptimizerAgent - Agente para otimização de código
 */
export declare class CodeOptimizerAgent extends BaseAgent {
    readonly name = "Otimizador de C\u00F3digo";
    readonly role = "Especialista em otimiza\u00E7\u00E3o e refatora\u00E7\u00E3o de c\u00F3digo";
    readonly description = "Analisa e otimiza c\u00F3digo para melhor performance, legibilidade e seguran\u00E7a";
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
     * Executa análise e otimização de código
     */
    execute(input: AgentInput): Promise<AgentOutput>;
    /**
     * Parseia opções do input
     */
    private parseOptions;
    /**
     * Constrói prompt específico para otimização
     */
    private buildPrompt;
    /**
     * Prompt para análise completa
     */
    private buildAnalyzePrompt;
    /**
     * Prompt para otimização de performance
     */
    private buildOptimizePrompt;
    /**
     * Prompt para refatoração
     */
    private buildRefactorPrompt;
    /**
     * Prompt para análise de segurança
     */
    private buildSecurityPrompt;
    /**
     * Prompt para análise de complexidade
     */
    private buildComplexityPrompt;
    /**
     * Prompt geral
     */
    private buildGeneralPrompt;
    /**
     * Formata output com seções
     */
    protected formatOutput(content: string): string;
    /**
     * Analisa código diretamente
     */
    analyzeCode(code: string, language?: CodeLanguage, target?: OptimizationTarget): Promise<AgentOutput>;
    /**
     * Otimiza código diretamente
     */
    optimizeCode(code: string, language?: CodeLanguage): Promise<AgentOutput>;
    /**
     * Refatora código diretamente
     */
    refactorCode(code: string, language?: CodeLanguage): Promise<AgentOutput>;
    /**
     * Análise de segurança direta
     */
    securityAudit(code: string, language?: CodeLanguage): Promise<AgentOutput>;
}
export declare const codeOptimizerAgent: CodeOptimizerAgent;
//# sourceMappingURL=code-optimizer.d.ts.map