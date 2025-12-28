# PAGIA Skills - Documentação Completa

## Visão Geral

O sistema de Skills do PAGIA permite criar, gerenciar e executar habilidades especializadas de IA. Baseado no formato [Anthropic Skills](https://github.com/anthropics/skills), oferece uma forma estruturada de definir comportamentos específicos para modelos de linguagem.

## Arquitetura

```
src/
├── skills/
│   ├── index.ts              # Exportações
│   └── skill-registry.ts     # Registro e gerenciamento
├── commands/
│   └── skill.ts              # Comando CLI
└── ...

.pagia/
└── skills/
    ├── README.md
    ├── installed.json        # Skills instaladas
    ├── code-review/
    │   └── SKILL.md
    ├── docker-expert/
    │   └── SKILL.md
    └── ...
```

## Formato SKILL.md

### Frontmatter YAML (Obrigatório)

```yaml
---
name: skill-name              # max 64 chars, lowercase+hyphens
description: Descrição        # max 1024 chars, não vazio
version: 1.0.0               # semver recomendado
author: Nome                 # opcional
tags:                        # opcional
  - tag1
  - tag2
dependencies:                # opcional, outras skills necessárias
  - other-skill
model:                       # opcional, configuração de modelo
  provider: ollama
  name: gemma2
  endpoint: http://localhost:11434
tools:                       # opcional, ferramentas MCP
  - file_read
  - file_write
resources:                   # opcional, recursos MCP
  - project_files
---
```

### Corpo Markdown (Instruções)

Após o frontmatter, todo o conteúdo Markdown é considerado as "instruções" da skill. Estas instruções são passadas como system prompt para o modelo de IA.

## Validação

### Regras do Nome

1. **Máximo 64 caracteres**
2. **Apenas lowercase, números e hífens**: `/^[a-z0-9]+(-[a-z0-9]+)*$/`
3. **Sem tags XML**: Não pode conter `<tag>`
4. **Palavras reservadas proibidas**:
   - anthropic
   - claude
   - openai
   - gpt
   - google
   - gemini

### Regras da Descrição

1. **Não pode ser vazia**
2. **Máximo 1024 caracteres**
3. **Sem tags XML**

## API do SkillRegistry

```typescript
import { skillRegistry, Skill, InstalledSkill } from './skills';

// Configurar caminho
skillRegistry.setSkillsPath('.pagia/skills');

// Validar
const validation = skillRegistry.validate('./path/to/skill');
console.log(validation.valid, validation.errors, validation.warnings);

// Validar nome
const nameResult = skillRegistry.validateName('my-skill-name');

// Validar descrição
const descResult = skillRegistry.validateDescription('Minha descrição');

// Listar skills
const skills: Skill[] = skillRegistry.listSkills();

// Instalar
const installed = await skillRegistry.installFromLocal('./path/to/skill');
const fromGH = await skillRegistry.installFromGitHub('https://github.com/...');

// Gerenciar instaladas
const allInstalled = skillRegistry.listInstalled({ enabled: true });
skillRegistry.enable('skill-name');
skillRegistry.disable('skill-name');
await skillRegistry.uninstall('skill-name');

// Criar scaffold
const path = await skillRegistry.scaffold('my-new-skill', {
    description: 'Minha skill',
    author: 'Eu',
    tags: ['test']
});

// Obter instruções
const instructions = skillRegistry.getInstructions('skill-name');

// Buscar
const results = skillRegistry.search('docker');
```

## Integração com IA

Skills são executadas passando as instruções como system prompt:

```typescript
import { createAIService } from './core/ai-service';

const skill = skillRegistry.getInstalled('my-skill');
const aiService = createAIService(config);

const response = await aiService.generate(
    userPrompt,
    skill.instructions  // System prompt da skill
);
```

## Suporte a Ollama

Para usar com Ollama local:

```bash
# Via CLI
pagia skill run skill-name --ollama --ollama-model gemma2

# Container Docker
docker run -d -p 11434:11434 automacoescomerciais/ollama-gemma2:latest
```

Na skill, configure o modelo:

```yaml
model:
  provider: ollama
  name: gemma2
  endpoint: http://localhost:11434
```

## Criando Skills Efetivas

### Estrutura Recomendada

```markdown
---
name: my-skill
description: Uma linha clara do que a skill faz
---

# Título

Breve introdução.

## Quando usar esta Skill

Lista de casos de uso.

## Instruções

Diretrizes detalhadas para o modelo.

### Processo

1. Passo 1
2. Passo 2
3. Passo 3

### Formato de Resposta

```
Template de resposta estruturada
```

### Melhores Práticas

- Prática 1
- Prática 2

## Exemplos

### Exemplo 1

Input/Output esperado.
```

### Dicas de Prompt Engineering

1. **Seja específico**: Evite instruções vagas
2. **Use estrutura**: Markdown headings ajudam
3. **Defina formato**: Especifique como a resposta deve ser
4. **Inclua exemplos**: Few-shot learning melhora resultados
5. **Liste restrições**: O que o modelo NÃO deve fazer

## Comandos Completos

```bash
# Listar
pagia skill list              # Todas as skills
pagia skill list --installed  # Apenas instaladas
pagia skill list --enabled    # Apenas habilitadas

# Criar
pagia skill create [name]
pagia skill create my-skill -d "Descrição" -a "Autor" -t "tag1,tag2"

# Validar
pagia skill validate ./path

# Instalar
pagia skill install ./local/path
pagia skill install https://github.com/user/repo

# Executar
pagia skill run name
pagia skill run name -p "Prompt direto"
pagia skill run name --ollama
pagia skill run name --model gpt-4o

# Gerenciar
pagia skill info name
pagia skill toggle name
pagia skill uninstall name

# Buscar
pagia skill search "query"
```

## Roadmap

- [ ] Publicação em registry central
- [ ] Composição de skills (dependências)
- [ ] Skills com ferramentas MCP
- [ ] Versionamento e updates
- [ ] Testes automatizados de skills
