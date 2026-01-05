# Arquitetura do Sistema PAGIA

## Filosofia
PAGIA é um sistema **orientado a especificações**. O código não deve ser escrito sem uma spec clara. Os agentes seguem o ciclo: Ideia -> Spec -> Tasks -> Impl -> Verificação.

## Camadas

### 1. Comandos (Commands)
Interface de entrada do usuário. Cada comando deve ser independente e residir em `src/commands/`. Eles delegam a lógica pesada para os Cores ou Provedores.

### 2. Core (Núcleo)
Gerenciadores centrais (`ConfigManager`, `RouterManager`, `MCPManager`). São Singletons que mantêm o estado e orquestram módulos.

### 3. Provedores (Providers)
Abstrações para serviços externos, especialmente IAs. A interface `MultiProvider` garante que o sistema possa trocar de modelo (OpenAI, Gemini, etc.) sem alterar a lógica de consumo.

### 4. Agentes (Agents)
Personalidades da CLI definidas em Markdown no diretório `.pagia/agents/`. Eles usam ferramentas (Read, Write, Bash) para operar no codebase.

### 5. Spec System
Reside em `.pagia/specs/`. Cada feature nova deve ter sua própria subpasta com:
- `raw-idea.md`: A intenção original.
- `spec.md`: O design técnico.
- `tasks.md`: O checklist de implementação.

## Fluxo de Dados
- Configurações são carregadas do `.env` e `.pagia/config.yml`.
- Comandos CLI usam o `logger` para feedback visual.
- Ações destrutivas ou de escrita devem ser confirmadas ou documentadas em logs.
