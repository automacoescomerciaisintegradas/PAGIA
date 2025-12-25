/**
 * PAGIA - Architect Agent
 * Agente de Arquitetura de Software
 * 
 * Baseado no BMAD Method
 * 
 * @module agents/specialized/architect-agent
 * @author Automações Comerciais Integradas
 */

import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';

/**
 * ArchitectAgent - Responsável por design de sistema e arquitetura técnica
 */
export class ArchitectAgent extends BaseAgent {
    readonly name = 'Architect';
    readonly role = 'Arquiteto de Software';
    readonly description = 'Agente especializado em arquitetura de software, design de sistemas, escolha de tecnologias e documentação técnica. Cria ADRs, diagramas de arquitetura e define padrões técnicos.';
    readonly module = 'core';

    capabilities = [
        'Design de arquitetura de software',
        'Criação de ADRs (Architecture Decision Records)',
        'Escolha e avaliação de tecnologias',
        'Design de APIs e contratos',
        'Modelagem de dados e banco de dados',
        'Design de microsserviços e monolitos',
        'Padrões de integração e mensageria',
        'Documentação técnica com diagramas',
        'Análise de trade-offs arquiteturais',
        'Design para escalabilidade e resiliência',
    ];

    instructions = `Como Arquiteto de Software, você deve:

1. **Arquitetura de Sistema:**
   - Definir arquitetura geral (monolito, microsserviços, serverless)
   - Criar diagramas de arquitetura (C4 Model)
   - Documentar componentes e suas responsabilidades

2. **ADRs (Architecture Decision Records):**
   - Documentar decisões arquiteturais importantes
   - Incluir contexto, decisão, consequências
   - Manter histórico de decisões

3. **Design de APIs:**
   - Definir contratos de API (OpenAPI/Swagger)
   - Escolher padrões (REST, GraphQL, gRPC)
   - Documentar endpoints e payloads

4. **Modelagem de Dados:**
   - Criar modelos de dados (ER, DDD)
   - Escolher tipo de banco (SQL, NoSQL, Graph)
   - Definir estratégias de cache

5. **Qualidade Arquitetural:**
   - Garantir escalabilidade, disponibilidade, segurança
   - Definir padrões de código e boas práticas
   - Avaliar trade-offs (CAP, custo vs. performance)

Use diagramas ASCII ou mermaid quando possível para visualização.`;

    menu = [
        { trigger: '/architecture', description: 'Criar documento de arquitetura' },
        { trigger: '/adr', description: 'Criar ADR (Architecture Decision Record)' },
        { trigger: '/api', description: 'Projetar API e contratos' },
        { trigger: '/database', description: 'Modelar banco de dados' },
        { trigger: '/diagram', description: 'Criar diagrama de arquitetura' },
        { trigger: '/tech-stack', description: 'Recomendar stack tecnológico' },
        { trigger: '/review', description: 'Revisar arquitetura existente' },
    ];

    async execute(input: AgentInput): Promise<AgentOutput> {
        const startTime = Date.now();

        try {
            const prompt = input.prompt.toLowerCase();
            let enhancedPrompt = input.prompt;

            if (prompt.includes('/architecture')) {
                enhancedPrompt = `Crie um documento de arquitetura completo para: ${input.prompt.replace('/architecture', '').trim()}

Estruture com:
## 1. Visão Geral da Arquitetura
## 2. Requisitos Arquiteturais (NFRs)
## 3. Diagrama de Contexto (C4 Level 1)
## 4. Diagrama de Containers (C4 Level 2)
## 5. Componentes Principais
## 6. Fluxos de Dados
## 7. Tecnologias e Justificativas
## 8. Segurança
## 9. Escalabilidade e Performance
## 10. Monitoramento e Observabilidade
## 11. Deployment e Infraestrutura
## 12. Riscos Técnicos e Mitigações

Use diagramas mermaid quando possível.`;

            } else if (prompt.includes('/adr')) {
                enhancedPrompt = `Crie um ADR (Architecture Decision Record) para: ${input.prompt.replace('/adr', '').trim()}

Use o formato:
# ADR-XXX: [Título da Decisão]

## Status
[Proposto | Aceito | Depreciado | Substituído]

## Contexto
[Qual é o problema ou situação que requer esta decisão?]

## Decisão
[Qual é a mudança proposta ou decisão tomada?]

## Alternativas Consideradas
1. [Alternativa 1]: [Prós e Contras]
2. [Alternativa 2]: [Prós e Contras]
3. [Alternativa 3]: [Prós e Contras]

## Consequências
### Positivas
- ...
### Negativas
- ...
### Riscos
- ...

## Compliance
[Como verificar se a decisão está sendo seguida]`;

            } else if (prompt.includes('/api')) {
                enhancedPrompt = `Projete a API para: ${input.prompt.replace('/api', '').trim()}

Inclua:
## Visão Geral da API
## Autenticação e Autorização
## Endpoints

Para cada endpoint:
### [METHOD] /path
**Descrição:** ...
**Request:**
\`\`\`json
{ }
\`\`\`
**Response 200:**
\`\`\`json
{ }
\`\`\`
**Erros:**
- 400: ...
- 401: ...
- 404: ...

## Paginação
## Rate Limiting
## Versionamento`;

            } else if (prompt.includes('/database')) {
                enhancedPrompt = `Modele o banco de dados para: ${input.prompt.replace('/database', '').trim()}

Inclua:
## Escolha do Tipo de Banco
[SQL/NoSQL/Graph - Justificativa]

## Modelo de Entidades
\`\`\`mermaid
erDiagram
    ...
\`\`\`

## Tabelas/Collections

### [NomeEntidade]
| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| id | UUID | PK | ... |
| ... | ... | ... | ... |

## Índices
## Relacionamentos
## Estratégia de Cache
## Migrations Iniciais`;

            } else if (prompt.includes('/diagram')) {
                enhancedPrompt = `Crie diagramas de arquitetura para: ${input.prompt.replace('/diagram', '').trim()}

Use Mermaid para os diagramas:

## Diagrama de Contexto (C4 Level 1)
\`\`\`mermaid
graph TB
    ...
\`\`\`

## Diagrama de Containers (C4 Level 2)
\`\`\`mermaid
graph TB
    ...
\`\`\`

## Diagrama de Sequência (Fluxo Principal)
\`\`\`mermaid
sequenceDiagram
    ...
\`\`\`

## Diagrama de Componentes
\`\`\`mermaid
graph LR
    ...
\`\`\``;

            } else if (prompt.includes('/tech-stack')) {
                enhancedPrompt = `Recomende o stack tecnológico para: ${input.prompt.replace('/tech-stack', '').trim()}

Estruture com:
## Resumo da Recomendação

## Frontend
- Framework: [recomendação + justificativa]
- State Management: [recomendação]
- Styling: [recomendação]
- Build Tools: [recomendação]

## Backend
- Linguagem/Runtime: [recomendação + justificativa]
- Framework: [recomendação]
- Banco de Dados: [recomendação]
- Cache: [recomendação]
- Message Queue: [recomendação]

## Infraestrutura
- Cloud Provider: [recomendação]
- Container/Orchestration: [recomendação]
- CI/CD: [recomendação]
- Monitoramento: [recomendação]

## Trade-offs e Considerações
## Curva de Aprendizado da Equipe
## Custos Estimados`;
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
            return this.createOutput(`Erro na arquitetura: ${errorMsg}`, undefined, startTime);
        }
    }
}

// Singleton
export const architectAgent = new ArchitectAgent();
