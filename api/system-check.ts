import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

interface SystemCheckResponse {
  timestamp: string
  status: 'healthy' | 'degraded' | 'error'
  server?: {
    online: boolean
    environment: string
    version: string
  }
  database?: {
    configured: boolean
    connected: boolean
    tables: string[]
    error?: string
    details?: string
    responseTime?: number
  }
  env?: {
    configured: string[]
    missing: string[]
    criticalMissing: string[]
  }
  apis?: Record<string, {
    configured: boolean
    name: string
  }>
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const checkType = req.query.check as string || 'all'
  const response: SystemCheckResponse = {
    timestamp: new Date().toISOString(),
    status: 'healthy'
  }

  try {
    // Server check
    if (checkType === 'server' || checkType === 'all') {
      response.server = {
        online: true,
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
        version: '1.0.0'
      }
    }

    // Database check
    if (checkType === 'database' || checkType === 'all') {
      const dbConfigured = !!process.env.POSTGRES_URL

      if (!dbConfigured) {
        response.database = {
          configured: false,
          connected: false,
          tables: [],
          error: 'POSTGRES_URL não configurada',
          details: 'O banco de dados não está configurado. Configure a variável POSTGRES_URL.'
        }
        response.status = 'degraded'
      } else {
        try {
          const startTime = Date.now()

          // Test connection
          await sql`SELECT 1`

          // Get tables
          const tablesResult = await sql`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
          `
          const tables = tablesResult.rows.map(r => r.table_name)

          response.database = {
            configured: true,
            connected: true,
            tables,
            responseTime: Date.now() - startTime
          }
        } catch (dbError: any) {
          response.database = {
            configured: true,
            connected: false,
            tables: [],
            error: dbError.message,
            details: dbError.code || 'CONNECTION_FAILED'
          }
          response.status = 'error'
        }
      }
    }

    // Environment variables check
    if (checkType === 'env' || checkType === 'all') {
      const envVars = {
        // Critical
        POSTGRES_URL: { critical: true, name: 'Banco de Dados' },
        GEMINI_API_KEY: { critical: true, name: 'Google Gemini' },
        // Important
        YOUTUBE_API_KEY: { critical: false, name: 'YouTube API' },
        ELEVENLABS_API_KEY: { critical: false, name: 'ElevenLabs TTS' },
        JSON2VIDEO_API_KEY: { critical: false, name: 'JSON2Video' },
        // Optional
        OPENAI_API_KEY: { critical: false, name: 'OpenAI' },
        ANTHROPIC_API_KEY: { critical: false, name: 'Anthropic Claude' },
        GROQ_API_KEY: { critical: false, name: 'Groq' },
        PEXELS_API_KEY: { critical: false, name: 'Pexels' },
        PIXABAY_API_KEY: { critical: false, name: 'Pixabay' },
        STABILITY_API_KEY: { critical: false, name: 'Stability AI' },
        GOOGLE_CLIENT_ID: { critical: false, name: 'Google OAuth' },
        GOOGLE_CLIENT_SECRET: { critical: false, name: 'Google OAuth Secret' },
      }

      const configured: string[] = []
      const missing: string[] = []
      const criticalMissing: string[] = []

      for (const [key, config] of Object.entries(envVars)) {
        if (process.env[key]) {
          configured.push(key)
        } else {
          missing.push(key)
          if (config.critical) {
            criticalMissing.push(key)
          }
        }
      }

      response.env = {
        configured,
        missing,
        criticalMissing
      }

      if (criticalMissing.length > 0) {
        response.status = response.status === 'error' ? 'error' : 'degraded'
      }
    }

    // APIs check
    if (checkType === 'apis' || checkType === 'all') {
      response.apis = {
        gemini: {
          configured: !!process.env.GEMINI_API_KEY,
          name: 'Google Gemini (IA Principal)'
        },
        openai: {
          configured: !!process.env.OPENAI_API_KEY,
          name: 'OpenAI / GPT'
        },
        anthropic: {
          configured: !!process.env.ANTHROPIC_API_KEY,
          name: 'Anthropic Claude'
        },
        groq: {
          configured: !!process.env.GROQ_API_KEY,
          name: 'Groq'
        },
        elevenlabs: {
          configured: !!process.env.ELEVENLABS_API_KEY,
          name: 'ElevenLabs (TTS)'
        },
        json2video: {
          configured: !!process.env.JSON2VIDEO_API_KEY,
          name: 'JSON2Video'
        },
        youtube: {
          configured: !!process.env.YOUTUBE_API_KEY,
          name: 'YouTube Data API'
        },
        pexels: {
          configured: !!process.env.PEXELS_API_KEY,
          name: 'Pexels'
        },
        pixabay: {
          configured: !!process.env.PIXABAY_API_KEY,
          name: 'Pixabay'
        },
        stability: {
          configured: !!process.env.STABILITY_API_KEY,
          name: 'Stability AI'
        }
      }
    }

    return res.status(200).json(response)

  } catch (error: any) {
    return res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      }
    })
  }
}
