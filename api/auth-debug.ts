import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { sql } from '@vercel/postgres'

// This endpoint tests what happens when you try to login
// SECURITY: Only available in non-production environments
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  // Block in production
  if (process.env.VERCEL_ENV === 'production') {
    return res.status(403).json({
      error: 'Este endpoint está desabilitado em produção',
      hint: 'Use /api/db-health para diagnóstico em produção'
    })
  }

  const email = 'kleiton@autnew.com'
  const senha = 'jangada'

  const debug: Record<string, any> = {
    timestamp: new Date().toISOString(),
    testingLogin: { email, senha },
    steps: []
  }

  try {
    // Step 1: Check database connection
    debug.steps.push({ step: 1, action: 'db_connection' })
    await sql`SELECT 1`
    debug.steps.push({ step: 1, status: 'ok' })

    // Step 2: Find user
    debug.steps.push({ step: 2, action: 'find_user' })
    const userResult = await sql`SELECT * FROM users WHERE email = ${email}`

    if (userResult.rows.length === 0) {
      debug.steps.push({ step: 2, status: 'user_not_found' })
      debug.error = 'Usuário não encontrado no banco de dados'
      return res.status(200).json(debug)
    }

    const user = userResult.rows[0]
    debug.steps.push({
      step: 2,
      status: 'user_found',
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        ativo: user.ativo,
        hashLength: user.senha_hash?.length
      }
    })

    // Step 3: Verify password
    debug.steps.push({ step: 3, action: 'verify_password' })
    const passwordValid = await bcrypt.compare(senha, user.senha_hash)
    debug.steps.push({ step: 3, status: passwordValid ? 'password_match' : 'password_mismatch' })

    if (!passwordValid) {
      // Reset password
      debug.steps.push({ step: 4, action: 'resetting_password' })
      const newHash = await bcrypt.hash(senha, 12)
      await sql`UPDATE users SET senha_hash = ${newHash} WHERE id = ${user.id}`
      debug.steps.push({ step: 4, status: 'password_reset_complete' })
    }

    // Step 4: Test creating a session (simulating login)
    debug.steps.push({ step: 5, action: 'test_session_creation' })
    const testToken = 'test_' + Date.now()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await sql`
      INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
      VALUES (${user.id}, ${testToken}, ${expiresAt}, ${'test'}, ${'debug'})
    `
    debug.steps.push({ step: 5, status: 'session_created' })

    // Clean up test session
    await sql`DELETE FROM sessions WHERE token = ${testToken}`
    debug.steps.push({ step: 6, action: 'cleanup', status: 'ok' })

    debug.success = true
    debug.message = 'Todos os testes passaram! O login deveria funcionar.'

    return res.status(200).json(debug)

  } catch (error: any) {
    debug.success = false
    debug.error = {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    }
    return res.status(200).json(debug)
  }
}
