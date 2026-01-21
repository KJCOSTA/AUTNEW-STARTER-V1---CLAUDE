import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    checks: {}
  }

  // Check 1: POSTGRES_URL exists
  const hasPostgresUrl = !!process.env.POSTGRES_URL
  const hasPostgresUrlNonPooling = !!process.env.POSTGRES_URL_NON_POOLING

  diagnostics.checks.env_vars = {
    POSTGRES_URL: hasPostgresUrl ? 'SET' : 'NOT SET',
    POSTGRES_URL_NON_POOLING: hasPostgresUrlNonPooling ? 'SET' : 'NOT SET',
    status: hasPostgresUrl ? 'ok' : 'error',
    message: hasPostgresUrl
      ? 'POSTGRES_URL está configurado'
      : 'POSTGRES_URL NÃO está configurado no Vercel'
  }

  if (!hasPostgresUrl) {
    console.error('[AUTH-DEBUG] POSTGRES_URL não está definido')
    return res.status(500).json({
      ...diagnostics,
      overall_status: 'error',
      error: 'POSTGRES_URL não está configurado. Configure nas variáveis de ambiente do Vercel.'
    })
  }

  // Check 2: Database connection
  try {
    const connectionTest = await sql`SELECT 1 as connected, NOW() as server_time`
    diagnostics.checks.connection = {
      status: 'ok',
      connected: true,
      server_time: connectionTest.rows[0]?.server_time,
      message: 'Conexão com o banco de dados OK'
    }
    console.log('[AUTH-DEBUG] Conexão com banco OK')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[AUTH-DEBUG] Erro de conexão:', errorMessage)
    diagnostics.checks.connection = {
      status: 'error',
      connected: false,
      error: errorMessage,
      message: 'Falha na conexão com o banco de dados'
    }
    return res.status(503).json({
      ...diagnostics,
      overall_status: 'error',
      error: 'Falha na conexão com o banco de dados',
      details: errorMessage
    })
  }

  // Check 3: Users table exists
  try {
    const usersCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      ) as exists
    `
    const usersExists = usersCheck.rows[0]?.exists === true

    if (usersExists) {
      // Get user count
      const userCount = await sql`SELECT COUNT(*) as count FROM users`
      // Get admin user
      const adminCheck = await sql`SELECT id, email, role, ativo FROM users WHERE email = 'admin@autnew.com'`

      diagnostics.checks.users_table = {
        status: 'ok',
        exists: true,
        user_count: parseInt(userCount.rows[0]?.count || '0'),
        admin_exists: adminCheck.rows.length > 0,
        admin_info: adminCheck.rows[0] ? {
          id: adminCheck.rows[0].id,
          email: adminCheck.rows[0].email,
          role: adminCheck.rows[0].role,
          ativo: adminCheck.rows[0].ativo
        } : null,
        message: 'Tabela users existe'
      }
      console.log('[AUTH-DEBUG] Tabela users OK, count:', userCount.rows[0]?.count)
    } else {
      diagnostics.checks.users_table = {
        status: 'warning',
        exists: false,
        message: 'Tabela users NÃO existe - será criada no primeiro login'
      }
      console.log('[AUTH-DEBUG] Tabela users não existe')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[AUTH-DEBUG] Erro ao verificar tabela users:', errorMessage)
    diagnostics.checks.users_table = {
      status: 'error',
      error: errorMessage,
      message: 'Erro ao verificar tabela users'
    }
  }

  // Check 4: Sessions table exists
  try {
    const sessionsCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'sessions'
      ) as exists
    `
    const sessionsExists = sessionsCheck.rows[0]?.exists === true

    if (sessionsExists) {
      // Get active session count
      const sessionCount = await sql`SELECT COUNT(*) as count FROM sessions WHERE expires_at > NOW()`

      diagnostics.checks.sessions_table = {
        status: 'ok',
        exists: true,
        active_sessions: parseInt(sessionCount.rows[0]?.count || '0'),
        message: 'Tabela sessions existe'
      }
      console.log('[AUTH-DEBUG] Tabela sessions OK, active:', sessionCount.rows[0]?.count)
    } else {
      diagnostics.checks.sessions_table = {
        status: 'warning',
        exists: false,
        message: 'Tabela sessions NÃO existe - será criada no primeiro login'
      }
      console.log('[AUTH-DEBUG] Tabela sessions não existe')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[AUTH-DEBUG] Erro ao verificar tabela sessions:', errorMessage)
    diagnostics.checks.sessions_table = {
      status: 'error',
      error: errorMessage,
      message: 'Erro ao verificar tabela sessions'
    }
  }

  // Check 5: Audit logs table exists
  try {
    const auditCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
      ) as exists
    `
    diagnostics.checks.audit_logs_table = {
      status: 'ok',
      exists: auditCheck.rows[0]?.exists === true,
      message: auditCheck.rows[0]?.exists ? 'Tabela audit_logs existe' : 'Tabela audit_logs NÃO existe'
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    diagnostics.checks.audit_logs_table = {
      status: 'error',
      error: errorMessage
    }
  }

  // Check 6: Test bcrypt is working
  try {
    const bcrypt = await import('bcryptjs')
    const testHash = await bcrypt.hash('test', 12)
    const testVerify = await bcrypt.compare('test', testHash)

    diagnostics.checks.bcrypt = {
      status: testVerify ? 'ok' : 'error',
      hash_works: true,
      verify_works: testVerify,
      message: testVerify ? 'bcryptjs funcionando corretamente' : 'Erro na verificação do bcrypt'
    }
    console.log('[AUTH-DEBUG] bcrypt OK')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[AUTH-DEBUG] Erro no bcrypt:', errorMessage)
    diagnostics.checks.bcrypt = {
      status: 'error',
      error: errorMessage,
      message: 'Erro ao testar bcrypt'
    }
  }

  // Determine overall status
  const allChecks = Object.values(diagnostics.checks)
  const hasErrors = allChecks.some((c: any) => c.status === 'error')
  const hasWarnings = allChecks.some((c: any) => c.status === 'warning')

  diagnostics.overall_status = hasErrors ? 'error' : (hasWarnings ? 'warning' : 'ok')
  diagnostics.message = hasErrors
    ? 'Há erros que precisam ser corrigidos'
    : (hasWarnings
        ? 'Sistema funcional, mas tabelas precisam ser inicializadas (faça login para criar)'
        : 'Todos os sistemas funcionando corretamente')

  console.log('[AUTH-DEBUG] Diagnóstico completo:', diagnostics.overall_status)

  return res.status(200).json(diagnostics)
}
