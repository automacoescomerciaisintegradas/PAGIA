/**
 * PAGIA - Workflow Types
 * Tipos e interfaces para o WorkflowEngine
 *
 * @module agents/workflow-types
 * @author Automações Comerciais Integradas
 */
/**
 * Política de retry padrão
 */
export const DEFAULT_RETRY_POLICY = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
};
// ============================================================================
// Constants
// ============================================================================
/** ID especial para nodo de início */
export const START_NODE_ID = '__start__';
/** ID especial para nodo de fim */
export const END_NODE_ID = '__end__';
/** Configuração padrão de workflow */
export const DEFAULT_WORKFLOW_CONFIG = {
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
//# sourceMappingURL=workflow-types.js.map