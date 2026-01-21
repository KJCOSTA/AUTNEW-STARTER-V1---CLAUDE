import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Consolidated YouTube API - Handles metadata, analytics, auth, upload, status
 * Use the "action" parameter to select which operation to perform
 */

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3'

// Helper functions
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

function parseDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return '0:00'

  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
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
  const videoResponse = await fetch(
    `${YOUTUBE_API_URL}/videos?id=${videoId}&part=snippet,statistics,contentDetails&key=${apiKey}`
  )

  if (!videoResponse.ok) {
    throw new Error('Failed to fetch video data')
  }

  const videoData = await videoResponse.json()
  const video = videoData.items?.[0]

  if (!video) {
    throw new Error('Video not found')
  }

  const { snippet, statistics, contentDetails } = video

  // Fetch channel details for subscriber count
  const channelResponse = await fetch(
    `${YOUTUBE_API_URL}/channels?id=${snippet.channelId}&part=statistics&key=${apiKey}`
  )

  let subscriberCount = '0'
  if (channelResponse.ok) {
    const channelData = await channelResponse.json()
    const channel = channelData.items?.[0]
    if (channel?.statistics?.subscriberCount) {
      subscriberCount = formatNumber(parseInt(channel.statistics.subscriberCount))
    }
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
  const channelResponse = await fetch(
    `${YOUTUBE_API_URL}/channels?id=${channelId}&part=statistics,snippet&key=${apiKey}`
  )

  if (!channelResponse.ok) {
    throw new Error('Failed to fetch channel data')
  }

  const channelData = await channelResponse.json()
  const channel = channelData.items?.[0]

  if (!channel) {
    throw new Error('Channel not found')
  }

  // Get recent videos for performance analysis
  const videosResponse = await fetch(
    `${YOUTUBE_API_URL}/search?channelId=${channelId}&part=id&order=date&type=video&maxResults=10&key=${apiKey}`
  )

  let recentVideos: unknown[] = []
  if (videosResponse.ok) {
    const videosData = await videosResponse.json()
    recentVideos = videosData.items || []
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
