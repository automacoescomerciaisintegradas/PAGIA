/**
 * PAGIA - Workflow Building Master Agent
 * Agente Especializado em Criação e Edição de Workflows BMAD
 *
 * Baseado no BMAD Method
 *
 * @module agents/specialized/workflow-building-master-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent } from '../base-agent.js';
/**
 * WorkflowBuildingMasterAgent - Especialista em arquitetura e design de workflows
 */
export class WorkflowBuildingMasterAgent extends BaseAgent {
    name = 'Workflow Building Master';
    role = 'Especialista em Arquitetura de Workflows';
    description = 'Agente especializado em criação, edição e validação de workflows BMAD com melhores práticas. Especializado em criar workflows eficientes, escaláveis e integrados aos sistemas BMAD.';
    module = 'bmb';
    capabilities = [
        'Criação de workflows BMAD com estrutura adequada',
        'Edição de workflows existentes mantendo integridade',
        'Validação de workflows contra melhores práticas',
        'Documentação de workflows',
        'Otimização de performance de workflows',
        'Gestão de estados e transições de workflows',
        'Tratamento de erros e casos extremos em workflows',
        'Design de fluxos de dados eficientes',
    ];
    instructions = `Como Especialista em Arquitetura de Workflows, você deve:

1. **Planejamento de Workflow:**
   - Criar workflows eficientes, confiáveis e mantíveis
   - Definir pontos claros de entrada e saída
   - Considerar tratamento de erros e casos extremos como críticos
   - Documentar workflows de forma abrangente e clara
   - Testar workflows exaustivamente antes da implantação
   - Otimizar para performance e experiência do usuário

2. **Estrutura de Workflow:**
   - Garantir que cada workflow tenha uma estrutura bem definida
   - Usar padrões consistentes de nomenclatura
   - Implementar validações em cada etapa
   - Criar mecanismos de logging e monitoramento

3. **Melhores Práticas:**
   - Workflows devem ser modulares e reutilizáveis
   - Utilizar padrões de design estabelecidos
   - Considerar a escalabilidade desde o início
   - Implementar estratégias de fallback e recuperação

4. **Validação:**
   - Verificar conformidade com padrões BMAD
   - Validar fluxos de dados e transições de estado
   - Testar cenários de falha e recuperação
   - Garantir cobertura adequada de testes`;
    menu = [
        { trigger: 'CW', description: '[CW] Criar novo workflow BMAD com estrutura e melhores práticas' },
        { trigger: 'create-workflow', description: '[CW] Criar novo workflow BMAD com estrutura e melhores práticas' },
        // { trigger: 'EW', description: '[EW] Editar workflows BMAD existentes mantendo integridade' },
        // { trigger: 'edit-workflow', description: '[EW] Editar workflows BMAD existentes mantendo integridade' },
        // { trigger: 'VW', description: '[VW] Executar verificação de conformidade de workflows BMAD contra melhores práticas' },
        // { trigger: 'validate-workflow', description: '[VW] Executar verificação de conformidade de workflows BMAD contra melhores práticas' },
    ];
    async execute(input) {
        const startTime = Date.now();
        try {
            const prompt = input.prompt.toLowerCase();
            let enhancedPrompt = input.prompt;
            if (prompt.includes('cw') || prompt.includes('create-workflow')) {
                enhancedPrompt = `Crie um workflow BMAD com estrutura adequada e melhores práticas para: ${input.prompt.replace(/cw|create-workflow/i, '').trim()}

Estrutura de workflow recomendada:
## Nome do Workflow

### Descrição
Breve descrição do propósito do workflow

### Entrada
- Definir os dados de entrada necessários

### Saída
- Definir os dados de saída esperados

### Etapas
1. Nome da Etapa
   - Descrição
   - Tipo (ação, decisão, entrada, saída)
   - Agente responsável (se aplicável)
   - Próxima etapa

### Tratamento de Erros
- Definir estratégias para diferentes tipos de falhas

### Validação
- Critérios para verificar se o workflow está funcionando corretamente

### Monitoramento
- Métricas e indicadores para acompanhar o desempenho

Siga os princípios BMAD:
- Workflows devem ser eficientes, confiáveis e mantíveis
- Todo workflow deve ter pontos claros de entrada e saída
- Tratamento de erros e casos extremos são críticos
- Documentação deve ser abrangente e clara
- Testar workflows exaustivamente antes da implantação
- Otimizar para performance e experiência do usuário`;
            }
            else if (prompt.includes('ew') || prompt.includes('edit-workflow')) {
                enhancedPrompt = `Edite o workflow BMAD existente mantendo integridade: ${input.prompt.replace(/ew|edit-workflow/i, '').trim()}

Ao editar o workflow, considere:
1. Manter a integridade da estrutura original
2. Preservar os pontos de entrada e saída
3. Atualizar documentação conforme alterações
4. Verificar impacto das mudanças em outras partes do sistema
5. Manter conformidade com melhores práticas BMAD`;
            }
            else if (prompt.includes('vw') || prompt.includes('validate-workflow')) {
                enhancedPrompt = `Execute verificação de conformidade do workflow BMAD contra melhores práticas: ${input.prompt.replace(/vw|validate-workflow/i, '').trim()}

Verifique os seguintes aspectos:
1. Estrutura e organização
2. Pontos de entrada e saída claros
3. Tratamento de erros adequado
4. Documentação completa
5. Performance e escalabilidade
6. Conformidade com padrões BMAD

Forneça relatório com:
- Itens em conformidade
- Itens necessitando correção
- Recomendações de melhoria
- Priorização das correções`;
            }
            const response = await this.callAI(enhancedPrompt, input.context);
            return this.createOutput(response.content, response.tokensUsed, startTime);
        }
        catch (error) {
            throw new Error(`Erro no Workflow Building Master: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
// Criar instância padrão
export const workflowBuildingMasterAgent = new WorkflowBuildingMasterAgent();
//# sourceMappingURL=workflow-building-master-agent.js.map