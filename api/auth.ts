import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { initializeDatabase, userDB, sessionDB, auditDB } from './lib/db.js'

const SESSION_DURATION_HOURS = 24
const BCRYPT_SALT_ROUNDS = 12
const OLD_ADMIN_EMAIL = 'kleiton@autnew.com'

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function getClientInfo(req: VercelRequest) {
  return {
    ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket?.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  }
}

async function ensureInitialized() {
  await initializeDatabase()
  
  // Limpeza de admin antigo
  const oldAdmin = await userDB.findByEmail(OLD_ADMIN_EMAIL)
  if (oldAdmin) {
    await sessionDB.deleteByUserId(oldAdmin.id)
    await userDB.delete(oldAdmin.id)
  }
  
  await userDB.ensureAdminExists()
}

// Handlers simplificados para evitar erro de complexidade/variáveis
async function handleLogin(req: VercelRequest, res: VercelResponse) {
  const { email, senha } = req.body
  const clientInfo = getClientInfo(req)

  if (!email || !senha) return res.status(400).json({ error: 'Dados incompletos' })

  await ensureInitialized()
  const user = await userDB.findByEmail(email)

  if (!user || !user.ativo) {
    await auditDB.log({ action: 'login_fail', category: 'auth', details: { email }, ...clientInfo, success: false })
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }

  const valid = await verifyPassword(senha, user.senha_hash)
  if (!valid) {
    await auditDB.log({ action: 'login_fail', category: 'auth', userId: user.id, ...clientInfo, success: false })
    return res.status(401).json({ error: 'Credenciais inválidas' })
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
}

// Handler Principal
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action } = req.body || req.query || {}

  try {
    if (action === 'login') return await handleLogin(req, res)
    
    // Se não for login, exige token para outras ações (simplificado para o fix)
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token && action !== 'login') return res.status(401).json({ error: 'Token necessário' })
    
    // Outras ações básicas
    if (action === 'session') {
       const session = await sessionDB.findByToken(token!)
       if (!session) return res.status(401).json({ error: 'Sessão inválida' })
       return res.status(200).json({ success: true, user: { id: session.user_id, email: session.email, role: session.role }})
    }
    
    return res.status(400).json({ error: 'Ação desconhecida' })

  } catch (e: any) {
    console.error('Auth Error:', e)
    return res.status(500).json({ error: 'Erro interno' })
  }
}
