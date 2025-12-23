/**
 * PAGIA - Base Agent
 * Classe abstrata base para todos os agentes
 * 
 * @module agents/base-agent
 * @author Automações Comerciais Integradas
 */

import { v4 as uuidv4 } from 'uuid';
import { createAIService, AIService, AIMessage, AIResponse } from '../core/ai-service.js';
import { eventBus, PAGIAEvents } from '../core/event-bus.js';
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
export abstract class BaseAgent implements Agent {
    readonly id: string;
    abstract readonly name: string;
    abstract readonly role: string;
    abstract readonly description: string;
    abstract readonly module: string;

    protected aiService: AIService;
    protected systemPrompt: string = '';
    protected history: AIMessage[] = [];
    protected maxHistoryLength: number = 10;

    capabilities: string[] = [];
    instructions: string = '';
    menu: AgentMenuItem[] = [];
    localSkip?: boolean = false;
    configurable: Array<{ key: string; value: string; isAgentConfig: boolean }> = [];

    constructor(aiProvider?: Partial<AIProvider>) {
        this.id = uuidv4();
        this.aiService = createAIService(aiProvider);
    }

    /**
     * Método abstrato para execução do agente
     */
    abstract execute(input: AgentInput): Promise<AgentOutput>;

    /**
     * Retorna as capacidades do agente
     */
    getCapabilities(): string[] {
        return this.capabilities;
    }

    /**
     * Verifica se o agente tem uma capacidade específica
     */
    hasCapability(capability: string): boolean {
        return this.capabilities.includes(capability.toLowerCase());
    }

    /**
     * Define o system prompt do agente
     */
    setSystemPrompt(prompt: string): void {
        this.systemPrompt = prompt;
    }

    /**
     * Obtém o system prompt completo
     */
    protected getFullSystemPrompt(): string {
        let prompt = `Você é ${this.name}, um agente especializado em ${this.role}.\n\n`;

        if (this.description) {
            prompt += `Descrição: ${this.description}\n\n`;
        }

        if (this.capabilities.length > 0) {
            prompt += `Suas capacidades:\n${this.capabilities.map((c) => `- ${c}`).join('\n')}\n\n`;
        }

        if (this.instructions) {
            prompt += `Instruções específicas:\n${this.instructions}\n\n`;
        }

        if (this.systemPrompt) {
            prompt += this.systemPrompt;
        }

        return prompt;
    }

    /**
     * Executa uma chamada ao serviço de IA
     */
    protected async callAI(prompt: string, context?: Record<string, unknown>): Promise<AIResponse> {
        const systemPrompt = this.getFullSystemPrompt();

        // Adicionar contexto ao prompt se fornecido
        let fullPrompt = prompt;
        if (context && Object.keys(context).length > 0) {
            fullPrompt = `Contexto:\n${JSON.stringify(context, null, 2)}\n\nSolicitação:\n${prompt}`;
        }

        // Construir mensagens com histórico
        const messages: AIMessage[] = [
            { role: 'system', content: systemPrompt },
            ...this.history,
            { role: 'user', content: fullPrompt },
        ];

        const response = await this.aiService.chat(messages);

        // Atualizar histórico
        this.addToHistory({ role: 'user', content: fullPrompt });
        this.addToHistory({ role: 'assistant', content: response.content });

        return response;
    }

    /**
     * Adiciona uma mensagem ao histórico
     */
    protected addToHistory(message: AIMessage): void {
        this.history.push(message);

        // Manter histórico dentro do limite
        if (this.history.length > this.maxHistoryLength * 2) {
            this.history = this.history.slice(-this.maxHistoryLength * 2);
        }
    }

    /**
     * Limpa o histórico de conversação
     */
    clearHistory(): void {
        this.history = [];
    }

    /**
     * Obtém o histórico de conversação
     */
    getHistory(): AIMessage[] {
        return [...this.history];
    }

    /**
     * Cria resposta padronizada do agente
     */
    protected createOutput(
        content: string,
        tokensUsed?: number,
        startTime?: number,
        suggestedActions?: SuggestedAction[]
    ): AgentOutput {
        const duration = startTime ? Date.now() - startTime : 0;

        return {
            content,
            metadata: {
                agentId: this.id,
                agentName: this.name,
                tokensUsed,
                duration,
                timestamp: new Date(),
            },
            suggestedActions,
        };
    }

    /**
     * Emite evento de início de execução
     */
    protected async emitStarted(input: AgentInput): Promise<void> {
        await eventBus.emit(PAGIAEvents.AGENT_STARTED, {
            agentId: this.id,
            agentName: this.name,
            input,
        });
    }

    /**
     * Emite evento de conclusão de execução
     */
    protected async emitCompleted(output: AgentOutput): Promise<void> {
        await eventBus.emit(PAGIAEvents.AGENT_COMPLETED, {
            agentId: this.id,
            agentName: this.name,
            output,
        });
    }

    /**
     * Emite evento de erro
     */
    protected async emitError(error: Error): Promise<void> {
        await eventBus.emit(PAGIAEvents.AGENT_ERROR, {
            agentId: this.id,
            agentName: this.name,
            error: error.message,
        });
    }

    /**
     * Executa com tratamento de erros e eventos
     */
    async safeExecute(input: AgentInput): Promise<AgentOutput> {
        await this.emitStarted(input);

        try {
            const output = await this.execute(input);
            await this.emitCompleted(output);
            return output;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            await this.emitError(err);
            throw err;
        }
    }

    /**
     * Valida o output do agente
     */
    protected validateOutput(content: string): boolean {
        // Validação básica - pode ser sobrescrita
        return content.length > 0;
    }

    /**
     * Formata o output do agente
     */
    protected formatOutput(content: string): string {
        // Formatação básica - pode ser sobrescrita
        return content.trim();
    }

    /**
     * Extrai ações sugeridas do conteúdo
     */
    protected extractSuggestedActions(content: string): SuggestedAction[] {
        const actions: SuggestedAction[] = [];

        // Padrão: [ACTION:tipo:label:valor]
        const actionPattern = /\[ACTION:(\w+):([^:]+):([^\]]+)\]/g;
        let match;

        while ((match = actionPattern.exec(content)) !== null) {
            actions.push({
                type: match[1] as SuggestedAction['type'],
                label: match[2],
                value: match[3],
            });
        }

        return actions;
    }

    /**
     * Serializa o agente para JSON
     */
    toJSON(): Record<string, unknown> {
        return {
            id: this.id,
            name: this.name,
            role: this.role,
            description: this.description,
            module: this.module,
            capabilities: this.capabilities,
            instructions: this.instructions,
            menu: this.menu,
        };
    }

    /**
     * Gera markdown de documentação do agente
     */
    toMarkdown(): string {
        let md = `# ${this.name}\n\n`;
        md += `## Papel\n${this.role}\n\n`;
        md += `## Descrição\n${this.description}\n\n`;

        if (this.capabilities.length > 0) {
            md += `## Capacidades\n${this.capabilities.map((c) => `- ${c}`).join('\n')}\n\n`;
        }

        if (this.instructions) {
            md += `## Instruções\n${this.instructions}\n\n`;
        }

        if (this.menu.length > 0) {
            md += `## Menu\n`;
            for (const item of this.menu) {
                md += `- \`${item.trigger}\` - ${item.description}\n`;
            }
            md += '\n';
        }

        md += `---\n*Módulo: ${this.module} | ID: ${this.id}*\n`;

        return md;
    }
}
