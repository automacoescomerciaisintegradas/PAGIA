# Exemplo de Uso do Spec Writer Agent

## Demonstração das Capacidades

### 1. Criação de Especificação Completa
```
/spec Criar sistema de gerenciamento de usuários com autenticação JWT
```

### 2. Documentação de Requisitos Funcionais
```
/rf RF001: Cadastro de novos usuários
```

### 3. Documentação de Requisitos Não-Funcionais
```
/nf Requisitos de segurança para API REST
```

### 4. Especificação de Arquitetura
```
/arch Arquitetura de microserviços para plataforma de e-commerce
```

### 5. Mapeamento de Fluxos de Trabalho
```
/flow Fluxo de checkout em loja virtual
```

### 6. Definição de Critérios de Aceitação
```
/acceptance Critérios para funcionalidade de upload de arquivos
```

## Estrutura de Saída Esperada

O agente gera especificações seguindo este padrão:

```
## Visão Geral
- Propósito e escopo
- Stakeholders
- Terminologia

## Requisitos Funcionais
### RF001: [Nome do requisito]
- Descrição detalhada
- Prioridade
- Cenários de uso (formato GIVEN-WHEN-THEN)
- Critérios de aceitação

## Requisitos Não-Funcionais
- Performance
- Segurança
- Disponibilidade
- Compatibilidade

## Arquitetura
- Diagramas (mermaid)
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
```

## Benefícios

- **Padronização**: Segue os padrões do projeto PAGIA
- **Completude**: Cobertura abrangente de todos os aspectos
- **Testabilidade**: Critérios de aceitação mensuráveis
- **Rastreabilidade**: Links entre requisitos e implementação
- **Colaboração**: Facilita trabalho em equipe
- **Qualidade**: Reduz ambiguidades e retrabalho