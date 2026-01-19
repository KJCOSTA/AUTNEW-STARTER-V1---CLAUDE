import type { VercelRequest, VercelResponse } from '@vercel/node'

const JSON2VIDEO_API_URL = 'https://api.json2video.com/v2'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.JSON2VIDEO_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'JSON2VIDEO_API_KEY not configured' })
  }

  const { action, scenes, trilha } = req.body

  try {
    if (action === 'test' || action === 'test-connection') {
      const response = await fetch(`${JSON2VIDEO_API_URL}/account`, {
        headers: { 'x-api-key': apiKey },
      })
      if (response.ok) {
        return res.status(200).json({ success: true, connected: true, message: 'JSON2Video conectado!' })
      } else {
        return res.status(400).json({ success: false, connected: false, message: 'Erro na conexão com JSON2Video' })
      }
    }

    // Build video project from scenes
    const project = {
      resolution: '1080p',
      quality: 'high',
      fps: 30,
      scenes: scenes.map((scene: any) => ({
        comment: scene.timestamp,
        elements: [
          // Background video or image
          scene.visualUrl
            ? {
                type: scene.visualTipo === 'upload' ? 'image' : 'video',
                src: scene.visualUrl,
                duration: 'auto',
              }
            : {
                type: 'color',
                color: '#1a2234',
              },
          // Audio narration if available
          ...(scene.audioUrl
            ? [
                {
                  type: 'audio',
                  src: scene.audioUrl,
                  volume: 1,
                },
              ]
            : []),
        ],
      })),
      // Background music
      ...(trilha && {
        audio: [
          {
            type: 'audio',
            src: trilha,
            volume: 0.3,
            loop: true,
          },
        ],
      }),
    }

    // Submit render job
    const response = await fetch(`${JSON2VIDEO_API_URL}/movies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(project),
    })

    if (!response.ok) {
      const error = await response.json()
      return res.status(400).json({ error: error.message || 'Failed to start render' })
    }

    const result = await response.json()

    // Poll for completion (in production, use webhooks)
    let videoUrl = null
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max wait

    while (!videoUrl && attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 5000))

      const statusResponse = await fetch(`${JSON2VIDEO_API_URL}/movies/${result.project}`, {
        headers: { 'x-api-key': apiKey },
      })

      const status = await statusResponse.json()

      if (status.status === 'done') {
        videoUrl = status.url
      } else if (status.status === 'error') {
        return res.status(400).json({ error: 'Render failed' })
      }

      attempts++
    }

    if (!videoUrl) {
      return res.status(408).json({ error: 'Render timeout' })
    }

    return res.status(200).json({ videoUrl })
  } catch (error) {
    console.error('JSON2Video API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
