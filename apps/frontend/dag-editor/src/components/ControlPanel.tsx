import { useCallback, useEffect, useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import type { AgentNode } from '../store/workflowStore';

export default function ControlPanel() {
    const {
        // Actions
        addNode,
        undo,
        redo,
        toggleTheme,
        clear,
        exportToYAML,

        // Metadata & API
        workflowId,
        workflowName,
        workflowDescription,
        setWorkflowName,
        setWorkflowDescription,
        fetchWorkflows,
        loadWorkflow,
        saveWorkflow,
        deleteWorkflow,
        newWorkflow,
        availableWorkflows,
        availableAgents,
        fetchAgents,

        // State
        nodes,
        undoStack,
        redoStack,
        theme,
        isValid,
        isLoading,
        isSaving,
        lastSaved,
        error,
        setError,
    } = useWorkflowStore();

    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');

    // Fetch initial data
    useEffect(() => {
        fetchWorkflows();
        fetchAgents();
    }, [fetchWorkflows, fetchAgents]);

    useEffect(() => {
        if (workflowId) {
            setSelectedWorkflowId(workflowId);
        } else {
            setSelectedWorkflowId('');
        }
    }, [workflowId]);

    const handleAddNode = useCallback((agentId: string, agentName: string) => {
        const nodeCount = nodes.length - 2; // Exclude start/end
        const newNode: AgentNode = {
            id: `${agentId}-${Date.now()}`,
            type: 'agentNode',
            position: {
                x: 100 + (nodeCount % 3) * 180,
                y: 100 + Math.floor(nodeCount / 3) * 120
            },
            data: {
                label: agentName,
                agentId: agentId,
            },
        };
        addNode(newNode);
    }, [addNode, nodes.length]);

    const handleLoadWorkflow = useCallback(async (id: string) => {
        if (!id) return;
        if (confirm('Carregar outro workflow? Alterações não salvas serão perdidas.')) {
            await loadWorkflow(id);
        }
    }, [loadWorkflow]);

    const handleSave = useCallback(async () => {
        await saveWorkflow();
    }, [saveWorkflow]);

    const handleDelete = useCallback(async () => {
        if (!workflowId) return;
        if (confirm('Tem certeza que deseja deletar este workflow?')) {
            await deleteWorkflow(workflowId);
        }
    }, [workflowId, deleteWorkflow]);

    const handleNew = useCallback(() => {
        if (confirm('Criar novo workflow? Alterações não salvas serão perdidas.')) {
            newWorkflow();
            setSelectedWorkflowId('');
        }
    }, [newWorkflow]);

    const handleExport = useCallback(() => {
        const yaml = exportToYAML();
        const blob = new Blob([yaml], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${workflowName.toLowerCase().replace(/\s+/g, '-')}.yaml`;
        a.click();
        URL.revokeObjectURL(url);
    }, [exportToYAML, workflowName]);

    return (
        <div className={`control-panel ${theme}`}>
            {error && (
                <div className="error-banner">
                    {error}
                    <button onClick={() => setError(null)}>✖</button>
                </div>
            )}

            <div className="panel-section">
                <h3>📂 Workflow</h3>

                <div className="form-group">
                    <select
                        value={selectedWorkflowId}
                        onChange={(e) => handleLoadWorkflow(e.target.value)}
                        disabled={isLoading}
                        className="workflow-select"
                    >
                        <option value="">-- Novo / Não Salvo --</option>
                        {availableWorkflows.map(w => (
                            <option key={w.id} value={w.id}>
                                {w.name} {w.valid ? '' : '(Inválido)'}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="action-buttons">
                    <button onClick={handleNew} disabled={isLoading} title="Criar Novo">
                        🆕 Novo
                    </button>
                    <button onClick={() => fetchWorkflows()} disabled={isLoading} title="Recarregar Lista">
                        🔄 Atualizar
                    </button>
                </div>
            </div>

            <div className="panel-section">
                <h3>📝 Metadados</h3>
                <div className="form-group">
                    <label>Nome:</label>
                    <input
                        type="text"
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                        placeholder="Nome do Workflow"
                    />
                </div>
                <div className="form-group">
                    <label>Descrição:</label>
                    <textarea
                        value={workflowDescription}
                        onChange={(e) => setWorkflowDescription(e.target.value)}
                        placeholder="Descrição opcional..."
                        rows={2}
                    />
                </div>

                <div className="workflow-actions">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !isValid}
                        className="deploy-btn"
                        title="Salvar e ativar workflow"
                    >
                        {isSaving ? '🚀 Deploying...' : '🚀 Deploy'}
                    </button>

                    {workflowId && (
                        <button
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="danger-btn"
                        >
                            🗑️ Deletar
                        </button>
                    )}
                </div>

                {lastSaved && (
                    <div className="last-saved">
                        Salvo em: {new Date(lastSaved).toLocaleTimeString()}
                    </div>
                )}
            </div>

            <div className="panel-section">
                <h3>🎨 Paleta</h3>

                <h4 className="palette-header">⚡ Triggers</h4>
                <div className="agent-buttons">
                    <button className="agent-btn trigger disabled" title="Em breve">
                        <span className="icon">⚡</span> Webhook
                    </button>
                    <button className="agent-btn trigger disabled" title="Em breve">
                        <span className="icon">📅</span> Schedule
                    </button>
                    <button className="agent-btn trigger disabled" title="Em breve">
                        <span className="icon">📩</span> Event
                    </button>
                </div>

                <h4 className="palette-header">🤖 Agentes</h4>
                <div className="agent-buttons">
                    {availableAgents.length > 0 ? availableAgents.map(agent => (
                        <button
                            key={agent.id}
                            onClick={() => handleAddNode(agent.id, agent.name)}
                            className="agent-btn agent"
                            title={agent.description}
                        >
                            <span className="icon">👤</span>
                            {agent.name}
                        </button>
                    )) : (
                        <div className="loading-agents">
                            {isLoading ? 'Carregando agentes...' : 'Nenhum agente encontrado.'}
                        </div>
                    )}
                </div>

                <h4 className="palette-header">🛠️ Ferramentas</h4>
                <div className="agent-buttons">
                    <button className="agent-btn tool disabled" title="Em breve">
                        <span className="icon">🔧</span> Script
                    </button>
                    <button className="agent-btn tool disabled" title="Em breve">
                        <span className="icon">🔌</span> HTTP
                    </button>
                </div>
            </div>

            <div className="panel-section">
                <h3>🎛️ Editor</h3>
                <div className="action-buttons">
                    <button onClick={undo} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)">
                        ↩️ Undo
                    </button>
                    <button onClick={redo} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)">
                        ↪️ Redo
                    </button>
                    <button onClick={clear} className="danger-btn" title="Limpar Canvas">
                        🗑️ Limpar
                    </button>
                </div>
            </div>

            <div className="panel-section">
                <h3>💾 Local</h3>
                <button onClick={handleExport} disabled={!isValid} className="export-btn">
                    📥 Download YAML
                </button>
            </div>

            <div className="panel-section">
                <button onClick={toggleTheme} className="theme-btn">
                    {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
                </button>
            </div>
        </div>
    );
}
