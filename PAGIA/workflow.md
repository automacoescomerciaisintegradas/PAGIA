# Workflow de Desenvolvimento

## Fluxo de Trabalho da Tarefa

### 1. Seleção e Análise
- Identificar a próxima tarefa no `plan.md`.
- Analisar a `spec.md` para entender os requisitos.

### 2. Implementação TDD (Red-Green-Refactor)
- **Red**: Criar testes que falham para a funcionalidade.
- **Green**: Implementar o código mínimo necessário para passar nos testes.
- **Refactor**: Melhorar o código mantendo os testes passando.

### 3. Validação e Registro
- Executar testes de integração.
- Atualizar o status no `plan.md` com o SHA do commit ou status `[x]`.

## Padrões de Código
- Nomenclatura CamelCase para variáveis e funções.
- Comentários JSDoc para documentação de funções.
- Commits seguindo Conventional Commits.
