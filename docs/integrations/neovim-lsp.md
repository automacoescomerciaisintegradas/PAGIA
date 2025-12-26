# 🔌 PAGIA Neovim Integration

## Configuração do PAGIA como LSP no Neovim

O PAGIA pode ser usado como um Language Server Protocol (LSP) para fornecer funcionalidades de IA diretamente no editor.

## Pré-requisitos

1. Neovim 0.8+
2. Node.js 18+
3. PAGIA instalado: `npm install -g pagia`

## Instalação com Mason

### 1. Adicione ao seu `init.lua`:

```lua
-- Packer ou lazy.nvim
require("lazy").setup({
  "williamboman/mason.nvim",
  "williamboman/mason-lspconfig.nvim",
  "neovim/nvim-lspconfig",
})
```

### 2. Configure o Mason:

```lua
require("mason").setup()
require("mason-lspconfig").setup({
  ensure_installed = {
    "tsserver",
    "lua_ls",
    "pylsp",
    -- PAGIA será configurado manualmente
  },
})
```

### 3. Configure o PAGIA como Custom LSP:

```lua
local lspconfig = require("lspconfig")
local configs = require("lspconfig.configs")

-- Registrar PAGIA como um novo LSP
if not configs.pagia then
  configs.pagia = {
    default_config = {
      cmd = { "pagia", "mcp", "lsp" },
      filetypes = { 
        "javascript", 
        "typescript", 
        "python", 
        "go", 
        "rust",
        "lua",
        "markdown"
      },
      root_dir = function(fname)
        return lspconfig.util.find_git_ancestor(fname) or vim.fn.getcwd()
      end,
      settings = {
        pagia = {
          provider = "groq",
          model = "llama-3.3-70b-versatile",
          enableAgents = true,
          agents = {
            "dev",
            "code-optimizer",
            "qa"
          }
        }
      },
    },
  }
end

-- Ativar o PAGIA LSP
lspconfig.pagia.setup({
  on_attach = function(client, bufnr)
    -- Keymaps para PAGIA
    local opts = { noremap = true, silent = true, buffer = bufnr }
    
    -- Ações de código com PAGIA
    vim.keymap.set("n", "<leader>pa", ":PagiaAnalyze<CR>", opts)
    vim.keymap.set("n", "<leader>po", ":PagiaOptimize<CR>", opts)
    vim.keymap.set("n", "<leader>pr", ":PagiaRefactor<CR>", opts)
    vim.keymap.set("n", "<leader>pt", ":PagiaTest<CR>", opts)
    vim.keymap.set("n", "<leader>pd", ":PagiaDoc<CR>", opts)
    
    -- Code Actions
    vim.keymap.set("n", "<leader>pc", function()
      vim.lsp.buf.code_action()
    end, opts)
  end,
  capabilities = require("cmp_nvim_lsp").default_capabilities(),
})
```

### 4. Comandos Customizados:

```lua
-- Comandos PAGIA no Neovim
vim.api.nvim_create_user_command("PagiaAnalyze", function()
  local line = vim.api.nvim_get_current_line()
  vim.fn.system("pagia agent run code-optimizer -p 'Analise: " .. line .. "'")
end, {})

vim.api.nvim_create_user_command("PagiaOptimize", function()
  local lines = vim.api.nvim_buf_get_lines(0, 0, -1, false)
  local code = table.concat(lines, "\n")
  -- Enviar para PAGIA via MCP
  local result = vim.fn.system("curl -s -X POST http://localhost:3100/tools/pagia.analyze -d '" .. vim.fn.json_encode({code = code}) .. "'")
  print(result)
end, {})

vim.api.nvim_create_user_command("PagiaRefactor", function()
  vim.ui.input({ prompt = "O que refatorar?" }, function(input)
    if input then
      local result = vim.fn.system("pagia agent run dev -p '" .. input .. "'")
      print(result)
    end
  end)
end, {})
```

---

## Usando PAGIA via Terminal no Neovim

### Abra um terminal e use:

```vim
:terminal pagia agent list
:terminal pagia agent run dev -p "Crie uma função de login"
:terminal pagia doctor
```

### Ou com keymaps:

```lua
vim.keymap.set("n", "<leader>pl", ":terminal pagia agent list<CR>", { noremap = true })
vim.keymap.set("n", "<leader>pp", function()
  vim.ui.input({ prompt = "Prompt para PAGIA:" }, function(input)
    if input then
      vim.cmd("terminal pagia agent run dev -p '" .. input .. "'")
    end
  end)
end, { noremap = true })
```

---

## Integração com MCP Server

O PAGIA MCP Server pode ser usado para integração mais profunda:

```lua
-- Conectar ao MCP Server
local function pagia_mcp_call(tool, params)
  local json = vim.fn.json_encode(params)
  local cmd = string.format(
    "curl -s -X POST http://localhost:3100/tools/%s -H 'Content-Type: application/json' -d '%s'",
    tool, json
  )
  return vim.fn.json_decode(vim.fn.system(cmd))
end

-- Exemplo: Otimizar código selecionado
vim.keymap.set("v", "<leader>po", function()
  local lines = vim.fn.getline("'<", "'>")
  local code = table.concat(lines, "\n")
  local result = pagia_mcp_call("pagia.analyze", { code = code, action = "optimize" })
  print(vim.inspect(result))
end, { noremap = true })
```

---

## Keymaps Sugeridos

| Keymap | Ação |
|--------|------|
| `<leader>pa` | Analisar código |
| `<leader>po` | Otimizar código |
| `<leader>pr` | Refatorar código |
| `<leader>pt` | Gerar testes |
| `<leader>pd` | Gerar documentação |
| `<leader>pc` | Code Actions |
| `<leader>pl` | Listar agentes |
| `<leader>pp` | Prompt para agente |

---

## Próximos Passos

1. **Implementar comando LSP**: `pagia mcp lsp`
2. **Adicionar Code Actions** via LSP
3. **Streaming de respostas** para feedback em tempo real
4. **Integração com nvim-cmp** para completions
