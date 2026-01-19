import type { VercelRequest, VercelResponse } from '@vercel/node'

const YOUTUBE_UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { title, description, tags, videoUrl, thumbnailUrl, scheduleDate, accessToken } = req.body

  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  if (!videoUrl) {
    return res.status(400).json({ error: 'Video URL is required' })
  }

  try {
    // Prepare video metadata
    const metadata = {
      snippet: {
        title: title || 'Untitled Video',
        description: description || '',
        tags: tags || [],
        categoryId: '22', // People & Blogs (good for spiritual content)
        defaultLanguage: 'pt',
        defaultAudioLanguage: 'pt',
      },
      status: {
        privacyStatus: scheduleDate ? 'private' : 'public',
        selfDeclaredMadeForKids: false,
        ...(scheduleDate && { publishAt: new Date(scheduleDate).toISOString() }),
      },
    }

    // Note: In a real implementation, you would:
    // 1. Download the video from videoUrl to a buffer
    // 2. Upload using resumable upload API
    // 3. Set the thumbnail using thumbnails.set endpoint

    // For this demo, we'll simulate the upload
    // In production, use Google's resumable upload:
    // https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol

    // Simulated response
    const simulatedVideoId = 'sim_' + Date.now().toString(36)

    // In a real implementation:
    // const uploadResponse = await fetch(`${YOUTUBE_UPLOAD_URL}?uploadType=resumable&part=snippet,status`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${accessToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(metadata),
    // })

    return res.status(200).json({
      videoId: simulatedVideoId,
      url: `https://www.youtube.com/watch?v=${simulatedVideoId}`,
      scheduled: !!scheduleDate,
      scheduledDate: scheduleDate || null,
      message: 'Video uploaded successfully',
    })
  } catch (error) {
    console.error('YouTube upload error:', error)
    return res.status(500).json({ error: 'Upload failed' })
  }
}
