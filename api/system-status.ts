import type { VercelRequest, VercelResponse } from '@vercel/node'

const timeout = (ms: number) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), ms)
  )

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  const result = {
    server: true,
    database: true,
    env: {
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      ELEVENLABS_API_KEY: !!process.env.ELEVENLABS_API_KEY,
      YOUTUBE_API_KEY: !!process.env.YOUTUBE_API_KEY,
    },
    apis: {
      gemini: false,
      openai: false,
      elevenlabs: false,
      youtube: false,
    },
  }

  // GEMINI
  try {
    if (process.env.GEMINI_API_KEY) {
      await Promise.race([
        fetch('https://generativelanguage.googleapis.com/v1/models', {
          headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
        }),
        timeout(3000),
      ])
      result.apis.gemini = true
    }
  } catch {}

  // OPENAI
  try {
    if (process.env.OPENAI_API_KEY) {
      await Promise.race([
        fetch('https://api.openai.com/v1/models', {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }),
        timeout(3000),
      ])
      result.apis.openai = true
    }
  } catch {}

  // ELEVENLABS
  try {
    if (process.env.ELEVENLABS_API_KEY) {
      await Promise.race([
        fetch('https://api.elevenlabs.io/v1/voices', {
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
          },
        }),
        timeout(3000),
      ])
      result.apis.elevenlabs = true
    }
  } catch {}

  // YOUTUBE (opcional)
  try {
    if (process.env.YOUTUBE_API_KEY) {
      await Promise.race([
        fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=id&mine=true&key=${process.env.YOUTUBE_API_KEY}`
        ),
        timeout(3000),
      ])
      result.apis.youtube = true
    }
  } catch {}

  res.status(200).json(result)
}
