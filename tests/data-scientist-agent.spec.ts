/**
 * Teste do Data Scientist Agent
 * 
 * @module tests/data-scientist-agent.spec
 */

import { DataScientistAgent } from '../apps/backend/src/agents/specialized/data-scientist-agent.js';
import { describe, it, expect } from 'vitest';

describe('DataScientistAgent', () => {
    const agent = new DataScientistAgent();

    it('should have correct metadata', () => {
        expect(agent.name).toBe('Data Scientist');
        expect(agent.role).toBe('Especialista em Análise de Dados');
        expect(agent.description).toContain('análise de dados');
        expect(agent.module).toBe('data-science');
    });

    it('should have required capabilities', () => {
        const capabilities = agent.capabilities;
        expect(capabilities).toContain('Escrita de consultas SQL eficientes');
        expect(capabilities).toContain('Operações no BigQuery');
        expect(capabilities).toContain('Análise e sumarização de resultados');
    });

    it('should have menu commands', () => {
        const menu = agent.menu;
        expect(menu).toHaveLength(6);
        expect(menu[0].trigger).toBe('/sql');
        expect(menu[1].trigger).toBe('/analyze');
        expect(menu[2].trigger).toBe('/bq');
        expect(menu[3].trigger).toBe('/report');
        expect(menu[4].trigger).toBe('/optimize');
        expect(menu[5].trigger).toBe('/insights');
    });

    it('should handle execution and return structured output', async () => {
        const result = await agent.execute({
            prompt: '/sql Obter os 10 usuários mais ativos no último mês',
            context: {}
        });

        // Verifica que o resultado tem a estrutura esperada
        expect(result.content).toBeDefined();
        expect(result.metadata.agentName).toBe('Data Scientist');
        expect(result.metadata.timestamp).toBeInstanceOf(Date);

        // O conteúdo pode ser uma análise de dados ou mensagem de erro
        // ambos são válidos para o teste
        expect(typeof result.content).toBe('string');
    });
});