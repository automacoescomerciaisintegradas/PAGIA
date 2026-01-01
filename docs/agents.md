---
layout: default
title: Agentes
---

# 🤖 Agentes PAGIA

Os agentes são componentes inteligentes que executam tarefas específicas usando IA.

---

## Agentes Especializados

### 💻 Code Optimizer

**Descrição:** Análise e otimização de código

**Capacidades:**
- Análise de código
- Otimização de performance
- Refatoração
- Detecção de code smells
- Análise de complexidade
- Revisão de segurança

**Comandos:**
```
/analyze     - Análise completa
/optimize    - Otimizar performance
/refactor    - Refatorar legibilidade
/security    - Análise de segurança
/complexity  - Análise de complexidade
```

**Uso via CLI:**
```bash
pagia agent run code-optimizer
```

---

### 📋 Planner Agent

**Descrição:** Planejamento e decomposição de tarefas

**Capacidades:**
- Planejamento estratégico
- Decomposição de tarefas
- Estimativa de esforço
- Identificação de riscos
- Análise de dependências
- Criação de roadmaps

**Comandos:**
```
/plan       - Criar plano de ação
/decompose  - Decompor em tarefas
/estimate   - Estimar esforço
/risks      - Análise de riscos
/roadmap    - Criar roadmap
/sprint     - Planejar sprint
```

---

### 🧪 Tester Agent

**Descrição:** TDD e geração de testes

**Capacidades:**
- Geração de testes unitários
- Testes de integração
- Testes end-to-end
- Análise de cobertura
- TDD workflow
- Mocking

**Comandos:**
```
/generate     - Gerar testes
/tdd          - Iniciar ciclo TDD
/coverage     - Analisar cobertura
/mock         - Gerar mocks
/fix          - Corrigir teste
/edge-cases   - Sugerir edge cases
```

---

### 🎭 Conductor Agent

**Descrição:** Context-Driven Development

**Capacidades:**
- Setup de projeto
- Criação de tracks
- Geração de specs
- Planejamento de tarefas
- Implementação guiada
- Checkpoints git

**Comandos:**
```
/setup       - Configurar projeto
/newTrack    - Nova feature/bugfix
/implement   - Implementar tarefa
/status      - Ver status
/checkpoint  - Criar checkpoint
/revert      - Reverter trabalho
```

---

## Composição de Agentes

O PAGIA permite compor agentes usando diferentes estratégias:

### Estratégias Disponíveis

| Estratégia | Descrição |
|------------|-----------|
| **Sequential** | Executa agentes em sequência |
| **Parallel** | Executa agentes em paralelo |
| **Pipeline** | Output de um é input do próximo |
| **Voting** | Agentes votam no melhor resultado |
| **Specialist** | Agente especialista decide |

### Exemplo de Código

```typescript
import { agentComposer, codeOptimizerAgent, testerAgent } from 'pagia/agents';

// Criar pipeline
const pipeline = agentComposer.createPipeline('review', [
  codeOptimizerAgent,
  testerAgent,
]);

// Executar
const result = await pipeline.execute({
  prompt: 'Revisar código',
});
```

---

## Criando Agentes Customizados

### Estrutura Básica

```typescript
import { BaseAgent, AgentInput, AgentOutput } from 'pagia/agents';

export class MeuAgente extends BaseAgent {
  readonly name = 'Meu Agente';
  readonly role = 'Descrição do papel';
  readonly description = 'O que o agente faz';
  readonly module = 'meu-modulo';

  capabilities = [
    'capacidade 1',
    'capacidade 2',
  ];

  instructions = `
    Instruções para o modelo de IA...
  `;

  menu = [
    { trigger: '/comando', description: 'Descrição' },
  ];

  async execute(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();

    // Chamar IA
    const response = await this.callAI(input.prompt, input.context);

    return this.createOutput(response.content, response.tokensUsed, startTime);
  }
}
```

### Registrar Agente

```typescript
import { agentRegistry } from 'pagia/agents';
import { meuAgente } from './meu-agente';

// Registrar com tags
await agentRegistry.register(meuAgente, ['custom', 'minha-tag']);
```

---

## Exemplo: Example Agent (pronto para uso)

Um agente de exemplo está incluído em `src/agents/specialized/example-agent.ts` que demonstra:

- Como estender `BaseAgent`;
- Uso de `callAI`, formatação de saída com `createOutput` e extração de `SuggestedAction` com o padrão `[ACTION:type:label:value]`;
- Como exportá-lo via `src/agents/index.ts` para exposição via CLI e MCP.

Use o teste de exemplo em `test/example-agent.spec.ts` como referência para criar novos testes que mockem `createAIService()`.

---

## Agent Registry

O Agent Registry permite gerenciar agentes:

```typescript
import { agentRegistry } from 'pagia/agents';

// Listar todos
const agents = agentRegistry.list();

// Buscar por capacidade
const specialists = agentRegistry.findByCapabilities(['análise']);

// Buscar por tag
const tagged = agentRegistry.findByTags(['tdd']);

// Obter por ID
const agent = agentRegistry.get('agent-id');

// Estatísticas
const stats = agentRegistry.getStats();
```

---

[← Voltar](index.md)
