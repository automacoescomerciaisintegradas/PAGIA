# PAGIA - AI Management and Implementation Action Plan

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/automacoescomerciais/pagia)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

> Modular CLI framework of AI agents for software project management.
> Inspired by the BMAD Method, it offers multi-level planning with intelligent agents.

**Developed by:** Automações Comerciais Integradas ⚙️  
**Contact:** contato@automacoescomerciais.com.br

---

## 📋 Table of Contents

- [Interface](#-interface)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Requirements](#-requirements)
- [CLI Usage](#-cli-usage)
- [Installation](#-installation)
- [Commands](#-commands)
- [Configuration](#-configuration)

---

## 🖥️ Interface

### Kanban Board
Visual task management from planning to completion. Create tasks and monitor agent progress in real-time.

### Agent Terminal
AI-powered terminals with one-click task context injection. Spawn multiple agents for parallel work.

### Roadmap
AI-assisted resource planning, competitor analysis, and audience segmentation.

---

## ✨ Additional Features

- **Insights**: Chat interface to explore your codebase.
- **Ideation**: Discover improvements, performance issues, and vulnerabilities.
- **Changelog**: Generate release notes from completed tasks.

---

## 🏗️ Project Structure

```text
PAGIA/
├── apps/
│   ├── backend/     # Python agents, specs, QA pipeline
│   └── frontend/    # Electron desktop application
├── guides/          # Additional documentation
├── tests/           # Test suite
└── scripts/         # Build utilities
```

---

## 📋 Requirements

- **Claude Pro/Max Subscription**: [Get it here](https://claude.ai/pro)
- **Claude Code CLI**: `npm install -g @anthropic-ai/claude-code`
- **Git Repository**: Your project must be initialized as a git repository.
- **Python 3.12+**: Required for the backend and Memory Layer.

---

## 💻 CLI Usage

For headless operation, CI/CD integration, or terminal-only workflows:

```bash
cd apps/backend

# Create a spec interactively
python spec_runner.py --interactive

# Run autonomous build
python run.py --spec 001

# Review and merge
python run.py --spec 001 --review
python run.py --spec 001 --merge
```

See `guides/CLI-USAGE.md` for full CLI documentation.

---

## 🚀 Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Global Installation

```bash
npm install -g pagia
```

### Local Installation

```bash
git clone https://github.com/automacoescomerciais/pagia.git
cd pagia
npm install
npm run build
npm link
```

### API Configuration

Create a `.env` file in the project root with the chosen provider credentials:

```env
# AI Provider (gemini, openai, anthropic, groq, ollama, deepseek, mistral, openrouter)
AI_PROVIDER=gemini

# Gemini (Default)
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash-exp

# OpenAI (Optional)
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o

# Anthropic (Optional)
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Groq (Optional) - Fast inference
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Ollama (Local) - No API key needed
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# DeepSeek (Optional)
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_MODEL=deepseek-chat

# Mistral (Optional)
MISTRAL_API_KEY=your_key_here
MISTRAL_MODEL=mistral-large-latest

# OpenRouter (Optional) - Multiple models
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

📖 See [full provider documentation](docs/AI_PROVIDERS.md) for more details.

---

## ⚡ Quick Start

```bash
# Initialize PAGIA in a project
pagia init

# Check status
pagia status

# Create an action plan
pagia plan create --ai

# Start TDD workflow
pagia tdd wizard

# Search knowledge base
pagia knowledge search "authentication"
```

---

## 📝 Commands

### Core Commands

| Command | Description |
|---------|-------------|
| `pagia init` | Interactive initialization |
| `pagia status` | Displays project status |
| `pagia config view` | Displays configuration |
| `pagia config ai` | Configures AI provider |

### Plan Management

| Command | Description |
|---------|-------------|
| `pagia plan create` | Creates action plan |
| `pagia plan create --ai` | Creates plan with AI |
| `pagia plan list` | Lists all plans |
| `pagia plan view <name>` | Views a plan |
| `pagia update todos` | Syncs tasks |

### Agent Management

| Command | Description |
|---------|-------------|
| `pagia agent list` | Lists agents |
| `pagia agent create` | Creates new agent |
| `pagia agent run <name>` | Runs an agent |

### Web Bundler

| Command | Description |
|---------|-------------|
| `pagia bundle create` | Creates bundle for web |
| `pagia bundle validate <file>` | Validates bundle |
| `pagia bundle platforms` | Lists platforms |

### Knowledge Base

| Command | Description |
|---------|-------------|
| `pagia knowledge add <file>` | Adds document |
| `pagia knowledge search <query>` | Semantic search |
| `pagia knowledge list` | Lists documents |
| `pagia knowledge stats` | Statistics |

### MCP Server

| Command | Description |
|---------|-------------|
| `pagia mcp start` | Starts server |
| `pagia mcp status` | Checks status |
| `pagia mcp tools` | Lists tools |
| `pagia mcp config <ide>` | Generates config for IDE |

### TDD Workflow

| Command | Description |
|---------|-------------|
| `pagia tdd wizard` | Interactive wizard |
| `pagia tdd start <req>` | Starts TDD cycle |
| `pagia tdd implement <test>` | Generates implementation |
| `pagia tdd refactor <code>` | Refactors code |
| `pagia tdd generate <code>` | Generates tests |

---

## 🏗️ Architecture

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

## 📦 Modules

### 📊 Global Plan
High-level strategic project management.
- Definition of objectives and OKRs
- Milestone planning
- Strategic risk analysis

### 📋 Stage Plan
Detailed planning by stages and topics.
- Division into development phases
- Dependency management
- Progress tracking

### 💬 Prompt Plan
Generating plans from prompts.
- Natural language interpretation
- Automatic task generation
- Effort estimation

### 🤖 AI Plan
Autonomous planning controlled by AI.
- Proactive project analysis
- Automatic recommendations
- Continuous learning

---

## 🤖 Agents

### Specialized Agents

| Agent | Description |
|-------|-------------|
| **CodeOptimizer** | Code analysis and optimization |
| **Planner** | Planning and task decomposition |
| **Tester** | Test generation and execution (TDD) |

### Agent Composition

```typescript
// Create agent pipeline
const pipeline = agentComposer.createPipeline('review-pipeline', [
  codeOptimizerAgent,
  testerAgent,
]);

// Create ensemble with voting
const ensemble = agentComposer.createEnsemble('experts', [
  agent1, agent2, agent3
]);
```

### Composition Strategies

- **Sequential**: Agents execute in sequence
- **Parallel**: Agents execute in parallel
- **Pipeline**: Output of one is input of next
- **Voting**: Agents vote on the best result
- **Specialist**: Specialist agent decides who executes

---

## 📚 Knowledge Base

RAG (Retrieval-Augmented Generation) system for project context.

```bash
# Add project documentation
pagia knowledge add ./docs -r

# Search for information
pagia knowledge search "how to implement authentication"

# View statistics
pagia knowledge stats
```

### Context Curation

Advanced context curation and organization system in a hierarchical tree structure for AI processing, with semantic indexing and advanced filtering capabilities.

```bash
# Build context tree from project files
pagia context build-tree . "**/*.md" "**/*.ts" "**/*.js"

# Search context tree (traditional keyword search)
pagia context search "authentication"

# Semantic search using embeddings to find related content
pagia context semantic-search "user management"

# Add a specific document to the context tree with tags
pagia context add-document ./docs/new-feature.md documentation "important,api,auth"

# Filter context by type, tag or priority
pagia context filter code
pagia context filter file important 2

# View context tree statistics
pagia context stats
```

#### Available Commands

| Command | Description |
|---------|-------------|
| `pagia context build-tree [directory] [patterns...]` | Builds a context tree from files |
| `pagia context search <query>` | Traditional keyword search in context tree |
| `pagia context semantic-search <query>` | Semantic search using embeddings to find related content |
| `pagia context add-document <file> [category] [tags]` | Adds a document to the context tree with categorization and tagging |
| `pagia context filter [type] [tag] [priority]` | Filters context by specific criteria |
| `pagia context stats` | Displays context tree statistics |
| `pagia context help` | Shows command help |

#### Advanced Features

##### Semantic Indexing
The system generates embeddings for each document allowing semantic searches, finding relevant content even when it doesn't contain exactly the same keywords as the query.

##### Tagging and Filtering System
Each document can be marked with tags allowing advanced filtering. This is useful to quickly identify important, critical, or domain-specific documents.

##### Enriched Metadata
Beyond basic categories, each document stores metadata like file size, modification date, and other attributes that can be used for ranking and filtering.

#### Context Tree Structure

The context curation system organizes project files into a hierarchical structure with the following default categories:

- **Documentation**: Documentation files (`.md`, `.txt`)
- **Code**: Source code files (`.ts`, `.js`, `.py`, etc.)
- **Tests**: Test files (`.test.ts`, `.spec.js`, etc.)
- **Config**: Configuration files (`.json`, `.yaml`, `.yml`, etc.)

This structure allows the AI to better understand project organization and access relevant information efficiently.

### Supported Types
- Markdown (`.md`)
- Code (`.ts`, `.js`, `.py`)
- JSON / YAML
- Pure Text

---

## 🔌 MCP Server

Model Context Protocol server for IDE integration.

```bash
# Start server
pagia mcp start -p 3100

# Generate config
pagia mcp config cursor
pagia mcp config vscode
pagia mcp config claude
```

### Exposed Tools

| Tool | Description |
|------|-------------|
| `pagia.listAgents` | Lists available agents |
| `pagia.executeAgent` | Executes an agent |
| `pagia.searchKnowledge` | Searches knowledge base |
| `pagia.status` | PAGIA status |

### Cursor Configuration

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

Complete Test-Driven Development workflow.

```bash
# Interactive wizard
pagia tdd wizard

# Manual cycle
pagia tdd start "email validation function"
pagia tdd implement ./tests/email.spec.ts
pagia tdd refactor ./src/email.ts
```

### TDD Cycle

1. 🔴 **RED**: Write failing test
2. 🟢 **GREEN**: Implement minimal code
3. 🔵 **REFACTOR**: Improve code

---

## 🌐 Web Bundler

Package agents for use on web platforms.

```bash
# Create bundle for ChatGPT
pagia bundle create -p chatgpt

# Validate existing bundle
pagia bundle validate ./bundle.md
```

### Supported Platforms

| Platform | Token Limit |
|----------|-------------|
| ChatGPT | 8,000 |
| Claude | 16,000 |
| Gemini | 32,000 |
| Generic | 6,000 |

---

## ⚙️ Configuration

### `.pagia/` Structure

```
.pagia/
├── config.yaml          # Main configuration
├── modules/             # Installed modules
│   ├── global-plan/
│   ├── stage-plan/
│   ├── prompt-plan/
│   └── ai-plan/
├── plans/               # Action plans
├── agents/              # Custom agents
├── knowledge/           # Knowledge base
│   ├── documents.json
│   └── vectors/
├── bundles/             # Exported bundles
└── _cache/              # Internal cache
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `AI_PROVIDER` | AI Provider (gemini, openai, anthropic, groq, ollama, deepseek, mistral, openrouter) |
| `GEMINI_API_KEY` | Gemini API Key |
| `OPENAI_API_KEY` | OpenAI API Key |
| `ANTHROPIC_API_KEY` | Anthropic API Key |
| `GROQ_API_KEY` | Groq API Key |
| `DEEPSEEK_API_KEY` | DeepSeek API Key |
| `MISTRAL_API_KEY` | Mistral API Key |
| `OPENROUTER_API_KEY` | OpenRouter API Key |
| `OLLAMA_BASE_URL` | Ollama URL (default: `http://localhost:11434`) |
| `PAGIA_FOLDER` | PAGIA Folder (default: `.pagia`) |
| `PAGIA_LANGUAGE` | Language (default: `pt-BR`) |
| `PAGIA_DEBUG` | Enable debug |

---

## 📄 License

**AGPL-3.0** - GNU Affero General Public License v3.0

PAGIA is free. If you modify and distribute it, or run it as a service, your code must also be open source under AGPL-3.0.

Commercial licensing available for closed-source use cases.

---

## 🤝 Contribution

Before contributing, you must sign our [Contributor License Agreement (CLA)](CLA.md). To sign, just comment on your Pull Request:
`I have read the CLA document and I hereby sign the CLA`

1. Fork the project
2. Create your branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add: new feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## Developed by
**Automações Comerciais Integradas** ⚙️  
contato@automacoescomerciais.com.br
© 2025 Automações Comerciais Integradas. All rights reserved.
