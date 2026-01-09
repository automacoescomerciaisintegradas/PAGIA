/**
 * PAGIA - Retry Utilities
 * Funções de retry com backoff exponencial
 *
 * @module utils/retry
 * @author Automações Comerciais Integradas
 */
import type { RetryPolicy } from '../agents/workflow-types.js';
/**
 * Resultado de uma tentativa de retry
 */
export interface RetryResult<T> {
    /** Se a execução foi bem sucedida */
    success: boolean;
    /** Resultado (se sucesso) */
    result?: T;
    /** Erro (se falhou) */
    error?: Error;
    /** Número de tentativas realizadas */
    attempts: number;
    /** Tempo total gasto em ms */
    totalTimeMs: number;
}
/**
 * Opções para a função withRetry
 */
export interface WithRetryOptions {
    /** Número máximo de tentativas (default: 3) */
    maxAttempts?: number;
    /** Delay base em ms (default: 1000) */
    baseDelayMs?: number;
    /** Delay máximo em ms (default: 30000) */
    maxDelayMs?: number;
    /** Fator multiplicador do backoff (default: 2) */
    backoffMultiplier?: number;
    /** Jitter para evitar thundering herd (0-1, default: 0.1) */
    jitter?: number;
    /** Função para verificar se erro é retryable (default: true para todos) */
    isRetryable?: (error: Error, attempt: number) => boolean;
    /** Callback chamado antes de cada retry */
    onRetry?: (error: Error, attempt: number, delayMs: number) => void;
    /** Callback chamado em cada tentativa (sucesso ou falha) */
    onAttempt?: (attempt: number, success: boolean, result?: unknown, error?: Error) => void;
}
/**
 * Política de retry padrão
 */
export declare const DEFAULT_RETRY_OPTIONS: Required<Omit<WithRetryOptions, 'isRetryable' | 'onRetry' | 'onAttempt'>>;
/**
 * Calcula o delay para a próxima tentativa usando backoff exponencial
 * @param attempt Número da tentativa (1-based)
 * @param options Opções de retry
 * @returns Delay em ms
 */
export declare function calculateBackoffDelay(attempt: number, options?: WithRetryOptions): number;
/**
 * Aguarda um delay em ms
 * @param ms Tempo em milissegundos
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Executa uma função com retry e backoff exponencial
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   async () => await fetchData(),
 *   {
 *     maxAttempts: 5,
 *     baseDelayMs: 500,
 *     onRetry: (error, attempt, delay) => {
 *       console.log(`Tentativa ${attempt} falhou, aguardando ${delay}ms`);
 *     }
 *   }
 * );
 * ```
 *
 * @param fn Função a executar
 * @param options Opções de retry
 * @returns Resultado da execução
 */
export declare function withRetry<T>(fn: () => Promise<T>, options?: WithRetryOptions): Promise<RetryResult<T>>;
/**
 * Converte RetryPolicy para WithRetryOptions
 */
export declare function policyToOptions(policy: RetryPolicy): WithRetryOptions;
/**
 * Executa uma função com retry usando RetryPolicy
 */
export declare function withRetryPolicy<T>(fn: () => Promise<T>, policy: RetryPolicy, callbacks?: Pick<WithRetryOptions, 'onRetry' | 'onAttempt'>): Promise<RetryResult<T>>;
/**
 * Decorator para adicionar retry a um método
 *
 * @example
 * ```typescript
 * class MyService {
 *   @retryable({ maxAttempts: 3 })
 *   async fetchData() {
 *     // ...
 *   }
 * }
 * ```
 */
export declare function retryable(options?: WithRetryOptions): (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Classe utilitária para criar circuit breaker simples
 * Previne chamadas quando muitas falhas ocorrem em sequência
 */
export declare class CircuitBreaker {
    private readonly threshold;
    private readonly resetTimeMs;
    private failures;
    private lastFailure;
    private state;
    constructor(threshold?: number, resetTimeMs?: number);
    /**
     * Verifica se o circuito permite chamadas
     */
    isAllowed(): boolean;
    /**
     * Registra sucesso
     */
    onSuccess(): void;
    /**
     * Registra falha
     */
    onFailure(): void;
    /**
     * Reseta o circuit breaker
     */
    reset(): void;
    /**
     * Retorna estado atual
     */
    getState(): 'closed' | 'open' | 'half-open';
    /**
     * Executa função com proteção do circuit breaker
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
}
//# sourceMappingURL=retry.d.ts.map