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
export class Semaphore {
    private permits: number;
    private maxPermits: number;
    private waiting: Array<{
        resolve: () => void;
        reject: (error: Error) => void;
        timeoutId?: NodeJS.Timeout;
    }> = [];

    /**
     * Cria um novo Semaphore
     * @param permits Número máximo de permits (execuções simultâneas)
     */
    constructor(permits: number) {
        if (permits < 1) {
            throw new Error('Semaphore deve ter pelo menos 1 permit');
        }
        this.permits = permits;
        this.maxPermits = permits;
    }

    /**
     * Adquire um permit (aguarda se não houver disponível)
     * @param timeoutMs Timeout opcional em ms (0 = sem timeout)
     * @throws Error se timeout for atingido
     */
    async acquire(timeoutMs: number = 0): Promise<void> {
        if (this.permits > 0) {
            this.permits--;
            return;
        }

        // Aguardar liberação
        return new Promise<void>((resolve, reject) => {
            const waiting: typeof this.waiting[0] = { resolve, reject };

            if (timeoutMs > 0) {
                waiting.timeoutId = setTimeout(() => {
                    const index = this.waiting.indexOf(waiting);
                    if (index !== -1) {
                        this.waiting.splice(index, 1);
                    }
                    reject(new Error(`Semaphore acquire timeout após ${timeoutMs}ms`));
                }, timeoutMs);
            }

            this.waiting.push(waiting);
        });
    }

    /**
     * Tenta adquirir um permit sem aguardar
     * @returns true se adquiriu, false se não havia permit disponível
     */
    tryAcquire(): boolean {
        if (this.permits > 0) {
            this.permits--;
            return true;
        }
        return false;
    }

    /**
     * Libera um permit
     */
    release(): void {
        if (this.permits >= this.maxPermits) {
            throw new Error('Semaphore release sem acquire correspondente');
        }

        if (this.waiting.length > 0) {
            const waiting = this.waiting.shift()!;
            if (waiting.timeoutId) {
                clearTimeout(waiting.timeoutId);
            }
            waiting.resolve();
        } else {
            this.permits++;
        }
    }

    /**
     * Executa uma função com controle de semáforo
     * @param fn Função a executar
     * @param timeoutMs Timeout opcional em ms
     * @returns Resultado da função
     */
    async withSemaphore<T>(fn: () => Promise<T>, timeoutMs: number = 0): Promise<T> {
        await this.acquire(timeoutMs);
        try {
            return await fn();
        } finally {
            this.release();
        }
    }

    /**
     * Retorna número de permits disponíveis
     */
    get availablePermits(): number {
        return this.permits;
    }

    /**
     * Retorna número de tarefas aguardando
     */
    get waitingCount(): number {
        return this.waiting.length;
    }

    /**
     * Retorna número máximo de permits
     */
    get maxAvailablePermits(): number {
        return this.maxPermits;
    }

    /**
     * Drena todas as tarefas aguardando (rejeita com erro)
     * Útil para shutdown
     */
    drain(): void {
        const error = new Error('Semaphore drained');
        while (this.waiting.length > 0) {
            const waiting = this.waiting.shift()!;
            if (waiting.timeoutId) {
                clearTimeout(waiting.timeoutId);
            }
            waiting.reject(error);
        }
    }
}

/**
 * Cria um semáforo global por chave
 * Útil para limitar concorrência por recurso
 */
export class SemaphoreRegistry {
    private static instance: SemaphoreRegistry;
    private semaphores: Map<string, Semaphore> = new Map();

    private constructor() { }

    static getInstance(): SemaphoreRegistry {
        if (!SemaphoreRegistry.instance) {
            SemaphoreRegistry.instance = new SemaphoreRegistry();
        }
        return SemaphoreRegistry.instance;
    }

    /**
     * Obtém ou cria um semáforo para a chave
     * @param key Identificador do semáforo
     * @param permits Número de permits (usado apenas na criação)
     */
    get(key: string, permits: number = 1): Semaphore {
        if (!this.semaphores.has(key)) {
            this.semaphores.set(key, new Semaphore(permits));
        }
        return this.semaphores.get(key)!;
    }

    /**
     * Remove um semáforo (drena primeiro)
     */
    remove(key: string): void {
        const semaphore = this.semaphores.get(key);
        if (semaphore) {
            semaphore.drain();
            this.semaphores.delete(key);
        }
    }

    /**
     * Remove todos os semáforos
     */
    clear(): void {
        for (const semaphore of this.semaphores.values()) {
            semaphore.drain();
        }
        this.semaphores.clear();
    }
}

export const semaphoreRegistry = SemaphoreRegistry.getInstance();
