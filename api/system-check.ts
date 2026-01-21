import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

// Mapeamento de endpoints para teste real
const ENDPOINTS = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  openai: 'https://api.openai.com/v1/models',
  elevenlabs: 'https://api.elevenlabs.io/v1/user',
  pexels: 'https://api.pexels.com/v1/search?query=test&per_page=1',
  pixabay: 'https://pixabay.com/api/?q=test&per_page=3',
  stability: 'https://api.stability.ai/v1/user/account',
  telegram: 'https://api.telegram.org', // Será montado dinamicamente
  youtube: 'https://www.googleapis.com/youtube/v3/channels',
  json2video: 'https://api.json2video.com/v2/account'
}

// Função auxiliar para testar uma API específica
async function checkService(service: string, key: string, extra?: any) {
  const start = Date.now();
  let response;
  let data;
  
  try {
    switch (service) {
      case 'gemini':
        response = await fetch(`${ENDPOINTS.gemini}?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'Ping' }] }] })
        });
        break;

      case 'openai':
        response = await fetch(ENDPOINTS.openai, {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        break;

      case 'elevenlabs':
        response = await fetch(ENDPOINTS.elevenlabs, {
          headers: { 'xi-api-key': key }
        });
        break;

      case 'pexels':
        response = await fetch(ENDPOINTS.pexels, {
          headers: { 'Authorization': key }
        });
        break;

      case 'stability':
        response = await fetch(ENDPOINTS.stability, {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        break;
      
      case 'json2video':
         response = await fetch(ENDPOINTS.json2video, {
          headers: { 'x-api-key': key }
        });
        break;

      case 'pixabay':
        response = await fetch(`${ENDPOINTS.pixabay}&key=${key}`);
        break;

      case 'telegram':
        // Telegram precisa do token na URL: api.telegram.org/bot<TOKEN>/getMe
        response = await fetch(`${ENDPOINTS.telegram}/bot${key}/getMe`);
        break;

      case 'youtube':
        const channelPart = extra?.channelId ? `&id=${extra.channelId}` : '&id=UCuAXFkgsw1L7xaCfnd5JJOw'; // ID de teste
        response = await fetch(`${ENDPOINTS.youtube}?part=snippet${channelPart}&key=${key}`);
        break;

      default:
        throw new Error(`Serviço desconhecido: ${service}`);
    }

    const duration = Date.now() - start;
    data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error?.message || data.description || data.detail || `HTTP ${response.status}`;
      return { 
        success: false, 
        duration, 
        message: `Erro: ${errorMsg}`, 
        code: response.status 
      };
    }

    // Validações extras de conteúdo
    if (service === 'youtube' && extra?.channelId && data.items?.length === 0) {
      return { success: false, duration, message: 'Chave válida, mas Canal não encontrado (Verifique o ID)', code: 404 };
    }

    return { success: true, duration, message: 'Conexão estavel', code: 200 };

  } catch (error: any) {
    return { success: false, duration: Date.now() - start, message: error.message, code: 0 };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // MODO 1: Testar uma chave específica enviada pelo Frontend (Correção Manual)
  if (req.method === 'POST') {
    const { service, key, extra } = req.body;
    if (!service || !key) return res.status(400).json({ error: 'Service e Key são obrigatórios' });
    
    const result = await checkService(service, key, extra);
    return res.json(result);
  }

  // MODO 2: Testar tudo que está no ENV (Diagnóstico Inicial)
  const results: any = {};
  
  // 1. Banco de Dados
  try {
    const dbStart = Date.now();
    await sql`SELECT 1`;
    results.database = { success: true, duration: Date.now() - dbStart, message: 'Conectado ao NeonDB' };
  } catch (e: any) {
    results.database = { success: false, message: e.message };
  }

  // 2. APIs Externas
  const apisToCheck = [
    { id: 'gemini', env: 'GEMINI_API_KEY' },
    { id: 'openai', env: 'OPENAI_API_KEY' },
    { id: 'youtube', env: 'YOUTUBE_API_KEY', extra: { channelId: process.env.CHANNEL_ID || process.env.YOUTUBE_CHANNEL_ID } },
    { id: 'elevenlabs', env: 'ELEVENLABS_API_KEY' },
    { id: 'pexels', env: 'PEXELS_API_KEY' },
    { id: 'pixabay', env: 'PIXABAY_API_KEY' },
    { id: 'stability', env: 'STABILITY_API_KEY' },
    { id: 'telegram', env: 'TELEGRAM_BOT_TOKEN' },
    { id: 'json2video', env: 'JSON2VIDEO_API_KEY' }
  ];

  for (const api of apisToCheck) {
    const key = process.env[api.env];
    if (!key) {
      results[api.id] = { success: false, message: 'Variável de ambiente não configurada', missingEnv: true };
    } else {
      results[api.id] = await checkService(api.id, key, api.extra);
    }
  }

  return res.json({ timestamp: new Date().toISOString(), results });
}
