import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/core/ai-service', () => {
  return {
    createAIService: () => {
      return {
        chat: async (messages: any[]) => ({
          content: 'Resposta simulada do Example Agent. [ACTION:command:RunExample:run-example]',
          provider: 'mock',
          model: 'mock',
          tokensUsed: 3,
        }),
      };
    },
  };
});

describe('ExampleAgent (integração mínima)', () => {
  it('deve retornar resposta formatada e extrair actions sugeridas', async () => {
    const { ExampleAgent } = await import('../src/agents/specialized/example-agent');

    const agent = new ExampleAgent();

    const input = { prompt: 'Explique brevemente o propósito deste agente', context: {} };

    const output = await agent.safeExecute(input);

    expect(output).toHaveProperty('content');
    expect(output.content).toContain('Resposta simulada');
    expect(output.suggestedActions).toBeDefined();
    expect(output.suggestedActions?.[0].type).toBe('command');
    expect(output.metadata.agentName).toBe(agent.name);
  });
});
