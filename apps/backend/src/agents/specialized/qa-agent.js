/**
 * PAGIA - QA Agent
 * Agente de Qualidade e Testes
 *
 * Baseado no BMAD Method
 *
 * @module agents/specialized/qa-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent } from '../base-agent.js';
/**
 * QAAgent - Responsável por qualidade, testes e validação
 */
export class QAAgent extends BaseAgent {
    name = 'QA';
    role = 'Engenheiro de Qualidade e Testes';
    description = 'Agente especializado em garantia de qualidade, criação de planos de teste, casos de teste, automação de testes e validação de requisitos. Previne débito técnico e garante qualidade contínua.';
    module = 'core';
    capabilities = [
        'Criação de planos de teste',
        'Escrita de casos de teste',
        'Testes unitários, integração e E2E',
        'Testes de performance e carga',
        'Testes de segurança (OWASP)',
        'Automação de testes (Selenium, Cypress, Playwright)',
        'Validação de critérios de aceitação',
        'Análise de cobertura de código',
        'Identificação de edge cases',
        'Regressão e smoke tests',
    ];
    instructions = `Como Engenheiro de QA, você deve:

1. **Plano de Testes:**
   - Definir estratégia de testes
   - Identificar escopo e prioridades
   - Planejar ambientes de teste

2. **Casos de Teste:**
   - Escrever casos de teste detalhados
   - Cobrir cenários positivos e negativos
   - Identificar edge cases e boundary conditions

3. **Automação:**
   - Recomendar ferramentas adequadas
   - Escrever testes automatizados
   - Manter suite de regressão

4. **Tipos de Teste:**
   - Unit: testar funções isoladas
   - Integration: testar integrações
   - E2E: testar fluxos completos
   - Performance: tempo de resposta, throughput
   - Security: vulnerabilidades OWASP

5. **Qualidade Contínua:**
   - Validar critérios de aceitação
   - Prevenir débito técnico
   - Garantir quality gates no CI/CD

Sempre pense em casos negativos e edge cases que desenvolvedores podem esquecer.`;
    menu = [
        { trigger: '/test-plan', description: 'Criar plano de testes completo' },
        { trigger: '/test-cases', description: 'Gerar casos de teste' },
        { trigger: '/unit-test', description: 'Gerar testes unitários' },
        { trigger: '/e2e-test', description: 'Gerar testes E2E' },
        { trigger: '/security', description: 'Análise de segurança (OWASP)' },
        { trigger: '/performance', description: 'Plano de teste de performance' },
        { trigger: '/review', description: 'Revisar código para qualidade' },
    ];
    async execute(input) {
        const startTime = Date.now();
        try {
            const prompt = input.prompt.toLowerCase();
            let enhancedPrompt = input.prompt;
            if (prompt.includes('/test-plan')) {
                enhancedPrompt = `Crie um plano de testes completo para: ${input.prompt.replace('/test-plan', '').trim()}

Estruture com:
## Plano de Testes

### 1. Escopo
- Features incluídas
- Features excluídas
- Limitações

### 2. Estratégia de Testes
| Tipo | Cobertura | Ferramentas | Responsável |
|------|-----------|-------------|-------------|
| Unitário | 80%+ | Jest/Vitest | Devs |
| Integração | Crítico | Jest | QA |
| E2E | Happy paths | Playwright | QA |
| Performance | APIs críticas | k6/Artillery | QA |
| Segurança | OWASP Top 10 | OWASP ZAP | SecOps |

### 3. Ambientes de Teste
- Dev: [URL]
- Staging: [URL]
- Dados de teste: [estratégia]

### 4. Critérios de Entrada
### 5. Critérios de Saída
### 6. Riscos de Teste
### 7. Cronograma
### 8. Métricas de Qualidade`;
            }
            else if (prompt.includes('/test-cases')) {
                enhancedPrompt = `Gere casos de teste detalhados para: ${input.prompt.replace('/test-cases', '').trim()}

Para cada caso de teste:
## Casos de Teste

### TC-001: [Título descritivo]
**Prioridade:** [Alta/Média/Baixa]
**Tipo:** [Funcional/Não-funcional]
**Pré-condições:**
- ...

**Passos:**
1. ...
2. ...
3. ...

**Resultado Esperado:**
- ...

**Dados de Teste:**
- ...

---

## Casos Negativos

### TC-NEG-001: [Cenário de erro]
**Pré-condições:** ...
**Passos:** ...
**Resultado Esperado:** Mensagem de erro apropriada

---

## Edge Cases

### TC-EDGE-001: [Boundary condition]
...`;
            }
            else if (prompt.includes('/unit-test')) {
                enhancedPrompt = `Gere testes unitários para: ${input.prompt.replace('/unit-test', '').trim()}

Forneça código de teste completo:
\`\`\`typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('[NomeDaFunção/Classe]', () => {
    beforeEach(() => {
        // Setup
    });

    describe('cenário positivo', () => {
        it('deve [comportamento esperado]', () => {
            // Arrange
            // Act
            // Assert
        });
    });

    describe('cenário negativo', () => {
        it('deve lançar erro quando [condição]', () => {
            // Arrange
            // Act & Assert
            expect(() => ...).toThrow();
        });
    });

    describe('edge cases', () => {
        it('deve lidar com entrada vazia', () => {
            // ...
        });

        it('deve lidar com valores nulos', () => {
            // ...
        });
    });
});
\`\`\`

## Cobertura Esperada
- Linhas: 90%+
- Branches: 85%+
- Funções: 100%`;
            }
            else if (prompt.includes('/e2e-test')) {
                enhancedPrompt = `Gere testes E2E para: ${input.prompt.replace('/e2e-test', '').trim()}

Use Playwright:
\`\`\`typescript
import { test, expect } from '@playwright/test';

test.describe('[Feature]', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('deve [ação do usuário]', async ({ page }) => {
        // Arrange
        await page.getByRole('button', { name: 'Login' }).click();
        
        // Act
        await page.getByLabel('Email').fill('user@example.com');
        await page.getByLabel('Senha').fill('password123');
        await page.getByRole('button', { name: 'Entrar' }).click();
        
        // Assert
        await expect(page.getByText('Bem-vindo')).toBeVisible();
    });

    test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
        // Cenário negativo
    });
});
\`\`\`

## Fluxos Críticos a Testar
1. [Fluxo 1]
2. [Fluxo 2]

## Page Objects (se necessário)`;
            }
            else if (prompt.includes('/security')) {
                enhancedPrompt = `Realize análise de segurança (OWASP Top 10) para: ${input.prompt.replace('/security', '').trim()}

## Análise de Segurança

### A01:2021 - Broken Access Control
- [ ] Verificar controle de acesso em endpoints
- [ ] Testar IDOR (Insecure Direct Object Reference)
- [ ] Validar permissões de usuário

### A02:2021 - Cryptographic Failures
- [ ] Dados sensíveis criptografados
- [ ] HTTPS em todas as comunicações
- [ ] Senhas com hash seguro (bcrypt, argon2)

### A03:2021 - Injection
- [ ] SQL Injection
- [ ] NoSQL Injection
- [ ] Command Injection
- [ ] XSS (Cross-Site Scripting)

### A04:2021 - Insecure Design
- [ ] Threat modeling realizado
- [ ] Princípio do menor privilégio

### A05:2021 - Security Misconfiguration
- [ ] Headers de segurança
- [ ] Erros não expõem informações

### A06:2021 - Vulnerable Components
- [ ] Dependências atualizadas
- [ ] npm audit / snyk

### A07:2021 - Authentication Failures
- [ ] Força de senha
- [ ] Rate limiting em login
- [ ] Multi-factor authentication

### A08:2021 - Software and Data Integrity
- [ ] Verificação de integridade
- [ ] CI/CD seguro

### A09:2021 - Security Logging
- [ ] Logs de segurança
- [ ] Alertas de atividade suspeita

### A10:2021 - SSRF
- [ ] Validação de URLs externas

## Recomendações de Correção
...`;
            }
            const response = await this.callAI(enhancedPrompt, input.context);
            return this.createOutput(response.content, response.tokensUsed, startTime, this.extractSuggestedActions(response.content));
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return this.createOutput(`Erro na análise de qualidade: ${errorMsg}`, undefined, startTime);
        }
    }
}
// Singleton
export const qaAgent = new QAAgent();
//# sourceMappingURL=qa-agent.js.map