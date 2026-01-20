import type { VercelRequest, VercelResponse } from '@vercel/node'

interface APIHealthResult {
  name: string
  envVar: string
  configured: boolean
  connected: boolean
  error?: string
  errorType?: 'missing_key' | 'invalid_key' | 'network_error' | 'quota_exceeded' | 'unknown'
  documentation?: string
  fixSteps?: string[]
}

interface HealthCheckResponse {
  success: boolean
  results: APIHealthResult[]
  criticalFailures: string[]
  summary: {
    total: number
    configured: number
    connected: number
    failed: number
  }
}

// API configurations
const API_CONFIGS = [
  {
    name: 'Google Gemini',
    envVar: 'GEMINI_API_KEY',
    critical: true,
    testEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models?key=',
    documentation: 'https://ai.google.dev/tutorials/setup',
  },
  {
    name: 'OpenAI',
    envVar: 'OPENAI_API_KEY',
    critical: false,
    testEndpoint: 'https://api.openai.com/v1/models',
    documentation: 'https://platform.openai.com/api-keys',
  },
  {
    name: 'Anthropic (Claude)',
    envVar: 'ANTHROPIC_API_KEY',
    critical: false,
    testEndpoint: 'https://api.anthropic.com/v1/messages',
    documentation: 'https://console.anthropic.com/settings/keys',
  },
  {
    name: 'ElevenLabs',
    envVar: 'ELEVENLABS_API_KEY',
    critical: false,
    testEndpoint: 'https://api.elevenlabs.io/v1/user',
    documentation: 'https://elevenlabs.io/app/settings/api-keys',
  },
  {
    name: 'JSON2Video',
    envVar: 'JSON2VIDEO_API_KEY',
    critical: false,
    testEndpoint: 'https://api.json2video.com/v2/account',
    documentation: 'https://json2video.com/dashboard/api-keys',
  },
  {
    name: 'Groq',
    envVar: 'GROQ_API_KEY',
    critical: false,
    testEndpoint: 'https://api.groq.com/openai/v1/models',
    documentation: 'https://console.groq.com/keys',
  },
  {
    name: 'Pexels',
    envVar: 'PEXELS_API_KEY',
    critical: false,
    testEndpoint: 'https://api.pexels.com/v1/search?query=test&per_page=1',
    documentation: 'https://www.pexels.com/api/new/',
  },
  {
    name: 'Pixabay',
    envVar: 'PIXABAY_API_KEY',
    critical: false,
    testEndpoint: 'https://pixabay.com/api/?q=test&per_page=3&key=',
    documentation: 'https://pixabay.com/api/docs/',
  },
  {
    name: 'Stability AI',
    envVar: 'STABILITY_API_KEY',
    critical: false,
    testEndpoint: 'https://api.stability.ai/v1/user/account',
    documentation: 'https://platform.stability.ai/account/keys',
  },
]

// Test individual API
async function testAPI(config: typeof API_CONFIGS[0]): Promise<APIHealthResult> {
  const apiKey = process.env[config.envVar]

  const result: APIHealthResult = {
    name: config.name,
    envVar: config.envVar,
    configured: !!apiKey,
    connected: false,
    documentation: config.documentation,
  }

  if (!apiKey) {
    result.error = `Variável de ambiente ${config.envVar} não configurada no Vercel`
    result.errorType = 'missing_key'
    result.fixSteps = [
      `1. Acesse o Dashboard do Vercel`,
      `2. Vá em Settings > Environment Variables`,
      `3. Adicione a variável: ${config.envVar}`,
      `4. Cole sua API Key do ${config.name}`,
      `5. Faça redeploy do projeto`,
      `Obtenha sua key em: ${config.documentation}`,
    ]
    return result
  }

  try {
    let response: Response
    const headers: Record<string, string> = {}

    // Configure headers based on API
    switch (config.envVar) {
      case 'GEMINI_API_KEY':
        response = await fetch(`${config.testEndpoint}${apiKey}`, {
          method: 'GET',
        })
        break

      case 'OPENAI_API_KEY':
        headers['Authorization'] = `Bearer ${apiKey}`
        response = await fetch(config.testEndpoint, { headers })
        break

      case 'ANTHROPIC_API_KEY':
        headers['x-api-key'] = apiKey
        headers['anthropic-version'] = '2023-06-01'
        headers['content-type'] = 'application/json'
        response = await fetch(config.testEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        })
        break

      case 'ELEVENLABS_API_KEY':
        headers['xi-api-key'] = apiKey
        response = await fetch(config.testEndpoint, { headers })
        break

      case 'JSON2VIDEO_API_KEY':
        headers['x-api-key'] = apiKey
        response = await fetch(config.testEndpoint, { headers })
        break

      case 'GROQ_API_KEY':
        headers['Authorization'] = `Bearer ${apiKey}`
        response = await fetch(config.testEndpoint, { headers })
        break

      case 'PEXELS_API_KEY':
        headers['Authorization'] = apiKey
        response = await fetch(config.testEndpoint, { headers })
        break

      case 'PIXABAY_API_KEY':
        response = await fetch(`${config.testEndpoint}${apiKey}`)
        break

      case 'STABILITY_API_KEY':
        headers['Authorization'] = `Bearer ${apiKey}`
        response = await fetch(config.testEndpoint, { headers })
        break

      default:
        response = await fetch(config.testEndpoint)
    }

    if (response.ok || response.status === 200) {
      result.connected = true
    } else {
      const errorText = await response.text().catch(() => '')

      if (response.status === 401 || response.status === 403) {
        result.error = `API Key inválida ou expirada (HTTP ${response.status})`
        result.errorType = 'invalid_key'
        result.fixSteps = [
          `1. Verifique se a API Key está correta`,
          `2. Gere uma nova key em: ${config.documentation}`,
          `3. Atualize a variável ${config.envVar} no Vercel`,
          `4. Faça redeploy do projeto`,
        ]
      } else if (response.status === 429) {
        result.error = `Cota excedida ou rate limit (HTTP ${response.status})`
        result.errorType = 'quota_exceeded'
        result.fixSteps = [
          `1. Verifique sua cota em: ${config.documentation}`,
          `2. Aguarde o reset do rate limit`,
          `3. Considere fazer upgrade do plano`,
        ]
      } else {
        result.error = `Erro HTTP ${response.status}: ${errorText.slice(0, 100)}`
        result.errorType = 'unknown'
        result.fixSteps = [
          `1. Verifique a documentação: ${config.documentation}`,
          `2. Teste a API Key manualmente`,
          `3. Verifique se o serviço está operacional`,
        ]
      }
    }
  } catch (error) {
    result.error = `Erro de conexão: ${error instanceof Error ? error.message : 'Desconhecido'}`
    result.errorType = 'network_error'
    result.fixSteps = [
      `1. Verifique sua conexão com a internet`,
      `2. O serviço ${config.name} pode estar fora do ar`,
      `3. Tente novamente em alguns minutos`,
    ]
  }

  return result
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Run all tests in parallel
    const results = await Promise.all(API_CONFIGS.map(testAPI))

    // Identify critical failures
    const criticalFailures = results
      .filter((r) => {
        const config = API_CONFIGS.find((c) => c.envVar === r.envVar)
        return config?.critical && !r.connected
      })
      .map((r) => r.name)

    // Calculate summary
    const summary = {
      total: results.length,
      configured: results.filter((r) => r.configured).length,
      connected: results.filter((r) => r.connected).length,
      failed: results.filter((r) => r.configured && !r.connected).length,
    }

    const response: HealthCheckResponse = {
      success: criticalFailures.length === 0,
      results,
      criticalFailures,
      summary,
    }

    return res.status(200).json(response)
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao executar health check',
      details: error instanceof Error ? error.message : 'Desconhecido',
    })
  }
}
