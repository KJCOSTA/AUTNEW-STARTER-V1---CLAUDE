/**
 * ENV CANÔNICO AUTNEW
 * - Centraliza
 * - Normaliza
 * - Falha explícita
 */

const ENV_ALIASES: Record<string, string[]> = {
  OPENAI_API_KEY: ['OPENAI_API_KEY'],
  YOUTUBE_API_KEY: ['YOUTUBE_API_KEY', 'YOUTUBEDATA_API_KEY'],
  CHANNEL_ID: ['CHANNEL_ID', 'YOUTUBE_CHANNEL_ID']
};

export function getEnv(name: keyof typeof ENV_ALIASES): string {
  for (const key of ENV_ALIASES[name]) {
    const value = process.env[key];
    if (value) return value;
  }
  throw new Error(`Missing required env: ${name} (aliases: ${ENV_ALIASES[name].join(', ')})`);
}
