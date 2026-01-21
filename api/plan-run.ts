import type { NextApiRequest, NextApiResponse } from 'next';
import { getEnv } from './_env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const topic = req.body?.topic || 'Plano Estratégico AUTNEW';

    // 🔐 ENV (FAIL FAST)
    const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');
    const YOUTUBE_API_KEY = getEnv('YOUTUBE_API_KEY');
    const CHANNEL_ID = getEnv('CHANNEL_ID');

    // 📊 YOUTUBE — REAL
    const ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`
    );
    if (!ytRes.ok) throw new Error(`YouTube API failed: ${ytRes.status}`);
    const yt = await ytRes.json();
    if (!yt.items?.[0]) throw new Error('YouTube API returned no channel');

    // 🧠 OPENAI — REAL
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é o AUTNEW, gerador de planos estratégicos executáveis.' },
          { role: 'user', content: `Gere um plano REAL, acionável e estruturado para: ${topic}` }
        ]
      })
    });
    if (!aiRes.ok) throw new Error(`OpenAI API failed: ${aiRes.status}`);
    const ai = await aiRes.json();

    return res.status(200).json({
      success: true,
      mode: 'REAL_APIS',
      channel: {
        title: yt.items[0].snippet.title,
        stats: yt.items[0].statistics
      },
      plan: ai.choices?.[0]?.message?.content
    });

  } catch (err: any) {
    console.error('[PLAN RUN ERROR]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message,
      hint: 'Alguma ENV não está disponível no runtime da Vercel'
    });
  }
}
