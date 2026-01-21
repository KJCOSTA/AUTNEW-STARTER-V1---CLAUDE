import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

interface ApiTestResult {
  configured: boolean
  name: string
  connected?: boolean
  responseTime?: number
  error?: string
  details?: string
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

const API_URLS = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  openai: 'https://api.openai.com/v1/models',
  pexels: 'https://api.pexels.com/v1/search?query=test&per_page=1',
  pixabay: 'https://pixabay.com/api/?q=test&per_page=3',
  json2video: 'https://api.json2video.com/v2/account',
  elevenlabs: 'https://api.elevenlabs.io/v1/user',
  anthropic: 'https://api.anthropic.com/v1/messages',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  youtube: 'https://www.googleapis.com/youtube/v3/channels',
}

async function testYouTube(apiKey: string, channelId?: string): Promise<{ connected: boolean; responseTime: number; error?: string; details?: string }> {
  const start = Date.now()
  try {
    // Tenta pegar o ID do canal de várias variáveis possíveis
    const targetChannelId = channelId || process.env.CHANNEL_ID || process.env.YOUTUBE_CHANNEL_ID;
    
    // Se não tiver canal, testa apenas a chave com uma busca genérica
    const url = targetChannelId 
      ? `${API_URLS.youtube}?part=snippet,statistics&id=${targetChannelId}&key=${apiKey}`
      : `${API_URLS.youtube}?part=id&id=UCuAXFkgsw1L7xaCfnd5JJOw&key=${apiKey}`; // Canal teste do Google

    console.log('[YOUTUBE TEST] Testing URL:', url.replace(apiKey, 'HIDDEN'));

    const response = await fetch(url)
    const responseTime = Date.now() - start
    const data = await response.json()

    if (!response.ok) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      const errorReason = data.error?.errors?.[0]?.reason || 'unknown';
      return { 
        connected: false, 
        responseTime, 
        error: `Erro API: ${errorMsg}`,
        details: `Motivo: ${errorReason} | ChannelID usado: ${targetChannelId || 'Nenhum'}`
      }
    }

    if (data.items && data.items.length > 0) {
      return { connected: true, responseTime, details: `Canal encontrado: ${data.items[0].snippet.title}` }
    }
    
    // Se a chave funciona mas o canal não foi achado (retornou items: [])
    if (targetChannelId) {
       return { 
         connected: false, 
         responseTime, 
         error: 'Canal não encontrado',
         details: `A API respondeu, mas o ID ${targetChannelId} não retornou dados.`
       }
    }

    return { connected: true, responseTime, details: 'Chave válida (sem canal específico)' }

  } catch (e: any) {
    return { connected: false, responseTime: Date.now() - start, error: e.message }
  }
}

// Funções de teste genéricas para outras APIs
async function simpleGet(url: string, headers: any = {}): Promise<{ connected: boolean; responseTime: number; error?: string }> {
  const start = Date.now();
  try {
    const res = await fetch(url, { headers });
    if (res.ok) return { connected: true, responseTime: Date.now() - start };
    const err = await res.json().catch(() => ({}));
    return { connected: false, responseTime: Date.now() - start, error: err.error?.message || err.message || `Status ${res.status}` };
  } catch (e: any) {
    return { connected: false, responseTime: Date.now() - start, error: e.message };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  
  if (req.method === 'OPTIONS') return res.status(200).end()

  const checkType = req.query.check as string || 'all'
  const response: SystemCheckResponse = {
    timestamp: new Date().toISOString(),
    status: 'healthy'
  }

  try {
    // 1. SERVER
    if (checkType === 'server' || checkType === 'all') {
      response.server = {
        online: true,
        environment: process.env.NODE_ENV || 'dev',
        version: '1.2.0 (Fix)'
      }
    }

    // 2. DATABASE
    if (checkType === 'database' || checkType === 'all') {
      if (!process.env.POSTGRES_URL) {
        response.database = { configured: false, connected: false, tables: [], error: 'POSTGRES_URL missing' }
      } else {
        try {
          const start = Date.now()
          await sql`SELECT 1`
          const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
          response.database = {
            configured: true,
            connected: true,
            tables: tables.rows.map(r => r.table_name),
            responseTime: Date.now() - start
          }
        } catch (e: any) {
          response.database = { configured: true, connected: false, tables: [], error: e.message }
          response.status = 'error'
        }
      }
    }

    // 3. APIS (Deep Test)
    if (checkType === 'apis' || checkType === 'all') {
      const deep = req.query.deep === 'true'
      const apis: Record<string, ApiTestResult> = {}

      // Config Checks
      apis.youtube = { configured: !!process.env.YOUTUBE_API_KEY, name: 'YouTube' }
      apis.openai = { configured: !!process.env.OPENAI_API_KEY, name: 'OpenAI' }
      apis.gemini = { configured: !!process.env.GEMINI_API_KEY, name: 'Gemini' }
      
      if (deep) {
        // YouTube Test
        if (apis.youtube.configured) {
          const ytRes = await testYouTube(process.env.YOUTUBE_API_KEY!, process.env.CHANNEL_ID);
          apis.youtube = { ...apis.youtube, ...ytRes };
        }
        
        // OpenAI Test
        if (apis.openai.configured) {
           const res = await simpleGet(API_URLS.openai, { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` });
           apis.openai = { ...apis.openai, ...res };
        }
      }
      
      response.apis = apis;
    }

    return res.status(200).json(response)
  } catch (e: any) {
    return res.status(500).json({ status: 'error', error: e.message })
  }
}
