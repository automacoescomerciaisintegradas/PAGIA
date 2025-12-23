---
layout: default
title: Instalação
---

# 📦 Instalação

## Pré-requisitos

- **Node.js** >= 18.0.0
- **npm** ou **yarn**
- Chave de API de um provedor de IA (Gemini, OpenAI ou Anthropic)

---

## Instalação Global (Recomendado)

```bash
npm install -g pagia
```

Após a instalação, o comando `pagia` estará disponível globalmente.

---

## Instalação Local (Desenvolvimento)

```bash
# Clonar repositório
git clone https://github.com/automacoescomerciaisintegradas/PAGIA.git
cd PAGIA

# Instalar dependências
npm install

# Compilar
npm run build

# Linkar globalmente
npm link
```

---

## Configuração

### 1. Criar arquivo `.env`

Crie um arquivo `.env` na raiz do seu projeto:

```env
# Gemini (Padrão)
GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-2.0-flash-exp

# OpenAI (Opcional)
OPENAI_API_KEY=sua_chave_aqui
OPENAI_MODEL=gpt-4o

# Anthropic (Opcional)
ANTHROPIC_API_KEY=sua_chave_aqui
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### 2. Inicializar PAGIA

```bash
pagia init
```

O comando interativo vai guiá-lo através da configuração inicial.

---

## Verificar Instalação

```bash
# Verificar versão
pagia --version

# Verificar status
pagia status

# Ver ajuda
pagia --help
```

---

## Estrutura Criada

Após `pagia init`, a seguinte estrutura será criada:

```
.pagia/
├── config.yaml          # Configuração principal
├── modules/             # Módulos instalados
├── plans/               # Planos de ação
├── agents/              # Agentes customizados
├── knowledge/           # Base de conhecimento
└── bundles/             # Bundles exportados
```

---

## Obtendo Chaves de API

### Gemini (Google)
1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Clique em "Create API Key"
3. Copie a chave gerada

### OpenAI
1. Acesse [OpenAI Platform](https://platform.openai.com/api-keys)
2. Clique em "Create new secret key"
3. Copie a chave gerada

### Anthropic
1. Acesse [Anthropic Console](https://console.anthropic.com/)
2. Vá em "API Keys"
3. Crie e copie sua chave

---

## Próximos Passos

- [Comandos](commands.md) - Lista completa de comandos
- [Agentes](agents.md) - Documentação dos agentes
- [Conductor](conductor.md) - Context-Driven Development

---

[← Voltar](index.md)
