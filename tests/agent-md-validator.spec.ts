import { describe, it, expect } from 'vitest';
import { validateAgentMarkdownContent } from '../apps/backend/src/agents/agent-md-validator';

describe('Agent Markdown Validator', () => {
  it('returns valid for a well-formed agent', () => {
    const content = `# Exemplo\n\n## Papel\nAgente de Exemplo\n\n## Descrição\nUma descrição\n\n## Capacidades\n- exemplo\n\n## Instruções\nDetalhadas instruções para o agente...\n`;

    const res = validateAgentMarkdownContent(content);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('detects missing headers', () => {
    const content = `# Exemplo\n\n## Papel\nAgente de Exemplo\n\n## Capacidades\n- exemplo\n`;

    const res = validateAgentMarkdownContent(content);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors).toContain('Cabeçalho obrigatório ausente: ## Descrição');
  });

  it('warns about short instructions', () => {
    const content = `# Exemplo\n\n## Papel\nAgente\n\n## Descrição\nDesc\n\n## Capacidades\n- ex\n\n## Instruções\nCurto\n`;

    const res = validateAgentMarkdownContent(content);
    expect(res.valid).toBe(true);
    expect(res.warnings.length).toBeGreaterThan(0);
  });
});
