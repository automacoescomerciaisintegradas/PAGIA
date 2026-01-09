/**
 * PAGIA - Debugger Agent
 * Agente Especializado em Depuração de Erros
 *
 * Baseado nos padrões do projeto PAGIA
 *
 * @module agents/specialized/debugger-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent } from '../base-agent.js';
/**
 * DebuggerAgent - Especialista em depuração de erros
 */
export class DebuggerAgent extends BaseAgent {
    name = 'Debugger';
    role = 'Especialista em Depuração de Erros';
    description = 'Agente especializado em análise de causas raiz de erros, falhas em testes e comportamentos inesperados. Usa proativamente quando encontrar qualquer problema técnico.';
    module = 'debugging';
    capabilities = [
        'Análise de mensagens de erro e stack traces',
        'Identificação de passos de reprodução',
        'Isolamento de localização de falhas',
        'Implementação de correções mínimas',
        'Verificação de soluções',
        'Análise de causas raiz',
        'Prevenção de regressões',
        'Adição de logging estratégico'
    ];
    instructions = `Como Especialista em Depuração, você deve:

1. **Análise de Erros**
   - Capturar mensagens de erro e stack traces completos
   - Identificar padrões comuns de falhas
   - Verificar logs relevantes
   - Analisar contexto da execução

2. **Processo de Depuração**
   - Analisar mensagens de erro e logs
   - Verificar mudanças recentes de código
   - Formular e testar hipóteses
   - Adicionar logging de debug estratégico
   - Inspeção de estados de variáveis

3. **Resolução de Problemas**
   - Focar na causa raiz, não nos sintomas
   - Implementar correções mínimas e diretas
   - Verificar que a solução funciona
   - Prevenir regressões futuras
   - Documentar a resolução

4. **Melhores Práticas**
   - Manter foco na causa raiz
   - Testar soluções antes de aplicar
   - Documentar processo de debug
   - Fornecer recomendações de prevenção

5. **Ferramentas Especializadas**
   - Leitura e análise de arquivos de log
   - Busca de padrões em código
   - Execução de comandos de diagnóstico
   - Edição de código para correções`;
    menu = [
        { trigger: '/debug', description: 'Análise completa de erro' },
        { trigger: '/trace', description: 'Análise de stack trace' },
        { trigger: '/root-cause', description: 'Análise de causa raiz' },
        { trigger: '/fix', description: 'Implementar correção' },
        { trigger: '/verify', description: 'Verificar solução' },
        { trigger: '/prevention', description: 'Recomendações de prevenção' },
    ];
    async execute(input) {
        const startTime = Date.now();
        try {
            const prompt = input.prompt.toLowerCase();
            let enhancedPrompt = input.prompt;
            if (prompt.includes('/debug')) {
                enhancedPrompt = `Realize uma análise completa de debugging para o seguinte problema:

${input.prompt.replace('/debug', '').trim()}

## Processo de Debugging Completo

### 1. **Captura de Informações**
#### Mensagem de Erro
- **Tipo**: [Tipo de erro]
- **Mensagem**: [Mensagem completa]
- **Stack Trace**: [Trace completo se disponível]

#### Contexto de Execução
- **Ambiente**: [Ambiente onde ocorreu]
- **Parâmetros**: [Parâmetros de entrada]
- **Estado anterior**: [Estado do sistema antes do erro]

### 2. **Análise de Causa Raiz**
#### Hipóteses
1. **Hipótese 1**: [Possível causa]
   - **Evidência**: [Evidências que suportam]
   - **Impacto**: [Gravidade do problema]

2. **Hipótese 2**: [Possível causa alternativa]
   - **Evidência**: [Evidências que suportam]
   - **Impacto**: [Gravidade do problema]

3. **Hipótese 3**: [Outra possibilidade]
   - **Evidência**: [Evidências que suportam]
   - **Impacto**: [Gravidade do problema]

### 3. **Investigação Técnica**
#### Arquivos Afetados
- [Lista de arquivos que precisam ser investigados]
- [Linhas de código específicas]
- [Funções ou métodos envolvidos]

#### Logs Relevantes
- [Locais onde logs devem ser verificados]
- [Níveis de log relevantes]
- [Padrões de busca]

### 4. **Solução Proposta**
#### Correção Imediata
- **Passo 1**: [Ação imediata]
- **Passo 2**: [Segunda ação]
- **Passo 3**: [Verificação]

#### Implementação
\`\`\`typescript
// Exemplo de correção
${this.generateSampleFix(input.prompt)}
\`\`\`

### 5. **Verificação**
- **Teste unitário**: [Como testar a correção]
- **Teste de integração**: [Verificação de integração]
- **Teste de regressão**: [Garantir que nada mais foi quebrado]

### 6. **Prevenção**
- **Monitoramento**: [Como detectar esse erro no futuro]
- **Testes**: [Testes que devem ser adicionados]
- **Documentação**: [Documentação que deve ser atualizada]

Forneça uma análise completa com base nas informações fornecidas.`;
            }
            else if (prompt.includes('/trace')) {
                enhancedPrompt = `Analise o seguinte stack trace:

${input.prompt.replace('/trace', '').trim()}

## Análise de Stack Trace

### 1. **Estrutura do Trace**
#### Cadeia de Chamadas
\`\`\`
${this.formatStackTrace(input.prompt.replace('/trace', '').trim())}
\`\`\`

#### Funções Envolvidas
- **Função principal**: [Função onde o erro ocorreu]
- **Funções intermediárias**: [Funções chamadas antes]
- **Função de origem**: [Origem da chamada]

### 2. **Análise Técnica**
#### Localização do Erro
- **Arquivo**: [Caminho do arquivo]
- **Linha**: [Número da linha]
- **Coluna**: [Posição na linha]
- **Função**: [Nome da função]

#### Tipo de Erro
- **Categoria**: [TypeError, ReferenceError, etc.]
- **Descrição**: [Explicação do tipo de erro]
- **Condições**: [Condições que levaram ao erro]

### 3. **Contexto de Execução**
#### Parâmetros
- **Entradas**: [Parâmetros passados para a função]
- **Variáveis locais**: [Estado das variáveis locais]
- **Estado do objeto**: [Estado do objeto (this)]

#### Fluxo de Execução
- **Caminho percorrido**: [Sequência de chamadas]
- **Decisões tomadas**: [Condicionais relevantes]
- **Pontos de falha**: [Onde o erro poderia ter sido evitado]

### 4. **Hipóteses de Causa**
1. **Null/Undefined Reference**: [Valor nulo ou indefinido acessado]
2. **Type Mismatch**: [Tipos incompatíveis]
3. **Scope Issue**: [Problema de escopo]
4. **Async Issue**: [Problema com assincronicidade]
5. **Resource Unavailable**: [Recurso indisponível]

### 5. **Sugestões de Correção**
#### Verificação de Valores
\`\`\`typescript
// Verificar antes de acessar propriedades
if (obj && obj.property) {
  // Acessar obj.property
}
\`\`\`

#### Tratamento de Erros
\`\`\`typescript
try {
  // Código propenso a erro
} catch (error) {
  // Tratar erro adequadamente
  console.error('Erro detalhado:', error);
}
\`\`\`

Forneça análise detalhada do stack trace fornecido.`;
            }
            else if (prompt.includes('/root-cause')) {
                enhancedPrompt = `Realize uma análise de causa raiz para o seguinte problema:

${input.prompt.replace('/root-cause', '').trim()}

## Análise de Causa Raiz (Root Cause Analysis)

### 1. **Definição do Problema**
#### Descrição
- **O que está acontecendo**: [Descrição clara do problema]
- **Quando ocorre**: [Condições de ocorrência]
- **Impacto**: [Consequências do problema]
- **Frequência**: [Com que frequência ocorre]

### 2. **Método 5 Whys (5 Porquês)**
#### Iteração 1
- **Problema**: [Descrição do problema]
- **Por que?**: [Primeira razão]

#### Iteração 2
- **Problema**: [Razão anterior]
- **Por que?**: [Segunda razão]

#### Iteração 3
- **Problema**: [Razão anterior]
- **Por que?**: [Terceira razão]

#### Iteração 4
- **Problema**: [Razão anterior]
- **Por que?**: [Quarta razão]

#### Iteração 5
- **Causa Raiz**: [Causa fundamental]

### 3. **Análise Fishbone (Espinha de Peixe)**
#### Categorias
- **Pessoas**: [Fatores humanos envolvidos]
- **Processos**: [Processos que contribuíram]
- **Tecnologia**: [Fatores tecnológicos]
- **Ambiente**: [Condições ambientais]
- **Materiais**: [Recursos envolvidos]
- **Medidas**: [Métricas e medições]

### 4. **Análise de Contribuição**
#### Fatores Contribuintes
1. **Fator 1**: [Como contribuiu]
2. **Fator 2**: [Como contribuiu]
3. **Fator 3**: [Como contribuiu]

#### Condições Preexistentes
- [Condições que tornaram o problema possível]
- [Fatores sistêmicos envolvidos]

### 5. **Evidências**
#### Provas Técnicas
- [Evidências de código]
- [Logs relevantes]
- [Resultados de testes]

#### Provas Indiretas
- [Indícios indiretos do problema]
- [Padrões observados]
- [Comportamentos anômalos]

### 6. **Soluções e Prevenção**
#### Solução Imediata
- [Correção temporária]
- [Mitigação imediata]

#### Solução Permanente
- [Correção definitiva]
- [Mudanças estruturais necessárias]

#### Medidas Preventivas
- [Controles para evitar repetição]
- [Melhorias de processo]
- [Treinamentos necessários]

Forneça uma análise de causa raiz completa e detalhada.`;
            }
            else if (prompt.includes('/fix')) {
                enhancedPrompt = `Implemente uma correção para o seguinte problema:

${input.prompt.replace('/fix', '').trim()}

## Implementação de Correção

### 1. **Análise do Problema**
#### Descrição do Bug
- **O que está errado**: [Descrição do problema]
- **Onde ocorre**: [Localização do problema]
- **Condições de reprodução**: [Como reproduzir]

#### Impacto
- **Gravidade**: [Baixa, Média, Alta, Crítica]
- **Alcance**: [Quantos usuários/áreas afetadas]
- **Urgência**: [Prioridade de correção]

### 2. **Planejamento da Correção**
#### Objetivo da Correção
- **Corrigir**: [O quê exatamente será corrigido]
- **Não quebrar**: [O que deve continuar funcionando]
- **Melhorar**: [Oportunidades de melhoria]

#### Abrangência
- **Arquivos a modificar**: [Lista de arquivos]
- **Testes necessários**: [Tipos de testes]
- **Verificações**: [Validações necessárias]

### 3. **Implementação**
#### Código Original
\`\`\`typescript
// Exemplo de código problemático
${this.generateProblematicCode(input.prompt)}
\`\`\`

#### Código Corrigido
\`\`\`typescript
// Código corrigido
${this.generateFixedCode(input.prompt)}
\`\`\`

#### Explicação da Correção
- **O que foi alterado**: [Descrição das alterações]
- **Por que resolve**: [Justificativa da solução]
- **Alternativas consideradas**: [Outras abordagens]

### 4. **Testes de Validação**
#### Teste Unitário
\`\`\`typescript
// Teste para validar a correção
describe('Correção', () => {
  it('deve resolver o problema', () => {
    // Teste específico
  });
});
\`\`\`

#### Teste de Regressão
- [Testes que garantem que nada mais foi quebrado]
- [Verificações de funcionalidades adjacentes]

### 5. **Implementação Gradual**
#### Passos de Deploy
1. **Backup**: [Salvar estado atual]
2. **Aplicar correção**: [Aplicar alterações]
3. **Testar**: [Executar testes]
4. **Monitorar**: [Observar comportamento após correção]

Forneça a implementação da correção com base no problema descrito.`;
            }
            else if (prompt.includes('/verify')) {
                enhancedPrompt = `Verifique se a solução proposta está funcionando corretamente:

${input.prompt.replace('/verify', '').trim()}

## Processo de Verificação de Solução

### 1. **Critérios de Sucesso**
#### Objetivos
- [ ] Problema original está resolvido
- [ ] Nenhuma funcionalidade existente foi quebrada
- [ ] Performance não foi negativamente impactada
- [ ] Segurança não foi comprometida
- [ ] Novos testes passam
- [ ] Testes existentes continuam passando

### 2. **Testes de Validação**
#### Teste de Unidade
- **Caso de teste**: [Descrição do caso]
- **Entrada**: [Dados de entrada]
- **Saída esperada**: [Resultado esperado]
- **Resultado real**: [Resultado obtido após correção]

#### Teste de Integração
- **Componentes envolvidos**: [Quais componentes interagem]
- **Fluxo testado**: [Sequência de operações]
- **Resultados observados**: [O que foi observado]

#### Teste de Regressão
- **Áreas afetadas**: [Partes do sistema testadas]
- **Casos de uso**: [Cenários verificados]
- **Resultados**: [Status dos testes]

### 3. **Verificação Técnica**
#### Análise de Código
- **Qualidade**: [Avaliação da qualidade do código]
- **Conformidade**: [Conformidade com padrões]
- **Segurança**: [Verificação de segurança]

#### Métricas de Desempenho
- **Tempo de execução**: [Antes x Após]
- **Uso de memória**: [Antes x Após]
- **Recursos utilizados**: [Antes x Após]

### 4. **Verificação Manual**
#### Casos de Teste Manuais
- **Caso 1**: [Descrição e resultado]
- **Caso 2**: [Descrição e resultado]
- **Caso 3**: [Descrição e resultado]

#### Verificação de Interface
- **Visual**: [Elementos visuais corretos]
- **Funcionalidade**: [Funcionalidades operando corretamente]
- **Feedback**: [Sistemas de feedback adequados]

### 5. **Relatório de Verificação**
#### Status
- **Correção aplicada**: [Sim/Não]
- **Problema resolvido**: [Sim/Não]
- **Efeitos colaterais**: [Lista de quaisquer efeitos]

#### Recomendações
- **Continuar**: [Se a solução deve ser mantida]
- **Ajustar**: [Ajustes adicionais necessários]
- **Reverter**: [Se a solução causou problemas]

Forneça um relatório completo de verificação da solução.`;
            }
            else if (prompt.includes('/prevention')) {
                enhancedPrompt = `Forneça recomendações de prevenção para evitar que o problema ocorra novamente:

${input.prompt.replace('/prevention', '').trim()}

## Recomendações de Prevenção

### 1. **Análise de Padrões**
#### Tipos Comuns de Problemas
- **Erros de validação**: [Falta de validação de entrada]
- **Erros de lógica**: [Problemas na lógica de negócio]
- **Erros de integração**: [Falhas na comunicação entre componentes]
- **Erros de estado**: [Problemas com estado compartilhado]
- **Erros de concorrência**: [Problemas com operações simultâneas]

### 2. **Controles Preventivos**
#### Controle de Código
- **Reviews obrigatórios**: [Todos os PRs devem ser revisados]
- **Análise estática**: [Ferramentas de análise automática]
- **Padrões de codificação**: [Guia de estilo e melhores práticas]

#### Controle de Testes
- **Cobertura mínima**: [Percentual mínimo de cobertura]
- **Testes de mutação**: [Validação da eficácia dos testes]
- **Testes de carga**: [Verificação de performance sob carga]

#### Controle de Ambiente
- **Ambientes isolados**: [Testes em ambientes separados]
- **Rollback automático**: [Reversão automática de falhas]
- **Monitoramento contínuo**: [Detecção de anomalias]

### 3. **Ferramentas de Prevenção**
#### Análise Estática
\`\`\`json
{
  "eslint": {
    "rules": {
      "no-undef": "error",
      "no-unused-vars": "warn",
      "prefer-const": "error"
    }
  }
}
\`\`\`

#### Testes Automatizados
- **Testes unitários**: [Executados em cada commit]
- **Testes de integração**: [Executados em cada PR]
- **Testes de ponta a ponta**: [Executados antes do deploy]

#### Monitoramento
- **Alertas proativos**: [Detecção de padrões de erro]
- **Dashboards**: [Visualização de métricas importantes]
- **Logging estruturado**: [Logs fáceis de analisar]

### 4. **Processos de Prevenção**
#### Desenvolvimento
- **TDD**: [Testes escritos antes do código]
- **Pair programming**: [Revisão em tempo real]
- **Code dojos**: [Melhoria contínua de habilidades]

#### Revisão
- **Checklists**: [Verificação sistemática]
- **Post-mortems**: [Análise após incidentes]
- **Learning reviews**: [Lições aprendidas]

### 5. **Treinamento e Conscientização**
#### Tópicos Importantes
- **Boas práticas de codificação**
- **Padrões de design comuns**
- **Técnicas de debugging**
- **Ferramentas de desenvolvimento**
- **Processos de qualidade**

#### Recursos
- **Documentação**: [Guias e tutoriais]
- **Workshops**: [Treinamentos práticos]
- **Mentoria**: [Apoio individualizado]

Forneça recomendações específicas de prevenção com base no problema descrito.`;
            }
            else {
                // Prompt genérico para debugging
                enhancedPrompt = `Como Especialista em Depuração, analise e resolva o seguinte problema:

${input.prompt}

Use as melhores práticas de debugging para:
1. Analisar a causa raiz do problema
2. Propor uma solução eficaz
3. Fornecer instruções claras para implementação
4. Recomendar testes para verificar a correção
5. Sugerir medidas preventivas para evitar que o problema ocorra novamente

Siga o processo de debugging: capture informações, formule hipóteses, teste soluções e verifique os resultados.`;
            }
            const response = await this.callAI(enhancedPrompt, input.context);
            return this.createOutput(response.content, response.tokensUsed, startTime, this.extractSuggestedActions(response.content));
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return this.createOutput(`Erro no debugger: ${errorMsg}`, undefined, startTime);
        }
    }
    generateSampleFix(problemDescription) {
        // Gera um exemplo de correção baseado na descrição do problema
        if (problemDescription.toLowerCase().includes('null') || problemDescription.toLowerCase().includes('undefined')) {
            return `// Verificação de null/undefined antes de acessar propriedades
if (obj && obj.property) {
  return obj.property.value;
} else {
  return defaultValue;
}`;
        }
        else {
            return `// Exemplo de correção genérica
try {
  // Código corrigido
  return processValue(input);
} catch (error) {
  console.error('Erro processando valor:', error);
  return defaultValue;
}`;
        }
    }
    formatStackTrace(trace) {
        // Formata o stack trace para melhor leitura
        return trace.split('\\n').map(line => `  ${line}`).join('\\n');
    }
    generateProblematicCode(problemDescription) {
        // Gera código problemático de exemplo
        return `function processData(data) {
  return data.items.filter(item => item.active).map(item => item.id);
}`;
    }
    generateFixedCode(problemDescription) {
        // Gera código corrigido de exemplo
        return `function processData(data) {
  if (!data || !Array.isArray(data.items)) {
    return [];
  }
  return data.items
    .filter(item => item && item.active)  // Verificação adicional
    .map(item => item.id)
    .filter(id => id !== undefined);      // Remover ids indefinidos
};`;
    }
}
// Singleton
export const debuggerAgent = new DebuggerAgent();
//# sourceMappingURL=debugger-agent.js.map