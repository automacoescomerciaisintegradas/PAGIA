# Project Context

## Purpose
PAGIA (Plano de Ação de Gestão e Implementação com IA) is an integrated commercial automation platform.
It combines a powerful CLI for project management/orchestration with a backend system for handling commercial automation tasks, including AI agents and integrations.

## Tech Stack
- **Languages**: TypeScript (primary), JavaScript.
- **Runtime**: Node.js (>=18.0.0).
- **CLI Framework**: Commander, Inquirer, Chalk, Ora, Boxen.
- **Backend Framework**: Express.js.
- **AI Integration**: Google Generative AI (Gemini), OpenAI, Ollama, Inngest Agent Kit.
- **Utilities**: Glob, YAML processing.

## Project Conventions

### Code Style
- **TypeScript**: Strict typing where possible.
- **Modules**: ES Modules (`"type": "module"`).
- **Async/Await**: Preferred over callbacks.

### Architecture Patterns
- **Monorepo-style**: Apps and scripts co-located.
- **CLI-First**: Strong emphasis on CLI interaction for management tasks.
- **Agentic**: Usage of AI agents for performing complex tasks.

### Testing Strategy
- **Framework**: Vitest (`npm test` runs `vitest`).
- **Focus**: Unit testing for logic, potentially integration tests for CLI commands.

### Git Workflow
- Standard feature branching workflow.

## Domain Context
- **Commercial Automation**: Tools for business implementation plans.
- **AI Orchestration**: Managing multiple AI providers and local models.

## Important Constraints
- **Windows Compatibility**: Must support Windows (Cureent OS).
- **Local Fallback**: Supports local AI (Ollama) when cloud providers are unavailable.

## External Dependencies
- **AI Providers**: Google (Gemini), OpenAI.
- **Inngest**: For reliable background functions/workflows.
