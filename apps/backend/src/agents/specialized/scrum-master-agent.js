/**
 * PAGIA - Scrum Master Agent
 * Agente de Gestão Ágil e Planejamento
 *
 * Baseado no BMAD Method
 *
 * @module agents/specialized/scrum-master-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent } from '../base-agent.js';
/**
 * ScrumMasterAgent - Responsável por gestão ágil, sprints e facilitação
 */
export class ScrumMasterAgent extends BaseAgent {
    name = 'Scrum Master';
    role = 'Facilitador Ágil e Gestor de Sprints';
    description = 'Agente especializado em metodologias ágeis, gestão de sprints, facilitação de cerimônias e remoção de impedimentos. Converte planos de alto nível em tasks executáveis.';
    module = 'core';
    capabilities = [
        'Planejamento de sprints',
        'Decomposição de épicos em stories',
        'Conversão de stories em tasks técnicas',
        'Estimativa de esforço (Planning Poker)',
        'Facilitação de cerimônias ágeis',
        'Identificação e remoção de impedimentos',
        'Métricas ágeis (velocity, burndown)',
        'Retrospectivas e melhoria contínua',
        'Gestão de dependências entre times',
    ];
    instructions = `Como Scrum Master, você deve:

1. **Planejamento de Sprint:**
   - Ajudar a selecionar itens do backlog para o sprint
   - Garantir que o sprint goal seja claro
   - Balancear capacidade do time vs. itens selecionados

2. **Decomposição:**
   - Quebrar épicos em user stories menores
   - Converter stories em tasks técnicas
   - Garantir que tasks sejam pequenas e estimáveis

3. **Estimativa:**
   - Facilitar sessões de Planning Poker
   - Usar story points ou horas
   - Identificar itens que precisam de refinamento

4. **Cerimônias:**
   - Daily Standup: 3 perguntas
   - Sprint Review: demonstração de valor
   - Retrospectiva: melhorias contínuas

5. **Métricas:**
   - Acompanhar velocity do time
   - Gerar burndown charts
   - Identificar tendências e gargalos

Sempre foque em remover impedimentos e facilitar o trabalho do time.`;
    menu = [
        { trigger: '/sprint', description: 'Planejar novo sprint' },
        { trigger: '/breakdown', description: 'Decompor épico em stories' },
        { trigger: '/tasks', description: 'Converter story em tasks técnicas' },
        { trigger: '/estimate', description: 'Facilitar estimativa' },
        { trigger: '/daily', description: 'Gerar template de daily' },
        { trigger: '/retro', description: 'Facilitar retrospectiva' },
        { trigger: '/metrics', description: 'Calcular métricas ágeis' },
    ];
    async execute(input) {
        const startTime = Date.now();
        try {
            const prompt = input.prompt.toLowerCase();
            let enhancedPrompt = input.prompt;
            if (prompt.includes('/sprint')) {
                enhancedPrompt = `Planeje um sprint para: ${input.prompt.replace('/sprint', '').trim()}

Estruture com:
## Sprint [Número]

### Sprint Goal
[Objetivo claro e mensurável]

### Duração
[Data início] - [Data fim] ([X] dias úteis)

### Capacidade do Time
- [Nome]: [X] story points disponíveis
- Total: [Y] story points

### Itens Selecionados
| ID | User Story | Story Points | Responsável |
|----|------------|--------------|-------------|
| US-001 | ... | 5 | ... |

### Definition of Done
- [ ] Código revisado
- [ ] Testes passando
- [ ] Documentação atualizada
- [ ] Deploy em staging

### Riscos do Sprint
### Dependências Externas`;
            }
            else if (prompt.includes('/breakdown')) {
                enhancedPrompt = `Decomponha o épico em user stories: ${input.prompt.replace('/breakdown', '').trim()}

Para cada story, forneça:
## User Stories do Épico

### US-001: [Título]
**Como** [persona]
**Eu quero** [ação]
**Para que** [benefício]

**Story Points:** [1/2/3/5/8/13]
**Prioridade:** [Alta/Média/Baixa]
**Dependências:** [US-XXX]

**Critérios de Aceitação:**
- [ ] ...

---
[Continue para todas as stories]

## Diagrama de Dependências
\`\`\`mermaid
graph LR
    US001 --> US002
    US002 --> US003
\`\`\``;
            }
            else if (prompt.includes('/tasks')) {
                enhancedPrompt = `Converta a user story em tasks técnicas: ${input.prompt.replace('/tasks', '').trim()}

Para cada task:
## Tasks Técnicas

### Task 1: [Título técnico]
- **Tipo:** [Backend/Frontend/Infra/DB/Config]
- **Estimativa:** [Xh]
- **Descrição:** [O que precisa ser feito]
- **Arquivos afetados:** [lista de arquivos]
- **Testes:** [Quais testes escrever]

### Task 2: [Título técnico]
...

## Ordem de Execução Sugerida
1. Task X (sem dependências)
2. Task Y (depende de X)
...

## Checklist de Implementação
- [ ] Criar branch feature/US-XXX
- [ ] Implementar tasks
- [ ] Escrever testes
- [ ] Code review
- [ ] Merge para develop`;
            }
            else if (prompt.includes('/estimate')) {
                enhancedPrompt = `Facilite a estimativa para: ${input.prompt.replace('/estimate', '').trim()}

## Sessão de Estimativa (Planning Poker)

### Item: [Título]

### Complexidade Técnica
- [ ] Sistema já tem algo similar?
- [ ] Integração com sistemas externos?
- [ ] Mudanças em banco de dados?
- [ ] Impacto em outros componentes?

### Incertezas
- [ ] Requisitos claros?
- [ ] Dependências identificadas?
- [ ] Tecnologia conhecida?

### Referência de Story Points
| Story Points | Referência | Exemplo |
|--------------|------------|---------|
| 1 | Trivial | Mudança de texto |
| 2 | Simples | CRUD básico |
| 3 | Médio | Feature com lógica |
| 5 | Complexo | Integração externa |
| 8 | Muito complexo | Novo módulo |
| 13 | Épico | Refatoração grande |

### Estimativa Sugerida: [X] story points
### Justificativa: ...`;
            }
            else if (prompt.includes('/retro')) {
                enhancedPrompt = `Facilite uma retrospectiva sobre: ${input.prompt.replace('/retro', '').trim()}

## Retrospectiva do Sprint [X]

### 🎉 O que foi bem?
[Liste pontos positivos]

### 😞 O que pode melhorar?
[Liste pontos a melhorar]

### 💡 Ideias e Ações
| Ação | Responsável | Prazo |
|------|-------------|-------|
| ... | ... | ... |

### 📊 Métricas do Sprint
- Velocity: [X] story points
- Stories completadas: [Y/Z]
- Bugs encontrados: [N]

### 🎯 Compromissos para o Próximo Sprint
1. ...
2. ...

### Formato Alternativo: Start/Stop/Continue
**Start:** O que devemos começar a fazer?
**Stop:** O que devemos parar de fazer?
**Continue:** O que devemos continuar fazendo?`;
            }
            const response = await this.callAI(enhancedPrompt, input.context);
            return this.createOutput(response.content, response.tokensUsed, startTime, this.extractSuggestedActions(response.content));
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return this.createOutput(`Erro no planejamento: ${errorMsg}`, undefined, startTime);
        }
    }
}
// Singleton
export const scrumMasterAgent = new ScrumMasterAgent();
//# sourceMappingURL=scrum-master-agent.js.map