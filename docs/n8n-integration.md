# 🔗 Integração PAGIA + n8n via MCP

Este guia explica como integrar o PAGIA com o n8n usando o servidor MCP (Model Context Protocol).

## 📋 Pré-requisitos

1. **PAGIA instalado e configurado**
2. **n8n rodando** (local ou cloud)
3. **Node.js 18+**

## 🚀 Configuração Rápida

### 1. Iniciar o Servidor MCP do PAGIA

```bash
cd c:\projetos2025\PAGIA
node dist/index.js mcp start -p 3100
```

O servidor ficará disponível em:
- **HTTP**: `http://localhost:3100`
- **WebSocket**: `ws://localhost:3100`
- **JSON-RPC**: `POST http://localhost:3100/rpc`

### 2. Importar Workflow no n8n

1. Abra o n8n
2. Vá em **Settings** → **Import Workflow**
3. Importe o arquivo: `docs/n8n-workflows/pagia-plan-manager.json`
4. Ative o workflow

## 🛠️ Ferramentas MCP Disponíveis

### Gerenciamento de Planos

| Ferramenta | Descrição |
|------------|-----------|
| `pagia.plan.create` | Criar novo plano |
| `pagia.plan.list` | Listar todos os planos |
| `pagia.plan.view` | Visualizar detalhes de um plano |
| `pagia.plan.update` | Atualizar plano existente |
| `pagia.plan.delete` | Deletar um plano |

### Gerenciamento de Agentes

| Ferramenta | Descrição |
|------------|-----------|
| `pagia.listAgents` | Listar agentes disponíveis |
| `pagia.executeAgent` | Executar um agente |
| `pagia.status` | Status do PAGIA |

### Redes de Agentes

| Ferramenta | Descrição |
|------------|-----------|
| `pagia.createNetwork` | Criar rede de agentes |
| `pagia.runNetwork` | Executar rede |
| `pagia.listNetworks` | Listar redes |

### Integração N8N

| Ferramenta | Descrição |
|------------|-----------|
| `pagia.n8n.configure` | Configurar conexão n8n |
| `pagia.n8n.listWorkflows` | Listar workflows |
| `pagia.n8n.callWebhook` | Chamar webhook |
| `pagia.n8n.executeWorkflow` | Executar workflow |

## 📡 Endpoints da API

### Listar Ferramentas
```bash
GET http://localhost:3100/tools
```

### Executar Ferramenta
```bash
POST http://localhost:3100/tools/{nome-da-ferramenta}
Content-Type: application/json

{
  "param1": "valor1",
  "param2": "valor2"
}
```

### JSON-RPC
```bash
POST http://localhost:3100/rpc
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "pagia.plan.create",
    "arguments": {
      "name": "Meu Plano",
      "description": "Descrição do plano"
    }
  },
  "id": 1
}
```

## 📝 Exemplos de Uso

### Criar Plano via cURL

```bash
curl -X POST http://localhost:3100/tools/pagia.plan.create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Projeto API 2025",
    "type": "global",
    "description": "Plano para desenvolvimento da API",
    "objectives": [
      "Definir arquitetura",
      "Implementar endpoints",
      "Documentar API"
    ],
    "stages": [
      "Planejamento",
      "Desenvolvimento",
      "Testes",
      "Deploy"
    ],
    "milestones": [
      "MVP em 2 semanas",
      "Beta em 4 semanas",
      "Release em 6 semanas"
    ]
  }'
```

### Listar Planos via cURL

```bash
curl -X POST http://localhost:3100/tools/pagia.plan.list \
  -H "Content-Type: application/json" \
  -d '{"type": "all"}'
```

### Atualizar Plano

```bash
curl -X POST http://localhost:3100/tools/pagia.plan.update \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Projeto API 2025",
    "addObjective": "Implementar autenticação JWT",
    "addStage": "Segurança"
  }'
```

## 🔧 Configuração n8n

### Usando HTTP Request Node

1. Adicione um node **HTTP Request**
2. Configure:
   - **Method**: POST
   - **URL**: `http://localhost:3100/tools/pagia.plan.create`
   - **Body**: JSON com os parâmetros

### Usando Webhook + HTTP Request

1. **Webhook Node**: Recebe a requisição externa
2. **HTTP Request Node**: Chama o MCP do PAGIA
3. **Respond to Webhook Node**: Retorna a resposta

## 🌐 Webhooks Disponíveis (após importar workflow)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/webhook/pagia/plan/create` | Criar plano |
| GET | `/webhook/pagia/plans` | Listar planos |
| GET | `/webhook/pagia/plan/:name` | Ver plano |
| PUT | `/webhook/pagia/plan/:name` | Atualizar plano |
| DELETE | `/webhook/pagia/plan/:name` | Deletar plano |

## 🔒 Segurança

Para produção, considere:

1. **Autenticação**: Adicione API Key ou Bearer Token
2. **HTTPS**: Use certificado SSL
3. **Firewall**: Limite acesso à porta 3100

## 🐛 Troubleshooting

### Servidor MCP não responde
```bash
# Verificar se está rodando
curl http://localhost:3100/health
```

### Ferramenta não encontrada
```bash
# Listar ferramentas disponíveis
curl http://localhost:3100/tools
```

### Erro de conexão no n8n
- Verifique se o PAGIA MCP Server está rodando
- Confirme a URL correta (localhost:3100)
- Teste a conexão via cURL primeiro

## 📚 Recursos Adicionais

- [Documentação MCP](https://modelcontextprotocol.io)
- [Documentação n8n](https://docs.n8n.io)
- [PAGIA README](../README.md)
