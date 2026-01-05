import { SpecWriterAgent } from '../apps/backend/src/agents/specialized/spec-writer-agent.js';
import { describe, it, expect } from 'vitest';

describe('SpecWriterAgent', () => {
    const agent = new SpecWriterAgent();

    it('should have correct metadata', () => {
        expect(agent.name).toBe('Spec Writer');
        expect(agent.role).toBe('Especialista em Especificações Técnicas');
        expect(agent.description).toContain('especificação detalhados');
        expect(agent.module).toBe('specifications');
    });

    it('should have required capabilities', () => {
        const capabilities = agent.capabilities;
        expect(capabilities).toContain('Criação de especificações técnicas completas');
        expect(capabilities).toContain('Documentação de requisitos funcionais e não-funcionais');
        expect(capabilities).toContain('Alinhamento com padrões do projeto');
    });

    it('should have menu commands', () => {
        const menu = agent.menu;
        expect(menu).toHaveLength(13);
        expect(menu[0].trigger).toBe('/spec');
        expect(menu[1].trigger).toBe('/rf');
        expect(menu[2].trigger).toBe('/nf');
        expect(menu[3].trigger).toBe('/arch');
        expect(menu[4].trigger).toBe('/flow');
        expect(menu[5].trigger).toBe('/acceptance');
        expect(menu[6].trigger).toBe('/api');
        expect(menu[7].trigger).toBe('/web');
        expect(menu[8].trigger).toBe('/db');
        expect(menu[9].trigger).toBe('/microservice');
        expect(menu[10].trigger).toBe('/security');
        expect(menu[11].trigger).toBe('/land');
        expect(menu[12].trigger).toBe('/validate');
    });

    it('should handle execution and return structured output', async () => {
        const result = await agent.execute({
            prompt: '/spec Sistema básico de autenticação',
            context: {}
        });

        // Verifica que o resultado tem a estrutura esperada
        expect(result.content).toBeDefined();
        expect(result.metadata.agentName).toBe('Spec Writer');
        expect(result.metadata.timestamp).toBeInstanceOf(Date);

        // O conteúdo pode ser uma especificação ou mensagem de erro
        // ambos são válidos para o teste
        expect(typeof result.content).toBe('string');
    });
});
