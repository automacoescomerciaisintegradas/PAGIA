# Tech Stack do Projeto PAGIA

## Core
- **Runtime**: Node.js (v18+)
- **Linguagem**: TypeScript (v5+)
- **Build System**: tsc (TypeScript Compiler)

## CLI & Backend
- **CLI Framework**: Commander.js
- **Terminal UI**: chalk, boxen, figlet, ora, ink (opcional)
- **Configuração**: dotenv, yaml
- **Utilidades**: fs-extra, uuid, globby

## AI & LLM
- **Providers**: Multi-provider (OpenAI, Gemini, Groq, Anthropic, Mistral, OpenRouter)
- **Modelos Recomendados**: 
  - GPT-4o / Claude 3.5 Sonnet (Specs & Logic)
  - Llama 3.3 70B / Gemini 2.0 Flash (Chat & Speed)
- **Protocolo**: MCP (Model Context Protocol)
- **Gateway**: Local LLM Gateway (Porta 3000)

## Qualidade e Testes
- **Framework**: Vitest / Jest
- **E2E**: Playwright (para agentes que usam web)
- **Linter**: ESLint
- **Formatter**: Prettier

## Estrutura de Pastas
- `apps/backend`: Lógica principal da CLI e servidores
- `apps/frontend`: Interface administrativa (se aplicável)
- `.pagia`: Artefatos de IA, agentes, specs e configurações
