# 🤖 Provedores de IA do PAGIA

O PAGIA suporta múltiplos provedores de IA, oferecendo flexibilidade para escolher o modelo que melhor atende às suas necessidades.

## ⚡ Sistema de Fallback Automático

O PAGIA implementa um **fallback automático** entre modelos. Quando a quota/tokens de um modelo esgota, o sistema automaticamente tenta o próximo modelo na lista:

### Gemini (Fallback):
```
gemini-2.5-pro-preview-06-05 → gemini-2.5-flash-preview-05-20 → gemini-2.0-flash-exp → gemini-1.5-flash → gemini-1.5-pro
```

### OpenRouter (Fallback):
```
claude-sonnet-4 → claude-sonnet-4:thinking → claude-opus-4:thinking → gpt-4o → llama-3.1-405b
```

---

## Provedores Disponíveis

### 🔮 Google Gemini (Padrão)
O provedor padrão, com excelente desempenho e suporte a português.

**Configuração:**
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=sua_api_key
GEMINI_MODEL=gemini-2.5-pro-preview-06-05
```

**Modelos disponíveis:**
- `gemini-2.5-pro-preview-06-05` - ⭐ **Gemini 3 Pro (Low)** - Padrão recomendado
- `gemini-2.5-pro-preview-05-06` - Gemini 3 Pro (High)
- `gemini-2.5-flash-preview-05-20` - Gemini 3 Flash - Rápido
- `gemini-2.0-flash-exp` - Gemini 2.0 Flash Experimental
- `gemini-1.5-flash` - Gemini 1.5 Flash (estável)
- `gemini-1.5-pro` - Gemini 1.5 Pro (estável)

**Como obter a API Key:**
1. Acesse [Google AI Studio](https://aistudio.google.com/)
2. Crie um projeto e gere uma API Key

---

### 🤖 OpenAI (GPT)
O provedor mais conhecido, com modelos GPT-4 e o1/o3.

**Configuração:**
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sua_api_key
OPENAI_MODEL=gpt-4o
```

**Modelos disponíveis:**
- `gpt-4o` - Modelo mais capaz
- `gpt-4o-mini` - Mais rápido e econômico
- `gpt-4.1` - GPT-4.1
- `o1-preview` - Modelo de raciocínio avançado
- `o1-mini` - Versão menor do o1
- `o3-mini` - o3 Mini

**Como obter a API Key:**
1. Acesse [OpenAI Platform](https://platform.openai.com/)
2. Crie uma conta e gere uma API Key

---

### 🧠 Anthropic (Claude)
Modelos focados em segurança e utilidade. Agora com Claude 4.5!

**Configuração:**
```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sua_api_key
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

**Modelos disponíveis:**
- `claude-sonnet-4-20250514` - ⭐ **Claude Sonnet 4.5** - Padrão recomendado
- `claude-sonnet-4-20250514-thinking` - Claude Sonnet 4.5 (Thinking)
- `claude-opus-4-20250514` - Claude Opus 4.5 - Mais poderoso
- `claude-3-5-sonnet-20241022` - Claude 3.5 Sonnet (legado)
- `claude-3-5-haiku-20241022` - Claude 3.5 Haiku (rápido)

**Como obter a API Key:**
1. Acesse [Anthropic Console](https://console.anthropic.com/)
2. Crie uma conta e gere uma API Key

---

### ⚡ Groq
Inferência extremamente rápida com modelos open-source.

**Configuração:**
```env
AI_PROVIDER=groq
GROQ_API_KEY=sua_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

**Modelos disponíveis:**
- `llama-3.3-70b-versatile` - LLaMA 3.3 70B
- `llama-3.1-70b-versatile` - LLaMA 3.1 70B
- `llama-3.1-8b-instant` - Rápido
- `mixtral-8x7b-32768` - Mixtral
- `gemma2-9b-it` - Gemma 2

**Como obter a API Key:**
1. Acesse [Groq Console](https://console.groq.com/)
2. Crie uma conta gratuita e gere uma API Key

---

### 🦙 Ollama (Local)
Execute modelos localmente sem enviar dados para a nuvem.

**Configuração:**
```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

**Modelos disponíveis:**
- `llama3.2` - LLaMA 3.2
- `llama3.1` - LLaMA 3.1
- `mistral` - Mistral 7B
- `qwen2.5` - Qwen 2.5
- `phi3` - Microsoft Phi-3
- `codegemma` - Para código
- `deepseek-coder-v2` - Para código

**Como instalar:**
1. Baixe o Ollama em [ollama.ai](https://ollama.ai/)
2. Execute `ollama pull llama3.2` para baixar um modelo
3. Inicie o servidor com `ollama serve`

---

### 🌊 DeepSeek
Modelos chineses com excelente custo-benefício.

**Configuração:**
```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sua_api_key
DEEPSEEK_MODEL=deepseek-chat
```

**Modelos disponíveis:**
- `deepseek-chat` - Chat geral
- `deepseek-coder` - Especializado em código

**Como obter a API Key:**
1. Acesse [DeepSeek Platform](https://platform.deepseek.com/)
2. Crie uma conta e gere uma API Key

---

### 🌬️ Mistral AI
Modelos europeus de alta qualidade.

**Configuração:**
```env
AI_PROVIDER=mistral
MISTRAL_API_KEY=sua_api_key
MISTRAL_MODEL=mistral-large-latest
```

**Modelos disponíveis:**
- `mistral-large-latest` - Mais poderoso
- `mistral-medium-latest` - Equilibrado
- `mistral-small-latest` - Rápido
- `codestral-latest` - Para código

**Como obter a API Key:**
1. Acesse [Mistral Console](https://console.mistral.ai/)
2. Crie uma conta e gere uma API Key

---

### 🔀 OpenRouter
Acesso a múltiplos provedores com uma única API Key. Inclui fallback automático!

**Configuração:**
```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sua_api_key
OPENROUTER_MODEL=anthropic/claude-sonnet-4
```

**Modelos disponíveis:**
- `anthropic/claude-sonnet-4` - ⭐ Claude Sonnet 4.5
- `anthropic/claude-sonnet-4:thinking` - Claude Sonnet 4.5 (Thinking)
- `anthropic/claude-opus-4:thinking` - Claude Opus 4.5 (Thinking)
- `openai/gpt-4o` - GPT-4o
- `meta-llama/llama-3.1-405b-instruct` - LLaMA 3.1 405B
- `google/gemini-pro-1.5` - Gemini Pro

**Como obter a API Key:**
1. Acesse [OpenRouter](https://openrouter.ai/)
2. Crie uma conta e gere uma API Key

---

## Comandos Úteis

### Inicialização com seleção de provedor
```bash
pagia init
```
Durante a inicialização, você será perguntado qual provedor deseja usar.

### Alterar provedor depois
```bash
pagia config ai
```
Este comando permite reconfigurar o provedor a qualquer momento.

### Ver configuração atual
```bash
pagia status
```

### Configurar via variáveis de ambiente
Você pode definir as variáveis no arquivo `.env` e o PAGIA irá carregá-las automaticamente.

---

## Comparativo de Provedores

| Provedor    | Velocidade | Custo      | Qualidade | Fallback Auto |
|-------------|------------|------------|-----------|---------------|
| Gemini      | ⭐⭐⭐⭐   | 💰         | ⭐⭐⭐⭐⭐  | ✅            |
| OpenAI      | ⭐⭐⭐     | 💰💰       | ⭐⭐⭐⭐⭐  | ❌            |
| Anthropic   | ⭐⭐⭐     | 💰💰       | ⭐⭐⭐⭐⭐  | ❌            |
| Groq        | ⭐⭐⭐⭐⭐ | 💰         | ⭐⭐⭐⭐   | ❌            |
| Ollama      | ⭐⭐       | Gratuito   | ⭐⭐⭐     | ❌            |
| DeepSeek    | ⭐⭐⭐     | 💰         | ⭐⭐⭐⭐   | ❌            |
| Mistral     | ⭐⭐⭐⭐   | 💰         | ⭐⭐⭐⭐   | ❌            |
| OpenRouter  | Varia      | Varia      | Varia     | ✅            |

---

## Dicas

1. **Para começar rápido:** Use Gemini 3 Pro (gratuito com limites) ou Groq (gratuito)
2. **Para privacidade:** Use Ollama (totalmente local)
3. **Para qualidade máxima:** Use Claude Sonnet 4.5 ou GPT-4o
4. **Para velocidade:** Use Groq
5. **Para código:** Use DeepSeek Coder ou Codestral
6. **Para não se preocupar com quota:** Use Gemini com fallback automático ativado
