import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { initializeDatabase, userDB, sessionDB, auditDB } from './lib/db.js'

const SESSION_DURATION_HOURS = 720
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
  const { email, senha, provider } = req.body
  const clientInfo = getClientInfo(req)

  await ensureInitialized()
  
  // BYPASS: Se vier login social (Google/Github) simulado pelo frontend, loga o admin direto
  if (provider === 'google' || provider === 'github') {
     console.log('[AUTH] Fast Login bypass triggered for:', provider)
     // Pega o usuário admin
     let user = await userDB.findByEmail(ADMIN_EMAIL)
     
     // Se por milagre o admin não existir, cria um na hora
     if (!user) {
        await userDB.ensureAdminExists()
        user = await userDB.findByEmail(ADMIN_EMAIL)
     }

     if (!user) return res.status(500).json({ error: 'Erro crítico: Admin não encontrado' })

     const token = generateToken()
     const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)
     await sessionDB.create({ userId: user.id, token, expiresAt, ...clientInfo })
     await userDB.update(user.id, { ultimoLogin: new Date() })

     return res.status(200).json({
        success: true,
        user: { id: user.id, email: user.email, nome: user.nome, role: user.role, primeiroAcesso: false },
        token,
        expiresAt
     })
  }

  // LOGIN NORMAL (Senha)
  if (!email || !senha) return res.status(400).json({ error: 'Dados incompletos' })
  const user = await userDB.findByEmail(email)
  
  if (!user || !user.ativo) return res.status(401).json({ error: 'Credenciais inválidas' })

  const valid = await verifyPassword(senha, user.senha_hash)
  if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' })

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
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action } = req.body || req.query || {}

  try {
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
  } catch (e: any) {
    console.error('API Error:', e)
    return res.status(500).json({ error: 'Internal Error' })
  }
}
