import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * AUTNEW – CORE API
 * Runtime: Vercel Serverless (Node.js)
 */

const ENV = {
  OPENAI_API_KEY: ['OPENAI_API_KEY'],
  YOUTUBE_API_KEY: ['YOUTUBE_API_KEY', 'YOUTUBEDATA_API_KEY'],
  CHANNEL_ID: ['CHANNEL_ID', 'YOUTUBE_CHANNEL_ID'],
};

function getEnv(name: keyof typeof ENV): string {
  for (const key of ENV[name]) {
    const value = process.env[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return ''; // Retorna vazio se não achar, para tratar depois
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { topic = 'Plano Estratégico AUTNEW' } = req.body || {};
    
    // Validar chaves
    const ytKey = getEnv('YOUTUBE_API_KEY');
    const channelId = getEnv('CHANNEL_ID');
    const openAiKey = getEnv('OPENAI_API_KEY');

    if (!ytKey || !channelId) throw new Error('Configuração do YouTube ausente');
    if (!openAiKey) throw new Error('Configuração da OpenAI ausente');

    // 1. Fetch YouTube Data
    const ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${ytKey}`
    );
    
    if (!ytRes.ok) throw new Error(`YouTube API error: ${ytRes.status}`);
    const ytData = await ytRes.json();
    const channelItem = ytData.items?.[0];

    // 2. Generate Plan
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é o AUTNEW. Gere planos estratégicos reais.' },
          { role: 'user', content: topic },
        ],
      }),
    });

    if (!aiRes.ok) throw new Error(`OpenAI API error: ${aiRes.status}`);
    const aiData = await aiRes.json();
    const planText = aiData.choices?.[0]?.message?.content || '';

    return res.status(200).json({
      success: true,
      source: 'REAL_APIS',
      channel: channelItem ? {
        title: channelItem.snippet.title,
        statistics: channelItem.statistics,
      } : null,
      plan: planText,
    });

  } catch (err: any) {
    console.error('[PLAN-RUN ERROR]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
