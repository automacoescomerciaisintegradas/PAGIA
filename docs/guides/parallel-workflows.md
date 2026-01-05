# Guia de Workflows Paralelos

Este guia explica como usar o sistema de workflows paralelos do PAGIA para orquestrar múltiplos agentes de forma eficiente.

## Visão Geral

O sistema de workflows permite definir **grafos acíclicos direcionados (DAG)** onde:
- Agentes independentes executam em **paralelo**
- Agentes dependentes aguardam suas dependências
- Resultados são **agregados** automaticamente

```
          ┌───────┐
          │ START │
          └───┬───┘
       ┌──────┴──────┐
       ▼             ▼
   ┌───────┐     ┌───────┐
   │Agent A│     │Agent B│   ← Executam em paralelo
   └───┬───┘     └───┬───┘
       └──────┬──────┘
              ▼
          ┌───────┐
          │Agent C│   ← Aguarda A e B
          └───┬───┘
              ▼
          ┌─────┐
          │ END │
          └─────┘
```

## Editor Visual (Novo!)

O PAGIA agora inclui um poderoso editor visual baseado em DAGs para facilitar a criação de workflows complexos sem precisar editar arquivos YAML manualmente.

### Funcionalidades
- **Interface Arrastar e Soltar**: Adicione e conecte agentes visualmente.
- **Validação em Tempo Real**: Detecte ciclos e conexões inválidas instantaneamente.
- **Auto-Layout**: Organize seu grafo automaticamente com um clique.
- **Gerenciamento Completo**: Crie, salve, carregue e delete workflows diretamente do navegador.
- **Preview YAML**: Veja o código gerado em tempo real.

### Como Usar

Para iniciar o editor, basta rodar o comando:

```bash
pagia workflow editor
```

Isso iniciará o servidor local e abrirá o editor no seu navegador padrão (geralmente em `http://localhost:3001`).

![DAG Editor](https://placeholder-image-url.com/dag-editor-preview)

1. **Adicionar Nodos**: Clique nos botões dos agentes na barra lateral esquerda.
2. **Conectar**: Arraste da alça inferior de um nodo para a alça superior de outro.
3. **Configurar**: Edite o nome e descrição do workflow no painel esquerdo.
4. **Salvar**: Clique em "Salvar no Servidor" para persistir o workflow.

---

## Comandos CLI

Além do editor visual, você pode gerenciar workflows via terminal:

### Listar Workflows
```bash
pagia workflow list
```
pagia workflow validate my-workflow
```

### Visualizar Estrutura

```bash
pagia workflow visualize my-workflow
```

### Executar Workflow

```bash
# Execução simples
pagia workflow run my-workflow

# Com input customizado
pagia workflow run my-workflow --input '{"prompt": "Analisar código"}'

# Com acompanhamento em tempo real
pagia workflow run my-workflow --watch

# Com detalhes completos
pagia workflow run my-workflow --verbose
```

## Formato de Definição (YAML)

```yaml
# workflow.yaml
id: my-workflow
name: Meu Workflow
description: Descrição do workflow

config:
  maxConcurrency: 5      # Máximo de agentes simultâneos (1-20)
  timeout: 300000        # Timeout em ms (5 minutos)
  failFast: false        # Se true, aborta no primeiro erro

nodes:
  - id: analyze
    name: Análise
    agentId: analyst

  - id: implement
    name: Implementação
    agentId: developer

  - id: review
    name: Revisão
    agentId: reviewer

edges:
  - from: __start__
    to: analyze

  - from: analyze
    to: implement

  - from: implement
    to: review

  - from: review
    to: __end__
```

## Uso Programático

### DAGBuilder

```typescript
import { DAGBuilder, START_NODE_ID, END_NODE_ID } from './agents/workflow-dag.js';
import { workflowEngine } from './agents/workflow-engine.js';

// Criar workflow com builder
const workflow = new DAGBuilder('my-workflow', 'Meu Workflow')
    .setDescription('Análise e implementação')
    .setConfig({ maxConcurrency: 3, timeout: 60000 })
    .addNode({ id: 'analyze', agentId: 'analyst' })
    .addNode({ id: 'implement', agentId: 'developer' })
    .addNode({ id: 'review', agentId: 'reviewer' })
    .chain(START_NODE_ID, 'analyze', 'implement', 'review', END_NODE_ID)
    .build();

// Executar
const result = await workflowEngine.execute(workflow, {
    prompt: 'Analisar e melhorar o código',
    context: { projectPath: './src' }
});

console.log(`Status: ${result.status}`);
console.log(`Tempo: ${result.metrics.totalDurationMs}ms`);
```

### AgentComposer

```typescript
import { agentComposer } from './agents/agent-composer.js';

// Criar e executar workflow de agentes
const result = await agentComposer.executeWorkflow(
    'Análise Completa',
    [agentA, agentB, agentC],
    { prompt: 'Analisar código' },
    'fan-out-in',  // Estrutura: A → [B, C] → D
    { maxConcurrency: 2 }
);
```

## Eventos

O sistema emite eventos para monitoramento:

```typescript
import { eventBus, PAGIAEvents } from './core/event-bus.js';

// Escutar início de nodo
eventBus.on(PAGIAEvents.WORKFLOW_NODE_STARTED, (event) => {
    console.log(`Iniciando: ${event.nodeId}`);
});

// Escutar conclusão de nodo
eventBus.on(PAGIAEvents.WORKFLOW_NODE_COMPLETED, (event) => {
    console.log(`Completo: ${event.nodeId} em ${event.result.durationMs}ms`);
});

// Escutar retry
eventBus.on(PAGIAEvents.WORKFLOW_NODE_RETRY, (event) => {
    console.log(`Retry ${event.attempt}/${event.maxAttempts}: ${event.nodeId}`);
});

// Escutar merge de branches
eventBus.on(PAGIAEvents.WORKFLOW_BRANCH_MERGED, (event) => {
    console.log(`Branches mescladas: ${event.mergedNodes.join(', ')}`);
});
```

## Configurações

### maxConcurrency

Controla quantos agentes podem executar simultaneamente:
- **1**: Execução sequencial (um por vez)
- **5**: Padrão recomendado
- **20**: Máximo permitido

### timeout

Tempo máximo de execução em milissegundos:
- **60000**: 1 minuto
- **300000**: 5 minutos (padrão)
- **3600000**: 1 hora (máximo)

### failFast

Comportamento em caso de falha:
- **false** (padrão): Continua executando outros agentes
- **true**: Aborta imediatamente no primeiro erro

### retryPolicy

Política de retry para falhas:

```yaml
config:
  retryPolicy:
    maxAttempts: 3        # Tentativas máximas
    baseDelayMs: 1000     # Delay inicial (1s)
    maxDelayMs: 30000     # Delay máximo (30s)
    backoffMultiplier: 2  # Fator exponencial
```

## Boas Práticas

1. **Use nomes descritivos** para nodos
2. **Limite concorrência** para evitar sobrecarga de APIs
3. **Configure timeout** adequado para cada workflow
4. **Use failFast: false** para workflows com tarefas independentes
5. **Monitore eventos** para debugging e observabilidade
6. **Valide workflows** antes de executar em produção

## Exemplos de Estruturas

### Pipeline de Desenvolvimento

```yaml
edges:
  - from: __start__ → analyze
  - from: analyze → implement
  - from: implement → test
  - from: test → review
  - from: review → __end__
```

### Análise Paralela

```yaml
edges:
  - from: __start__ → security-check
  - from: __start__ → performance-check
  - from: __start__ → code-quality
  - from: security-check → report
  - from: performance-check → report
  - from: code-quality → report
  - from: report → __end__
```

### Pipeline com Branches

```yaml
edges:
  - from: __start__ → prepare
  - from: prepare → frontend
  - from: prepare → backend
  - from: frontend → integration
  - from: backend → integration
  - from: integration → deploy
  - from: deploy → __end__
```
