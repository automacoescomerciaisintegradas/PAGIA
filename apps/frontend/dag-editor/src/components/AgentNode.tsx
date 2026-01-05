import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

interface AgentNodeData {
    label: string;
    agentId?: string;
    description?: string;
    status?: 'idle' | 'running' | 'completed' | 'failed';
}

function AgentNode({ id, data, selected }: NodeProps) {
    const nodeData = data as unknown as AgentNodeData;
    const status = nodeData.status || 'idle';

    // Determine Node Type for Color Coding
    let typeClass = 'node-processor'; // Default (Yellow/Gold)
    if (id === '__start__') typeClass = 'node-source'; // Blue
    else if (id === '__end__') typeClass = 'node-output'; // Green

    return (
        <div className={`agent-node ${selected ? 'selected' : ''} ${status} ${typeClass}`}>
            <Handle
                type="target"
                position={Position.Top}
                className="handle"
                isConnectable={id !== '__start__'} // Start node has no input
            />

            <div className={`node-status-indicator ${status}`} />

            <div className="node-header">
                <span className="node-icon">
                    {id === '__start__' ? '🚀' : id === '__end__' ? '🏁' : '🤖'}
                </span>
                <span className="node-label">{nodeData.label}</span>
                {status === 'running' && <span className="running-spinner">↻</span>}
            </div>

            {nodeData.agentId && (
                <div className="node-agent">
                    <small>{nodeData.agentId}</small>
                </div>
            )}

            {nodeData.description && (
                <div className="node-description">
                    <small>{nodeData.description}</small>
                </div>
            )}

            <Handle
                type="source"
                position={Position.Bottom}
                className="handle"
            />
        </div>
    );
}

export default memo(AgentNode);
