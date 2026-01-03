/**
 * PAGIA - Agent Composer
 * Sistema de composição de subagentes
 * 
 * @module agents/agent-composer
 * @author Automações Comerciais Integradas
 */

import { BaseAgent, AgentInput, AgentOutput, SuggestedAction } from './base-agent.js';
import { agentRegistry } from './agent-registry.js';
import { workflowEngine } from './workflow-engine.js';
import { DAGBuilder } from './workflow-dag.js';
import { Semaphore } from '../utils/semaphore.js';
import type { AIProvider } from '../types/index.js';
import type { WorkflowDefinition, WorkflowExecutionResult } from './workflow-types.js';
import { START_NODE_ID, END_NODE_ID } from './workflow-types.js';

/**
 * Estratégias de composição de agentes
 */
export type CompositionStrategy =
    | 'sequential'    // Agentes executam em sequência
    | 'parallel'      // Agentes executam em paralelo
    | 'pipeline'      // Output de um é input do próximo
    | 'voting'        // Agentes votam no melhor resultado
    | 'specialist';   // Agente especialista decide quem executa

interface CompositionConfig {
    strategy: CompositionStrategy;
    aggregator?: AggregatorFunction;
    selector?: SelectorFunction;
    timeout?: number;
    /** Número máximo de agentes executando em paralelo (default: 5) */
    maxConcurrency?: number;
    /** Se true, aborta no primeiro erro (default: false) */
    failFast?: boolean;
}

/** Configuração padrão */
const DEFAULT_COMPOSITION_CONFIG: Partial<CompositionConfig> = {
    maxConcurrency: 5,
    failFast: false,
};

type AggregatorFunction = (outputs: AgentOutput[]) => AgentOutput;
type SelectorFunction = (outputs: AgentOutput[]) => AgentOutput;

/**
 * Classe ComposedAgent - Agente composto de múltiplos subagentes
 */
export class ComposedAgent extends BaseAgent {
    readonly name: string;
    readonly role: string;
    readonly description: string;
    readonly module: string = 'composed';

    private subagents: BaseAgent[];
    private config: CompositionConfig;

    constructor(
        name: string,
        role: string,
        subagents: BaseAgent[],
        config: CompositionConfig,
        aiProvider?: Partial<AIProvider>
    ) {
        super(aiProvider);
        this.name = name;
        this.role = role;
        this.description = `Agente composto: ${subagents.map((a) => a.name).join(', ')}`;
        this.subagents = subagents;
        this.config = config;
        this.capabilities = this.aggregateCapabilities();
    }

    /**
     * Agrega capacidades de todos os subagentes
     */
    private aggregateCapabilities(): string[] {
        const allCapabilities = new Set<string>();

        for (const agent of this.subagents) {
            for (const cap of agent.getCapabilities()) {
                allCapabilities.add(cap);
            }
        }

        return Array.from(allCapabilities);
    }

    /**
     * Executa o agente composto
     */
    async execute(input: AgentInput): Promise<AgentOutput> {
        const startTime = Date.now();

        switch (this.config.strategy) {
            case 'sequential':
                return this.executeSequential(input, startTime);
            case 'parallel':
                return this.executeParallel(input, startTime);
            case 'pipeline':
                return this.executePipeline(input, startTime);
            case 'voting':
                return this.executeVoting(input, startTime);
            case 'specialist':
                return this.executeSpecialist(input, startTime);
            default:
                return this.executeSequential(input, startTime);
        }
    }

    /**
     * Execução sequencial - cada agente executa após o anterior
     */
    private async executeSequential(input: AgentInput, startTime: number): Promise<AgentOutput> {
        const outputs: AgentOutput[] = [];

        for (const agent of this.subagents) {
            const output = await agent.safeExecute(input);
            outputs.push(output);
        }

        return this.aggregateOutputs(outputs, startTime);
    }

    /**
     * Execução paralela - agentes executam simultaneamente com controle de concorrência
     */
    private async executeParallel(input: AgentInput, startTime: number): Promise<AgentOutput> {
        const maxConcurrency = this.config.maxConcurrency ?? DEFAULT_COMPOSITION_CONFIG.maxConcurrency!;
        const failFast = this.config.failFast ?? DEFAULT_COMPOSITION_CONFIG.failFast!;
        const semaphore = new Semaphore(maxConcurrency);

        // Criar promises com controle de concorrência
        const executeWithSemaphore = async (agent: BaseAgent): Promise<AgentOutput> => {
            return semaphore.withSemaphore(() => agent.safeExecute(input), this.config.timeout);
        };

        const promises = this.subagents.map(executeWithSemaphore);

        // Aplicar timeout global se configurado
        let timeoutId: NodeJS.Timeout | undefined;
        const timeoutPromise = this.config.timeout
            ? new Promise<never>((_, reject) => {
                timeoutId = setTimeout(
                    () => reject(new Error('Timeout na execução paralela')),
                    this.config.timeout
                );
            })
            : null;

        try {
            if (failFast) {
                // Modo fail-fast: aborta no primeiro erro
                const results = timeoutPromise
                    ? await Promise.race([Promise.all(promises), timeoutPromise])
                    : await Promise.all(promises);
                return this.aggregateOutputs(results, startTime);
            } else {
                // Modo resiliente: continua mesmo com erros
                const settledResults = timeoutPromise
                    ? await Promise.race([Promise.allSettled(promises), timeoutPromise])
                    : await Promise.allSettled(promises);

                const outputs: AgentOutput[] = [];
                const errors: Error[] = [];

                for (const result of settledResults as PromiseSettledResult<AgentOutput>[]) {
                    if (result.status === 'fulfilled') {
                        outputs.push(result.value);
                    } else {
                        errors.push(result.reason);
                    }
                }

                // Se todos falharam, lançar erro
                if (outputs.length === 0 && errors.length > 0) {
                    throw new Error(`Todos os agentes falharam: ${errors.map(e => e.message).join('; ')}`);
                }

                return this.aggregateOutputs(outputs, startTime);
            }
        } finally {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        }
    }

    /**
     * Execução em pipeline - output de um é input do próximo
     */
    private async executePipeline(input: AgentInput, startTime: number): Promise<AgentOutput> {
        let currentInput = input;
        let lastOutput: AgentOutput | null = null;

        for (const agent of this.subagents) {
            lastOutput = await agent.safeExecute(currentInput);

            // Usar output como próximo input
            currentInput = {
                prompt: lastOutput.content,
                context: {
                    ...currentInput.context,
                    previousAgent: agent.name,
                    previousOutput: lastOutput.content,
                },
                history: currentInput.history,
                options: currentInput.options,
            };
        }

        if (!lastOutput) {
            throw new Error('Pipeline vazio');
        }

        return this.createOutput(
            lastOutput.content,
            lastOutput.metadata.tokensUsed,
            startTime
        );
    }

    /**
     * Execução com votação - melhor resultado é selecionado
     */
    private async executeVoting(input: AgentInput, startTime: number): Promise<AgentOutput> {
        const promises = this.subagents.map((agent) => agent.safeExecute(input));
        const outputs = await Promise.all(promises);

        // Usar seletor customizado ou padrão
        const selector = this.config.selector || this.defaultSelector;
        const selected = selector(outputs);

        return this.createOutput(
            selected.content,
            outputs.reduce((sum, o) => sum + (o.metadata.tokensUsed || 0), 0),
            startTime
        );
    }

    /**
     * Execução com especialista - um agente decide quem executa
     */
    private async executeSpecialist(input: AgentInput, startTime: number): Promise<AgentOutput> {
        // Primeiro agente é o especialista/roteador
        const specialist = this.subagents[0];
        const workers = this.subagents.slice(1);

        // Perguntar ao especialista qual agente usar
        const routingPrompt = `
Analise a seguinte solicitação e escolha o agente mais adequado para respondê-la.

Solicitação: ${input.prompt}

Agentes disponíveis:
${workers.map((a, i) => `${i + 1}. ${a.name} - ${a.role}`).join('\n')}

Responda apenas com o número do agente escolhido (1-${workers.length}).
    `.trim();

        const routingOutput = await specialist.safeExecute({
            ...input,
            prompt: routingPrompt,
        });

        // Extrair número do agente
        const match = routingOutput.content.match(/\d+/);
        const agentIndex = match ? parseInt(match[0]) - 1 : 0;

        // Validar índice
        const selectedIndex = Math.max(0, Math.min(agentIndex, workers.length - 1));
        const selectedAgent = workers[selectedIndex];

        // Executar agente selecionado
        const finalOutput = await selectedAgent.safeExecute(input);

        return this.createOutput(
            `[Agente selecionado: ${selectedAgent.name}]\n\n${finalOutput.content}`,
            (routingOutput.metadata.tokensUsed || 0) + (finalOutput.metadata.tokensUsed || 0),
            startTime
        );
    }

    /**
     * Agrega outputs de múltiplos agentes
     */
    private aggregateOutputs(outputs: AgentOutput[], startTime: number): AgentOutput {
        // Usar agregador customizado ou padrão
        const aggregator = this.config.aggregator || this.defaultAggregator;
        const aggregated = aggregator(outputs);

        return this.createOutput(
            aggregated.content,
            outputs.reduce((sum, o) => sum + (o.metadata.tokensUsed || 0), 0),
            startTime,
            this.aggregateSuggestedActions(outputs)
        );
    }

    /**
     * Agregador padrão - concatena outputs
     */
    private defaultAggregator(outputs: AgentOutput[]): AgentOutput {
        const content = outputs
            .map((o) => `## ${o.metadata.agentName}\n\n${o.content}`)
            .join('\n\n---\n\n');

        return outputs[0] ? { ...outputs[0], content } : outputs[0];
    }

    /**
     * Seletor padrão - escolhe o maior output
     */
    private defaultSelector(outputs: AgentOutput[]): AgentOutput {
        return outputs.reduce((best, current) =>
            current.content.length > best.content.length ? current : best
        );
    }

    /**
     * Agrega ações sugeridas de todos os outputs
     */
    private aggregateSuggestedActions(outputs: AgentOutput[]): SuggestedAction[] {
        const actions: SuggestedAction[] = [];

        for (const output of outputs) {
            if (output.suggestedActions) {
                actions.push(...output.suggestedActions);
            }
        }

        return actions;
    }

    /**
     * Obtém subagentes
     */
    getSubagents(): BaseAgent[] {
        return [...this.subagents];
    }

    /**
     * Adiciona subagente
     */
    addSubagent(agent: BaseAgent): void {
        this.subagents.push(agent);
        this.capabilities = this.aggregateCapabilities();
    }

    /**
     * Remove subagente
     */
    removeSubagent(agentId: string): boolean {
        const index = this.subagents.findIndex((a) => a.id === agentId);

        if (index === -1) {
            return false;
        }

        this.subagents.splice(index, 1);
        this.capabilities = this.aggregateCapabilities();

        return true;
    }
}

/**
 * Classe AgentComposer - Factory para criação de agentes compostos
 */
export class AgentComposer {
    private static instance: AgentComposer;

    private constructor() { }

    /**
     * Obtém a instância singleton do AgentComposer
     */
    static getInstance(): AgentComposer {
        if (!AgentComposer.instance) {
            AgentComposer.instance = new AgentComposer();
        }
        return AgentComposer.instance;
    }

    /**
     * Compõe agentes em um agente composto
     */
    compose(
        name: string,
        role: string,
        agents: BaseAgent[],
        strategy: CompositionStrategy = 'sequential',
        options?: Partial<CompositionConfig>
    ): ComposedAgent {
        const config: CompositionConfig = {
            strategy,
            ...options,
        };

        return new ComposedAgent(name, role, agents, config);
    }

    /**
     * Compõe agentes por IDs do registro
     */
    composeByIds(
        name: string,
        role: string,
        agentIds: string[],
        strategy: CompositionStrategy = 'sequential',
        options?: Partial<CompositionConfig>
    ): ComposedAgent | null {
        const agents: BaseAgent[] = [];

        for (const id of agentIds) {
            const agent = agentRegistry.get(id);
            if (agent) {
                agents.push(agent);
            }
        }

        if (agents.length === 0) {
            return null;
        }

        return this.compose(name, role, agents, strategy, options);
    }

    /**
     * Compõe agentes por capacidades
     */
    composeByCapabilities(
        name: string,
        role: string,
        capabilities: string[],
        strategy: CompositionStrategy = 'parallel',
        options?: Partial<CompositionConfig>
    ): ComposedAgent | null {
        const agents: BaseAgent[] = [];

        for (const cap of capabilities) {
            const found = agentRegistry.findByCapability(cap);
            agents.push(...found);
        }

        // Remover duplicatas
        const unique = Array.from(new Map(agents.map((a) => [a.id, a])).values());

        if (unique.length === 0) {
            return null;
        }

        return this.compose(name, role, unique, strategy, options);
    }

    /**
     * Cria um pipeline de agentes
     */
    createPipeline(
        name: string,
        agents: BaseAgent[],
        options?: Partial<CompositionConfig>
    ): ComposedAgent {
        return this.compose(
            name,
            'Pipeline de processamento',
            agents,
            'pipeline',
            options
        );
    }

    /**
     * Cria um ensemble de agentes com votação
     */
    createEnsemble(
        name: string,
        agents: BaseAgent[],
        selector?: SelectorFunction,
        options?: Partial<CompositionConfig>
    ): ComposedAgent {
        return this.compose(
            name,
            'Ensemble de agentes',
            agents,
            'voting',
            { ...options, selector }
        );
    }

    /**
     * Decompõe um agente composto
     */
    decompose(composedAgent: ComposedAgent): BaseAgent[] {
        return composedAgent.getSubagents();
    }

    /**
     * Compõe agentes em um workflow DAG
     * 
     * @example
     * ```typescript
     * const result = await agentComposer.composeDAG({
     *   id: 'analyze-and-implement',
     *   name: 'Análise e Implementação',
     *   nodes: [
     *     { id: 'analyze', agentId: 'analyst' },
     *     { id: 'plan', agentId: 'planner' },
     *     { id: 'implement', agentId: 'developer' },
     *   ],
     *   edges: [
     *     { from: '__start__', to: 'analyze' },
     *     { from: 'analyze', to: 'plan' },
     *     { from: 'plan', to: 'implement' },
     *     { from: 'implement', to: '__end__' },
     *   ],
     *   config: { maxConcurrency: 3 }
     * }, input);
     * ```
     */
    async composeDAG(
        workflow: WorkflowDefinition,
        input: AgentInput
    ): Promise<WorkflowExecutionResult> {
        return workflowEngine.execute(workflow, input);
    }

    /**
     * Cria um workflow DAG a partir de uma lista de agentes
     * Útil para criar workflows simples programaticamente
     * 
     * @param name Nome do workflow
     * @param agents Lista de agentes (podem incluir dependências)
     * @param structure Estrutura do workflow ('linear' | 'parallel' | 'fan-out-in')
     * @param options Configurações adicionais
     */
    createWorkflowFromAgents(
        name: string,
        agents: BaseAgent[],
        structure: 'linear' | 'parallel' | 'fan-out-in' = 'linear',
        options?: {
            maxConcurrency?: number;
            timeout?: number;
        }
    ): WorkflowDefinition {
        const builder = new DAGBuilder(name.toLowerCase().replace(/\s+/g, '-'), name);

        // Adicionar nodos
        for (const agent of agents) {
            builder.addNode({
                id: agent.id,
                name: agent.name,
                agentId: agent.id,
            });
        }

        // Definir estrutura
        switch (structure) {
            case 'linear':
                // A → B → C → D
                builder.connect(START_NODE_ID, agents[0].id);
                for (let i = 0; i < agents.length - 1; i++) {
                    builder.connect(agents[i].id, agents[i + 1].id);
                }
                builder.connect(agents[agents.length - 1].id, END_NODE_ID);
                break;

            case 'parallel':
                // __start__ → [A, B, C, D] → __end__
                for (const agent of agents) {
                    builder.connect(START_NODE_ID, agent.id);
                    builder.connect(agent.id, END_NODE_ID);
                }
                break;

            case 'fan-out-in':
                // __start__ → A → [B, C] → D → __end__
                if (agents.length >= 3) {
                    const first = agents[0];
                    const last = agents[agents.length - 1];
                    const middle = agents.slice(1, -1);

                    builder.connect(START_NODE_ID, first.id);
                    for (const agent of middle) {
                        builder.connect(first.id, agent.id);
                        builder.connect(agent.id, last.id);
                    }
                    builder.connect(last.id, END_NODE_ID);
                } else {
                    // Fallback para linear se poucos agentes
                    builder.connect(START_NODE_ID, agents[0].id);
                    for (let i = 0; i < agents.length - 1; i++) {
                        builder.connect(agents[i].id, agents[i + 1].id);
                    }
                    builder.connect(agents[agents.length - 1].id, END_NODE_ID);
                }
                break;
        }

        // Configurar
        builder.setConfig({
            maxConcurrency: options?.maxConcurrency ?? 5,
            timeout: options?.timeout,
        });

        return builder.build();
    }

    /**
     * Executa um workflow criado a partir de agentes
     */
    async executeWorkflow(
        name: string,
        agents: BaseAgent[],
        input: AgentInput,
        structure: 'linear' | 'parallel' | 'fan-out-in' = 'linear',
        options?: {
            maxConcurrency?: number;
            timeout?: number;
        }
    ): Promise<WorkflowExecutionResult> {
        const workflow = this.createWorkflowFromAgents(name, agents, structure, options);
        return this.composeDAG(workflow, input);
    }
}

// Singleton exportado
export const agentComposer = AgentComposer.getInstance();

