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
/**
 * Classe PlannerAgent - Agente para planejamento de projetos
 */
export declare class PlannerAgent extends BaseAgent {
    readonly name = "Agente Planejador";
    readonly role = "Especialista em planejamento e gest\u00E3o de projetos";
    readonly description = "Cria planos de a\u00E7\u00E3o detalhados, decomp\u00F5e tarefas e gerencia cronogramas";
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
     * Executa planejamento
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
     * Prompt para criar plano
     */
    private buildPlanPrompt;
    /**
     * Prompt para decomposição
     */
    private buildDecomposePrompt;
    /**
     * Prompt para estimativas
     */
    private buildEstimatePrompt;
    /**
     * Prompt para análise de riscos
     */
    private buildRisksPrompt;
    /**
     * Prompt para roadmap
     */
    private buildRoadmapPrompt;
    /**
     * Prompt para planejamento de sprint
     */
    private buildSprintPrompt;
    /**
     * Prompt geral
     */
    private buildGeneralPrompt;
    /**
     * Converte formato do output
     */
    private convertFormat;
    /**
     * Cria plano de ação diretamente
     */
    createPlan(requirement: string, type?: PlanType, format?: PlanFormat): Promise<AgentOutput>;
    /**
     * Decompõe feature em tarefas
     */
    decomposeTasks(feature: string): Promise<AgentOutput>;
    /**
     * Estima esforço de tarefas
     */
    estimateEffort(tasks: string): Promise<AgentOutput>;
    /**
     * Analisa riscos
     */
    analyzeRisks(project: string): Promise<AgentOutput>;
    /**
     * Cria roadmap
     */
    createRoadmap(project: string): Promise<AgentOutput>;
    /**
     * Planeja sprint
     */
    planSprint(backlog: string): Promise<AgentOutput>;
}
export declare const plannerAgent: PlannerAgent;
//# sourceMappingURL=planner-agent.d.ts.map