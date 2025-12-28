# MCP Tools Integration - PAGIA Skills

## Visão Geral

O sistema de Skills do PAGIA agora suporta **MCP (Model Context Protocol) Tools**, permitindo que skills executem ações no sistema, leiam arquivos, façam buscas web e muito mais.

## O que são MCP Tools?

MCP Tools são ferramentas que estendem as capacidades de uma skill além de apenas processar texto. Elas permitem:

- 📁 **File System**: Ler arquivos, listar diretórios
- 🌐 **Web**: Buscar informações online
- 🔍 **Code Analysis**: Analisar código e métricas
- 🛠️ **Custom Tools**: Criar suas próprias ferramentas

## Ferramentas Disponíveis

### File System Tools

| Tool | Descrição | Parâmetros |
|------|-----------|------------|
| `read_file` | Lê conteúdo de arquivo | `path: string` |
| `list_directory` | Lista arquivos em diretório | `path: string` |

### Code Analysis Tools

| Tool | Descrição | Parâmetros |
|------|-----------|------------|
| `analyze_code` | Analisa código | `code: string, language?: string` |

### Web Tools

| Tool | Descrição | Parâmetros |
|------|-----------|------------|
| `web_search` | Busca na web | `query: string` |

## Usando MCP Tools em Skills

### 1. Declarar Tools no Frontmatter

```yaml
---
name: minha-skill
description: Skill com MCP tools
tools:
  - read_file
  - list_directory
  - analyze_code
---
```

### 2. Instruções para o Modelo

No corpo da skill, instrua o modelo sobre como usar as ferramentas:

```markdown
## Ferramentas Disponíveis

Você tem acesso às seguintes ferramentas MCP:

- **read_file**: Lê arquivos do sistema
- **list_directory**: Lista conteúdo de diretórios
- **analyze_code**: Analisa métricas de código

Use essas ferramentas quando necessário para completar a tarefa.
```

## Exemplo Completo

### Skill com MCP Tools

```markdown
---
name: project-auditor
description: Audita projetos usando MCP tools
tools:
  - read_file
  - list_directory
  - analyze_code
---

# Project Auditor

Você é um auditor de projetos que usa ferramentas MCP.

## Processo

1. Use `list_directory` para ver estrutura
2. Use `read_file` para ler arquivos importantes
3. Use `analyze_code` para métricas
4. Forneça relatório completo
```

### Executando

```bash
pagia skill run project-auditor -p "Audite o projeto em ./meu-projeto"
```

## API Programática

### Registrar Nova Ferramenta

```typescript
import { mcpToolsManager } from './skills/mcp-integration.js';

// Registrar ferramenta customizada
mcpToolsManager.registerTool(
    {
        name: 'my_custom_tool',
        description: 'Minha ferramenta customizada',
        inputSchema: {
            type: 'object',
            properties: {
                input: { type: 'string' }
            },
            required: ['input']
        }
    },
    async (args) => {
        // Implementação
        return {
            content: `Resultado: ${args.input}`
        };
    }
);
```

### Executar Ferramenta

```typescript
import { mcpToolsManager } from './skills';

const result = await mcpToolsManager.executeTool({
    tool: 'read_file',
    arguments: { path: './package.json' }
});

console.log(result.content);
```

### Verificar Tools de uma Skill

```typescript
import { skillRegistry, mcpToolsManager } from './skills';

const skill = skillRegistry.loadSkillFromFile('./my-skill');

if (mcpToolsManager.canUseTools(skill.frontmatter)) {
    const tools = mcpToolsManager.getAllowedTools(skill.frontmatter);
    console.log('Tools disponíveis:', tools.map(t => t.name));
}
```

## Segurança

### Restrições

- Skills só podem usar tools declaradas no frontmatter
- Acesso ao file system é limitado
- Operações perigosas requerem confirmação

### Sandbox

As ferramentas MCP rodam em um ambiente controlado:
- Sem acesso a arquivos do sistema fora do projeto
- Rate limiting para operações web
- Timeout para operações longas

## Criando Tools Customizadas

### 1. Definir Interface

```typescript
interface MyToolArgs {
    param1: string;
    param2: number;
}
```

### 2. Implementar Handler

```typescript
async function handleMyTool(args: MyToolArgs): Promise<MCPToolResult> {
    try {
        // Sua lógica aqui
        const result = processData(args.param1, args.param2);
        
        return {
            content: JSON.stringify(result)
        };
    } catch (error) {
        return {
            content: error.message,
            isError: true
        };
    }
}
```

### 3. Registrar

```typescript
mcpToolsManager.registerTool(
    {
        name: 'my_tool',
        description: 'Descrição da ferramenta',
        inputSchema: {
            type: 'object',
            properties: {
                param1: { type: 'string' },
                param2: { type: 'number' }
            },
            required: ['param1']
        }
    },
    handleMyTool
);
```

## Skills com MCP Tools

### Exemplos Incluídos

| Skill | Tools Usadas |
|-------|--------------|
| `file-analyzer` | `read_file`, `list_directory`, `analyze_code` |

### Criar Nova Skill com Tools

```bash
# Criar skill
pagia skill create my-tool-skill

# Editar SKILL.md
# Adicionar tools no frontmatter
# Instruir modelo sobre uso das tools

# Validar
pagia skill validate .pagia/skills/my-tool-skill

# Testar
pagia skill run my-tool-skill -p "teste"
```

## Roadmap

- [ ] Mais ferramentas built-in
- [ ] Integração com APIs externas
- [ ] Tool marketplace
- [ ] Sandbox mais robusto
- [ ] Ferramentas de database
- [ ] Ferramentas de deployment
