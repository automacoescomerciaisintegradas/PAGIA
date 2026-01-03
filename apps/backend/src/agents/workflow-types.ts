/**
 * PAGIA - Workflow Types
 * Tipos e interfaces para o WorkflowEngine
 * 
 * @module agents/workflow-types
 * @author Automações Comerciais Integradas
 */

import type { AgentInput, AgentOutput } from './base-agent.js';

// ============================================================================
// Workflow Definition Types
// ============================================================================

/**
 * Definição completa de um workflow
 */
export interface WorkflowDefinition {
    /** Identificador único do workflow */
    id: string;
    /** Nome legível do workflow */
    name: string;
    /** Descrição do propósito do workflow */
    description?: string;
    /** Versão do workflow (semver) */
    version?: string;
    /** Lista de nodos do workflow */
    nodes: WorkflowNode[];
    /** Lista de arestas (dependências) do workflow */
    edges: WorkflowEdge[];
    /** Configurações de execução */
    config: WorkflowConfig;
    /** Metadados adicionais */
    metadata?: Record<string, unknown>;
}

/**
 * Nodo de um workflow (representa um agente)
 */
export interface WorkflowNode {
    /** Identificador único do nodo */
    id: string;
    /** Nome legível do nodo */
    name?: string;
    /** ID do agente a ser executado */
    agentId: string;
    /** Função para mapear contexto do workflow para input do agente */
    inputMapper?: InputMapperFunction;
    /** Função para mapear output do agente para contexto do workflow */
    outputMapper?: OutputMapperFunction;
    /** Configuração específica do nodo (sobrescreve config global) */
    config?: Partial<NodeConfig>;
}

/**
 * Aresta de um workflow (representa dependência)
 */
export interface WorkflowEdge {
    /** Nodo de origem ('__start__' para início) */
    from: string;
    /** Nodo de destino ('__end__' para fim) */
    to: string;
    /** Condição opcional para traversar a aresta */
    condition?: EdgeConditionFunction;
    /** Label para documentação */
    label?: string;
}

/**
 * Configuração global do workflow
 */
export interface WorkflowConfig {
    /** Número máximo de agentes executando em paralelo (1-20, default: 5) */
    maxConcurrency: number;
    /** Timeout global em ms (default: 300000 = 5min) */
    timeout?: number;
    /** Política de retry para nodos */
    retryPolicy?: RetryPolicy;
    /** Função agregadora de resultados */
    aggregator?: AggregatorFunction;
    /** Se true, aborta no primeiro erro (default: false) */
    failFast?: boolean;
    /** Se true, emite eventos detalhados (default: true) */
    verbose?: boolean;
}

/**
 * Configuração específica de um nodo
 */
export interface NodeConfig {
    /** Timeout específico do nodo em ms */
    timeout?: number;
    /** Política de retry específica do nodo */
    retryPolicy?: RetryPolicy;
    /** Prioridade do nodo (maior = executado primeiro quando possível) */
    priority?: number;
}

// ============================================================================
// Retry Policy Types
// ============================================================================

/**
 * Política de retry com backoff exponencial
 */
export interface RetryPolicy {
    /** Número máximo de tentativas (default: 3) */
    maxAttempts: number;
    /** Delay base em ms (default: 1000) */
    baseDelayMs: number;
    /** Delay máximo em ms (default: 30000) */
    maxDelayMs: number;
    /** Fator multiplicador do backoff (default: 2) */
    backoffMultiplier?: number;
    /** Erros que devem disparar retry (se vazio, todos disparam) */
    retryableErrors?: string[];
}

/**
 * Política de retry padrão
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
};

// ============================================================================
// Execution Context Types
// ============================================================================

/**
 * Contexto de execução do workflow
 */
export interface WorkflowExecutionContext {
    /** ID único desta execução */
    executionId: string;
    /** ID do workflow sendo executado */
    workflowId: string;
    /** Timestamp de início */
    startedAt: Date;
    /** Input inicial do workflow */
    initialInput: AgentInput;
    /** Estado compartilhado entre nodos */
    sharedState: Record<string, unknown>;
    /** Resultados de nodos já completados (nodeId -> output) */
    completedNodes: Map<string, NodeExecutionResult>;
    /** Nodos atualmente em execução */
    runningNodes: Set<string>;
    /** Nodos aguardando dependências */
    pendingNodes: Set<string>;
    /** Variáveis de ambiente/configuração */
    variables?: Record<string, unknown>;
}

/**
 * Resultado da execução de um nodo
 */
export interface NodeExecutionResult {
    /** ID do nodo */
    nodeId: string;
    /** Status da execução */
    status: 'success' | 'failed' | 'skipped';
    /** Output do agente (se sucesso) */
    output?: AgentOutput;
    /** Erro (se falhou) */
    error?: Error;
    /** Timestamp de início */
    startedAt: Date;
    /** Timestamp de fim */
    completedAt: Date;
    /** Duração em ms */
    durationMs: number;
    /** Número de tentativas */
    attempts: number;
}

/**
 * Resultado final da execução do workflow
 */
export interface WorkflowExecutionResult {
    /** ID da execução */
    executionId: string;
    /** ID do workflow */
    workflowId: string;
    /** Status geral */
    status: 'completed' | 'failed' | 'timeout' | 'cancelled';
    /** Output agregado (se sucesso) */
    output?: AgentOutput;
    /** Erro principal (se falhou) */
    error?: Error;
    /** Resultados de todos os nodos */
    nodeResults: Map<string, NodeExecutionResult>;
    /** Métricas de execução */
    metrics: WorkflowMetrics;
    /** Timestamp de início */
    startedAt: Date;
    /** Timestamp de fim */
    completedAt: Date;
}

/**
 * Métricas de execução do workflow
 */
export interface WorkflowMetrics {
    /** Duração total em ms */
    totalDurationMs: number;
    /** Total de nodos */
    totalNodes: number;
    /** Nodos que completaram com sucesso */
    successfulNodes: number;
    /** Nodos que falharam */
    failedNodes: number;
    /** Nodos pulados (condição não satisfeita) */
    skippedNodes: number;
    /** Total de tokens usados */
    totalTokensUsed: number;
    /** Concorrência máxima atingida */
    maxConcurrencyReached: number;
    /** Tempo economizado por paralelismo (estimado) */
    parallelismSavingsMs?: number;
}

// ============================================================================
// Function Types
// ============================================================================

/**
 * Função para mapear contexto do workflow para input do agente
 */
export type InputMapperFunction = (
    context: WorkflowExecutionContext,
    node: WorkflowNode
) => AgentInput;

/**
 * Função para mapear output do agente para atualizações no contexto
 */
export type OutputMapperFunction = (
    output: AgentOutput,
    context: WorkflowExecutionContext
) => Partial<Record<string, unknown>>;

/**
 * Condição para traversar uma aresta
 */
export type EdgeConditionFunction = (
    context: WorkflowExecutionContext
) => boolean;

/**
 * Função agregadora de múltiplos outputs
 */
export type AggregatorFunction = (
    outputs: AgentOutput[],
    context: WorkflowExecutionContext
) => AgentOutput;

// ============================================================================
// Event Types
// ============================================================================

/**
 * Tipos de eventos de workflow
 */
export type WorkflowEventType =
    | 'workflow:started'
    | 'workflow:completed'
    | 'workflow:failed'
    | 'workflow:timeout'
    | 'workflow:cancelled'
    | 'workflow:node:queued'
    | 'workflow:node:started'
    | 'workflow:node:completed'
    | 'workflow:node:failed'
    | 'workflow:node:retry'
    | 'workflow:node:skipped'
    | 'workflow:branch:merged';

/**
 * Payload base de evento de workflow
 */
export interface WorkflowEventBase {
    /** Tipo do evento */
    type: WorkflowEventType;
    /** ID da execução */
    executionId: string;
    /** ID do workflow */
    workflowId: string;
    /** Timestamp do evento */
    timestamp: Date;
}

/**
 * Evento de início de workflow
 */
export interface WorkflowStartedEvent extends WorkflowEventBase {
    type: 'workflow:started';
    definition: WorkflowDefinition;
    input: AgentInput;
}

/**
 * Evento de conclusão de workflow
 */
export interface WorkflowCompletedEvent extends WorkflowEventBase {
    type: 'workflow:completed';
    result: WorkflowExecutionResult;
}

/**
 * Evento de falha de workflow
 */
export interface WorkflowFailedEvent extends WorkflowEventBase {
    type: 'workflow:failed';
    error: Error;
    partialResults: Map<string, NodeExecutionResult>;
}

/**
 * Evento de início de nodo
 */
export interface WorkflowNodeStartedEvent extends WorkflowEventBase {
    type: 'workflow:node:started';
    nodeId: string;
    nodeName?: string;
    agentId: string;
    attempt: number;
}

/**
 * Evento de conclusão de nodo
 */
export interface WorkflowNodeCompletedEvent extends WorkflowEventBase {
    type: 'workflow:node:completed';
    nodeId: string;
    nodeName?: string;
    result: NodeExecutionResult;
}

/**
 * Evento de falha de nodo
 */
export interface WorkflowNodeFailedEvent extends WorkflowEventBase {
    type: 'workflow:node:failed';
    nodeId: string;
    nodeName?: string;
    error: Error;
    attempt: number;
    willRetry: boolean;
}

/**
 * Evento de retry de nodo
 */
export interface WorkflowNodeRetryEvent extends WorkflowEventBase {
    type: 'workflow:node:retry';
    nodeId: string;
    nodeName?: string;
    attempt: number;
    maxAttempts: number;
    delayMs: number;
    error: Error;
}

/**
 * Evento de merge de branches
 */
export interface WorkflowBranchMergedEvent extends WorkflowEventBase {
    type: 'workflow:branch:merged';
    /** Nodos que foram mesclados */
    mergedNodes: string[];
    /** Nodo que recebe a junção */
    targetNode: string;
}

/**
 * União de todos os eventos de workflow
 */
export type WorkflowEvent =
    | WorkflowStartedEvent
    | WorkflowCompletedEvent
    | WorkflowFailedEvent
    | WorkflowNodeStartedEvent
    | WorkflowNodeCompletedEvent
    | WorkflowNodeFailedEvent
    | WorkflowNodeRetryEvent
    | WorkflowBranchMergedEvent;

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Resultado de validação de workflow
 */
export interface WorkflowValidationResult {
    /** Se o workflow é válido */
    valid: boolean;
    /** Lista de erros encontrados */
    errors: WorkflowValidationError[];
    /** Lista de warnings */
    warnings: WorkflowValidationWarning[];
}

/**
 * Erro de validação de workflow
 */
export interface WorkflowValidationError {
    /** Código do erro */
    code: string;
    /** Mensagem descritiva */
    message: string;
    /** Contexto adicional (nodeId, edgeId, etc.) */
    context?: Record<string, unknown>;
}

/**
 * Warning de validação de workflow
 */
export interface WorkflowValidationWarning {
    /** Código do warning */
    code: string;
    /** Mensagem descritiva */
    message: string;
    /** Contexto adicional */
    context?: Record<string, unknown>;
}

// ============================================================================
// Constants
// ============================================================================

/** ID especial para nodo de início */
export const START_NODE_ID = '__start__';

/** ID especial para nodo de fim */
export const END_NODE_ID = '__end__';

/** Configuração padrão de workflow */
export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
    maxConcurrency: 5,
    timeout: 300000, // 5 minutos
    retryPolicy: DEFAULT_RETRY_POLICY,
    failFast: false,
    verbose: true,
};

/** Limites de configuração */
export const WORKFLOW_LIMITS = {
    MIN_CONCURRENCY: 1,
    MAX_CONCURRENCY: 20,
    MIN_TIMEOUT: 1000,
    MAX_TIMEOUT: 3600000, // 1 hora
    MAX_NODES: 100,
    MAX_EDGES: 500,
};
