# Change: Add Visual DAG Editor

## Why

O sistema de workflows paralelos está funcional via CLI e arquivos YAML, mas criar e visualizar workflows complexos é difícil sem uma interface visual. Um editor visual de DAG permitirá:

1. **Criação intuitiva** - Arrastar e conectar nodos visualmente
2. **Validação em tempo real** - Detectar ciclos e erros imediatamente
3. **Preview do workflow** - Visualizar estrutura antes de executar
4. **Exportar YAML** - Gerar arquivos compatíveis com o CLI
5. **Onboarding facilitado** - Usuários não técnicos podem criar workflows

## What Changes

### Frontend (React + ReactFlow)

- **Novo app frontend**: `apps/frontend/dag-editor/`
- **Componentes**:
  - `FlowEditor.tsx` - Canvas principal com ReactFlow
  - `ControlPanel.tsx` - Botões de controle (add, delete, layout, theme)
  - `NodeComponent.tsx` - Componente visual customizado para nodos
  - `ValidationStatus.tsx` - Painel de validação + preview JSON
  - `AgentSelector.tsx` - Dropdown para selecionar agentes disponíveis
- **Features**:
  - Drag & drop para criar nodos
  - Conexão visual de edges
  - Auto-layout com Dagre
  - Dark/Light theme
  - Undo/Redo
  - Export para YAML
  - Salvar/Carregar workflows

### Backend API

- **Novos endpoints**:
  - `GET /api/workflows` - Listar workflows
  - `GET /api/workflows/:id` - Obter workflow específico
  - `POST /api/workflows` - Criar workflow
  - `PUT /api/workflows/:id` - Atualizar workflow
  - `DELETE /api/workflows/:id` - Deletar workflow
  - `GET /api/agents` - Listar agentes disponíveis
  - `POST /api/workflows/:id/validate` - Validar workflow
  - `POST /api/workflows/:id/run` - Executar workflow

### CLI Integration

- `pagia workflow editor` - Iniciar servidor do editor visual

## Impact

- Affected specs: `dag-editor` (nova)
- New dependencies: `react`, `reactflow`, `dagre`, `zustand`
- New frontend app in `apps/frontend/dag-editor/`
- New API routes in `apps/backend/src/api/`
