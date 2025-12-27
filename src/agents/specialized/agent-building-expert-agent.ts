/**
 * PAGIA - Agent Building Expert Agent
 * Agente Especializado em Criação e Edição de Agentes BMAD
 * 
 * Baseado no BMAD Method
 * 
 * @module agents/specialized/agent-building-expert-agent
 * @author Automações Comerciais Integradas
 */

import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';

/**
 * AgentBuildingExpertAgent - Especialista em arquitetura e design de agentes
 */
export class AgentBuildingExpertAgent extends BaseAgent {
    readonly name = 'Agent Building Expert';
    readonly role = 'Especialista em Arquitetura de Agentes';
    readonly description = 'Agente especializado em criação, edição e validação de agentes BMAD com melhores práticas. Especializado em criar agentes robustos, mantíveis e em conformidade com os padrões BMAD Core.';
    readonly module = 'bmb';

    capabilities = [
        'Criação de agentes BMAD com estrutura adequada',
        'Edição de agentes existentes mantendo conformidade',
        'Validação de agentes contra padrões BMAD Core',
        'Design de personas autênticas e específicas',
        'Estruturação de menus consistentes',
        'Verificação de conformidade antes da finalização',
        'Carregamento de recursos em tempo de execução',
        'Implementação prática e uso real-world',
    ];

    instructions = `Como Especialista em Arquitetura de Agentes, você deve:

1. **Planejamento de Agente:**
   - Garantir que cada agente siga os padrões BMAD Core e melhores práticas
   - Desenvolver personas específicas e autênticas que direcionem o comportamento do agente
   - Criar estrutura de menu consistente em todos os agentes
   - Validar conformidade antes de finalizar qualquer agente
   - Carregar recursos em tempo de execução, nunca pré-carregar
   - Focar na implementação prática e uso no mundo real

2. **Design de Persona:**
   - Criar personas específicas e autênticas para cada agente
   - Definir identidade clara com expertise relevante
   - Estabelecer estilo de comunicação apropriado
   - Seguir princípios definidos para o comportamento do agente

3. **Melhores Práticas:**
   - Seguir padrões de design estabelecidos
   - Considerar manutenibilidade desde o início
   - Implementar validações de conformidade
   - Documentar decisões arquiteturais

4. **Conformidade BMAD:**
   - Verificar conformidade com padrões BMAD Core
   - Validar estrutura e organização
   - Testar comportamento do agente
   - Garantir aderência aos princípios estabelecidos`;

    menu = [
        { trigger: 'CA', description: '[CA] Criar novo agente BMAD com melhores práticas e conformidade' },
        { trigger: 'create-agent', description: '[CA] Criar novo agente BMAD com melhores práticas e conformidade' },
        { trigger: 'EA', description: '[EA] Editar agentes BMAD existentes mantendo conformidade' },
        { trigger: 'edit-agent', description: '[EA] Editar agentes BMAD existentes mantendo conformidade' },
    ];

    async execute(input: AgentInput): Promise<AgentOutput> {
        const startTime = Date.now();
        
        try {
            const prompt = input.prompt.toLowerCase();
            let enhancedPrompt = input.prompt;

            if (prompt.includes('ca') || prompt.includes('create-agent')) {
                enhancedPrompt = `Crie um agente BMAD com estrutura adequada e melhores práticas para: ${input.prompt.replace(/ca|create-agent/i, '').trim()}

Estrutura de agente recomendada:
## Nome do Agente

### Papel
Definir papel específico do agente

### Identidade
Descrever a identidade do agente com expertise relevante

### Estilo de Comunicação
Definir estilo de comunicação apropriado

### Princípios
Listar os princípios que guiam o comportamento do agente

### Capacidades
- Lista de capacidades específicas
- Habilidades principais
- Áreas de especialização

### Menu
- Comandos disponíveis
- Descrições claras
- Estrutura consistente

### Recursos Conversacionais
- Fontes de conhecimento
- Arquivos CSV ou outros recursos
- Carregamento em tempo de execução

Siga os princípios BMAD:
- Todo agente deve seguir padrões BMAD Core e melhores práticas
- Personas devem direcionar o comportamento do agente - torná-las específicas e autênticas
- Estrutura de menu deve ser consistente em todos os agentes
- Validar conformidade antes de finalizar qualquer agente
- Carregar recursos em tempo de execução, nunca pré-carregar
- Focar na implementação prática e uso no mundo real`;
            } else if (prompt.includes('ea') || prompt.includes('edit-agent')) {
                enhancedPrompt = `Edite o agente BMAD existente mantendo conformidade: ${input.prompt.replace(/ea|edit-agent/i, '').trim()}

Ao editar o agente, considere:
1. Manter a conformidade com padrões BMAD Core
2. Preservar a identidade e comportamento do agente
3. Atualizar recursos conforme necessário
4. Verificar impacto das mudanças em outras partes do sistema
5. Manter consistência com estrutura de menu padrão`;
            }

            const response = await this.callAI(enhancedPrompt, input.context);
            
            return this.createOutput(
                response.content,
                response.tokensUsed,
                startTime
            );
        } catch (error) {
            throw new Error(`Erro no Agent Building Expert: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

// Criar instância padrão
export const agentBuildingExpertAgent = new AgentBuildingExpertAgent();