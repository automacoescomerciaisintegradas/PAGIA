---
name: github-issue-planner
description: Analisa as issues do GitHub e as classifica por dificuldade.
---
# GitHub Issue Planner

Este workflow deve ser utilizado para triagem e planejamento de novas funcionalidades ou correções a partir das issues do GitHub.

1. **Acesso às Fontes**: Acesse a lista de issues do repositório:
   - [https://github.com/automacoescomerciaisintegradas/PAGIA/issues](https://github.com/automacoescomerciaisintegradas/skills/issues)

2. **Análise de Issues**:
   - Para cada issue aberta, analise a descrição e os requisitos.
   - Classifique o nível de dificuldade em: **Fácil**, **Médio** ou **Difícil**.

3. **Geração de Relatório**:
   - Crie uma tabela Markdown contendo as seguintes colunas:
     - **Issue**: Título (com link para a issue).
     - **Abertura**: Data em que a issue foi criada.
     - **Classificação**: O nível de dificuldade atribuído.
     - **Atribuída**: Sim ou Não.
     - **Responsável**: Nome do usuário atribuído (se houver).
     - **Estimativa de Tempo**: Para a implementação de cada issue baseada na dificuldade e complexidade.

4. **Armazenamento**:
   - Salve o relatório no diretório `docs/planning/`.
   - Use o nome do arquivo `planejamento-issues-[DATA].md` (ex: `planejamento-issues-2026-01-07.md`).

5. **Finalização**: Informe ao usuário o caminho do arquivo gerado e peça para ele revisar as estimativas.
