---
layout: default
title: Comandos
---

# 📋 Comandos CLI

## Comandos Principais

### `pagia init`
Inicializa o PAGIA em um projeto.

```bash
pagia init [options]

Opções:
  -y, --yes       Aceitar padrões
  -p, --provider  Provedor de IA (gemini, openai, anthropic)
```

---

### `pagia status`
Exibe o status do projeto PAGIA.

```bash
pagia status [options]

Opções:
  -v, --verbose   Exibir detalhes
```

---

### `pagia config`
Gerencia configurações.

```bash
pagia config view           # Ver configurações
pagia config ai             # Configurar provedor IA
pagia config set <k> <v>    # Definir valor
pagia config get <key>      # Obter valor
```

---

## Gestão de Planos

### `pagia plan`
Gerencia planos de ação.

```bash
pagia plan create           # Criar plano
pagia plan create --ai      # Criar com IA
pagia plan list             # Listar planos
pagia plan view <nome>      # Ver plano
pagia plan edit <nome>      # Editar plano
```

---

### `pagia update`
Sincroniza tarefas.

```bash
pagia update todos          # Sincronizar todas as tarefas
pagia update analyze        # Analisar com IA
```

---

## Gestão de Agentes

### `pagia agent`
Gerencia agentes PAGIA.

```bash
pagia agent list            # Listar agentes
pagia agent create          # Criar agente
pagia agent run <nome>      # Executar agente
pagia agent info <nome>     # Informações do agente
```

---

## Funcionalidades Avançadas

### `pagia bundle`
Empacota agentes para web.

```bash
pagia bundle create              # Criar bundle interativo
pagia bundle create -p chatgpt   # Para ChatGPT
pagia bundle create -p claude    # Para Claude
pagia bundle create -p gemini    # Para Gemini
pagia bundle validate <arquivo>  # Validar bundle
pagia bundle platforms           # Listar plataformas
```

---

### `pagia knowledge` (alias: `kb`)
Gerencia base de conhecimento.

```bash
pagia knowledge add <arquivo>     # Adicionar documento
pagia knowledge add <dir> -r      # Adicionar diretório
pagia knowledge search <query>    # Buscar
pagia knowledge list              # Listar documentos
pagia knowledge stats             # Estatísticas
pagia knowledge remove <id>       # Remover documento
pagia knowledge clear             # Limpar tudo
```

---

### `pagia mcp`
Gerencia servidor MCP.

```bash
pagia mcp start              # Iniciar servidor
pagia mcp start -p 3100      # Porta específica
pagia mcp status             # Verificar status
pagia mcp tools              # Listar ferramentas
pagia mcp resources          # Listar recursos
pagia mcp config cursor      # Config para Cursor
pagia mcp config vscode      # Config para VS Code
```

---

### `pagia tdd`
Workflow de Test-Driven Development.

```bash
pagia tdd wizard                   # Assistente interativo
pagia tdd start <requisito>        # Iniciar ciclo TDD
pagia tdd implement <teste>        # Gerar implementação
pagia tdd refactor <código>        # Refatorar
pagia tdd generate <código>        # Gerar testes
pagia tdd edge-cases <código>      # Sugerir edge cases
```

---

### `pagia registry` (alias: `reg`)
Gerencia módulos.

```bash
pagia registry search <query>      # Buscar módulos
pagia registry install <módulo>    # Instalar
pagia registry uninstall <módulo>  # Desinstalar
pagia registry list                # Listar instalados
pagia registry create <nome>       # Criar módulo
pagia registry validate <path>     # Validar módulo
pagia registry publish <path>      # Publicar
```

---

### `pagia conductor` (alias: `cdr`)
Context-Driven Development.

```bash
pagia conductor setup              # Configurar projeto
pagia conductor track <desc>       # Nova track
pagia conductor implement          # Implementar tarefa
pagia conductor status             # Ver status
pagia conductor checkpoint         # Criar checkpoint
pagia conductor revert             # Reverter trabalho
pagia conductor chat               # Chat interativo
```

---

## Exemplos de Uso

### Fluxo Básico

```bash
# 1. Inicializar
pagia init

# 2. Criar plano com IA
pagia plan create --ai

# 3. Verificar status
pagia status

# 4. Sincronizar tarefas
pagia update todos
```

### Workflow TDD

```bash
# 1. Iniciar ciclo TDD
pagia tdd start "Função de validação de email"

# 2. Implementar código
pagia tdd implement ./tests/email.spec.ts

# 3. Refatorar
pagia tdd refactor ./src/email.ts
```

### Context-Driven Development

```bash
# 1. Setup inicial
pagia conductor setup

# 2. Criar track
pagia conductor track "Implementar autenticação"

# 3. Implementar
pagia conductor implement

# 4. Verificar
pagia conductor checkpoint
```

---

[← Voltar](index.md)
