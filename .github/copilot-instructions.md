# Instruções para Copilot / Agentes de IA ao contribuir com o PAGIA

Objetivo: Orientação rápida e acionável para que um assistente de código IA seja produtivo imediatamente neste repositório.

1. Visão geral (o que inspecionar primeiro)
   - Entrada do CLI e comandos: `src/index.ts` (registra comandos - `/agent`, `/plan`, `/tdd`, `/mcp`, `/bundle`).
   - Core: `src/core/*` — especialmente `ai-service.ts` (comportamento do provedor / fallbacks), `plugin-system.ts` (manifesto e local dos plugins) e `config-manager.ts`.
   - Agentes: `src/agents/base-agent.ts` (contrato, prompts, histórico, formato de saída) e `src/agents/specialized/*` para exemplos concretos (ex.: `module-creation-master-agent.ts`).
   - Conhecimento / RAG: `src/knowledge/chunker.ts` (padrões: chunkSize 1000, overlap 200, splitBy 'paragraph') e arquivos de embeddings/armazenamento vetorial.
   - Docs & templates: `docs/agents.md`, `docs/implementation-plan.md` e templates de plugin referenciados em `src/core/plugin-system.ts` (plugins ficam em `~/.pagia/plugins` ou `.pagia/plugins`).

2. Fluxos de desenvolvimento e comandos essenciais
   - Instalação & build: `npm install`, `npm run build` (compila TypeScript), `npm run dev` (`tsx src/index.ts` para iterar no desenvolvimento).
   - CLI local: `npm run link` para usar `pagia` globalmente; alternativamente `npx tsx src/index.ts <comando>`.
   - Configuração de provedor de IA: crie `.env` com `AI_PROVIDER` e variáveis específicas (ver `README.md` e `src/core/ai-service.ts`).
   - MCP: `pagia mcp start -p 3100` e `pagia mcp config <cursor|vscode|claude>` para gerar configs de IDE.
   - Ingestão de conhecimento: `pagia knowledge add <path> -r` e `pagia knowledge search "query"` (as opções do chunker afetam como o conteúdo é dividido).

3. Convenções e padrões do projeto
   - Agentes estendem `BaseAgent` e devem definir `name`, `role`, `description`, `module`, `capabilities`, `instructions` e `menu` (veja exemplos em `src/agents/specialized/`).
   - O system prompt é construído por `BaseAgent.getFullSystemPrompt()` (concatena name/role/capabilities/instructions). Coloque orientações específicas do modelo em `instructions`.
   - Formato de saída: use `createOutput(...)` para incluir metadata (tokens, duration, timestamp) e emitir eventos via `safeExecute()`.
   - Ações sugeridas: agentes indicam ações com o padrão literal `[ACTION:type:label:value]` (extraído por `BaseAgent.extractSuggestedActions`). Exemplo: `[ACTION:agent:RunTester:tester]`.
   - Histórico: mantenha o histórico limitado (`maxHistoryLength = 10` por padrão) e chame `clearHistory()` quando quiser reiniciar o contexto.

4. Integrações e comportamentos que merecem atenção
   - Fallbacks de provedores: Gemini e OpenRouter possuem listas de fallback em `src/core/ai-service.ts`. Erros de quota/rate-limit acionam fallback.
   - Ollama: para modelos locais, mensagens de erro sugerem `ollama serve` — reproduzir testes pode depender desse processo local.
   - Plugins: manifestos são `plugin.json`; agentes de plugin ficam em `agents/` dentro da pasta do plugin; o plugin manager procura em `~/.pagia/plugins` e `.pagia/plugins`.

5. O que modificar ao fazer mudanças no código
   - Adicionar/alterar agentes criando arquivos em `src/agents` e atualizar `docs/agents.md` (o markdown do agente pode ser gerado com `BaseAgent.toMarkdown()`).
   - Registrar comandos do CLI: novas entradas devem ser adicionadas em `src/index.ts` e seguir os padrões de `src/commands/`.
   - Mantenha a documentação de superfície (`README.md`, `docs/`) consistente com mudanças de comportamento visível ao usuário (instalação, variáveis de ambiente, comandos).

6. Exemplos rápidos (copiar/colar)
   - Rodar em modo dev: `npm run dev` ou `npx tsx src/index.ts agent run code-optimizer`.
   - Build e link: `npm run build && npm link` e então `pagia agent list`.
   - Adicionar conhecimento: `pagia knowledge add ./docs -r`.

7. Exemplos de implementação (curtos)

Abaixo seguem dois exemplos mínimos que são úteis ao trabalhar com este repositório.

7.1. Criar um agente (exemplo mínimo)

```typescript
import { BaseAgent, AgentInput, AgentOutput } from '../agents/base-agent.js';

export class MeuAgente extends BaseAgent {
  readonly name = 'Meu Agente';
  readonly role = 'Analista de Código';
  readonly description = 'Analisa código e sugere pequenas melhorias.';
  readonly module = 'core';

  capabilities = ['análise', 'refatoração'];
  instructions = `Seja objetivo; sempre forneça passos acionáveis e exemplos de código quando aplicável.`;
  menu = [{ trigger: '/analisar', description: 'Analisa um arquivo ou trecho de código' }];

  async execute(input: AgentInput): Promise<AgentOutput> {
    const start = Date.now();

    // Chama o serviço de IA com prompt já enriquecido
    const response = await this.callAI(`Analise o seguinte código e sugira melhorias:\n\n${input.prompt}`, input.context);

    return this.createOutput(response.content, response.tokensUsed, start);
  }
}

// Registrar/instanciar o agente (ex.: em um módulo de inicialização)
export const meuAgente = new MeuAgente();
// await agentRegistry.register(meuAgente, ['custom', 'analise']);
```

Dicas rápidas:
- Coloque instruções específicas ao modelo em `instructions`.
- Use `createOutput(...)` para garantir metadados e compatibilidade com eventos.
- Registre o agente no `agentRegistry` para exposição via CLI e MCP.

7.2. Implementar um hook de plugin (exemplo mínimo)

Plugin manifest (`plugin.json`) exemplo:

```json
{
  "name": "meu-plugin",
  "version": "1.0.0",
  "description": "Plugin de exemplo",
  "hooks": [
    { "event": "SessionStart", "handler": "./hooks/session-start.js" }
  ]
}
```

Handler de hook (`hooks/session-start.js`):

```js
export default async function(context) {
  // Contexto pode conter sessão, usuário, ferramentas disponíveis etc.
  console.log('SessionStart hook chamado pelo plugin meu-plugin', context);

  // Exemplo: adicionar metadado ao contexto para uso por agentes
  context.pluginMeta = context.pluginMeta || {};
  context.pluginMeta.meuPlugin = { enabled: true };
}
```

Dicas rápidas:
- O `PluginManager` carrega e executa hooks automaticamente (veja `src/core/plugin-system.ts`).
- Teste localmente criando o plugin via `pluginManager.create('meu-plugin')` e ajustando o handler.

--
Se quiser, posso alongar qualquer exemplo com testes, casos de uso, e instruções de validação (ex.: como submeter um PR com um novo agente ou plugin).
