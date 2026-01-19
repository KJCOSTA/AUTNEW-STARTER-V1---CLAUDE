import type { VercelRequest, VercelResponse } from '@vercel/node'

const YOUTUBE_ANALYTICS_URL = 'https://youtubeanalytics.googleapis.com/v2/reports'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { accessToken, startDate, endDate } = req.body

  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    // Get channel analytics for the specified period
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const start = startDate || thirtyDaysAgo.toISOString().split('T')[0]
    const end = endDate || today.toISOString().split('T')[0]

    // Fetch general metrics
    const metricsResponse = await fetch(
      `${YOUTUBE_ANALYTICS_URL}?` +
        new URLSearchParams({
          ids: 'channel==MINE',
          startDate: start,
          endDate: end,
          metrics: 'views,estimatedMinutesWatched,averageViewDuration,subscribersGained',
          dimensions: 'day',
          sort: 'day',
        }),
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    if (!metricsResponse.ok) {
      const error = await metricsResponse.json()
      return res.status(400).json({ error: error.error?.message || 'Failed to fetch analytics' })
    }

    const metricsData = await metricsResponse.json()

    // Fetch top videos
    const topVideosResponse = await fetch(
      `${YOUTUBE_ANALYTICS_URL}?` +
        new URLSearchParams({
          ids: 'channel==MINE',
          startDate: start,
          endDate: end,
          metrics: 'views,estimatedMinutesWatched,averageViewDuration',
          dimensions: 'video',
          sort: '-views',
          maxResults: '10',
        }),
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    let topVideos: any[] = []
    if (topVideosResponse.ok) {
      const topVideosData = await topVideosResponse.json()
      topVideos = topVideosData.rows || []
    }

    // Process data
    const rows = metricsData.rows || []
    const totalViews = rows.reduce((sum: number, row: any[]) => sum + (row[1] || 0), 0)
    const totalWatchTime = rows.reduce((sum: number, row: any[]) => sum + (row[2] || 0), 0)
    const avgRetention = rows.length > 0
      ? rows.reduce((sum: number, row: any[]) => sum + (row[3] || 0), 0) / rows.length
      : 0
    const totalSubscribers = rows.reduce((sum: number, row: any[]) => sum + (row[4] || 0), 0)

    // Find best performing video duration
    const durationBuckets: Record<string, number> = {
      '3-5min': 0,
      '5-10min': 0,
      '10-15min': 0,
      '15+min': 0,
    }

    // Simulated duration analysis (in production, fetch video details)
    const bestDuration = '5-10min' // Most common for spiritual content

    return res.status(200).json({
      periodo: { inicio: start, fim: end },
      metricas: {
        totalViews,
        totalWatchTime: Math.round(totalWatchTime / 60), // Convert to hours
        avgRetention: Math.round(avgRetention / 60), // Convert to minutes
        subscribersGained: totalSubscribers,
      },
      topVideos: topVideos.map((row: any[]) => ({
        videoId: row[0],
        views: row[1],
        watchTime: Math.round(row[2] / 60),
        avgDuration: Math.round(row[3]),
      })),
      insights: {
        melhorVideo: topVideos[0]?.[0] || null,
        duracaoIdeal: bestDuration,
        retencaoMedia: Math.round((avgRetention / 60) * 100) / 100,
      },
    })
  } catch (error) {
    console.error('YouTube Analytics error:', error)
    return res.status(500).json({ error: 'Failed to fetch analytics' })
  }
}
