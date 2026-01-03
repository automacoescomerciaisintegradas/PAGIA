# Spec 002: Conductor Core e Gestão de Tarefas

## Objetivo
Implementar o motor central ("Conductor") responsável por ler especificações de trilhas e transformá-las em um plano de ação executável, integrando a camada de memória e automação.

## Requisitos Funcionais
1. **Leitor de Spec**: O sistema deve ser capaz de ler arquivos markdown em `/guides/PAGIA/tracks/` e extrair as tarefas.
2. **Persistence**: Salvar o estado das tarefas em um arquivo `tasks.json` na raiz do projeto (ou `.pagia/`).
3. **Dispatcher**: O `run.py` deve conseguir ler esse `tasks.json` para executar o progresso da Spec.
4. **Interface**: O Dashboard na aba Kanban deve refletir o conteúdo real desse arquivo JSON.

## Arquitetura
- **Python Backend**: Classes `Conductor` e `TaskManager`.
- **API (Node.js)**: Endpoint para servir o `tasks.json` para a Interface Premium.
- **Workflow**: 
  - Usuário clica em "Disparar Automação".
  - `run.py` invoca o `Conductor`.
  - `Conductor` lê a Spec, valida e atualiza o `tasks.json`.
  - Interface atualiza o Kanban via Socket.io.

## Critérios de Aceite
- Ao rodar `python run.py --spec 002`, o sistema deve identificar as tarefas descritas neste documento.
- O arquivo `tasks.json` deve ser criado/atualizado automaticamente.
- O Maestro deve confirmar a sincronização da memória.
