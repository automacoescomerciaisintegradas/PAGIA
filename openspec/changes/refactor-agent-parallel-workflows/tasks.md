# Plano de Implementação: Parallel Workflows

## Fase 1: Core Types & Interfaces

- [x] 1.1 Criar arquivo `apps/backend/src/agents/workflow-types.ts` com interfaces base
  - `WorkflowDefinition`, `WorkflowNode`, `WorkflowEdge`, `WorkflowConfig`
  - `WorkflowExecutionContext`, `WorkflowExecutionResult`
  - `RetryPolicy`, `WorkflowEvent` types
- [x] 1.2 Adicionar novos eventos em `apps/backend/src/core/event-bus.ts`
  - `workflow:started`, `workflow:completed`, `workflow:failed`
  - `workflow:node:started`, `workflow:node:completed`, `workflow:node:failed`
  - `workflow:branch:merged`
- [ ] 1.3 Atualizar `apps/backend/src/types/index.ts` com exports dos novos tipos
- [ ] 1.4 Escrever testes unitários para validação de tipos

## Fase 2: DAG Builder & Validation

- [x] 2.1 Criar arquivo `apps/backend/src/agents/workflow-dag.ts`
  - Implementar classe `DAGBuilder` com métodos `addNode()`, `addEdge()`, `build()`
  - Implementar validação de ciclos usando DFS
  - Implementar ordenação topológica (Kahn's algorithm)
- [x] 2.2 Implementar método `validate()` que verifica:
  - Sem ciclos
  - Todos os edges referenciam nodes existentes
  - Pelo menos um node sem dependências (start nodes)
  - Pelo menos um node sem dependentes (end nodes)
- [ ] 2.3 Escrever testes unitários para DAGBuilder
  - Teste de ciclo detectado
  - Teste de ordenação topológica correta
  - Teste de validação de edges inválidos

## Fase 3: Execution Utilities

- [x] 3.1 Criar arquivo `apps/backend/src/utils/semaphore.ts`
  - Implementar classe `Semaphore` com `acquire()` e `release()`
  - Suportar timeout em `acquire()`
- [x] 3.2 Criar arquivo `apps/backend/src/utils/retry.ts`
  - Implementar função `withRetry<T>()` com backoff exponencial
  - Suportar configuração de max attempts, base delay, max delay
- [ ] 3.3 Escrever testes unitários para Semaphore e Retry
  - Teste de concorrência limitada
  - Teste de retry com falhas
  - Teste de timeout

## Fase 4: WorkflowEngine Core

- [x] 4.1 Criar arquivo `apps/backend/src/agents/workflow-engine.ts`
  - Implementar classe `WorkflowEngine` (singleton)
  - Método `execute(workflow: WorkflowDefinition, input: AgentInput): Promise<WorkflowExecutionResult>`
- [x] 4.2 Implementar scheduler interno
  - Manter conjunto de nodes prontos para execução (deps satisfeitas)
  - Processar nodes usando semáforo para limitar concorrência
  - Atualizar contexto após cada node completar
- [x] 4.3 Implementar agregação de resultados
  - Coletar outputs de todos os nodes
  - Aplicar função agregadora (default: merge de contextos)
- [x] 4.4 Implementar emissão de eventos em cada transição de estado
- [ ] 4.5 Escrever testes de integração para WorkflowEngine
  - Teste de workflow simples (A → B → C)
  - Teste de workflow paralelo (A → [B, C] → D)
  - Teste de workflow com falha e retry
  - Teste de timeout

## Fase 5: AgentComposer Enhancement

- [x] 5.1 Adicionar campo `maxConcurrency` em `CompositionConfig`
  - Default: 5
  - Validação: 1-20
- [x] 5.2 Implementar método `composeDAG(definition: WorkflowDefinition): ComposedAgent`
  - Criar `ComposedAgent` que internamente usa `WorkflowEngine`
- [x] 5.3 Refatorar `executeParallel()` para usar Semaphore
- [x] 5.4 Adicionar suporte a `Promise.allSettled()` com opção `failFast: false`
- [x] 5.5 Manter retrocompatibilidade com código existente
- [ ] 5.6 Escrever testes de regressão para garantir comportamento existente

## Fase 6: ConductorAgent Integration

- [x] 6.1 Adicionar capacidade `parallel-tasks` ao ConductorAgent
- [x] 6.2 Modificar `/implement` para detectar tasks paralelas no plan.md
  - Syntax: `<!-- parallel-start -->` e `<!-- parallel-end -->`
- [x] 6.3 Gerar workflow DAG a partir de tasks paralelas detectadas
- [x] 6.4 Executar via WorkflowEngine
- [ ] 6.5 Escrever testes de integração com ConductorAgent

## Fase 7: CLI Commands

- [x] 7.1 Criar arquivo `apps/backend/src/commands/workflow.ts`
- [x] 7.2 Implementar `pagia workflow list` - listar workflows definidos
- [x] 7.3 Implementar `pagia workflow run <name>` - executar workflow
  - Suportar `--input` para passar JSON de entrada
  - Suportar `--watch` para acompanhar execução em tempo real
- [x] 7.4 Implementar `pagia workflow visualize <name>` - visualizar DAG no terminal
  - Usar ASCII art para representar grafo
- [x] 7.5 Implementar `pagia workflow validate <name>` - validar definição
- [x] 7.6 Registrar comando em `apps/backend/src/index.ts`
- [ ] 7.7 Escrever testes E2E para comandos CLI

## Fase 8: Documentation & Migration

- [ ] 8.1 Atualizar README.md com documentação de workflows
- [x] 8.2 Criar `guides/parallel-workflows.md` com tutorial completo
- [x] 8.3 Adicionar exemplos em `examples/workflows/`
- [ ] 8.4 Documentar breaking changes e migration path
- [ ] 8.5 Atualizar JSDoc em todos os novos arquivos
- [ ] 8.6 Criar changelog entry

## Dependências Entre Tarefas

```
Fase 1 ──────────────────────────────────────────────────────────────►
         │
         ▼
Fase 2 ──────────────────────────────────────────────────────────────►
         │
         ▼
Fase 3 ──────────────────────────────────────────────────────────────►
         │
         ▼
Fase 4 ──────────────────────────────────────────────────────────────►
         │                    │                    │
         ▼                    ▼                    ▼
Fase 5 ────────►     Fase 6 ────────►     Fase 7 ────────►
                              │                    │
                              └─────────┬──────────┘
                                        ▼
                               Fase 8 ────────►
```

**Fases 5, 6 e 7 podem ser executadas em paralelo após Fase 4.**
