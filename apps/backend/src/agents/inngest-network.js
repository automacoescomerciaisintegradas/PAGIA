/**
 * PAGIA - Inngest AgentKit Network
 * Rede de agentes orquestrada com @inngest/agent-kit
 *
 * @module agents/inngest-network
 * @author Automações Comerciais Integradas
 */
import { createNetwork, createAgent, createTool, createRoutingAgent, gemini, } from '@inngest/agent-kit';
import { z } from 'zod';
import { agentRegistry } from './agent-registry.js';
import { createKnowledgeBase } from '../knowledge/knowledge-base.js';
import { getConfigManager } from '../core/config-manager.js';
import { logger } from '../utils/logger.js';
import { eventBus, PAGIAEvents } from '../core/event-bus.js';
/**
 * Classe PAGIANetwork - Rede de agentes PAGIA com AgentKit
 */
export class PAGIANetwork {
    static instance;
    networks = new Map();
    defaultConfig;
    constructor() {
        this.defaultConfig = {
            name: 'pagia-default',
            defaultModel: {
                provider: process.env.AI_PROVIDER || 'gemini',
                model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
            },
            maxIterations: 10,
        };
    }
    /**
     * Obtém instância singleton
     */
    static getInstance() {
        if (!PAGIANetwork.instance) {
            PAGIANetwork.instance = new PAGIANetwork();
        }
        return PAGIANetwork.instance;
    }
    /**
     * Cria modelo AgentKit - usando apenas Gemini para simplificar tipos
     * TODO: Adicionar suporte a outros providers quando os tipos estabilizarem
     */
    createModel(_provider, model) {
        // Usando Gemini como padrão para evitar problemas de tipos entre providers
        return gemini({ model, defaultParameters: {} });
    }
    /**
     * Cria ferramentas compartilhadas para todos os agentes
     */
    createSharedTools() {
        return [
            // Ferramenta: Marcar tarefa como concluída
            createTool({
                name: 'mark_completed',
                description: 'Marca a tarefa atual como concluída e armazena o resultado',
                parameters: z.object({
                    result: z.string().describe('Resultado da tarefa'),
                    nextAction: z.string().optional().describe('Próxima ação sugerida'),
                }),
                handler: async ({ result, nextAction }, { network }) => {
                    network?.state.kv.set('lastResult', result);
                    if (nextAction) {
                        network?.state.kv.set('nextAction', nextAction);
                    }
                    return `Tarefa concluída: ${result}`;
                },
            }),
            // Ferramenta: Buscar na base de conhecimento
            createTool({
                name: 'search_knowledge',
                description: 'Busca informações na base de conhecimento do projeto',
                parameters: z.object({
                    query: z.string().describe('Termo de busca'),
                    limit: z.number().optional().describe('Número máximo de resultados'),
                }),
                handler: async ({ query, limit }) => {
                    try {
                        const configManager = getConfigManager();
                        const kb = createKnowledgeBase(configManager.resolvePagiaPath('knowledge'));
                        const results = await kb.search(query, { limit: limit || 5 });
                        return JSON.stringify(results.map((r) => ({
                            title: r.document.title,
                            content: r.relevantChunks.slice(0, 2).join('\n'),
                            similarity: r.overallSimilarity,
                        })));
                    }
                    catch (error) {
                        return JSON.stringify({ error: `Falha na busca: ${error}` });
                    }
                },
            }),
            // Ferramenta: Atualizar estado
            createTool({
                name: 'update_state',
                description: 'Atualiza o estado compartilhado da rede',
                parameters: z.object({
                    key: z.string().describe('Chave do estado'),
                    value: z.string().describe('Valor a armazenar'),
                }),
                handler: async ({ key, value }, { network }) => {
                    network?.state.kv.set(key, value);
                    return `Estado atualizado: ${key} = ${value}`;
                },
            }),
            // Ferramenta: Ler estado
            createTool({
                name: 'read_state',
                description: 'Lê um valor do estado compartilhado',
                parameters: z.object({
                    key: z.string().describe('Chave do estado'),
                }),
                handler: async ({ key }, { network }) => {
                    const value = network?.state.kv.get(key);
                    return value ? String(value) : 'Valor não encontrado';
                },
            }),
        ];
    }
    /**
     * Cria agente planejador
     */
    createPlannerAgent(model) {
        return createAgent({
            name: 'Planner',
            description: 'Agente especializado em criar planos de ação detalhados',
            system: `Você é um planejador especializado do PAGIA.
Seu papel é analisar tarefas complexas e criar planos de ação detalhados.

## Capacidades
- Análise de requisitos
- Decomposição de tarefas
- Identificação de dependências
- Estimativa de esforço

## Instruções
1. Analise a tarefa fornecida
2. Identifique os passos necessários
3. Ordene por dependência
4. Use a ferramenta 'save_plan' para armazenar o plano`,
            model,
            tools: [
                createTool({
                    name: 'save_plan',
                    description: 'Salva o plano de ação no estado',
                    parameters: z.object({
                        steps: z.array(z.string()).describe('Lista de passos do plano'),
                        estimatedTime: z.string().optional().describe('Tempo estimado'),
                    }),
                    handler: async ({ steps, estimatedTime }, { network }) => {
                        network?.state.kv.set('plan', steps);
                        if (estimatedTime) {
                            network?.state.kv.set('estimatedTime', estimatedTime);
                        }
                        return `Plano salvo com ${steps.length} passos`;
                    },
                }),
                ...this.createSharedTools(),
            ],
        });
    }
    /**
     * Cria agente executor
     */
    createExecutorAgent(model) {
        return createAgent({
            name: 'Executor',
            description: 'Agente que executa tarefas do plano',
            system: ({ network }) => {
                const plan = (network?.state.kv.get('plan') || []);
                const currentStep = plan[0] || 'Aguardando plano';
                return `Você é um executor especializado do PAGIA.
Seu papel é executar as tarefas definidas no plano.

## Tarefa Atual
${currentStep}

## Instruções
1. Execute a tarefa atual
2. Documente o resultado
3. Use 'complete_step' quando terminar`;
            },
            model,
            tools: [
                createTool({
                    name: 'complete_step',
                    description: 'Marca o passo atual como concluído',
                    parameters: z.object({
                        result: z.string().describe('Resultado da execução'),
                        notes: z.string().optional().describe('Notas adicionais'),
                    }),
                    handler: async ({ result, notes }, { network }) => {
                        const plan = (network?.state.kv.get('plan') || []);
                        const completedStep = plan.shift();
                        network?.state.kv.set('plan', plan);
                        const results = (network?.state.kv.get('results') || {});
                        results[completedStep || 'unknown'] = result;
                        network?.state.kv.set('results', results);
                        if (notes) {
                            network?.state.kv.set('lastNotes', notes);
                        }
                        return `Passo concluído: ${completedStep}`;
                    },
                }),
                ...this.createSharedTools(),
            ],
        });
    }
    /**
     * Cria agente revisor
     */
    createReviewerAgent(model) {
        return createAgent({
            name: 'Reviewer',
            description: 'Agente que revisa e valida resultados',
            system: ({ network }) => {
                const results = network?.state.kv.get('results') || {};
                return `Você é um revisor especializado do PAGIA.
Seu papel é revisar e validar os resultados das execuções.

## Resultados Anteriores
${JSON.stringify(results, null, 2)}

## Instruções
1. Analise os resultados
2. Identifique problemas ou melhorias
3. Forneça feedback construtivo
4. Use 'approve_results' ou 'request_revision'`;
            },
            model,
            tools: [
                createTool({
                    name: 'approve_results',
                    description: 'Aprova os resultados da execução',
                    parameters: z.object({
                        summary: z.string().describe('Resumo da aprovação'),
                        quality: z.number().min(1).max(10).describe('Nota de qualidade'),
                    }),
                    handler: async ({ summary, quality }, { network }) => {
                        network?.state.kv.set('approved', true);
                        network?.state.kv.set('approvalSummary', summary);
                        network?.state.kv.set('quality', quality);
                        return `Resultados aprovados com nota ${quality}/10`;
                    },
                }),
                createTool({
                    name: 'request_revision',
                    description: 'Solicita revisão dos resultados',
                    parameters: z.object({
                        issues: z.array(z.string()).describe('Lista de problemas encontrados'),
                        suggestions: z.array(z.string()).optional().describe('Sugestões de melhoria'),
                    }),
                    handler: async ({ issues, suggestions }, { network }) => {
                        network?.state.kv.set('revisionRequired', true);
                        network?.state.kv.set('issues', issues);
                        if (suggestions) {
                            network?.state.kv.set('suggestions', suggestions);
                        }
                        return `Revisão solicitada: ${issues.length} problemas encontrados`;
                    },
                }),
                ...this.createSharedTools(),
            ],
        });
    }
    /**
     * Cria agente supervisor (roteador)
     */
    createSupervisorAgent(model, agents) {
        const agentNames = agents.map((a) => a.name).join(', ');
        return createRoutingAgent({
            name: 'Supervisor',
            description: 'Supervisor que orquestra a rede de agentes PAGIA',
            system: `Você é o Supervisor do PAGIA.
Seu papel é orquestrar a execução dos agentes da rede.

## Agentes Disponíveis
${agentNames}

## Fluxo de Trabalho
1. Se não houver plano, envie para o Planner
2. Se houver plano com passos, envie para o Executor
3. Após execução, envie para o Reviewer
4. Se revisão requerida, volte ao Executor
5. Se aprovado, finalize

## Instruções
- Analise o estado atual
- Decida qual agente deve atuar
- Use 'route_to_agent' para direcionar
- Use 'done' quando tudo estiver concluído`,
            model,
            tools: [
                createTool({
                    name: 'done',
                    description: 'Finaliza a execução da rede',
                    parameters: z.object({
                        summary: z.string().describe('Resumo final'),
                    }),
                    handler: async ({ summary }, { network }) => {
                        network?.state.kv.set('completed', true);
                        network?.state.kv.set('finalSummary', summary);
                        return summary;
                    },
                }),
                createTool({
                    name: 'route_to_agent',
                    description: 'Direciona para um agente específico',
                    parameters: z.object({
                        agent: z.string().describe('Nome do agente'),
                        reason: z.string().optional().describe('Motivo do direcionamento'),
                    }),
                    handler: async ({ agent, reason }) => {
                        if (reason) {
                            logger.debug(`Roteando para ${agent}: ${reason}`);
                        }
                        return agent;
                    },
                }),
            ],
            lifecycle: {
                onRoute: ({ result, network }) => {
                    // Verificar se está completo
                    if (network?.state.kv.get('completed')) {
                        return undefined;
                    }
                    const toolCall = result.toolCalls[0];
                    if (!toolCall)
                        return undefined;
                    const toolName = toolCall.tool.name;
                    if (toolName === 'done') {
                        return undefined;
                    }
                    if (toolName === 'route_to_agent') {
                        const content = toolCall.content;
                        if (typeof content === 'object' && content !== null && 'data' in content) {
                            return [content.data];
                        }
                    }
                    return undefined;
                },
            },
        });
    }
    /**
     * Cria a rede padrão do PAGIA
     */
    createDefaultNetwork(config) {
        const finalConfig = { ...this.defaultConfig, ...config };
        const model = this.createModel(finalConfig.defaultModel.provider, finalConfig.defaultModel.model);
        // Criar agentes
        const plannerAgent = this.createPlannerAgent(model);
        const executorAgent = this.createExecutorAgent(model);
        const reviewerAgent = this.createReviewerAgent(model);
        // Criar supervisor
        const supervisorAgent = this.createSupervisorAgent(model, [
            plannerAgent,
            executorAgent,
            reviewerAgent,
        ]);
        // Criar rede
        const network = createNetwork({
            name: finalConfig.name,
            agents: [plannerAgent, executorAgent, reviewerAgent],
            defaultModel: model,
            router: supervisorAgent,
            maxIter: finalConfig.maxIterations,
        });
        // Armazenar rede
        this.networks.set(finalConfig.name, network);
        logger.info(`Rede AgentKit "${finalConfig.name}" criada`);
        return network;
    }
    /**
     * Cria rede customizada com agentes PAGIA
     */
    async createCustomNetwork(name, agentIds, config) {
        const finalConfig = { ...this.defaultConfig, ...config, name };
        const model = this.createModel(finalConfig.defaultModel.provider, finalConfig.defaultModel.model);
        // Converter agentes PAGIA para AgentKit
        const agents = [];
        for (const agentId of agentIds) {
            const pagiaAgent = agentRegistry.get(agentId);
            if (!pagiaAgent) {
                logger.warn(`Agente "${agentId}" não encontrado`);
                continue;
            }
            // Criar agente AgentKit baseado no agente PAGIA
            const agent = createAgent({
                name: pagiaAgent.name,
                description: pagiaAgent.description,
                system: `Você é ${pagiaAgent.name}, especializado em ${pagiaAgent.role}.

## Descrição
${pagiaAgent.description}

## Capacidades
${pagiaAgent.capabilities.map((c) => `- ${c}`).join('\n')}

## Instruções
${pagiaAgent.instructions || 'Siga as melhores práticas da sua especialidade.'}`,
                model,
                tools: [
                    // Ferramenta para executar o agente PAGIA original
                    createTool({
                        name: `execute_${pagiaAgent.name.toLowerCase().replace(/\s+/g, '_')}`,
                        description: `Executa funcionalidade específica do ${pagiaAgent.name}`,
                        parameters: z.object({
                            task: z.string().describe('Tarefa a ser executada'),
                        }),
                        handler: async ({ task }) => {
                            const result = await pagiaAgent.safeExecute({ prompt: task });
                            return result.content;
                        },
                    }),
                    ...this.createSharedTools(),
                ],
            });
            agents.push(agent);
        }
        if (agents.length === 0) {
            throw new Error('Nenhum agente válido encontrado');
        }
        // Criar rede com roteamento baseado em código
        const network = createNetwork({
            name,
            agents,
            defaultModel: model,
            router: ({ network: net }) => {
                // Roteamento simples: executar agentes em sequência
                const currentAgentIndex = net?.state.kv.get('currentAgentIndex') || 0;
                if (currentAgentIndex >= agents.length) {
                    return undefined; // Todos os agentes executados
                }
                net?.state.kv.set('currentAgentIndex', currentAgentIndex + 1);
                return agents[currentAgentIndex];
            },
            maxIter: finalConfig.maxIterations,
        });
        this.networks.set(name, network);
        logger.info(`Rede customizada "${name}" criada com ${agents.length} agentes`);
        return network;
    }
    /**
     * Executa uma rede
     */
    async runNetwork(networkName, input) {
        const network = this.networks.get(networkName);
        if (!network) {
            return { success: false, error: `Rede "${networkName}" não encontrada` };
        }
        try {
            await eventBus.emit(PAGIAEvents.WORKFLOW_STARTED, { network: networkName, input });
            const result = await network.run(input);
            // Extrair estado final
            const state = {};
            const finalSummary = result.state?.kv.get('finalSummary');
            const approved = result.state?.kv.get('approved');
            const quality = result.state?.kv.get('quality');
            state.completed = result.state?.kv.get('completed') || false;
            state.finalSummary = finalSummary;
            state.approved = approved;
            state.quality = quality;
            await eventBus.emit(PAGIAEvents.WORKFLOW_COMPLETED, { network: networkName, result: state });
            return {
                success: true,
                result: finalSummary || 'Execução concluída',
                state,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            await eventBus.emit(PAGIAEvents.WORKFLOW_ERROR, { network: networkName, error: errorMessage });
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Obtém uma rede pelo nome
     */
    getNetwork(name) {
        return this.networks.get(name);
    }
    /**
     * Lista todas as redes
     */
    listNetworks() {
        return Array.from(this.networks.keys());
    }
    /**
     * Remove uma rede
     */
    removeNetwork(name) {
        return this.networks.delete(name);
    }
    /**
     * Estatísticas das redes
     */
    getStats() {
        return {
            total: this.networks.size,
            networks: this.listNetworks(),
        };
    }
}
// Singleton exportado
export const pagiaNetwork = PAGIANetwork.getInstance();
//# sourceMappingURL=inngest-network.js.map