import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

interface ApiTestResult {
  configured: boolean
  name: string
  connected?: boolean
  responseTime?: number
  error?: string
}

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
  apis?: Record<string, ApiTestResult>
}

// API URLs for real connection tests
const API_URLS = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  openai: 'https://api.openai.com/v1/models',
  pexels: 'https://api.pexels.com/v1/search?query=test&per_page=1',
  pixabay: 'https://pixabay.com/api/?q=test&per_page=3',
  json2video: 'https://api.json2video.com/v2/account',
  elevenlabs: 'https://api.elevenlabs.io/v1/user',
  anthropic: 'https://api.anthropic.com/v1/messages',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
}

// Test real API connections
async function testGemini(apiKey: string): Promise<{ connected: boolean; responseTime: number; error?: string }> {
  const start = Date.now()
  try {
    const response = await fetch(`${API_URLS.gemini}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say OK' }] }],
        generationConfig: { maxOutputTokens: 5 }
      }),
    })
    const responseTime = Date.now() - start
    if (response.ok) {
      return { connected: true, responseTime }
    }
    const error = await response.json().catch(() => ({}))
    return { connected: false, responseTime, error: error.error?.message || `HTTP ${response.status}` }
  } catch (e: any) {
    return { connected: false, responseTime: Date.now() - start, error: e.message }
  }
}

async function testOpenAI(apiKey: string): Promise<{ connected: boolean; responseTime: number; error?: string }> {
  const start = Date.now()
  try {
    const response = await fetch(API_URLS.openai, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const responseTime = Date.now() - start
    if (response.ok) {
      return { connected: true, responseTime }
    }
    const error = await response.json().catch(() => ({}))
    return { connected: false, responseTime, error: error.error?.message || `HTTP ${response.status}` }
  } catch (e: any) {
    return { connected: false, responseTime: Date.now() - start, error: e.message }
  }
}

async function testPexels(apiKey: string): Promise<{ connected: boolean; responseTime: number; error?: string }> {
  const start = Date.now()
  try {
    const response = await fetch(API_URLS.pexels, {
      headers: { Authorization: apiKey },
    })
    const responseTime = Date.now() - start
    if (response.ok) {
      return { connected: true, responseTime }
    }
    return { connected: false, responseTime, error: `HTTP ${response.status}` }
  } catch (e: any) {
    return { connected: false, responseTime: Date.now() - start, error: e.message }
  }
}

async function testPixabay(apiKey: string): Promise<{ connected: boolean; responseTime: number; error?: string }> {
  const start = Date.now()
  try {
    const response = await fetch(`${API_URLS.pixabay}&key=${apiKey}`)
    const responseTime = Date.now() - start
    if (response.ok) {
      const data = await response.json()
      if (data.totalHits !== undefined) {
        return { connected: true, responseTime }
      }
    }
    return { connected: false, responseTime, error: `HTTP ${response.status}` }
  } catch (e: any) {
    return { connected: false, responseTime: Date.now() - start, error: e.message }
  }
}

async function testJson2Video(apiKey: string): Promise<{ connected: boolean; responseTime: number; error?: string }> {
  const start = Date.now()
  try {
    const response = await fetch(API_URLS.json2video, {
      headers: { 'x-api-key': apiKey },
    })
    const responseTime = Date.now() - start
    if (response.ok) {
      return { connected: true, responseTime }
    }
    return { connected: false, responseTime, error: `HTTP ${response.status}` }
  } catch (e: any) {
    return { connected: false, responseTime: Date.now() - start, error: e.message }
  }
}

async function testElevenLabs(apiKey: string): Promise<{ connected: boolean; responseTime: number; error?: string }> {
  const start = Date.now()
  try {
    const response = await fetch(API_URLS.elevenlabs, {
      headers: { 'xi-api-key': apiKey },
    })
    const responseTime = Date.now() - start
    if (response.ok) {
      return { connected: true, responseTime }
    }
    const error = await response.json().catch(() => ({}))
    return { connected: false, responseTime, error: error.detail?.message || `HTTP ${response.status}` }
  } catch (e: any) {
    return { connected: false, responseTime: Date.now() - start, error: e.message }
  }
}

async function testAnthropic(apiKey: string): Promise<{ connected: boolean; responseTime: number; error?: string }> {
  const start = Date.now()
  try {
    const response = await fetch(API_URLS.anthropic, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Say OK' }],
      }),
    })
    const responseTime = Date.now() - start
    if (response.ok) {
      return { connected: true, responseTime }
    }
    const error = await response.json().catch(() => ({}))
    return { connected: false, responseTime, error: error.error?.message || `HTTP ${response.status}` }
  } catch (e: any) {
    return { connected: false, responseTime: Date.now() - start, error: e.message }
  }
}

async function testGroq(apiKey: string): Promise<{ connected: boolean; responseTime: number; error?: string }> {
  const start = Date.now()
  try {
    const response = await fetch(API_URLS.groq, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 5,
      }),
    })
    const responseTime = Date.now() - start
    if (response.ok) {
      return { connected: true, responseTime }
    }
    const error = await response.json().catch(() => ({}))
    return { connected: false, responseTime, error: error.error?.message || `HTTP ${response.status}` }
  } catch (e: any) {
    return { connected: false, responseTime: Date.now() - start, error: e.message }
  }
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
      const deepTest = req.query.deep === 'true'

      // Initialize APIs with basic config check
      const apis: Record<string, ApiTestResult> = {
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

      // Run real connection tests if deep=true
      if (deepTest) {
        const testPromises: Promise<void>[] = []

        // Gemini
        if (process.env.GEMINI_API_KEY) {
          testPromises.push(
            testGemini(process.env.GEMINI_API_KEY).then(result => {
              apis.gemini = { ...apis.gemini, ...result }
            })
          )
        }

        // OpenAI
        if (process.env.OPENAI_API_KEY) {
          testPromises.push(
            testOpenAI(process.env.OPENAI_API_KEY).then(result => {
              apis.openai = { ...apis.openai, ...result }
            })
          )
        }

        // Anthropic
        if (process.env.ANTHROPIC_API_KEY) {
          testPromises.push(
            testAnthropic(process.env.ANTHROPIC_API_KEY).then(result => {
              apis.anthropic = { ...apis.anthropic, ...result }
            })
          )
        }

        // Groq
        if (process.env.GROQ_API_KEY) {
          testPromises.push(
            testGroq(process.env.GROQ_API_KEY).then(result => {
              apis.groq = { ...apis.groq, ...result }
            })
          )
        }

        // ElevenLabs
        if (process.env.ELEVENLABS_API_KEY) {
          testPromises.push(
            testElevenLabs(process.env.ELEVENLABS_API_KEY).then(result => {
              apis.elevenlabs = { ...apis.elevenlabs, ...result }
            })
          )
        }

        // JSON2Video
        if (process.env.JSON2VIDEO_API_KEY) {
          testPromises.push(
            testJson2Video(process.env.JSON2VIDEO_API_KEY).then(result => {
              apis.json2video = { ...apis.json2video, ...result }
            })
          )
        }

        // Pexels
        if (process.env.PEXELS_API_KEY) {
          testPromises.push(
            testPexels(process.env.PEXELS_API_KEY).then(result => {
              apis.pexels = { ...apis.pexels, ...result }
            })
          )
        }

        // Pixabay
        if (process.env.PIXABAY_API_KEY) {
          testPromises.push(
            testPixabay(process.env.PIXABAY_API_KEY).then(result => {
              apis.pixabay = { ...apis.pixabay, ...result }
            })
          )
        }

        // Wait for all tests to complete
        await Promise.all(testPromises)
      }

      response.apis = apis
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
