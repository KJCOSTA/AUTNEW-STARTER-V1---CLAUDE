import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (_req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'development',
  }

  // Check environment variables (without exposing values)
  const envCheck = {
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    POSTGRES_URL_FORMAT: process.env.POSTGRES_URL
      ? (process.env.POSTGRES_URL.startsWith('postgres://') || process.env.POSTGRES_URL.startsWith('postgresql://'))
      : false,
    POSTGRES_HOST: !!process.env.POSTGRES_HOST,
    POSTGRES_USER: !!process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: !!process.env.POSTGRES_PASSWORD,
    POSTGRES_DATABASE: !!process.env.POSTGRES_DATABASE,
  }
  diagnostics.envVars = envCheck

  // Check if minimum required vars are present
  const hasConnectionString = envCheck.POSTGRES_URL && envCheck.POSTGRES_URL_FORMAT
  const hasIndividualVars = envCheck.POSTGRES_HOST && envCheck.POSTGRES_USER &&
                           envCheck.POSTGRES_PASSWORD && envCheck.POSTGRES_DATABASE

  if (!hasConnectionString && !hasIndividualVars) {
    return res.status(500).json({
      status: 'error',
      code: 'MISSING_DATABASE_CONFIG',
      message: 'Variáveis de ambiente do banco de dados não configuradas',
      diagnostics,
      fix: {
        steps: [
          '1. Acesse o Dashboard do Vercel',
          '2. Vá em Settings > Storage',
          '3. Crie um novo Postgres database (ou conecte o Neon existente)',
          '4. As variáveis serão adicionadas automaticamente',
          '5. Faça um novo deploy para aplicar'
        ],
        manual: 'Ou adicione POSTGRES_URL manualmente em Settings > Environment Variables'
      }
    })
  }

  // Test database connection
  try {
    const startTime = Date.now()

    // Simple connection test
    const result = await sql`SELECT 1 as connection_test, NOW() as server_time`
    const connectionTime = Date.now() - startTime

    diagnostics.connectionTest = {
      success: true,
      responseTimeMs: connectionTime,
      serverTime: result.rows[0]?.server_time
    }

    // Check if tables exist
    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `
    const existingTables = tablesResult.rows.map(r => r.table_name)
    const requiredTables = ['users', 'sessions', 'audit_logs', 'health_check_logs']
    const missingTables = requiredTables.filter(t => !existingTables.includes(t))

    diagnostics.tables = {
      existing: existingTables,
      required: requiredTables,
      missing: missingTables,
      allPresent: missingTables.length === 0
    }

    // Check record counts
    if (missingTables.length === 0) {
      const [usersCount, sessionsCount, logsCount] = await Promise.all([
        sql`SELECT COUNT(*) as count FROM users`,
        sql`SELECT COUNT(*) as count FROM sessions WHERE expires_at > NOW()`,
        sql`SELECT COUNT(*) as count FROM audit_logs`
      ])

      diagnostics.records = {
        users: parseInt(usersCount.rows[0].count),
        activeSessions: parseInt(sessionsCount.rows[0].count),
        auditLogs: parseInt(logsCount.rows[0].count)
      }
    }

    return res.status(200).json({
      status: 'healthy',
      message: 'Banco de dados conectado e funcionando',
      diagnostics
    })

  } catch (error: any) {
    diagnostics.error = {
      message: error.message,
      code: error.code,
      hint: error.hint
    }

    // Parse specific error types
    let errorType = 'UNKNOWN_ERROR'
    let userMessage = 'Erro desconhecido na conexão'
    let fixSteps: string[] = []

    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ETIMEDOUT')) {
      errorType = 'CONNECTION_REFUSED'
      userMessage = 'Não foi possível conectar ao servidor do banco de dados'
      fixSteps = [
        'Verifique se o banco de dados está online',
        'Verifique se o host está correto no POSTGRES_URL',
        'Verifique se há regras de firewall bloqueando a conexão'
      ]
    } else if (error.message?.includes('password authentication failed') || error.code === '28P01') {
      errorType = 'AUTH_FAILED'
      userMessage = 'Falha na autenticação do banco de dados'
      fixSteps = [
        'Verifique se o usuário e senha estão corretos no POSTGRES_URL',
        'Regenere as credenciais no painel do Neon/Vercel',
        'Atualize a variável POSTGRES_URL com as novas credenciais'
      ]
    } else if (error.message?.includes('database') && error.message?.includes('does not exist')) {
      errorType = 'DATABASE_NOT_FOUND'
      userMessage = 'Banco de dados não encontrado'
      fixSteps = [
        'Verifique se o nome do banco está correto',
        'Crie o banco de dados no painel do Neon/Vercel'
      ]
    } else if (error.message?.includes('SSL') || error.message?.includes('ssl')) {
      errorType = 'SSL_ERROR'
      userMessage = 'Erro de conexão SSL'
      fixSteps = [
        'Adicione ?sslmode=require ao final da POSTGRES_URL',
        'Exemplo: postgres://user:pass@host:5432/db?sslmode=require'
      ]
    } else if (error.code === 'ENOTFOUND') {
      errorType = 'HOST_NOT_FOUND'
      userMessage = 'Host do banco de dados não encontrado'
      fixSteps = [
        'Verifique se o host está correto no POSTGRES_URL',
        'O formato deve ser: postgres://user:pass@HOST:5432/database'
      ]
    }

    return res.status(500).json({
      status: 'error',
      code: errorType,
      message: userMessage,
      diagnostics,
      fix: {
        steps: fixSteps.length > 0 ? fixSteps : [
          'Verifique as variáveis de ambiente no Vercel',
          'Teste a conexão no painel do Neon',
          'Faça um novo deploy após corrigir'
        ]
      }
    })
  }
}
