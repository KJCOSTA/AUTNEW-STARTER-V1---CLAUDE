import type { NextApiRequest, NextApiResponse } from 'next';
import { requireEnv } from './_env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const topic = req.body?.topic || 'Plano Emergencial AUTNEW';

    // ENV VALIDATION (FAIL FAST)
    const openaiKey = requireEnv('OPENAI_API_KEY');
    const youtubeKey = requireEnv('YOUTUBE_API_KEY');
    const channelId = requireEnv('CHANNEL_ID');

    // YOUTUBE REAL CALL
    const ytRes = await fetch(
      \`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=\${channelId}&key=\${youtubeKey}\`
    );
    if (!ytRes.ok) throw new Error('YouTube API failed');
    const ytData = await ytRes.json();

    // OPENAI REAL CALL (MINIMAL, SEM FRESCURA)
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${openaiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é o AUTNEW, gerador de planos estratégicos executáveis.' },
          { role: 'user', content: \`Gere um plano de execução real para: \${topic}\` }
        ]
      })
    });
    if (!aiRes.ok) throw new Error('OpenAI API failed');
    const aiData = await aiRes.json();

    return res.status(200).json({
      success: true,
      source: 'REAL_APIS',
      youtube: ytData.items?.[0]?.statistics,
      plan: aiData.choices?.[0]?.message?.content
    });

  } catch (err: any) {
    console.error('[PLAN RUN ERROR]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message,
      hint: 'Alguma ENV não está sendo injetada corretamente no runtime'
    });
  }
}
