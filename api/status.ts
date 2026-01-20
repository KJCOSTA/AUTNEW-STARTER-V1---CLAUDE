import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * API Status endpoint - Verifica quais APIs estão configuradas no servidor
 * Isso permite que o frontend saiba quais APIs estão prontas para uso
 * sem precisar configurar manualmente no localStorage
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check which API keys are configured (without exposing the actual keys)
  const apiStatus = {
    gemini: {
      configured: !!process.env.GEMINI_API_KEY,
      envVar: 'GEMINI_API_KEY',
    },
    openai: {
      configured: !!process.env.OPENAI_API_KEY,
      envVar: 'OPENAI_API_KEY',
    },
    anthropic: {
      configured: !!process.env.ANTHROPIC_API_KEY,
      envVar: 'ANTHROPIC_API_KEY',
    },
    elevenlabs: {
      configured: !!process.env.ELEVENLABS_API_KEY,
      envVar: 'ELEVENLABS_API_KEY',
    },
    json2video: {
      configured: !!process.env.JSON2VIDEO_API_KEY,
      envVar: 'JSON2VIDEO_API_KEY',
    },
    groq: {
      configured: !!process.env.GROQ_API_KEY,
      envVar: 'GROQ_API_KEY',
    },
    // Stock Media APIs
    pexels: {
      configured: !!process.env.PEXELS_API_KEY,
      envVar: 'PEXELS_API_KEY',
    },
    pixabay: {
      configured: !!process.env.PIXABAY_API_KEY,
      envVar: 'PIXABAY_API_KEY',
    },
    unsplash: {
      configured: !!process.env.UNSPLASH_ACCESS_KEY,
      envVar: 'UNSPLASH_ACCESS_KEY',
    },
    // YouTube (uses OAuth, so check for client ID)
    youtube: {
      configured: !!process.env.YOUTUBE_CLIENT_ID,
      envVar: 'YOUTUBE_CLIENT_ID',
    },
  }

  // Count configured APIs
  const configuredCount = Object.values(apiStatus).filter(api => api.configured).length
  const totalApis = Object.keys(apiStatus).length

  // Generate missing APIs list
  const missingApis = Object.entries(apiStatus)
    .filter(([, status]) => !status.configured)
    .map(([name, status]) => ({ name, envVar: status.envVar }))

  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    summary: {
      configured: configuredCount,
      total: totalApis,
      percentage: Math.round((configuredCount / totalApis) * 100),
    },
    apis: apiStatus,
    missingApis,
    message: configuredCount === totalApis
      ? 'Todas as APIs estão configuradas!'
      : `${configuredCount}/${totalApis} APIs configuradas. Configure as restantes no Vercel Environment Variables.`,
  })
}
