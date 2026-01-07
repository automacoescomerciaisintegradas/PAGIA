/**
 * Teste do Debugger Agent
 * 
 * @module tests/debugger-agent.spec
 */

import { DebuggerAgent } from '../apps/backend/src/agents/specialized/debugger-agent.js';
import { describe, it, expect } from 'vitest';

describe('DebuggerAgent', () => {
    const agent = new DebuggerAgent();

    it('should have correct metadata', () => {
        expect(agent.name).toBe('Debugger');
        expect(agent.role).toBe('Especialista em Depuração de Erros');
        expect(agent.description).toContain('análise de causas raiz');
        expect(agent.module).toBe('debugging');
    });

    it('should have required capabilities', () => {
        const capabilities = agent.capabilities;
        expect(capabilities).toContain('Análise de mensagens de erro e stack traces');
        expect(capabilities).toContain('Implementação de correções mínimas');
        expect(capabilities).toContain('Análise de causas raiz');
    });

    it('should have menu commands', () => {
        const menu = agent.menu;
        expect(menu).toHaveLength(6);
        expect(menu[0].trigger).toBe('/debug');
        expect(menu[1].trigger).toBe('/trace');
        expect(menu[2].trigger).toBe('/root-cause');
        expect(menu[3].trigger).toBe('/fix');
        expect(menu[4].trigger).toBe('/verify');
        expect(menu[5].trigger).toBe('/prevention');
    });

    it('should handle execution and return structured output', async () => {
        const result = await agent.execute({
            prompt: '/debug Erro ao processar dados de usuário',
            context: {}
        });

        // Verifica que o resultado tem a estrutura esperada
        expect(result.content).toBeDefined();
        expect(result.metadata.agentName).toBe('Debugger');
        expect(result.metadata.timestamp).toBeInstanceOf(Date);

        // O conteúdo pode ser uma análise de debug ou mensagem de erro
        // ambos são válidos para o teste
        expect(typeof result.content).toBe('string');
    });
});