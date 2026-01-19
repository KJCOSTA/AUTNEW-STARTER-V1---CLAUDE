import type { VercelRequest, VercelResponse } from '@vercel/node'

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3'

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'YOUTUBE_API_KEY not configured' })
  }

  const { url } = req.body

  if (!url) {
    return res.status(400).json({ error: 'URL is required' })
  }

  const videoId = extractVideoId(url)
  if (!videoId) {
    return res.status(400).json({ error: 'Invalid YouTube URL' })
  }

  try {
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
      return res.status(404).json({ error: 'Video not found' })
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

    const metadata = {
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

    return res.status(200).json(metadata)
  } catch (error) {
    console.error('YouTube API error:', error)
    return res.status(500).json({ error: 'Failed to fetch video metadata' })
  }
}
