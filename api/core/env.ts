/**
 * ENV CORE AUTNEW
 * - Normaliza
 * - Valida
 * - Elimina fallback fantasma
 */

type EnvMap = Record<string, string[]>;

const ENV: EnvMap = {
  OPENAI_API_KEY: ['OPENAI_API_KEY'],
  YOUTUBE_API_KEY: ['YOUTUBE_API_KEY', 'YOUTUBEDATA_API_KEY'],
  CHANNEL_ID: ['CHANNEL_ID', 'YOUTUBE_CHANNEL_ID'],
  PIXABAY_API_KEY: ['PIXABAY_API_KEY'],
  UNSPLASH_ACCESS_KEY: ['UNSPLASH_ACCESS_KEY'],
  PEXELS_API_KEY: ['PEXELS_API_KEY'],
  STABILITY_API_KEY: ['stability_api_key', 'STABILITY_API_KEY'],
  TELEGRAM_BOT_TOKEN: ['TELEGRAM_BOT_TOKEN'],
  TELEGRAM_CHAT_ID: ['TELEGRAM_CHAT_ID']
};

export function env(name: keyof typeof ENV): string {
  for (const key of ENV[name]) {
    const v = process.env[key];
    if (v) return v;
  }
  throw new Error(`ENV MISSING: ${name} (aliases: ${ENV[name].join(', ')})`);
}
