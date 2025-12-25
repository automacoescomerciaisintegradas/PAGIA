# Integração PAGIA + Inngest AgentKit + Ingest

Este documento descreve a integração do PAGIA com o **Inngest AgentKit** para orquestração de agentes e a ferramenta **Ingest** para processamento de código para LLMs.

## Dependências Instaladas

```bash
npm i @inngest/agent-kit inngest
```

## Arquivos Criados

### 1. `src/agents/inngest-adapter.ts`

Adaptador que converte agentes PAGIA existentes para o formato AgentKit.

**Funcionalidades:**
- Converte qualquer `BaseAgent` PAGIA para um agente AgentKit
- Cria ferramentas automaticamente baseadas nas capacidades do agente
- Cache de agentes convertidos para performance
- Singleton `inngestAdapter`

**Uso:**
```typescript
import { inngestAdapter } from './agents/inngest-adapter.js';

// Converter um agente PAGIA
const pagiaAgent = agentRegistry.get('meu-agente-id');
const agentKitAgent = inngestAdapter.convertPAGIAAgent(pagiaAgent);

// Converter todos os agentes
const allAgents = inngestAdapter.convertAllAgents();
```

### 2. `src/agents/inngest-network.ts`

Rede de agentes orquestrada usando AgentKit com suporte a:

**Agentes Padrão:**
- **Planner**: Cria planos de ação detalhados
- **Executor**: Executa tarefas do plano
- **Reviewer**: Revisa e valida resultados
- **Supervisor**: Orquestra a rede (Routing Agent)

**Funcionalidades:**
- Criação de redes padrão e customizadas
- Estado compartilhado entre agentes (KV store)
- Roteamento determinístico baseado em estado
- Integração com eventos PAGIA

**Uso:**
```typescript
import { pagiaNetwork } from './agents/inngest-network.js';

// Criar rede padrão
const network = pagiaNetwork.createDefaultNetwork({ name: 'minha-rede' });

// Criar rede customizada com agentes PAGIA
const customNetwork = await pagiaNetwork.createCustomNetwork(
    'custom-network',
    ['agent-id-1', 'agent-id-2']
);

// Executar rede
const result = await pagiaNetwork.runNetwork('minha-rede', 'Analise este código...');
```

### 3. `src/utils/ingest-tool.ts`

Wrapper TypeScript para o CLI `ingest` (https://github.com/sammcj/ingest).

**Funcionalidades:**
- Processar diretórios de código para contexto de LLM
- Comprimir código usando Tree-sitter
- Processar URLs/websites
- Estimar uso de VRAM
- Cache de resultados

**Uso:**
```typescript
import { ingestTool, ingestCode, ingestURL } from './utils/ingest-tool.js';

// Processar código
const result = await ingestTool.processForLLM('./src', {
    compress: true,
    maxTokens: 10000,
});

// Atalhos
const codeContext = await ingestCode('./src');
const webContent = await ingestURL('https://example.com', 2);

// Gerar contexto para agentes
const agentContext = await ingestTool.generateAgentContext('./project', 'code');
```

## Ferramentas MCP Adicionadas

O MCP Server foi atualizado com novas ferramentas:

| Ferramenta | Descrição |
|------------|-----------|
| `pagia.createNetwork` | Cria uma rede de agentes AgentKit |
| `pagia.runNetwork` | Executa uma rede com uma tarefa |
| `pagia.listNetworks` | Lista todas as redes disponíveis |
| `pagia.ingestCode` | Processa código para contexto de LLM |
| `pagia.ingestURL` | Processa URL/website para contexto |

## Pré-requisitos

### Ingest CLI

O `ingest` precisa estar instalado no sistema (via WSL no Windows):

```bash
wsl -e bash -c "cd /tmp && wget https://github.com/sammcj/ingest/releases/download/v0.15.2/ingest-linux-amd64 -O ingest && chmod +x ingest && sudo mv ingest /usr/local/bin/ && ingest --version"
```

### Variáveis de Ambiente

```env
# Gemini (obrigatório para AgentKit)
GEMINI_API_KEY=sua-api-key
GEMINI_MODEL=gemini-2.0-flash-exp
```

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        PAGIA                                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ BaseAgent   │  │ AgentKit    │  │ Ingest Tool         │  │
│  │ (PAGIA)     │──│ Adapter     │  │ (Código → Markdown) │  │
│  └─────────────┘  └──────┬──────┘  └──────────┬──────────┘  │
│                          │                     │             │
│                    ┌─────▼─────────────────────▼─────┐       │
│                    │       PAGIANetwork              │       │
│                    │  ┌──────────────────────────┐   │       │
│                    │  │ Planner → Executor →     │   │       │
│                    │  │ Reviewer → Supervisor    │   │       │
│                    │  └──────────────────────────┘   │       │
│                    └─────────────┬───────────────────┘       │
│                                  │                           │
│                    ┌─────────────▼───────────────┐           │
│                    │       MCP Server            │           │
│                    │  (Novas ferramentas)        │           │
│                    └─────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Limitações Atuais

1. **Provider único**: Atualmente apenas Gemini é suportado no AgentKit devido a problemas de tipos entre providers. OpenAI e Anthropic serão adicionados quando os tipos estabilizarem.

2. **Ingest CLI**: Requer WSL no Windows ou instalação nativa no Linux/macOS.

## Próximos Passos

1. Adicionar suporte a OpenAI e Anthropic quando os tipos do AgentKit estabilizarem
2. Implementar streaming de respostas
3. Adicionar mais templates de rede (debug, análise, etc)
4. Integração com MCP servers externos via Smithery

## Referências

- [Inngest AgentKit](https://github.com/inngest/agent-kit)
- [Ingest CLI](https://github.com/sammcj/ingest)
- [AgentKit Docs](https://agentkit.inngest.com)
