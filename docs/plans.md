# Plans and Examples

This page documents the plan files used by the `pagia update todos` workflow and where to place them.

## Folder layout

- `.pagia/plans/global/` — high-level roadmaps and cross-cutting initiatives (one file per roadmap).
- `.pagia/plans/stages/` — stage-based plans (e.g., onboarding, releases).
- `.pagia/plans/prompts/` — reusable prompt templates used by agents and planners.
- `.pagia/plans/ai/` — AI-specific plan artifacts and model configuration notes.

## Minimal plan schema (examples)

Global plan example (YAML):

```yaml
name: sample-global
description: "Global roadmap and high-level initiatives for the project"
tasks:
  - id: g1
    title: "Define project vision"
    status: pending
    assignee: product-owner
```

Stages plan example:

```yaml
name: onboarding
stages:
  - id: stage-1
    title: "First week"
    tasks:
      - id: t1
        title: "Read contributor docs"
        status: completed
```

Prompts plan example (templates):

```yaml
name: sample-prompts
prompts:
  - id: p1
    name: "create-plan"
    template: "Given the project brief: {{brief}}, create a staged plan with tasks, owners, and estimates."
```

AI plan example (model notes and tasks):

```yaml
name: sample-ai
models:
  - id: m1
    name: "assistant-config"
    model: "raptor-mini"
    prompt: "You are an assistant that helps maintain project plans."
```

## Conventions

- Use `id` for stable references between tasks and dependencies.
- Include `assignee` when known. Accept common statuses: `pending`, `in-progress`, `blocked`, `completed`.
- Keep prompts small and parameterized for reuse by agents.

## Example files included

This repository includes example plan files under `.pagia/plans/{global,stages,prompts,ai}` to serve as templates for contributors and agents.

---

If you'd like, I can extend the examples with more complex fields (estimates, tags, owners, or cross-file references) and add a generator command (`pagia plan generate`) to create new plan templates interactively.

## CLI helper: `pagia plan generate`

Use `pagia plan generate` to scaffold a new plan from an existing template or generate a minimal plan scaffold.

Examples:

- Generate from template (custom name): `pagia plan generate -t stage -n "Onboarding" --template tpl-one -y`
- Generate from template (use template-derived name): `pagia plan generate -t stage --template tpl-one -y`
- Scaffold minimal: `pagia plan generate -t global -n "Roadmap 2026" -y`
- Generate and open in editor: `pagia plan generate -t stage --template tpl-one -y --open`

## List templates: `pagia plan list-templates`
pagia 
Examples:

- List all templates: `pagia plan list-templates`
- List only stage templates: `pagia plan list-templates -t stages`
- List with details: `pagia plan list-templates --verbose` (shows `name`, `description` and `createdAt` when present)

## Install template: `pagia plan install-template <name>`

Instala um template existente (de `.pagia/plans/*`) no diretório atual ou em um diretório alvo.

Opções:
- `-t, --type <type>` — filtra pelo tipo (global, stages, prompts, ai)
- `-n, --name <name>` — nome do plano/arquivo gerado (sem .yaml)
- `--target <dir>` — diretório de destino (default: diretório atual)
- `--force` — sobrescrever arquivo de destino se já existir
- `--open` — abrir arquivo gerado no editor (usa $EDITOR ou code)
- `--dry-run` — mostrar o caminho e o que seria feito sem escrever arquivos

Exemplos:
- Instalar template para o diretório atual: `pagia plan install-template web-app-mvp`
- Instalar em um diretório alvo com nome customizado: `pagia plan install-template web-app-mvp -t stages -n "MVP" --target ./plans`
- Instalar e forçar sobrescrita: `pagia plan install-template web-app-mvp --force`
- Instalar e abrir no editor: `pagia plan install-template web-app-mvp --open`
