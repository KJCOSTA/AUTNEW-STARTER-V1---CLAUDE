import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

const ENDPOINTS = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  openai: 'https://api.openai.com/v1/models',
  elevenlabs: 'https://api.elevenlabs.io/v1/user',
  json2video: 'https://api.json2video.com/v2/account',
  youtube: 'https://www.googleapis.com/youtube/v3/channels',
}

async function checkService(service: string, key: string) {
  try {
    let url = '', opts = {}
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
    }

    const res = await fetch(url, opts)
    return { success: res.ok, code: res.status }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const { service, key } = req.body
    const result = await checkService(service, key)
    return res.json(result)
  }

  const results: any = {}
  
  // DB
  try { await sql`SELECT 1`; results.database = { success: true } } 
  catch (e) { results.database = { success: false } }

  // APIs
  const apis = [
    { id: 'gemini', env: 'GEMINI_API_KEY' },
    { id: 'youtube', env: 'YOUTUBE_API_KEY' },
    { id: 'elevenlabs', env: 'ELEVENLABS_API_KEY' },
    { id: 'openai', env: 'OPENAI_API_KEY' },
    { id: 'json2video', env: 'JSON2VIDEO_API_KEY' }
  ]

  for (const a of apis) {
    const key = process.env[a.env]
    if (key) results[a.id] = await checkService(a.id, key)
    else results[a.id] = { success: false, message: 'Missing ENV' }
  }

  res.json({ results })
}
