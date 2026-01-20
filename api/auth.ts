import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

// ============================================
// TIPOS
// ============================================

interface User {
  id: string
  email: string
  nome: string
  role: 'admin' | 'editor' | 'viewer'
  ativo: boolean
  criadoEm: string
  ultimoLogin?: string
  primeiroAcesso: boolean
  senhaHash: string
}

interface Session {
  token: string
  userId: string
  expiresAt: string
}

// ============================================
// ARMAZENAMENTO EM MEMÓRIA (para demo/dev)
// Em produção, usar banco de dados real
// ============================================

// Usuários armazenados (simulando banco de dados)
// O admin inicial é criado com senha "territorio"
const ADMIN_INITIAL_PASSWORD = 'territorio'

// Hash simples para senha (em produção usar bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + process.env.AUTH_SECRET || 'autnew-secret-key').digest('hex')
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

// Gerar token de sessão
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Armazenamento global em memória (reseta quando serverless function reinicia)
// Em produção, usar Redis/KV ou banco de dados
declare global {
  // eslint-disable-next-line no-var
  var __users: Map<string, User> | undefined
  // eslint-disable-next-line no-var
  var __sessions: Map<string, Session> | undefined
}

function getUsers(): Map<string, User> {
  if (!global.__users) {
    global.__users = new Map()
    // Criar admin inicial
    const adminId = 'admin-001'
    global.__users.set(adminId, {
      id: adminId,
      email: 'admin@autnew.com',
      nome: 'Administrador',
      role: 'admin',
      ativo: true,
      criadoEm: new Date().toISOString(),
      primeiroAcesso: true,
      senhaHash: hashPassword(ADMIN_INITIAL_PASSWORD),
    })
  }
  return global.__users
}

function getSessions(): Map<string, Session> {
  if (!global.__sessions) {
    global.__sessions = new Map()
  }
  return global.__sessions
}

// ============================================
// HANDLERS
// ============================================

// Login
async function handleLogin(req: VercelRequest, res: VercelResponse) {
  const { email, senha } = req.body

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' })
  }

  const users = getUsers()
  const user = Array.from(users.values()).find((u) => u.email === email)

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }

  if (!user.ativo) {
    return res.status(403).json({ error: 'Usuário desativado. Contate o administrador.' })
  }

  if (!verifyPassword(senha, user.senhaHash)) {
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }

  // Atualizar último login
  user.ultimoLogin = new Date().toISOString()
  users.set(user.id, user)

  // Criar sessão
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas

  const sessions = getSessions()
  sessions.set(token, {
    token,
    userId: user.id,
    expiresAt,
  })

  // Retornar usuário sem a senha
  const { senhaHash, ...userWithoutPassword } = user

  return res.status(200).json({
    success: true,
    user: userWithoutPassword,
    token,
    expiresAt,
  })
}

// Logout
async function handleLogout(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (token) {
    const sessions = getSessions()
    sessions.delete(token)
  }

  return res.status(200).json({ success: true })
}

// Verificar sessão
async function handleSession(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  const sessions = getSessions()
  const session = sessions.get(token)

  if (!session) {
    return res.status(401).json({ error: 'Sessão inválida' })
  }

  if (new Date(session.expiresAt) < new Date()) {
    sessions.delete(token)
    return res.status(401).json({ error: 'Sessão expirada' })
  }

  const users = getUsers()
  const user = users.get(session.userId)

  if (!user || !user.ativo) {
    sessions.delete(token)
    return res.status(401).json({ error: 'Usuário não encontrado ou desativado' })
  }

  const { senhaHash, ...userWithoutPassword } = user

  return res.status(200).json({
    success: true,
    user: userWithoutPassword,
    expiresAt: session.expiresAt,
  })
}

// Trocar senha
async function handleChangePassword(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  const sessions = getSessions()
  const session = sessions.get(token)

  if (!session || new Date(session.expiresAt) < new Date()) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada' })
  }

  const { senhaAtual, novaSenha } = req.body

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' })
  }

  if (novaSenha.length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' })
  }

  const users = getUsers()
  const user = users.get(session.userId)

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' })
  }

  if (!verifyPassword(senhaAtual, user.senhaHash)) {
    return res.status(401).json({ error: 'Senha atual incorreta' })
  }

  // Atualizar senha
  user.senhaHash = hashPassword(novaSenha)
  user.primeiroAcesso = false
  users.set(user.id, user)

  return res.status(200).json({ success: true, message: 'Senha alterada com sucesso' })
}

// Verificar senha para modo produção
async function handleVerifyProductionPassword(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  const sessions = getSessions()
  const session = sessions.get(token)

  if (!session || new Date(session.expiresAt) < new Date()) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada' })
  }

  const users = getUsers()
  const user = users.get(session.userId)

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem ativar o modo produção' })
  }

  const { senha } = req.body

  if (!senha) {
    return res.status(400).json({ error: 'Senha é obrigatória' })
  }

  if (!verifyPassword(senha, user.senhaHash)) {
    return res.status(401).json({ error: 'Senha incorreta' })
  }

  return res.status(200).json({ success: true, message: 'Senha verificada' })
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { action } = req.body || req.query

  try {
    switch (action) {
      case 'login':
        return handleLogin(req, res)
      case 'logout':
        return handleLogout(req, res)
      case 'session':
        return handleSession(req, res)
      case 'change-password':
        return handleChangePassword(req, res)
      case 'verify-production':
        return handleVerifyProductionPassword(req, res)
      default:
        return res.status(400).json({ error: 'Ação inválida' })
    }
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
