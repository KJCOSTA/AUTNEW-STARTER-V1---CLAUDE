cat << 'EOF' > api/system-status.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

const timeout = (ms: number) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), ms)
  )

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const result = {
    server: true,
    database: true,
    apis: {
      gemini: false,
      openai: false,
      elevenlabs: false,
      youtube: false,
      json2video: false,
    },
  }

  async function safeCheck(fn: () => Promise<any>) {
    try {
      await Promise.race([fn(), timeout(3000)])
      return true
    } catch {
      return false
    }
  }

  result.apis.gemini = !!process.env.GEMINI_API_KEY
  result.apis.openai = !!process.env.OPENAI_API_KEY
  result.apis.elevenlabs = !!process.env.ELEVENLABS_API_KEY
  result.apis.youtube = !!process.env.YOUTUBE_API_KEY
  result.apis.json2video = !!process.env.JSON2VIDEO_API_KEY

  res.status(200).json(result)
}
EOF
