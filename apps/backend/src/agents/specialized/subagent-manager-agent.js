/**
 * PAGIA - Subagent Manager Agent
 * Agente Especializado em Gerenciamento de Subagentes
 *
 * Baseado nos padrões do projeto PAGIA
 *
 * @module agents/specialized/subagent-manager-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent } from '../base-agent.js';
/**
 * SubagentManagerAgent - Especialista em gerenciamento de subagentes
 */
export class SubagentManagerAgent extends BaseAgent {
    name = 'Subagent Manager';
    role = 'Especialista em Gerenciamento de Subagentes';
    description = 'Agente especializado em criar, configurar e gerenciar subagentes dentro do ecossistema PAGIA. Facilita a definição de papéis especializados, configuração de permissões e atribuição de ferramentas específicas.';
    module = 'agent-management';
    capabilities = [
        'Criação de novos subagentes com configurações personalizadas',
        'Definição de permissões e modos de acesso',
        'Atribuição de ferramentas e habilidades específicas',
        'Configuração de modelos de IA apropriados',
        'Validação de conformidade com padrões do projeto',
        'Documentação de subagentes criados',
        'Gerenciamento de ciclo de vida dos subagentes'
    ];
    instructions = `Como Especialista em Gerenciamento de Subagentes, você deve:

1. **Criação de Subagentes**
   - Criar definições de subagentes no formato YAML adequado
   - Definir nomes descritivos e únicos
   - Especificar descrições claras e objetivas
   - Atribuir ferramentas apropriadas para cada função
   - Selecionar modelos de IA adequados para cada tarefa

2. **Configuração de Permissões**
   - Configurar modes de permissão adequados (default, restricted, elevated)
   - Definir escopos de acesso apropriados
   - Validar segurança e isolamento de funcionalidades
   - Garantir conformidade com políticas de segurança

3. **Atribuição de Habilidades**
   - Associar habilidades específicas a subagentes quando apropriado
   - Garantir que as habilidades sejam relevantes para o papel
   - Documentar dependências entre subagentes e habilidades
   - Validar compatibilidade entre habilidades atribuídas

4. **Best Practices**
   - Seguir convenções de nomenclatura do projeto
   - Manter consistência nas definições
   - Documentar claramente o propósito de cada subagente
   - Fornecer exemplos de uso adequados

5. **Manutenção**
   - Validar integridade das definições
   - Verificar dependências e conflitos
   - Garantir atualização de documentação
   - Monitorar uso e desempenho dos subagentes`;
    menu = [
        { trigger: '/create', description: 'Criar novo subagente' },
        { trigger: '/config', description: 'Configurar subagente existente' },
        { trigger: '/validate', description: 'Validar definição de subagente' },
        { trigger: '/list', description: 'Listar subagentes disponíveis' },
        { trigger: '/doc', description: 'Documentar subagente' },
        { trigger: '/template', description: 'Gerar template de subagente' },
    ];
    async execute(input) {
        const startTime = Date.now();
        try {
            const prompt = input.prompt.toLowerCase();
            let enhancedPrompt = input.prompt;
            if (prompt.includes('/create')) {
                enhancedPrompt = `Crie um novo subagente com base na seguinte especificação:

${input.prompt.replace(/\/create/i, '').trim()}

## Template de Subagente para PAGIA

\`\`\`yaml
---
name: ${this.generateValidName(input.prompt.replace(/\/create/i, '').trim())}
description: Descrição clara e objetiva do papel do subagente
tools: tool1, tool2, tool3  # Opcional - herda todas as ferramentas se omitido
model: inherit  # Opcional - especifica alias de modelo ou 'inherit'
permissionMode: default  # Opcional - modo de permissão para o subagente
skills: skill1, skill2  # Opcional - habilidades para auto-carregar
---

# ${this.generateValidName(input.prompt.replace(/\/create/i, '').trim())}

## Papel
[Defina o papel específico do subagente]

## Descrição
[Descrição detalhada do subagente e suas funções]

## Capacidades
- [Capacidade 1]
- [Capacidade 2]
- [Capacidade 3]

## Instruções
[Instruções detalhadas para o subagente seguir]

## Menu
- [Comando 1] - [Descrição]
- [Comando 2] - [Descrição]
\`\`\`

## Diretrizes para Criação:
1. **Nome**: Use nomes descritivos, em formato kebab-case
2. **Descrição**: Seja claro e objetivo sobre o propósito
3. **Ferramentas**: Especifique apenas as necessárias para o papel
4. **Modelo**: Considere o tipo de tarefa para escolher o modelo apropriado
5. **Permissões**: Defina o modo de permissão mais restrito necessário
6. **Habilidades**: Atribua apenas habilidades relevantes para o papel

Forneça um template completo e funcional para o novo subagente.`;
            }
            else if (prompt.includes('/config')) {
                enhancedPrompt = `Configure um subagente existente com base na seguinte especificação:

${input.prompt.replace(/\/config/i, '').trim()}

## Processo de Configuração de Subagente

### 1. **Análise de Requisitos**
- [ ] Identificar o subagente a ser configurado
- [ ] Determinar as mudanças necessárias
- [ ] Avaliar impacto das alterações
- [ ] Verificar dependências existentes

### 2. **Configurações Disponíveis**
#### Modelos de IA
- **inherit**: Herda o modelo padrão do sistema
- **sonnet**: Claude Sonnet (equilíbrio entre inteligência e velocidade)
- **haiku**: Claude Haiku (mais rápido e econômico)
- **opus**: Claude Opus (mais inteligente e capaz)
- **gpt-4**: OpenAI GPT-4
- **gpt-4-turbo**: OpenAI GPT-4 Turbo
- **gpt-3.5-turbo**: OpenAI GPT-3.5 Turbo

#### Modos de Permissão
- **default**: Permissões padrão (recomendado para maioria)
- **restricted**: Permissões limitadas (máxima segurança)
- **elevated**: Permissões estendidas (apenas quando necessário)

#### Ferramentas Comuns
- **Write**: Acesso de escrita a arquivos
- **Read**: Acesso de leitura a arquivos
- **Bash**: Execução de comandos shell
- **WebFetch**: Busca de conteúdo web
- **Skill**: Acesso a habilidades do sistema

### 3. **Processo de Configuração**
1. **Backup da configuração atual**
2. **Validação da nova configuração**
3. **Teste em ambiente seguro**
4. **Aplicação da nova configuração**
5. **Verificação de funcionamento**

### 4. **Exemplo de Configuração**
\`\`\`yaml
---
name: example-subagent
description: Subagente de exemplo para demonstração
tools: Read, Write, Bash
model: sonnet
permissionMode: default
skills: documentation, code-analysis
---
\`\`\`

### 5. **Validação Pós-Configuração**
- [ ] Testar todas as funcionalidades
- [ ] Verificar permissões aplicadas
- [ ] Confirmar integração com outras ferramentas
- [ ] Documentar alterações realizadas

Forneça instruções detalhadas para configurar o subagente especificado.`;
            }
            else if (prompt.includes('/validate')) {
                enhancedPrompt = `Valide a definição de subagente fornecida:

${input.prompt.replace(/\/validate/i, '').trim()}

## Processo de Validação de Subagente

### 1. **Validação de Estrutura**
#### Campos Obrigatórios
- [ ] **name**: Deve seguir formato kebab-case e ser único
- [ ] **description**: Deve ser clara e objetiva
- [ ] **conteúdo do prompt**: Deve estar bem definido

#### Campos Opcionais
- [ ] **tools**: Verificar se as ferramentas existem e são apropriadas
- [ ] **model**: Verificar se o modelo é válido ou 'inherit'
- [ ] **permissionMode**: Verificar se o modo é válido
- [ ] **skills**: Verificar se as habilidades existem

### 2. **Validação de Conformidade**
#### Nomenclatura
- [ ] Nome segue convenção kebab-case (letras minúsculas, hífens)
- [ ] Nome é descritivo e único
- [ ] Nome não contém caracteres especiais

#### Descrição
- [ ] Descrição é clara e objetiva
- [ ] Descrição explica claramente o propósito
- [ ] Descrição não é genérica demais

#### Ferramentas
- [ ] Todas as ferramentas listadas existem
- [ ] Atribuição de ferramentas é apropriada para o papel
- [ ] Não há ferramentas desnecessárias (princípio de menor privilégio)

#### Modelos
- [ ] Modelo especificado é válido ou 'inherit' é usado apropriadamente
- [ ] Modelo é apropriado para o tipo de tarefa

### 3. **Validação de Segurança**
- [ ] Permissões mínimas necessárias para o funcionamento
- [ ] Não há exposição desnecessária de funcionalidades
- [ ] Acesso a recursos sensíveis é apropriadamente limitado

### 4. **Validação de Funcionalidade**
- [ ] O subagente pode cumprir sua função pretendida
- [ ] Todas as dependências estão definidas
- [ ] Não há conflitos com outros subagentes

### 5. **Relatório de Validação**
**Status**: [Aprovado/Pendente/Reprovado]
**Problemas Identificados**: [Lista de problemas]
**Recomendações**: [Sugestões de melhoria]
**Nível de Conformidade**: [Porcentagem]%

Forneça um relatório completo de validação para o subagente especificado.`;
            }
            else if (prompt.includes('/list')) {
                enhancedPrompt = `Liste os subagentes disponíveis no sistema:

${input.prompt.replace(/\/list/i, '').trim()}

## Lista de Subagentes Disponíveis

### Formato de Apresentação
\`\`\`yaml
- name: nome-do-subagente
  description: Descrição concisa do papel
  tools: [ferramentas disponíveis]
  model: modelo-padrão
  permissionMode: modo-de-permissão
  status: [ativo/inativo/manutenção]
  created: data-de-criação
  lastModified: data-da-última-modificação
\`\`\`

### Categorias de Subagentes
#### Análise e Revisão
- **code-reviewer**: Revisão de código e segurança
- **spec-writer**: Escrita de especificações técnicas
- **analyzer**: Análise de código e arquitetura

#### Desenvolvimento
- **tester**: Testes automatizados
- **planner**: Planejamento de desenvolvimento
- **architect**: Design arquitetural

#### Operações
- **conductor**: Coordenação de workflows
- **qa**: Garantia de qualidade
- **scrum-master**: Metodologia ágil

### Informações Adicionais
- **Status**: Indica se o subagente está ativo, inativo ou em manutenção
- **Compatibilidade**: Versão do PAGIA com a qual é compatível
- **Dependências**: Outros subagentes ou módulos necessários
- **Perfis**: Configurações específicas para diferentes contextos

### Filtros Disponíveis
- **por categoria**: Listar subagentes de uma categoria específica
- **por status**: Listar subagentes com status específico
- **por permissão**: Listar subagentes com permissões específicas
- **por modelo**: Listar subagentes que usam modelo específico

Forneça uma lista completa e organizada dos subagentes disponíveis no sistema.`;
            }
            else if (prompt.includes('/doc')) {
                enhancedPrompt = `Documente o subagente especificado:

${input.prompt.replace(/\/doc/i, '').trim()}

## Documentação de Subagente

### 1. **Visão Geral**
#### Nome do Subagente
- **Identificador**: [nome do subagente]
- **Versão**: [versão atual]
- **Status**: [ativo/inativo/deprecated]
- **Categoria**: [categoria do subagente]

#### Descrição
- **Propósito**: [descrição detalhada do propósito]
- **Escopo**: [áreas de atuação]
- **Objetivos**: [objetivos específicos que o subagente atende]

### 2. **Configuração**
#### Configuração Padrão
\`\`\`yaml
---
name: [nome]
description: [descrição]
tools: [ferramentas]
model: [modelo]
permissionMode: [modo de permissão]
skills: [habilidades]
---
\`\`\`

#### Configurações Variáveis
- **Ambientes**: [diferenças por ambiente]
- **Parâmetros**: [parâmetros configuráveis]
- **Variáveis de ambiente**: [necessárias para funcionamento]

### 3. **Funcionalidades**
#### Capacidades Principais
- [Capacidade 1]: [descrição]
- [Capacidade 2]: [descrição]
- [Capacidade 3]: [descrição]

#### Comandos Disponíveis
- **/comando1**: [descrição]
- **/comando2**: [descrição]
- **/comando3**: [descrição]

### 4. **Uso**
#### Exemplos de Uso
\`\`\`bash
# Exemplo 1
comando-exemplo "entrada"

# Exemplo 2
comando-exemplo --opção "valor"
\`\`\`

#### Melhores Práticas
- [Melhor prática 1]
- [Melhor prática 2]
- [Melhor prática 3]

### 5. **Integrações**
#### Com outros subagentes
- [Subagente 1]: [tipo de integração]
- [Subagente 2]: [tipo de integração]

#### Com ferramentas externas
- [Ferramenta 1]: [tipo de integração]
- [Ferramenta 2]: [tipo de integração]

### 6. **Manutenção**
#### Monitoramento
- **Métricas**: [métricas de desempenho]
- **Logs**: [localização e formato]
- **Alertas**: [condições de alerta]

#### Atualizações
- **Ciclo de atualização**: [frequência]
- **Processo de atualização**: [passos necessários]
- **Rollback**: [procedimento de reversão]

Forneça documentação completa e detalhada para o subagente especificado.`;
            }
            else if (prompt.includes('/template')) {
                enhancedPrompt = `Gere um template de subagente com base nos requisitos:

${input.prompt.replace(/\/template/i, '').trim()}

## Template de Subagente - Padrão PAGIA

### Modelo Básico
\`\`\`yaml
---
name: ${this.generateValidName(input.prompt.replace(/\/template/i, '').trim())}
description: Descrição clara e objetiva do papel do subagente
tools: Write, Read, Bash, WebFetch, Skill  # Opcional - herda todas as ferramentas se omitido
model: inherit  # Opcional - especifica alias de modelo ou 'inherit'
permissionMode: default  # Opcional - modo de permissão para o subagente
skills: documentation, analysis  # Opcional - habilidades para auto-carregar
---

# ${this.generateValidName(input.prompt.replace(/\/template/i, '').trim())}

## Papel
Especialista em [descreva o papel específico]

## Descrição
Agente especializado em [descrição detalhada do subagente e suas funções]. 
Este subagente é projetado para [objetivos principais] dentro do ecossistema PAGIA.

## Capacidades
- [Capacidade 1]
- [Capacidade 2]
- [Capacidade 3]
- [Capacidade 4]

## Instruções
Como [papel do subagente], você deve:

### 1. **Responsabilidades Primárias**
   - [Responsabilidade 1]
   - [Responsabilidade 2]
   - [Responsabilidade 3]

### 2. **Melhores Práticas**
   - [Prática 1]
   - [Prática 2]
   - [Prática 3]

### 3. **Restrições e Limites**
   - [Restrição 1]
   - [Restrição 2]
   - [Restrição 3]

### 4. **Integrações**
   - [Integração 1]
   - [Integração 2]
   - [Integração 3]

## Menu
- \`/comando1\` - [descrição do comando 1]
- \`/comando2\` - [descrição do comando 2]
- \`/comando3\` - [descrição do comando 3]

---
*Agente BMAD Method - Gerado pelo PAGIA*
\`\`\`

### Modelo Avançado (com funcionalidades específicas)
\`\`\`yaml
---
name: ${this.generateValidName(input.prompt.replace(/\/template/i, '').trim())}-advanced
description: Versão avançada do subagente com funcionalidades específicas
tools: Write, Read, Bash, WebFetch, Skill, Git, Docker
model: sonnet
permissionMode: elevated
skills: advanced-analysis, security-audit, performance-optimization
---

# ${this.generateValidName(input.prompt.replace(/\/template/i, '').trim())} - Avançado

## Papel
Especialista Avançado em [descreva o papel específico]

## Descrição
Versão avançada do agente especializado em [descrição detalhada do subagente e suas funções avançadas].

## Capacidades Avançadas
- [Capacidade Avançada 1]
- [Capacidade Avançada 2]
- [Capacidade Avançada 3]
- [Capacidade Avançada 4]
- [Capacidade Avançada 5]

## Instruções Avançadas
[Instruções detalhadas para o subagente avançado seguir]

## Menu Avançado
- \`/comando1\` - [descrição do comando 1]
- \`/comando2\` - [descrição do comando 2]
- \`/comando3\` - [descrição do comando 3]
- \`/comando-avancado1\` - [descrição do comando avançado 1]
- \`/comando-avancado2\` - [descrição do comando avançado 2]

---
*Agente BMAD Method - Gerado pelo PAGIA*
\`\`\`

Forneça o template mais apropriado com base nos requisitos especificados.`;
            }
            else {
                // Prompt genérico para gerenciamento de subagentes
                enhancedPrompt = `Como Especialista em Gerenciamento de Subagentes, ajude com:

${input.prompt}

Forneça assistência em:
1. Criação de novos subagentes
2. Configuração de subagentes existentes
3. Validação de definições de subagentes
4. Documentação de subagentes
5. Geração de templates
6. Listagem e gerenciamento de subagentes

Use os comandos apropriados (/create, /config, /validate, /list, /doc, /template) para fornecer assistência específica.`;
            }
            const response = await this.callAI(enhancedPrompt, input.context);
            return this.createOutput(response.content, response.tokensUsed, startTime, this.extractSuggestedActions(response.content));
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return this.createOutput(`Erro no gerenciamento de subagentes: ${errorMsg}`, undefined, startTime);
        }
    }
    generateValidName(input) {
        if (!input || input.trim() === '') {
            return 'subagente-generico';
        }
        // Remove espaços e caracteres especiais, converte para kebab-case
        return input
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
            .substring(0, 50) || 'subagente-generico';
    }
}
// Singleton
export const subagentManagerAgent = new SubagentManagerAgent();
//# sourceMappingURL=subagent-manager-agent.js.map