/**
 * PAGIA - Template Manager Agent
 * Agente Especializado em Gerenciamento de Templates de Agentes
 *
 * Baseado nos padrões do projeto PAGIA
 *
 * @module agents/specialized/template-manager-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent } from '../base-agent.js';
/**
 * TemplateManagerAgent - Especialista em gerenciamento de templates de agentes
 */
export class TemplateManagerAgent extends BaseAgent {
    name = 'Template Manager';
    role = 'Especialista em Gerenciamento de Templates de Agentes';
    description = 'Agente especializado em gerenciar, atualizar e padronizar templates de agentes no ecossistema PAGIA. Responsável por garantir consistência na assinatura e estrutura dos agentes.';
    module = 'template-management';
    capabilities = [
        'Atualização de assinaturas em templates de agentes',
        'Padronização de estrutura de agentes',
        'Verificação de conformidade com padrões',
        'Atualização em lote de agentes existentes',
        'Criação de templates personalizados',
        'Validação de templates',
        'Manutenção de consistência de marca'
    ];
    instructions = `Como Especialista em Gerenciamento de Templates de Agentes, você deve:

1. **Atualização de Assinaturas**
   - Identificar agentes com assinaturas antigas
   - Atualizar assinaturas para o formato padrão
   - Manter consistência entre todos os agentes
   - Preservar conteúdo original do agente

2. **Padronização de Estrutura**
   - Garantir conformidade com estrutura padrão
   - Verificar se todos os elementos obrigatórios estão presentes
   - Validar formatação e organização
   - Manter qualidade e consistência

3. **Gestão de Templates**
   - Criar templates personalizados conforme necessário
   - Manter biblioteca de templates atualizados
   - Documentar variações e especializações
   - Garantir reutilização de componentes

4. **Melhores Práticas**
   - Manter assinatura consistente em todos os agentes
   - Seguir convenções de formatação
   - Documentar mudanças de padrão
   - Garantir retrocompatibilidade

5. **Manutenção**
   - Verificar agentes existentes regularmente
   - Atualizar templates quando necessário
   - Manter histórico de mudanças
   - Documentar processos de atualização`;
    menu = [
        { trigger: '/update-signature', description: 'Atualizar assinatura em agentes' },
        { trigger: '/standardize', description: 'Padronizar estrutura de agentes' },
        { trigger: '/create-template', description: 'Criar novo template' },
        { trigger: '/validate', description: 'Validar template' },
        { trigger: '/batch-update', description: 'Atualizar múltiplos agentes' },
        { trigger: '/info', description: 'Informações sobre templates' },
    ];
    async execute(input) {
        const startTime = Date.now();
        try {
            const prompt = input.prompt.toLowerCase();
            let enhancedPrompt = input.prompt;
            if (prompt.includes('/update-signature')) {
                enhancedPrompt = `Atualize as assinaturas nos agentes existentes para o novo formato:

${input.prompt.replace('/update-signature', '').trim()}

## Atualização de Assinatura de Agentes

### 1. **Identificação de Agentes com Assinatura Antiga**
#### Assinatura Antiga
- **Formato**: \`*Agente BMAD Method - Gerado pelo PAGIA*\`
- **Localização**: Final de cada arquivo .md de agente
- **Agentes afetados**: [Lista de agentes que precisam ser atualizados]

#### Nova Assinatura Padrão
- **Formato**: \`PAGIA - Gerado pelo Agente BMAD Method | claude code | Gemini |\`
- **Localização**: Final de cada arquivo .md de agente
- **Objetivo**: Padronizar a identificação de origem dos agentes

### 2. **Processo de Atualização**
#### Etapa 1: Backup
- **Criar cópia de segurança** de cada arquivo antes da modificação
- **Registros de alterações** para rastreabilidade
- **Validação de integridade** dos arquivos originais

#### Etapa 2: Substituição
- **Localizar assinatura antiga**: \`*Agente BMAD Method - Gerado pelo PAGIA*\`
- **Substituir por**: \`PAGIA - Gerado pelo Agente BMAD Method | claude code | Gemini |\`
- **Preservar formatação**: Manter espaçamento e estrutura

#### Etapa 3: Validação
- **Verificar alterações**: Confirmar que apenas a assinatura foi modificada
- **Testar integridade**: Garantir que o conteúdo do agente permanece intacto
- **Confirmar formatação**: Validar que o arquivo mantém formatação válida

### 3. **Execução da Atualização**
#### Comandos de Atualização
\`\`\`bash
# Exemplo de comando para atualizar assinatura em todos os agentes
find . -name "*.md" -path "*/agents/*" -exec sed -i 's/*Agente BMAD Method - Gerado pelo PAGIA*/PAGIA - Gerado pelo Agente BMAD Method | claude code | Gemini |/g' {} \\;
\`\`\`

#### Verificação Pós-Atualização
- **Contagem de ocorrências**: Verificar quantos arquivos foram modificados
- **Amostragem manual**: Revisar alguns arquivos para confirmar qualidade
- **Testes funcionais**: Validar que agentes continuam funcionando corretamente

### 4. **Agentes a Serem Atualizados**
- [Lista de agentes que contêm a assinatura antiga]
- [Priorização por importância ou uso]
- [Avaliação de impacto de cada atualização]

### 5. **Controle de Qualidade**
- **Revisão por pares**: [Processo de revisão das alterações]
- **Testes automatizados**: [Validação de funcionamento dos agentes]
- **Documentação**: [Registro das alterações realizadas]

Forneça instruções detalhadas para atualizar as assinaturas com base nos agentes especificados.`;
            }
            else if (prompt.includes('/standardize')) {
                enhancedPrompt = `Padronize a estrutura dos agentes com base nos seguintes requisitos:

${input.prompt.replace('/standardize', '').trim()}

## Padronização de Estrutura de Agentes

### 1. **Estrutura Padrão de Agentes**
#### Cabeçalho
- **Título**: Nome do agente (H1)
- **Papel**: Papel do agente (H2)
- **Descrição**: Descrição detalhada (parágrafo)
- **Capacidades**: Lista de capacidades (lista com traços)

#### Corpo
- **Instruções**: Detalhamento de como o agente deve atuar
- **Menu**: Comandos disponíveis do agente
- **Rodapé**: Assinatura padronizada

### 2. **Verificação de Conformidade**
#### Elementos Obrigatórios
- [ ] Título do agente (H1)
- [ ] Papel do agente (H2)
- [ ] Descrição detalhada
- [ ] Lista de capacidades
- [ ] Instruções detalhadas
- [ ] Menu de comandos
- [ ] Assinatura padronizada

#### Elementos Opcionais
- [ ] Exemplos de uso
- [ ] Considerações especiais
- [ ] Integrações específicas

### 3. **Correções Necessárias**
#### Formatação
- **Títulos**: Usar #, ##, ### corretamente
- **Listas**: Usar traços (-) para listas de capacidades
- **Código**: Usar backticks para comandos e códigos
- **Comandos**: Usar crases para comandos no menu

#### Conteúdo
- **Clareza**: Garantir que o conteúdo seja claro e objetivo
- **Consistência**: Manter estilo consistente entre agentes
- **Completude**: Verificar se todas as seções estão completas

### 4. **Processo de Padronização**
#### Análise Inicial
1. **Leitura do conteúdo existente**
2. **Identificação de elementos faltantes**
3. **Avaliação de formatação inconsistente**

#### Aplicação de Padrões
1. **Correção de cabeçalhos**
2. **Padronização de listas**
3. **Formatação de comandos**
4. **Atualização de assinatura**

#### Validação Final
1. **Verificação de conformidade**
2. **Teste de funcionalidade**
3. **Revisão de qualidade**

### 5. **Melhores Práticas**
- **Manter conteúdo original**: Preservar o propósito do agente
- **Seguir convenções**: Manter consistência com outros agentes
- **Garantir legibilidade**: Manter formatação clara e organizada
- **Documentar mudanças**: Registrar alterações significativas

Forneça instruções para padronizar a estrutura dos agentes especificados.`;
            }
            else if (prompt.includes('/create-template')) {
                enhancedPrompt = `Crie um novo template de agente com base nos requisitos:

${input.prompt.replace('/create-template', '').trim()}

## Criação de Template de Agente

### 1. **Estrutura Básica do Template**
\`\`\`markdown
# [Nome do Agente]

## Papel
[Especialidade do agente]

## Descrição
[Descrição detalhada do agente e suas funções]

## Capacidades
- [Capacidade 1]
- [Capacidade 2]
- [Capacidade 3]

## Instruções
[Instruções detalhadas para o agente seguir]

## Menu
- \`/comando1\` - [Descrição do comando 1]
- \`/comando2\` - [Descrição do comando 2]
- \`/comando3\` - [Descrição do comando 3]

---
PAGIA - Gerado pelo Agente BMAD Method | claude code | Gemini |
\`\`\`

### 2. **Elementos Personalizáveis**
#### Nome do Agente
- **Formato**: Capitalizado, sem caracteres especiais
- **Critério**: Descritivo e único
- **Exemplo**: "Code Reviewer", "Data Analyst"

#### Papel do Agente
- **Formato**: Especialista em [área específica]
- **Critério**: Claro e específico
- **Exemplo**: "Especialista em Revisão de Código"

#### Capacidades
- **Formato**: Lista com traços (-)
- **Critério**: Específico e mensurável
- **Quantidade**: 3-8 capacidades principais

#### Menu de Comandos
- **Formato**: \`/comando\` - descrição
- **Critério**: Ações específicas e úteis
- **Quantidade**: 3-6 comandos principais

### 3. **Boas Práticas de Template**
#### Conteúdo
- **Clareza**: Linguagem clara e objetiva
- **Especificidade**: Foco na especialidade do agente
- **Completude**: Incluir todos os elementos necessários

#### Formatação
- **Consistência**: Seguir padrão estabelecido
- **Legibilidade**: Facilitar leitura e compreensão
- **Organização**: Estrutura lógica e hierárquica

### 4. **Exemplo de Template Personalizado**
\`\`\`markdown
# ${this.generateAgentName(input.prompt.replace('/create-template', '').trim())}

## Papel
Especialista em [Área de Especialização]

## Descrição
Agente especializado em [descrição detalhada das funções]. 
Este agente é projetado para [objetivos principais] dentro do ecossistema PAGIA.

## Capacidades
- [Capacidade 1]
- [Capacidade 2]
- [Capacidade 3]
- [Capacidade 4]

## Instruções
[Instruções detalhadas para o agente seguir]

## Menu
- \`/comando1\` - [descrição do comando 1]
- \`/comando2\` - [descrição do comando 2]
- \`/comando3\` - [descrição do comando 3]

---
PAGIA - Gerado pelo Agente BMAD Method | claude code | Gemini |
\`\`\`

### 5. **Considerações Finais**
- **Flexibilidade**: Template deve ser adaptável a diferentes especialidades
- **Padronização**: Manter consistência com outros agentes
- **Qualidade**: Garantir que o template promova alta qualidade
- **Usabilidade**: Facilitar a criação de agentes funcionais

Forneça um template completo com base nos requisitos especificados.`;
            }
            else if (prompt.includes('/validate')) {
                enhancedPrompt = `Valide o template de agente fornecido:

${input.prompt.replace('/validate', '').trim()}

## Validação de Template de Agente

### 1. **Validação de Estrutura**
#### Elementos Obrigatórios
- [ ] Título (H1) - Formato: # Nome do Agente
- [ ] Papel (H2) - Formato: ## Papel
- [ ] Descrição - Parágrafo descritivo
- [ ] Capacidades - Lista com traços (-)
- [ ] Instruções - Detalhamento de como atuar
- [ ] Menu - Comandos com crases e descrições
- [ ] Assinatura - Formato padronizado

#### Formatação
- [ ] Títulos com # corretos
- [ ] Listas com traços (-)
- [ ] Comandos com crases (\`/comando\`)
- [ ] Espaçamento adequado entre seções
- [ ] Formatação consistente

### 2. **Validação de Conteúdo**
#### Qualidade do Conteúdo
- [ ] Clareza na descrição do papel
- [ ] Especificidade das capacidades
- [ ] Completude das instruções
- [ ] Relevância dos comandos
- [ ] Adequação da assinatura

#### Adequação ao Propósito
- [ ] Alinhamento entre papel e capacidades
- [ ] Consistência entre instruções e menu
- [ ] Coerência geral do template
- [ ] Adequação à especialidade do agente

### 3. **Análise Detalhada**
#### Título
- **Avaliação**: [Comentários sobre o título]
- **Recomendações**: [Sugestões de melhoria]

#### Papel
- **Avaliação**: [Comentários sobre o papel]
- **Recomendações**: [Sugestões de melhoria]

#### Descrição
- **Avaliação**: [Comentários sobre a descrição]
- **Recomendações**: [Sugestões de melhoria]

#### Capacidades
- **Avaliação**: [Comentários sobre as capacidades]
- **Recomendações**: [Sugestões de melhoria]

#### Instruções
- **Avaliação**: [Comentários sobre as instruções]
- **Recomendações**: [Sugestões de melhoria]

#### Menu
- **Avaliação**: [Comentários sobre o menu]
- **Recomendações**: [Sugestões de melhoria]

#### Assinatura
- **Avaliação**: [Comentários sobre a assinatura]
- **Recomendações**: [Sugestões de melhoria]

### 4. **Relatório de Validação**
#### Status Geral
- **Conformidade**: [Porcentagem de elementos válidos]
- **Problemas Identificados**: [Lista de problemas]
- **Recomendações**: [Sugestões de correção]

#### Nível de Qualidade
- **Excelente**: Todos os elementos válidos e bem formulados
- **Bom**: Maioria dos elementos válidos com pequenas melhorias
- **Adequado**: Elementos mínimos presentes com necessidade de melhorias
- **Precisa Melhoria**: Vários elementos faltando ou incorretos

Forneça um relatório completo de validação para o template especificado.`;
            }
            else if (prompt.includes('/batch-update')) {
                enhancedPrompt = `Execute uma atualização em lote dos agentes especificados:

${input.prompt.replace('/batch-update', '').trim()}

## Atualização em Lote de Agentes

### 1. **Planejamento da Atualização**
#### Agentes Selecionados
- **Lista de agentes**: [Nomes dos agentes a serem atualizados]
- **Critério de seleção**: [Motivo para selecionar esses agentes]
- **Prioridade**: [Ordem de atualização]

#### Tipo de Atualização
- **Assinatura**: Atualizar para novo formato padrão
- **Estrutura**: Padronizar elementos e formatação
- **Conteúdo**: Atualizar instruções ou capacidades
- **Menu**: Atualizar comandos disponíveis

### 2. **Processo de Atualização em Lote**
#### Etapa 1: Preparação
- **Backup**: Criar cópias de segurança de todos os agentes
- **Planejamento**: Definir ordem e métodos de atualização
- **Validação**: Preparar critérios de validação pós-atualização

#### Etapa 2: Execução
- **Iteração**: Processar cada agente da lista
- **Atualização**: Aplicar as mudanças especificadas
- **Verificação**: Confirmar sucesso da atualização

#### Etapa 3: Validação
- **Teste**: Verificar funcionamento dos agentes atualizados
- **Conformidade**: Validar estrutura e conteúdo
- **Integridade**: Confirmar que conteúdo não foi corrompido

### 3. **Ferramentas para Atualização em Lote**
#### Scripts de Atualização
\`\`\`bash
# Script para atualizar assinatura em múltiplos arquivos
#!/bin/bash
AGENTS_DIR="./.pagia/core/agents"
for file in \${AGENTS_DIR}/*.md; do
  if [ -f "\$file" ]; then
    echo "Atualizando: \$file"
    sed -i 's/*Agente BMAD Method - Gerado pelo PAGIA*/PAGIA - Gerado pelo Agente BMAD Method | claude code | Gemini |/g' "\$file"
  fi
done
\`\`\`

#### Comandos de Validação
\`\`\`bash
# Comando para verificar agentes atualizados
grep -l "PAGIA - Gerado pelo Agente BMAD Method" ./.pagia/core/agents/*.md
\`\`\`

### 4. **Controle de Qualidade**
#### Verificação Pós-Atualização
- **Contagem de arquivos**: Confirmar número de arquivos atualizados
- **Amostragem**: Revisar manualmente alguns arquivos
- **Testes funcionais**: Validar que agentes continuam operacionais

#### Documentação
- **Registro de alterações**: Documentar quais agentes foram atualizados
- **Problemas encontrados**: Registrar quaisquer problemas
- **Soluções aplicadas**: Documentar correções necessárias

### 5. **Considerações de Segurança**
- **Permissões**: Verificar permissões de escrita antes da atualização
- **Concorrência**: Evitar conflitos se múltiplos processos estiverem ativos
- **Rollback**: Preparar plano de reversão se necessário
- **Validação**: Confirmar integridade após cada atualização

Forneça instruções detalhadas para a atualização em lote dos agentes especificados.`;
            }
            else if (prompt.includes('/info')) {
                enhancedPrompt = `Forneça informações sobre os templates de agentes:

${input.prompt.replace('/info', '').trim()}

## Informações sobre Templates de Agentes

### 1. **Estrutura Padrão Atual**
#### Elementos Obrigatórios
- **Título**: Nome do agente como cabeçalho H1
- **Papel**: Especialidade do agente como cabeçalho H2
- **Descrição**: Parágrafo detalhando as funções
- **Capacidades**: Lista de traços com habilidades principais
- **Instruções**: Detalhamento de como o agente deve atuar
- **Menu**: Comandos disponíveis com descrições
- **Assinatura**: Identificação padronizada no final

#### Formato da Assinatura
- **Formato antigo**: \`*Agente BMAD Method - Gerado pelo PAGIA*\`
- **Formato novo**: \`PAGIA - Gerado pelo Agente BMAD Method | claude code | Gemini |\`
- **Localização**: Sempre no final do arquivo, após separador ---

### 2. **Histórico de Padrões**
#### Versão 1.0
- **Assinatura**: \`*Agente BMAD Method - Gerado pelo PAGIA*\`
- **Estrutura**: Elementos básicos com formatação simples
- **Características**: Padrão inicial do sistema BMAD

#### Versão 2.0 (Atual)
- **Assinatura**: \`PAGIA - Gerado pelo Agente BMAD Method | claude code | Gemini |\`
- **Estrutura**: Elementos padronizados com melhores práticas
- **Características**: Maior especificidade e identificação de origem

### 3. **Melhores Práticas Atuais**
#### Criação de Agentes
- **Nome**: Descritivo e único, capitalizado
- **Papel**: Especialista em [área específica]
- **Capacidades**: 5-8 itens específicos e mensuráveis
- **Menu**: 4-6 comandos funcionais e úteis
- **Assinatura**: Sempre o formato padrão atual

#### Manutenção
- **Consistência**: Manter padrão entre todos os agentes
- **Atualização**: Manter assinaturas atualizadas
- **Qualidade**: Revisar conteúdo regularmente
- **Documentação**: Registrar mudanças de padrão

### 4. **Ferramentas de Gestão**
#### Identificação de Agentes Antigos
\`\`\`bash
# Encontrar agentes com assinatura antiga
grep -l "Agente BMAD Method - Gerado pelo PAGIA" ./.pagia/core/agents/*.md
\`\`\`

#### Atualização de Assinaturas
\`\`\`bash
# Atualizar todas as assinaturas
find ./.pagia/core/agents -name "*.md" -exec sed -i 's/*Agente BMAD Method - Gerado pelo PAGIA*/PAGIA - Gerado pelo Agente BMAD Method | claude code | Gemini |/g' {} \\;
\`\`\`

### 5. **Evolução Futura**
#### Melhorias Planejadas
- **Automação**: Scripts para atualização automática
- **Validação**: Ferramentas para verificação de conformidade
- **Extensibilidade**: Templates configuráveis por tipo de agente
- **Documentação**: Guias detalhados para criação de agentes

Forneça informações detalhadas sobre os templates de agentes conforme solicitado.`;
            }
            else {
                // Prompt genérico para gerenciamento de templates
                enhancedPrompt = `Como Especialista em Gerenciamento de Templates de Agentes, realize a seguinte tarefa:

${input.prompt}

Use as melhores práticas de gerenciamento de templates para:
1. Identificar necessidades de atualização
2. Padronizar estruturas e formatos
3. Atualizar assinaturas conforme padrão
4. Validar conformidade com padrões estabelecidos
5. Documentar mudanças e melhorias

Siga o processo de gerenciamento de templates: planejar, executar, validar e documentar.`;
            }
            const response = await this.callAI(enhancedPrompt, input.context);
            return this.createOutput(response.content, response.tokensUsed, startTime, this.extractSuggestedActions(response.content));
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return this.createOutput(`Erro no gerenciamento de templates: ${errorMsg}`, undefined, startTime);
        }
    }
    generateAgentName(input) {
        if (!input || input.trim() === '') {
            return 'Agente Generico';
        }
        // Gera um nome de agente baseado na entrada
        const words = input.trim().split(/\s+/);
        if (words.length === 0) {
            return 'Agente Generico';
        }
        // Tenta criar um nome significativo a partir da entrada
        const firstWord = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
        return `${firstWord} Agent`;
    }
}
// Singleton
export const templateManagerAgent = new TemplateManagerAgent();
//# sourceMappingURL=template-manager-agent.js.map