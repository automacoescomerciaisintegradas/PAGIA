import { describe, it, expect, vi } from 'vitest';

// Mock do createAIService para controlar o retorno do serviço de IA
vi.mock('../apps/backend/src/core/ai-service', () => {
  return {
    createAIService: () => {
      return {
        chat: async (messages: any[]) => ({
          content: 'Mocked AI output',
          provider: 'mock',
          model: 'mock',
          tokensUsed: 5,
        }),
      };
    },
  };
});

describe('ModuleCreationMasterAgent (integração mínima)', () => {
  it('deve chamar o serviço de IA e retornar output padronizado', async () => {
    // Import dinâmico para garantir que o mock seja aplicado antes da importação
    const { ModuleCreationMasterAgent } = await import('../apps/backend/src/agents/specialized/module-creation-master-agent');

    const agent = new ModuleCreationMasterAgent();

    const input = { prompt: 'BM brainstorm-module pagamento', context: {} };

    const output = await agent.safeExecute(input);

    expect(output).toHaveProperty('content');
    expect(output.content).toContain('Mocked AI output');
    expect(output.metadata.agentName).toBe(agent.name);
    expect(output.metadata).toHaveProperty('timestamp');
  });
});
