import type { NextApiRequest, NextApiResponse } from 'next';
import { YouTube, OpenAI, Telegram } from './core/clients';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const topic = req.body?.topic || 'Plano Estratégico AUTNEW';

    const channel = await YouTube.channel();
    const plan = await OpenAI.plan(topic);

    await Telegram.send(`PLAN RUN OK\n${topic}`);

    return res.status(200).json({
      success: true,
      mode: 'REAL_APIS',
      channel: {
        title: channel.snippet.title,
        stats: channel.statistics
      },
      plan
    });

  } catch (e: any) {
    console.error('[AUTNEW CORE ERROR]', e.message);
    return res.status(500).json({
      success: false,
      error: e.message
    });
  }
}
