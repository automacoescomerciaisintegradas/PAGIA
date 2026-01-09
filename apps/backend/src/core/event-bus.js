/**
 * PAGIA - Event Bus
 * Sistema de eventos pub/sub para comunicação entre componentes
 *
 * @module core/event-bus
 * @author Automações Comerciais Integradas
 */
/**
 * Classe EventBus - Sistema de publicação/subscrição de eventos
 */
export class EventBus {
    static instance;
    events = new Map();
    debug = false;
    constructor() { }
    /**
     * Obtém a instância singleton do EventBus
     */
    static getInstance() {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }
    /**
     * Habilita/desabilita modo debug
     */
    setDebug(enabled) {
        this.debug = enabled;
    }
    /**
     * Registra um handler para um evento
     * @param event Nome do evento
     * @param handler Função handler
     */
    on(event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        const subscription = {
            handler: handler,
            once: false,
        };
        this.events.get(event).push(subscription);
        if (this.debug) {
            console.log(`[EventBus] Registrado handler para: ${event}`);
        }
        // Retorna função para cancelar inscrição
        return () => this.off(event, handler);
    }
    /**
     * Registra um handler que será executado apenas uma vez
     * @param event Nome do evento
     * @param handler Função handler
     */
    once(event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        const subscription = {
            handler: handler,
            once: true,
        };
        this.events.get(event).push(subscription);
        return () => this.off(event, handler);
    }
    /**
     * Remove um handler de um evento
     * @param event Nome do evento
     * @param handler Função handler a remover
     */
    off(event, handler) {
        const subscriptions = this.events.get(event);
        if (!subscriptions)
            return;
        const index = subscriptions.findIndex((sub) => sub.handler === handler);
        if (index !== -1) {
            subscriptions.splice(index, 1);
            if (this.debug) {
                console.log(`[EventBus] Handler removido de: ${event}`);
            }
        }
    }
    /**
     * Emite um evento para todos os handlers registrados
     * @param event Nome do evento
     * @param payload Dados do evento
     */
    async emit(event, payload) {
        const subscriptions = this.events.get(event);
        if (!subscriptions || subscriptions.length === 0) {
            if (this.debug) {
                console.log(`[EventBus] Nenhum handler para: ${event}`);
            }
            return;
        }
        if (this.debug) {
            console.log(`[EventBus] Emitindo: ${event} para ${subscriptions.length} handler(s)`);
        }
        const toRemove = [];
        for (const subscription of subscriptions) {
            try {
                await subscription.handler(payload);
                if (subscription.once) {
                    toRemove.push(subscription);
                }
            }
            catch (error) {
                console.error(`[EventBus] Erro no handler de ${event}:`, error);
            }
        }
        // Remove handlers "once"
        for (const sub of toRemove) {
            const index = subscriptions.indexOf(sub);
            if (index !== -1) {
                subscriptions.splice(index, 1);
            }
        }
    }
    /**
     * Emite evento de forma síncrona (não aguarda handlers assíncronos)
     * @param event Nome do evento
     * @param payload Dados do evento
     */
    emitSync(event, payload) {
        const subscriptions = this.events.get(event);
        if (!subscriptions)
            return;
        for (const subscription of [...subscriptions]) {
            try {
                subscription.handler(payload);
                if (subscription.once) {
                    const index = subscriptions.indexOf(subscription);
                    if (index !== -1) {
                        subscriptions.splice(index, 1);
                    }
                }
            }
            catch (error) {
                console.error(`[EventBus] Erro no handler de ${event}:`, error);
            }
        }
    }
    /**
     * Remove todos os handlers de um evento
     * @param event Nome do evento
     */
    removeAllListeners(event) {
        if (event) {
            this.events.delete(event);
        }
        else {
            this.events.clear();
        }
    }
    /**
     * Retorna número de handlers registrados para um evento
     * @param event Nome do evento
     */
    listenerCount(event) {
        return this.events.get(event)?.length || 0;
    }
    /**
     * Retorna lista de eventos registrados
     */
    eventNames() {
        return Array.from(this.events.keys());
    }
}
// Eventos padrão do PAGIA
export const PAGIAEvents = {
    // Ciclo de vida
    INITIALIZED: 'pagia:initialized',
    READY: 'pagia:ready',
    SHUTDOWN: 'pagia:shutdown',
    // Configuração
    CONFIG_LOADED: 'config:loaded',
    CONFIG_CHANGED: 'config:changed',
    // Módulos
    MODULE_LOADED: 'module:loaded',
    MODULE_UNLOADED: 'module:unloaded',
    MODULE_ERROR: 'module:error',
    // Agentes
    AGENT_REGISTERED: 'agent:registered',
    AGENT_UNREGISTERED: 'agent:unregistered',
    AGENT_STARTED: 'agent:started',
    AGENT_COMPLETED: 'agent:completed',
    AGENT_ERROR: 'agent:error',
    // Planos
    PLAN_CREATED: 'plan:created',
    PLAN_UPDATED: 'plan:updated',
    PLAN_DELETED: 'plan:deleted',
    // Tarefas
    TASK_CREATED: 'task:created',
    TASK_UPDATED: 'task:updated',
    TASK_COMPLETED: 'task:completed',
    // Conhecimento
    KNOWLEDGE_ADDED: 'knowledge:added',
    KNOWLEDGE_SEARCHED: 'knowledge:searched',
    KNOWLEDGE_UPDATED: 'knowledge:updated',
    // MCP
    MCP_CONNECTED: 'mcp:connected',
    MCP_DISCONNECTED: 'mcp:disconnected',
    MCP_TOOL_CALLED: 'mcp:tool_called',
    // Workflow (legacy)
    WORKFLOW_STARTED: 'workflow:started',
    WORKFLOW_STEP: 'workflow:step',
    WORKFLOW_COMPLETED: 'workflow:completed',
    WORKFLOW_ERROR: 'workflow:error',
    // Workflow Engine (novo)
    WORKFLOW_TIMEOUT: 'workflow:timeout',
    WORKFLOW_CANCELLED: 'workflow:cancelled',
    WORKFLOW_NODE_QUEUED: 'workflow:node:queued',
    WORKFLOW_NODE_STARTED: 'workflow:node:started',
    WORKFLOW_NODE_COMPLETED: 'workflow:node:completed',
    WORKFLOW_NODE_FAILED: 'workflow:node:failed',
    WORKFLOW_NODE_RETRY: 'workflow:node:retry',
    WORKFLOW_NODE_SKIPPED: 'workflow:node:skipped',
    WORKFLOW_BRANCH_MERGED: 'workflow:branch:merged',
};
// Singleton exportado
export const eventBus = EventBus.getInstance();
//# sourceMappingURL=event-bus.js.map