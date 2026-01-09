/**
 * PAGIA - Workflow Engine
 * Motor de execução de workflows baseados em DAG
 *
 * @module agents/workflow-engine
 * @author Automações Comerciais Integradas
 */
import type { AgentInput } from './base-agent.js';
import type { WorkflowDefinition, WorkflowExecutionResult } from './workflow-types.js';
/**
 * Motor de execução de workflows DAG
 *
 * @example
 * ```typescript
 * const engine = WorkflowEngine.getInstance();
 *
 * const result = await engine.execute(workflowDefinition, {
 *   prompt: 'Analisar código do projeto',
 *   context: { projectPath: './src' }
 * });
 *
 * console.log(`Workflow completado: ${result.status}`);
 * console.log(`Tempo total: ${result.metrics.totalDurationMs}ms`);
 * ```
 */
export declare class WorkflowEngine {
    private static instance;
    private constructor();
    /**
     * Obtém instância singleton
     */
    static getInstance(): WorkflowEngine;
    /**
     * Executa um workflow
     *
     * @param workflow Definição do workflow
     * @param input Input inicial
     * @returns Resultado da execução
     */
    execute(workflow: WorkflowDefinition, input: AgentInput): Promise<WorkflowExecutionResult>;
    /**
     * Executa nodos do workflow respeitando dependências
     */
    private executeNodes;
    /**
     * Executa um nodo individual
     */
    private executeNode;
    /**
     * Mapper de input padrão
     */
    private defaultInputMapper;
    /**
     * Agrega resultados de todos os nodos
     */
    private aggregateResults;
    /**
     * Calcula métricas de execução
     */
    private calculateMetrics;
    /**
     * Verifica e emite evento de merge de branches
     */
    private checkBranchMerge;
    private emitWorkflowStarted;
    private emitWorkflowCompleted;
    private emitWorkflowFailed;
    private emitNodeStarted;
    private emitNodeCompleted;
    private emitNodeRetry;
}
export declare const workflowEngine: WorkflowEngine;
//# sourceMappingURL=workflow-engine.d.ts.map