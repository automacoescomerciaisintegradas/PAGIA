import { create } from 'zustand';
import {
    applyNodeChanges,
    applyEdgeChanges,
    addEdge
} from '@xyflow/react';
import type { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import workflowAPI from '../api/workflowAPI';

export interface AgentNode extends Node {
    data: {
        label: string;
        agentId?: string;
        description?: string;
        status?: 'idle' | 'running' | 'completed' | 'failed';
    };
}

export interface WorkflowMeta {
    id: string;
    name: string;
    description: string;
    valid?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface WorkflowState {
    // Workflow metadata
    workflowId: string | null;
    workflowName: string;
    workflowDescription: string;

    // Graph state
    nodes: AgentNode[];
    edges: Edge[];

    // History
    undoStack: { nodes: AgentNode[]; edges: Edge[] }[];
    redoStack: { nodes: AgentNode[]; edges: Edge[] }[];

    // UI state
    theme: 'dark' | 'light';
    validationErrors: string[];
    isValid: boolean;
    isSaving: boolean;
    isLoading: boolean;
    lastSaved: string | null;
    error: string | null;

    // Available workflows from API
    availableWorkflows: WorkflowMeta[];
    availableAgents: Array<{ id: string; name: string; role: string; description: string }>;

    // Actions - Graph
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;
    addNode: (node: AgentNode) => void;
    removeNode: (nodeId: string) => void;
    setNodes: (nodes: AgentNode[]) => void;
    setEdges: (edges: Edge[]) => void;
    updateNodeData: (nodeId: string, data: Partial<AgentNode['data']>) => void;
    updateNodeStatus: (nodeId: string, status: AgentNode['data']['status']) => void;

    // Actions - History
    undo: () => void;
    redo: () => void;
    saveSnapshot: () => void;

    // Actions - UI
    toggleTheme: () => void;
    validate: () => void;
    clear: () => void;
    setError: (error: string | null) => void;

    // Actions - Workflow metadata
    setWorkflowName: (name: string) => void;
    setWorkflowDescription: (desc: string) => void;

    // Actions - API
    fetchWorkflows: () => Promise<void>;
    fetchAgents: () => Promise<void>;
    loadWorkflow: (id: string) => Promise<void>;
    saveWorkflow: () => Promise<void>;
    saveWorkflowAs: (name: string) => Promise<void>;
    deleteWorkflow: (id: string) => Promise<void>;
    exportToYAML: () => string;
    newWorkflow: () => void;
}

const START_NODE: AgentNode = {
    id: '__start__',
    type: 'input',
    position: { x: 250, y: 0 },
    data: { label: 'START', description: 'Início do workflow' },
    deletable: false,
};

const END_NODE: AgentNode = {
    id: '__end__',
    type: 'output',
    position: { x: 250, y: 400 },
    data: { label: 'END', description: 'Fim do workflow' },
    deletable: false,
};

// Helper: Cycle Detection (DFS)
const detectCycle = (nodes: AgentNode[], edges: Edge[]): boolean => {
    const adj = new Map<string, string[]>();
    edges.forEach(e => {
        if (!adj.has(e.source)) adj.set(e.source, []);
        adj.get(e.source)?.push(e.target);
    });

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const visit = (nodeId: string): boolean => {
        if (recursionStack.has(nodeId)) return true; // Cycle detected
        if (visited.has(nodeId)) return false;

        visited.add(nodeId);
        recursionStack.add(nodeId);

        const neighbors = adj.get(nodeId) || [];
        for (const neighbor of neighbors) {
            if (visit(neighbor)) return true;
        }

        recursionStack.delete(nodeId);
        return false;
    };

    for (const node of nodes) {
        if (visit(node.id)) return true;
    }
    return false;
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
    // Initial state
    workflowId: null,
    workflowName: 'Novo Workflow',
    workflowDescription: '',
    nodes: [START_NODE, END_NODE],
    edges: [],
    undoStack: [],
    redoStack: [],
    theme: 'dark',
    validationErrors: [],
    isValid: true,
    isSaving: false,
    isLoading: false,
    lastSaved: null,
    error: null,
    availableWorkflows: [],
    availableAgents: [],

    // ========================================================================
    // Graph Actions
    // ========================================================================

    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes) as AgentNode[],
        });
        get().validate();
    },

    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
        get().validate();
    },


    onConnect: (connection) => {
        if (connection.source === connection.target) {
            get().setError('Conexões cíclicas no mesmo nodo não são permitidas.');
            return;
        }

        const existing = get().edges.find(
            e => e.source === connection.source && e.target === connection.target
        );
        if (existing) return;

        // Validar Ciclo antes de adicionar
        const potentialEdges = addEdge(connection, get().edges);
        if (detectCycle(get().nodes, potentialEdges)) {
            get().setError('Ciclo detectado! O workflow deve ser um Grafo Acíclico (DAG).');
            return;
        }

        get().saveSnapshot();
        // Limpar erro se houver
        get().setError(null);

        set({
            edges: addEdge({
                ...connection,
                animated: true,
                style: { strokeWidth: 2 },
                type: 'smoothstep', // Better curves
            }, get().edges),
        });
        get().validate();
    },

    addNode: (node) => {
        get().saveSnapshot();
        set({
            nodes: [...get().nodes, node],
        });
        get().validate();
    },

    removeNode: (nodeId) => {
        if (nodeId === '__start__' || nodeId === '__end__') return;

        get().saveSnapshot();
        set({
            nodes: get().nodes.filter(n => n.id !== nodeId),
            edges: get().edges.filter(e => e.source !== nodeId && e.target !== nodeId),
        });
        get().validate();
    },

    setNodes: (nodes) => {
        set({ nodes: [START_NODE, END_NODE, ...nodes.filter(n => n.id !== '__start__' && n.id !== '__end__')] });
        get().validate();
    },

    setEdges: (edges) => {
        set({ edges });
        get().validate();
    },

    updateNodeData: (nodeId, data) => {
        get().saveSnapshot();
        set({
            nodes: get().nodes.map(n =>
                n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
            ),
        });
    },

    updateNodeStatus: (nodeId, status) => {
        set({
            nodes: get().nodes.map(n =>
                n.id === nodeId ? { ...n, data: { ...n.data, status } } : n
            ),
        });
    },

    // ========================================================================
    // History Actions
    // ========================================================================

    saveSnapshot: () => {
        const { nodes, edges, undoStack } = get();
        set({
            undoStack: [...undoStack.slice(-20), { nodes: [...nodes], edges: [...edges] }],
            redoStack: [],
        });
    },

    undo: () => {
        const { undoStack, nodes, edges, redoStack } = get();
        if (undoStack.length === 0) return;

        const previous = undoStack[undoStack.length - 1];
        set({
            nodes: previous.nodes,
            edges: previous.edges,
            undoStack: undoStack.slice(0, -1),
            redoStack: [...redoStack, { nodes, edges }],
        });
        get().validate();
    },

    redo: () => {
        const { redoStack, nodes, edges, undoStack } = get();
        if (redoStack.length === 0) return;

        const next = redoStack[redoStack.length - 1];
        set({
            nodes: next.nodes,
            edges: next.edges,
            redoStack: redoStack.slice(0, -1),
            undoStack: [...undoStack, { nodes, edges }],
        });
        get().validate();
    },

    // ========================================================================
    // UI Actions
    // ========================================================================

    toggleTheme: () => {
        set({ theme: get().theme === 'dark' ? 'light' : 'dark' });
    },

    validate: () => {
        const { nodes, edges } = get();
        const errors: string[] = [];

        const visited = new Set<string>();
        const recStack = new Set<string>();

        const hasCycle = (nodeId: string): boolean => {
            visited.add(nodeId);
            recStack.add(nodeId);

            const outEdges = edges.filter(e => e.source === nodeId);
            for (const edge of outEdges) {
                if (!visited.has(edge.target)) {
                    if (hasCycle(edge.target)) return true;
                } else if (recStack.has(edge.target)) {
                    return true;
                }
            }

            recStack.delete(nodeId);
            return false;
        };

        for (const node of nodes) {
            if (!visited.has(node.id)) {
                if (hasCycle(node.id)) {
                    errors.push('Ciclo detectado! O grafo deve ser acíclico.');
                    break;
                }
            }
        }

        const connectedNodes = new Set(edges.flatMap(e => [e.source, e.target]));
        const disconnected = nodes.filter(n =>
            n.id !== '__start__' && n.id !== '__end__' && !connectedNodes.has(n.id)
        );
        if (disconnected.length > 0) {
            errors.push('Nodos desconectados: ' + disconnected.map(n => n.data.label).join(', '));
        }

        const startEdges = edges.filter(e => e.source === '__start__');
        if (startEdges.length === 0 && nodes.length > 2) {
            errors.push('Nenhum nodo conectado ao START');
        }

        const endEdges = edges.filter(e => e.target === '__end__');
        if (endEdges.length === 0 && nodes.length > 2) {
            errors.push('Nenhum nodo conectado ao END');
        }

        set({
            validationErrors: errors,
            isValid: errors.length === 0,
        });
    },

    clear: () => {
        get().saveSnapshot();
        set({
            workflowId: null,
            workflowName: 'Novo Workflow',
            workflowDescription: '',
            nodes: [START_NODE, END_NODE],
            edges: [],
            lastSaved: null,
            error: null,
        });
    },

    setError: (error) => set({ error }),

    // ========================================================================
    // Workflow Metadata Actions
    // ========================================================================

    setWorkflowName: (name) => set({ workflowName: name }),
    setWorkflowDescription: (desc) => set({ workflowDescription: desc }),

    // ========================================================================
    // API Actions
    // ========================================================================

    fetchWorkflows: async () => {
        try {
            set({ isLoading: true, error: null });
            const { workflows } = await workflowAPI.listWorkflows();
            set({
                availableWorkflows: workflows.map(w => ({
                    id: w.id,
                    name: w.name,
                    description: w.description,
                    valid: w.valid,
                    createdAt: w.createdAt,
                    updatedAt: w.updatedAt,
                })),
                isLoading: false,
            });
        } catch (error) {
            set({
                error: `Erro ao carregar workflows: ${error instanceof Error ? error.message : String(error)}`,
                isLoading: false,
            });
        }
    },

    fetchAgents: async () => {
        try {
            const { agents } = await workflowAPI.listAgents();
            set({ availableAgents: agents });
        } catch (error) {
            console.warn('Não foi possível carregar agentes:', error);
        }
    },

    loadWorkflow: async (id: string) => {
        try {
            set({ isLoading: true, error: null });

            const { workflow } = await workflowAPI.getWorkflow(id);

            // Converter workflow para nodes/edges do ReactFlow
            const nodes: AgentNode[] = workflow.nodes.map((n, index) => ({
                id: n.id,
                type: 'agentNode',
                position: { x: 100 + (index % 3) * 180, y: 100 + Math.floor(index / 3) * 120 },
                data: {
                    label: n.name,
                    agentId: n.agentId,
                    description: n.description,
                },
            }));

            const edges: Edge[] = workflow.edges.map((e, index) => ({
                id: `edge-${index}`,
                source: e.from,
                target: e.to,
                animated: true,
                style: { strokeWidth: 2 },
            }));

            set({
                workflowId: workflow.id,
                workflowName: workflow.name,
                workflowDescription: workflow.description || '',
                nodes: [START_NODE, END_NODE, ...nodes],
                edges,
                isLoading: false,
                lastSaved: workflow.updatedAt || null,
                undoStack: [],
                redoStack: [],
            });

            get().validate();
        } catch (error) {
            set({
                error: `Erro ao carregar workflow: ${error instanceof Error ? error.message : String(error)}`,
                isLoading: false,
            });
        }
    },

    saveWorkflow: async () => {
        const { workflowId, workflowName, workflowDescription, nodes, edges, isValid } = get();

        if (!isValid) {
            set({ error: 'Corrija os erros de validação antes de salvar.' });
            return;
        }

        try {
            set({ isSaving: true, error: null });

            // Converter para formato da API
            const workflowNodes = nodes
                .filter(n => n.id !== '__start__' && n.id !== '__end__')
                .map(n => ({
                    id: n.id,
                    name: n.data.label,
                    agentId: n.data.agentId || 'developer',
                    description: n.data.description,
                }));

            const workflowEdges = edges.map(e => ({
                from: e.source,
                to: e.target,
            }));

            const workflow = {
                id: workflowId || `workflow-${Date.now()}`,
                name: workflowName,
                description: workflowDescription,
                config: {
                    maxConcurrency: 5,
                    timeout: 300000,
                    failFast: false,
                },
                nodes: workflowNodes,
                edges: workflowEdges,
            };

            let result;
            if (workflowId) {
                result = await workflowAPI.updateWorkflow(workflowId, workflow);
            } else {
                result = await workflowAPI.createWorkflow(workflow);
            }

            set({
                workflowId: result.id,
                isSaving: false,
                lastSaved: new Date().toISOString(),
            });

            // Atualizar lista
            get().fetchWorkflows();
        } catch (error) {
            set({
                error: `Erro ao salvar: ${error instanceof Error ? error.message : String(error)}`,
                isSaving: false,
            });
        }
    },

    saveWorkflowAs: async (name: string) => {
        set({
            workflowId: null,
            workflowName: name
        });
        await get().saveWorkflow();
    },

    deleteWorkflow: async (id: string) => {
        try {
            set({ isLoading: true, error: null });
            await workflowAPI.deleteWorkflow(id);

            // Se deletou o workflow atual, limpar
            if (get().workflowId === id) {
                get().clear();
            }

            await get().fetchWorkflows();
            set({ isLoading: false });
        } catch (error) {
            set({
                error: `Erro ao deletar: ${error instanceof Error ? error.message : String(error)}`,
                isLoading: false,
            });
        }
    },

    exportToYAML: () => {
        const { workflowName, workflowDescription, nodes, edges } = get();

        const workflowNodes = nodes
            .filter(n => n.id !== '__start__' && n.id !== '__end__')
            .map(n => ({
                id: n.id,
                name: n.data.label,
                agentId: n.data.agentId || 'developer',
                description: n.data.description,
            }));

        const workflowEdges = edges.map(e => ({
            from: e.source,
            to: e.target,
        }));

        const nodesYaml = workflowNodes.map(n =>
            `  - id: ${n.id}\n    name: ${n.name}\n    agentId: ${n.agentId}${n.description ? `\n    description: "${n.description}"` : ''}`
        ).join('\n');

        const edgesYaml = workflowEdges.map(e =>
            `  - from: ${e.from}\n    to: ${e.to}`
        ).join('\n');

        return `# Workflow gerado pelo Visual DAG Editor
id: workflow-${Date.now()}
name: ${workflowName}
description: ${workflowDescription || 'Workflow criado visualmente'}

config:
  maxConcurrency: 5
  timeout: 300000
  failFast: false

nodes:
${nodesYaml}

edges:
${edgesYaml}
`;
    },

    newWorkflow: () => {
        get().saveSnapshot();
        set({
            workflowId: null,
            workflowName: 'Novo Workflow',
            workflowDescription: '',
            nodes: [START_NODE, END_NODE],
            edges: [],
            lastSaved: null,
            error: null,
        });
    },
}));
