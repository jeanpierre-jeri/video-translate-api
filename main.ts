import { Hono } from 'npm:hono@4.0.10'
import { openai } from './lib/openai.ts'
import { OpenAIStream, StreamingTextResponse } from 'npm:ai@3.0.7'

const app = new Hono()

app.get('/', (c) => c.text('Hello Deno!'))

app.post('/api/chat', async (c) => {
  const { messages } = await c.req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    stream: true,
    messages
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
})

app.post('/api/translation', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file') as File | undefined

  if (!file) {
    return c.json({ error: 'No file provided' }, { status: 400 })
  }

  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file
  })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: 'Translate this into Spanish: ' + response.text }],
    stream: true
  })

  const stream = OpenAIStream(completion)
  return new StreamingTextResponse(stream)
})

app.post('/api/audio', async (c) => {
  const { text } = (await c.req.json()) as { text?: string }

  if (!text) {
    return c.json({ error: 'No text provided' }, { status: 400 })
  }

  const res = await openai.audio.speech.create({
    model: 'tts-1',
    input: text.slice(0, 4096),
    voice: 'echo'
  })

  if (!res.ok) {
    console.log(res)
    return c.json({ error: 'Error al generar el audio' }, { status: 500 })
  }

  const blob = await res.blob()

  return new Response(blob, {
    headers: {
      'Content-Type': 'audio/mpeg'
    },
    status: 200
  })
})

Deno.serve(app.fetch)
