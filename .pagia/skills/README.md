# PAGIA Skills

Sistema de habilidades (Skills) para PAGIA, baseado no formato [Anthropic Skills](https://github.com/anthropics/skills).

## O que são Skills?

Skills são instruções estruturadas que transformam um LLM em um especialista em uma área específica. Cada skill contém:

- **Frontmatter YAML**: Metadados da skill (nome, descrição, tags)
- **Instruções**: Diretrizes de comportamento para o modelo
- **Exemplos**: Casos de uso e formatos de resposta

## Estrutura de uma Skill

```
my-skill/
├── SKILL.md      # Arquivo principal (obrigatório)
├── README.md     # Documentação (opcional)
└── examples/     # Exemplos de uso (opcional)
```

### Formato do SKILL.md

```markdown
---
name: skill-name
description: Descrição da skill em até 1024 caracteres
version: 1.0.0
author: Seu Nome
tags:
  - tag1
  - tag2
model:
  provider: ollama
  name: gemma2
---

# Título da Skill

## Quando usar

Descrição de quando usar esta skill.

## Instruções

Instruções detalhadas para o modelo seguir.
```

## Validação

O nome da skill deve:
- Ter no máximo **64 caracteres**
- Conter apenas **letras minúsculas, números e hífens**
- Não conter **tags XML**
- Não conter palavras reservadas: "anthropic", "claude", "openai", "gpt", "google", "gemini"

A descrição deve:
- Ser **não vazia**
- Ter no máximo **1024 caracteres**
- Não conter **tags XML**

## Comandos CLI

```bash
# Listar skills
pagia skill list

# Criar nova skill
pagia skill create my-new-skill

# Validar skill
pagia skill validate ./path/to/skill

# Instalar skill
pagia skill install ./path/to/skill
pagia skill install https://github.com/user/skill-repo

# Executar skill
pagia skill run skill-name
pagia skill run skill-name -p "Minha pergunta"

# Executar com Ollama local
pagia skill run skill-name --ollama --ollama-model gemma2

# Informações da skill
pagia skill info skill-name

# Habilitar/Desabilitar
pagia skill toggle skill-name

# Desinstalar
pagia skill uninstall skill-name

# Buscar skills
pagia skill search "docker"
```

## Skills Incluídas

| Skill | Descrição |
|-------|-----------|
| `code-review` | Revisão de código com foco em qualidade e segurança |
| `docker-expert` | Especialista em Docker e containers |
| `api-designer` | Design de APIs RESTful e GraphQL |
| `sql-optimizer` | Otimização de queries SQL e performance |
| `git-workflow` | Git, branching e workflows colaborativos |
| `ollama-gemma-assistant` | Assistente local com Ollama/Gemma2 |

## Usando com Ollama Local

Se você tem o container `automacoescomerciais/ollama-gemma2:latest`:

```bash
# Iniciar container
docker run -d --name ollama -p 11434:11434 automacoescomerciais/ollama-gemma2:latest

# Executar skill com Ollama
pagia skill run docker-expert --ollama --ollama-model gemma2
```

## Criando sua Skill

1. **Criar estrutura**
   ```bash
   pagia skill create minha-skill
   ```

2. **Editar SKILL.md** com suas instruções

3. **Validar**
   ```bash
   pagia skill validate .pagia/skills/minha-skill
   ```

4. **Testar**
   ```bash
   pagia skill run minha-skill -p "Teste"
   ```

## Formato de Resposta

Recomendamos que suas skills incluam um formato de resposta estruturado:

```markdown
## Formato de Resposta

```
## 🎯 Título

[Conteúdo principal]

## 💡 Detalhes

[Informações adicionais]
```
```

Isso garante respostas consistentes e fáceis de processar.

## Referências

- [Anthropic Skills](https://github.com/anthropics/skills)
- [Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [PAGIA Documentation](../docs/)
