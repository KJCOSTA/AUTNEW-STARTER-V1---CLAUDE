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
      try {
        const response = await fetch(`${JSON2VIDEO_API_URL}/account`, {
          headers: { 'x-api-key': apiKey },
        })
        if (response.ok) {
          return res.status(200).json({ success: true, connected: true, message: 'JSON2Video conectado!' })
        } else {
          const errorData = await response.json().catch(() => ({}))
          return res.status(400).json({ success: false, connected: false, message: errorData.message || 'Erro na conexão com JSON2Video' })
        }
      } catch (error: any) {
        console.error('JSON2Video connection test failed:', error)
        return res.status(500).json({ success: false, connected: false, message: `Network error: ${error.message}` })
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
    let result
    try {
      const response = await fetch(`${JSON2VIDEO_API_URL}/movies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(project),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        console.error('JSON2Video render submission failed:', error)
        return res.status(400).json({ error: error.message || 'Failed to start render' })
      }

      result = await response.json()
    } catch (error: any) {
      console.error('Failed to submit render job:', error)
      return res.status(500).json({ error: `Failed to submit render job: ${error.message}` })
    }

    // Poll for completion (in production, use webhooks)
    let videoUrl = null
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max wait
    const pollInterval = 5000 // 5 seconds
    const startTime = Date.now()
    const maxWaitTime = maxAttempts * pollInterval // 5 minutes in milliseconds

    while (!videoUrl && attempts < maxAttempts) {
      // Check if we've exceeded the maximum wait time
      if (Date.now() - startTime > maxWaitTime) {
        console.error('Video render exceeded maximum wait time')
        return res.status(408).json({ error: 'Render timeout: exceeded maximum wait time of 5 minutes' })
      }

      await new Promise((r) => setTimeout(r, pollInterval))

      try {
        const statusResponse = await fetch(`${JSON2VIDEO_API_URL}/movies/${result.project}`, {
          headers: { 'x-api-key': apiKey },
        })

        if (!statusResponse.ok) {
          console.error('Failed to check render status:', statusResponse.statusText)
          attempts++
          continue // Continue polling despite errors
        }

        const status = await statusResponse.json()

        if (status.status === 'done') {
          videoUrl = status.url
          if (!videoUrl) {
            console.error('Render completed but no video URL returned')
            return res.status(500).json({ error: 'Render completed but no video URL returned' })
          }
        } else if (status.status === 'error') {
          console.error('Video render failed:', status.error || 'Unknown error')
          return res.status(400).json({ error: status.error || 'Render failed' })
        } else if (status.status === 'failed') {
          console.error('Video render job failed')
          return res.status(400).json({ error: 'Render job failed' })
        }
        // Continue polling for other statuses (processing, queued, etc.)
      } catch (error: any) {
        console.error('Error polling render status:', error)
        // Continue polling despite errors, but increment attempts
      }

      attempts++
    }

    if (!videoUrl) {
      console.error('Video render timeout after maximum attempts')
      return res.status(408).json({ error: `Render timeout: polling exceeded ${maxAttempts} attempts` })
    }

    return res.status(200).json({ videoUrl })
  } catch (error) {
    console.error('JSON2Video API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
