/**
 * PAGIA - Workflow Engine
 * Motor de execução de workflows
 * 
 * @module workflows/workflow-engine
 * @author Automações Comerciais Integradas
 */

import { v4 as uuidv4 } from 'uuid';
import { eventBus, PAGIAEvents } from '../core/event-bus.js';

export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type WorkflowStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowStep {
    id: string;
    name: string;
    description?: string;
    handler: StepHandler;
    onError?: ErrorHandler;
    condition?: ConditionFunction;
    retries?: number;
    timeout?: number;
}

export interface WorkflowDefinition {
    id: string;
    name: string;
    description?: string;
    version: string;
    steps: WorkflowStep[];
    onComplete?: CompleteHandler;
    onError?: ErrorHandler;
}

export interface WorkflowContext {
    workflowId: string;
    executionId: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    variables: Record<string, unknown>;
    stepResults: Map<string, StepResult>;
    currentStep: string | null;
    status: WorkflowStatus;
    startedAt: Date;
    completedAt?: Date;
    error?: Error;
}

export interface StepResult {
    stepId: string;
    status: WorkflowStepStatus;
    output?: unknown;
    error?: Error;
    startedAt: Date;
    completedAt?: Date;
    retries: number;
}

export interface WorkflowResult {
    success: boolean;
    executionId: string;
    output: Record<string, unknown>;
    stepResults: StepResult[];
    duration: number;
    error?: Error;
}

type StepHandler = (context: WorkflowContext, step: WorkflowStep) => Promise<unknown>;
type ErrorHandler = (error: Error, context: WorkflowContext) => Promise<void>;
type CompleteHandler = (context: WorkflowContext) => Promise<void>;
type ConditionFunction = (context: WorkflowContext) => boolean | Promise<boolean>;

/**
 * Classe WorkflowEngine - Motor de execução de workflows
 */
export class WorkflowEngine {
    private static instance: WorkflowEngine;
    private workflows: Map<string, WorkflowDefinition> = new Map();
    private executions: Map<string, WorkflowContext> = new Map();

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
     * Registra um workflow
     */
    register(workflow: WorkflowDefinition): void {
        this.workflows.set(workflow.id, workflow);
    }

    /**
     * Remove um workflow
     */
    unregister(workflowId: string): void {
        this.workflows.delete(workflowId);
    }

    /**
     * Obtém um workflow
     */
    get(workflowId: string): WorkflowDefinition | undefined {
        return this.workflows.get(workflowId);
    }

    /**
     * Lista workflows registrados
     */
    list(): WorkflowDefinition[] {
        return Array.from(this.workflows.values());
    }

    /**
     * Executa um workflow
     */
    async execute(
        workflowId: string,
        input: Record<string, unknown> = {}
    ): Promise<WorkflowResult> {
        const workflow = this.workflows.get(workflowId);

        if (!workflow) {
            throw new Error(`Workflow não encontrado: ${workflowId}`);
        }

        const executionId = uuidv4();
        const startTime = Date.now();

        // Criar contexto
        const context: WorkflowContext = {
            workflowId,
            executionId,
            input,
            output: {},
            variables: {},
            stepResults: new Map(),
            currentStep: null,
            status: 'pending',
            startedAt: new Date(),
        };

        this.executions.set(executionId, context);

        try {
            context.status = 'running';
            await eventBus.emit(PAGIAEvents.WORKFLOW_STARTED, { workflowId, executionId });

            // Executar steps
            for (const step of workflow.steps) {
                // Verificar se workflow foi pausado ou cancelado (status pode mudar externamente)
                const currentStatus = context.status as WorkflowStatus;
                if (currentStatus !== 'running') {
                    break;
                }

                // Verificar condição
                if (step.condition) {
                    const shouldRun = await step.condition(context);
                    if (!shouldRun) {
                        const result: StepResult = {
                            stepId: step.id,
                            status: 'skipped',
                            startedAt: new Date(),
                            completedAt: new Date(),
                            retries: 0,
                        };
                        context.stepResults.set(step.id, result);
                        continue;
                    }
                }

                context.currentStep = step.id;
                await this.executeStep(step, context);
            }

            // Workflow completo
            context.status = 'completed';
            context.completedAt = new Date();

            if (workflow.onComplete) {
                await workflow.onComplete(context);
            }

            await eventBus.emit(PAGIAEvents.WORKFLOW_COMPLETED, { workflowId, executionId });

            return {
                success: true,
                executionId,
                output: context.output,
                stepResults: Array.from(context.stepResults.values()),
                duration: Date.now() - startTime,
            };
        } catch (error) {
            context.status = 'failed';
            context.error = error instanceof Error ? error : new Error(String(error));
            context.completedAt = new Date();

            if (workflow.onError) {
                await workflow.onError(context.error, context);
            }

            await eventBus.emit(PAGIAEvents.WORKFLOW_ERROR, { workflowId, executionId, error });

            return {
                success: false,
                executionId,
                output: context.output,
                stepResults: Array.from(context.stepResults.values()),
                duration: Date.now() - startTime,
                error: context.error,
            };
        }
    }

    /**
     * Executa um step
     */
    private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<void> {
        const maxRetries = step.retries || 0;
        let retries = 0;
        let lastError: Error | null = null;

        const stepResult: StepResult = {
            stepId: step.id,
            status: 'running',
            startedAt: new Date(),
            retries: 0,
        };

        context.stepResults.set(step.id, stepResult);

        await eventBus.emit(PAGIAEvents.WORKFLOW_STEP, {
            workflowId: context.workflowId,
            executionId: context.executionId,
            stepId: step.id,
            status: 'running',
        });

        while (retries <= maxRetries) {
            try {
                // Executar com timeout se configurado
                let output: unknown;

                if (step.timeout) {
                    output = await this.executeWithTimeout(step.handler, context, step, step.timeout);
                } else {
                    output = await step.handler(context, step);
                }

                stepResult.status = 'completed';
                stepResult.output = output;
                stepResult.completedAt = new Date();
                stepResult.retries = retries;

                // Salvar output no contexto
                context.output[step.id] = output;

                await eventBus.emit(PAGIAEvents.WORKFLOW_STEP, {
                    workflowId: context.workflowId,
                    executionId: context.executionId,
                    stepId: step.id,
                    status: 'completed',
                });

                return;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                retries++;
                stepResult.retries = retries;

                if (retries <= maxRetries) {
                    // Aguardar antes de retry (exponential backoff)
                    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 1000));
                }
            }
        }

        // Falha após todas as tentativas
        stepResult.status = 'failed';
        stepResult.error = lastError!;
        stepResult.completedAt = new Date();

        if (step.onError) {
            await step.onError(lastError!, context);
        }

        await eventBus.emit(PAGIAEvents.WORKFLOW_STEP, {
            workflowId: context.workflowId,
            executionId: context.executionId,
            stepId: step.id,
            status: 'failed',
            error: lastError,
        });

        throw lastError;
    }

    /**
     * Executa handler com timeout
     */
    private async executeWithTimeout(
        handler: StepHandler,
        context: WorkflowContext,
        step: WorkflowStep,
        timeout: number
    ): Promise<unknown> {
        return Promise.race([
            handler(context, step),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Step timeout: ${step.id}`)), timeout)
            ),
        ]);
    }

    /**
     * Pausa uma execução
     */
    async pause(executionId: string): Promise<boolean> {
        const context = this.executions.get(executionId);

        if (!context || context.status !== 'running') {
            return false;
        }

        context.status = 'paused';
        return true;
    }

    /**
     * Resume uma execução pausada
     */
    async resume(executionId: string): Promise<boolean> {
        const context = this.executions.get(executionId);

        if (!context || context.status !== 'paused') {
            return false;
        }

        context.status = 'running';
        // TODO: Continuar execução do step atual
        return true;
    }

    /**
     * Cancela uma execução
     */
    async cancel(executionId: string): Promise<boolean> {
        const context = this.executions.get(executionId);

        if (!context || (context.status !== 'running' && context.status !== 'paused')) {
            return false;
        }

        context.status = 'cancelled';
        return true;
    }

    /**
     * Obtém contexto de execução
     */
    getExecution(executionId: string): WorkflowContext | undefined {
        return this.executions.get(executionId);
    }

    /**
     * Lista execuções
     */
    listExecutions(workflowId?: string): WorkflowContext[] {
        const executions = Array.from(this.executions.values());

        if (workflowId) {
            return executions.filter((e) => e.workflowId === workflowId);
        }

        return executions;
    }

    /**
     * Limpa execuções antigas
     */
    cleanup(maxAge: number = 24 * 60 * 60 * 1000): number {
        const now = Date.now();
        let cleaned = 0;

        for (const [id, context] of this.executions) {
            if (context.completedAt && now - context.completedAt.getTime() > maxAge) {
                this.executions.delete(id);
                cleaned++;
            }
        }

        return cleaned;
    }
}

// Singleton exportado
export const workflowEngine = WorkflowEngine.getInstance();

/**
 * Helper para criar workflow
 */
export function createWorkflow(
    id: string,
    name: string,
    steps: WorkflowStep[],
    options?: Partial<WorkflowDefinition>
): WorkflowDefinition {
    return {
        id,
        name,
        version: '1.0.0',
        steps,
        ...options,
    };
}

/**
 * Helper para criar step
 */
export function createStep(
    id: string,
    name: string,
    handler: StepHandler,
    options?: Partial<WorkflowStep>
): WorkflowStep {
    return {
        id,
        name,
        handler,
        ...options,
    };
}
