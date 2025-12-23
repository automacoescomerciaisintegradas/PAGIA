---
layout: default
title: PAGIA - Plano de Ação de Gestão e Implementação com IA
---

# 🤖 PAGIA

**Plano de Ação de Gestão e Implementação com IA**

Framework CLI modular de agentes de IA para gestão de projetos de software. Inspirado no BMAD Method, oferece um sistema de planejamento multi-nível com agentes inteligentes.

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/automacoescomerciaisintegradas/PAGIA)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

---

## ✨ Características

| Funcionalidade | Descrição |
|----------------|-----------|
| 🤖 **Agentes Inteligentes** | CodeOptimizer, Planner, Tester, Conductor |
| 📚 **Base de Conhecimento** | RAG com busca semântica |
| 📦 **Web Bundler** | Export para ChatGPT, Claude, Gemini |
| 🔌 **MCP Server** | Integração com VS Code, Cursor |
| 🔄 **TDD Workflow** | Red-Green-Refactor assistido por IA |
| 🎭 **Conductor** | Context-Driven Development |

---

## 🚀 Início Rápido

```bash
# Instalar globalmente
npm install -g pagia

# Inicializar em um projeto
pagia init

# Verificar status
pagia status

# Criar plano de ação
pagia plan create --ai
```

---

## 📖 Documentação

- [Instalação](installation.md) - Como instalar e configurar
- [Comandos](commands.md) - Lista completa de comandos
- [Agentes](agents.md) - Documentação dos agentes
- [Conductor](conductor.md) - Context-Driven Development
- [API Reference](api.md) - Referência da API

---

## 🎯 Fluxo de Trabalho

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Init     │────▶│    Plan     │────▶│  Implement  │
│   pagia     │     │   create    │     │    TDD      │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │     Update Todos        │
              │   Sincroniza tarefas    │
              └─────────────────────────┘
```

---

## 🏗️ Arquitetura

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

## 📝 Módulos de Plano

| Módulo | Descrição |
|--------|-----------|
| 📊 **Global Plan** | Gestão estratégica de alto nível |
| 📋 **Stage Plan** | Planejamento por etapas |
| 💬 **Prompt Plan** | Geração via prompts |
| 🤖 **AI Plan** | Planejamento autônomo |

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add: nova funcionalidade'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

MIT © 2025 [Automações Comerciais Integradas](https://github.com/automacoescomerciaisintegradas)

---

<p align="center">
  <strong>Automações Comerciais Integradas ⚙️</strong><br>
  automacoescomerciais@gmail.com
</p>
