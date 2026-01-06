import { Hono } from 'hono'

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
