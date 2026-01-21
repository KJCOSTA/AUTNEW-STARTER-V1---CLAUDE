cat > api/plan-run.ts << 'EOF'
/**
 * AUTNEW – CORE API
 * Runtime: Vercel Serverless (Node.js)
 * Frontend: Vite
 */

type EnvAliases = Record<string, string[]>;

const ENV: EnvAliases = {
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
  throw new Error(
    `Missing environment variable: ${name} (aliases: ${ENV[name].join(', ')})`
  );
}

async function fetchYouTubeChannel() {
  const apiKey = getEnv('YOUTUBE_API_KEY');
  const channelId = getEnv('CHANNEL_ID');

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`
  );

  if (!res.ok) {
    throw new Error(`YouTube API error: ${res.status}`);
  }

  const data = await res.json();

  if (!data.items || !data.items[0]) {
    throw new Error('YouTube API returned no channel data');
  }

  return data.items[0];
}

async function generatePlan(topic: string) {
  const apiKey = getEnv('OPENAI_API_KEY');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Você é o AUTNEW. Gere planos estratégicos reais e executáveis.',
        },
        {
          role: 'user',
          content: topic,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const topic =
      typeof body.topic === 'string'
        ? body.topic
        : 'Plano Estratégico AUTNEW';

    const channel = await fetchYouTubeChannel();
    const plan = await generatePlan(topic);

    return new Response(
      JSON.stringify({
        success: true,
        source: 'REAL_APIS',
        channel: {
          title: channel.snippet.title,
          statistics: channel.statistics,
        },
        plan,
      }),
      { status: 200 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error';

    console.error('[PLAN-RUN ERROR]', message);

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500 }
    );
  }
}
EOF
