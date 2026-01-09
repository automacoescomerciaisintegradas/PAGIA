/**
 * PAGIA - Workflow Engine
 * Motor de execução de workflows
 *
 * @module workflows/workflow-engine
 * @author Automações Comerciais Integradas
 */
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
export declare class WorkflowEngine {
    private static instance;
    private workflows;
    private executions;
    private constructor();
    /**
     * Obtém instância singleton
     */
    static getInstance(): WorkflowEngine;
    /**
     * Registra um workflow
     */
    register(workflow: WorkflowDefinition): void;
    /**
     * Remove um workflow
     */
    unregister(workflowId: string): void;
    /**
     * Obtém um workflow
     */
    get(workflowId: string): WorkflowDefinition | undefined;
    /**
     * Lista workflows registrados
     */
    list(): WorkflowDefinition[];
    /**
     * Executa um workflow
     */
    execute(workflowId: string, input?: Record<string, unknown>): Promise<WorkflowResult>;
    /**
     * Executa um step
     */
    private executeStep;
    /**
     * Executa handler com timeout
     */
    private executeWithTimeout;
    /**
     * Pausa uma execução
     */
    pause(executionId: string): Promise<boolean>;
    /**
     * Resume uma execução pausada
     */
    resume(executionId: string): Promise<boolean>;
    /**
     * Cancela uma execução
     */
    cancel(executionId: string): Promise<boolean>;
    /**
     * Obtém contexto de execução
     */
    getExecution(executionId: string): WorkflowContext | undefined;
    /**
     * Lista execuções
     */
    listExecutions(workflowId?: string): WorkflowContext[];
    /**
     * Limpa execuções antigas
     */
    cleanup(maxAge?: number): number;
}
export declare const workflowEngine: WorkflowEngine;
/**
 * Helper para criar workflow
 */
export declare function createWorkflow(id: string, name: string, steps: WorkflowStep[], options?: Partial<WorkflowDefinition>): WorkflowDefinition;
/**
 * Helper para criar step
 */
export declare function createStep(id: string, name: string, handler: StepHandler, options?: Partial<WorkflowStep>): WorkflowStep;
export {};
//# sourceMappingURL=workflow-engine.d.ts.map