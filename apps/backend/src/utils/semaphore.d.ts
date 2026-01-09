/**
 * PAGIA - Semaphore
 * Controle de concorrência para limitar execuções paralelas
 *
 * @module utils/semaphore
 * @author Automações Comerciais Integradas
 */
/**
 * Implementação de Semáforo para controle de concorrência
 *
 * @example
 * ```typescript
 * const semaphore = new Semaphore(3); // Máximo 3 execuções simultâneas
 *
 * async function doWork() {
 *   await semaphore.acquire();
 *   try {
 *     // trabalho limitado
 *   } finally {
 *     semaphore.release();
 *   }
 * }
 *
 * // Ou usando withSemaphore:
 * await semaphore.withSemaphore(async () => {
 *   // trabalho limitado
 * });
 * ```
 */
export declare class Semaphore {
    private permits;
    private maxPermits;
    private waiting;
    /**
     * Cria um novo Semaphore
     * @param permits Número máximo de permits (execuções simultâneas)
     */
    constructor(permits: number);
    /**
     * Adquire um permit (aguarda se não houver disponível)
     * @param timeoutMs Timeout opcional em ms (0 = sem timeout)
     * @throws Error se timeout for atingido
     */
    acquire(timeoutMs?: number): Promise<void>;
    /**
     * Tenta adquirir um permit sem aguardar
     * @returns true se adquiriu, false se não havia permit disponível
     */
    tryAcquire(): boolean;
    /**
     * Libera um permit
     */
    release(): void;
    /**
     * Executa uma função com controle de semáforo
     * @param fn Função a executar
     * @param timeoutMs Timeout opcional em ms
     * @returns Resultado da função
     */
    withSemaphore<T>(fn: () => Promise<T>, timeoutMs?: number): Promise<T>;
    /**
     * Retorna número de permits disponíveis
     */
    get availablePermits(): number;
    /**
     * Retorna número de tarefas aguardando
     */
    get waitingCount(): number;
    /**
     * Retorna número máximo de permits
     */
    get maxAvailablePermits(): number;
    /**
     * Drena todas as tarefas aguardando (rejeita com erro)
     * Útil para shutdown
     */
    drain(): void;
}
/**
 * Cria um semáforo global por chave
 * Útil para limitar concorrência por recurso
 */
export declare class SemaphoreRegistry {
    private static instance;
    private semaphores;
    private constructor();
    static getInstance(): SemaphoreRegistry;
    /**
     * Obtém ou cria um semáforo para a chave
     * @param key Identificador do semáforo
     * @param permits Número de permits (usado apenas na criação)
     */
    get(key: string, permits?: number): Semaphore;
    /**
     * Remove um semáforo (drena primeiro)
     */
    remove(key: string): void;
    /**
     * Remove todos os semáforos
     */
    clear(): void;
}
export declare const semaphoreRegistry: SemaphoreRegistry;
//# sourceMappingURL=semaphore.d.ts.map