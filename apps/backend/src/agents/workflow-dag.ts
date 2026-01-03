/**
 * PAGIA - Workflow DAG Builder
 * Construção e validação de grafos acíclicos direcionados para workflows
 * 
 * @module agents/workflow-dag
 * @author Automações Comerciais Integradas
 */

import type {
    WorkflowDefinition,
    WorkflowNode,
    WorkflowEdge,
    WorkflowConfig,
    WorkflowValidationResult,
    WorkflowValidationError,
    WorkflowValidationWarning,
} from './workflow-types.js';

import {
    START_NODE_ID,
    END_NODE_ID,
    DEFAULT_WORKFLOW_CONFIG,
    WORKFLOW_LIMITS,
} from './workflow-types.js';

// ============================================================================
// DAG Builder
// ============================================================================

/**
 * Builder para criação de workflows DAG
 * 
 * @example
 * ```typescript
 * const workflow = new DAGBuilder('my-workflow')
 *   .addNode({ id: 'analyze', agentId: 'analyst' })
 *   .addNode({ id: 'implement', agentId: 'developer' })
 *   .addNode({ id: 'review', agentId: 'reviewer' })
 *   .addEdge({ from: START_NODE_ID, to: 'analyze' })
 *   .addEdge({ from: 'analyze', to: 'implement' })
 *   .addEdge({ from: 'implement', to: 'review' })
 *   .addEdge({ from: 'review', to: END_NODE_ID })
 *   .build();
 * ```
 */
export class DAGBuilder {
    private id: string;
    private name: string;
    private description?: string;
    private nodes: Map<string, WorkflowNode> = new Map();
    private edges: WorkflowEdge[] = [];
    private config: Partial<WorkflowConfig> = {};

    constructor(id: string, name?: string) {
        this.id = id;
        this.name = name || id;
    }

    /**
     * Define o nome do workflow
     */
    setName(name: string): this {
        this.name = name;
        return this;
    }

    /**
     * Define a descrição do workflow
     */
    setDescription(description: string): this {
        this.description = description;
        return this;
    }

    /**
     * Define configurações do workflow
     */
    setConfig(config: Partial<WorkflowConfig>): this {
        this.config = { ...this.config, ...config };
        return this;
    }

    /**
     * Adiciona um nodo ao workflow
     */
    addNode(node: WorkflowNode): this {
        if (this.nodes.has(node.id)) {
            throw new Error(`Nodo '${node.id}' já existe no workflow`);
        }
        if (node.id === START_NODE_ID || node.id === END_NODE_ID) {
            throw new Error(`ID '${node.id}' é reservado`);
        }
        this.nodes.set(node.id, node);
        return this;
    }

    /**
     * Adiciona múltiplos nodos
     */
    addNodes(nodes: WorkflowNode[]): this {
        for (const node of nodes) {
            this.addNode(node);
        }
        return this;
    }

    /**
     * Adiciona uma aresta ao workflow
     */
    addEdge(edge: WorkflowEdge): this {
        this.edges.push(edge);
        return this;
    }

    /**
     * Adiciona múltiplas arestas
     */
    addEdges(edges: WorkflowEdge[]): this {
        for (const edge of edges) {
            this.addEdge(edge);
        }
        return this;
    }

    /**
     * Conecta um nodo de origem a um nodo de destino
     * Sintaxe simplificada para addEdge
     */
    connect(from: string, to: string, label?: string): this {
        return this.addEdge({ from, to, label });
    }

    /**
     * Conecta múltiplos nodos em sequência
     * @example chain('a', 'b', 'c') cria: a→b, b→c
     */
    chain(...nodeIds: string[]): this {
        for (let i = 0; i < nodeIds.length - 1; i++) {
            this.connect(nodeIds[i], nodeIds[i + 1]);
        }
        return this;
    }

    /**
     * Conecta um nodo a múltiplos destinos (fan-out)
     * @example fanOut('a', ['b', 'c', 'd']) cria: a→b, a→c, a→d
     */
    fanOut(from: string, toNodes: string[]): this {
        for (const to of toNodes) {
            this.connect(from, to);
        }
        return this;
    }

    /**
     * Conecta múltiplas origens a um destino (fan-in)
     * @example fanIn(['a', 'b', 'c'], 'd') cria: a→d, b→d, c→d
     */
    fanIn(fromNodes: string[], to: string): this {
        for (const from of fromNodes) {
            this.connect(from, to);
        }
        return this;
    }

    /**
     * Constrói e valida o workflow
     */
    build(): WorkflowDefinition {
        const definition: WorkflowDefinition = {
            id: this.id,
            name: this.name,
            description: this.description,
            nodes: Array.from(this.nodes.values()),
            edges: this.edges,
            config: {
                ...DEFAULT_WORKFLOW_CONFIG,
                ...this.config,
            },
        };

        // Validar antes de retornar
        const validation = validateWorkflow(definition);
        if (!validation.valid) {
            const errorMessages = validation.errors.map(e => e.message).join('; ');
            throw new Error(`Workflow inválido: ${errorMessages}`);
        }

        return definition;
    }

    /**
     * Retorna definição sem validar (para debug)
     */
    buildUnsafe(): WorkflowDefinition {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            nodes: Array.from(this.nodes.values()),
            edges: this.edges,
            config: {
                ...DEFAULT_WORKFLOW_CONFIG,
                ...this.config,
            },
        };
    }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Valida uma definição de workflow
 */
export function validateWorkflow(workflow: WorkflowDefinition): WorkflowValidationResult {
    const errors: WorkflowValidationError[] = [];
    const warnings: WorkflowValidationWarning[] = [];

    // Validar limites
    if (workflow.nodes.length === 0) {
        errors.push({
            code: 'NO_NODES',
            message: 'Workflow deve ter pelo menos um nodo',
        });
    }

    if (workflow.nodes.length > WORKFLOW_LIMITS.MAX_NODES) {
        errors.push({
            code: 'TOO_MANY_NODES',
            message: `Workflow tem ${workflow.nodes.length} nodos, máximo é ${WORKFLOW_LIMITS.MAX_NODES}`,
        });
    }

    if (workflow.edges.length > WORKFLOW_LIMITS.MAX_EDGES) {
        errors.push({
            code: 'TOO_MANY_EDGES',
            message: `Workflow tem ${workflow.edges.length} arestas, máximo é ${WORKFLOW_LIMITS.MAX_EDGES}`,
        });
    }

    // Validar config
    const config = workflow.config;
    if (config.maxConcurrency < WORKFLOW_LIMITS.MIN_CONCURRENCY ||
        config.maxConcurrency > WORKFLOW_LIMITS.MAX_CONCURRENCY) {
        errors.push({
            code: 'INVALID_CONCURRENCY',
            message: `maxConcurrency deve estar entre ${WORKFLOW_LIMITS.MIN_CONCURRENCY} e ${WORKFLOW_LIMITS.MAX_CONCURRENCY}`,
        });
    }

    if (config.timeout && (config.timeout < WORKFLOW_LIMITS.MIN_TIMEOUT ||
        config.timeout > WORKFLOW_LIMITS.MAX_TIMEOUT)) {
        errors.push({
            code: 'INVALID_TIMEOUT',
            message: `timeout deve estar entre ${WORKFLOW_LIMITS.MIN_TIMEOUT} e ${WORKFLOW_LIMITS.MAX_TIMEOUT}`,
        });
    }

    // Criar set de IDs de nodos
    const nodeIds = new Set(workflow.nodes.map(n => n.id));
    const validNodeIds = new Set([START_NODE_ID, END_NODE_ID, ...nodeIds]);

    // Validar nodos duplicados
    if (nodeIds.size !== workflow.nodes.length) {
        const seen = new Set<string>();
        for (const node of workflow.nodes) {
            if (seen.has(node.id)) {
                errors.push({
                    code: 'DUPLICATE_NODE',
                    message: `Nodo duplicado: ${node.id}`,
                    context: { nodeId: node.id },
                });
            }
            seen.add(node.id);
        }
    }

    // Validar IDs reservados
    for (const node of workflow.nodes) {
        if (node.id === START_NODE_ID || node.id === END_NODE_ID) {
            errors.push({
                code: 'RESERVED_ID',
                message: `ID '${node.id}' é reservado`,
                context: { nodeId: node.id },
            });
        }
    }

    // Validar arestas
    for (const edge of workflow.edges) {
        if (!validNodeIds.has(edge.from)) {
            errors.push({
                code: 'INVALID_EDGE_FROM',
                message: `Aresta referencia nodo inexistente: ${edge.from}`,
                context: { edge },
            });
        }
        if (!validNodeIds.has(edge.to)) {
            errors.push({
                code: 'INVALID_EDGE_TO',
                message: `Aresta referencia nodo inexistente: ${edge.to}`,
                context: { edge },
            });
        }
        if (edge.from === edge.to) {
            errors.push({
                code: 'SELF_LOOP',
                message: `Aresta de auto-referência não permitida: ${edge.from}`,
                context: { edge },
            });
        }
    }

    // Verificar ciclos
    const cycleResult = detectCycle(workflow);
    if (cycleResult.hasCycle) {
        errors.push({
            code: 'CYCLE_DETECTED',
            message: `Ciclo detectado no workflow: ${cycleResult.path?.join(' → ')}`,
            context: { path: cycleResult.path },
        });
    }

    // Validar conectividade
    const connectivity = analyzeConnectivity(workflow);

    if (connectivity.startNodes.length === 0) {
        errors.push({
            code: 'NO_START_NODES',
            message: 'Workflow não tem nodos iniciais (sem conexão de __start__)',
        });
    }

    if (connectivity.endNodes.length === 0) {
        errors.push({
            code: 'NO_END_NODES',
            message: 'Workflow não tem nodos finais (sem conexão para __end__)',
        });
    }

    for (const nodeId of connectivity.unreachableNodes) {
        warnings.push({
            code: 'UNREACHABLE_NODE',
            message: `Nodo não é alcançável do início: ${nodeId}`,
            context: { nodeId },
        });
    }

    for (const nodeId of connectivity.deadEndNodes) {
        warnings.push({
            code: 'DEAD_END_NODE',
            message: `Nodo não leva ao fim: ${nodeId}`,
            context: { nodeId },
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

// ============================================================================
// Cycle Detection (DFS)
// ============================================================================

interface CycledetectionResult {
    hasCycle: boolean;
    path?: string[];
}

/**
 * Detecta ciclos no workflow usando DFS
 */
export function detectCycle(workflow: WorkflowDefinition): CycledetectionResult {
    const adjacencyList = buildAdjacencyList(workflow);
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    function dfs(nodeId: string): boolean {
        visited.add(nodeId);
        recursionStack.add(nodeId);
        path.push(nodeId);

        const neighbors = adjacencyList.get(nodeId) || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                if (dfs(neighbor)) {
                    return true;
                }
            } else if (recursionStack.has(neighbor)) {
                // Ciclo encontrado
                path.push(neighbor);
                return true;
            }
        }

        recursionStack.delete(nodeId);
        path.pop();
        return false;
    }

    // Começar do START_NODE
    if (dfs(START_NODE_ID)) {
        // Limpar path para mostrar apenas o ciclo
        const cycleStart = path.indexOf(path[path.length - 1]);
        const cyclePath = path.slice(cycleStart);
        return { hasCycle: true, path: cyclePath };
    }

    // Verificar nodos não visitados (componentes desconectados)
    for (const node of workflow.nodes) {
        if (!visited.has(node.id)) {
            if (dfs(node.id)) {
                const cycleStart = path.indexOf(path[path.length - 1]);
                const cyclePath = path.slice(cycleStart);
                return { hasCycle: true, path: cyclePath };
            }
        }
    }

    return { hasCycle: false };
}

// ============================================================================
// Topological Sort (Kahn's Algorithm)
// ============================================================================

/**
 * Resultado da ordenação topológica
 */
export interface TopologicalSortResult {
    /** Se a ordenação foi bem sucedida */
    success: boolean;
    /** Nodos ordenados topologicamente */
    order: string[];
    /** Nodos em cada nível (para paralelização) */
    levels: string[][];
    /** Erro se falhou */
    error?: string;
}

/**
 * Realiza ordenação topológica usando algoritmo de Kahn
 * Retorna nodos organizados por níveis para execução paralela
 */
export function topologicalSort(workflow: WorkflowDefinition): TopologicalSortResult {
    const adjacencyList = buildAdjacencyList(workflow);
    const inDegree = new Map<string, number>();
    const allNodes = new Set<string>();

    // Inicializar in-degree e coletar todos os nodos
    allNodes.add(START_NODE_ID);
    for (const node of workflow.nodes) {
        allNodes.add(node.id);
        inDegree.set(node.id, 0);
    }
    allNodes.add(END_NODE_ID);
    inDegree.set(END_NODE_ID, 0);
    inDegree.set(START_NODE_ID, 0);

    // Calcular in-degree
    for (const edge of workflow.edges) {
        const current = inDegree.get(edge.to) || 0;
        inDegree.set(edge.to, current + 1);
    }

    // Iniciar com nodos de in-degree 0
    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree) {
        if (degree === 0) {
            queue.push(nodeId);
        }
    }

    const order: string[] = [];
    const levels: string[][] = [];
    let currentLevel: string[] = [...queue];

    while (queue.length > 0) {
        const nextLevel: string[] = [];

        while (currentLevel.length > 0) {
            const nodeId = currentLevel.shift()!;
            queue.shift();
            order.push(nodeId);

            const neighbors = adjacencyList.get(nodeId) || [];
            for (const neighbor of neighbors) {
                const newDegree = (inDegree.get(neighbor) || 0) - 1;
                inDegree.set(neighbor, newDegree);
                if (newDegree === 0) {
                    queue.push(neighbor);
                    nextLevel.push(neighbor);
                }
            }
        }

        if (currentLevel.length > 0 || order.length > levels.flat().length) {
            // Adicionar nodos processados ao nível atual
            const levelNodes = order.slice(levels.flat().length);
            if (levelNodes.length > 0) {
                levels.push(levelNodes);
            }
        }

        currentLevel = nextLevel;
    }

    // Verificar se todos os nodos foram processados
    if (order.length !== allNodes.size) {
        return {
            success: false,
            order: [],
            levels: [],
            error: 'Ciclo detectado - nem todos os nodos foram processados',
        };
    }

    return {
        success: true,
        order,
        levels,
    };
}

/**
 * Obtém nodos prontos para execução (todas as dependências satisfeitas)
 */
export function getReadyNodes(
    workflow: WorkflowDefinition,
    completedNodes: Set<string>
): string[] {
    const dependencyMap = buildDependencyMap(workflow);
    const ready: string[] = [];

    for (const node of workflow.nodes) {
        if (completedNodes.has(node.id)) {
            continue;
        }

        const dependencies = dependencyMap.get(node.id) || [];
        const allDependenciesMet = dependencies.every(dep =>
            dep === START_NODE_ID || completedNodes.has(dep)
        );

        if (allDependenciesMet) {
            ready.push(node.id);
        }
    }

    return ready;
}

// ============================================================================
// Connectivity Analysis
// ============================================================================

interface ConnectivityAnalysis {
    startNodes: string[];
    endNodes: string[];
    unreachableNodes: string[];
    deadEndNodes: string[];
}

/**
 * Analisa conectividade do workflow
 */
function analyzeConnectivity(workflow: WorkflowDefinition): ConnectivityAnalysis {
    const adjacencyList = buildAdjacencyList(workflow);
    const reverseAdjacencyList = buildReverseAdjacencyList(workflow);

    // Encontrar nodos iniciais (conexões de __start__)
    const startNodes = adjacencyList.get(START_NODE_ID) || [];

    // Encontrar nodos finais (conexões para __end__)
    const endNodes = (reverseAdjacencyList.get(END_NODE_ID) || []);

    // BFS do início para encontrar nodos alcançáveis
    const reachableFromStart = new Set<string>();
    const queueStart: string[] = [START_NODE_ID];
    while (queueStart.length > 0) {
        const node = queueStart.shift()!;
        if (reachableFromStart.has(node)) continue;
        reachableFromStart.add(node);
        const neighbors = adjacencyList.get(node) || [];
        queueStart.push(...neighbors);
    }

    // BFS reverso do fim para encontrar nodos que levam ao fim
    const reachesToEnd = new Set<string>();
    const queueEnd: string[] = [END_NODE_ID];
    while (queueEnd.length > 0) {
        const node = queueEnd.shift()!;
        if (reachesToEnd.has(node)) continue;
        reachesToEnd.add(node);
        const neighbors = reverseAdjacencyList.get(node) || [];
        queueEnd.push(...neighbors);
    }

    // Identificar nodos problemáticos
    const unreachableNodes: string[] = [];
    const deadEndNodes: string[] = [];

    for (const node of workflow.nodes) {
        if (!reachableFromStart.has(node.id)) {
            unreachableNodes.push(node.id);
        }
        if (!reachesToEnd.has(node.id)) {
            deadEndNodes.push(node.id);
        }
    }

    return {
        startNodes,
        endNodes,
        unreachableNodes,
        deadEndNodes,
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Constrói lista de adjacência do workflow
 */
function buildAdjacencyList(workflow: WorkflowDefinition): Map<string, string[]> {
    const adjacencyList = new Map<string, string[]>();

    // Inicializar com todos os nodos
    adjacencyList.set(START_NODE_ID, []);
    adjacencyList.set(END_NODE_ID, []);
    for (const node of workflow.nodes) {
        adjacencyList.set(node.id, []);
    }

    // Adicionar arestas
    for (const edge of workflow.edges) {
        const neighbors = adjacencyList.get(edge.from) || [];
        neighbors.push(edge.to);
        adjacencyList.set(edge.from, neighbors);
    }

    return adjacencyList;
}

/**
 * Constrói lista de adjacência reversa (para BFS reverso)
 */
function buildReverseAdjacencyList(workflow: WorkflowDefinition): Map<string, string[]> {
    const reverseList = new Map<string, string[]>();

    // Inicializar
    reverseList.set(START_NODE_ID, []);
    reverseList.set(END_NODE_ID, []);
    for (const node of workflow.nodes) {
        reverseList.set(node.id, []);
    }

    // Adicionar arestas reversas
    for (const edge of workflow.edges) {
        const neighbors = reverseList.get(edge.to) || [];
        neighbors.push(edge.from);
        reverseList.set(edge.to, neighbors);
    }

    return reverseList;
}

/**
 * Constrói mapa de dependências (nodeId -> nodos que ele depende)
 */
function buildDependencyMap(workflow: WorkflowDefinition): Map<string, string[]> {
    return buildReverseAdjacencyList(workflow);
}

/**
 * Serializa workflow para YAML
 */
export function serializeWorkflow(workflow: WorkflowDefinition): string {
    // Formato YAML simplificado
    let yaml = `# Workflow: ${workflow.name}\n`;
    yaml += `id: ${workflow.id}\n`;
    yaml += `name: ${workflow.name}\n`;
    if (workflow.description) {
        yaml += `description: ${workflow.description}\n`;
    }
    yaml += `\nconfig:\n`;
    yaml += `  maxConcurrency: ${workflow.config.maxConcurrency}\n`;
    if (workflow.config.timeout) {
        yaml += `  timeout: ${workflow.config.timeout}\n`;
    }
    yaml += `\nnodes:\n`;
    for (const node of workflow.nodes) {
        yaml += `  - id: ${node.id}\n`;
        yaml += `    agentId: ${node.agentId}\n`;
        if (node.name) {
            yaml += `    name: ${node.name}\n`;
        }
    }
    yaml += `\nedges:\n`;
    for (const edge of workflow.edges) {
        yaml += `  - from: ${edge.from}\n`;
        yaml += `    to: ${edge.to}\n`;
        if (edge.label) {
            yaml += `    label: ${edge.label}\n`;
        }
    }
    return yaml;
}
