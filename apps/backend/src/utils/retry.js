/**
 * PAGIA - Retry Utilities
 * Funções de retry com backoff exponencial
 *
 * @module utils/retry
 * @author Automações Comerciais Integradas
 */
/**
 * Política de retry padrão
 */
export const DEFAULT_RETRY_OPTIONS = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitter: 0.1,
};
/**
 * Calcula o delay para a próxima tentativa usando backoff exponencial
 * @param attempt Número da tentativa (1-based)
 * @param options Opções de retry
 * @returns Delay em ms
 */
export function calculateBackoffDelay(attempt, options = {}) {
    const { baseDelayMs = DEFAULT_RETRY_OPTIONS.baseDelayMs, maxDelayMs = DEFAULT_RETRY_OPTIONS.maxDelayMs, backoffMultiplier = DEFAULT_RETRY_OPTIONS.backoffMultiplier, jitter = DEFAULT_RETRY_OPTIONS.jitter, } = options;
    // Exponential backoff: base * multiplier^(attempt-1)
    let delay = baseDelayMs * Math.pow(backoffMultiplier, attempt - 1);
    // Aplicar cap máximo
    delay = Math.min(delay, maxDelayMs);
    // Aplicar jitter para evitar thundering herd
    if (jitter > 0) {
        const jitterAmount = delay * jitter;
        delay = delay + (Math.random() * 2 - 1) * jitterAmount;
    }
    return Math.floor(Math.max(0, delay));
}
/**
 * Aguarda um delay em ms
 * @param ms Tempo em milissegundos
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
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
export async function withRetry(fn, options = {}) {
    const { maxAttempts = DEFAULT_RETRY_OPTIONS.maxAttempts, isRetryable = () => true, onRetry, onAttempt, } = options;
    const startTime = Date.now();
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const result = await fn();
            onAttempt?.(attempt, true, result);
            return {
                success: true,
                result,
                attempts: attempt,
                totalTimeMs: Date.now() - startTime,
            };
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            onAttempt?.(attempt, false, undefined, lastError);
            // Verificar se deve fazer retry
            const shouldRetry = attempt < maxAttempts && isRetryable(lastError, attempt);
            if (!shouldRetry) {
                break;
            }
            // Calcular delay e aguardar
            const delayMs = calculateBackoffDelay(attempt, options);
            onRetry?.(lastError, attempt, delayMs);
            await sleep(delayMs);
        }
    }
    return {
        success: false,
        error: lastError,
        attempts: maxAttempts,
        totalTimeMs: Date.now() - startTime,
    };
}
/**
 * Converte RetryPolicy para WithRetryOptions
 */
export function policyToOptions(policy) {
    return {
        maxAttempts: policy.maxAttempts,
        baseDelayMs: policy.baseDelayMs,
        maxDelayMs: policy.maxDelayMs,
        backoffMultiplier: policy.backoffMultiplier,
        isRetryable: policy.retryableErrors?.length
            ? (error) => {
                const message = error.message.toLowerCase();
                return policy.retryableErrors.some(e => message.includes(e.toLowerCase()));
            }
            : undefined,
    };
}
/**
 * Executa uma função com retry usando RetryPolicy
 */
export async function withRetryPolicy(fn, policy, callbacks) {
    return withRetry(fn, {
        ...policyToOptions(policy),
        ...callbacks,
    });
}
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
export function retryable(options = {}) {
    return function (_target, _propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const result = await withRetry(() => originalMethod.apply(this, args), options);
            if (result.success) {
                return result.result;
            }
            throw result.error;
        };
        return descriptor;
    };
}
/**
 * Classe utilitária para criar circuit breaker simples
 * Previne chamadas quando muitas falhas ocorrem em sequência
 */
export class CircuitBreaker {
    threshold;
    resetTimeMs;
    failures = 0;
    lastFailure = 0;
    state = 'closed';
    constructor(threshold = 5, resetTimeMs = 60000) {
        this.threshold = threshold;
        this.resetTimeMs = resetTimeMs;
    }
    /**
     * Verifica se o circuito permite chamadas
     */
    isAllowed() {
        if (this.state === 'closed') {
            return true;
        }
        if (this.state === 'open') {
            // Verificar se é hora de tentar novamente
            if (Date.now() - this.lastFailure >= this.resetTimeMs) {
                this.state = 'half-open';
                return true;
            }
            return false;
        }
        // half-open: permite uma tentativa
        return true;
    }
    /**
     * Registra sucesso
     */
    onSuccess() {
        this.failures = 0;
        this.state = 'closed';
    }
    /**
     * Registra falha
     */
    onFailure() {
        this.failures++;
        this.lastFailure = Date.now();
        if (this.failures >= this.threshold) {
            this.state = 'open';
        }
    }
    /**
     * Reseta o circuit breaker
     */
    reset() {
        this.failures = 0;
        this.state = 'closed';
    }
    /**
     * Retorna estado atual
     */
    getState() {
        return this.state;
    }
    /**
     * Executa função com proteção do circuit breaker
     */
    async execute(fn) {
        if (!this.isAllowed()) {
            throw new Error('Circuit breaker is open');
        }
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
}
//# sourceMappingURL=retry.js.map