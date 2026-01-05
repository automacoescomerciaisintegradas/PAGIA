import { useEffect, useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import type { AgentNode } from '../store/workflowStore';
import workflowAPI from '../api/workflowAPI';

interface NodePropertiesProps {
    selectedNodeId: string | null;
    onClose: () => void;
}

export default function NodeProperties({ selectedNodeId, onClose }: NodePropertiesProps) {
    const { nodes, availableAgents, updateNodeData, theme } = useWorkflowStore();
    const [selectedNode, setSelectedNode] = useState<AgentNode | null>(null);

    // Update local state when selection changes or nodes change
    useEffect(() => {
        if (!selectedNodeId) {
            setSelectedNode(null);
            return;
        }
        const node = nodes.find(n => n.id === selectedNodeId);
        setSelectedNode(node || null);
    }, [selectedNodeId, nodes]);

    if (!selectedNode) {
        return (
            <div className={`node-properties empty ${theme}`}>
                <p>Selecione um nodo para editar suas propriedades.</p>
            </div>
        );
    }

    // Special handling for start/end nodes
    if (selectedNode.id === '__start__' || selectedNode.id === '__end__') {
        const handleRun = async () => {
            const { workflowId } = useWorkflowStore.getState();
            if (!workflowId) return;
            try {
                // Usando a API padronizada
                await workflowAPI.runWorkflow(workflowId);
                alert('Execução iniciada! Acompanhe na aba Debug 🐛');
            } catch (e: any) {
                alert('Erro ao iniciar execução: ' + (e.message || e));
            }
        };

        return (
            <div className={`node-properties ${theme}`}>
                <div className="header">
                    <h3>⚙️ Propriedades</h3>
                    <button onClick={onClose}>✖</button>
                </div>
                <div className="info-box">
                    <p><strong>{selectedNode.data.label}</strong></p>
                    <p>{selectedNode.data.description}</p>

                    {selectedNode.id === '__start__' && (
                        <button
                            onClick={handleRun}
                            className="primary-btn"
                            style={{ marginTop: '1rem', width: '100%', padding: '1rem', fontSize: '1rem' }}
                        >
                            ▶️ Executar Workflow
                        </button>
                    )}

                    <p className="dimmed" style={{ marginTop: '1rem' }}>
                        Este nodo é gerenciado pelo sistema.
                    </p>
                </div>
            </div>
        );
    }

    const handleChange = (field: string, value: string) => {
        updateNodeData(selectedNode.id, { [field]: value });
    };

    return (
        <div className={`node-properties ${theme}`}>
            <div className="header">
                <h3>⚙️ Propriedades do Nodo</h3>
                <button onClick={onClose} title="Fechar">✖</button>
            </div>

            <div className="form-group">
                <label>Nome / Rótulo</label>
                <input
                    type="text"
                    value={selectedNode.data.label}
                    onChange={(e) => handleChange('label', e.target.value)}
                    placeholder="Nome da etapa"
                />
            </div>

            <div className="form-group">
                <label>Agente Responsável</label>
                <select
                    value={selectedNode.data.agentId || ''}
                    onChange={(e) => handleChange('agentId', e.target.value)}
                >
                    {availableAgents.map(agent => (
                        <option key={agent.id} value={agent.id}>
                            {agent.name} ({agent.role})
                        </option>
                    ))}
                    {!selectedNode.data.agentId && <option value="">Selecione...</option>}
                </select>
                <small className="hint">
                    {availableAgents.find(a => a.id === selectedNode.data.agentId)?.description}
                </small>
            </div>

            <div className="form-group full-height">
                <label>Prompt / Instruções</label>
                <textarea
                    value={selectedNode.data.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Descreva o que este agente deve fazer nesta etapa..."
                    rows={10}
                />
                <small className="hint">
                    Estas instruções serão passadas ao agente durante a execução.
                </small>
            </div>

            <div className="metadata">
                <p>ID: {selectedNode.id}</p>
                <p>Tipo: {selectedNode.type}</p>
            </div>
        </div>
    );
}
