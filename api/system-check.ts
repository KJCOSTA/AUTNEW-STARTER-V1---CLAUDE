import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

const ENDPOINTS = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  openai: 'https://api.openai.com/v1/models',
  elevenlabs: 'https://api.elevenlabs.io/v1/user',
  json2video: 'https://api.json2video.com/v2/account',
  youtube: 'https://www.googleapis.com/youtube/v3/channels',
  pexels: 'https://api.pexels.com/v1/search?query=test&per_page=1',
  pixabay: 'https://pixabay.com/api/?q=test',
}

async function checkService(service: string, key: string) {
  const start = Date.now();
  try {
    let url = '', opts = {}
    
    // Configurações específicas de cada API
    if (service === 'gemini') {
      url = `${ENDPOINTS.gemini}?key=${key}`
      opts = { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: 'Ping' }] }] }) }
    } else if (service === 'openai') {
      url = ENDPOINTS.openai
      opts = { headers: { Authorization: `Bearer ${key}` } }
    } else if (service === 'elevenlabs') {
      url = ENDPOINTS.elevenlabs
      opts = { headers: { 'xi-api-key': key } }
    } else if (service === 'json2video') {
      url = ENDPOINTS.json2video
      opts = { headers: { 'x-api-key': key } }
    } else if (service === 'youtube') {
      url = `${ENDPOINTS.youtube}?part=id&id=UCuAXFkgsw1L7xaCfnd5JJOw&key=${key}`
    } else if (service === 'pexels') {
      url = ENDPOINTS.pexels
      opts = { headers: { Authorization: key } }
    } else if (service === 'pixabay') {
      url = `${ENDPOINTS.pixabay}&key=${key}`
    }

    const res = await fetch(url, opts)
    const latency = Date.now() - start
    
    // Análise de falha detalhada
    if (!res.ok) {
        return { success: false, code: res.status, latency, message: `HTTP ${res.status}` }
    }
    
    return { success: true, code: res.status, latency, message: 'Operacional' }
  } catch (e: any) {
    return { success: false, latency: Date.now() - start, error: e.message, message: 'Falha de Rede' }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Permite chamada POST para testar chave específica (Modo Correção)
  if (req.method === 'POST') {
    const { service, key } = req.body
    const result = await checkService(service, key)
    return res.json(result)
  }

  const results: any = {}
  
  // 1. Infraestrutura (Database & Region)
  const dbStart = Date.now()
  try { 
      await sql`SELECT 1`; 
      results.database = { success: true, latency: Date.now() - dbStart, message: 'Conectado (NeonDB)' } 
  } catch (e: any) { 
      results.database = { success: false, latency: 0, message: e.message } 
  }

  // 2. Inteligência Artificial
  const aiServices = [
    { id: 'gemini', env: 'GEMINI_API_KEY' },
    { id: 'openai', env: 'OPENAI_API_KEY' },
    { id: 'elevenlabs', env: 'ELEVENLABS_API_KEY' }
  ]

  // 3. Mídia & Dados
  const mediaServices = [
    { id: 'youtube', env: 'YOUTUBE_API_KEY' },
    { id: 'json2video', env: 'JSON2VIDEO_API_KEY' },
    { id: 'pexels', env: 'PEXELS_API_KEY' },
    { id: 'pixabay', env: 'PIXABAY_API_KEY' }
  ]

  const allServices = [...aiServices, ...mediaServices]

  for (const a of allServices) {
    const key = process.env[a.env]
    if (key) {
        results[a.id] = await checkService(a.id, key)
    } else {
        // Não é erro crítico, é apenas não configurado
        results[a.id] = { success: false, code: 404, message: 'Chave não configurada', missingEnv: true }
    }
  }

  res.json({ 
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'production',
    region: process.env.VERCEL_REGION || 'iad1',
    results 
  })
}
