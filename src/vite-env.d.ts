/// <reference types="vite/client" />

interface ImportMetaEnv {
  // APIs de Inteligência Artificial
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_ANTHROPIC_API_KEY: string
  readonly VITE_GROQ_API_KEY: string

  // APIs Gratuitas de Mídia (Motor Híbrido)
  readonly VITE_PEXELS_API_KEY: string
  readonly VITE_PIXABAY_API_KEY: string
  readonly VITE_UNSPLASH_ACCESS_KEY: string

  // APIs de Áudio
  readonly VITE_ELEVENLABS_API_KEY: string

  // API de Renderização de Vídeo
  readonly VITE_JSON2VIDEO_API_KEY: string

  // YouTube OAuth
  readonly VITE_YOUTUBE_CLIENT_ID: string
  readonly VITE_YOUTUBE_CLIENT_SECRET: string

  // Telegram (Notificações)
  readonly VITE_TELEGRAM_BOT_TOKEN: string
  readonly VITE_TELEGRAM_CHAT_ID: string

  // Outras APIs opcionais
  readonly VITE_STABILITYAI_API_KEY: string
  readonly VITE_REPLICATE_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
