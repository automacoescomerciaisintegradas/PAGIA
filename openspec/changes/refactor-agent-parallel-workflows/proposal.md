# Change: Refatorar Sistema de Agentes para Suportar Workflows Paralelos

## Why

O sistema atual de agentes PAGIA já possui o `AgentComposer` com suporte básico a execução paralela, mas apresenta limitações críticas:

1. **Execução simples de Promise.all** - Não há suporte para dependências entre agentes
2. **Falta de DAG (Directed Acyclic Graph)** - Não é possível definir workflows complexos com dependências
3. **Sem controle de concorrência** - Todos os agentes paralelos executam simultaneamente sem limite
4. **Falta de observabilidade** - Não há eventos granulares para monitorar progresso de cada branch
5. **ConductorAgent executa tasks sequencialmente** - Mesmo tasks independentes aguardam a anterior

A refatoração permitirá executar workflows complexos onde agentes independentes rodam em paralelo, enquanto agentes dependentes aguardam suas dependências, maximizando throughput e reduzindo tempo total de execução.

## What Changes

### Core Architecture

- **Novo módulo `WorkflowEngine`** - Motor de execução de workflows com suporte a DAG
- **Novo tipo `WorkflowDefinition`** - Define nodos, arestas e configurações de workflow
- **Novo tipo `WorkflowExecutionContext`** - Contexto compartilhado entre agentes em execução
- **Novos eventos de workflow** - `workflow:node:started`, `workflow:node:completed`, `workflow:branch:merged`

### AgentComposer Enhancements

- Novo método `composeDAG()` para criar workflows baseados em grafos
- Suporte a `Promise.allSettled()` para execução resiliente
- Limites de concurrência configuráveis (`maxConcurrency`)
- Retry automático com backoff exponencial

### CLI Integration

- Novo subcomando `pagia workflow` para gerenciar workflows
- Comando `pagia workflow run <name>` para executar workflows definidos
- Comando `pagia workflow visualize <name>` para visualizar DAG no terminal

### **BREAKING** Changes

- Interface `CompositionConfig` ganha novos campos obrigatórios para `maxConcurrency`
- Evento `agent:completed` agora inclui `parentWorkflowId` quando executado em workflow

## Impact

- Affected specs: `agent-orchestration` (nova), `cli` (modificada)
- Affected code:
  - `apps/backend/src/agents/agent-composer.ts` - Refatoração significativa
  - `apps/backend/src/agents/workflow-engine.ts` - Novo arquivo
  - `apps/backend/src/agents/specialized/conductor-agent.ts` - Integração com workflows
  - `apps/backend/src/commands/agent.ts` - Novo subcomando workflow
  - `apps/backend/src/core/event-bus.ts` - Novos eventos
  - `apps/backend/src/types/index.ts` - Novos tipos
