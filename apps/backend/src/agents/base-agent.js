/**
 * PAGIA - Base Agent
 * Classe abstrata base para todos os agentes
 *
 * @module agents/base-agent
 * @author Automações Comerciais Integradas
 */
import { v4 as uuidv4 } from 'uuid';
import { createAIService } from '../core/ai-service.js';
import { eventBus, PAGIAEvents } from '../core/event-bus.js';
/**
 * Classe abstrata BaseAgent - Base para todos os agentes PAGIA
 */
export class BaseAgent {
    id;
    aiService;
    systemPrompt = '';
    history = [];
    maxHistoryLength = 10;
    capabilities = [];
    instructions = '';
    menu = [];
    localSkip = false;
    configurable = [];
    constructor(aiProvider) {
        this.id = uuidv4();
        this.aiService = createAIService(aiProvider);
    }
    /**
     * Retorna as capacidades do agente
     */
    getCapabilities() {
        return this.capabilities;
    }
    /**
     * Verifica se o agente tem uma capacidade específica
     */
    hasCapability(capability) {
        return this.capabilities.includes(capability.toLowerCase());
    }
    /**
     * Define o system prompt do agente
     */
    setSystemPrompt(prompt) {
        this.systemPrompt = prompt;
    }
    /**
     * Obtém o system prompt completo
     */
    getFullSystemPrompt() {
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
    async callAI(prompt, context) {
        const systemPrompt = this.getFullSystemPrompt();
        // Adicionar contexto ao prompt se fornecido
        let fullPrompt = prompt;
        if (context && Object.keys(context).length > 0) {
            fullPrompt = `Contexto:\n${JSON.stringify(context, null, 2)}\n\nSolicitação:\n${prompt}`;
        }
        // Construir mensagens com histórico
        const messages = [
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
    addToHistory(message) {
        this.history.push(message);
        // Manter histórico dentro do limite
        if (this.history.length > this.maxHistoryLength * 2) {
            this.history = this.history.slice(-this.maxHistoryLength * 2);
        }
    }
    /**
     * Limpa o histórico de conversação
     */
    clearHistory() {
        this.history = [];
    }
    /**
     * Obtém o histórico de conversação
     */
    getHistory() {
        return [...this.history];
    }
    /**
     * Cria resposta padronizada do agente
     */
    createOutput(content, tokensUsed, startTime, suggestedActions) {
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
    async emitStarted(input) {
        await eventBus.emit(PAGIAEvents.AGENT_STARTED, {
            agentId: this.id,
            agentName: this.name,
            input,
        });
    }
    /**
     * Emite evento de conclusão de execução
     */
    async emitCompleted(output) {
        await eventBus.emit(PAGIAEvents.AGENT_COMPLETED, {
            agentId: this.id,
            agentName: this.name,
            output,
        });
    }
    /**
     * Emite evento de erro
     */
    async emitError(error) {
        await eventBus.emit(PAGIAEvents.AGENT_ERROR, {
            agentId: this.id,
            agentName: this.name,
            error: error.message,
        });
    }
    /**
     * Executa com tratamento de erros e eventos
     */
    async safeExecute(input) {
        await this.emitStarted(input);
        try {
            const output = await this.execute(input);
            await this.emitCompleted(output);
            return output;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            await this.emitError(err);
            throw err;
        }
    }
    /**
     * Valida o output do agente
     */
    validateOutput(content) {
        // Validação básica - pode ser sobrescrita
        return content.length > 0;
    }
    /**
     * Formata o output do agente
     */
    formatOutput(content) {
        // Formatação básica - pode ser sobrescrita
        return content.trim();
    }
    /**
     * Extrai ações sugeridas do conteúdo
     */
    extractSuggestedActions(content) {
        const actions = [];
        // Padrão: [ACTION:tipo:label:valor]
        const actionPattern = /\[ACTION:(\w+):([^:]+):([^\]]+)\]/g;
        let match;
        while ((match = actionPattern.exec(content)) !== null) {
            actions.push({
                type: match[1],
                label: match[2],
                value: match[3],
            });
        }
        return actions;
    }
    /**
     * Serializa o agente para JSON
     */
    toJSON() {
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
    toMarkdown() {
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
//# sourceMappingURL=base-agent.js.map