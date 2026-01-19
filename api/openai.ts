import type { VercelRequest, VercelResponse } from '@vercel/node'

const OPENAI_API_URL = 'https://api.openai.com/v1'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })
  }

  const { action, ...data } = req.body

  try {
    if (action === 'test') {
      const response = await fetch(`${OPENAI_API_URL}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      return res.status(response.ok ? 200 : 400).json({ ok: response.ok })
    }

    if (action === 'generate-thumbnail') {
      const response = await fetch(`${OPENAI_API_URL}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `Create a YouTube thumbnail image for a spiritual/prayer channel. Style: warm, celestial, hopeful. ${data.prompt}. NO TEXT in the image. Aspect ratio 16:9.`,
          n: 1,
          size: '1792x1024',
          quality: 'standard',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return res.status(400).json({ error: error.error?.message || 'Failed to generate image' })
      }

      const result = await response.json()
      const imageUrl = result.data?.[0]?.url

      return res.status(200).json({ imageUrl })
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (error) {
    console.error('OpenAI API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
