# PAGIA - Plano de Ação de Gestão e Implementação com IA

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/automacoescomerciais/pagia)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

> Framework CLI modular de agentes de IA para gestão de projetos de software.
> Inspirado no BMAD Method, oferece planejamento multi-nível com agentes inteligentes.

**Desenvolvido por:** Automações Comerciais Integradas ⚙️  
**Contato:** contato@automacoescomerciais.com.br

---

## 📋 Índice

- [Interface](#-interface)
- [Funcionalidades](#-funcionalidades)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Requisitos](#-requisitos)
- [Uso da CLI](#-uso-da-cli)
- [Instalação](#-instalação)
- [Comandos](#-comandos)
- [Configuração](#-configuração)

---

## 🖥️ Interface

### Quadro Kanban
Gerenciamento visual de tarefas do planejamento até a conclusão. Crie tarefas e monitore o progresso do agente em tempo real.

### Terminal de Agente
Terminais alimentados por IA com injeção de contexto de tarefa em um clique. Gere múltiplos agentes para trabalho paralelo.

### Roteiro (Roadmap)
Planejamento de recursos assistido por IA, análise de concorrentes e segmentação de público.

---

## ✨ Funcionalidades Adicionais

- **Insights**: Interface de chat para explorar sua base de código.
- **Ideação**: Descubra melhorias, problemas de desempenho e vulnerabilidades.
- **Changelog**: Gere notas de lançamento a partir de tarefas concluídas.

---

## 🏗️ Estrutura do Projeto

```text
PAGIA/
├── apps/
│   ├── backend/     # Agentes Python, especificações, pipeline de QA
│   └── frontend/    # Aplicação desktop Electron
├── guides/          # Documentação adicional
├── tests/           # Conjunto de testes
└── scripts/         # Utilitários de build
```

---

## 📋 Requisitos

- **Assinatura Claude Pro/Max**: [Adquira aqui](https://claude.ai/pro)
- **Claude Code CLI**: `npm install -g @anthropic-ai/claude-code`
- **Repositório Git**: Seu projeto deve ser inicializado como um repositório git.
- **Python 3.12+**: Necessário para o backend e a Camada de Memória.

---

## 💻 Uso da CLI

Para operação headless, integração CI/CD ou fluxos de trabalho apenas com terminais:

```bash
cd apps/backend

# Criar uma especificação interativamente
python spec_runner.py --interactive

# Executar build autônomo
python run.py --spec 001

# Revisar e mesclar
python run.py --spec 001 --review
python run.py --spec 001 --merge
```

Veja `guides/CLI-USAGE.md` para documentação completa da CLI.

---

## 🚀 Instalação

### Pré-requisitos

- Node.js >= 18.0.0
- npm ou yarn

### Instalação Global

```bash
npm install -g pagia
```

### Instalação Local

```bash
git clone https://github.com/automacoescomerciais/pagia.git
cd pagia
npm install
npm run build
npm link
```

### Configuração de API

Crie um arquivo `.env` na raiz do projeto com as credenciais do provedor escolhido:

```env
# Provedor de IA (gemini, openai, anthropic, groq, ollama, deepseek, mistral, openrouter)
AI_PROVIDER=gemini

# Gemini (Padrão)
GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-2.0-flash-exp

# OpenAI (Opcional)
OPENAI_API_KEY=sua_chave_aqui
OPENAI_MODEL=gpt-4o

# Anthropic (Opcional)
ANTHROPIC_API_KEY=sua_chave_aqui
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Groq (Opcional) - Inferência rápida
GROQ_API_KEY=sua_chave_aqui
GROQ_MODEL=llama-3.3-70b-versatile

# Ollama (Local) - Sem API key necessária
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# DeepSeek (Opcional)
DEEPSEEK_API_KEY=sua_chave_aqui
DEEPSEEK_MODEL=deepseek-chat

# Mistral (Opcional)
MISTRAL_API_KEY=sua_chave_aqui
MISTRAL_MODEL=mistral-large-latest

# OpenRouter (Opcional) - Múltiplos modelos
OPENROUTER_API_KEY=sua_chave_aqui
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

📖 Veja a [documentação completa de provedores](docs/AI_PROVIDERS.md) para mais detalhes.

---

## ⚡ Início Rápido

```bash
# Inicializar PAGIA em um projeto
pagia init

# Verificar status
pagia status

# Criar um plano de ação
pagia plan create --ai

# Iniciar workflow TDD
pagia tdd wizard

# Buscar na base de conhecimento
pagia knowledge search "autenticação"
```

---

## 📝 Comandos

### Comandos Principais

| Comando | Descrição |
|---------|-----------|
| `pagia init` | Inicialização interativa |
| `pagia status` | Exibe status do projeto |
| `pagia config view` | Exibe configurações |
| `pagia config ai` | Configura provedor de IA |

### Gestão de Planos

| Comando | Descrição |
|---------|-----------|
| `pagia plan create` | Cria plano de ação |
| `pagia plan create --ai` | Cria plano com IA |
| `pagia plan list` | Lista todos os planos |
| `pagia plan view <nome>` | Visualiza um plano |
| `pagia update todos` | Sincroniza tarefas |

### Gestão de Agentes

| Comando | Descrição |
|---------|-----------|
| `pagia agent list` | Lista agentes |
| `pagia agent create` | Cria novo agente |
| `pagia agent run <nome>` | Executa um agente |

### Bundler Web

| Comando | Descrição |
|---------|-----------|
| `pagia bundle create` | Cria bundle para web |
| `pagia bundle validate <arquivo>` | Valida bundle |
| `pagia bundle platforms` | Lista plataformas |

### Base de Conhecimento

| Comando | Descrição |
|---------|-----------|
| `pagia knowledge add <arquivo>` | Adiciona documento |
| `pagia knowledge search <query>` | Busca semântica |
| `pagia knowledge list` | Lista documentos |
| `pagia knowledge stats` | Estatísticas |

### Servidor MCP

| Comando | Descrição |
|---------|-----------|
| `pagia mcp start` | Inicia servidor |
| `pagia mcp status` | Verifica status |
| `pagia mcp tools` | Lista ferramentas |
| `pagia mcp config <ide>` | Gera config para IDE |

### Workflow TDD

| Comando | Descrição |
|---------|-----------|
| `pagia tdd wizard` | Assistente interativo |
| `pagia tdd start <req>` | Inicia ciclo TDD |
| `pagia tdd implement <teste>` | Gera implementação |
| `pagia tdd refactor <código>` | Refatora código |
| `pagia tdd generate <código>` | Gera testes |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              PAGIA CLI                                   │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐│
│  │  init   │ status  │  plan   │  agent  │ bundle  │   mcp   │   tdd   ││
│  └────┬────┴────┬────┴────┬────┴────┬────┴────┬────┴────┬────┴────┬────┘│
└───────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────┘
        │         │         │         │         │         │         │
┌───────▼─────────▼─────────▼─────────▼─────────▼─────────▼─────────▼─────┐
│                              CORE LAYER                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  AI Service │  │ ConfigMgr   │  │ Event Bus   │  │ ModuleLoader│     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────────────────────────┐
│                            AGENTS LAYER                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Base Agent  │  │ Composer    │  │ Registry    │  │ Specialized │     │
│  │             │──│             │──│             │──│   Agents    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────────────────────────┐
│                          KNOWLEDGE LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Embeddings  │  │ VectorStore │  │  Chunker    │  │ KnowledgeDB │     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Módulos

### 📊 Global Plan
Gestão estratégica de alto nível do projeto.
- Definição de objetivos e OKRs
- Planejamento de marcos
- Análise de riscos estratégicos

### 📋 Stage Plan
Planejamento detalhado por etapas e tópicos.
- Divisão em fases de desenvolvimento
- Gestão de dependências
- Tracking de progresso

### 💬 Prompt Plan
Geração de planos a partir de prompts.
- Interpretação de linguagem natural
- Geração automática de tarefas
- Estimativa de esforço

### 🤖 AI Plan
Planejamento autônomo controlado pela IA.
- Análise proativa do projeto
- Recomendações automáticas
- Aprendizado contínuo

---

## 🤖 Agentes

### Agentes Especializados

| Agente | Descrição |
|--------|-----------|
| **CodeOptimizer** | Análise e otimização de código |
| **Planner** | Planejamento e decomposição de tarefas |
| **Tester** | Geração e execução de testes TDD |

### Composição de Agentes

```typescript
// Criar pipeline de agentes
const pipeline = agentComposer.createPipeline('review-pipeline', [
  codeOptimizerAgent,
  testerAgent,
]);

// Criar ensemble com votação
const ensemble = agentComposer.createEnsemble('experts', [
  agent1, agent2, agent3
]);
```

### Estratégias de Composição

- **Sequential**: Agentes executam em sequência
- **Parallel**: Agentes executam em paralelo
- **Pipeline**: Output de um é input do próximo
- **Voting**: Agentes votam no melhor resultado
- **Specialist**: Agente especialista decide quem executa

---

## 📚 Base de Conhecimento

Sistema RAG (Retrieval-Augmented Generation) para contexto de projeto.

```bash
# Adicionar documentação do projeto
pagia knowledge add ./docs -r

# Buscar informações
pagia knowledge search "como implementar autenticação"

# Ver estatísticas
pagia knowledge stats
```

### Tipos Suportados
- Markdown (`.md`)
- Código (`.ts`, `.js`, `.py`)
- JSON / YAML
- Texto puro

---

## 🔌 MCP Server

Servidor Model Context Protocol para integração com IDEs.

```bash
# Iniciar servidor
pagia mcp start -p 3100

# Gerar configuração
pagia mcp config cursor
pagia mcp config vscode
pagia mcp config claude
```

### Ferramentas Expostas

| Ferramenta | Descrição |
|------------|-----------|
| `pagia.listAgents` | Lista agentes disponíveis |
| `pagia.executeAgent` | Executa um agente |
| `pagia.searchKnowledge` | Busca na base |
| `pagia.status` | Status do PAGIA |

### Configuração Cursor

```json
{
  "servers": {
    "pagia": {
      "url": "http://localhost:3100",
      "transport": "http"
    }
  }
}
```

---

## 🔄 TDD Workflow

Fluxo completo de Test-Driven Development.

```bash
# Assistente interativo
pagia tdd wizard

# Ciclo manual
pagia tdd start "função de validação de email"
pagia tdd implement ./tests/email.spec.ts
pagia tdd refactor ./src/email.ts
```

### Ciclo TDD

1. 🔴 **RED**: Escrever teste que falha
2. 🟢 **GREEN**: Implementar código mínimo
3. 🔵 **REFACTOR**: Melhorar o código

---

## 🌐 Web Bundler

Empacote agentes para uso em plataformas web.

```bash
# Criar bundle para ChatGPT
pagia bundle create -p chatgpt

# Validar bundle existente
pagia bundle validate ./bundle.md
```

### Plataformas Suportadas

| Plataforma | Limite de Tokens |
|------------|------------------|
| ChatGPT | 8.000 |
| Claude | 16.000 |
| Gemini | 32.000 |
| Genérico | 6.000 |

---

## ⚙️ Configuração

### Estrutura `.pagia/`

```
.pagia/
├── config.yaml          # Configuração principal
├── modules/             # Módulos instalados
│   ├── global-plan/
│   ├── stage-plan/
│   ├── prompt-plan/
│   └── ai-plan/
├── plans/               # Planos de ação
├── agents/              # Agentes customizados
├── knowledge/           # Base de conhecimento
│   ├── documents.json
│   └── vectors/
├── bundles/             # Bundles exportados
└── _cache/              # Cache interno
```

### Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `AI_PROVIDER` | Provedor de IA (gemini, openai, anthropic, groq, ollama, deepseek, mistral, openrouter) |
| `GEMINI_API_KEY` | Chave API do Gemini |
| `OPENAI_API_KEY` | Chave API da OpenAI |
| `ANTHROPIC_API_KEY` | Chave API da Anthropic |
| `GROQ_API_KEY` | Chave API do Groq |
| `DEEPSEEK_API_KEY` | Chave API do DeepSeek |
| `MISTRAL_API_KEY` | Chave API do Mistral |
| `OPENROUTER_API_KEY` | Chave API do OpenRouter |
| `OLLAMA_BASE_URL` | URL do Ollama (default: `http://localhost:11434`) |
| `PAGIA_FOLDER` | Pasta PAGIA (default: `.pagia`) |
| `PAGIA_LANGUAGE` | Idioma (default: `pt-BR`) |
| `PAGIA_DEBUG` | Ativar debug |

---

## 📄 Licença

**AGPL-3.0** - Licença Pública Geral GNU Affero v3.0

O PAGIA é gratuito. Se você modificar e distribuir, ou executá-lo como um serviço, seu código também deve ser open source sob AGPL-3.0.

Licenciamento comercial disponível para casos de uso de código fechado.

---

## 🤝 Contribuição

Antes de contribuir, você deve assinar nosso [Contrato de Licença de Contribuinte (CLA)](CLA.md). Para assinar, basta comentar em seu Pull Request:
`Eu li o documento CLA e por meio deste assino o CLA`

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add: nova funcionalidade'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---
 
## Desenvolvido por
**Automações Comerciais Integradas** ⚙️  
 contato@automacoescomerciais.com.br
© 2025 Automações Comerciais Integradas. Todos os direitos reservados.
