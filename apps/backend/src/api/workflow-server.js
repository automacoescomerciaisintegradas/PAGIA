/**
 * PAGIA - Workflow API Server
 * API REST para gerenciamento de workflows
 *
 * @module api/workflow-server
 * @author Automações Comerciais Integradas
 */
import express from 'express';
import cors from 'cors';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, basename } from 'path';
import yaml from 'yaml';
import { validateWorkflow, topologicalSort } from '../agents/workflow-dag.js';
import { workflowEngine } from '../agents/workflow-engine.js';
import { agentRegistry } from '../agents/agent-registry.js';
import { eventBus, PAGIAEvents } from '../core/event-bus.js';
import { BaseAgent } from '../agents/base-agent.js';
const app = express();
// Middleware
app.use(cors());
app.use(express.json());
// Configuração
const WORKFLOWS_DIR = process.env.WORKFLOWS_DIR || join(process.cwd(), '.pagia', 'workflows');
const STATIC_DIR = join(process.cwd(), 'apps', 'backend', 'public', 'dag-editor');
// Garantir que o diretório existe
if (!existsSync(WORKFLOWS_DIR)) {
    mkdirSync(WORKFLOWS_DIR, { recursive: true });
}
// Servir frontend estático
if (existsSync(STATIC_DIR)) {
    app.use(express.static(STATIC_DIR));
    console.log(`📦 Servindo frontend de: ${STATIC_DIR}`);
}
else {
    console.warn(`⚠️ Frontend não encontrado em: ${STATIC_DIR}`);
    console.warn('   Execute "npm run build" em apps/frontend/dag-editor e copie para apps/backend/public/dag-editor');
}
// ============================================================================
// Agentes Padrão (Mock para Editor)
// ============================================================================
class GenericAgent extends BaseAgent {
    id;
    name;
    role;
    description;
    module;
    constructor(id, name, role, description, module = 'core') {
        super();
        this.id = id;
        this.name = name;
        this.role = role;
        this.description = description;
        this.module = module;
    }
    async execute(input) {
        // Simulação de execução
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.createOutput(`[${this.name}] Processado: ${input.prompt}`, 100, Date.now());
    }
}
function registerDefaultAgents() {
    if (agentRegistry.count() > 0)
        return;
    console.log('🤖 Registrando agentes padrão...');
    const agents = [
        new GenericAgent('analyst', 'Analyst', 'Analista de Negócios', 'Analisa requisitos e define escopo.', 'analysis'),
        new GenericAgent('architect', 'Architect', 'Arquiteto de Software', 'Define estrutura e tecnologias.', 'architecture'),
        new GenericAgent('coder', 'Coder', 'Engenheiro de Software', 'Implementa código e funcionalidades.', 'development'),
        new GenericAgent('reviewer', 'Reviewer', 'QA / Reviewer', 'Revisa código e garante qualidade.', 'qa'),
        new GenericAgent('devops', 'DevOps', 'Engenheiro DevOps', 'Configura CI/CD e infraestrutura.', 'operations'),
    ];
    agents.forEach(agent => agentRegistry.register(agent));
    console.log(`✅ ${agents.length} agentes registrados.`);
}
// Inicializar agentes
registerDefaultAgents();
// ============================================================================
// GET /api/workflows - Listar todos os workflows
// ============================================================================
app.get('/api/workflows', (req, res) => {
    try {
        const files = readdirSync(WORKFLOWS_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.json'));
        const workflows = files.map(file => {
            try {
                const content = readFileSync(join(WORKFLOWS_DIR, file), 'utf-8');
                const workflow = file.endsWith('.json')
                    ? JSON.parse(content)
                    : yaml.parse(content);
                const validation = validateWorkflow(workflow);
                return {
                    id: workflow.id || basename(file, '.yaml'),
                    name: workflow.name || file,
                    description: workflow.description || '',
                    nodes: workflow.nodes?.length || 0,
                    edges: workflow.edges?.length || 0,
                    valid: validation.valid,
                    errors: validation.errors,
                    file: file,
                    createdAt: workflow.createdAt,
                    updatedAt: workflow.updatedAt,
                };
            }
            catch (error) {
                return {
                    id: file,
                    name: file,
                    description: 'Erro ao carregar',
                    nodes: 0,
                    edges: 0,
                    valid: false,
                    errors: [{ code: 'PARSE_ERROR', message: String(error) }],
                    file: file,
                };
            }
        });
        res.json({ workflows, total: workflows.length });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao listar workflows', details: String(error) });
    }
});
// ============================================================================
// GET /api/workflows/:id - Obter workflow específico
// ============================================================================
app.get('/api/workflows/:id', (req, res) => {
    try {
        const { id } = req.params;
        const file = findWorkflowFile(id);
        if (!file) {
            return res.status(404).json({ error: 'Workflow não encontrado' });
        }
        const content = readFileSync(file, 'utf-8');
        const workflow = file.endsWith('.json')
            ? JSON.parse(content)
            : yaml.parse(content);
        const validation = validateWorkflow(workflow);
        const levels = validation.valid ? topologicalSort(workflow) : [];
        res.json({
            workflow,
            validation,
            levels,
            file: basename(file),
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao carregar workflow', details: String(error) });
    }
});
// ============================================================================
// POST /api/workflows - Criar novo workflow
// ============================================================================
app.post('/api/workflows', (req, res) => {
    try {
        const { workflow } = req.body;
        if (!workflow) {
            return res.status(400).json({ error: 'Workflow não fornecido' });
        }
        // Gerar ID se não existir
        if (!workflow.id) {
            workflow.id = `workflow-${Date.now()}`;
        }
        // Adicionar timestamps
        workflow.createdAt = new Date().toISOString();
        workflow.updatedAt = new Date().toISOString();
        // Validar
        const validation = validateWorkflow(workflow);
        if (!validation.valid) {
            return res.status(400).json({
                error: 'Workflow inválido',
                validation
            });
        }
        // Salvar como YAML
        const fileName = `${workflow.id}.yaml`;
        const filePath = join(WORKFLOWS_DIR, fileName);
        if (existsSync(filePath)) {
            return res.status(409).json({ error: 'Workflow já existe', id: workflow.id });
        }
        const yamlContent = yaml.stringify(workflow);
        writeFileSync(filePath, yamlContent, 'utf-8');
        res.status(201).json({
            message: 'Workflow criado com sucesso',
            id: workflow.id,
            file: fileName,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar workflow', details: String(error) });
    }
});
// ============================================================================
// PUT /api/workflows/:id - Atualizar workflow existente
// ============================================================================
app.put('/api/workflows/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { workflow } = req.body;
        if (!workflow) {
            return res.status(400).json({ error: 'Workflow não fornecido' });
        }
        const file = findWorkflowFile(id);
        if (!file) {
            return res.status(404).json({ error: 'Workflow não encontrado' });
        }
        // Manter ID original e atualizar timestamp
        workflow.id = id;
        workflow.updatedAt = new Date().toISOString();
        // Validar
        const validation = validateWorkflow(workflow);
        if (!validation.valid) {
            return res.status(400).json({
                error: 'Workflow inválido',
                validation
            });
        }
        // Salvar
        const yamlContent = yaml.stringify(workflow);
        writeFileSync(file, yamlContent, 'utf-8');
        res.json({
            message: 'Workflow atualizado com sucesso',
            id: workflow.id,
            file: basename(file),
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar workflow', details: String(error) });
    }
});
// ============================================================================
// DELETE /api/workflows/:id - Deletar workflow
// ============================================================================
app.delete('/api/workflows/:id', (req, res) => {
    try {
        const { id } = req.params;
        const file = findWorkflowFile(id);
        if (!file) {
            return res.status(404).json({ error: 'Workflow não encontrado' });
        }
        unlinkSync(file);
        res.json({
            message: 'Workflow deletado com sucesso',
            id,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao deletar workflow', details: String(error) });
    }
});
// ============================================================================
// POST /api/workflows/:id/validate - Validar workflow
// ============================================================================
app.post('/api/workflows/:id/validate', (req, res) => {
    try {
        const { id } = req.params;
        const file = findWorkflowFile(id);
        if (!file) {
            return res.status(404).json({ error: 'Workflow não encontrado' });
        }
        const content = readFileSync(file, 'utf-8');
        const workflow = file.endsWith('.json')
            ? JSON.parse(content)
            : yaml.parse(content);
        const validation = validateWorkflow(workflow);
        res.json(validation);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao validar workflow', details: String(error) });
    }
});
// ============================================================================
// POST /api/workflows/:id/run - Executar workflow
// ============================================================================
app.post('/api/workflows/:id/run', async (req, res) => {
    try {
        const { id } = req.params;
        const { input } = req.body;
        const file = findWorkflowFile(id);
        if (!file) {
            return res.status(404).json({ error: 'Workflow não encontrado' });
        }
        const content = readFileSync(file, 'utf-8');
        const workflow = file.endsWith('.json')
            ? JSON.parse(content)
            : yaml.parse(content);
        // Validar antes de executar
        const validation = validateWorkflow(workflow);
        if (!validation.valid) {
            return res.status(400).json({
                error: 'Workflow inválido',
                validation
            });
        }
        // Executar workflow
        const result = await workflowEngine.execute(workflow, {
            prompt: input?.prompt || '',
            context: input?.context || {},
        });
        res.json({
            status: result.status,
            output: result.output,
            metrics: result.metrics,
            nodeResults: Array.from(result.nodeResults.entries()),
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao executar workflow', details: String(error) });
    }
});
// ============================================================================
// GET /api/agents - Listar agentes disponíveis
// ============================================================================
app.get('/api/agents', (req, res) => {
    try {
        const agents = agentRegistry.list().map(agent => ({
            id: agent.id,
            name: agent.name,
            role: agent.role,
            description: agent.description,
            capabilities: agent.capabilities || [],
        }));
        res.json({ agents, total: agents.length });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao listar agentes', details: String(error) });
    }
});
// ============================================================================
// WebSocket events (para acompanhamento em tempo real)
// ============================================================================
let clients = [];
app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    clients.push(res);
    req.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
});
// Emitir eventos de workflow
eventBus.on(PAGIAEvents.WORKFLOW_STARTED, (data) => {
    broadcast('workflow:started', data);
});
eventBus.on(PAGIAEvents.WORKFLOW_NODE_STARTED, (data) => {
    broadcast('workflow:node:started', data);
});
eventBus.on(PAGIAEvents.WORKFLOW_NODE_COMPLETED, (data) => {
    broadcast('workflow:node:completed', data);
});
eventBus.on(PAGIAEvents.WORKFLOW_COMPLETED, (data) => {
    broadcast('workflow:completed', data);
});
function broadcast(event, data) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    clients.forEach(client => {
        client.write(message);
    });
}
// ============================================================================
// Helper Functions
// ============================================================================
function findWorkflowFile(id) {
    const extensions = ['.yaml', '.yml', '.json'];
    for (const ext of extensions) {
        const filePath = join(WORKFLOWS_DIR, id + ext);
        if (existsSync(filePath)) {
            return filePath;
        }
    }
    // Tentar encontrar por nome exato
    if (existsSync(join(WORKFLOWS_DIR, id))) {
        return join(WORKFLOWS_DIR, id);
    }
    return null;
}
// ============================================================================
// Exportar app e função de start
// ============================================================================
export function startWorkflowServer(port = 3001) {
    return new Promise((resolve) => {
        app.listen(port, () => {
            console.log(`\n🚀 PAGIA Workflow API Server`);
            console.log(`   ├── URL: http://localhost:${port}`);
            console.log(`   ├── Workflows: ${WORKFLOWS_DIR}`);
            console.log(`   └── Endpoints:`);
            console.log(`       ├── GET    /api/workflows`);
            console.log(`       ├── GET    /api/workflows/:id`);
            console.log(`       ├── POST   /api/workflows`);
            console.log(`       ├── PUT    /api/workflows/:id`);
            console.log(`       ├── DELETE /api/workflows/:id`);
            console.log(`       ├── POST   /api/workflows/:id/validate`);
            console.log(`       ├── POST   /api/workflows/:id/run`);
            console.log(`       ├── GET    /api/agents`);
            console.log(`       └── GET    /api/events (SSE)`);
            console.log(`\n`);
            resolve();
        });
    });
}
export { app };
//# sourceMappingURL=workflow-server.js.map