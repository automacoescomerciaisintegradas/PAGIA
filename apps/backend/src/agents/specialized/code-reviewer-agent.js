/**
 * PAGIA - Code Reviewer Agent
 * Agente Especializado em Revisão de Código
 *
 * Baseado nos padrões do projeto PAGIA
 *
 * @module agents/specialized/code-reviewer-agent
 * @author Automações Comerciais Integradas
 */
import { BaseAgent } from '../base-agent.js';
/**
 * CodeReviewerAgent - Especialista em revisão de código
 */
export class CodeReviewerAgent extends BaseAgent {
    name = 'Code Reviewer';
    role = 'Senior Code Reviewer';
    description = 'Agente especializado em revisão de código com foco em qualidade, segurança e melhores práticas. Analisa código para identificar problemas, sugerir melhorias e garantir padrões consistentes.';
    module = 'code-quality';
    capabilities = [
        'Análise de qualidade de código',
        'Detecção de vulnerabilidades de segurança',
        'Identificação de code smells',
        'Verificação de padrões de design',
        'Análise de complexidade ciclomática',
        'Revisão de práticas de codificação',
        'Sugestões de refatoração',
        'Validação de testes',
        'Análise de performance'
    ];
    instructions = `Como Senior Code Reviewer, você deve:

1. **Análise de Qualidade**
   - Verificar princípios SOLID (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion)
   - Identificar code smells como métodos longos, classes Deus, duplicação de código, parâmetros longos
   - Avaliar complexidade ciclomática e sugerir simplificações
   - Analisar legibilidade e manutenibilidade do código
   - Verificar comentários e documentação adequada

2. **Segurança**
   - Detectar vulnerabilidades OWASP Top 10 (Injection, Broken Authentication, XSS, Insecure Deserialization, etc.)
   - Verificar validação e sanitização de entrada de dados
   - Identificar problemas de autenticação e autorização
   - Analisar manipulação segura de dados sensíveis
   - Verificar proteção contra SQL injection, XSS, CSRF
   - Avaliar uso adequado de criptografia

3. **Melhores Práticas**
   - Verificar convenções de nomenclatura (camelCase, PascalCase, etc.)
   - Analisar estrutura de diretórios e organização do projeto
   - Validar uso apropriado de padrões de design (Factory, Strategy, Observer, etc.)
   - Verificar tratamento adequado de erros e exceções
   - Analisar logging, monitoramento e observabilidade
   - Verificar uso correto de injeção de dependência

4. **Testes**
   - Verificar cobertura de testes unitários e de integração
   - Analisar qualidade dos testes (AAA pattern, test names claros)
   - Identificar edge cases e cenários não cobertos
   - Verificar testes de integração e end-to-end
   - Avaliar mocking e fixtures apropriados

5. **Performance**
   - Identificar potenciais gargalos de performance
   - Analisar uso eficiente de memória e recursos
   - Verificar operações bloqueantes e assincronicidade
   - Sugerir otimizações de algoritmos e estruturas de dados
   - Avaliar caching e estratégias de otimização`;
    menu = [
        { trigger: '/review', description: 'Revisão completa de código' },
        { trigger: '/security', description: 'Análise de segurança específica' },
        { trigger: '/quality', description: 'Avaliação de qualidade de código' },
        { trigger: '/refactor', description: 'Sugestões de refatoração' },
        { trigger: '/test', description: 'Revisão de testes' },
        { trigger: '/performance', description: 'Análise de performance' },
    ];
    async execute(input) {
        const startTime = Date.now();
        try {
            const prompt = input.prompt.toLowerCase();
            let enhancedPrompt = input.prompt;
            if (prompt.includes('/review')) {
                enhancedPrompt = `Realize uma revisão completa do seguinte código:

${input.prompt.replace(/\/review/i, '').trim()}

Forneça análise detalhada em formato de relatório:

## 📊 RELATÓRIO DE REVISÃO DE CÓDIGO

### 🔍 Análise de Qualidade
**Princípios SOLID:**
- Single Responsibility: [Verificação]
- Open/Closed: [Verificação]
- Liskov Substitution: [Verificação]
- Interface Segregation: [Verificação]
- Dependency Inversion: [Verificação]

**Code Smells Identificados:**
- [Lista de code smells encontrados com exemplos]

**Complexidade:**
- Complexidade ciclomática: [valor estimado]
- Pontos de complexidade alta: [linhas/arquivos específicos]

### 🛡️ Análise de Segurança
**Vulnerabilidades OWASP:**
- Injection: [Status]
- Broken Authentication: [Status]
- XSS: [Status]
- Insecure Deserialization: [Status]
- Outras vulnerabilidades: [Lista]

**Práticas de Segurança:**
- Validação de entrada: [Avaliação]
- Manipulação de dados sensíveis: [Avaliação]
- Autenticação/Autorização: [Avaliação]

### 🧪 Análise de Testes
**Cobertura:**
- Cobertura estimada: [porcentagem]
- Áreas críticas sem teste: [lista]

**Qualidade dos Testes:**
- Padrão AAA seguido: [Sim/Não]
- Nomes de testes descritivos: [Avaliação]
- Edge cases cobertos: [Avaliação]

### ⚡ Análise de Performance
**Potenciais Problemas:**
- Operações bloqueantes: [identificação]
- Uso de memória: [avaliação]
- Algoritmos ineficientes: [lista]

### 📝 Recomendações Específicas
1. **Refatorações Imediatas:**
   - [Lista prioritária de refatorações]

2. **Melhorias de Segurança:**
   - [Medidas específicas de segurança]

3. **Otimizações de Performance:**
   - [Sugestões de otimização]

4. **Melhorias de Testes:**
   - [Áreas que precisam de mais testes]`;
            }
            else if (prompt.includes('/security')) {
                enhancedPrompt = `Analise especificamente a segurança do seguinte código:

${input.prompt.replace(/\/security/i, '').trim()}

## 🔒 ANÁLISE DE SEGURANÇA DETALHADA

### OWASP Top 10 Verification
#### A01:2021 - Broken Access Control
- [ ] Verificação de controles de acesso
- [ ] Validação de permissões
- [ ] Proteção contra privilege escalation

#### A02:2021 - Cryptographic Failures
- [ ] Uso adequado de criptografia
- [ ] Armazenamento seguro de senhas
- [ ] Proteção de dados em trânsito

#### A03:2021 - Injection
- [ ] SQL Injection
- [ ] Command Injection
- [ ] LDAP Injection

#### A04:2021 - Insecure Design
- [ ] Threat modeling realizado
- [ ] Princípio do menor privilégio
- [ ] Defesa em profundidade

#### A05:2021 - Security Misconfiguration
- [ ] Headers de segurança
- [ ] Configurações padrão alteradas
- [ ] Exposição de informações sensíveis

#### A06:2021 - Vulnerable Components
- [ ] Dependências atualizadas
- [ ] Scan de vulnerabilidades
- [ ] Patch management

#### A07:2021 - Identification and Authentication Failures
- [ ] Força de senha
- [ ] Rate limiting em autenticação
- [ ] MFA implementado

#### A08:2021 - Software and Data Integrity Failures
- [ ] Verificação de integridade
- [ ] Proteção contra tampering
- [ ] CI/CD seguro

#### A09:2021 - Security Logging and Monitoring Failures
- [ ] Logs de segurança
- [ ] Monitoramento de atividades suspeitas
- [ ] Alertas configurados

#### A10:2021 - Server-Side Request Forgery (SSRF)
- [ ] Validação de URLs externas
- [ ] Proteção contra SSRF
- [ ] Whitelisting de domínios

### Recomendações de Correção
[Lista detalhada de correções necessárias com prioridades]`;
            }
            else if (prompt.includes('/quality')) {
                enhancedPrompt = `Avalie a qualidade do seguinte código:

${input.prompt.replace(/\/quality/i, '').trim()}

## 🎯 AVALIAÇÃO DE QUALIDADE DE CÓDIGO

### Princípios SOLID
#### Single Responsibility Principle
- Responsabilidades identificadas: [lista]
- Classes/métodos com responsabilidades múltiplas: [lista]

#### Open/Closed Principle
- Extensibilidade do código: [avaliação]
- Uso de abstrações: [análise]

#### Liskov Substitution Principle
- Substituição segura: [verificação]
- Comportamento consistente: [análise]

#### Interface Segregation Principle
- Interfaces coesas: [avaliação]
- Interfaces inchadas: [identificação]

#### Dependency Inversion Principle
- Dependa de abstrações: [verificação]
- Injeção de dependência: [análise]

### Code Smells Identificados
- Métodos longos (>20 linhas): [contagem e exemplos]
- Classes grandes (>200 linhas): [contagem e exemplos]
- Parâmetros longos (>3 parâmetros): [exemplos]
- Código duplicado: [áreas identificadas]
- Comentários excessivos: [análise]

### Métricas de Qualidade
- Complexidade ciclomática: [valores por método]
- Profundidade de herança: [análise]
- Acoplamento entre objetos: [medida]
- Cohesion: [análise de coesão]

### Recomendações de Melhoria
[Prioridade Alta/Média/Baixa com justificativas]`;
            }
            else if (prompt.includes('/refactor')) {
                enhancedPrompt = `Sugira refatorações para o seguinte código:

${input.prompt.replace(/\/refactor/i, '').trim()}

## ♻️ SUGESTÕES DE REFACTORAÇÃO

### Refatorações Imediatas (Alta Prioridade)
1. **Extrair Método**
   // Código problemático
   // [trecho de código original]
   
   // Código refatorado
   // [versão refatorada]

2. **Substituir Código Condicional por Polimorfismo**
   // Antes
   // [código com condicionais complexas]
   
   // Depois
   // [implementação polimórfica]

3. **Extrair Classe**
   // Classe inchada identificada
   // [classe original problemática]
   
   // Classes refatoradas
   // [novas classes menores e coesas]

### Melhorias de Estrutura
- **Padrões de Design Aplicáveis**: [lista com implementações sugeridas]
- **Organização de Pacotes**: [nova estrutura sugerida]
- **Interfaces e Abstrações**: [sugestões de abstrações]

### Otimizações Específicas
- **Algoritmos**: [melhorias sugeridas]
- **Estruturas de Dados**: [substituições recomendadas]
- **Manipulação de Strings**: [otimizações]

### Benefícios Esperados
- Redução de complexidade: [estimativa]
- Melhoria de manutenibilidade: [análise]
- Performance gains: [projeção]`;
            }
            else if (prompt.includes('/test')) {
                enhancedPrompt = `Revise os testes do seguinte código:

${input.prompt.replace(/\/test/i, '').trim()}

## 🧪 REVISÃO DE TESTES

### Cobertura de Testes
#### Testes Unitários
- **Métodos cobertos**: [lista]
- **Edge cases identificados**: [cenários não cobertos]
- **Mocking apropriado**: [avaliação]

#### Testes de Integração
- **Fluxos principais**: [cobertura]
- **Interações entre componentes**: [verificação]
- **Setup/Teardown**: [qualidade]

#### Testes End-to-End
- **Cenários de usuário**: [cobertura]
- **Fluxos completos**: [verificação]

### Qualidade dos Testes
#### Estrutura AAA (Arrange-Act-Assert)
// Exemplo de teste bem estruturado
// describe('UserService', () => {
//   it('should create user with valid data', () => {
//     // Arrange
//     const userData = { name: 'John', email: 'john@example.com' };
//     
//     // Act
//     const result = userService.create(userData);
//     
//     // Assert
//     expect(result).toBeTruthy();
//     expect(result.name).toBe('John');
//   });
// });

#### Nomes Descritivos
- **Boa prática**: it('should_return_error_when_email_is_invalid')
- **Ruim**: it('test1') ou it('should work')

### Lacunas Identificadas
- **Testes faltando**: [áreas críticas sem cobertura]
- **Assertions insuficientes**: [verificações que deveriam existir]
- **Setup duplicado**: [oportunidades de refatoração]

### Recomendações de Testes
[Priorizadas por importância e impacto]`;
            }
            else if (prompt.includes('/performance')) {
                enhancedPrompt = `Analise a performance do seguinte código:

${input.prompt.replace(/\/performance/i, '').trim()}

## ⚡ ANÁLISE DE PERFORMANCE

### Potenciais Gargalos Identificados
#### Complexidade Algorítmica
- **Big O Analysis**: [análise da complexidade]
- **Operações custosas**: [loops aninhados, recursão, etc.]

#### Uso de Memória
- **Alocação excessiva**: [identificação de problemas]
- **Memory leaks potenciais**: [áreas de risco]
- **Uso de estruturas de dados**: [eficiência]

#### Operações Bloqueantes
- **I/O síncrono**: [identificação]
- **Chamadas de rede**: [otimizações possíveis]
- **Processamento pesado**: [alternativas assíncronas]

### Otimizações Sugeridas
#### Algorítmicas
// Antes (O(n²))
// [código ineficiente]

// Depois (O(n log n) ou melhor)
// [código otimizado]

#### De Estrutura de Dados
- HashMap/Set para lookups rápidos
- Arrays para acesso indexado
- Estruturas específicas para casos de uso

#### De Cache
- Memoization para resultados computacionalmente caros
- Caching de dados frequentemente acessados
- Estratégias de invalidez apropriadas

### Benchmarks Sugeridos
[Cenários de teste de performance com métricas esperadas]`;
            }
            else {
                // Prompt genérico para revisão
                enhancedPrompt = `Realize uma revisão de código profissional do seguinte trecho:

${input.prompt}

Forneça feedback estruturado cobrindo:
1. Qualidade de código e princípios SOLID
2. Segurança e vulnerabilidades
3. Testabilidade e cobertura
4. Performance e otimizações
5. Melhores práticas e convenções

Seja específico, forneça exemplos concretos e sugestões acionáveis.`;
            }
            const response = await this.callAI(enhancedPrompt, input.context);
            return this.createOutput(response.content, response.tokensUsed, startTime, this.extractSuggestedActions(response.content));
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return this.createOutput(`Erro na revisão de código: ${errorMsg}`, undefined, startTime);
        }
    }
}
// Singleton
export const codeReviewerAgent = new CodeReviewerAgent();
//# sourceMappingURL=code-reviewer-agent.js.map