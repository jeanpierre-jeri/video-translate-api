import OpenAI from 'npm:openai@4.28.4'

export const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})
