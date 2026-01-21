import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { initializeDatabase, userDB, sessionDB, auditDB } from './lib/db.js'

const SESSION_DURATION_HOURS = 720 // 30 dias
const ADMIN_EMAIL = 'admin@autnew.com'

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function getClientInfo(req: VercelRequest) {
  return {
    ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  }
}

async function ensureInitialized() {
  await initializeDatabase()
  await userDB.ensureAdminExists()
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  const { email, senha } = req.body
  const clientInfo = getClientInfo(req)

  // Login Especial para "Google/Github" (Bypass Seguro do Admin)
  const isSocialBypass = email === 'admin@autnew.com' && senha === process.env.Social_Bypass_Secret;

  if (!email || !senha) return res.status(400).json({ error: 'Dados incompletos' })

  try {
    await ensureInitialized()
    
    const user = await userDB.findByEmail(email)
    
    if (!user || !user.ativo) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    // Se não for bypass social, verifica senha normal
    if (!isSocialBypass) {
        const valid = await verifyPassword(senha, user.senha_hash)
        if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const token = generateToken()
    const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)

    await sessionDB.create({ userId: user.id, token, expiresAt, ...clientInfo })
    await userDB.update(user.id, { ultimoLogin: new Date() })

    return res.status(200).json({
      success: true,
      user: { id: user.id, email: user.email, nome: user.nome, role: user.role, primeiroAcesso: user.primeiro_acesso },
      token,
      expiresAt
    })
  } catch (e: any) {
    console.error('Auth Error:', e)
    return res.status(500).json({ error: 'Erro interno' })
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action } = req.body || req.query || {}

  if (action === 'login') return await handleLogin(req, res)
  
  if (action === 'session') {
      const token = req.headers.authorization?.replace('Bearer ', '')
      if(!token) return res.status(401).json({error: 'No token'})
      await initializeDatabase()
      const session = await sessionDB.findByToken(token)
      if (!session) return res.status(401).json({ error: 'Invalid session' })
      return res.status(200).json({ success: true, user: { id: session.user_id, email: session.email, role: session.role }})
  }
  
  return res.status(400).json({ error: 'Action invalid' })
}
