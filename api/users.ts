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
// UTILITÁRIOS (compartilhados com auth.ts)
// ============================================

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + process.env.AUTH_SECRET || 'autnew-secret-key').digest('hex')
}

function generateId(): string {
  return `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
}

// Acesso aos dados em memória
declare global {
  // eslint-disable-next-line no-var
  var __users: Map<string, User> | undefined
  // eslint-disable-next-line no-var
  var __sessions: Map<string, Session> | undefined
}

const ADMIN_INITIAL_PASSWORD = 'territorio'

function getUsers(): Map<string, User> {
  if (!global.__users) {
    global.__users = new Map()
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

// Verificar se usuário é admin
function verifyAdmin(token: string): User | null {
  const sessions = getSessions()
  const session = sessions.get(token)

  if (!session || new Date(session.expiresAt) < new Date()) {
    return null
  }

  const users = getUsers()
  const user = users.get(session.userId)

  if (!user || user.role !== 'admin') {
    return null
  }

  return user
}

// ============================================
// HANDLERS
// ============================================

// Listar usuários
async function handleListUsers(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (!token || !verifyAdmin(token)) {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' })
  }

  const users = getUsers()
  const userList = Array.from(users.values()).map(({ senhaHash, ...user }) => user)

  return res.status(200).json({
    success: true,
    users: userList,
  })
}

// Criar usuário
async function handleCreateUser(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (!token || !verifyAdmin(token)) {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' })
  }

  const { email, nome, senha, role } = req.body

  if (!email || !nome || !senha || !role) {
    return res.status(400).json({ error: 'Email, nome, senha e role são obrigatórios' })
  }

  if (!['admin', 'editor', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Role inválido. Use: admin, editor ou viewer' })
  }

  if (senha.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' })
  }

  const users = getUsers()

  // Verificar se email já existe
  const existingUser = Array.from(users.values()).find((u) => u.email === email)
  if (existingUser) {
    return res.status(409).json({ error: 'Este email já está cadastrado' })
  }

  const newUser: User = {
    id: generateId(),
    email,
    nome,
    role,
    ativo: true,
    criadoEm: new Date().toISOString(),
    primeiroAcesso: true,
    senhaHash: hashPassword(senha),
  }

  users.set(newUser.id, newUser)

  const { senhaHash, ...userWithoutPassword } = newUser

  return res.status(201).json({
    success: true,
    user: userWithoutPassword,
    message: 'Usuário criado com sucesso',
  })
}

// Atualizar usuário
async function handleUpdateUser(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (!token || !verifyAdmin(token)) {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' })
  }

  const { id, email, nome, role, ativo } = req.body

  if (!id) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório' })
  }

  const users = getUsers()
  const user = users.get(id)

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' })
  }

  // Não permitir desativar o próprio admin
  const sessions = getSessions()
  const session = sessions.get(token)
  if (session?.userId === id && ativo === false) {
    return res.status(400).json({ error: 'Você não pode desativar sua própria conta' })
  }

  // Verificar se novo email já existe
  if (email && email !== user.email) {
    const existingUser = Array.from(users.values()).find((u) => u.email === email)
    if (existingUser) {
      return res.status(409).json({ error: 'Este email já está cadastrado' })
    }
    user.email = email
  }

  if (nome) user.nome = nome
  if (role && ['admin', 'editor', 'viewer'].includes(role)) user.role = role
  if (typeof ativo === 'boolean') user.ativo = ativo

  users.set(id, user)

  const { senhaHash, ...userWithoutPassword } = user

  return res.status(200).json({
    success: true,
    user: userWithoutPassword,
    message: 'Usuário atualizado com sucesso',
  })
}

// Deletar usuário
async function handleDeleteUser(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (!token || !verifyAdmin(token)) {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' })
  }

  const { id } = req.body

  if (!id) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório' })
  }

  const users = getUsers()
  const user = users.get(id)

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' })
  }

  // Não permitir deletar o próprio admin
  const sessions = getSessions()
  const session = sessions.get(token)
  if (session?.userId === id) {
    return res.status(400).json({ error: 'Você não pode deletar sua própria conta' })
  }

  // Verificar se é o último admin
  const admins = Array.from(users.values()).filter((u) => u.role === 'admin')
  if (user.role === 'admin' && admins.length <= 1) {
    return res.status(400).json({ error: 'Não é possível deletar o único administrador do sistema' })
  }

  users.delete(id)

  // Invalidar sessões do usuário deletado
  const allSessions = Array.from(getSessions().entries())
  allSessions.forEach(([sessionToken, sess]) => {
    if (sess.userId === id) {
      getSessions().delete(sessionToken)
    }
  })

  return res.status(200).json({
    success: true,
    message: 'Usuário deletado com sucesso',
  })
}

// Resetar senha do usuário
async function handleResetPassword(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (!token || !verifyAdmin(token)) {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' })
  }

  const { id, novaSenha } = req.body

  if (!id || !novaSenha) {
    return res.status(400).json({ error: 'ID e nova senha são obrigatórios' })
  }

  if (novaSenha.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' })
  }

  const users = getUsers()
  const user = users.get(id)

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' })
  }

  user.senhaHash = hashPassword(novaSenha)
  user.primeiroAcesso = true
  users.set(id, user)

  return res.status(200).json({
    success: true,
    message: 'Senha resetada com sucesso. O usuário deverá trocar a senha no próximo login.',
  })
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
      case 'list':
        return handleListUsers(req, res)
      case 'create':
        return handleCreateUser(req, res)
      case 'update':
        return handleUpdateUser(req, res)
      case 'delete':
        return handleDeleteUser(req, res)
      case 'reset-password':
        return handleResetPassword(req, res)
      default:
        return res.status(400).json({ error: 'Ação inválida' })
    }
  } catch (error) {
    console.error('Users error:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
