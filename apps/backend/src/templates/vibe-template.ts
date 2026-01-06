export const VIBE_TEMPLATE = {
    'wrangler.toml': `name = "vibe-app"
main = "src/index.ts"
compatibility_date = "2024-04-01"

[vars]
# Add your variables here

[[d1_databases]]
binding = "DB"
database_name = "vibe-db"
database_id = "PASTE_YOUR_D1_DATABASE_ID_HERE"

[[vectorize]]
binding = "VECTOR_INDEX"
index_name = "vibe-index"

[ai]
binding = "AI"
`,

    'package.json': (projectName: string) => JSON.stringify({
        name: projectName,
        version: "1.0.0",
        description: "AI Vibe Full-Stack App powered by PAGIA & Cloudflare VibeSDK",
        type: "module",
        scripts: {
            "dev": "wrangler dev",
            "deploy": "wrangler deploy",
            "cf-typegen": "wrangler types",
            "db:generate": "drizzle-kit generate",
            "db:migrate": "drizzle-kit migrate"
        },
        dependencies: {
            "hono": "^4.2.4",
            "drizzle-orm": "^0.30.8",
            "@cloudflare/workers-types": "^4.20240405.0"
        },
        devDependencies: {
            "wrangler": "^3.47.0",
            "drizzle-kit": "^0.20.14",
            "typescript": "^5.4.4"
        }
    }, null, 2),

    'tsconfig.json': `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "lib": ["ESNext"],
    "types": ["@cloudflare/workers-types"]
  }
}`,

    'src/index.ts': `import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  VECTOR_INDEX: VectorizeIndex
  AI: any
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('Welcome to your AI Vibe App! 🛰️')
})

app.post('/api/chat', async (c) => {
  const { prompt } = await c.req.json()
  
  // Example using Workers AI
  const response = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
    prompt: prompt
  })

  return c.json({ response })
})

app.get('/api/status', async (c) => {
    return c.json({
        status: 'online',
        vibe: 'premium',
        poweredBy: 'PAGIA'
    })
})

export default app
`,

    '.env.example': `# Cloudflare Secrets
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=

# AI Provider (if not using Workers AI)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
`,

    'README.md': (projectName: string) => `# ${projectName}

Este projeto foi gerado pelo **PAGIA** utilizando a stack **VibeSDK** da Cloudflare.

## Tecnologias
- **Cloudflare Workers**: Backend Serverless.
- **Hono**: Framework Web ultra-rápido.
- **D1**: Banco de dados SQL nativo.
- **Vectorize**: Busca vetorial para RAG.
- **Workers AI**: Inferência de LLM na edge.

## Como começar
1.  Instale as dependências: \`npm install\`
2.  Inicie o desenvolvimento: \`npm run dev\`
3.  Deploy: \`npm run deploy\`

## Configuração de IA
Este projeto utiliza **Workers AI** por padrão. Você pode customizar o modelo em \`src/index.ts\`.
`
};
