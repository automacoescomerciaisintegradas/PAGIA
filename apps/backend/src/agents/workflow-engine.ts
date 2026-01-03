/**
 * PAGIA - Workflow Engine
 * Motor de execução de workflows baseados em DAG
 * 
 * @module agents/workflow-engine
 * @author Automações Comerciais Integradas
 */

import { v4 as uuidv4 } from 'uuid';
import type { AgentInput, AgentOutput } from './base-agent.js';
import { agentRegistry } from './agent-registry.js';
import { eventBus, PAGIAEvents } from '../core/event-bus.js';
import { Semaphore } from '../utils/semaphore.js';
import { withRetryPolicy } from '../utils/retry.js';
import { getReadyNodes, topologicalSort } from './workflow-dag.js';
import type {
    WorkflowDefinition,
    WorkflowNode,
    WorkflowConfig,
    WorkflowExecutionContext,
    WorkflowExecutionResult,
    NodeExecutionResult,
    WorkflowMetrics,
    RetryPolicy,
    AggregatorFunction,
} from './workflow-types.js';
import {
    START_NODE_ID,
    END_NODE_ID,
    DEFAULT_RETRY_POLICY,
} from './workflow-types.js';

// ============================================================================
// Workflow Engine
// ============================================================================

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
export class WorkflowEngine {
    private static instance: WorkflowEngine;

    private constructor() { }

    /**
     * Obtém instância singleton
     */
    static getInstance(): WorkflowEngine {
        if (!WorkflowEngine.instance) {
            WorkflowEngine.instance = new WorkflowEngine();
        }
        return WorkflowEngine.instance;
    }

    /**
     * Executa um workflow
     * 
     * @param workflow Definição do workflow
     * @param input Input inicial
     * @returns Resultado da execução
     */
    async execute(
        workflow: WorkflowDefinition,
        input: AgentInput
    ): Promise<WorkflowExecutionResult> {
        const executionId = uuidv4();
        const startedAt = new Date();
        const config = workflow.config;

        // Criar contexto de execução
        const context: WorkflowExecutionContext = {
            executionId,
            workflowId: workflow.id,
            startedAt,
            initialInput: input,
            sharedState: {},
            completedNodes: new Map(),
            runningNodes: new Set(),
            pendingNodes: new Set(workflow.nodes.map(n => n.id)),
        };

        // Emitir evento de início
        await this.emitWorkflowStarted(workflow, input, executionId);

        // Criar semáforo para controle de concorrência
        const semaphore = new Semaphore(config.maxConcurrency);

        // Criar timeout promise se configurado
        let timeoutId: NodeJS.Timeout | undefined;
        const timeoutPromise = config.timeout
            ? new Promise<never>((_, reject) => {
                timeoutId = setTimeout(
                    () => reject(new Error('Workflow timeout')),
                    config.timeout
                );
            })
            : null;

        try {
            // Executar workflow
            const executionPromise = this.executeNodes(
                workflow,
                context,
                semaphore,
                config
            );

            // Aguardar com ou sem timeout
            if (timeoutPromise) {
                await Promise.race([executionPromise, timeoutPromise]);
            } else {
                await executionPromise;
            }

            // Verificar se todos os nodos completaram
            const allCompleted = workflow.nodes.every(
                n => context.completedNodes.has(n.id)
            );

            const completedAt = new Date();
            const metrics = this.calculateMetrics(context, startedAt, completedAt);

            // Agregar resultados
            const aggregatedOutput = this.aggregateResults(
                workflow,
                context,
                config.aggregator
            );

            const result: WorkflowExecutionResult = {
                executionId,
                workflowId: workflow.id,
                status: allCompleted ? 'completed' : 'failed',
                output: aggregatedOutput,
                nodeResults: context.completedNodes,
                metrics,
                startedAt,
                completedAt,
            };

            await this.emitWorkflowCompleted(result);
            return result;

        } catch (error) {
            const completedAt = new Date();
            const metrics = this.calculateMetrics(context, startedAt, completedAt);
            const isTimeout = error instanceof Error && error.message === 'Workflow timeout';

            const result: WorkflowExecutionResult = {
                executionId,
                workflowId: workflow.id,
                status: isTimeout ? 'timeout' : 'failed',
                error: error instanceof Error ? error : new Error(String(error)),
                nodeResults: context.completedNodes,
                metrics,
                startedAt,
                completedAt,
            };

            await this.emitWorkflowFailed(result, error as Error);
            return result;

        } finally {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        }
    }

    /**
     * Executa nodos do workflow respeitando dependências
     */
    private async executeNodes(
        workflow: WorkflowDefinition,
        context: WorkflowExecutionContext,
        semaphore: Semaphore,
        config: WorkflowConfig
    ): Promise<void> {
        const nodeMap = new Map(workflow.nodes.map(n => [n.id, n]));
        const completedSet = new Set<string>([START_NODE_ID]);

        // Loop até todos os nodos serem processados
        while (context.pendingNodes.size > 0 || context.runningNodes.size > 0) {
            // Obter nodos prontos para executar
            const readyNodes = getReadyNodes(workflow, completedSet);
            const nodesToStart = readyNodes.filter(
                id => !context.runningNodes.has(id) && context.pendingNodes.has(id)
            );

            if (nodesToStart.length === 0 && context.runningNodes.size === 0) {
                // Nenhum nodo para executar e nenhum em execução - verificar deadlock
                if (context.pendingNodes.size > 0) {
                    throw new Error(
                        `Deadlock: nodos pendentes sem dependências satisfeitas: ${Array.from(context.pendingNodes).join(', ')}`
                    );
                }
                break;
            }

            // Iniciar nodos prontos
            const nodePromises = nodesToStart.map(async nodeId => {
                const node = nodeMap.get(nodeId)!;
                context.pendingNodes.delete(nodeId);
                context.runningNodes.add(nodeId);

                try {
                    const result = await this.executeNode(
                        node,
                        context,
                        semaphore,
                        config
                    );

                    context.completedNodes.set(nodeId, result);
                    context.runningNodes.delete(nodeId);
                    completedSet.add(nodeId);

                    await this.emitNodeCompleted(context, node, result);

                    // Verificar se alguma branch foi mesclada
                    await this.checkBranchMerge(workflow, context, nodeId);

                } catch (error) {
                    context.runningNodes.delete(nodeId);

                    const result: NodeExecutionResult = {
                        nodeId,
                        status: 'failed',
                        error: error instanceof Error ? error : new Error(String(error)),
                        startedAt: new Date(),
                        completedAt: new Date(),
                        durationMs: 0,
                        attempts: 1,
                    };

                    context.completedNodes.set(nodeId, result);

                    if (config.failFast) {
                        throw error;
                    }
                }
            });

            // Aguardar pelo menos um nodo completar antes de continuar
            if (nodePromises.length > 0) {
                await Promise.race([
                    Promise.all(nodePromises),
                    // Pequeno delay para evitar busy-wait
                    new Promise(resolve => setTimeout(resolve, 10)),
                ]);
            } else {
                // Aguardar nodos em execução
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
    }

    /**
     * Executa um nodo individual
     */
    private async executeNode(
        node: WorkflowNode,
        context: WorkflowExecutionContext,
        semaphore: Semaphore,
        config: WorkflowConfig
    ): Promise<NodeExecutionResult> {
        const startedAt = new Date();
        let attempts = 0;

        await this.emitNodeStarted(context, node);

        // Adquirir semáforo
        await semaphore.acquire(config.timeout);

        try {
            // Obter agente
            const agent = agentRegistry.get(node.agentId) ||
                agentRegistry.getByName(node.agentId);

            if (!agent) {
                throw new Error(`Agente não encontrado: ${node.agentId}`);
            }

            // Preparar input
            const nodeInput = node.inputMapper
                ? node.inputMapper(context, node)
                : this.defaultInputMapper(context, node);

            // Executar com retry
            const retryPolicy: RetryPolicy = {
                ...DEFAULT_RETRY_POLICY,
                ...config.retryPolicy,
                ...node.config?.retryPolicy,
            };

            const retryResult = await withRetryPolicy(
                async () => agent.safeExecute(nodeInput),
                retryPolicy,
                {
                    onRetry: async (error, attempt, delay) => {
                        attempts = attempt;
                        await this.emitNodeRetry(context, node, error, attempt, delay, retryPolicy.maxAttempts);
                    },
                }
            );

            attempts = retryResult.attempts;

            if (!retryResult.success) {
                throw retryResult.error;
            }

            const output = retryResult.result!;
            const completedAt = new Date();

            // Atualizar contexto compartilhado
            if (node.outputMapper) {
                const updates = node.outputMapper(output, context);
                Object.assign(context.sharedState, updates);
            } else {
                context.sharedState[node.id] = output.content;
            }

            return {
                nodeId: node.id,
                status: 'success',
                output,
                startedAt,
                completedAt,
                durationMs: completedAt.getTime() - startedAt.getTime(),
                attempts,
            };

        } finally {
            semaphore.release();
        }
    }

    /**
     * Mapper de input padrão
     */
    private defaultInputMapper(
        context: WorkflowExecutionContext,
        node: WorkflowNode
    ): AgentInput {
        // Coletar outputs de nodos dependentes
        const dependentOutputs: string[] = [];
        for (const [nodeId, result] of context.completedNodes) {
            if (result.status === 'success' && result.output) {
                dependentOutputs.push(`[${nodeId}]: ${result.output.content}`);
            }
        }

        const contextString = dependentOutputs.length > 0
            ? `\n\nContexto dos passos anteriores:\n${dependentOutputs.join('\n\n')}`
            : '';

        return {
            prompt: context.initialInput.prompt + contextString,
            context: {
                ...context.initialInput.context,
                ...context.sharedState,
                workflowId: context.workflowId,
                executionId: context.executionId,
                nodeId: node.id,
            },
            history: context.initialInput.history,
            options: context.initialInput.options,
        };
    }

    /**
     * Agrega resultados de todos os nodos
     */
    private aggregateResults(
        workflow: WorkflowDefinition,
        context: WorkflowExecutionContext,
        customAggregator?: AggregatorFunction
    ): AgentOutput | undefined {
        const successfulOutputs: AgentOutput[] = [];

        // Coletar outputs na ordem topológica
        const sortResult = topologicalSort(workflow);
        for (const nodeId of sortResult.order) {
            if (nodeId === START_NODE_ID || nodeId === END_NODE_ID) continue;

            const result = context.completedNodes.get(nodeId);
            if (result?.status === 'success' && result.output) {
                successfulOutputs.push(result.output);
            }
        }

        if (successfulOutputs.length === 0) {
            return undefined;
        }

        if (customAggregator) {
            return customAggregator(successfulOutputs, context);
        }

        // Agregador padrão: concatenar outputs
        const content = successfulOutputs
            .map((o, i) => {
                const nodeId = sortResult.order[i + 1]; // +1 para pular START
                return `## ${nodeId}\n\n${o.content}`;
            })
            .join('\n\n---\n\n');

        const totalTokens = successfulOutputs.reduce(
            (sum, o) => sum + (o.metadata.tokensUsed || 0),
            0
        );

        return {
            content,
            metadata: {
                agentId: 'workflow-engine',
                agentName: workflow.name,
                tokensUsed: totalTokens,
                duration: context.completedNodes.size * 100, // Estimativa
                timestamp: new Date(),
            },
        };
    }

    /**
     * Calcula métricas de execução
     */
    private calculateMetrics(
        context: WorkflowExecutionContext,
        startedAt: Date,
        completedAt: Date
    ): WorkflowMetrics {
        let successfulNodes = 0;
        let failedNodes = 0;
        let skippedNodes = 0;
        let totalTokens = 0;

        for (const result of context.completedNodes.values()) {
            switch (result.status) {
                case 'success':
                    successfulNodes++;
                    totalTokens += result.output?.metadata.tokensUsed || 0;
                    break;
                case 'failed':
                    failedNodes++;
                    break;
                case 'skipped':
                    skippedNodes++;
                    break;
            }
        }

        const totalDurationMs = completedAt.getTime() - startedAt.getTime();

        // Calcular economia de paralelismo (estimativa)
        let sequentialTime = 0;
        for (const result of context.completedNodes.values()) {
            sequentialTime += result.durationMs;
        }
        const parallelismSavingsMs = Math.max(0, sequentialTime - totalDurationMs);

        return {
            totalDurationMs,
            totalNodes: context.completedNodes.size + context.pendingNodes.size,
            successfulNodes,
            failedNodes,
            skippedNodes,
            totalTokensUsed: totalTokens,
            maxConcurrencyReached: 0, // TODO: rastrear
            parallelismSavingsMs,
        };
    }

    /**
     * Verifica e emite evento de merge de branches
     */
    private async checkBranchMerge(
        workflow: WorkflowDefinition,
        context: WorkflowExecutionContext,
        completedNodeId: string
    ): Promise<void> {
        // Encontrar nodos que dependem deste
        const dependentEdges = workflow.edges.filter(e => e.from === completedNodeId);

        for (const edge of dependentEdges) {
            if (edge.to === END_NODE_ID) continue;

            // Verificar se todos os predecessores deste nodo completaram
            const predecessorEdges = workflow.edges.filter(e => e.to === edge.to);
            const allPredecessorsComplete = predecessorEdges.every(e =>
                e.from === START_NODE_ID || context.completedNodes.has(e.from)
            );

            if (allPredecessorsComplete && predecessorEdges.length > 1) {
                // Branch merge detectado
                const mergedNodes = predecessorEdges.map(e => e.from);
                await eventBus.emit(PAGIAEvents.WORKFLOW_BRANCH_MERGED, {
                    type: 'workflow:branch:merged',
                    executionId: context.executionId,
                    workflowId: context.workflowId,
                    timestamp: new Date(),
                    mergedNodes,
                    targetNode: edge.to,
                });
            }
        }
    }

    // ========================================================================
    // Event Emission Helpers
    // ========================================================================

    private async emitWorkflowStarted(
        workflow: WorkflowDefinition,
        input: AgentInput,
        executionId: string
    ): Promise<void> {
        await eventBus.emit(PAGIAEvents.WORKFLOW_STARTED, {
            type: 'workflow:started',
            executionId,
            workflowId: workflow.id,
            timestamp: new Date(),
            definition: workflow,
            input,
        });
    }

    private async emitWorkflowCompleted(result: WorkflowExecutionResult): Promise<void> {
        await eventBus.emit(PAGIAEvents.WORKFLOW_COMPLETED, {
            type: 'workflow:completed',
            executionId: result.executionId,
            workflowId: result.workflowId,
            timestamp: new Date(),
            result,
        });
    }

    private async emitWorkflowFailed(
        result: WorkflowExecutionResult,
        error: Error
    ): Promise<void> {
        await eventBus.emit(PAGIAEvents.WORKFLOW_ERROR, {
            type: 'workflow:failed',
            executionId: result.executionId,
            workflowId: result.workflowId,
            timestamp: new Date(),
            error,
            partialResults: result.nodeResults,
        });
    }

    private async emitNodeStarted(
        context: WorkflowExecutionContext,
        node: WorkflowNode
    ): Promise<void> {
        await eventBus.emit(PAGIAEvents.WORKFLOW_NODE_STARTED, {
            type: 'workflow:node:started',
            executionId: context.executionId,
            workflowId: context.workflowId,
            timestamp: new Date(),
            nodeId: node.id,
            nodeName: node.name,
            agentId: node.agentId,
            attempt: 1,
        });
    }

    private async emitNodeCompleted(
        context: WorkflowExecutionContext,
        node: WorkflowNode,
        result: NodeExecutionResult
    ): Promise<void> {
        await eventBus.emit(PAGIAEvents.WORKFLOW_NODE_COMPLETED, {
            type: 'workflow:node:completed',
            executionId: context.executionId,
            workflowId: context.workflowId,
            timestamp: new Date(),
            nodeId: node.id,
            nodeName: node.name,
            result,
        });
    }

    private async emitNodeRetry(
        context: WorkflowExecutionContext,
        node: WorkflowNode,
        error: Error,
        attempt: number,
        delayMs: number,
        maxAttempts: number
    ): Promise<void> {
        await eventBus.emit(PAGIAEvents.WORKFLOW_NODE_RETRY, {
            type: 'workflow:node:retry',
            executionId: context.executionId,
            workflowId: context.workflowId,
            timestamp: new Date(),
            nodeId: node.id,
            nodeName: node.name,
            attempt,
            maxAttempts,
            delayMs,
            error,
        });
    }
}

// Singleton exportado
export const workflowEngine = WorkflowEngine.getInstance();
