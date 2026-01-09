/**
 * PAGIA - Workflow DAG Builder
 * Construção e validação de grafos acíclicos direcionados para workflows
 *
 * @module agents/workflow-dag
 * @author Automações Comerciais Integradas
 */
import type { WorkflowDefinition, WorkflowNode, WorkflowEdge, WorkflowConfig, WorkflowValidationResult } from './workflow-types.js';
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
export declare class DAGBuilder {
    private id;
    private name;
    private description?;
    private nodes;
    private edges;
    private config;
    constructor(id: string, name?: string);
    /**
     * Define o nome do workflow
     */
    setName(name: string): this;
    /**
     * Define a descrição do workflow
     */
    setDescription(description: string): this;
    /**
     * Define configurações do workflow
     */
    setConfig(config: Partial<WorkflowConfig>): this;
    /**
     * Adiciona um nodo ao workflow
     */
    addNode(node: WorkflowNode): this;
    /**
     * Adiciona múltiplos nodos
     */
    addNodes(nodes: WorkflowNode[]): this;
    /**
     * Adiciona uma aresta ao workflow
     */
    addEdge(edge: WorkflowEdge): this;
    /**
     * Adiciona múltiplas arestas
     */
    addEdges(edges: WorkflowEdge[]): this;
    /**
     * Conecta um nodo de origem a um nodo de destino
     * Sintaxe simplificada para addEdge
     */
    connect(from: string, to: string, label?: string): this;
    /**
     * Conecta múltiplos nodos em sequência
     * @example chain('a', 'b', 'c') cria: a→b, b→c
     */
    chain(...nodeIds: string[]): this;
    /**
     * Conecta um nodo a múltiplos destinos (fan-out)
     * @example fanOut('a', ['b', 'c', 'd']) cria: a→b, a→c, a→d
     */
    fanOut(from: string, toNodes: string[]): this;
    /**
     * Conecta múltiplas origens a um destino (fan-in)
     * @example fanIn(['a', 'b', 'c'], 'd') cria: a→d, b→d, c→d
     */
    fanIn(fromNodes: string[], to: string): this;
    /**
     * Constrói e valida o workflow
     */
    build(): WorkflowDefinition;
    /**
     * Retorna definição sem validar (para debug)
     */
    buildUnsafe(): WorkflowDefinition;
}
/**
 * Valida uma definição de workflow
 */
export declare function validateWorkflow(workflow: WorkflowDefinition): WorkflowValidationResult;
interface CycledetectionResult {
    hasCycle: boolean;
    path?: string[];
}
/**
 * Detecta ciclos no workflow usando DFS
 */
export declare function detectCycle(workflow: WorkflowDefinition): CycledetectionResult;
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
export declare function topologicalSort(workflow: WorkflowDefinition): TopologicalSortResult;
/**
 * Obtém nodos prontos para execução (todas as dependências satisfeitas)
 */
export declare function getReadyNodes(workflow: WorkflowDefinition, completedNodes: Set<string>): string[];
/**
 * Serializa workflow para YAML
 */
export declare function serializeWorkflow(workflow: WorkflowDefinition): string;
export {};
//# sourceMappingURL=workflow-dag.d.ts.map