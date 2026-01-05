import { useEffect, useState, useRef } from 'react';
import { useWorkflowStore } from '../store/workflowStore';

interface LogEvent {
    id: string;
    timestamp: string;
    type: string;
    payload: any;
}

export default function DebugPanel() {
    const [events, setEvents] = useState<LogEvent[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);
    const { theme, updateNodeStatus } = useWorkflowStore();

    useEffect(() => {
        const eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
            console.log('SSE Connected to /api/events');
            addSystemEvent('Conectado ao servidor de eventos.');
        };

        eventSource.onmessage = (e) => {
            if (isPaused) return;

            try {
                const data = JSON.parse(e.data);
                addEvent(data);

                // Update Visual Graph based on events
                if (data.type === 'workflow:node:started' && data.payload?.nodeId) {
                    updateNodeStatus(data.payload.nodeId, 'running');
                } else if (data.type === 'workflow:node:completed' && data.payload?.nodeId) {
                    updateNodeStatus(data.payload.nodeId, 'completed');
                } else if (data.type === 'workflow:node:failed' && data.payload?.nodeId) {
                    updateNodeStatus(data.payload.nodeId, 'failed');
                } else if (data.type === 'workflow:started') {
                    // Reset all nodes to idle
                    // This is inefficient to do one by one here, but works for now. 
                    // Better would be a 'resetStatuses' action.
                    // For now, let's assume the user reloaded or started fresh.
                }

            } catch (err) {
                console.error('Error parsing SSE data', err);
            }
        };

        eventSource.onerror = (e) => {
            console.error('SSE Error', e);
            // EventSource tenta reconectar automaticamente, mas podemos avisar
            // addSystemEvent('Erro na conexão SSE. Tentando reconectar...');
            // eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-scroll
    useEffect(() => {
        if (!isPaused && endRef.current) {
            endRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [events, isPaused]);

    const addSystemEvent = (msg: string) => {
        addEvent({
            type: 'SYSTEM',
            payload: { message: msg },
            timestamp: new Date().toISOString()
        });
    };

    const addEvent = (data: any) => {
        setEvents(prev => [...prev.slice(-99), { // Manter últimos 100
            id: Date.now().toString() + Math.random(),
            timestamp: data.timestamp || new Date().toISOString(),
            type: data.type || 'UNKNOWN',
            payload: data.payload || data
        }]);
    };

    const clearLogs = () => setEvents([]);

    return (
        <div className={`debug-panel ${theme}`}>
            <div className="debug-header">
                <h3>🐛 Debug / Logs</h3>
                <div className="debug-controls">
                    <button onClick={() => setIsPaused(!isPaused)} title={isPaused ? "Retomar" : "Pausar"}>
                        {isPaused ? '▶️' : '⏸️'}
                    </button>
                    <button onClick={clearLogs} title="Limpar Logs">
                        🗑️
                    </button>
                </div>
            </div>

            <div className="debug-content">
                {events.length === 0 && (
                    <div className="empty-state">
                        Nenhum evento registrado.
                        <br />
                        <small>Execute o workflow para ver logs em tempo real.</small>
                    </div>
                )}
                {events.map(event => (
                    <div key={event.id} className={`log-item ${event.type.toLowerCase()}`}>
                        <div className="log-meta">
                            <span className="log-time">
                                {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="log-type">{event.type}</span>
                        </div>
                        <div className="log-payload">
                            {typeof event.payload === 'string'
                                ? event.payload
                                : <pre>{JSON.stringify(event.payload, null, 2)}</pre>
                            }
                        </div>
                    </div>
                ))}
                <div ref={endRef} />
            </div>
        </div>
    );
}
