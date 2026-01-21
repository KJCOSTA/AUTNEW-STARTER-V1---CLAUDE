import { env } from './env';

export const YouTube = {
  async channel() {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${env('CHANNEL_ID')}&key=${env('YOUTUBE_API_KEY')}`
    );
    if (!res.ok) throw new Error('YouTube API failed');
    const j = await res.json();
    if (!j.items?.[0]) throw new Error('YouTube returned no data');
    return j.items[0];
  }
};

export const OpenAI = {
  async plan(topic: string) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é o AUTNEW. Gere planos reais, executáveis.' },
          { role: 'user', content: topic }
        ]
      })
    });
    if (!res.ok) throw new Error('OpenAI API failed');
    const j = await res.json();
    return j.choices?.[0]?.message?.content;
  }
};

export const Media = {
  pixabay: (q: string) =>
    fetch(`https://pixabay.com/api/?key=${env('PIXABAY_API_KEY')}&q=${q}`).then(r => r.json()),
  unsplash: (q: string) =>
    fetch(`https://api.unsplash.com/search/photos?query=${q}&client_id=${env('UNSPLASH_ACCESS_KEY')}`).then(r => r.json()),
  pexels: (q: string) =>
    fetch(`https://api.pexels.com/v1/search?query=${q}`, {
      headers: { Authorization: env('PEXELS_API_KEY') }
    }).then(r => r.json())
};

export const Telegram = {
  async send(text: string) {
    await fetch(`https://api.telegram.org/bot${env('TELEGRAM_BOT_TOKEN')}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env('TELEGRAM_CHAT_ID'),
        text
      })
    });
  }
};
