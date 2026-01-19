import type { VercelRequest, VercelResponse } from '@vercel/node'

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

// Voice IDs for Portuguese Brazilian voices
const VOICES = {
  'portuguese-female': '21m00Tcm4TlvDq8ikWAM', // Rachel - good for spiritual content
  'portuguese-male': 'ErXwobaYiN019PkySvjV', // Antoni
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' })
  }

  const { action, text, voice = 'portuguese-female' } = req.body

  try {
    if (action === 'test') {
      const response = await fetch(`${ELEVENLABS_API_URL}/user`, {
        headers: { 'xi-api-key': apiKey },
      })
      return res.status(response.ok ? 200 : 400).json({ ok: response.ok })
    }

    // Generate speech
    const voiceId = VOICES[voice as keyof typeof VOICES] || VOICES['portuguese-female']

    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return res.status(400).json({ error: error.detail?.message || 'Failed to generate audio' })
    }

    // Get the audio as a buffer
    const audioBuffer = await response.arrayBuffer()
    const base64Audio = Buffer.from(audioBuffer).toString('base64')
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`

    // Estimate duration (rough calculation based on text length)
    const wordsPerMinute = 150
    const wordCount = text.split(/\s+/).length
    const duration = Math.ceil((wordCount / wordsPerMinute) * 60)

    return res.status(200).json({ audioUrl, duration })
  } catch (error) {
    console.error('ElevenLabs API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
