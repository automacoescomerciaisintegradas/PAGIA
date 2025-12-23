---
layout: default
title: Conductor
---

# 🎭 Conductor - Context-Driven Development

O **Conductor** é um agente que implementa o paradigma de **Desenvolvimento Orientado por Contexto**, inspirado no [Gemini CLI Conductor](https://github.com/gemini-cli-extensions/conductor).

---

## Filosofia

> "Measure twice, code once" (Meça duas vezes, codifique uma)

O Conductor transforma seu projeto em uma **fonte única de verdade** que guia todas as interações com IA.

---

## Ciclo de Vida

```
Contexto → Spec & Plan → Implement (TDD)
```

1. **Context** - Definir produto, tech stack, workflow
2. **Spec & Plan** - Criar especificação e plano detalhado
3. **Implement** - Implementar seguindo TDD rigoroso

---

## Setup Inicial

```bash
pagia conductor setup
```

Este comando cria a estrutura de contexto:

```
.pagia/conductor/
├── product.md              # Definição do produto
├── product-guidelines.md   # Guidelines de marca
├── tech-stack.md           # Stack técnica
├── workflow.md             # Processos de trabalho
├── tracks.md               # Lista de tracks
├── tracks/                 # Diretório de tracks
└── code_styleguides/       # Guias de estilo
```

---

## Artefatos de Contexto

### product.md

Define o produto:
- Nome e descrição
- Objetivos e metas
- Usuários-alvo
- Features principais

### product-guidelines.md

Guidelines de marca:
- Tom de voz
- Identidade visual
- Padrões de UX
- Mensagens

### tech-stack.md

Stack técnica:
- Linguagens
- Frameworks
- Banco de dados
- Ferramentas

### workflow.md

Processos de trabalho:
- Estratégia de commits
- Padrões de branch
- Processo de review
- Práticas de TDD

---

## Trabalhando com Tracks

### Criar Nova Track

```bash
pagia conductor track "Implementar autenticação OAuth"
```

Isso cria:
```
tracks/<track-id>/
├── spec.md           # Especificação detalhada
├── plan.md           # Plano de implementação
└── metadata.json     # Metadados da track
```

### Implementar Tarefas

```bash
pagia conductor implement
```

O Conductor segue o workflow TDD:

1. **[ ]** Selecionar próxima tarefa
2. **[~]** Marcar como em progresso
3. 🔴 **Red** - Escrever testes que falham
4. 🟢 **Green** - Implementar código mínimo
5. 🔵 **Refactor** - Melhorar mantendo testes verdes
6. **[x]** Marcar como completo com SHA

### Verificar Status

```bash
pagia conductor status
```

---

## Formato do Plan

```markdown
# Plano de Implementação

## Fase 1: Setup
- [ ] Configurar ambiente
- [ ] Instalar dependências
- [ ] Criar estrutura de arquivos

## Fase 2: Implementação
- [~] Criar modelo de usuário <!-- em progresso -->
- [ ] Implementar autenticação
- [x] Configurar banco de dados <!-- abc1234 -->

## Fase 3: Testes
- [ ] Testes unitários
- [ ] Testes de integração
```

**Legenda:**
- `[ ]` - Pendente
- `[~]` - Em progresso
- `[x]` - Completo (com SHA do commit)

---

## Checkpoints

```bash
pagia conductor checkpoint
```

Cria um checkpoint de verificação que inclui:
1. Execução de testes automatizados
2. Verificação manual guiada
3. Commit de checkpoint com git notes

---

## Reverter Trabalho

```bash
pagia conductor revert
```

Permite reverter:
- Uma tarefa específica
- Uma fase completa
- Uma track inteira

---

## Princípios Guia

1. **O Plano é a Fonte da Verdade**
   - Todo trabalho deve ser rastreado no plan.md

2. **O Tech Stack é Deliberado**
   - Mudanças devem ser documentadas ANTES

3. **Test-Driven Development**
   - Escreva testes antes de implementar

4. **Alta Cobertura de Código**
   - Almeje >80% de cobertura

5. **Experiência do Usuário Primeiro**
   - Priorize UX em cada decisão

---

## Exemplo Completo

```bash
# 1. Setup do projeto
pagia conductor setup

# 2. Criar feature
pagia conductor track "Sistema de login com OAuth"

# 3. Implementar seguindo TDD
pagia conductor implement

# 4. Verificar progresso
pagia conductor status

# 5. Checkpoint de fase
pagia conductor checkpoint

# 6. Continuar implementando
pagia conductor implement
```

---

## Integração com Git

O Conductor usa Git Notes para rastrear:
- Tarefas completadas
- Checkpoints de verificação
- Histórico de decisões

```bash
# Ver notas de um commit
git notes show <commit-sha>
```

---

[← Voltar](index.md)
