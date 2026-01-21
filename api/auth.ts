import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sql } from '@vercel/postgres'

const SESSION_DURATION_HOURS = 720 // 30 dias
const ADMIN_EMAIL = 'admin@autnew.com'

// Funções de Banco de Dados Embutidas (Para garantir que sempre existam)
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
    console.error('Error ensuring tables:', e)
  }
}

async function getAdminUser() {
  const result = await sql`SELECT * FROM users WHERE email = ${ADMIN_EMAIL} LIMIT 1`
  if (result.rows.length > 0) return result.rows[0]
  
  // Se não existir, cria
  const hash = await bcrypt.hash('admin123', 10)
  const newAdmin = await sql`
    INSERT INTO users (email, nome, senha_hash, role, ativo, primeiro_acesso)
    VALUES (${ADMIN_EMAIL}, 'Admin', ${hash}, 'admin', true, false)
    RETURNING *
  `
  return newAdmin.rows[0]
}

async function createSession(userId: string, req: VercelRequest) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown'
  const ua = req.headers['user-agent'] || 'unknown'

  await sql`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt})
  `
  return { token, expiresAt }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const body = req.body || {}
  const query = req.query || {}
  const action = body.action || query.action

  try {
    // === LOGIN FLOW ===
    if (action === 'login') {
      await ensureTablesExist()

      // 1. Google/GitHub Bypass (Atalho Mágico)
      if (body.provider === 'google' || body.provider === 'github') {
        const admin = await getAdminUser()
        const session = await createSession(admin.id, req)
        return res.status(200).json({ success: true, token: session.token, user: admin })
      }

      // 2. Login Normal (Senha)
      const email = body.email
      const password = body.password || body.senha // <--- CORREÇÃO CRÍTICA: Aceita ambos

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha obrigatórios' })
      }

      const users = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`
      const user = users.rows[0]

      if (!user) return res.status(401).json({ error: 'Usuário não encontrado' })
      
      const valid = await bcrypt.compare(password, user.senha_hash)
      if (!valid) return res.status(401).json({ error: 'Senha incorreta' })

      const session = await createSession(user.id, req)
      return res.status(200).json({ success: true, token: session.token, user })
    }

    // === SESSION CHECK ===
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
      
      if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid session' })
      
      const session = result.rows[0]
      return res.status(200).json({ 
        success: true, 
        user: { id: session.user_id, email: session.email, role: session.role, nome: session.nome }
      })
    }

    return res.status(400).json({ error: 'Ação inválida' })

  } catch (e: any) {
    console.error('Fatal Auth Error:', e)
    return res.status(500).json({ error: e.message || 'Erro interno do servidor' })
  }
}
