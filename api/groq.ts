import type { VercelRequest, VercelResponse } from '@vercel/node'

const GROQ_API_URL = 'https://api.groq.com/openai/v1'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: 'GROQ_API_KEY not configured',
      configured: false,
      needsConfiguration: true
    })
  }

  const { action, prompt, model = 'llama-3.1-70b-versatile', maxTokens = 2048 } = req.body

  try {
    if (action === 'test' || action === 'test-connection') {
      const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: 'Diga "OK" em uma palavra.' }],
          max_tokens: 10,
        }),
      })

      if (response.ok) {
        return res.status(200).json({
          success: true,
          connected: true,
          message: 'Groq conectado!'
        })
      } else {
        const error = await response.json().catch(() => ({}))
        return res.status(400).json({
          success: false,
          connected: false,
          message: error.error?.message || 'Erro na conexão com Groq'
        })
      }
    }

    if (action === 'chat') {
      const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        return res.status(400).json({ error: error.error?.message || 'Chat request failed' })
      }

      const data = await response.json()
      return res.status(200).json({
        content: data.choices?.[0]?.message?.content || '',
        model: data.model,
        usage: data.usage,
      })
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (error) {
    console.error('Groq API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
