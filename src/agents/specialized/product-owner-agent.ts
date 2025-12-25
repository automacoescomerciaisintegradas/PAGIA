/**
 * PAGIA - Product Owner Agent
 * Agente de Gerenciamento de Produto
 * 
 * Baseado no BMAD Method
 * 
 * @module agents/specialized/product-owner-agent
 * @author Automações Comerciais Integradas
 */

import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';

/**
 * ProductOwnerAgent - Responsável por requisitos, especificações e gestão de produto
 */
export class ProductOwnerAgent extends BaseAgent {
    readonly name = 'Product Owner';
    readonly role = 'Gerente de Produto e Requisitos';
    readonly description = 'Agente especializado em gerenciamento de produto, levantamento de requisitos, criação de PRDs, user stories e priorização de backlog. Traduz necessidades de negócio em especificações técnicas.';
    readonly module = 'core';

    capabilities = [
        'Levantamento e documentação de requisitos',
        'Criação de PRD (Product Requirements Document)',
        'Escrita de User Stories com critérios de aceitação',
        'Priorização de backlog (MoSCoW, RICE)',
        'Definição de épicos e features',
        'Mapeamento de jornada do usuário',
        'Definição de critérios de aceite',
        'Gestão de stakeholders',
    ];

    instructions = `Como Product Owner, você deve:

1. **Requisitos:**
   - Levantar requisitos funcionais e não-funcionais
   - Documentar requisitos de forma clara e testável
   - Validar requisitos com stakeholders

2. **PRD (Product Requirements Document):**
   - Criar documentos de requisitos completos
   - Incluir visão do produto, objetivos, escopo
   - Definir métricas de sucesso (KPIs)

3. **User Stories:**
   - Escrever no formato: "Como [persona], eu quero [ação] para [benefício]"
   - Definir critérios de aceitação claros
   - Estimar complexidade (Story Points)

4. **Priorização:**
   - Usar frameworks como MoSCoW, RICE ou Kano
   - Balancear valor de negócio vs. esforço técnico
   - Considerar dependências entre itens

5. **Comunicação:**
   - Traduzir linguagem de negócio para técnica
   - Facilitar alinhamento entre stakeholders e equipe técnica
   - Documentar decisões e trade-offs

Sempre priorize clareza e testabilidade nos requisitos.`;

    menu = [
        { trigger: '/prd', description: 'Criar PRD (Product Requirements Document)' },
        { trigger: '/story', description: 'Escrever User Story com critérios de aceite' },
        { trigger: '/epic', description: 'Definir épico com features' },
        { trigger: '/backlog', description: 'Organizar e priorizar backlog' },
        { trigger: '/acceptance', description: 'Definir critérios de aceitação' },
        { trigger: '/requirements', description: 'Levantar requisitos' },
    ];

    async execute(input: AgentInput): Promise<AgentOutput> {
        const startTime = Date.now();

        try {
            const prompt = input.prompt.toLowerCase();
            let enhancedPrompt = input.prompt;

            if (prompt.includes('/prd')) {
                enhancedPrompt = `Crie um PRD (Product Requirements Document) completo para: ${input.prompt.replace('/prd', '').trim()}

Estruture com:
## 1. Visão do Produto
## 2. Objetivos e Métricas de Sucesso (KPIs)
## 3. Personas e Usuários-Alvo
## 4. Requisitos Funcionais
## 5. Requisitos Não-Funcionais
## 6. User Stories Principais
## 7. Escopo (In/Out)
## 8. Dependências
## 9. Riscos e Mitigações
## 10. Cronograma de Alto Nível`;

            } else if (prompt.includes('/story')) {
                enhancedPrompt = `Crie User Stories detalhadas para: ${input.prompt.replace('/story', '').trim()}

Para cada User Story, use o formato:
### User Story: [Título]
**Como** [persona/usuário]
**Eu quero** [ação/funcionalidade]
**Para que** [benefício/valor]

**Critérios de Aceitação:**
- [ ] Dado [contexto], quando [ação], então [resultado]
- [ ] ...

**Story Points:** [estimativa]
**Prioridade:** [Alta/Média/Baixa]`;

            } else if (prompt.includes('/epic')) {
                enhancedPrompt = `Defina um Épico completo para: ${input.prompt.replace('/epic', '').trim()}

Estruture com:
## Épico: [Nome]
### Descrição
### Objetivo de Negócio
### Métricas de Sucesso
### Features Incluídas
1. Feature 1: [descrição]
2. Feature 2: [descrição]
...
### User Stories
### Dependências
### Critérios de Aceitação do Épico
### Estimativa de Esforço`;

            } else if (prompt.includes('/backlog')) {
                enhancedPrompt = `Organize e priorize o backlog para: ${input.prompt.replace('/backlog', '').trim()}

Use o framework RICE para priorização:
- Reach (Alcance): quantas pessoas/transações afeta
- Impact (Impacto): quanto impacta cada pessoa (0.25/0.5/1/2/3)
- Confidence (Confiança): nível de certeza (%)
- Effort (Esforço): pessoa-meses

Score RICE = (Reach * Impact * Confidence) / Effort

Apresente em formato de tabela ordenada por prioridade.`;

            } else if (prompt.includes('/requirements')) {
                enhancedPrompt = `Levante os requisitos para: ${input.prompt.replace('/requirements', '').trim()}

Estruture em:
## Requisitos Funcionais
RF001: [descrição clara e testável]
RF002: ...

## Requisitos Não-Funcionais
RNF001: Performance - [descrição com métricas]
RNF002: Segurança - [descrição]
RNF003: Escalabilidade - [descrição]
RNF004: Usabilidade - [descrição]

## Restrições
## Premissas`;
            }

            const response = await this.callAI(enhancedPrompt, input.context);

            return this.createOutput(
                response.content,
                response.tokensUsed,
                startTime,
                this.extractSuggestedActions(response.content)
            );
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return this.createOutput(`Erro no levantamento: ${errorMsg}`, undefined, startTime);
        }
    }
}

// Singleton
export const productOwnerAgent = new ProductOwnerAgent();
