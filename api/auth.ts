import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sql } from '@vercel/postgres'

const SESSION_DURATION_HOURS = 720 // 30 dias
const ADMIN_EMAIL = 'admin@autnew.com'

// Garante que tabelas existam (Auto-Healing)
async function ensureTablesExist() {
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

async function getAdminUser() {
  // Tenta achar admin
  const result = await sql`SELECT * FROM users WHERE email = ${ADMIN_EMAIL} LIMIT 1`
  if (result.rows.length > 0) return result.rows[0]
  
  // Se não existir, CRIA
  const hash = await bcrypt.hash('admin123', 10)
  const newAdmin = await sql`
    INSERT INTO users (email, nome, senha_hash, role, ativo, primeiro_acesso)
    VALUES (${ADMIN_EMAIL}, 'Admin', ${hash}, 'admin', true, false)
    RETURNING *
  `
  return newAdmin.rows[0]
}

async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)
  
  // FIX: Converte data para String ISO para corrigir erro TS2345
  const expiresIso = expiresAt.toISOString()

  await sql`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresIso})
  `
  return { token, expiresAt }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Headers CORS para permitir acesso do Frontend
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const body = req.body || {}
  const action = body.action || req.query.action

  try {
    // === LOGIN ===
    if (action === 'login') {
      await ensureTablesExist()

      // 1. Lógica do Google/GitHub (Bypass de Senha)
      if (body.provider === 'google' || body.provider === 'github') {
        console.log('[AUTH] Provider Login:', body.provider)
        const admin = await getAdminUser()
        const session = await createSession(admin.id)
        return res.status(200).json({ success: true, token: session.token, user: admin })
      }

      // 2. Lógica de Senha (Normal)
      const email = body.email
      const password = body.password || body.senha

      if (!email || !password) return res.status(400).json({ error: 'Dados incompletos' })

      const users = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`
      if (users.rows.length === 0) return res.status(401).json({ error: 'Usuário não encontrado' })
      
      const user = users.rows[0]
      const valid = await bcrypt.compare(password, user.senha_hash)
      if (!valid) return res.status(401).json({ error: 'Senha incorreta' })

      const session = await createSession(user.id)
      return res.status(200).json({ success: true, token: session.token, user })
    }

    // === VERIFICAR SESSÃO ===
    if (action === 'session') {
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (!token) return res.status(401).json({ error: 'No token' })

      const result = await sql`
        SELECT s.*, u.email, u.role, u.nome 
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ${token} AND s.expires_at > NOW()
        LIMIT 1
      `
      
      if (result.rows.length === 0) return res.status(401).json({ error: 'Sessão inválida ou expirada' })
      return res.status(200).json({ success: true, user: result.rows[0] })
    }

    return res.status(400).json({ error: 'Ação inválida' })

  } catch (e: any) {
    console.error('Fatal Auth Error:', e)
    return res.status(500).json({ error: e.message })
  }
}
