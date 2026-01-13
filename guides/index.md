---
layout: default
title: PAGIA - AI Management and Implementation Action Plan
---

# 🤖 PAGIA

**AI Management and Implementation Action Plan**

Modular CLI framework of AI agents for software project management. Inspired by the BMAD Method, it offers a multi-level planning system with intelligent agents.

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/automacoescomerciaisintegradas/PAGIA)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **Intelligent Agents** | CodeOptimizer, Planner, Tester, Conductor |
| 📚 **Knowledge Base** | RAG with semantic search |
| 📦 **Web Bundler** | Export to ChatGPT, Claude, Gemini |
| 🔌 **MCP Server** | Integration with VS Code, Cursor |
| 🔄 **TDD Workflow** | AI-assisted Red-Green-Refactor |
| 🎭 **Conductor** | Context-Driven Development |

---

## 🚀 Quick Start

```bash
# Install globally
npm install -g pagia

# Initialize in a project
pagia init

# Check status
pagia status

# Create action plan
pagia plan create --ai
```

---

## 📖 Documentation

- [Installation](installation.md) - How to install and configure
- [Commands](commands.md) - Complete list of commands
- [Agents](agents.md) - Agent documentation
- [Conductor](conductor.md) - Context-Driven Development
- [API Reference](api.md) - API Reference

---

## 🎯 Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Init     │────▶│    Plan     │────▶│  Implement  │
│   pagia     │     │   create    │     │    TDD      │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │     Update Todos        │
              │     Sync tasks          │
              └─────────────────────────┘
```

---

## 🏗️ Architecture

```
PAGIA CLI
    │
    ├── Core Layer (AI Service, Config, Events)
    │
    ├── Agents Layer (Composer, Registry, Specialized)
    │
    ├── Knowledge Layer (Embeddings, Vector Store)
    │
    └── Integration Layer (MCP, Bundler, Registry)
```

---

## 📝 Plan Modules

| Module | Description |
|--------|-------------|
| 📊 **Global Plan** | High-level strategic management |
| 📋 **Stage Plan** | Stage-based planning |
| 💬 **Prompt Plan** | Prompt-based generation |
| 🤖 **AI Plan** | Autonomous planning |

---

## 🤝 Contribution

1. Fork the project
2. Create your branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add: new feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

MIT © 2025 [Automações Comerciais Integradas](https://github.com/automacoescomerciaisintegradas)

---

<p align="center">
  <strong>Automações Comerciais Integradas ⚙️</strong><br>
  automacoescomerciais@gmail.com
</p>
