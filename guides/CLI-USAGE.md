# Uso da CLI do PAGIA

Este guia descreve como utilizar a interface de linha de comando do PAGIA para automação de builds, gerenciamento de especificações e fluxos de trabalho autônomos.

## Operação Headless e CI/CD

Para fluxos de trabalho automatizados, navegue até o diretório do backend:

```bash
cd apps/backend
```

### 1. Criar uma Especificação
Inicie a criação de uma spec interativa para definir um novo conjunto de tarefas ou recursos:

```bash
python spec_runner.py --interactive
```

### 2. Executar Build Autônomo
Inicie um agente para executar as tarefas definidas em uma especificação:

```bash
python run.py --spec 001
```

### 3. Revisar e Mesclar
Após a conclusão do trabalho pelo agente, você pode revisar as alterações e realizar o merge:

```bash
# Revisar alterações
python run.py --spec 001 --review

# Mesclar ao código principal
python run.py --spec 001 --merge
```

## Recursos da CLI

- **Interatividade**: Assistente passo a passo para novas tarefas.
- **Autonomia**: Agentes que executam código, rodam testes e corrigem erros automaticamente.
- **Integração**: Pronto para uso em pipelines de Integração Contínua.

---
*Documentação inspirada no framework BMAD.*
