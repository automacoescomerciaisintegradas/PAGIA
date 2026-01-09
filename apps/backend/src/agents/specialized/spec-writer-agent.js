/**
 * PAGIA - Spec Writer Agent
 * Agente Especializado em Escrita de Especificações Técnicas
 *
 * Baseado nos padrões do projeto PAGIA
 *
 * @module agents/specialized/spec-writer-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent } from '../base-agent.js';
/**
 * SpecWriterAgent - Especialista em criação de especificações técnicas
 */
export class SpecWriterAgent extends BaseAgent {
    name = 'Spec Writer';
    role = 'Especialista em Especificações Técnicas';
    description = 'Agente especializado em criar documentos de especificação detalhados e abrangentes para desenvolvimento de software, seguindo os padrões e convenções do projeto PAGIA.';
    module = 'specifications';
    capabilities = [
        'Criação de especificações técnicas completas',
        'Documentação de requisitos funcionais e não-funcionais',
        'Definição de cenários de uso e casos de teste',
        'Modelagem de arquitetura e fluxos',
        'Geração de documentação técnica padronizada',
        'Alinhamento com padrões do projeto',
        'Validação de completude das especificações',
        'Criação de critérios de aceitação mensuráveis'
    ];
    instructions = `Como Especialista em Especificações Técnicas, você deve:

1. **Análise Inicial**
   - Entender profundamente o contexto e objetivos
   - Identificar stakeholders e usuários-alvo
   - Mapear requisitos funcionais e não-funcionais
   - Considerar restrições técnicas e de negócio

2. **Estrutura da Especificação**
   ## Visão Geral
   - Propósito e escopo
   - Stakeholders
   - Terminologia
   
   ## Requisitos Funcionais
   ### RF001: [Nome do requisito]
   - Descrição detalhada
   - Prioridade
   - Cenários de uso
   - Critérios de aceitação
   
   ## Requisitos Não-Funcionais
   - Performance
   - Segurança
   - Disponibilidade
   - Compatibilidade
   
   ## Arquitetura
   - Diagramas (mermaid quando possível)
   - Componentes
   - Integrações
   
   ## Fluxos de Trabalho
   - Diagramas de sequência
   - Fluxos alternativos
   - Tratamento de erros
   
   ## Critérios de Aceitação
   - Testes funcionais
   - Testes não-funcionais
   - Métricas de sucesso

3. **Padrões de Documentação**
   - Usar formatação markdown consistente
   - Números de requisito no formato RFXXX/NFXXX
   - Cenários usando o padrão GIVEN-WHEN-THEN
   - Diagramas mermaid para visualizações
   - Links cruzados entre seções relacionadas

4. **Alinhamento com Padrões do Projeto**
   - Seguir convenções de nomenclatura do PAGIA
   - Respeitar a arquitetura definida em tech-stack.md
   - Alinhar com workflows e práticas estabelecidas
   - Considerar guidelines de produto e marca

5. **Qualidade da Especificação**
   - Clareza e precisão nas descrições
   - Completeness - cobrir todos os aspectos relevantes
   - Consistência interna
   - Testabilidade dos requisitos
   - Rastreabilidade dos elementos

6. **Templates Especializados**
   - Para APIs REST: Incluir endpoints, métodos HTTP, status codes, schemas de request/response
   - Para sistemas web: Incluir fluxos de usuário, telas, interações, validações
   - Para bancos de dados: Incluir modelos, relacionamentos, índices, constraints
   - Para microserviços: Incluir comunicação, mensagens, contratos, circuit breakers
   - Para segurança: Incluir autenticação, autorização, criptografia, logs de segurança`;
    menu = [
        { trigger: '/spec', description: 'Criar especificação técnica completa' },
        { trigger: '/rf', description: 'Documentar requisitos funcionais' },
        { trigger: '/nf', description: 'Documentar requisitos não-funcionais' },
        { trigger: '/arch', description: 'Especificar arquitetura' },
        { trigger: '/flow', description: 'Mapear fluxos de trabalho' },
        { trigger: '/acceptance', description: 'Definir critérios de aceitação' },
        { trigger: '/api', description: 'Especificar API REST' },
        { trigger: '/web', description: 'Especificar sistema web' },
        { trigger: '/db', description: 'Especificar banco de dados' },
        { trigger: '/microservice', description: 'Especificar microserviços' },
        { trigger: '/security', description: 'Especificar segurança' },
        { trigger: '/land', description: 'Landing the Plane - Especificação completa e pronta' },
        { trigger: '/validate', description: 'Validar especificação técnica' },
    ];
    async execute(input) {
        const startTime = Date.now();
        try {
            const prompt = input.prompt.toLowerCase();
            let enhancedPrompt = input.prompt;
            if (prompt.includes('/spec')) {
                enhancedPrompt = `Crie uma especificação técnica completa para: ${input.prompt.replace(/\/spec/i, '').trim()}

Formato esperado:
## Visão Geral
- **Propósito**: [Descrição concisa]
- **Escopo**: [Limites e fronteiras]
- **Stakeholders**: [Partes interessadas]
- **Terminologia**: [Termos importantes]

## Requisitos Funcionais
### RF001: [Nome descritivo]
- **Descrição**: [Detalhe completo]
- **Prioridade**: Alta/Média/Baixa
- **Cenários**:
  #### Scenario: [Nome do cenário]
  - **DADO** [contexto inicial]
  - **QUANDO** [ação do usuário/sistema]
  - **ENTÃO** [resultado esperado]
- **Critérios de Aceitação**: [Lista específica]

## Requisitos Não-Funcionais
### Performance
- Tempo de resposta máximo: [valor]
- Throughput: [valor]
- Concorrência suportada: [número]

### Segurança
- Autenticação requerida: [sim/não]
- Autorização por papéis: [detalhes]
- Criptografia: [padrões]

### Disponibilidade
- SLA: [porcentagem]
- Tempo de recuperação: [tempo]
- Monitoramento: [métricas]

## Arquitetura
\`\`\`mermaid
graph TD
    A[Componente] --> B[Outro Componente]
\`\`\`

## Fluxos de Trabalho
\`\`\`mermaid
sequenceDiagram
    participant U as Usuário
    participant S as Sistema
    U->>S: Ação
    S-->>U: Resposta
\`\`\`

## Critérios de Aceitação
### Testes Funcionais
- [ ] Todos os cenários cobertos
- [ ] Validação de entrada
- [ ] Tratamento de erros

### Métricas de Sucesso
- Cobertura de testes: [porcentagem]
- Performance dentro dos limites
- Sem vulnerabilidades críticas`;
            }
            else if (prompt.includes('/rf')) {
                enhancedPrompt = `Documente requisitos funcionais para: ${input.prompt.replace(/\/rf/i, '').trim()}

Para cada requisito, inclua:
### RFXXX: [Nome do Requisito]
- **Descrição**: [Explicação detalhada]
- **Prioridade**: Alta/Média/Baixa
- **Cenários de Uso**:
  #### Scenario: [Nome descritivo]
  - **DADO** [estado inicial do sistema]
  - **QUANDO** [ação específica do usuário ou sistema]
  - **ENTÃO** [resultado esperado observável]
- **Critérios de Aceitação**:
  - [Critério mensurável 1]
  - [Critério mensurável 2]
  - [Critério mensurável 3]`;
            }
            else if (prompt.includes('/nf')) {
                enhancedPrompt = `Documente requisitos não-funcionais para: ${input.prompt.replace(/\/nf/i, '').trim()}

Cubra estas categorias:
### Performance
- Tempo de resposta máximo permitido
- Throughput esperado (requisições por segundo)
- Utilização de recursos (CPU, memória, disco)
- Escalabilidade horizontal/vertical

### Segurança
- Requisitos de autenticação
- Controle de acesso e autorização
- Criptografia de dados em trânsito e em repouso
- Proteção contra ameaças comuns (OWASP Top 10)

### Disponibilidade
- SLA (Service Level Agreement)
- Tempo médio de recuperação (MTTR)
- Tempo médio entre falhas (MTBF)
- Estratégias de backup e disaster recovery

### Compatibilidade
- Navegadores suportados
- Sistemas operacionais
- Versões de APIs e dependências
- Dispositivos móveis`;
            }
            else if (prompt.includes('/arch')) {
                enhancedPrompt = `Especifique a arquitetura para: ${input.prompt.replace(/\/arch/i, '').trim()}

Inclua:
## Visão Geral da Arquitetura
- Estilo arquitetural escolhido (monolito, microsserviços, etc.)
- Justificativa da escolha

## Diagrama de Componentes
\`\`\`mermaid
graph TD
    A[Componente Frontend] --> B[API Gateway]
    B --> C[Serviço de Autenticação]
    B --> D[Serviço de Negócio Principal]
    D --> E[Banco de Dados]
    D --> F[Serviço Externo]
\`\`\`

## Componentes Principais
### [Nome do Componente]
- **Responsabilidade**: [Função principal]
- **Interfaces**: [Endpoints/APIs expostas]
- **Dependências**: [Serviços e bibliotecas]
- **Tecnologias**: [Stack utilizada]

## Padrões de Design
- Padrões arquiteturais aplicados
- Padrões de integração
- Estratégias de caching
- Patterns de resiliência (circuit breaker, retry, etc.)`;
            }
            else if (prompt.includes('/flow')) {
                enhancedPrompt = `Mapeie fluxos de trabalho para: ${input.prompt.replace(/\/flow/i, '').trim()}

Para cada fluxo principal:

## Fluxo Principal: [Nome do Fluxo]
\`\`\`mermaid
sequenceDiagram
    participant U as Usuário
    participant UI as Interface
    participant API as API Service
    participant DB as Database
    
    U->>UI: Realiza ação
    UI->>API: Envia requisição
    API->>DB: Consulta/Atualiza dados
    DB-->>API: Retorna resultados
    API-->>UI: Envia resposta
    UI-->>U: Mostra resultado
\`\`\`

### Fluxos Alternativos
#### Fluxo Alternativo: [Condição]
- Passos específicos quando [condição] ocorre

### Tratamento de Erros
#### Erro: [Tipo de erro]
- Quando ocorre: [Condição]
- Como tratar: [Passos de tratamento]
- Mensagens ao usuário: [Texto amigável]`;
            }
            else if (prompt.includes('/acceptance')) {
                enhancedPrompt = `Defina critérios de aceitação para: ${input.prompt.replace(/\/acceptance/i, '').trim()}

## Critérios de Aceitação Funcionais
### Para Requisito: [RFXXX]
- [ ] Cenário 1: [Descrição do teste]
- [ ] Cenário 2: [Descrição do teste]
- [ ] Validação de entrada inválida
- [ ] Tratamento de casos limite

## Critérios de Aceitação Não-Funcionais
### Performance
- [ ] Tempo de resposta < [valor] ms para [operação]
- [ ] Sistema suporta [número] usuários simultâneos
- [ ] Utilização de CPU < [porcentagem]% sob carga normal

### Segurança
- [ ] Todas as requisições autenticadas
- [ ] Permissões verificadas corretamente
- [ ] Dados sensíveis criptografados
- [ ] Sem vulnerabilidades críticas no scan de segurança

### Qualidade
- [ ] Cobertura de testes unitários > [porcentagem]%
- [ ] Todos os testes passando
- [ ] Métricas de code quality satisfatórias
- [ ] Documentação atualizada e precisa

## Métricas de Sucesso
### Métricas Técnicas
- Tempo para implementação
- Número de bugs encontrados pós-release
- Performance comparada com baseline
- Satisfação do cliente/usuário

### Métricas de Negócio
- Valor entregue ao usuário
- ROI do desenvolvimento
- Adoção da funcionalidade
- Redução de processos manuais`;
            }
            else if (prompt.includes('/api')) {
                enhancedPrompt = `Crie especificação de API REST para: ${input.prompt.replace(/\/api/i, '').trim()}

## Especificação de API REST

### Visão Geral
- **Nome**: [Nome da API]
- **Versão**: v1
- **Descrição**: [Breve descrição]
- **Base URL**: [URL base]

### Endpoints
#### [Endpoint]
- **Método**: [GET/POST/PUT/DELETE]
- **URL**: [Caminho do endpoint]
- **Descrição**: [O que o endpoint faz]
- **Autenticação**: [Requerido/Sem autenticação]

##### Request
- **Headers**:
  - Content-Type: application/json
  - Authorization: Bearer {token} (se aplicável)

- **Parâmetros de Path**:
  - [nome]: [descrição]

- **Parâmetros de Query**:
  - [nome]: [descrição]

- **Body** (se aplicável):
  \`\`\`json
  {
    "campo1": "tipo",
    "campo2": "tipo"
  }
  \`\`\`

##### Response
- **Status Codes**:
  - 200: Sucesso
  - 400: Requisição inválida
  - 401: Não autorizado
  - 404: Não encontrado
  - 500: Erro interno

- **Exemplo de Sucesso**:
  \`\`\`json
  {
    "status": "success",
    "data": {}
  }
  \`\`\`

- **Exemplo de Erro**:
  \`\`\`json
  {
    "status": "error",
    "message": "mensagem de erro"
  }
  \`\`\`

### Segurança
- Autenticação JWT
- Rate limiting
- Validação de entrada

### Paginação
- Uso de parâmetros ?page= e ?limit=
- Headers: X-Total-Count, Link

### Versionamento
- Versionamento via header Accept ou parâmetro de query

### Documentação
- Swagger/OpenAPI disponível em /docs`;
            }
            else if (prompt.includes('/web')) {
                enhancedPrompt = `Crie especificação de sistema web para: ${input.prompt.replace(/\/web/i, '').trim()}

## Especificação de Sistema Web

### Visão Geral
- **Nome**: [Nome do sistema]
- **Descrição**: [Breve descrição]
- **Objetivo**: [Objetivo principal]

### Requisitos Funcionais
#### RF001: [Nome do requisito]
- **Descrição**: [Descrição detalhada]
- **Prioridade**: Alta/Média/Baixa
- **Cenários**:
  #### Scenario: [Nome do cenário]
  - **DADO** [contexto inicial]
  - **QUANDO** [ação do usuário]
  - **ENTÃO** [resultado esperado]

### Requisitos Não-Funcionais
- **Performance**: Tempo de resposta < 2s
- **Segurança**: HTTPS obrigatório, XSS protection
- **Compatibilidade**: Chrome, Firefox, Safari, Edge recentes
- **Responsividade**: Mobile-first design

### Fluxos de Usuário
\`\`\`mermaid
graph TD
    A[Tela Inicial] --> B[Tela de Login]
    B --> C[Tela Principal]
\`\`\`

### Telas e Componentes
#### [Nome da Tela]
- **Objetivo**: [Objetivo da tela]
- **Componentes**:
  - [Componente 1]
  - [Componente 2]
- **Interações**:
  - [Interação 1]
  - [Interação 2]

### Validações
- Validação de formulários em tempo real
- Feedback visual para erros
- Confirmações para ações críticas

### Acessibilidade
- WCAG 2.1 AA compliance
- Navegação por teclado
- Contraste adequado

### SEO
- Meta tags relevantes
- Estrutura semântica HTML
- Carregamento otimizado`;
            }
            else if (prompt.includes('/db')) {
                enhancedPrompt = `Crie especificação de banco de dados para: ${input.prompt.replace(/\/db/i, '').trim()}

## Especificação de Banco de Dados

### Visão Geral
- **Nome**: [Nome do banco]
- **Tipo**: [SQL/NoSQL]
- **Objetivo**: [Objetivo do banco]

### Modelos de Dados
#### [Nome da Tabela/Collection]
- **Descrição**: [Descrição do modelo]
- **Campos**:
  - [campo1]: [tipo], [not null/nullable], [default], [descrição]
  - [campo2]: [tipo], [not null/nullable], [default], [descrição]
- **Chaves**:
  - Primária: [campo]
  - Únicas: [campo]
  - Estrangeiras:
    - [campo] referencia [tabela].[campo]
- **Índices**:
  - [nome]: [campo(s)]

### Relacionamentos
\`\`\`mermaid
erDiagram
    USUARIO ||--o{ PEDIDO : faz
    PEDIDO }o--|| PRODUTO : contém
\`\`\`

### Constraints
- [Nome da constraint]: [descrição]
- [Nome da constraint]: [descrição]

### Procedures e Functions
- [Nome]: [descrição]
- [Nome]: [descrição]

### Segurança
- Permissões de acesso
- Auditoria de dados
- Criptografia de campos sensíveis

### Performance
- Índices adequados
- Particionamento se necessário
- Estratégias de cache

### Backup e Recovery
- Estratégia de backup
- Ponto de recuperação (RPO)
- Objetivo de recuperação (RTO)`;
            }
            else if (prompt.includes('/microservice')) {
                enhancedPrompt = `Crie especificação de microserviços para: ${input.prompt.replace(/\/microservice/i, '').trim()}

## Especificação de Microserviços

### Visão Geral
- **Nome**: [Nome do microserviço]
- **Descrição**: [Descrição do serviço]
- **Responsabilidade**: [O que o serviço faz]

### Arquitetura
\`\`\`mermaid
graph TB
    subgraph "API Gateway"
        A[Gateway]
    end
    subgraph "Microserviços"
        B[Serviço A]
        C[Serviço B]
        D[Serviço C]
    end
    A --> B
    A --> C
    A --> D
    B --> D
\`\`\`

### Serviços
#### [Nome do Serviço]
- **Responsabilidade**: [Função principal]
- **Tecnologias**: [Stack utilizada]
- **Endpoints**: [URL base]
- **Dependências**:
  - [Serviço 1]
  - [Serviço 2]
- **Comunicação**:
  - Síncrona: [descrição]
  - Assíncrona: [descrição]

### Comunicação entre Serviços
- **Protocolo**: [HTTP/gRPC/MQTT]
- **Formato**: [JSON/Protobuf]
- **Mensagens**:
  - [Nome da mensagem]: [descrição]
  - [Nome da mensagem]: [descrição]

### Contratos
- **API Gateway**: [descrição]
- **Service Discovery**: [descrição]
- **Load Balancer**: [descrição]

### Circuit Breaker
- **Biblioteca**: [Nome da biblioteca]
- **Configurações**:
  - Timeout: [valor]
  - Threshold: [valor]
  - Recovery: [valor]

### Segurança
- **Autenticação**: [JWT/Token OAuth]
- **Autorização**: [RBAC/ABAC]
- **Criptografia**: [TLS, dados em repouso]

### Monitoramento
- **Logs**: [Solução de logging]
- **Métricas**: [Solução de métricas]
- **Tracing**: [Solução de tracing]

### Deploy
- **Container**: [Docker]
- **Orquestração**: [Kubernetes/Docker Swarm]
- **CI/CD**: [Pipeline de deploy]`;
            }
            else if (prompt.includes('/security')) {
                enhancedPrompt = `Crie especificação de segurança para: ${input.prompt.replace(/\/security/i, '').trim()}

## Especificação de Segurança

### Visão Geral
- **Nome**: [Nome da especificação de segurança]
- **Descrição**: [Descrição geral]
- **Escopo**: [Áreas cobertas]

### Autenticação
- **Método**: [JWT/Session/OAuth2/SAML]
- **Fluxo**:
  \`\`\`mermaid
  sequenceDiagram
      participant U as Usuário
      participant UI as Interface
      participant API as API
      U->>UI: Acessa sistema
      UI->>API: Solicita token
      API-->>UI: Retorna token
      UI-->>U: Exibe conteúdo
  \`\`\`
- **Validação**: [Como os tokens são validados]
- **Refresh**: [Estratégia de refresh de token]

### Autorização
- **Modelo**: [RBAC/ABAC/ACL]
- **Papéis**:
  - [Nome do papel]: [permissões]
  - [Nome do papel]: [permissões]
- **Recursos**: [Recursos protegidos]

### Criptografia
- **Dados em trânsito**: [TLS 1.2+, protocolos aceitos]
- **Dados em repouso**: [Algoritmos e chaves]
- **Campos sensíveis**: [Como são protegidos]

### Proteção contra ameaças
- **SQL Injection**: [Medidas de proteção]
- **XSS**: [Medidas de proteção]
- **CSRF**: [Medidas de proteção]
- **Rate Limiting**: [Configurações]

### Logs de Segurança
- **Eventos monitorados**:
  - Login/logout
  - Acesso a recursos sensíveis
  - Tentativas de acesso negadas
  - Mudanças de configuração
- **Formato**: [Formato dos logs]
- **Armazenamento**: [Local e tempo de retenção]

### Conformidade
- **Regulamentações**: [Leis e normas aplicáveis]
- **Auditorias**: [Frequência e escopo]
- **Relatórios**: [Tipos e periodicidade]

### Gerenciamento de Chaves
- **Rotação**: [Frequência e processo]
- **Armazenamento**: [Como as chaves são armazenadas]
- **Acesso**: [Como as chaves são acessadas]

### Incidentes
- **Detecção**: [Como incidentes são detectados]
- **Resposta**: [Processo de resposta a incidentes]
- **Notificação**: [Como stakeholders são notificados]`;
            }
            else if (prompt.includes('/land')) {
                enhancedPrompt = `Execute o processo de "Landing the Plane" para a especificação: ${input.prompt.replace(/\/land/i, '').trim()}

## Processo de Landing the Plane - Especificação Completa e Pronta para Implementação

### 1. Verificação de Completude da Especificação
- [ ] Todos os requisitos funcionais documentados (RFXXX)
- [ ] Todos os requisitos não-funcionais documentados (NFXXX)
- [ ] Cenários de uso detalhados com GIVEN-WHEN-THEN
- [ ] Critérios de aceitação mensuráveis definidos
- [ ] Arquitetura definida com componentes e fluxos
- [ ] Padrões de codificação e estilo definidos
- [ ] Estratégias de segurança implementadas

### 2. Validação de Qualidade
- [ ] Revisão por pares realizada
- [ ] Verificação de consistência interna
- [ ] Alinhamento com padrões do projeto
- [ ] Verificação de testabilidade
- [ ] Rastreabilidade dos requisitos

### 3. Preparação para Implementação
- [ ] Tarefas técnicas bem definidas e estimadas
- [ ] Critérios de aceitação claros e mensuráveis
- [ ] Definição de "Done" estabelecida
- [ ] Indicadores de sucesso definidos
- [ ] Estratégia de deploy definida

### 4. Documentação Complementar
- [ ] Documentação de API (se aplicável)
- [ ] Documentação de arquitetura
- [ ] Procedimentos de operação
- [ ] Plano de testes
- [ ] Estratégia de monitoramento

### 5. Validação Final
- [ ] Stakeholders revisaram e aprovaram
- [ ] Time de desenvolvimento entendeu os requisitos
- [ ] Infraestrutura necessária identificada
- [ ] Riscos identificados e mitigados
- [ ] Critérios de sucesso mensuráveis definidos

## Checklist de Validação

### Técnica
- [ ] A especificação é clara e não ambígua?
- [ ] Todos os fluxos principais e alternativos estão cobertos?
- [ ] Os requisitos não-funcionais são mensuráveis?
- [ ] A arquitetura proposta é viável?

### Prática
- [ ] A especificação pode ser implementada em partes?
- [ ] Os critérios de aceitação são testáveis?
- [ ] O escopo é realista para o tempo/recursos disponíveis?
- [ ] As dependências estão identificadas?

### Qualidade
- [ ] A especificação está alinhada com os objetivos de negócio?
- [ ] Os stakeholders estão de acordo com o escopo?
- [ ] Os riscos foram devidamente considerados?
- [ ] A manutenibilidade futura foi considerada?

## Confirmação Final

**Todas as etapas acima foram completadas com sucesso?**

**A especificação está pronta para ser entregue à equipe de desenvolvimento?**

**Todas as partes interessadas revisaram e aprovaram?**

**Os critérios de sucesso estão claramente definidos e mensuráveis?**

**A implementação pode começar com base nesta especificação?**`;
            }
            else if (prompt.includes('/validate')) {
                enhancedPrompt = `Valide a especificação técnica para: ${input.prompt.replace(/\/validate/i, '').trim()}

## Validação de Especificação Técnica

### Análise de Completude
- **Requisitos Funcionais**: [Verificar cobertura]
- **Requisitos Não-Funcionais**: [Verificar mensurabilidade]
- **Cenários de Uso**: [Verificar detalhamento]
- **Critérios de Aceitação**: [Verificar testabilidade]

### Análise de Consistência
- **Terminologia**: [Verificar uso consistente]
- **Requisitos**: [Verificar ausência de contradições]
- **Fluxos**: [Verificar lógica e sequência]

### Análise de Viabilidade
- **Técnica**: [Verificar se é tecnicamente viável]
- **Temporal**: [Verificar se é realista para o prazo]
- **Recursos**: [Verificar disponibilidade de recursos]

### Análise de Testabilidade
- **Critérios de Aceitação**: [Verificar se são mensuráveis]
- **Casos de Teste**: [Verificar se podem ser derivados]
- **Métricas**: [Verificar se são objetivas]

### Checklist de Validação

#### Completude
- [ ] Todos os fluxos principais cobertos
- [ ] Todos os fluxos alternativos cobertos
- [ ] Tratamento de erros definido
- [ ] Requisitos de segurança contemplados
- [ ] Requisitos de performance definidos

#### Clareza
- [ ] Linguagem clara e não ambígua
- [ ] Notação consistente
- [ ] Diagramas auxiliam compreensão
- [ ] Exemplos ilustram o funcionamento

#### Viabilidade
- [ ] Técnica: Solução é implementável?
- [ ] Econômica: Custo-benefício é favorável?
- [ ] Temporal: Prazo é realista?

#### Qualidade
- [ ] Requisitos são mensuráveis
- [ ] Critérios de aceitação são objetivos
- [ ] Padrões de projeto são apropriados
- [ ] Considerações de manutenção estão presentes`;
            }
            else {
                // Prompt genérico - criar especificação completa
                enhancedPrompt = `Crie uma especificação técnica completa para: ${input.prompt}

Siga a estrutura padrão:
1. Visão Geral (propósito, escopo, stakeholders)
2. Requisitos Funcionais (formato RFXXX com cenários)
3. Requisitos Não-Funcionais (performance, segurança, etc.)
4. Arquitetura (diagramas mermaid)
5. Fluxos de Trabalho (sequências e alternativas)
6. Critérios de Aceitação (mensuráveis)

Use formatação markdown clara e inclua diagramas mermaid onde apropriado.`;
            }
            const response = await this.callAI(enhancedPrompt, input.context);
            return this.createOutput(response.content, response.tokensUsed, startTime, this.extractSuggestedActions(response.content));
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return this.createOutput(`Erro na criação da especificação: ${errorMsg}`, undefined, startTime);
        }
    }
}
// Singleton
export const specWriterAgent = new SpecWriterAgent();
//# sourceMappingURL=spec-writer-agent.js.map