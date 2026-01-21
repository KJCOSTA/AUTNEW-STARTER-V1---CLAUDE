import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Consolidated YouTube API - Handles metadata, analytics, auth, upload, status
 * Use the "action" parameter to select which operation to perform
 */

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3'

// Helper functions
function extractVideoId(url: string): string | null {
  try {
    if (!url || typeof url !== 'string') {
      console.error('Invalid URL provided to extractVideoId')
      return null
    }

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }

    return null
  } catch (error: any) {
    console.error('Error extracting video ID:', error)
    return null
  }
}

function parseDuration(isoDuration: string): string {
  try {
    if (!isoDuration || typeof isoDuration !== 'string') {
      return '0:00'
    }

    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return '0:00'

    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  } catch (error: any) {
    console.error('Error parsing duration:', error)
    return '0:00'
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

// Handler for fetching video metadata
async function handleMetadata(body: Record<string, unknown>, apiKey: string) {
  const { url } = body

  if (!url) {
    throw new Error('URL is required')
  }

  const videoId = extractVideoId(url as string)
  if (!videoId) {
    throw new Error('Invalid YouTube URL')
  }

  // Fetch video details
  let videoResponse
  try {
    videoResponse = await fetch(
      `${YOUTUBE_API_URL}/videos?id=${videoId}&part=snippet,statistics,contentDetails&key=${apiKey}`
    )

    if (!videoResponse.ok) {
      const errorData = await videoResponse.json().catch(() => ({}))
      console.error('YouTube API error fetching video:', errorData)
      throw new Error(errorData.error?.message || 'Failed to fetch video data')
    }
  } catch (error: any) {
    console.error('Network error fetching video data:', error)
    throw new Error(`Failed to fetch video data: ${error.message}`)
  }

  const videoData = await videoResponse.json()
  const video = videoData.items?.[0]

  if (!video) {
    throw new Error('Video not found')
  }

  const { snippet, statistics, contentDetails } = video

  // Fetch channel details for subscriber count
  let subscriberCount = '0'
  try {
    const channelResponse = await fetch(
      `${YOUTUBE_API_URL}/channels?id=${snippet.channelId}&part=statistics&key=${apiKey}`
    )

    if (channelResponse.ok) {
      const channelData = await channelResponse.json()
      const channel = channelData.items?.[0]
      if (channel?.statistics?.subscriberCount) {
        subscriberCount = formatNumber(parseInt(channel.statistics.subscriberCount))
      }
    } else {
      console.warn('Failed to fetch channel subscriber count')
    }
  } catch (error: any) {
    console.error('Error fetching channel data:', error)
    // Non-critical error, continue with default subscriber count
  }

  // Calculate days since publication
  const publishDate = new Date(snippet.publishedAt)
  const now = new Date()
  const diasDecorridos = Math.floor(
    (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  return {
    videoId,
    titulo: snippet.title,
    canal: snippet.channelTitle,
    inscritos: subscriberCount,
    views: parseInt(statistics.viewCount || '0'),
    likes: parseInt(statistics.likeCount || '0'),
    comentarios: parseInt(statistics.commentCount || '0'),
    dataPublicacao: snippet.publishedAt,
    diasDecorridos,
    duracao: parseDuration(contentDetails.duration),
    tags: snippet.tags || [],
    descricao: snippet.description,
    thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
  }
}

// Handler for channel analytics
async function handleAnalytics(body: Record<string, unknown>, apiKey: string) {
  const { channelId, period = '30' } = body

  if (!channelId) {
    throw new Error('channelId is required')
  }

  // Get channel statistics
  let channelResponse
  try {
    channelResponse = await fetch(
      `${YOUTUBE_API_URL}/channels?id=${channelId}&part=statistics,snippet&key=${apiKey}`
    )

    if (!channelResponse.ok) {
      const errorData = await channelResponse.json().catch(() => ({}))
      console.error('YouTube API error fetching channel:', errorData)
      throw new Error(errorData.error?.message || 'Failed to fetch channel data')
    }
  } catch (error: any) {
    console.error('Network error fetching channel data:', error)
    throw new Error(`Failed to fetch channel data: ${error.message}`)
  }

  const channelData = await channelResponse.json()
  const channel = channelData.items?.[0]

  if (!channel) {
    throw new Error('Channel not found')
  }

  // Get recent videos for performance analysis
  let recentVideos: unknown[] = []
  try {
    const videosResponse = await fetch(
      `${YOUTUBE_API_URL}/search?channelId=${channelId}&part=id&order=date&type=video&maxResults=10&key=${apiKey}`
    )

    if (videosResponse.ok) {
      const videosData = await videosResponse.json()
      recentVideos = videosData.items || []
    } else {
      console.warn('Failed to fetch recent videos for analytics')
    }
  } catch (error: any) {
    console.error('Error fetching recent videos:', error)
    // Non-critical error, continue with empty array
  }

  return {
    channel: {
      id: channel.id,
      title: channel.snippet.title,
      subscribers: parseInt(channel.statistics.subscriberCount || '0'),
      totalViews: parseInt(channel.statistics.viewCount || '0'),
      videoCount: parseInt(channel.statistics.videoCount || '0'),
    },
    recentVideosCount: recentVideos.length,
    period: `${period} days`,
  }
}

// Handler for auth URL generation
function handleAuthUrl() {
  const clientId = process.env.YOUTUBE_CLIENT_ID
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI || `${process.env.VERCEL_URL}/api/youtube?action=callback`

  if (!clientId) {
    throw new Error('YOUTUBE_CLIENT_ID not configured')
  }

  const scope = encodeURIComponent('https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly')
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`

  return { authUrl }
}

// Handler for status check
function handleStatus() {
  const clientId = process.env.YOUTUBE_CLIENT_ID
  const apiKey = process.env.YOUTUBE_API_KEY

  return {
    success: true,
    status: 'ok',
    configured: !!(clientId || apiKey),
    hasClientId: !!clientId,
    hasApiKey: !!apiKey,
    message: clientId || apiKey ? 'YouTube configurado' : 'YouTube não configurado',
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow GET for status check
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.method === 'POST' ? req.body : req.query
  const { action } = body

  try {
    let result

    switch (action) {
      case 'test':
      case 'test-connection':
      case 'status':
        result = handleStatus()
        break

      case 'metadata': {
        const apiKey = process.env.YOUTUBE_API_KEY
        if (!apiKey) {
          return res.status(500).json({
            error: 'YOUTUBE_API_KEY not configured',
            configured: false,
            needsConfiguration: true
          })
        }
        result = await handleMetadata(body, apiKey)
        break
      }

      case 'analytics': {
        const apiKey = process.env.YOUTUBE_API_KEY
        if (!apiKey) {
          return res.status(500).json({
            error: 'YOUTUBE_API_KEY not configured',
            configured: false,
            needsConfiguration: true
          })
        }
        result = await handleAnalytics(body, apiKey)
        break
      }

      case 'auth-url':
        result = handleAuthUrl()
        break

      default:
        // Default to status if no action specified
        result = handleStatus()
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('YouTube API error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}
