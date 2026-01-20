import type { VercelRequest, VercelResponse } from '@vercel/node'
import { healthCheckDB, sessionDB, auditDB } from './lib/db'

interface APIHealthResult {
  name: string
  envVar: string
  configured: boolean
  connected: boolean
  testType: 'real_call' | 'endpoint_check'
  responseTime?: number
  error?: string
  errorCode?: string
  errorType?: 'missing_key' | 'invalid_key' | 'permission_denied' | 'model_not_found' | 'quota_exceeded' | 'rate_limited' | 'network_error' | 'timeout' | 'unknown'
  technicalDetails?: string
  documentation?: string
  fixSteps?: string[]
  critical: boolean
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
  timestamp: string
}

// API configurations with detailed test parameters
const API_CONFIGS = [
  {
    name: 'Google Gemini',
    envVar: 'GEMINI_API_KEY',
    critical: true,
    documentation: 'https://aistudio.google.com/app/apikey',
    testConfig: {
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      method: 'POST' as const,
      headers: (key: string) => ({
        'Content-Type': 'application/json',
      }),
      body: {
        contents: [{ parts: [{ text: 'Say "ok"' }] }],
        generationConfig: { maxOutputTokens: 5 }
      },
      urlKeyParam: true, // adds ?key=API_KEY to URL
    },
  },
  {
    name: 'OpenAI',
    envVar: 'OPENAI_API_KEY',
    critical: false,
    documentation: 'https://platform.openai.com/api-keys',
    testConfig: {
      endpoint: 'https://api.openai.com/v1/chat/completions',
      method: 'POST' as const,
      headers: (key: string) => ({
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      }),
      body: {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say ok' }],
        max_tokens: 5,
      },
    },
  },
  {
    name: 'Anthropic (Claude)',
    envVar: 'ANTHROPIC_API_KEY',
    critical: false,
    documentation: 'https://console.anthropic.com/settings/keys',
    testConfig: {
      endpoint: 'https://api.anthropic.com/v1/messages',
      method: 'POST' as const,
      headers: (key: string) => ({
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      }),
      body: {
        model: 'claude-3-haiku-20240307',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Say ok' }],
      },
    },
  },
  {
    name: 'ElevenLabs',
    envVar: 'ELEVENLABS_API_KEY',
    critical: false,
    documentation: 'https://elevenlabs.io/app/settings/api-keys',
    testConfig: {
      endpoint: 'https://api.elevenlabs.io/v1/user/subscription',
      method: 'GET' as const,
      headers: (key: string) => ({
        'xi-api-key': key,
      }),
    },
  },
  {
    name: 'JSON2Video',
    envVar: 'JSON2VIDEO_API_KEY',
    critical: false,
    documentation: 'https://json2video.com/dashboard/api-keys',
    testConfig: {
      endpoint: 'https://api.json2video.com/v2/movies',
      method: 'GET' as const,
      headers: (key: string) => ({
        'x-api-key': key,
      }),
    },
  },
  {
    name: 'Groq',
    envVar: 'GROQ_API_KEY',
    critical: false,
    documentation: 'https://console.groq.com/keys',
    testConfig: {
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      method: 'POST' as const,
      headers: (key: string) => ({
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      }),
      body: {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Say ok' }],
        max_tokens: 5,
      },
    },
  },
  {
    name: 'Pexels',
    envVar: 'PEXELS_API_KEY',
    critical: false,
    documentation: 'https://www.pexels.com/api/new/',
    testConfig: {
      endpoint: 'https://api.pexels.com/v1/search?query=test&per_page=1',
      method: 'GET' as const,
      headers: (key: string) => ({
        'Authorization': key,
      }),
    },
  },
  {
    name: 'Pixabay',
    envVar: 'PIXABAY_API_KEY',
    critical: false,
    documentation: 'https://pixabay.com/api/docs/',
    testConfig: {
      endpoint: 'https://pixabay.com/api/',
      method: 'GET' as const,
      urlParams: (key: string) => `?key=${key}&q=test&per_page=3`,
    },
  },
  {
    name: 'Stability AI',
    envVar: 'STABILITY_API_KEY',
    critical: false,
    documentation: 'https://platform.stability.ai/account/keys',
    testConfig: {
      endpoint: 'https://api.stability.ai/v1/user/account',
      method: 'GET' as const,
      headers: (key: string) => ({
        'Authorization': `Bearer ${key}`,
      }),
    },
  },
]

// Parse error responses to get detailed information
function parseErrorResponse(status: number, responseText: string, apiName: string): {
  errorType: APIHealthResult['errorType']
  error: string
  technicalDetails: string
  fixSteps: string[]
} {
  let parsedError: any = null
  try {
    parsedError = JSON.parse(responseText)
  } catch {
    // Response is not JSON
  }

  const baseResult = {
    errorType: 'unknown' as APIHealthResult['errorType'],
    error: '',
    technicalDetails: '',
    fixSteps: [] as string[],
  }

  // Handle by status code first
  if (status === 401 || status === 403) {
    baseResult.errorType = 'invalid_key'
    baseResult.error = `API Key inválida ou sem permissão`
    baseResult.technicalDetails = `HTTP ${status}: ${responseText.slice(0, 200)}`
    baseResult.fixSteps = [
      `Acesse o console do ${apiName} e verifique se a key está ativa`,
      'Gere uma nova API Key se necessário',
      'Verifique se a key tem as permissões necessárias',
      'Atualize a variável de ambiente no Vercel',
      'Faça um novo deploy do projeto',
    ]
    return baseResult
  }

  if (status === 429) {
    baseResult.errorType = 'rate_limited'
    baseResult.error = `Rate limit excedido ou cota esgotada`
    baseResult.technicalDetails = `HTTP ${status}: Too Many Requests`
    baseResult.fixSteps = [
      'Aguarde alguns minutos antes de tentar novamente',
      `Verifique sua cota no console do ${apiName}`,
      'Considere fazer upgrade do seu plano',
    ]
    return baseResult
  }

  if (status === 404) {
    // Parse specific error messages
    if (parsedError?.error?.message?.includes('not found') || parsedError?.error?.message?.includes('not supported')) {
      baseResult.errorType = 'model_not_found'
      baseResult.error = `Modelo não encontrado ou não suportado`
      baseResult.technicalDetails = parsedError?.error?.message || responseText.slice(0, 200)
      baseResult.fixSteps = [
        'Verifique se você tem acesso ao modelo especificado',
        `Acesse o console do ${apiName} e verifique os modelos disponíveis`,
        'Alguns modelos requerem aprovação prévia',
      ]
      return baseResult
    }
  }

  // Parse Gemini-specific errors
  if (apiName === 'Google Gemini' && parsedError?.error) {
    const geminiError = parsedError.error
    if (geminiError.code === 400 || geminiError.status === 'INVALID_ARGUMENT') {
      if (geminiError.message?.includes('API key')) {
        baseResult.errorType = 'invalid_key'
        baseResult.error = 'API Key do Gemini inválida'
        baseResult.technicalDetails = geminiError.message
        baseResult.fixSteps = [
          'Acesse https://aistudio.google.com/app/apikey',
          'Gere uma nova API Key',
          'Certifique-se de copiar a key completa',
          'Atualize GEMINI_API_KEY no Vercel',
          'Faça redeploy',
        ]
        return baseResult
      }
      if (geminiError.message?.includes('not found') || geminiError.message?.includes('not supported')) {
        baseResult.errorType = 'model_not_found'
        baseResult.error = 'Modelo Gemini não encontrado ou sem permissão'
        baseResult.technicalDetails = geminiError.message
        baseResult.fixSteps = [
          'Acesse https://aistudio.google.com/app/apikey',
          'Verifique se sua conta tem acesso ao Gemini 1.5 Flash',
          'Pode ser necessário aceitar os termos de serviço',
          'Tente gerar uma nova key após aceitar os termos',
        ]
        return baseResult
      }
    }
    if (geminiError.code === 403 || geminiError.status === 'PERMISSION_DENIED') {
      baseResult.errorType = 'permission_denied'
      baseResult.error = 'Sem permissão para usar a API Gemini'
      baseResult.technicalDetails = geminiError.message
      baseResult.fixSteps = [
        'Acesse https://aistudio.google.com/app/apikey',
        'Verifique se a API está habilitada no seu projeto Google Cloud',
        'Aceite os termos de serviço do Gemini',
        'Gere uma nova key após habilitar a API',
      ]
      return baseResult
    }
  }

  // Parse OpenAI-specific errors
  if (apiName === 'OpenAI' && parsedError?.error) {
    const openaiError = parsedError.error
    if (openaiError.type === 'invalid_api_key' || openaiError.code === 'invalid_api_key') {
      baseResult.errorType = 'invalid_key'
      baseResult.error = 'API Key da OpenAI inválida'
      baseResult.technicalDetails = openaiError.message
      baseResult.fixSteps = [
        'Acesse https://platform.openai.com/api-keys',
        'Gere uma nova API Key',
        'Keys antigas podem ter sido rotacionadas',
        'Atualize OPENAI_API_KEY no Vercel',
      ]
      return baseResult
    }
    if (openaiError.type === 'insufficient_quota') {
      baseResult.errorType = 'quota_exceeded'
      baseResult.error = 'Cota da OpenAI esgotada'
      baseResult.technicalDetails = openaiError.message
      baseResult.fixSteps = [
        'Acesse https://platform.openai.com/account/billing',
        'Adicione créditos à sua conta',
        'Verifique seu limite de uso mensal',
      ]
      return baseResult
    }
  }

  // Parse Anthropic-specific errors
  if (apiName === 'Anthropic (Claude)' && parsedError?.error) {
    const claudeError = parsedError.error
    if (claudeError.type === 'authentication_error') {
      baseResult.errorType = 'invalid_key'
      baseResult.error = 'API Key da Anthropic inválida'
      baseResult.technicalDetails = claudeError.message
      baseResult.fixSteps = [
        'Acesse https://console.anthropic.com/settings/keys',
        'Gere uma nova API Key',
        'Atualize ANTHROPIC_API_KEY no Vercel',
      ]
      return baseResult
    }
  }

  // Parse ElevenLabs-specific errors
  if (apiName === 'ElevenLabs') {
    if (status === 401) {
      baseResult.errorType = 'invalid_key'
      baseResult.error = 'API Key da ElevenLabs inválida'
      baseResult.technicalDetails = responseText.slice(0, 200)
      baseResult.fixSteps = [
        'Acesse https://elevenlabs.io/app/settings/api-keys',
        'Copie sua API Key novamente',
        'Atualize ELEVENLABS_API_KEY no Vercel',
      ]
      return baseResult
    }
  }

  // Generic error
  baseResult.error = `Erro HTTP ${status}`
  baseResult.technicalDetails = responseText.slice(0, 300)
  baseResult.fixSteps = [
    `Verifique a documentação do ${apiName}`,
    'Teste a API Key manualmente',
    'Verifique se o serviço está operacional',
  ]

  return baseResult
}

// Test individual API with real call
async function testAPI(config: typeof API_CONFIGS[0]): Promise<APIHealthResult> {
  const apiKey = process.env[config.envVar]
  const startTime = Date.now()

  const result: APIHealthResult = {
    name: config.name,
    envVar: config.envVar,
    configured: !!apiKey,
    connected: false,
    testType: 'real_call',
    documentation: config.documentation,
    critical: config.critical,
  }

  if (!apiKey) {
    result.error = `Variável ${config.envVar} não encontrada no Vercel`
    result.errorType = 'missing_key'
    result.technicalDetails = 'Environment variable not set'
    result.fixSteps = [
      'Acesse o Dashboard do Vercel do seu projeto',
      'Vá em Settings > Environment Variables',
      `Adicione a variável: ${config.envVar}`,
      `Obtenha sua API Key em: ${config.documentation}`,
      'Cole a key e salve',
      'Faça um novo deploy (Deployments > Redeploy)',
    ]
    return result
  }

  try {
    const testConfig = config.testConfig
    let url = testConfig.endpoint

    // Add URL parameters if needed
    if (testConfig.urlKeyParam) {
      url += `?key=${apiKey}`
    }
    if (testConfig.urlParams) {
      url += testConfig.urlParams(apiKey)
    }

    const headers = testConfig.headers ? testConfig.headers(apiKey) : {}
    const fetchOptions: RequestInit = {
      method: testConfig.method,
      headers,
    }

    if (testConfig.body && testConfig.method === 'POST') {
      fetchOptions.body = JSON.stringify(testConfig.body)
    }

    // Add timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    fetchOptions.signal = controller.signal

    const response = await fetch(url, fetchOptions)
    clearTimeout(timeoutId)

    result.responseTime = Date.now() - startTime

    if (response.ok) {
      result.connected = true
      result.testType = 'real_call'
    } else {
      const responseText = await response.text().catch(() => '')
      const errorInfo = parseErrorResponse(response.status, responseText, config.name)

      result.error = errorInfo.error
      result.errorType = errorInfo.errorType
      result.technicalDetails = errorInfo.technicalDetails
      result.fixSteps = [
        ...errorInfo.fixSteps,
        `Link: ${config.documentation}`,
      ]
      result.errorCode = `HTTP_${response.status}`
    }
  } catch (error) {
    result.responseTime = Date.now() - startTime

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        result.error = 'Timeout: API não respondeu em 15 segundos'
        result.errorType = 'timeout'
        result.technicalDetails = 'Request aborted after 15000ms'
        result.fixSteps = [
          'O serviço pode estar lento ou fora do ar',
          'Tente novamente em alguns minutos',
          `Verifique o status do ${config.name}`,
        ]
      } else if (error.message.includes('fetch')) {
        result.error = 'Erro de rede ao conectar com a API'
        result.errorType = 'network_error'
        result.technicalDetails = error.message
        result.fixSteps = [
          'Verifique sua conexão com a internet',
          `O serviço ${config.name} pode estar fora do ar`,
          'Tente novamente em alguns minutos',
        ]
      } else {
        result.error = `Erro: ${error.message}`
        result.errorType = 'unknown'
        result.technicalDetails = error.stack || error.message
        result.fixSteps = [
          `Verifique a documentação: ${config.documentation}`,
          'Teste a API Key manualmente',
        ]
      }
    }
  }

  return result
}

// Get user ID from token if available
async function getUserIdFromToken(req: VercelRequest): Promise<string | undefined> {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return undefined

  try {
    const session = await sessionDB.findByToken(token)
    return session?.user_id
  } catch {
    return undefined
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { streaming } = req.query
  const userId = await getUserIdFromToken(req)

  try {
    // For streaming responses (Server-Sent Events)
    if (streaming === 'true') {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      for (const config of API_CONFIGS) {
        const result = await testAPI(config)
        res.write(`data: ${JSON.stringify({ type: 'result', data: result })}\n\n`)
      }

      // Calculate summary
      const allResults = await Promise.all(API_CONFIGS.map(testAPI))
      const criticalFailures = allResults
        .filter((r) => r.critical && !r.connected)
        .map((r) => r.name)

      const summary = {
        total: allResults.length,
        configured: allResults.filter((r) => r.configured).length,
        connected: allResults.filter((r) => r.connected).length,
        failed: allResults.filter((r) => r.configured && !r.connected).length,
      }

      // Log to database
      try {
        await healthCheckDB.log({
          userId,
          results: allResults,
          summary,
          criticalFailures,
          success: criticalFailures.length === 0
        })

        await auditDB.log({
          userId,
          action: 'health_check_executed',
          category: 'health_check',
          details: { summary, criticalFailures },
          success: criticalFailures.length === 0
        })
      } catch (logError) {
        console.error('Failed to log health check:', logError)
      }

      res.write(`data: ${JSON.stringify({
        type: 'complete',
        data: {
          success: criticalFailures.length === 0,
          summary,
          criticalFailures,
          timestamp: new Date().toISOString()
        }
      })}\n\n`)

      return res.end()
    }

    // Regular JSON response - run all tests in parallel
    const results = await Promise.all(API_CONFIGS.map(testAPI))

    // Identify critical failures
    const criticalFailures = results
      .filter((r) => r.critical && !r.connected)
      .map((r) => r.name)

    // Calculate summary
    const summary = {
      total: results.length,
      configured: results.filter((r) => r.configured).length,
      connected: results.filter((r) => r.connected).length,
      failed: results.filter((r) => r.configured && !r.connected).length,
    }

    // Log to database
    try {
      await healthCheckDB.log({
        userId,
        results,
        summary,
        criticalFailures,
        success: criticalFailures.length === 0
      })

      await auditDB.log({
        userId,
        action: 'health_check_executed',
        category: 'health_check',
        details: { summary, criticalFailures },
        success: criticalFailures.length === 0
      })
    } catch (logError) {
      console.error('Failed to log health check:', logError)
    }

    const response: HealthCheckResponse = {
      success: criticalFailures.length === 0,
      results,
      criticalFailures,
      summary,
      timestamp: new Date().toISOString(),
    }

    return res.status(200).json(response)
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao executar health check',
      details: error instanceof Error ? error.message : 'Desconhecido',
      timestamp: new Date().toISOString(),
    })
  }
}
