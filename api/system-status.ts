export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const result = {
    server: true,
    database: true,
    apis: {
      gemini: !!process.env.GEMINI_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      youtube: !!process.env.YOUTUBE_API_KEY,
      json2video: !!process.env.JSON2VIDEO_API_KEY,
    },
  }

  res.status(200).json(result)
}
