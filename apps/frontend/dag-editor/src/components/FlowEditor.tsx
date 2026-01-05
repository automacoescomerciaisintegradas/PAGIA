import { useCallback, useEffect, useState } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

import { useWorkflowStore } from '../store/workflowStore';
import AgentNode from './AgentNode';
import ControlPanel from './ControlPanel';
import ValidationStatus from './ValidationStatus';
import NodeProperties from './NodeProperties';
import DebugPanel from './DebugPanel';

const nodeTypes = {
    agentNode: AgentNode,
};

// Dagre layout configuration
const getLayoutedElements = (nodes: any[], edges: any[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 150, height: 60 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - 75,
                y: nodeWithPosition.y - 30,
            },
        };
    });
};

export default function FlowEditor() {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        setNodes,
        theme,
        removeNode,
        saveSnapshot,
        undo,
        redo,
    } = useWorkflowStore();

    const { fitView } = useReactFlow();
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'properties' | 'debug' | 'json'>('properties');

    const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
        setSelectedNodeId(node.id);
        setActiveTab('properties');
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
    }, []);

    // Auto-layout function
    const onLayout = useCallback(() => {
        saveSnapshot();
        const layoutedNodes = getLayoutedElements(nodes, edges);
        setNodes(layoutedNodes);
        setTimeout(() => fitView({ padding: 0.2 }), 50);
    }, [nodes, edges, setNodes, fitView, saveSnapshot]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Z for undo
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                undo();
            }
            // Ctrl+Y for redo
            if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                redo();
            }
            // Ctrl+L for auto-layout
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                onLayout();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, onLayout]);

    // Handle node deletion
    const onNodesDelete = useCallback((deletedNodes: any[]) => {
        deletedNodes.forEach(node => {
            if (node.id !== '__start__' && node.id !== '__end__') {
                removeNode(node.id);
            }
        });
    }, [removeNode]);

    return (
        <div className={`flow-container ${theme}`}>
            <div className="sidebar left">
                <ControlPanel />
            </div>

            <div className="main-canvas">
                <div className="toolbar">
                    <h1>🔀 PAGIA DAG Editor</h1>
                    <button onClick={onLayout} className="layout-btn">
                        📐 Auto Layout
                    </button>
                </div>

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodesDelete={onNodesDelete}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    fitView
                    className={theme}
                    deleteKeyCode={['Backspace', 'Delete']}
                    snapToGrid
                    snapGrid={[15, 15]}
                >
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={20}
                        size={1}
                        color={theme === 'dark' ? '#555' : '#ccc'}
                    />
                    <Controls />
                    <MiniMap
                        nodeColor={(node: any) => {
                            if (node.id === '__start__') return '#22c55e';
                            if (node.id === '__end__') return '#ef4444';

                            const status = node.data?.status;
                            if (status === 'running') return '#3b82f6';
                            if (status === 'completed') return '#22c55e';
                            if (status === 'failed') return '#ef4444';

                            return theme === 'dark' ? '#475569' : '#cbd5e1';
                        }}
                        maskColor={theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)'}
                    />
                </ReactFlow>
            </div>

            <div className="sidebar right">
                <div className="sidebar-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
                        onClick={() => setActiveTab('properties')}
                        title="Propriedades e Validação"
                    >
                        ⚙️ Props
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'debug' ? 'active' : ''}`}
                        onClick={() => setActiveTab('debug')}
                        title="Console de Debug"
                    >
                        🐛 Debug
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'json' ? 'active' : ''}`}
                        onClick={() => setActiveTab('json')}
                        title="Preview da Estrutura JSON"
                    >
                        { } JSON
                    </button>
                </div>

                <div className="sidebar-content">
                    {activeTab === 'properties' && (
                        selectedNodeId ? (
                            <NodeProperties
                                selectedNodeId={selectedNodeId}
                                onClose={() => setSelectedNodeId(null)}
                            />
                        ) : (
                            <ValidationStatus />
                        )
                    )}
                    {activeTab === 'debug' && <DebugPanel />}
                    {activeTab === 'json' && (
                        <div className="json-preview" style={{ padding: '1rem', overflow: 'auto', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            <pre>{JSON.stringify({ nodes: nodes.map(({ id, type, data, position }) => ({ id, type, data, position })), edges }, null, 2)}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
