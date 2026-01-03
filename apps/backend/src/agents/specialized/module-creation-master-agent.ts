/**
 * PAGIA - Module Creation Master Agent
 * Agente Especializado em Criação e Edição de Módulos BMAD
 * 
 * Baseado no BMAD Method
 * 
 * @module agents/specialized/module-creation-master-agent
 * @author Automações Comerciais Integradas
 */

import { BaseAgent, AgentInput, AgentOutput } from '../base-agent.js';

/**
 * ModuleCreationMasterAgent - Especialista em arquitetura e design de módulos
 */
export class ModuleCreationMasterAgent extends BaseAgent {
    readonly name = 'Module Creation Master';
    readonly role = 'Especialista em Arquitetura de Módulos';
    readonly description = 'Agente especializado em criação, edição e validação de módulos BMAD completos com melhores práticas. Especializado em criar módulos coesos, escaláveis e que entregam funcionalidade completa.';
    readonly module = 'bmb';

    capabilities = [
        'Criação de módulos BMAD completos com estrutura adequada',
        'Edição de módulos existentes mantendo coerência',
        'Validação de módulos contra melhores práticas',
        'Planejamento estratégico de módulos',
        'Design de sistemas full-stack',
        'Integração e dependências entre módulos',
        'Documentação e exemplos completos',
        'Planejamento para crescimento e evolução',
        'Avaliação de ciclo de vida do módulo',
        'Balanceamento entre inovação e padrões comprovados',
    ];

    instructions = `Como Especialista em Arquitetura de Módulos, você deve:

1. **Planejamento de Módulo:**
   - Garantir que os módulos sejam autocontidos mas integrem-se perfeitamente
   - Cada módulo deve resolver problemas de negócio específicos de forma eficaz
   - Documentação e exemplos são tão importantes quanto o código
   - Planejar para crescimento e evolução desde o primeiro dia
   - Equilibrar inovação com padrões comprovados
   - Considerar todo o ciclo de vida do módulo, desde a criação até a manutenção

2. **Arquitetura de Módulo:**
   - Criar módulos coesos e escaláveis
   - Implementar padrões de integração
   - Definir dependências claras e gerenciáveis
   - Criar estrutura de diretórios padronizada

3. **Melhores Práticas:**
   - Seguir padrões de design estabelecidos
   - Considerar reusabilidade desde o início
   - Implementar testes e validações
   - Documentar decisões arquiteturais

4. **Ciclo de Vida do Módulo:**
   - Planejamento e conceitualização
   - Desenvolvimento e implementação
   - Testes e validação
   - Documentação e exemplos
   - Implantação e manutenção
   - Evolução e atualizações`;

    menu = [
        { trigger: 'BM', description: '[BM] Brainstorm e conceitualizar novos módulos BMAD' },
        { trigger: 'brainstorm-module', description: '[BM] Brainstorm e conceitualizar novos módulos BMAD' },
        { trigger: 'PB', description: '[PB] Criar brief de produto para desenvolvimento de módulo BMAD' },
        { trigger: 'product-brief', description: '[PB] Criar brief de produto para desenvolvimento de módulo BMAD' },
        { trigger: 'CM', description: '[CM] Criar módulo BMAD completo com agentes, fluxos de trabalho e infraestrutura' },
        { trigger: 'create-module', description: '[CM] Criar módulo BMAD completo com agentes, fluxos de trabalho e infraestrutura' },
        { trigger: 'EM', description: '[EM] Editar módulos BMAD existentes mantendo coerência' },
        { trigger: 'edit-module', description: '[EM] Editar módulos BMAD existentes mantendo coerência' },
        { trigger: 'VM', description: '[VM] Executar verificação de conformidade de módulos BMAD contra melhores práticas' },
        { trigger: 'validate-module', description: '[VM] Executar verificação de conformidade de módulos BMAD contra melhores práticas' },
    ];

    async execute(input: AgentInput): Promise<AgentOutput> {
        const startTime = Date.now();
        
        try {
            const prompt = input.prompt.toLowerCase();
            let enhancedPrompt = input.prompt;

            if (prompt.includes('bm') || prompt.includes('brainstorm-module')) {
                enhancedPrompt = `Brainstorm e conceitualize um novo módulo BMAD para: ${input.prompt.replace(/bm|brainstorm-module/i, '').trim()}

Estrutura de brainstorming de módulo:
## Nome do Módulo
Definir nome apropriado e descritivo

## Propósito
Descrever o propósito central do módulo

## Problemas de Negócio
Identificar os problemas de negócio específicos que o módulo resolverá

## Funcionalidades Principais
Listar as funcionalidades principais que o módulo deve oferecer

## Público-alvo
Definir o público-alvo ou usuários do módulo

## Requisitos Técnicos
Identificar os requisitos técnicos necessários

## Integrações
Descrever possíveis integrações com outros módulos ou sistemas

## Restrições
Listar quaisquer restrições ou limitações conhecidas

Siga os princípios BMAD:
- Módulos devem ser autocontidos mas integrar-se perfeitamente
- Cada módulo deve resolver problemas de negócio específicos de forma eficaz
- Considerar todo o ciclo de vida do módulo desde a criação até a manutenção`;
            } else if (prompt.includes('pb') || prompt.includes('product-brief')) {
                enhancedPrompt = `Crie um brief de produto para desenvolvimento de módulo BMAD: ${input.prompt.replace(/pb|product-brief/i, '').trim()}

Estrutura de brief de produto:
## Nome do Módulo
Definir nome apropriado e descritivo

## Visão Geral
Breve descrição do módulo e seu propósito

## Objetivos
Listar os objetivos principais do módulo

## Escopo
Definir o escopo do módulo (o que está incluído e o que não está)

## Funcionalidades Detalhadas
Descrever em detalhes as funcionalidades do módulo

## Requisitos Técnicos
Listar os requisitos técnicos necessários

## Público-alvo
Definir o público-alvo ou usuários do módulo

## Benefícios Esperados
Descrever os benefícios que o módulo trará

## Indicadores de Sucesso
Definir como o sucesso do módulo será medido

## Riscos e Mitigação
Identificar possíveis riscos e estratégias de mitigação

## Cronograma
Estimativa de prazo para desenvolvimento`;
            } else if (prompt.includes('cm') || prompt.includes('create-module')) {
                enhancedPrompt = `Crie um módulo BMAD completo com agentes, fluxos de trabalho e infraestrutura para: ${input.prompt.replace(/cm|create-module/i, '').trim()}

Estrutura de criação de módulo:
## Estrutura de Diretórios
\`\`\`
module-name/
├── agents/
│   ├── agent1.ts
│   └── agent2.ts
├── workflows/
│   ├── workflow1.yaml
│   └── workflow2.yaml
├── tasks/
├── templates/
├── config.yaml
├── module.yaml
└── README.md
\`\`\`

## Arquivo module.yaml
Definir configuração do módulo com:
- Nome e descrição
- Versão
- Dependências
- Configurações específicas

## Agentes
Criar agentes especializados para as funcionalidades do módulo

## Workflows
Definir fluxos de trabalho que automatizam processos do módulo

## Configurações
Definir configurações padrão e variáveis de ambiente

## Documentação
Criar documentação completa com exemplos de uso

Siga os princípios BMAD:
- Módulos devem ser autocontidos mas integrar-se perfeitamente
- Documentação e exemplos são tão importantes quanto o código
- Planejar para crescimento e evolução desde o primeiro dia`;
            } else if (prompt.includes('em') || prompt.includes('edit-module')) {
                enhancedPrompt = `Edite o módulo BMAD existente mantendo coerência: ${input.prompt.replace(/em|edit-module/i, '').trim()}

Ao editar o módulo, considere:
1. Manter a coerência arquitetural do módulo
2. Preservar a funcionalidade existente
3. Atualizar documentação conforme alterações
4. Verificar impacto das mudanças em outras partes do sistema
5. Manter compatibilidade com padrões BMAD
6. Atualizar testes e validações conforme necessário`;
            } else if (prompt.includes('vm') || prompt.includes('validate-module')) {
                enhancedPrompt = `Execute verificação de conformidade de módulo BMAD contra melhores práticas: ${input.prompt.replace(/vm|validate-module/i, '').trim()}

Verifique os seguintes aspectos:
1. Estrutura e organização do módulo
2. Coerência arquitetural
3. Documentação completa
4. Testes e validações adequadas
5. Conformidade com padrões BMAD
6. Integrações e dependências
7. Performance e escalabilidade
8. Segurança e boas práticas

Forneça relatório com:
- Itens em conformidade
- Itens necessitando correção
- Recomendações de melhoria
- Priorização das correções`;
            }

            const response = await this.callAI(enhancedPrompt, input.context);
            
            return this.createOutput(
                response.content,
                response.tokensUsed,
                startTime
            );
        } catch (error) {
            throw new Error(`Erro no Module Creation Master: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

// Criar instância padrão
export const moduleCreationMasterAgent = new ModuleCreationMasterAgent();