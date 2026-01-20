import type { VercelRequest, VercelResponse } from '@vercel/node'

const PIXABAY_API_URL = 'https://pixabay.com/api'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.PIXABAY_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: 'PIXABAY_API_KEY not configured',
      configured: false,
      needsConfiguration: true
    })
  }

  const { action, query, perPage = 15, category } = req.body

  try {
    if (action === 'test' || action === 'test-connection') {
      // Test with a simple search
      const response = await fetch(
        `${PIXABAY_API_URL}/?key=${apiKey}&q=nature&per_page=1`
      )
      if (response.ok) {
        return res.status(200).json({
          success: true,
          connected: true,
          message: 'Pixabay conectado!'
        })
      } else {
        return res.status(400).json({
          success: false,
          connected: false,
          message: 'Erro na conexão com Pixabay'
        })
      }
    }

    if (action === 'search-photos') {
      const params = new URLSearchParams({
        key: apiKey,
        q: query,
        per_page: perPage.toString(),
        safesearch: 'true',
        image_type: 'photo',
      })
      if (category) params.append('category', category)

      const response = await fetch(`${PIXABAY_API_URL}/?${params}`)

      if (!response.ok) {
        return res.status(400).json({ error: 'Search failed' })
      }

      const data = await response.json()
      return res.status(200).json({
        images: data.hits || [],
        total: data.totalHits,
        source: 'pixabay',
        cost: 0, // Pixabay is FREE
      })
    }

    if (action === 'search-videos') {
      const params = new URLSearchParams({
        key: apiKey,
        q: query,
        per_page: perPage.toString(),
        safesearch: 'true',
        video_type: 'all',
      })
      if (category) params.append('category', category)

      const response = await fetch(`${PIXABAY_API_URL}/videos/?${params}`)

      if (!response.ok) {
        return res.status(400).json({ error: 'Video search failed' })
      }

      const data = await response.json()
      return res.status(200).json({
        videos: data.hits || [],
        total: data.totalHits,
        source: 'pixabay',
        cost: 0, // Pixabay is FREE
      })
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (error) {
    console.error('Pixabay API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
