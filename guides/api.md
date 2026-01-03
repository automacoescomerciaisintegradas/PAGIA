---
layout: default
title: API Reference
---

# 📚 API Reference

Referência da API programática do PAGIA.

---

## Core

### AI Service

```typescript
import { createAIService, AIMessage } from 'pagia/core';

const ai = createAIService({
  type: 'gemini',
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-2.0-flash-exp',
});

// Chat
const response = await ai.chat([
  { role: 'user', content: 'Olá!' }
]);

// Generate
const result = await ai.generate('Crie uma função', 'Você é um dev');
```

### Config Manager

```typescript
import { getConfigManager } from 'pagia/core';

const config = getConfigManager();

// Verificar se inicializado
if (config.isInitialized()) {
  // Carregar configuração
  const cfg = config.load();
  
  // Obter valor
  const provider = config.get('ai.provider');
  
  // Definir valor
  await config.set('ai.model', 'gpt-4o');
}
```

### Event Bus

```typescript
import { eventBus, PAGIAEvents } from 'pagia/core';

// Escutar evento
eventBus.on(PAGIAEvents.AGENT_STARTED, (data) => {
  console.log('Agente iniciado:', data);
});

// Emitir evento
await eventBus.emit(PAGIAEvents.CUSTOM, { myData: 'value' });
```

---

## Agents

### Base Agent

```typescript
import { BaseAgent, AgentInput, AgentOutput } from 'pagia/agents';

class CustomAgent extends BaseAgent {
  readonly name = 'Custom Agent';
  readonly role = 'Custom role';
  readonly description = 'Description';
  readonly module = 'custom';

  capabilities = ['capability1'];

  async execute(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    const response = await this.callAI(input.prompt);
    return this.createOutput(response.content, response.tokensUsed, startTime);
  }
}
```

### Agent Registry

```typescript
import { agentRegistry } from 'pagia/agents';

// Registrar
await agentRegistry.register(agent, ['tag1', 'tag2']);

// Listar
const agents = agentRegistry.list();

// Buscar
const found = agentRegistry.findByCapabilities(['tdd']);

// Executar
const result = await agentRegistry.execute('agent-id', {
  prompt: 'Fazer algo',
});
```

### Agent Composer

```typescript
import { agentComposer } from 'pagia/agents';

// Pipeline
const pipeline = agentComposer.createPipeline('my-pipeline', [
  agent1,
  agent2,
]);

// Ensemble
const ensemble = agentComposer.createEnsemble('my-ensemble', [
  agent1, agent2, agent3,
]);

// Executar
const result = await pipeline.execute({ prompt: 'Input' });
```

---

## Knowledge

### Knowledge Base

```typescript
import { createKnowledgeBase } from 'pagia/knowledge';

const kb = createKnowledgeBase('.pagia/knowledge');

// Adicionar documento
await kb.add('Conteúdo do documento', {
  title: 'Título',
  source: 'origem.md',
  metadata: { tags: ['tag1'] },
});

// Adicionar arquivo
await kb.addFile('./docs/readme.md');

// Adicionar diretório
await kb.addDirectory('./docs', { recursive: true });

// Buscar
const results = await kb.search('query', {
  limit: 5,
  threshold: 0.3,
});

// Obter contexto para prompt
const context = await kb.getContext('query', 4000);
```

### Embeddings

```typescript
import { embeddingsService } from 'pagia/knowledge';

// Gerar embedding
const embedding = await embeddingsService.embed('texto');

// Batch
const embeddings = await embeddingsService.embedBatch(['texto1', 'texto2']);

// Similaridade
const similarity = embeddingsService.cosineSimilarity(emb1, emb2);
```

---

## Bundler

### Web Bundler

```typescript
import { webBundler } from 'pagia/bundler';

// Criar bundle
const bundle = await webBundler.bundle(agents, 'chatgpt', {
  name: 'Meu Bundle',
  version: '1.0.0',
});

// Validar
const validation = webBundler.validate(bundle);

// Exportar
await webBundler.export(bundle, './output/bundle.md');
```

---

## MCP

### MCP Server

```typescript
import { mcpServer } from 'pagia/mcp';

// Iniciar
await mcpServer.start(3100);

// Registrar ferramenta
mcpServer.registerTool({
  name: 'minha-ferramenta',
  description: 'Descrição',
  inputSchema: { type: 'object' },
  handler: async (params) => {
    return { resultado: 'ok' };
  },
});

// Parar
await mcpServer.stop();
```

---

## Workflows

### Workflow Engine

```typescript
import { workflowEngine, createWorkflow, createStep } from 'pagia/workflows';

// Criar workflow
const workflow = createWorkflow('meu-workflow', 'Meu Workflow', [
  createStep('step1', 'Passo 1', async (ctx) => {
    return { data: 'resultado' };
  }),
  createStep('step2', 'Passo 2', async (ctx) => {
    const prev = ctx.output['step1'];
    return { data: prev };
  }, { retries: 3 }),
]);

// Registrar
workflowEngine.register(workflow);

// Executar
const result = await workflowEngine.execute('meu-workflow', {
  input: 'dados',
});
```

---

## Registry

### Module Registry

```typescript
import { moduleRegistry } from 'pagia/registry';

// Configurar
moduleRegistry.setModulesPath('.pagia/modules');

// Buscar
const modules = await moduleRegistry.search('keyword');

// Instalar
const installed = await moduleRegistry.install('module-name');

// Listar instalados
const list = moduleRegistry.listInstalled();

// Validar
const validation = moduleRegistry.validate('./path/to/module');

// Criar scaffold
const path = await moduleRegistry.scaffold('novo-modulo', 'agent', './');
```

---

## Utils

### Logger

```typescript
import { logger } from 'pagia/utils';

logger.info('Mensagem informativa');
logger.success('Sucesso!');
logger.warn('Aviso');
logger.error('Erro');

const spinner = logger.spin('Carregando...');
spinner.succeed('Concluído');

logger.box('Conteúdo', { title: 'Título' });
logger.keyValue('Chave', 'Valor');
```

### File Utils

```typescript
import { readFile, writeFile, ensureDir, listFiles } from 'pagia/utils';

// Ler arquivo
const content = readFile('./file.txt');

// Escrever arquivo
writeFile('./output.txt', 'conteúdo');

// Garantir diretório
ensureDir('./path/to/dir');

// Listar arquivos
const files = listFiles('./src', { 
  extensions: ['ts', 'js'],
  recursive: true,
});
```

---

## Tipos

```typescript
import type {
  PAGIAConfig,
  AIProvider,
  AgentInput,
  AgentOutput,
  PlanModule,
  TaskStatus,
} from 'pagia/types';
```

---

[← Voltar](index.md)
