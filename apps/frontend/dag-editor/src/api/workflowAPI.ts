/**
 * PAGIA DAG Editor - API Client
 * Cliente para comunicação com o backend
 */

// Em desenvolvimento (Vite), o proxy redireciona /api para localhost:3001
// Em produção (Express), o backend serve o frontend na mesma porta
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface WorkflowSummary {
    id: string;
    name: string;
    description: string;
    nodes: number;
    edges: number;
    valid: boolean;
    errors: Array<{ code: string; message: string }>;
    file: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AgentInfo {
    id: string;
    name: string;
    role: string;
    description: string;
    capabilities: string[];
}

export interface WorkflowDefinition {
    id: string;
    name: string;
    description?: string;
    config: {
        maxConcurrency?: number;
        timeout?: number;
        failFast?: boolean;
    };
    nodes: Array<{
        id: string;
        name: string;
        agentId: string;
        description?: string;
    }>;
    edges: Array<{
        from: string;
        to: string;
    }>;
    createdAt?: string;
    updatedAt?: string;
}

class WorkflowAPI {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    async listWorkflows(): Promise<{ workflows: WorkflowSummary[]; total: number }> {
        const res = await fetch(`${this.baseUrl}/api/workflows`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    async getWorkflow(id: string): Promise<{
        workflow: WorkflowDefinition;
        validation: { valid: boolean; errors: Array<{ code: string; message: string }> };
        file: string;
    }> {
        const res = await fetch(`${this.baseUrl}/api/workflows/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    async createWorkflow(workflow: WorkflowDefinition): Promise<{ id: string; file: string }> {
        const res = await fetch(`${this.baseUrl}/api/workflows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workflow }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || `HTTP ${res.status}`);
        }
        return res.json();
    }

    async updateWorkflow(id: string, workflow: WorkflowDefinition): Promise<{ id: string; file: string }> {
        const res = await fetch(`${this.baseUrl}/api/workflows/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workflow }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || `HTTP ${res.status}`);
        }
        return res.json();
    }

    async deleteWorkflow(id: string): Promise<void> {
        const res = await fetch(`${this.baseUrl}/api/workflows/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }

    async validateWorkflow(id: string): Promise<{
        valid: boolean;
        errors: Array<{ code: string; message: string }>;
        warnings: Array<{ code: string; message: string }>;
    }> {
        const res = await fetch(`${this.baseUrl}/api/workflows/${encodeURIComponent(id)}/validate`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    async runWorkflow(id: string, input?: { prompt?: string; context?: Record<string, unknown> }): Promise<{
        status: string;
        output?: unknown;
        metrics: Record<string, unknown>;
    }> {
        const res = await fetch(`${this.baseUrl}/api/workflows/${encodeURIComponent(id)}/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || `HTTP ${res.status}`);
        }
        return res.json();
    }

    async listAgents(): Promise<{ agents: AgentInfo[]; total: number }> {
        const res = await fetch(`${this.baseUrl}/api/agents`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    // Server-Sent Events for real-time updates
    subscribeToEvents(onEvent: (event: string, data: unknown) => void): () => void {
        const eventSource = new EventSource(`${this.baseUrl}/api/events`);

        eventSource.addEventListener('workflow:started', (e) => {
            onEvent('workflow:started', JSON.parse(e.data));
        });

        eventSource.addEventListener('workflow:node:started', (e) => {
            onEvent('workflow:node:started', JSON.parse(e.data));
        });

        eventSource.addEventListener('workflow:node:completed', (e) => {
            onEvent('workflow:node:completed', JSON.parse(e.data));
        });

        eventSource.addEventListener('workflow:completed', (e) => {
            onEvent('workflow:completed', JSON.parse(e.data));
        });

        // Return cleanup function
        return () => eventSource.close();
    }
}

export const workflowAPI = new WorkflowAPI();
export default workflowAPI;
