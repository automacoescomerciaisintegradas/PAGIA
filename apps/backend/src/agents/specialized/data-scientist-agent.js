/**
 * PAGIA - Data Scientist Agent
 * Agente Especializado em Ciência de Dados
 *
 * Baseado nos padrões do projeto PAGIA
 *
 * @module agents/specialized/data-scientist-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent } from '../base-agent.js';
/**
 * DataScientistAgent - Especialista em ciência de dados
 */
export class DataScientistAgent extends BaseAgent {
    name = 'Data Scientist';
    role = 'Especialista em Análise de Dados';
    description = 'Agente especializado em análise de dados, consultas SQL e operações no BigQuery. Usa proativamente para tarefas e consultas de análise de dados.';
    module = 'data-science';
    capabilities = [
        'Escrita de consultas SQL eficientes',
        'Operações no BigQuery',
        'Análise e sumarização de resultados',
        'Apresentação clara de descobertas',
        'Recomendações baseadas em dados',
        'Otimização de consultas',
        'Análise estatística',
        'Visualização de dados'
    ];
    instructions = `Como Cientista de Dados especializado em SQL e análise do BigQuery, você deve:

1. **Análise de Requisitos**
   - Compreender os requisitos de análise de dados
   - Identificar as tabelas e campos relevantes
   - Determinar as métricas necessárias
   - Avaliar os dados disponíveis

2. **Práticas de Consulta SQL**
   - Escrever consultas SQL otimizadas com filtros apropriados
   - Usar agregações e junções apropriadas
   - Incluir comentários explicando lógica complexa
   - Formatar resultados para legibilidade
   - Garantir consultas eficientes e econômicas

3. **Operações no BigQuery**
   - Utilizar ferramentas de linha de comando do BigQuery (bq) quando apropriado
   - Aplicar práticas recomendadas de otimização do BigQuery
   - Utilizar particionamento e clustering quando relevante
   - Considerar custos e desempenho

4. **Análise de Dados**
   - Compreender a abordagem da consulta
   - Documentar quaisquer suposições
   - Destacar descobertas principais
   - Sugerir próximos passos baseados nos dados
   - Fornecer recomendações baseadas em dados

5. **Melhores Práticas**
   - Manter foco em eficiência e otimização
   - Garantir legibilidade do código
   - Documentar decisões analíticas
   - Fornecer insights acionáveis`;
    menu = [
        { trigger: '/sql', description: 'Escrever consulta SQL' },
        { trigger: '/analyze', description: 'Análise de dados' },
        { trigger: '/bq', description: 'Operações no BigQuery' },
        { trigger: '/report', description: 'Relatório de análise' },
        { trigger: '/optimize', description: 'Otimização de consultas' },
        { trigger: '/insights', description: 'Insights de dados' },
    ];
    async execute(input) {
        const startTime = Date.now();
        try {
            const prompt = input.prompt.toLowerCase();
            let enhancedPrompt = input.prompt;
            if (prompt.includes('/sql')) {
                enhancedPrompt = `Escreva uma consulta SQL otimizada para o seguinte requisito:

${input.prompt.replace('/sql', '').trim()}

## Consulta SQL Otimizada

### 1. **Análise do Requisito**
- **Objetivo**: [Descrição do objetivo da consulta]
- **Tabelas envolvidas**: [Nome das tabelas relevantes]
- **Campos necessários**: [Campos que precisam ser selecionados]
- **Filtros aplicáveis**: [Critérios de filtragem]
- **Métricas calculadas**: [Agregações necessárias]

### 2. **Estratégia de Consulta**
- **Tipo de junção**: [INNER, LEFT, RIGHT, etc.]
- **Agregações**: [COUNT, SUM, AVG, etc.]
- **Ordenação**: [Critérios de ordenação]
- **Particionamento**: [Considerações de particionamento se aplicável]
- **Clustering**: [Considerações de clustering se aplicável]

### 3. **Consulta SQL**
\`\`\`sql
-- Consulta SQL otimizada para [objetivo]
-- Assumindo tabela(s): [nome das tabelas]
-- Suposições: [listar quaisquer suposições feitas]

${this.generateSQLQuery(input.prompt.replace('/sql', '').trim())}

/*
Descrição da consulta:
- Explicação de cada parte da consulta
- Justificativa para as otimizações aplicadas
- Considerações de desempenho e custo
*/
\`\`\`

### 4. **Explicação da Consulta**
- **Estrutura**: [Explicação da estrutura da consulta]
- **Otimizações**: [Técnicas de otimização aplicadas]
- **Performance**: [Considerações de desempenho]
- **Custo**: [Considerações de custo]

### 5. **Considerações Finais**
- **Suposições**: [Quaisquer suposições feitas]
- **Limitações**: [Limitações conhecidas]
- **Próximos passos**: [Sugestões para refinamento]

Forneça uma consulta SQL otimizada com base no requisito especificado.`;
            }
            else if (prompt.includes('/analyze')) {
                enhancedPrompt = `Realize uma análise de dados para o seguinte requisito:

${input.prompt.replace('/analyze', '').trim()}

## Análise de Dados

### 1. **Compreensão do Requisito**
- **Objetivo da análise**: [Descrição do objetivo]
- **Conjunto de dados**: [Descrição dos dados disponíveis]
- **Métricas-chave**: [Métricas que precisam ser analisadas]
- **Hipóteses iniciais**: [Quaisquer hipóteses iniciais]

### 2. **Metodologia de Análise**
- **Abordagem estatística**: [Métodos estatísticos a serem usados]
- **Ferramentas**: [Ferramentas e linguagens a serem usadas]
- **Técnicas de visualização**: [Tipos de gráficos e visualizações]
- **Critérios de validação**: [Como os resultados serão validados]

### 3. **Estratégia de Consulta**
#### Consultas Iniciais
\`\`\`sql
-- Consulta exploratória inicial
SELECT 
    COUNT(*) as total_registros,
    MIN(data_criacao) as data_inicial,
    MAX(data_criacao) as data_final
FROM \${this.getTableName(input.prompt)}
LIMIT 10;
\`\`\`

#### Análise Estatística
\`\`\`sql
-- Análise estatística descritiva
SELECT 
    AVG(valor) as media,
    STDDEV(valor) as desvio_padrao,
    MIN(valor) as minimo,
    MAX(valor) as maximo,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY valor) as mediana
FROM \${this.getTableName(input.prompt)};
\`\`\`

### 4. **Análise dos Resultados**
#### Métricas Calculadas
- **Contagem total**: [Número total de registros]
- **Valores estatísticos**: [Média, mediana, desvio padrão, etc.]
- **Distribuições**: [Distribuições observadas]
- **Tendências**: [Tendências identificadas]

#### Descobertas Principais
1. **Descoberta 1**: [Descrição]
   - **Evidência**: [Dados que suportam a descoberta]
   - **Impacto**: [Importância da descoberta]

2. **Descoberta 2**: [Descrição]
   - **Evidência**: [Dados que suportam a descoberta]
   - **Impacto**: [Importância da descoberta]

3. **Descoberta 3**: [Descrição]
   - **Evidência**: [Dados que suportam a descoberta]
   - **Impacto**: [Importância da descoberta]

### 5. **Visualizações Recomendadas**
- **Gráfico 1**: [Tipo e propósito]
- **Gráfico 2**: [Tipo e propósito]
- **Gráfico 3**: [Tipo e propósito]

### 6. **Recomendações e Insights**
- **Recomendação 1**: [Ação baseada na análise]
- **Recomendação 2**: [Ação baseada na análise]
- **Recomendação 3**: [Ação baseada na análise]

### 7. **Próximos Passos**
- **Análise adicional**: [Análises futuras sugeridas]
- **Validação**: [Validações adicionais necessárias]
- **Implementação**: [Como implementar as recomendações]

Forneça uma análise de dados completa com base no requisito especificado.`;
            }
            else if (prompt.includes('/bq')) {
                enhancedPrompt = `Execute operações no BigQuery para o seguinte requisito:

${input.prompt.replace('/bq', '').trim()}

## Operações no BigQuery

### 1. **Compreensão do Requisito**
- **Objetivo**: [Descrição do objetivo da operação]
- **Projeto BigQuery**: [Nome do projeto, se conhecido]
- **Dataset**: [Dataset envolvido]
- **Tabela(s)**: [Tabelas envolvidas]

### 2. **Operações Disponíveis**
#### Consultas SQL
- **bq query**: Executar consultas SQL no BigQuery
- **Exemplo**: \`bq query --use_legacy_sql=false "SELECT ..."\`

#### Gerenciamento de Dados
- **bq load**: Carregar dados em uma tabela
- **bq extract**: Extrair dados de uma tabela
- **bq cp**: Copiar tabelas entre datasets/projetos

#### Gerenciamento de Recursos
- **bq mk**: Criar datasets ou tabelas
- **bq rm**: Remover datasets ou tabelas
- **bq show**: Mostrar informações sobre recursos

### 3. **Operação Recomendada**
#### Comando bq
\`\`\`bash
# Comando bq para executar a operação
bq query \\
  --use_legacy_sql=false \\
  --format=pretty \\
  --project_id=[PROJECT_ID] \\
  "SELECT * FROM [DATASET].[TABLE] LIMIT 100"
\`\`\`

#### Consulta SQL
\`\`\`sql
-- Consulta SQL para a operação BigQuery
SELECT 
    campo1,
    campo2,
    COUNT(*) as contagem
FROM \`project.dataset.tabela\`
WHERE condicao = 'valor'
GROUP BY campo1, campo2
ORDER BY contagem DESC
LIMIT 100;
\`\`\`

### 4. **Considerações de Otimização**
#### Performance
- **Particionamento**: [Usar tabelas particionadas quando possível]
- **Clustering**: [Usar clustering para otimizar consultas comuns]
- **Colunas necessárias**: [Selecionar apenas colunas necessárias]

#### Custo
- **Limitar resultados**: [Usar LIMIT quando apropriado]
- **Filtrar cedo**: [Aplicar filtros na cláusula WHERE]
- **Evitar JOINs desnecessários**: [Otimizar junções]

### 5. **Exemplo de Pipeline Completo**
\`\`\`bash
# Exemplo de pipeline de dados BigQuery
# 1. Consultar dados
bq query --nouse_legacy_sql \\
  --destination_table="project:dataset.tabela_temporaria" \\
  --allow_large_results \\
  --replace \\
  "SELECT * FROM \`project.dataset.tabela_original\` 
   WHERE data >= '2023-01-01'"

# 2. Processar dados (se necessário)
bq query --nouse_legacy_sql \\
  "SELECT 
     id,
     SUM(valor) as valor_total
   FROM \`project.dataset.tabela_temporaria\`
   GROUP BY id"

# 3. Exportar resultados (se necessário)
bq extract --destination_format=CSV \\
  "project:dataset.tabela_resultado" \\
  "gs://bucket/resultados.csv"
\`\`\`

### 6. **Melhores Práticas**
- **Usar SQL padrão**: Sempre usar SQL padrão em vez de legado
- **Nomear recursos claramente**: Usar nomes descritivos
- **Documentar consultas**: Adicionar comentários explicativos
- **Monitorar custos**: Verificar estimativas antes de executar
- **Testar com amostras**: Validar consultas com LIMIT antes de executar completamente

Forneça as operações BigQuery apropriadas com base no requisito especificado.`;
            }
            else if (prompt.includes('/report')) {
                enhancedPrompt = `Gere um relatório de análise para o seguinte requisito:

${input.prompt.replace('/report', '').trim()}

## Relatório de Análise de Dados

### 1. **Sumário Executivo**
- **Objetivo**: [Resumo do objetivo da análise]
- **Principais descobertas**: [Resumo das descobertas principais]
- **Recomendações**: [Resumo das recomendações principais]
- **Impacto esperado**: [Impacto das recomendações]

### 2. **Metodologia**
#### Fonte dos Dados
- **Tabelas utilizadas**: [Lista das tabelas]
- **Período analisado**: [Intervalo de tempo]
- **Filtros aplicados**: [Critérios de filtragem]
- **Métricas calculadas**: [Métricas analisadas]

#### Ferramentas Utilizadas
- **Plataforma**: [BigQuery, SQL, etc.]
- **Visualizações**: [Ferramentas de visualização]
- **Métodos estatísticos**: [Técnicas estatísticas aplicadas]

### 3. **Análise Detalhada**
#### Métricas Principais
| Métrica | Valor | Variação | Observação |
|---------|-------|----------|------------|
| [Métrica 1] | [Valor] | [Variação] | [Comentário] |
| [Métrica 2] | [Valor] | [Variação] | [Comentário] |
| [Métrica 3] | [Valor] | [Variação] | [Comentário] |

#### Tendências Identificadas
1. **Tendência 1**: [Descrição]
   - **Período**: [Quando ocorreu]
   - **Magnitude**: [Quão significativa foi]
   - **Causa provável**: [Possível causa]

2. **Tendência 2**: [Descrição]
   - **Período**: [Quando ocorreu]
   - **Magnitude**: [Quão significativa foi]
   - **Causa provável**: [Possível causa]

3. **Tendência 3**: [Descrição]
   - **Período**: [Quando ocorreu]
   - **Magnitude**: [Quão significativa foi]
   - **Causa provável**: [Possível causa]

### 4. **Análise Estatística**
#### Distribuições
- **Distribuição principal**: [Tipo de distribuição observada]
- **Outliers**: [Quantidade e impacto de outliers]
- **Normalidade**: [Se os dados seguem distribuição normal]

#### Correlações
- **Correlação 1**: [Entre quais variáveis]
- **Correlação 2**: [Entre quais variáveis]
- **Correlação 3**: [Entre quais variáveis]

### 5. **Visualizações Recomendadas**
#### Gráficos Principais
1. **Gráfico de Linha**: [Para mostrar tendências ao longo do tempo]
2. **Gráfico de Barras**: [Para comparar categorias]
3. **Gráfico de Dispersão**: [Para mostrar correlações]
4. **Heatmap**: [Para mostrar densidade ou relacionamentos]

### 6. **Insights e Recomendações**
#### Insights Acionáveis
- **Insight 1**: [Descrição e implicação]
- **Insight 2**: [Descrição e implicação]
- **Insight 3**: [Descrição e implicação]

#### Recomendações Estratégicas
- **Recomendação 1**: [Ação específica recomendada]
- **Recomendação 2**: [Ação específica recomendada]
- **Recomendação 3**: [Ação específica recomendada]

### 7. **Riscos e Limitações**
- **Limitação 1**: [Descrição e impacto]
- **Risco 1**: [Possível risco e mitigação]
- **Consideração**: [Outras considerações importantes]

### 8. **Próximos Passos**
- **Ação imediata**: [Primeira ação a ser tomada]
- **Análise adicional**: [Análises futuras recomendadas]
- **Monitoramento**: [Métricas a serem monitoradas]

Forneça um relatório de análise completo com base no requisito especificado.`;
            }
            else if (prompt.includes('/optimize')) {
                enhancedPrompt = `Otimize consultas SQL para o seguinte requisito:

${input.prompt.replace('/optimize', '').trim()}

## Otimização de Consultas SQL

### 1. **Análise da Consulta Atual**
#### Consulta Original
\`\`\`sql
${this.generateSampleQuery(input.prompt.replace('/optimize', '').trim())}
\`\`\`

#### Problemas Identificados
- **Problema 1**: [Descrição do problema de performance]
- **Problema 2**: [Descrição do problema de custo]
- **Problema 3**: [Descrição do problema de eficiência]

### 2. **Técnicas de Otimização**
#### Índices e Particionamento
- **Índices**: [Quais índices podem ser criados]
- **Particionamento**: [Como particionar os dados]
- **Clustering**: [Como clusterizar as tabelas]

#### Estrutura da Consulta
- **Filtros**: [Otimizar cláusulas WHERE]
- **Junções**: [Melhorar junções e ordem de tabelas]
- **Agregações**: [Otimizar GROUP BY e funções agregadas]

#### Projeção
- **Colunas selecionadas**: [Selecionar apenas colunas necessárias]
- **Subconsultas**: [Otimizar ou eliminar subconsultas]
- **CTEs**: [Usar CTEs para melhorar legibilidade e performance]

### 3. **Consulta Otimizada**
\`\`\`sql
-- Consulta otimizada para [objetivo]
-- Otimizações aplicadas:
-- 1. [Descrição da otimização 1]
-- 2. [Descrição da otimização 2]
-- 3. [Descrição da otimização 3]

${this.generateOptimizedQuery(input.prompt.replace('/optimize', '').trim())}

/*
Análise de otimização:
- Melhoria de performance esperada: [estimativa]
- Redução de custo esperada: [estimativa]
- Complexidade mantida: [nível de complexidade]
*/
\`\`\`

### 4. **Métricas de Otimização**
#### Performance
- **Tempo de execução estimado**: [Antes x Depois]
- **Bytes processados**: [Antes x Depois]
- **Recursos utilizados**: [Comparação de uso de recursos]

#### Custo
- **Custo estimado antes**: [Valor estimado]
- **Custo estimado depois**: [Valor estimado]
- **Economia esperada**: [Porcentagem ou valor]

### 5. **Técnicas Específicas de BigQuery**
#### Particionamento
- **Campos de particionamento**: [Campos recomendados]
- **Tipo de particionamento**: [Data, timestamp, inteiro, etc.]

#### Clustering
- **Campos de clustering**: [Campos recomendados para clustering]
- **Benefícios esperados**: [Como isso melhora a performance]

#### Cache
- **Resultados cacheados**: [Como usar o cache de resultados]
- **Tabelas materializadas**: [Quando criar tabelas materializadas]

### 6. **Boas Práticas de Otimização**
- **Usar LIMIT**: [Quando e como usar LIMIT apropriadamente]
- **Filtrar cedo**: [Importância de aplicar filtros cedo]
- **Evitar SELECT ***: [Por que selecionar colunas específicas é melhor]
- **Usar tabelas temporárias**: [Quando usar tabelas temporárias]
- **Monitorar estimativas**: [Como monitorar estimativas de custo e performance]

### 7. **Validação da Otimização**
#### Testes Recomendados
- **Teste de performance**: [Como testar a melhoria de performance]
- **Teste de resultados**: [Como garantir que os resultados são idênticos]
- **Teste de custo**: [Como validar a redução de custo]

Forneça uma consulta SQL otimizada com base no requisito especificado.`;
            }
            else if (prompt.includes('/insights')) {
                enhancedPrompt = `Gere insights de dados para o seguinte requisito:

${input.prompt.replace('/insights', '').trim()}

## Insights de Dados

### 1. **Contexto dos Dados**
#### Descrição do Conjunto de Dados
- **Domínio**: [Área de negócio dos dados]
- **Volume**: [Tamanho aproximado do conjunto de dados]
- **Granularidade**: [Nível de detalhe dos dados]
- **Cobertura temporal**: [Período coberto pelos dados]

#### Objetivo da Análise
- **Pergunta central**: [Principal pergunta que os dados devem responder]
- **Stakeholders**: [Quem se beneficiará dos insights]
- **Impacto esperado**: [Como os insights serão utilizados]

### 2. **Análise Exploratória**
#### Estatísticas Descritivas
- **Contagem de registros**: [Número total de registros]
- **Distribuição de valores**: [Como os valores estão distribuídos]
- **Valores únicos**: [Quantidade de valores únicos por coluna]
- **Valores nulos**: [Quantidade e distribuição de valores nulos]
- **Valores extremos**: [Presença de outliers]

#### Padrões Identificados
1. **Padrão 1**: [Descrição do padrão]
   - **Frequência**: [Com que frequência ocorre]
   - **Relevância**: [Por que é importante]
   - **Implicações**: [O que isso significa para o negócio]

2. **Padrão 2**: [Descrição do padrão]
   - **Frequência**: [Com que frequência ocorre]
   - **Relevância**: [Por que é importante]
   - **Implicações**: [O que isso significa para o negócio]

3. **Padrão 3**: [Descrição do padrão]
   - **Frequência**: [Com que frequência ocorre]
   - **Relevância**: [Por que é importante]
   - **Implicações**: [O que isso significa para o negócio]

### 3. **Análise de Correlações**
#### Relacionamentos Significativos
- **Relação 1**: [Entre quais variáveis e o que indica]
- **Relação 2**: [Entre quais variáveis e o que indica]
- **Relação 3**: [Entre quais variáveis e o que indica]

#### Análise de Dependências
- **Dependência funcional**: [Quais campos dependem de outros]
- **Multicolinearidade**: [Presença de correlações entre variáveis independentes]

### 4. **Descobertas Principais**
#### Insight 1: [Título do insight]
- **Descrição**: [Explicação detalhada do insight]
- **Dados que suportam**: [Evidência numérica que apoia o insight]
- **Impacto no negócio**: [Como isso afeta o negócio]
- **Nível de confiança**: [Grau de confiabilidade do insight]

#### Insight 2: [Título do insight]
- **Descrição**: [Explicação detalhada do insight]
- **Dados que suportam**: [Evidência numérica que apoia o insight]
- **Impacto no negócio**: [Como isso afeta o negócio]
- **Nível de confiança**: [Grau de confiabilidade do insight]

#### Insight 3: [Título do insight]
- **Descrição**: [Explicação detalhada do insight]
- **Dados que suportam**: [Evidência numérica que apoia o insight]
- **Impacto no negócio**: [Como isso afeta o negócio]
- **Nível de confiança**: [Grau de confiabilidade do insight]

### 5. **Oportunidades Identificadas**
#### Oportunidade 1: [Descrição]
- **Descrição**: [O que pode ser melhorado]
- **Potencial de impacto**: [Benefício estimado]
- **Complexidade de implementação**: [Nível de dificuldade]
- **Recomendação de ação**: [O que fazer]

#### Oportunidade 2: [Descrição]
- **Descrição**: [O que pode ser melhorado]
- **Potencial de impacto**: [Benefício estimado]
- **Complexidade de implementação**: [Nível de dificuldade]
- **Recomendação de ação**: [O que fazer]

### 6. **Riscos e Considerações**
#### Risco 1: [Descrição do risco]
- **Probabilidade**: [Chances de ocorrência]
- **Impacto**: [Consequências se ocorrer]
- **Mitigação**: [Como reduzir ou evitar o risco]

#### Considerações Éticas
- **Privacidade**: [Considerações sobre dados pessoais]
- **Viés**: [Possíveis vieses nos dados ou análise]
- **Equidade**: [Impacto em diferentes grupos]

### 7. **Recomendações Estratégicas**
#### Ação Imediata
- **Ação 1**: [Primeira ação prioritária]
- **Responsável**: [Quem deve executar]
- **Prazo**: [Quando deve ser concluída]

#### Estratégias de Longo Prazo
- **Estratégia 1**: [Mudança sistêmica recomendada]
- **Estratégia 2**: [Mudança sistêmica recomendada]
- **Estratégia 3**: [Mudança sistêmica recomendada]

### 8. **Indicadores de Sucesso**
#### KPIs Recomendados
- **KPI 1**: [Métrica para medir sucesso]
- **KPI 2**: [Métrica para medir sucesso]
- **KPI 3**: [Métrica para medir sucesso]

#### Monitoramento Contínuo
- **Frequência de revisão**: [Com que frequência revisar]
- **Mecanismos de alerta**: [Como detectar mudanças]
- **Relatórios regulares**: [Quais relatórios gerar]

Forneça insights de dados acionáveis com base no requisito especificado.`;
            }
            else {
                // Prompt genérico para análise de dados
                enhancedPrompt = `Como Cientista de Dados especializado em SQL e análise do BigQuery, realize a seguinte análise:

${input.prompt}

Use as melhores práticas de análise de dados para:
1. Compreender os requisitos de análise
2. Escrever consultas SQL eficientes
3. Utilizar operações apropriadas do BigQuery
4. Analisar e sumarizar resultados
5. Apresentar descobertas claramente
6. Fornecer recomendações baseadas em dados

Siga o processo de análise de dados: entender requisitos, planejar abordagem, executar análise, interpretar resultados e fornecer insights acionáveis.`;
            }
            const response = await this.callAI(enhancedPrompt, input.context);
            return this.createOutput(response.content, response.tokensUsed, startTime, this.extractSuggestedActions(response.content));
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return this.createOutput(`Erro no cientista de dados: ${errorMsg}`, undefined, startTime);
        }
    }
    generateSQLQuery(requirement) {
        // Gera uma consulta SQL baseada no requisito
        const table = this.getTableName(requirement);
        return `SELECT 
    id,
    nome,
    valor,
    data_criacao
FROM \`${table}\`
WHERE data_criacao >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
ORDER BY data_criacao DESC
LIMIT 100`;
    }
    getTableName(requirement) {
        // Extrai o nome da tabela do requisito ou retorna um padrão
        const lowerReq = requirement.toLowerCase();
        if (lowerReq.includes('usuário') || lowerReq.includes('user'))
            return 'projeto.dataset.usuarios';
        if (lowerReq.includes('pedido') || lowerReq.includes('order'))
            return 'projeto.dataset.pedidos';
        if (lowerReq.includes('produto') || lowerReq.includes('product'))
            return 'projeto.dataset.produtos';
        return 'projeto.dataset.tabela_padrao';
    }
    generateSampleQuery(requirement) {
        // Gera uma consulta de exemplo baseada no requisito
        return `SELECT 
    campo1,
    campo2,
    COUNT(*) as contagem,
    AVG(valor) as media_valor
FROM projeto.dataset.tabela_exemplo
WHERE condicao = 'valor'
GROUP BY campo1, campo2
HAVING COUNT(*) > 10
ORDER BY media_valor DESC`;
    }
    generateOptimizedQuery(requirement) {
        // Gera uma consulta otimizada baseada no requisito
        return `-- Consulta otimizada com particionamento e clustering
SELECT 
    campo1,
    campo2,
    COUNT(*) as contagem,
    AVG(valor) as media_valor
FROM projeto.dataset.tabela_exemplo
WHERE data_particao >= '2023-01-01'  -- Filtrando na coluna particionada
  AND campo1 IS NOT NULL  -- Filtrando valores nulos cedo
GROUP BY campo1, campo2
HAVING COUNT(*) > 10
ORDER BY media_valor DESC
LIMIT 1000  -- Limitando resultados`;
    }
}
// Singleton
export const dataScientistAgent = new DataScientistAgent();
//# sourceMappingURL=data-scientist-agent.js.map