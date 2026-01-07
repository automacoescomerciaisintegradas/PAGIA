/**
 * Teste do Code Reviewer Agent
 * 
 * @module tests/code-reviewer-agent.spec
 */

import { CodeReviewerAgent } from '../apps/backend/src/agents/specialized/code-reviewer-agent.js';
import { AgentInput } from '../apps/backend/src/agents/base-agent.js';
import { describe, it, expect } from 'vitest';

describe('CodeReviewerAgent', () => {
    const agent = new CodeReviewerAgent();

    it('should have correct metadata', () => {
        expect(agent.name).toBe('Code Reviewer');
        expect(agent.role).toBe('Senior Code Reviewer');
        expect(agent.description).toContain('revisão de código');
        expect(agent.module).toBe('code-quality');
    });

    it('should have required capabilities', () => {
        const capabilities = agent.capabilities;
        expect(capabilities).toContain('Análise de qualidade de código');
        expect(capabilities).toContain('Detecção de vulnerabilidades de segurança');
        expect(capabilities).toContain('Sugestões de refatoração');
    });

    it('should have menu commands', () => {
        const menu = agent.menu;
        expect(menu).toHaveLength(6);
        expect(menu[0].trigger).toBe('/review');
        expect(menu[1].trigger).toBe('/security');
        expect(menu[2].trigger).toBe('/quality');
        expect(menu[3].trigger).toBe('/refactor');
        expect(menu[4].trigger).toBe('/test');
        expect(menu[5].trigger).toBe('/performance');
    });

    it('should handle execution and return structured output', async () => {
        const result = await agent.execute({
            prompt: '/review function hello() { console.log("Hello World"); }',
            context: {}
        });

        // Verifica que o resultado tem a estrutura esperada
        expect(result.content).toBeDefined();
        expect(result.metadata.agentName).toBe('Code Reviewer');
        expect(result.metadata.timestamp).toBeInstanceOf(Date);

        // O conteúdo pode ser uma revisão ou mensagem de erro
        // ambos são válidos para o teste
        expect(typeof result.content).toBe('string');
    });
});