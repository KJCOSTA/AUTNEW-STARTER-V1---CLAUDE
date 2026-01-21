import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sql } from '@vercel/postgres'

const SESSION_DURATION_HOURS = 720 // 30 dias
const ADMIN_EMAIL = 'admin@autnew.com'

// Garante que a estrutura do banco existe
async function ensureInfrastructure() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        nome VARCHAR(255) NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        ativo BOOLEAN DEFAULT true,
        primeiro_acesso BOOLEAN DEFAULT false,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ultimo_login TIMESTAMP WITH TIME ZONE
      );
    `
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  } catch (e) {
    console.error('DB Init Error:', e)
  }
}

async function createSession(userId: string) {
  try {
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)
    const expiresIso = expiresAt.toISOString() // Formato seguro para Postgres

    await sql`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresIso})
    `
    return { token, expiresAt }
  } catch (error: any) {
    console.error('Failed to create session:', error)
    throw new Error(`Session creation failed: ${error.message || 'Database error'}`)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const body = req.body || {}
  const action = body.action || req.query.action

  try {
    // === LOGIN (SOMENTE SENHA) ===
    if (action === 'login') {
      await ensureInfrastructure()

      const email = body.email
      const password = body.password || body.senha

      if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' })

      // Busca usuário
      let result
      try {
        result = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`
      } catch (error: any) {
        console.error('Database query failed during user lookup:', error)
        return res.status(500).json({ error: 'Database error during authentication' })
      }

      // AUTO-HEALING: Se for o admin tentando entrar e não existir, cria ele agora.
      if (result.rows.length === 0 && email === ADMIN_EMAIL) {
         console.log('Admin not found, creating...')
         try {
           const hash = await bcrypt.hash('admin123', 10)
           result = await sql`
             INSERT INTO users (email, nome, senha_hash, role, ativo, primeiro_acesso)
             VALUES (${ADMIN_EMAIL}, 'Admin', ${hash}, 'admin', true, false)
             RETURNING *
           `
         } catch (error: any) {
           console.error('Failed to create admin user:', error)
           return res.status(500).json({ error: 'Failed to auto-create admin account' })
         }
      }

      if (result.rows.length === 0) return res.status(401).json({ error: 'Usuário não encontrado' })

      const user = result.rows[0]

      try {
        const valid = await bcrypt.compare(password, user.senha_hash)

        if (!valid) return res.status(401).json({ error: 'Senha incorreta' })
      } catch (error: any) {
        console.error('Password comparison failed:', error)
        return res.status(500).json({ error: 'Authentication verification failed' })
      }

      try {
        const session = await createSession(user.id)
        return res.status(200).json({ success: true, token: session.token, user })
      } catch (error: any) {
        console.error('Session creation failed:', error)
        return res.status(500).json({ error: 'Failed to create user session' })
      }
    }

    // === CHECAR SESSÃO ===
    if (action === 'session') {
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (!token) return res.status(401).json({ error: 'No token' })

      try {
        const result = await sql`
          SELECT s.*, u.email, u.role, u.nome
          FROM sessions s
          JOIN users u ON s.user_id = u.id
          WHERE s.token = ${token} AND s.expires_at > NOW()
          LIMIT 1
        `

        if (result.rows.length === 0) return res.status(401).json({ error: 'Sessão inválida' })
        return res.status(200).json({ success: true, user: result.rows[0] })
      } catch (error: any) {
        console.error('Session validation failed:', error)
        return res.status(500).json({ error: 'Failed to validate session' })
      }
    }

    return res.status(400).json({ error: 'Ação inválida' })

  } catch (e: any) {
    console.error('Auth Error:', e)
    return res.status(500).json({ error: e.message })
  }
}
