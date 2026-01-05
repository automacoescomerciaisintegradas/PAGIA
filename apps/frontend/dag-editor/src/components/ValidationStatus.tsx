import { useWorkflowStore } from '../store/workflowStore';

export default function ValidationStatus() {
    const {
        isValid,
        validationErrors,
        nodes,
        edges,
        exportToYAML,
        theme,
        workflowName
    } = useWorkflowStore();

    const nodeCount = nodes.length - 2;
    const edgeCount = edges.length;

    return (
        <div className={`validation-panel ${theme}`}>
            <div className="status-header">
                <div>
                    <h3>Status do DAG</h3>
                    <small style={{ opacity: 0.7 }}>{workflowName}</small>
                </div>
                <span className={`status-badge ${isValid ? 'valid' : 'invalid'}`}>
                    {isValid ? '✅ Válido' : '❌ Inválido'}
                </span>
            </div>

            <div className="stats">
                <div className="stat">
                    <span className="stat-value">{nodeCount}</span>
                    <span className="stat-label">Tarefas</span>
                </div>
                <div className="stat">
                    <span className="stat-value">{edgeCount}</span>
                    <span className="stat-label">Conexões</span>
                </div>
            </div>

            {validationErrors.length > 0 && (
                <div className="errors-box">
                    <h4>⚠️ Erros Encontrados</h4>
                    <ul>
                        {validationErrors.map((error: string, index: number) => (
                            <li key={index} className="error-item">
                                {error}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className={`json-preview ${validationErrors.length > 0 ? 'has-errors' : ''}`}>
                <h4>📄 YAML Preview</h4>
                <pre>
                    {exportToYAML()}
                </pre>
            </div>
        </div>
    );
}


