# 🚀 PAGIA v2.0 - Roadmap de Features

## Inspiração
- [Claude Code Plugins](https://github.com/anthropics/claude-code/blob/main/plugins/README.md)
- [Microsoft 365 Agents Toolkit CLI](https://github.com/MicrosoftDocs/msteams-docs/blob/main/msteams-platform/toolkit/Microsoft-365-Agents-Toolkit-CLI.md)

---

## 📦 1. Publicação npm Global

### Objetivo
```bash
npm install -g pagia
pagia --version
```

### Tarefas
- [ ] Fazer login no npm (`npm login`)
- [ ] Verificar/atualizar nome do pacote (`pagia` ou `@aci/pagia`)
- [ ] Publicar com `npm publish --access public`
- [ ] Testar instalação global em outro computador

---

## 🔌 2. Sistema de Plugins (Inspirado no Claude Code)

### Estrutura
```
~/.pagia/plugins/
├── code-review/
│   ├── plugin.json
│   ├── commands/
│   │   └── review.ts
│   └── agents/
│       └── reviewer.md
├── security-guidance/
│   ├── plugin.json
│   └── hooks/
│       └── pre-tool-use.ts
└── feature-dev/
    ├── plugin.json
    ├── commands/
    │   └── feature-dev.ts
    └── agents/
        ├── code-explorer.md
        ├── code-architect.md
        └── code-reviewer.md
```

### Comandos
```bash
pagia plugin install <nome>        # Instalar plugin
pagia plugin list                  # Listar plugins instalados
pagia plugin create <nome>         # Criar novo plugin
pagia plugin remove <nome>         # Remover plugin
pagia plugin update                # Atualizar todos os plugins
```

### Plugin Manifest (plugin.json)
```json
{
  "name": "code-review",
  "version": "1.0.0",
  "description": "Automated PR code review",
  "author": "ACI",
  "commands": [
    {
      "name": "/code-review",
      "description": "Automated PR review workflow",
      "handler": "./commands/review.js"
    }
  ],
  "agents": [
    {
      "name": "code-reviewer",
      "file": "./agents/reviewer.md"
    }
  ],
  "hooks": [
    {
      "event": "PreToolUse",
      "handler": "./hooks/pre-tool-use.js"
    }
  ]
}
```

---

## 🎯 3. Sistema de Slash Commands

### Comandos Globais
```
/help              - Mostrar ajuda
/analyze           - Analisar código/contexto
/review            - Code review
/test              - Gerar testes
/doc               - Gerar documentação
/refactor          - Refatorar código
/optimize          - Otimizar performance
/security          - Análise de segurança
/plan              - Criar plano de ação
/sprint            - Planejar sprint
```

### Implementação
```bash
pagia run "/review PR #123"
pagia run "/test src/utils.ts"
pagia run "/security scan ./src"
```

---

## 🪝 4. Sistema de Hooks

### Tipos de Hooks
| Hook | Descrição |
|------|-----------|
| `SessionStart` | Executado ao iniciar uma sessão |
| `SessionEnd` | Executado ao finalizar uma sessão |
| `PreToolUse` | Antes de executar uma ferramenta |
| `PostToolUse` | Depois de executar uma ferramenta |
| `PreAgentRun` | Antes de executar um agente |
| `PostAgentRun` | Depois de executar um agente |
| `OnError` | Quando ocorre um erro |

### Exemplo de Hook
```typescript
// hooks/security-check.ts
export default {
  event: 'PreToolUse',
  patterns: ['eval(', 'dangerouslySetInnerHTML', 'os.system('],
  handler: async (context) => {
    if (context.code.includes('eval(')) {
      return {
        warn: true,
        message: '⚠️ Uso de eval() detectado. Considere alternativas mais seguras.'
      };
    }
    return { continue: true };
  }
};
```

---

## 🤖 5. Skills (Competências)

### Conceito
Skills são conhecimentos especializados que agentes podem usar automaticamente.

### Skills Padrão
```yaml
skills:
  - frontend-design
  - api-design
  - database-modeling
  - testing-strategy
  - security-best-practices
  - performance-optimization
  - documentation
  - git-workflow
```

### Comando
```bash
pagia skill list              # Listar skills disponíveis
pagia skill add <nome>        # Adicionar skill ao projeto
pagia skill create <nome>     # Criar nova skill
```

---

## 💻 6. Comandos Inspirados no Microsoft Agents Toolkit

### Estrutura de Comandos
```bash
# Diagnóstico
pagia doctor                  # Verificar pré-requisitos

# Gestão de Projetos
pagia new                     # Criar novo projeto/app
pagia add <feature>           # Adicionar feature ao projeto

# Ambiente
pagia env list                # Listar ambientes
pagia env add <nome>          # Adicionar ambiente
pagia env switch <nome>       # Trocar ambiente

# Deploy
pagia deploy                  # Deploy do projeto
pagia preview                 # Preview local

# Atualização
pagia update                  # Atualizar projeto
pagia upgrade                 # Upgrade do PAGIA

# Validação
pagia validate                # Validar projeto
pagia test                    # Executar testes
```

---

## 🌐 7. MCP Server Integrado

### Recursos Atuais
- ✅ Servidor MCP HTTP + WebSocket
- ✅ Ferramentas de planos
- ✅ Integração n8n

### Novos Recursos
- [ ] MCP como plugin
- [ ] Ferramentas dinâmicas baseadas em plugins
- [ ] SSE (Server-Sent Events) para streaming
- [ ] Integração com IDE (VS Code, Cursor, Neovim)

---

## 📊 8. Analytics e Métricas

### Dashboard Local
```bash
pagia analytics               # Mostrar dashboard
pagia analytics export        # Exportar métricas
```

### Métricas
- Tokens usados por agente
- Tempo de resposta
- Taxa de sucesso
- Uso por comando/agente

---

## 🔐 9. Segurança

### Features
- [ ] Hooks de segurança pré-configurados
- [ ] OWASP Top 10 checks
- [ ] Secret scanning
- [ ] Dependency audit

---

## 📅 Cronograma Sugerido

| Fase | Features | Prazo |
|------|----------|-------|
| **v1.5** | Publicação npm + Doctor + Upgrade | 1 semana |
| **v2.0** | Sistema de Plugins base | 2 semanas |
| **v2.1** | Slash Commands + Hooks | 1 semana |
| **v2.2** | Skills + MCP melhorado | 1 semana |
| **v2.5** | Analytics + Segurança | 2 semanas |

---

## 🎯 Próximos Passos Imediatos

1. **Publicar no npm** - Fazer login e publicar
2. **Adicionar `pagia doctor`** - Verificar pré-requisitos
3. **Criar estrutura de plugins** - Base do sistema
4. **Implementar hooks básicos** - SessionStart, PreToolUse
