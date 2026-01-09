/**
 * PAGIA - Event Bus
 * Sistema de eventos pub/sub para comunicação entre componentes
 *
 * @module core/event-bus
 * @author Automações Comerciais Integradas
 */
export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;
/**
 * Classe EventBus - Sistema de publicação/subscrição de eventos
 */
export declare class EventBus {
    private static instance;
    private events;
    private debug;
    private constructor();
    /**
     * Obtém a instância singleton do EventBus
     */
    static getInstance(): EventBus;
    /**
     * Habilita/desabilita modo debug
     */
    setDebug(enabled: boolean): void;
    /**
     * Registra um handler para um evento
     * @param event Nome do evento
     * @param handler Função handler
     */
    on<T = unknown>(event: string, handler: EventHandler<T>): () => void;
    /**
     * Registra um handler que será executado apenas uma vez
     * @param event Nome do evento
     * @param handler Função handler
     */
    once<T = unknown>(event: string, handler: EventHandler<T>): () => void;
    /**
     * Remove um handler de um evento
     * @param event Nome do evento
     * @param handler Função handler a remover
     */
    off<T = unknown>(event: string, handler: EventHandler<T>): void;
    /**
     * Emite um evento para todos os handlers registrados
     * @param event Nome do evento
     * @param payload Dados do evento
     */
    emit<T = unknown>(event: string, payload?: T): Promise<void>;
    /**
     * Emite evento de forma síncrona (não aguarda handlers assíncronos)
     * @param event Nome do evento
     * @param payload Dados do evento
     */
    emitSync<T = unknown>(event: string, payload?: T): void;
    /**
     * Remove todos os handlers de um evento
     * @param event Nome do evento
     */
    removeAllListeners(event?: string): void;
    /**
     * Retorna número de handlers registrados para um evento
     * @param event Nome do evento
     */
    listenerCount(event: string): number;
    /**
     * Retorna lista de eventos registrados
     */
    eventNames(): string[];
}
export declare const PAGIAEvents: {
    readonly INITIALIZED: "pagia:initialized";
    readonly READY: "pagia:ready";
    readonly SHUTDOWN: "pagia:shutdown";
    readonly CONFIG_LOADED: "config:loaded";
    readonly CONFIG_CHANGED: "config:changed";
    readonly MODULE_LOADED: "module:loaded";
    readonly MODULE_UNLOADED: "module:unloaded";
    readonly MODULE_ERROR: "module:error";
    readonly AGENT_REGISTERED: "agent:registered";
    readonly AGENT_UNREGISTERED: "agent:unregistered";
    readonly AGENT_STARTED: "agent:started";
    readonly AGENT_COMPLETED: "agent:completed";
    readonly AGENT_ERROR: "agent:error";
    readonly PLAN_CREATED: "plan:created";
    readonly PLAN_UPDATED: "plan:updated";
    readonly PLAN_DELETED: "plan:deleted";
    readonly TASK_CREATED: "task:created";
    readonly TASK_UPDATED: "task:updated";
    readonly TASK_COMPLETED: "task:completed";
    readonly KNOWLEDGE_ADDED: "knowledge:added";
    readonly KNOWLEDGE_SEARCHED: "knowledge:searched";
    readonly KNOWLEDGE_UPDATED: "knowledge:updated";
    readonly MCP_CONNECTED: "mcp:connected";
    readonly MCP_DISCONNECTED: "mcp:disconnected";
    readonly MCP_TOOL_CALLED: "mcp:tool_called";
    readonly WORKFLOW_STARTED: "workflow:started";
    readonly WORKFLOW_STEP: "workflow:step";
    readonly WORKFLOW_COMPLETED: "workflow:completed";
    readonly WORKFLOW_ERROR: "workflow:error";
    readonly WORKFLOW_TIMEOUT: "workflow:timeout";
    readonly WORKFLOW_CANCELLED: "workflow:cancelled";
    readonly WORKFLOW_NODE_QUEUED: "workflow:node:queued";
    readonly WORKFLOW_NODE_STARTED: "workflow:node:started";
    readonly WORKFLOW_NODE_COMPLETED: "workflow:node:completed";
    readonly WORKFLOW_NODE_FAILED: "workflow:node:failed";
    readonly WORKFLOW_NODE_RETRY: "workflow:node:retry";
    readonly WORKFLOW_NODE_SKIPPED: "workflow:node:skipped";
    readonly WORKFLOW_BRANCH_MERGED: "workflow:branch:merged";
};
export declare const eventBus: EventBus;
//# sourceMappingURL=event-bus.d.ts.map