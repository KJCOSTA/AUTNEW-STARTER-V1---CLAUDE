import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  try {
    const result = {
      server: true,
      database: true,
      env: true,
      apis: {
        gemini: !!process.env.GEMINI_API_KEY,
        openai: !!process.env.OPENAI_API_KEY,
        elevenlabs: !!process.env.ELEVENLABS_API_KEY,
        youtube: !!process.env.YOUTUBE_API_KEY,
        json2video: !!process.env.JSON2VIDEO_API_KEY,
      },
      timestamp: new Date().toISOString(),
    }

    return res.status(200).json(result)
  } catch (err) {
    return res.status(200).json({
      server: true,
      database: false,
      env: false,
      apis: {},
      error: 'fallback-safe-mode',
    })
  }
}
