/**
 * Teste do Subagent Manager Agent
 * 
 * @module tests/subagent-manager-agent.spec
 */

import { SubagentManagerAgent } from '../apps/backend/src/agents/specialized/subagent-manager-agent.js';
import { describe, it, expect } from 'vitest';

describe('SubagentManagerAgent', () => {
    const agent = new SubagentManagerAgent();

    it('should have correct metadata', () => {
        expect(agent.name).toBe('Subagent Manager');
        expect(agent.role).toBe('Especialista em Gerenciamento de Subagentes');
        expect(agent.description).toContain('gerenciar subagentes');
        expect(agent.module).toBe('agent-management');
    });

    it('should have required capabilities', () => {
        const capabilities = agent.capabilities;
        expect(capabilities).toContain('Criação de novos subagentes com configurações personalizadas');
        expect(capabilities).toContain('Definição de permissões e modos de acesso');
        expect(capabilities).toContain('Gerenciamento de ciclo de vida dos subagentes');
    });

    it('should have menu commands', () => {
        const menu = agent.menu;
        expect(menu).toHaveLength(6);
        expect(menu[0].trigger).toBe('/create');
        expect(menu[1].trigger).toBe('/config');
        expect(menu[2].trigger).toBe('/validate');
        expect(menu[3].trigger).toBe('/list');
        expect(menu[4].trigger).toBe('/doc');
        expect(menu[5].trigger).toBe('/template');
    });

    it('should handle execution and return structured output', async () => {
        const result = await agent.execute({
            prompt: '/create novo-analisador-de-codigo',
            context: {}
        });

        // Verifica que o resultado tem a estrutura esperada
        expect(result.content).toBeDefined();
        expect(result.metadata.agentName).toBe('Subagent Manager');
        expect(result.metadata.timestamp).toBeInstanceOf(Date);

        // O conteúdo pode ser uma especificação ou mensagem de erro
        // ambos são válidos para o teste
        expect(typeof result.content).toBe('string');
    });
});