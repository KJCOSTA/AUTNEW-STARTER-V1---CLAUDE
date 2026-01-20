import type { VercelRequest, VercelResponse } from '@vercel/node'

const PEXELS_API_URL = 'https://api.pexels.com/v1'
const PEXELS_VIDEO_URL = 'https://api.pexels.com/videos'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: 'PEXELS_API_KEY not configured',
      configured: false,
      needsConfiguration: true
    })
  }

  const { action, query, perPage = 15 } = req.body

  try {
    if (action === 'test' || action === 'test-connection') {
      // Test with a simple search
      const response = await fetch(`${PEXELS_API_URL}/search?query=nature&per_page=1`, {
        headers: { Authorization: apiKey },
      })
      if (response.ok) {
        return res.status(200).json({
          success: true,
          connected: true,
          message: 'Pexels conectado!'
        })
      } else {
        const error = await response.json().catch(() => ({}))
        return res.status(400).json({
          success: false,
          connected: false,
          message: error.error || 'Erro na conexão com Pexels'
        })
      }
    }

    if (action === 'search-photos') {
      const response = await fetch(
        `${PEXELS_API_URL}/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
        { headers: { Authorization: apiKey } }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        return res.status(400).json({ error: error.error || 'Search failed' })
      }

      const data = await response.json()
      return res.status(200).json({
        photos: data.photos || [],
        total: data.total_results,
        source: 'pexels',
        cost: 0, // Pexels is FREE
      })
    }

    if (action === 'search-videos') {
      const response = await fetch(
        `${PEXELS_VIDEO_URL}/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
        { headers: { Authorization: apiKey } }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        return res.status(400).json({ error: error.error || 'Video search failed' })
      }

      const data = await response.json()
      return res.status(200).json({
        videos: data.videos || [],
        total: data.total_results,
        source: 'pexels',
        cost: 0, // Pexels is FREE
      })
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (error) {
    console.error('Pexels API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
