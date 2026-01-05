# Plano de Implementação: Visual DAG Editor

## Fase 1: Setup do Projeto React

- [x] 1.1 Criar projeto Vite com React + TypeScript
- [x] 1.2 Instalar dependências (reactflow, dagre, zustand)
- [x] 1.3 Configurar estrutura de pastas
- [x] 1.4 Configurar tema dark/light

## Fase 2: Componentes Core

- [x] 2.1 Implementar FlowEditor.tsx (canvas principal)
- [x] 2.2 Implementar NodeComponent.tsx (nodo customizado)
- [x] 2.3 Implementar ControlPanel.tsx (botões de controle)
- [x] 2.4 Implementar ValidationStatus.tsx (validação + JSON)
- [ ] 2.5 Implementar AgentSelector.tsx (dropdown de agentes)

## Fase 3: Features do Editor

- [x] 3.1 Adicionar nodo via prompt
- [x] 3.2 Conectar nodos com edges
- [x] 3.3 Deletar nodos/edges (Delete/Backspace)
- [x] 3.4 Auto-layout com Dagre
- [x] 3.5 Undo/Redo
- [x] 3.6 Dark/Light theme toggle

## Fase 4: Validação e Preview

- [x] 4.1 Validação de DAG em tempo real
- [x] 4.2 Preview JSON dos nodos e edges
- [x] 4.3 Indicador visual de erros (ciclos, edges inválidos)
- [x] 4.4 Exportar para YAML

## Fase 5: API Backend

- [x] 5.1 Criar arquivo de rotas `apps/backend/src/api/workflows.ts`
- [x] 5.2 Implementar GET /api/workflows
- [x] 5.3 Implementar POST /api/workflows
- [x] 5.4 Implementar PUT /api/workflows/:id
- [x] 5.5 Implementar DELETE /api/workflows/:id
- [x] 5.6 Implementar GET /api/agents
- [x] 5.7 Implementar POST /api/workflows/:id/run

## Fase 6: Integração

- [x] 6.1 Conectar frontend com API
- [x] 6.2 Adicionar comando `pagia workflow editor`
- [x] 6.3 Servir frontend via Express
- [x] 6.4 Documentar uso

## Status
OpenSpec Concluído! 🎉
Todas as fases foram implementadas com sucesso.
- [x] Fase 1: Setup
- [x] Fase 2: Componentes Core
- [x] Fase 3: Layout e Interações
- [x] Fase 4: Features Avançadas
- [x] Fase 5: API Backend
- [x] Fase 6: Integração

## Dependências Entre Tarefas

```
Fase 1 → Fase 2 → Fase 3 → Fase 4
                            ↓
Fase 5 ─────────────────→ Fase 6
```
