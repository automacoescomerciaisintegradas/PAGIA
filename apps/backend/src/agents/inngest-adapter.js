/**
 * PAGIA - Inngest AgentKit Adapter
 * Adaptador para integração com @inngest/agent-kit
 *
 * @module agents/inngest-adapter
 * @author Automações Comerciais Integradas
 */
import { createAgent, createTool, gemini, openai, anthropic } from '@inngest/agent-kit';
import { z } from 'zod';
import { agentRegistry } from './agent-registry.js';
import { logger } from '../utils/logger.js';
/**
 * Mapeamento de provedores para funções de criação de modelo AgentKit
 */
const MODEL_CREATORS = {
    gemini: (model) => gemini({ model, defaultParameters: {} }),
    openai: (model) => openai({ model, defaultParameters: {} }),
    anthropic: (model) => anthropic({ model, defaultParameters: {} }),
};
/**
 * Obtém o provedor AgentKit compatível baseado no provedor PAGIA
 * Alguns provedores PAGIA usam API compatível com OpenAI
 */
function mapToAgentKitProvider(pagiaProvider) {
    switch (pagiaProvider) {
        case 'gemini':
            return 'gemini';
        case 'openai':
        case 'groq': // Groq usa API compatível com OpenAI
        case 'deepseek': // DeepSeek usa API compatível com OpenAI
        case 'mistral': // Mistral usa API compatível com OpenAI
        case 'openrouter': // OpenRouter usa API compatível com OpenAI
        case 'ollama': // Ollama usa API compatível com OpenAI
            return 'openai';
        case 'anthropic':
            return 'anthropic';
        default:
            return 'gemini';
    }
}
/**
 * Classe InngestAdapter - Converte agentes PAGIA para AgentKit
 */
export class InngestAdapter {
    static instance;
    convertedAgents = new Map();
    defaultModelConfig;
    constructor() {
        this.defaultModelConfig = this.getDefaultModelConfig();
    }
    /**
     * Obtém instância singleton
     */
    static getInstance() {
        if (!InngestAdapter.instance) {
            InngestAdapter.instance = new InngestAdapter();
        }
        return InngestAdapter.instance;
    }
    /**
     * Obtém configuração padrão do modelo baseado em variáveis de ambiente
     */
    getDefaultModelConfig() {
        const pagiaProvider = process.env.AI_PROVIDER || 'gemini';
        const provider = mapToAgentKitProvider(pagiaProvider);
        switch (pagiaProvider) {
            case 'openai':
                return {
                    provider: 'openai',
                    model: process.env.OPENAI_MODEL || 'gpt-4o',
                    apiKey: process.env.OPENAI_API_KEY,
                };
            case 'anthropic':
                return {
                    provider: 'anthropic',
                    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
                    apiKey: process.env.ANTHROPIC_API_KEY,
                };
            case 'groq':
                return {
                    provider: 'openai', // Groq usa API OpenAI-compatível
                    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                    apiKey: process.env.GROQ_API_KEY,
                };
            case 'deepseek':
                return {
                    provider: 'openai',
                    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
                    apiKey: process.env.DEEPSEEK_API_KEY,
                };
            case 'mistral':
                return {
                    provider: 'openai',
                    model: process.env.MISTRAL_MODEL || 'mistral-large-latest',
                    apiKey: process.env.MISTRAL_API_KEY,
                };
            case 'openrouter':
                return {
                    provider: 'openai',
                    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
                    apiKey: process.env.OPENROUTER_API_KEY,
                };
            case 'ollama':
                return {
                    provider: 'openai',
                    model: process.env.OLLAMA_MODEL || 'llama3.2',
                    apiKey: 'ollama', // Ollama não precisa de API key
                };
            case 'gemini':
            default:
                return {
                    provider: 'gemini',
                    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
                    apiKey: process.env.GEMINI_API_KEY,
                };
        }
    }
    /**
     * Cria modelo AgentKit baseado no provedor configurado
     */
    createModel(config) {
        const finalConfig = { ...this.defaultModelConfig, ...config };
        const creator = MODEL_CREATORS[finalConfig.provider];
        if (!creator) {
            logger.warn(`Provedor ${finalConfig.provider} não suportado pelo AgentKit, usando Gemini`);
            return gemini({ model: 'gemini-2.0-flash-exp', defaultParameters: {} });
        }
        logger.debug(`Criando modelo AgentKit: ${finalConfig.provider}/${finalConfig.model}`);
        return creator(finalConfig.model);
    }
    /**
     * Converte um agente PAGIA para AgentKit
     */
    convertPAGIAAgent(pagiaAgent, modelConfig) {
        // Verificar se já foi convertido
        const cached = this.convertedAgents.get(pagiaAgent.id);
        if (cached) {
            return cached;
        }
        // Criar tools baseadas nas capacidades do agente PAGIA
        const tools = this.createToolsFromCapabilities(pagiaAgent);
        // Construir system prompt
        const systemPrompt = this.buildSystemPrompt(pagiaAgent);
        // Criar agente AgentKit
        const agent = createAgent({
            name: pagiaAgent.name,
            description: pagiaAgent.description,
            system: systemPrompt,
            model: this.createModel(modelConfig),
            tools,
        });
        const agentKitAgent = {
            agent,
            pagiaAgentId: pagiaAgent.id,
            name: pagiaAgent.name,
        };
        // Cache do agente convertido
        this.convertedAgents.set(pagiaAgent.id, agentKitAgent);
        logger.debug(`Agente PAGIA "${pagiaAgent.name}" convertido para AgentKit`);
        return agentKitAgent;
    }
    /**
     * Converte todos os agentes registrados no PAGIA
     */
    convertAllAgents(modelConfig) {
        const pagiaAgents = agentRegistry.list();
        const converted = [];
        for (const pagiaAgent of pagiaAgents) {
            try {
                const agentKitAgent = this.convertPAGIAAgent(pagiaAgent, modelConfig);
                converted.push(agentKitAgent);
            }
            catch (error) {
                logger.error(`Erro ao converter agente "${pagiaAgent.name}": ${error}`);
            }
        }
        return converted;
    }
    /**
     * Cria tools a partir das capacidades do agente
     */
    createToolsFromCapabilities(pagiaAgent) {
        // Tool principal: executar o agente PAGIA
        const executeTool = createTool({
            name: `execute_${pagiaAgent.name.toLowerCase().replace(/\s+/g, '_')}`,
            description: `Executa o agente ${pagiaAgent.name}: ${pagiaAgent.description}`,
            parameters: z.object({
                prompt: z.string().describe('O prompt/solicitação para o agente processar'),
            }),
            handler: async ({ prompt }) => {
                const input = { prompt };
                const output = await pagiaAgent.safeExecute(input);
                return output.content;
            },
        });
        return [executeTool];
    }
    /**
     * Constrói o system prompt do agente para AgentKit
     */
    buildSystemPrompt(pagiaAgent) {
        let prompt = `Você é ${pagiaAgent.name}, um agente especializado.\n\n`;
        prompt += `## Papel\n${pagiaAgent.role}\n\n`;
        prompt += `## Descrição\n${pagiaAgent.description}\n\n`;
        if (pagiaAgent.capabilities && pagiaAgent.capabilities.length > 0) {
            prompt += `## Capacidades\n${pagiaAgent.capabilities.map((c) => `- ${c}`).join('\n')}\n\n`;
        }
        if (pagiaAgent.instructions) {
            prompt += `## Instruções\n${pagiaAgent.instructions}\n\n`;
        }
        prompt += `## Comportamento\n`;
        prompt += `- Responda sempre de forma clara e objetiva\n`;
        prompt += `- Use as ferramentas disponíveis quando necessário\n`;
        prompt += `- Mantenha consistência com seu papel e especialidade\n`;
        return prompt;
    }
    /**
     * Obtém um agente convertido pelo ID do PAGIA
     */
    getConvertedAgent(pagiaAgentId) {
        return this.convertedAgents.get(pagiaAgentId);
    }
    /**
     * Obtém todos os agentes convertidos
     */
    getAllConvertedAgents() {
        return Array.from(this.convertedAgents.values());
    }
    /**
     * Limpa cache de agentes convertidos
     */
    clearCache() {
        this.convertedAgents.clear();
    }
    /**
     * Estatísticas do adapter
     */
    getStats() {
        return {
            total: agentRegistry.list().length,
            cached: this.convertedAgents.size,
        };
    }
}
// Singleton exportado
export const inngestAdapter = InngestAdapter.getInstance();
//# sourceMappingURL=inngest-adapter.js.map