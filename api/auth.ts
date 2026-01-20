import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { initializeDatabase, userDB, sessionDB, auditDB } from './lib/db'

// Constants
const ADMIN_EMAIL = 'kleiton@autnew.com'
const ADMIN_NOME = 'Kleiton'
const ADMIN_INITIAL_PASSWORD = 'jangada'
const SESSION_DURATION_HOURS = 24
const BCRYPT_SALT_ROUNDS = 12

// Password hashing with bcrypt
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Generate secure token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Get client info from request
function getClientInfo(req: VercelRequest) {
  return {
    ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
               req.socket?.remoteAddress ||
               'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  }
}

// Initialize database and ensure admin exists
async function ensureInitialized() {
  await initializeDatabase()
  const adminHash = await hashPassword(ADMIN_INITIAL_PASSWORD)
  await userDB.ensureAdminExists(ADMIN_EMAIL, ADMIN_NOME, adminHash)
}

// Login handler
async function handleLogin(req: VercelRequest, res: VercelResponse) {
  const { email, senha } = req.body
  const clientInfo = getClientInfo(req)

  if (!email || !senha) {
    await auditDB.log({
      action: 'login_attempt',
      category: 'auth',
      details: { email, reason: 'missing_credentials' },
      ...clientInfo,
      success: false,
      errorMessage: 'Email e senha são obrigatórios'
    })
    return res.status(400).json({ error: 'Email e senha são obrigatórios' })
  }

  await ensureInitialized()

  const user = await userDB.findByEmail(email)

  if (!user) {
    await auditDB.log({
      action: 'login_attempt',
      category: 'auth',
      details: { email, reason: 'user_not_found' },
      ...clientInfo,
      success: false,
      errorMessage: 'Usuário não encontrado'
    })
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }

  if (!user.ativo) {
    await auditDB.log({
      userId: user.id,
      action: 'login_attempt',
      category: 'auth',
      details: { reason: 'user_inactive' },
      ...clientInfo,
      success: false,
      errorMessage: 'Usuário desativado'
    })
    return res.status(401).json({ error: 'Usuário desativado' })
  }

  const passwordValid = await verifyPassword(senha, user.senha_hash)

  if (!passwordValid) {
    await auditDB.log({
      userId: user.id,
      action: 'login_attempt',
      category: 'auth',
      details: { reason: 'invalid_password' },
      ...clientInfo,
      success: false,
      errorMessage: 'Senha incorreta'
    })
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }

  // Create session
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)

  await sessionDB.create({
    userId: user.id,
    token,
    expiresAt,
    ...clientInfo
  })

  // Update last login
  await userDB.update(user.id, { ultimoLogin: new Date() })

  // Log successful login
  await auditDB.log({
    userId: user.id,
    action: 'login_success',
    category: 'auth',
    details: { sessionDuration: SESSION_DURATION_HOURS },
    ...clientInfo,
    success: true
  })

  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role,
      primeiroAcesso: user.primeiro_acesso
    },
    token,
    expiresAt: expiresAt.toISOString()
  })
}

// Logout handler
async function handleLogout(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const clientInfo = getClientInfo(req)

  if (!token) {
    return res.status(400).json({ error: 'Token não fornecido' })
  }

  const session = await sessionDB.findByToken(token)

  if (session) {
    await auditDB.log({
      userId: session.user_id,
      action: 'logout',
      category: 'auth',
      ...clientInfo,
      success: true
    })
  }

  await sessionDB.deleteByToken(token)

  return res.status(200).json({ success: true })
}

// Session verification handler
async function handleSession(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  await ensureInitialized()

  const session = await sessionDB.findByToken(token)

  if (!session) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada' })
  }

  if (!session.ativo) {
    return res.status(401).json({ error: 'Usuário desativado' })
  }

  return res.status(200).json({
    success: true,
    user: {
      id: session.user_id,
      email: session.email,
      nome: session.nome,
      role: session.role,
      primeiroAcesso: session.primeiro_acesso
    },
    expiresAt: session.expires_at
  })
}

// Change password handler
async function handleChangePassword(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { senhaAtual, novaSenha } = req.body
  const clientInfo = getClientInfo(req)

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' })
  }

  if (novaSenha.length < 6) {
    return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' })
  }

  const session = await sessionDB.findByToken(token)

  if (!session) {
    return res.status(401).json({ error: 'Sessão inválida' })
  }

  const user = await userDB.findById(session.user_id)

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' })
  }

  const passwordValid = await verifyPassword(senhaAtual, user.senha_hash)

  if (!passwordValid) {
    await auditDB.log({
      userId: user.id,
      action: 'change_password_failed',
      category: 'auth',
      details: { reason: 'invalid_current_password' },
      ...clientInfo,
      success: false,
      errorMessage: 'Senha atual incorreta'
    })
    return res.status(401).json({ error: 'Senha atual incorreta' })
  }

  const newHash = await hashPassword(novaSenha)
  await userDB.update(user.id, {
    senhaHash: newHash,
    primeiroAcesso: false
  })

  await auditDB.log({
    userId: user.id,
    action: 'change_password_success',
    category: 'auth',
    ...clientInfo,
    success: true
  })

  return res.status(200).json({ success: true, message: 'Senha alterada com sucesso' })
}

// Verify production password handler
async function handleVerifyProductionPassword(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { senha } = req.body
  const clientInfo = getClientInfo(req)

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  if (!senha) {
    return res.status(400).json({ error: 'Senha é obrigatória' })
  }

  const session = await sessionDB.findByToken(token)

  if (!session) {
    return res.status(401).json({ error: 'Sessão inválida' })
  }

  if (session.role !== 'admin') {
    await auditDB.log({
      userId: session.user_id,
      action: 'production_mode_denied',
      category: 'production',
      details: { reason: 'not_admin' },
      ...clientInfo,
      success: false,
      errorMessage: 'Apenas administradores podem ativar modo produção'
    })
    return res.status(403).json({ error: 'Apenas administradores podem ativar modo produção' })
  }

  const user = await userDB.findById(session.user_id)

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' })
  }

  const passwordValid = await verifyPassword(senha, user.senha_hash)

  if (!passwordValid) {
    await auditDB.log({
      userId: user.id,
      action: 'production_mode_password_failed',
      category: 'production',
      ...clientInfo,
      success: false,
      errorMessage: 'Senha incorreta'
    })
    return res.status(401).json({ error: 'Senha incorreta' })
  }

  await auditDB.log({
    userId: user.id,
    action: 'production_mode_password_verified',
    category: 'production',
    ...clientInfo,
    success: true
  })

  return res.status(200).json({ success: true })
}

// User management handlers
async function handleListUsers(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  const session = await sessionDB.findByToken(token)

  if (!session || session.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' })
  }

  await ensureInitialized()

  const users = await userDB.list()

  return res.status(200).json({
    success: true,
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      nome: u.nome,
      role: u.role,
      ativo: u.ativo,
      primeiroAcesso: u.primeiro_acesso,
      criadoEm: u.criado_em,
      ultimoLogin: u.ultimo_login
    }))
  })
}

async function handleCreateUser(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { email, nome, senha, role } = req.body
  const clientInfo = getClientInfo(req)

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  const session = await sessionDB.findByToken(token)

  if (!session || session.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' })
  }

  if (!email || !nome || !senha) {
    return res.status(400).json({ error: 'Email, nome e senha são obrigatórios' })
  }

  if (!['admin', 'editor', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Role inválido' })
  }

  const existingUser = await userDB.findByEmail(email)

  if (existingUser) {
    return res.status(400).json({ error: 'Email já cadastrado' })
  }

  const senhaHash = await hashPassword(senha)

  const newUser = await userDB.create({
    email,
    nome,
    senhaHash,
    role,
    primeiroAcesso: true
  })

  await auditDB.log({
    userId: session.user_id,
    action: 'user_created',
    category: 'user_management',
    details: { createdUserId: newUser.id, email, role },
    ...clientInfo,
    success: true
  })

  return res.status(201).json({
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      nome: newUser.nome,
      role: newUser.role,
      ativo: newUser.ativo,
      primeiroAcesso: newUser.primeiro_acesso,
      criadoEm: newUser.criado_em
    },
    message: 'Usuário criado com sucesso'
  })
}

async function handleUpdateUser(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { id, email, nome, role, ativo } = req.body
  const clientInfo = getClientInfo(req)

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  const session = await sessionDB.findByToken(token)

  if (!session || session.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' })
  }

  if (!id) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório' })
  }

  const user = await userDB.findById(id)

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' })
  }

  const updateData: any = {}
  if (email !== undefined) updateData.email = email
  if (nome !== undefined) updateData.nome = nome
  if (role !== undefined) updateData.role = role
  if (ativo !== undefined) updateData.ativo = ativo

  const updatedUser = await userDB.update(id, updateData)

  await auditDB.log({
    userId: session.user_id,
    action: 'user_updated',
    category: 'user_management',
    details: { targetUserId: id, changes: updateData },
    ...clientInfo,
    success: true
  })

  return res.status(200).json({
    success: true,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      nome: updatedUser.nome,
      role: updatedUser.role,
      ativo: updatedUser.ativo,
      primeiroAcesso: updatedUser.primeiro_acesso,
      criadoEm: updatedUser.criado_em,
      ultimoLogin: updatedUser.ultimo_login
    },
    message: 'Usuário atualizado com sucesso'
  })
}

async function handleDeleteUser(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { id } = req.body
  const clientInfo = getClientInfo(req)

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  const session = await sessionDB.findByToken(token)

  if (!session || session.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' })
  }

  if (!id) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório' })
  }

  if (id === session.user_id) {
    return res.status(400).json({ error: 'Não é possível excluir seu próprio usuário' })
  }

  const user = await userDB.findById(id)

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' })
  }

  // Delete user sessions first
  await sessionDB.deleteByUserId(id)

  // Delete user
  await userDB.delete(id)

  await auditDB.log({
    userId: session.user_id,
    action: 'user_deleted',
    category: 'user_management',
    details: { deletedUserId: id, deletedEmail: user.email },
    ...clientInfo,
    success: true
  })

  return res.status(200).json({ success: true, message: 'Usuário deletado com sucesso' })
}

async function handleResetPassword(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { id, novaSenha } = req.body
  const clientInfo = getClientInfo(req)

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  const session = await sessionDB.findByToken(token)

  if (!session || session.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' })
  }

  if (!id || !novaSenha) {
    return res.status(400).json({ error: 'ID do usuário e nova senha são obrigatórios' })
  }

  const user = await userDB.findById(id)

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' })
  }

  const newHash = await hashPassword(novaSenha)
  await userDB.update(id, {
    senhaHash: newHash,
    primeiroAcesso: true
  })

  // Invalidate all sessions for this user
  await sessionDB.deleteByUserId(id)

  await auditDB.log({
    userId: session.user_id,
    action: 'password_reset',
    category: 'user_management',
    details: { targetUserId: id },
    ...clientInfo,
    success: true
  })

  return res.status(200).json({ success: true, message: 'Senha redefinida com sucesso' })
}

// Get audit logs handler
async function handleGetLogs(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { category, limit } = req.query

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  const session = await sessionDB.findByToken(token)

  if (!session || session.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' })
  }

  const logs = await auditDB.list({
    category: category as string,
    limit: parseInt(limit as string) || 100
  })

  return res.status(200).json({ logs })
}

// Main handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { action } = req.body || req.query

  try {
    switch (action) {
      // Auth actions
      case 'login':
        return await handleLogin(req, res)
      case 'logout':
        return await handleLogout(req, res)
      case 'session':
        return await handleSession(req, res)
      case 'change-password':
        return await handleChangePassword(req, res)
      case 'verify-production':
        return await handleVerifyProductionPassword(req, res)
      // User management actions
      case 'list':
        return await handleListUsers(req, res)
      case 'create':
        return await handleCreateUser(req, res)
      case 'update':
        return await handleUpdateUser(req, res)
      case 'delete':
        return await handleDeleteUser(req, res)
      case 'reset-password':
        return await handleResetPassword(req, res)
      // Logs
      case 'logs':
        return await handleGetLogs(req, res)
      default:
        return res.status(400).json({ error: 'Ação inválida' })
    }
  } catch (error) {
    console.error('Auth API error:', error)
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}
