# PAGIA CLI - Arquitetura de Pastas e Configuração

## Visão Geral

A CLI do PAGIA segue o mesmo padrão de arquitetura de CLIs de editores de código baseados em forks do VS Code, como **Claude Code**, **Cursor**, **Windsurf** e **Firebase Studio**.

## Estrutura de Diretórios

### 1. Configuração Global (AppData/Roaming/PAGIA)

Localização por sistema operacional:
- **Windows**: `%APPDATA%\PAGIA\` (ex: `C:\Users\Pc\AppData\Roaming\PAGIA\`)
- **macOS**: `~/Library/Application Support/PAGIA/`
- **Linux**: `~/.config/pagia/` ou `~/.pagia/`

```
PAGIA/
├── User/
│   ├── settings.json      # Configurações globais do usuário
│   └── snippets/          # Snippets globais
├── logs/
│   ├── main.log           # Log principal
│   ├── agent.log          # Log de agentes
│   └── mcp.log            # Log de MCP
├── globalStorage/
│   ├── credentials/       # API keys encriptadas
│   │   ├── gemini.enc     # Credencial Gemini
│   │   ├── openai.enc     # Credencial OpenAI
│   │   └── ...
│   ├── agents/            # Agentes customizados globais
│   ├── skills/            # Skills globais
│   └── mcp-servers/       # Configuração de servidores MCP
├── workspaceStorage/
│   └── <workspace-hash>/  # Cache/estado por workspace
│       ├── workspace.json
│       └── state.json
├── extensions/            # Plugins/extensões instaladas
├── PAGIA.md              # Instruções globais (memória da IA)
└── config.yaml           # Configuração master (legado)
```

### 2. Configuração do Projeto (.pagia/)

Localizada no diretório raiz de cada projeto:

```
.pagia/
├── settings.json          # Configurações do projeto (versionado no Git)
├── settings.local.json    # Configurações locais (não versionado)
├── PAGIA.md              # Instruções específicas do projeto
├── conductor/
│   ├── global/            # Planos globais/estratégicos
│   ├── stages/            # Planos por etapa
│   ├── prompts/           # Planos de prompt
│   ├── ai/                # Planos controlados por IA
│   └── archive/           # Planos arquivados
├── plans/
│   ├── global/
│   ├── stages/
│   ├── prompts/
│   └── ai/
├── workflows/             # Workflows customizados
├── agents/                # Agentes customizados do projeto
├── skills/                # Skills do projeto
├── mcp/
│   └── servers.json       # Servidores MCP do projeto
├── cache/                 # Cache local (não versionado)
│   ├── embeddings/
│   └── knowledge/
└── _cfg/
    ├── config.yaml        # Configuração tradicional
    └── agents/            # Definições de agentes
```

## Novos Comandos

### Comando `auth` - Gerenciamento de Credenciais

```bash
# Autenticar com um provedor de IA
pagia auth login [provider]

# Ver status de autenticação
pagia auth status

# Importar credenciais do .env
pagia auth import

# Definir provedor padrão
pagia auth default [provider]

# Ver informações do usuário
pagia auth whoami

# Remover credenciais
pagia auth logout [provider]
```

### Provedores Suportados

| Provider   | Variável de Ambiente   |
|------------|------------------------|
| gemini     | GEMINI_API_KEY         |
| openai     | OPENAI_API_KEY         |
| anthropic  | ANTHROPIC_API_KEY      |
| groq       | GROQ_API_KEY           |
| deepseek   | DEEPSEEK_API_KEY       |
| mistral    | MISTRAL_API_KEY        |
| openrouter | OPENROUTER_API_KEY     |
| ollama     | OLLAMA_HOST            |

## Segurança das Credenciais

As API keys são armazenadas de forma segura usando:
- **Algoritmo**: AES-256-GCM
- **Chave**: Derivada de identificadores únicos da máquina
- **Localização**: `%APPDATA%\PAGIA\globalStorage\credentials\`
- **Formato**: Arquivos `.enc` encriptados

Isso significa que:
1. As credenciais só podem ser lidas na máquina onde foram criadas
2. Não é necessário inserir a API key toda vez
3. As credenciais não são expostas em arquivos de texto simples

## Comparação com Outras CLIs

| Feature                | PAGIA | Claude Code | Cursor | Windsurf |
|------------------------|-------|-------------|--------|----------|
| Config Global          | ✅    | ✅          | ✅     | ✅       |
| Arquivo de Instruções  | ✅    | ✅          | ✅     | ✅       |
| Credenciais Seguras    | ✅    | ✅          | ✅     | ✅       |
| Workspace Storage      | ✅    | ✅          | ✅     | ✅       |
| MCP Servers            | ✅    | ✅          | ✅     | ✅       |
| Extensões/Plugins      | ✅    | ✅          | ✅     | ✅       |

## Arquivos Criados

### PAGIA.md (Instruções)

Similar ao `CLAUDE.md` do Claude Code, este arquivo contém:
- Informações sobre o projeto
- Convenções de código
- Contexto importante para os agentes de IA
- Histórico de decisões

### settings.json (Configurações do Projeto)

```json
{
  "project": {
    "name": "Meu Projeto",
    "goal": "Objetivo do projeto",
    "language": "pt-BR"
  },
  "ai": {
    "provider": "gemini"
  },
  "permissions": {
    "allowFileEdit": true,
    "allowFileCreate": true,
    "allowFileDelete": false,
    "allowCommandExecution": false,
    "allowNetworkRequests": true
  },
  "context": {
    "include": ["src/**/*", "lib/**/*"],
    "exclude": ["node_modules/**", "dist/**"]
  },
  "mcpServers": {}
}
```

## Módulos Core Criados

| Módulo                | Descrição                                    |
|-----------------------|----------------------------------------------|
| `paths.ts`            | Utilitário de paths cross-platform           |
| `global-config.ts`    | Gerenciador de configuração global           |
| `credentials.ts`      | Gerenciador de credenciais encriptadas       |
| `workspace-storage.ts`| Armazenamento por workspace                  |
| `router-types.ts`     | Tipos TypeScript para sistema de roteamento  |
| `router-manager.ts`   | Gerenciador de roteamento de modelos         |

## Sistema de Roteamento (estilo claude-code-router)

O PAGIA implementa um sistema de roteamento de modelos inspirado no **claude-code-router**, permitindo configurar diferentes modelos para diferentes tipos de tarefas.

### Comando `router` - Gerenciamento de Roteamento

```bash
# Ver status do roteador
pagia router status

# Inicializar baseado nas credenciais
pagia router init

# Trocar modelo para um tipo
pagia router switch [tipo] [provedor] [modelo]

# Gerenciar provedores
pagia router provider add [nome]
pagia router provider remove [nome]
pagia router provider list

# Gerenciar modelos
pagia router model add <provedor> <modelo>
pagia router model remove <provedor> <modelo>

# Presets
pagia router preset export <nome>
pagia router preset list
pagia router preset info <nome>
pagia router preset delete <nome>

# Ativar variáveis de ambiente
pagia router activate --shell powershell
```

### Tipos de Roteamento

| Tipo          | Descrição                                  |
|---------------|--------------------------------------------|
| `default`     | Modelo padrão para tarefas gerais          |
| `background`  | Tarefas em segundo plano (modelo barato)   |
| `think`       | Raciocínio/planejamento (modelo poderoso)  |
| `longContext` | Contexto longo (> 60K tokens)              |
| `webSearch`   | Pesquisa na web                            |
| `image`       | Tarefas com imagens                        |
| `code`        | Geração de código                          |

### Configuração de Provedores

Cada provedor pode ser configurado com:

```json
{
  "name": "openrouter",
  "api_base_url": "https://openrouter.ai/api/v1/chat/completions",
  "api_key": "sk-xxx",
  "models": [
    "google/gemini-2.5-pro-preview",
    "anthropic/claude-sonnet-4"
  ],
  "transformer": { "use": ["openrouter"] }
}
```

### Transformadores Disponíveis

| Transformador | Descrição                                    |
|---------------|----------------------------------------------|
| `anthropic`   | Adapta para API da Anthropic                 |
| `deepseek`    | Adapta para API da DeepSeek                  |
| `gemini`      | Adapta para API do Google Gemini             |
| `openai`      | Adapta para API da OpenAI                    |
| `openrouter`  | Adapta para API do OpenRouter                |
| `groq`        | Adapta para API do Groq                      |
| `mistral`     | Adapta para API da Mistral                   |
| `ollama`      | Adapta para API do Ollama                    |
| `maxtoken`    | Define limite de tokens                      |
| `tooluse`     | Otimiza uso de ferramentas                   |

### Comando `ui` - Interface Interativa

```bash
pagia ui
```

A interface interativa permite:
- Ver configuração atual
- Trocar modelos por tipo
- Adicionar novos modelos
- Criar novos provedores
- Gerenciar credenciais
- Exportar/importar presets
- Gerar variáveis de ambiente
- Configurações gerais

### Arquivo router.json

Armazenado em `%APPDATA%\PAGIA\router.json`:

```json
{
  "version": "1.0.0",
  "providers": [...],
  "router": {
    "default": { "provider": "gemini", "model": "gemini-2.0-flash-exp" },
    "background": { "provider": "groq", "model": "llama3-8b-8192" },
    "think": { "provider": "anthropic", "model": "claude-3-opus-20240229" },
    "longContext": { "provider": "gemini", "model": "gemini-1.5-pro-latest" },
    "longContextThreshold": 60000
  },
  "settings": {
    "apiTimeout": 120000,
    "disableTelemetry": true,
    "logLevel": "info"
  }
}
```

### Ativação de Ambiente

O comando `pagia router activate` gera variáveis de ambiente:

```powershell
# PowerShell
$env:PAGIA_PROVIDER="gemini"
$env:PAGIA_MODEL="gemini-2.0-flash-exp"
$env:PAGIA_API_KEY="AIzaSy..."
$env:GEMINI_API_KEY="AIzaSy..."
$env:GROQ_API_KEY="gsk_..."
```

Isso permite integração com outras ferramentas que usam variáveis de ambiente para configuração.

---

*Documentação atualizada em 2026-01-04*
