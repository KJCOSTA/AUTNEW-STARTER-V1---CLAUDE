import type { VercelRequest, VercelResponse } from '@vercel/node'

/* SMART PLAN RUNNER 
  Prioridade das Chaves:
  1. Chave enviada no Body (Modo Manual/Smart)
  2. Variável de Ambiente (Modo Automático)
*/

const ENV_MAP = {
  openai: ['OPENAI_API_KEY'],
  youtube: ['YOUTUBE_API_KEY', 'YOUTUBEDATA_API_KEY'],
  channel: ['CHANNEL_ID', 'YOUTUBE_CHANNEL_ID']
};

function getKey(name: keyof typeof ENV_MAP, bodyKeys?: any): string {
  // 1. Tenta do body (Smart Mode)
  if (bodyKeys && bodyKeys[name]) return bodyKeys[name];
  
  // 2. Tenta do Env
  for (const k of ENV_MAP[name]) {
    if (process.env[k]) return process.env[k]!;
  }
  return '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { topic = 'Estratégia AUTNEW', smartKeys } = req.body;
    
    // Recupera chaves (Do body ou do Env)
    const ytKey = getKey('youtube', smartKeys);
    const channelId = getKey('channel', smartKeys);
    const openAiKey = getKey('openai', smartKeys);

    // Validação Granular (Para o front saber qual pedir)
    const missing = [];
    if (!ytKey) missing.push('youtube');
    if (!channelId) missing.push('channel');
    if (!openAiKey) missing.push('openai');

    if (missing.length > 0) {
      return res.status(400).json({ 
        error: 'MISSING_KEYS', 
        missing, 
        message: 'Chaves de API necessárias não encontradas.' 
      });
    }

    // 1. YouTube Data Fetch
    let channelData = null;
    try {
        const ytRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${ytKey}`
        );
        if (ytRes.ok) {
            const data = await ytRes.json();
            channelData = data.items?.[0] || null;
        } else {
            console.warn('[SMART RUN] YouTube Warning:', await ytRes.text());
        }
    } catch (e) {
        console.warn('[SMART RUN] YouTube Error:', e);
    }

    // 2. OpenAI Generation
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um estrategista de conteúdo expert.' },
          { role: 'user', content: `Crie um plano de vídeo detalhado sobre: "${topic}". Inclua Título, Hook, Roteiro e CTA.` },
        ],
      }),
    });

    if (!aiRes.ok) {
        const errText = await aiRes.text();
        return res.status(500).json({ error: 'OPENAI_ERROR', details: errText });
    }

    const aiData = await aiRes.json();
    const plan = aiData.choices?.[0]?.message?.content || 'Sem conteúdo gerado.';

    return res.status(200).json({
      success: true,
      mode: smartKeys ? 'SMART_MANUAL' : 'AUTOMATIC',
      channel: channelData,
      plan
    });

  } catch (err: any) {
    console.error('[SMART RUN FATAL]', err);
    return res.status(500).json({ error: err.message });
  }
}
