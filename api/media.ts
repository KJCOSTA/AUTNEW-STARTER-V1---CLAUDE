import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Consolidated Media API - Handles Pexels, Pixabay, and Unsplash
 * Use the "provider" parameter to select which service to use
 */

const PEXELS_API_URL = 'https://api.pexels.com/v1'
const PEXELS_VIDEO_URL = 'https://api.pexels.com/videos'
const PIXABAY_API_URL = 'https://pixabay.com/api'
const UNSPLASH_API_URL = 'https://api.unsplash.com'

// Handler for Pexels
async function handlePexels(action: string, body: Record<string, unknown>, apiKey: string) {
  const { query, perPage = 15 } = body

  if (action === 'test' || action === 'test-connection') {
    try {
      const response = await fetch(`${PEXELS_API_URL}/search?query=nature&per_page=1`, {
        headers: { Authorization: apiKey },
      })
      if (response.ok) {
        return { success: true, connected: true, message: 'Pexels conectado!' }
      } else {
        const error = await response.json().catch(() => ({}))
        return { success: false, connected: false, message: error.error || 'Erro na conexão com Pexels' }
      }
    } catch (error: any) {
      console.error('Pexels connection test failed:', error)
      return { success: false, connected: false, message: `Network error: ${error.message}` }
    }
  }

  if (action === 'search-photos') {
    try {
      const response = await fetch(
        `${PEXELS_API_URL}/search?query=${encodeURIComponent(query as string)}&per_page=${perPage}`,
        { headers: { Authorization: apiKey } }
      )
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Pexels photo search failed:', errorData)
        throw new Error(errorData.error || 'Pexels search failed')
      }
      const data = await response.json()
      return { photos: data.photos || [], total: data.total_results, source: 'pexels', cost: 0 }
    } catch (error: any) {
      console.error('Pexels photo search error:', error)
      throw new Error(`Pexels photo search failed: ${error.message}`)
    }
  }

  if (action === 'search-videos') {
    try {
      const response = await fetch(
        `${PEXELS_VIDEO_URL}/search?query=${encodeURIComponent(query as string)}&per_page=${perPage}`,
        { headers: { Authorization: apiKey } }
      )
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Pexels video search failed:', errorData)
        throw new Error(errorData.error || 'Pexels video search failed')
      }
      const data = await response.json()
      return { videos: data.videos || [], total: data.total_results, source: 'pexels', cost: 0 }
    } catch (error: any) {
      console.error('Pexels video search error:', error)
      throw new Error(`Pexels video search failed: ${error.message}`)
    }
  }

  throw new Error('Invalid action for Pexels')
}

// Handler for Pixabay
async function handlePixabay(action: string, body: Record<string, unknown>, apiKey: string) {
  const { query, perPage = 15, category } = body

  if (action === 'test' || action === 'test-connection') {
    try {
      const response = await fetch(`${PIXABAY_API_URL}/?key=${apiKey}&q=nature&per_page=1`)
      if (response.ok) {
        return { success: true, connected: true, message: 'Pixabay conectado!' }
      } else {
        const errorData = await response.json().catch(() => ({}))
        return { success: false, connected: false, message: errorData.message || 'Erro na conexão com Pixabay' }
      }
    } catch (error: any) {
      console.error('Pixabay connection test failed:', error)
      return { success: false, connected: false, message: `Network error: ${error.message}` }
    }
  }

  if (action === 'search-photos') {
    try {
      const params = new URLSearchParams({
        key: apiKey,
        q: query as string,
        per_page: String(perPage),
        safesearch: 'true',
        image_type: 'photo',
      })
      if (category) params.append('category', category as string)
      const response = await fetch(`${PIXABAY_API_URL}/?${params}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Pixabay photo search failed:', errorData)
        throw new Error(errorData.message || 'Pixabay search failed')
      }
      const data = await response.json()
      return { images: data.hits || [], total: data.totalHits, source: 'pixabay', cost: 0 }
    } catch (error: any) {
      console.error('Pixabay photo search error:', error)
      throw new Error(`Pixabay photo search failed: ${error.message}`)
    }
  }

  if (action === 'search-videos') {
    try {
      const params = new URLSearchParams({
        key: apiKey,
        q: query as string,
        per_page: String(perPage),
        safesearch: 'true',
        video_type: 'all',
      })
      if (category) params.append('category', category as string)
      const response = await fetch(`${PIXABAY_API_URL}/videos/?${params}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Pixabay video search failed:', errorData)
        throw new Error(errorData.message || 'Pixabay video search failed')
      }
      const data = await response.json()
      return { videos: data.hits || [], total: data.totalHits, source: 'pixabay', cost: 0 }
    } catch (error: any) {
      console.error('Pixabay video search error:', error)
      throw new Error(`Pixabay video search failed: ${error.message}`)
    }
  }

  throw new Error('Invalid action for Pixabay')
}

// Handler for Unsplash
async function handleUnsplash(action: string, body: Record<string, unknown>, accessKey: string) {
  const { query, perPage = 15 } = body

  if (action === 'test' || action === 'test-connection') {
    try {
      const response = await fetch(
        `${UNSPLASH_API_URL}/search/photos?query=nature&per_page=1`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      )
      if (response.ok) {
        return { success: true, connected: true, message: 'Unsplash conectado!' }
      } else {
        const error = await response.json().catch(() => ({}))
        return { success: false, connected: false, message: error.errors?.[0] || 'Erro na conexão com Unsplash' }
      }
    } catch (error: any) {
      console.error('Unsplash connection test failed:', error)
      return { success: false, connected: false, message: `Network error: ${error.message}` }
    }
  }

  if (action === 'search-photos') {
    try {
      const response = await fetch(
        `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(query as string)}&per_page=${perPage}`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      )
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Unsplash photo search failed:', errorData)
        throw new Error(errorData.errors?.[0] || 'Unsplash search failed')
      }
      const data = await response.json()
      return { photos: data.results || [], total: data.total, source: 'unsplash', cost: 0 }
    } catch (error: any) {
      console.error('Unsplash photo search error:', error)
      throw new Error(`Unsplash photo search failed: ${error.message}`)
    }
  }

  throw new Error('Invalid action for Unsplash')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { provider, action, ...rest } = req.body

  if (!provider || !action) {
    return res.status(400).json({ error: 'Missing provider or action parameter' })
  }

  try {
    let result

    switch (provider) {
      case 'pexels': {
        const apiKey = process.env.PEXELS_API_KEY
        if (!apiKey) {
          return res.status(500).json({
            error: 'PEXELS_API_KEY not configured',
            configured: false,
            needsConfiguration: true
          })
        }
        result = await handlePexels(action, rest, apiKey)
        break
      }

      case 'pixabay': {
        const apiKey = process.env.PIXABAY_API_KEY
        if (!apiKey) {
          return res.status(500).json({
            error: 'PIXABAY_API_KEY not configured',
            configured: false,
            needsConfiguration: true
          })
        }
        result = await handlePixabay(action, rest, apiKey)
        break
      }

      case 'unsplash': {
        const accessKey = process.env.UNSPLASH_ACCESS_KEY
        if (!accessKey) {
          return res.status(500).json({
            error: 'UNSPLASH_ACCESS_KEY not configured',
            configured: false,
            needsConfiguration: true
          })
        }
        result = await handleUnsplash(action, rest, accessKey)
        break
      }

      default:
        return res.status(400).json({ error: `Unknown provider: ${provider}` })
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('Media API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}
