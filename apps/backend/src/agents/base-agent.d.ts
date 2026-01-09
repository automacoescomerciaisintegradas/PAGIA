/**
 * PAGIA - Base Agent
 * Classe abstrata base para todos os agentes
 *
 * @module agents/base-agent
 * @author Automações Comerciais Integradas
 */
import { AIService, AIMessage, AIResponse } from '../core/ai-service.js';
import type { Agent, AgentMenuItem, AIProvider } from '../types/index.js';
export interface AgentInput {
    prompt: string;
    context?: Record<string, unknown>;
    history?: AIMessage[];
    options?: AgentExecutionOptions;
}
export interface AgentOutput {
    content: string;
    metadata: {
        agentId: string;
        agentName: string;
        tokensUsed?: number;
        duration: number;
        timestamp: Date;
    };
    suggestedActions?: SuggestedAction[];
}
export interface AgentExecutionOptions {
    maxTokens?: number;
    temperature?: number;
    streaming?: boolean;
    validateOutput?: boolean;
}
export interface SuggestedAction {
    type: 'command' | 'workflow' | 'agent' | 'file';
    label: string;
    value: string;
    description?: string;
}
/**
 * Classe abstrata BaseAgent - Base para todos os agentes PAGIA
 */
export declare abstract class BaseAgent implements Agent {
    readonly id: string;
    abstract readonly name: string;
    abstract readonly role: string;
    abstract readonly description: string;
    abstract readonly module: string;
    protected aiService: AIService;
    protected systemPrompt: string;
    protected history: AIMessage[];
    protected maxHistoryLength: number;
    capabilities: string[];
    instructions: string;
    menu: AgentMenuItem[];
    localSkip?: boolean;
    configurable: Array<{
        key: string;
        value: string;
        isAgentConfig: boolean;
    }>;
    constructor(aiProvider?: Partial<AIProvider>);
    /**
     * Método abstrato para execução do agente
     */
    abstract execute(input: AgentInput): Promise<AgentOutput>;
    /**
     * Retorna as capacidades do agente
     */
    getCapabilities(): string[];
    /**
     * Verifica se o agente tem uma capacidade específica
     */
    hasCapability(capability: string): boolean;
    /**
     * Define o system prompt do agente
     */
    setSystemPrompt(prompt: string): void;
    /**
     * Obtém o system prompt completo
     */
    protected getFullSystemPrompt(): string;
    /**
     * Executa uma chamada ao serviço de IA
     */
    protected callAI(prompt: string, context?: Record<string, unknown>): Promise<AIResponse>;
    /**
     * Adiciona uma mensagem ao histórico
     */
    protected addToHistory(message: AIMessage): void;
    /**
     * Limpa o histórico de conversação
     */
    clearHistory(): void;
    /**
     * Obtém o histórico de conversação
     */
    getHistory(): AIMessage[];
    /**
     * Cria resposta padronizada do agente
     */
    protected createOutput(content: string, tokensUsed?: number, startTime?: number, suggestedActions?: SuggestedAction[]): AgentOutput;
    /**
     * Emite evento de início de execução
     */
    protected emitStarted(input: AgentInput): Promise<void>;
    /**
     * Emite evento de conclusão de execução
     */
    protected emitCompleted(output: AgentOutput): Promise<void>;
    /**
     * Emite evento de erro
     */
    protected emitError(error: Error): Promise<void>;
    /**
     * Executa com tratamento de erros e eventos
     */
    safeExecute(input: AgentInput): Promise<AgentOutput>;
    /**
     * Valida o output do agente
     */
    protected validateOutput(content: string): boolean;
    /**
     * Formata o output do agente
     */
    protected formatOutput(content: string): string;
    /**
     * Extrai ações sugeridas do conteúdo
     */
    protected extractSuggestedActions(content: string): SuggestedAction[];
    /**
     * Serializa o agente para JSON
     */
    toJSON(): Record<string, unknown>;
    /**
     * Gera markdown de documentação do agente
     */
    toMarkdown(): string;
}
//# sourceMappingURL=base-agent.d.ts.map