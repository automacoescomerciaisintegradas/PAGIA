# Design: Parallel Workflow Architecture

## Context

O PAGIA é uma plataforma de automação comercial que utiliza múltiplos agentes de IA especializados. Atualmente, mesmo quando agentes são independentes entre si, eles executam sequencialmente, desperdiçando tempo e recursos.

### Stakeholders

- **Desenvolvedores** - Precisam de APIs claras para definir workflows
- **Operadores** - Precisam de observabilidade sobre execução de workflows
- **Usuários Finais** - Precisam de respostas mais rápidas

### Constraints

- **Compatibilidade** - Deve manter retrocompatibilidade com `AgentComposer` existente
- **Recursos** - Limitar uso de memória e conexões simultâneas de API
- **Observabilidade** - Eventos devem ser emitidos para cada transição de estado

## Goals / Non-Goals

### Goals

- ✅ Definir workflows como DAG (Directed Acyclic Graph)
- ✅ Executar branches independentes em paralelo
- ✅ Suportar limites de concorrência configuráveis
- ✅ Agregar resultados de branches paralelas
- ✅ Emitir eventos granulares para monitoramento
- ✅ Retry automático com backoff exponencial
- ✅ Integrar com ConductorAgent para tracks paralelas

### Non-Goals

- ❌ Workflows distribuídos (multi-node)
- ❌ Persistência de estado (checkpointing)
- ❌ UI visual para design de workflows
- ❌ Suporte a loops/ciclos no DAG

## Decisions

### Decision 1: Usar Topological Sort para ordenação de execução

**What**: Implementar ordenação topológica (Kahn's algorithm) para determinar ordem de execução

**Why**: Garante que todas as dependências de um nodo são executadas antes dele

**Alternatives considered**:
- BFS simples - Não garante ordem correta com dependências complexas
- DFS recursivo - Propenso a stack overflow em grafos grandes

### Decision 2: Semáforo para controle de concorrência

**What**: Implementar semáforo (`Semaphore`) para limitar execuções simultâneas

**Why**: Previne sobrecarga de APIs de IA e uso excessivo de memória

**Implementation**:
```typescript
class Semaphore {
  private permits: number;
  private waiting: (() => void)[] = [];
  
  constructor(permits: number) { this.permits = permits; }
  
  async acquire(): Promise<void> { ... }
  release(): void { ... }
}
```

### Decision 3: Promise.allSettled para resiliência

**What**: Usar `Promise.allSettled()` ao invés de `Promise.all()`

**Why**: Um agente falhando não deve abortar todo o workflow

**Trade-off**: Requer handling adicional de resultados `rejected`

### Decision 4: Contexto compartilhado imutável

**What**: Contexto de workflow é passado como snapshot imutável para cada agente

**Why**: Evita race conditions e side effects inesperados

**Implementation**: Deep clone do contexto antes de passar para cada agente

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WorkflowEngine                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ DAG Builder  │  │ Scheduler    │  │ Executor     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                │                  │              │
│         ▼                ▼                  ▼              │
│  ┌─────────────────────────────────────────────────┐      │
│  │              Execution Manager                   │      │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐        │      │
│  │   │Semaphore│  │Retry    │  │Aggregator│        │      │
│  │   └─────────┘  └─────────┘  └─────────┘        │      │
│  └─────────────────────────────────────────────────┘      │
│                          │                                 │
│                          ▼                                 │
│  ┌─────────────────────────────────────────────────┐      │
│  │                 Event Emitter                    │      │
│  └─────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Workflow Definition Schema

```typescript
interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  config: WorkflowConfig;
}

interface WorkflowNode {
  id: string;
  agentId: string;
  inputMapper?: (ctx: WorkflowContext) => AgentInput;
  outputMapper?: (output: AgentOutput) => Partial<WorkflowContext>;
}

interface WorkflowEdge {
  from: string;  // node id or '__start__'
  to: string;    // node id or '__end__'
  condition?: (ctx: WorkflowContext) => boolean;
}

interface WorkflowConfig {
  maxConcurrency: number;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  aggregator?: AggregatorFunction;
}
```

### Execution Flow

```
          ┌───────┐
          │ Start │
          └───┬───┘
              │
       ┌──────┴──────┐
       ▼             ▼
   ┌───────┐     ┌───────┐
   │Agent A│     │Agent B│     ← Parallel (no deps)
   └───┬───┘     └───┬───┘
       │             │
       └──────┬──────┘
              │
              ▼
          ┌───────┐
          │Agent C│     ← Waits for A and B
          └───┬───┘
              │
       ┌──────┴──────┐
       ▼             ▼
   ┌───────┐     ┌───────┐
   │Agent D│     │Agent E│     ← Parallel (deps on C only)
   └───┬───┘     └───┬───┘
       │             │
       └──────┬──────┘
              │
              ▼
          ┌─────┐
          │ End │
          └─────┘
```

## Risks / Trade-offs

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Memory exhaustion (muitos agentes paralelos) | Medium | High | Semáforo com limite padrão de 5 |
| Rate limiting de APIs de IA | High | Medium | Backoff exponencial + circuit breaker |
| Deadlock em grafos mal definidos | Low | High | Validação de ciclos no DAG builder |
| Resultados inconsistentes por race conditions | Medium | High | Contexto imutável + deep clone |

## Migration Plan

### Phase 1: WorkflowEngine Core
1. Criar tipos base (`WorkflowDefinition`, `WorkflowNode`, etc.)
2. Implementar DAG builder com validação
3. Implementar scheduler com topological sort
4. Implementar executor com semáforo

### Phase 2: AgentComposer Integration
1. Adicionar método `composeDAG()`
2. Atualizar `CompositionConfig` com `maxConcurrency`
3. Deprecar uso de `parallel` strategy sem `maxConcurrency`

### Phase 3: CLI & ConductorAgent
1. Adicionar subcomandos `pagia workflow`
2. Integrar ConductorAgent com WorkflowEngine
3. Documentar migration path

### Rollback

- Manter `AgentComposer` original funcionando
- Flag `useWorkflowEngine: false` para rollback
- Scripts de migração reversíveis

## Open Questions

1. **Q**: Devemos suportar workflows persistentes que podem ser retomados após falha?
   **A**: Fora do escopo inicial, mas a arquitetura deve permitir adicionar depois

2. **Q**: Como lidar com agentes que precisam de input interativo do usuário?
   **A**: Emitir evento e aguardar resposta com timeout configurável

3. **Q**: Suportar priorização de branches?
   **A**: Considerar para v2, por enquanto FIFO
