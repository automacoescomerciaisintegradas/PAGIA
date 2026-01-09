/**
 * PAGIA - Agent Composer
 * Sistema de composição de subagentes
 *
 * @module agents/agent-composer
 * @author Automações Comerciais Integradas
 */
import { BaseAgent, AgentInput, AgentOutput } from './base-agent.js';
import type { AIProvider } from '../types/index.js';
import type { WorkflowDefinition, WorkflowExecutionResult } from './workflow-types.js';
/**
 * Estratégias de composição de agentes
 */
export type CompositionStrategy = 'sequential' | 'parallel' | 'pipeline' | 'voting' | 'specialist';
interface CompositionConfig {
    strategy: CompositionStrategy;
    aggregator?: AggregatorFunction;
    selector?: SelectorFunction;
    timeout?: number;
    /** Número máximo de agentes executando em paralelo (default: 5) */
    maxConcurrency?: number;
    /** Se true, aborta no primeiro erro (default: false) */
    failFast?: boolean;
}
type AggregatorFunction = (outputs: AgentOutput[]) => AgentOutput;
type SelectorFunction = (outputs: AgentOutput[]) => AgentOutput;
/**
 * Classe ComposedAgent - Agente composto de múltiplos subagentes
 */
export declare class ComposedAgent extends BaseAgent {
    readonly name: string;
    readonly role: string;
    readonly description: string;
    readonly module: string;
    private subagents;
    private config;
    constructor(name: string, role: string, subagents: BaseAgent[], config: CompositionConfig, aiProvider?: Partial<AIProvider>);
    /**
     * Agrega capacidades de todos os subagentes
     */
    private aggregateCapabilities;
    /**
     * Executa o agente composto
     */
    execute(input: AgentInput): Promise<AgentOutput>;
    /**
     * Execução sequencial - cada agente executa após o anterior
     */
    private executeSequential;
    /**
     * Execução paralela - agentes executam simultaneamente com controle de concorrência
     */
    private executeParallel;
    /**
     * Execução em pipeline - output de um é input do próximo
     */
    private executePipeline;
    /**
     * Execução com votação - melhor resultado é selecionado
     */
    private executeVoting;
    /**
     * Execução com especialista - um agente decide quem executa
     */
    private executeSpecialist;
    /**
     * Agrega outputs de múltiplos agentes
     */
    private aggregateOutputs;
    /**
     * Agregador padrão - concatena outputs
     */
    private defaultAggregator;
    /**
     * Seletor padrão - escolhe o maior output
     */
    private defaultSelector;
    /**
     * Agrega ações sugeridas de todos os outputs
     */
    private aggregateSuggestedActions;
    /**
     * Obtém subagentes
     */
    getSubagents(): BaseAgent[];
    /**
     * Adiciona subagente
     */
    addSubagent(agent: BaseAgent): void;
    /**
     * Remove subagente
     */
    removeSubagent(agentId: string): boolean;
}
/**
 * Classe AgentComposer - Factory para criação de agentes compostos
 */
export declare class AgentComposer {
    private static instance;
    private constructor();
    /**
     * Obtém a instância singleton do AgentComposer
     */
    static getInstance(): AgentComposer;
    /**
     * Compõe agentes em um agente composto
     */
    compose(name: string, role: string, agents: BaseAgent[], strategy?: CompositionStrategy, options?: Partial<CompositionConfig>): ComposedAgent;
    /**
     * Compõe agentes por IDs do registro
     */
    composeByIds(name: string, role: string, agentIds: string[], strategy?: CompositionStrategy, options?: Partial<CompositionConfig>): ComposedAgent | null;
    /**
     * Compõe agentes por capacidades
     */
    composeByCapabilities(name: string, role: string, capabilities: string[], strategy?: CompositionStrategy, options?: Partial<CompositionConfig>): ComposedAgent | null;
    /**
     * Cria um pipeline de agentes
     */
    createPipeline(name: string, agents: BaseAgent[], options?: Partial<CompositionConfig>): ComposedAgent;
    /**
     * Cria um ensemble de agentes com votação
     */
    createEnsemble(name: string, agents: BaseAgent[], selector?: SelectorFunction, options?: Partial<CompositionConfig>): ComposedAgent;
    /**
     * Decompõe um agente composto
     */
    decompose(composedAgent: ComposedAgent): BaseAgent[];
    /**
     * Compõe agentes em um workflow DAG
     *
     * @example
     * ```typescript
     * const result = await agentComposer.composeDAG({
     *   id: 'analyze-and-implement',
     *   name: 'Análise e Implementação',
     *   nodes: [
     *     { id: 'analyze', agentId: 'analyst' },
     *     { id: 'plan', agentId: 'planner' },
     *     { id: 'implement', agentId: 'developer' },
     *   ],
     *   edges: [
     *     { from: '__start__', to: 'analyze' },
     *     { from: 'analyze', to: 'plan' },
     *     { from: 'plan', to: 'implement' },
     *     { from: 'implement', to: '__end__' },
     *   ],
     *   config: { maxConcurrency: 3 }
     * }, input);
     * ```
     */
    composeDAG(workflow: WorkflowDefinition, input: AgentInput): Promise<WorkflowExecutionResult>;
    /**
     * Cria um workflow DAG a partir de uma lista de agentes
     * Útil para criar workflows simples programaticamente
     *
     * @param name Nome do workflow
     * @param agents Lista de agentes (podem incluir dependências)
     * @param structure Estrutura do workflow ('linear' | 'parallel' | 'fan-out-in')
     * @param options Configurações adicionais
     */
    createWorkflowFromAgents(name: string, agents: BaseAgent[], structure?: 'linear' | 'parallel' | 'fan-out-in', options?: {
        maxConcurrency?: number;
        timeout?: number;
    }): WorkflowDefinition;
    /**
     * Executa um workflow criado a partir de agentes
     */
    executeWorkflow(name: string, agents: BaseAgent[], input: AgentInput, structure?: 'linear' | 'parallel' | 'fan-out-in', options?: {
        maxConcurrency?: number;
        timeout?: number;
    }): Promise<WorkflowExecutionResult>;
}
export declare const agentComposer: AgentComposer;
export {};
//# sourceMappingURL=agent-composer.d.ts.map