import type { VercelRequest, VercelResponse } from '@vercel/node'

const UNSPLASH_API_URL = 'https://api.unsplash.com'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    return res.status(500).json({
      error: 'UNSPLASH_ACCESS_KEY not configured',
      configured: false,
      needsConfiguration: true
    })
  }

  const { action, query, perPage = 15 } = req.body

  try {
    if (action === 'test' || action === 'test-connection') {
      // Test with a simple search
      const response = await fetch(
        `${UNSPLASH_API_URL}/search/photos?query=nature&per_page=1`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      )
      if (response.ok) {
        return res.status(200).json({
          success: true,
          connected: true,
          message: 'Unsplash conectado!'
        })
      } else {
        const error = await response.json().catch(() => ({}))
        return res.status(400).json({
          success: false,
          connected: false,
          message: error.errors?.[0] || 'Erro na conexão com Unsplash'
        })
      }
    }

    if (action === 'search-photos') {
      const response = await fetch(
        `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        return res.status(400).json({ error: error.errors?.[0] || 'Search failed' })
      }

      const data = await response.json()
      return res.status(200).json({
        photos: data.results || [],
        total: data.total,
        source: 'unsplash',
        cost: 0, // Unsplash is FREE (with attribution)
      })
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (error) {
    console.error('Unsplash API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
