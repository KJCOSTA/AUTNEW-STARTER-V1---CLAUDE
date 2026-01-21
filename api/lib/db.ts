import { sql } from '@vercel/postgres'

// Verificar se POSTGRES_URL está configurado
function checkDatabaseConfig() {
  if (!process.env.POSTGRES_URL) {
    console.error('[DB] POSTGRES_URL não está definido!')
    throw new Error('POSTGRES_URL environment variable is not set')
  }
  console.log('[DB] POSTGRES_URL configurado')
}

// Database schema initialization
export async function initializeDatabase() {
  try {
    checkDatabaseConfig()
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        nome VARCHAR(255) NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'viewer',
        ativo BOOLEAN DEFAULT true,
        primeiro_acesso BOOLEAN DEFAULT true,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ultimo_login TIMESTAMP WITH TIME ZONE
      )
    `

    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ip_address VARCHAR(45),
        user_agent TEXT
      )
    `

    // Create audit_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        details JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create health_check_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS health_check_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        results JSONB NOT NULL,
        summary JSONB NOT NULL,
        critical_failures TEXT[],
        success BOOLEAN NOT NULL,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)`
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_criado_em ON audit_logs(criado_em)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`

    console.log('[DB] Database initialized successfully')
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DB] Error initializing database:', errorMessage)
    console.error('[DB] Full error:', error)
    throw error // Re-throw to propagate to caller
  }
}

// User operations
export const userDB = {
  async findByEmail(email: string) {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email}
    `
    return result.rows[0] || null
  },

  async findById(id: string) {
    const result = await sql`
      SELECT * FROM users WHERE id = ${id}
    `
    return result.rows[0] || null
  },

  async create(user: {
    email: string
    nome: string
    senhaHash: string
    role: string
    primeiroAcesso?: boolean
  }) {
    const result = await sql`
      INSERT INTO users (email, nome, senha_hash, role, primeiro_acesso)
      VALUES (${user.email}, ${user.nome}, ${user.senhaHash}, ${user.role}, ${user.primeiroAcesso ?? true})
      RETURNING *
    `
    return result.rows[0]
  },

  async update(id: string, data: Partial<{
    email: string
    nome: string
    senhaHash: string
    role: string
    ativo: boolean
    primeiroAcesso: boolean
    ultimoLogin: Date
  }>) {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex++}`)
      values.push(data.email)
    }
    if (data.nome !== undefined) {
      updates.push(`nome = $${paramIndex++}`)
      values.push(data.nome)
    }
    if (data.senhaHash !== undefined) {
      updates.push(`senha_hash = $${paramIndex++}`)
      values.push(data.senhaHash)
    }
    if (data.role !== undefined) {
      updates.push(`role = $${paramIndex++}`)
      values.push(data.role)
    }
    if (data.ativo !== undefined) {
      updates.push(`ativo = $${paramIndex++}`)
      values.push(data.ativo)
    }
    if (data.primeiroAcesso !== undefined) {
      updates.push(`primeiro_acesso = $${paramIndex++}`)
      values.push(data.primeiroAcesso)
    }
    if (data.ultimoLogin !== undefined) {
      updates.push(`ultimo_login = $${paramIndex++}`)
      values.push(data.ultimoLogin)
    }

    updates.push(`atualizado_em = NOW()`)
    values.push(id)

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await sql.query(query, values)
    return result.rows[0]
  },

  async delete(id: string) {
    await sql`DELETE FROM users WHERE id = ${id}`
  },

  async list() {
    const result = await sql`
      SELECT id, email, nome, role, ativo, primeiro_acesso, criado_em, ultimo_login
      FROM users
      ORDER BY criado_em DESC
    `
    return result.rows
  },

  async count() {
    const result = await sql`SELECT COUNT(*) as count FROM users`
    return parseInt(result.rows[0].count)
  },

  async ensureAdminExists(adminEmail: string, adminNome: string, senhaHash: string) {
    const existing = await this.findByEmail(adminEmail)
    if (!existing) {
      return await this.create({
        email: adminEmail,
        nome: adminNome,
        senhaHash,
        role: 'admin',
        primeiroAcesso: true
      })
    }
    return existing
  },

  async resetAdminPassword(adminEmail: string, senhaHash: string) {
    const result = await sql`
      UPDATE users SET senha_hash = ${senhaHash}, primeiro_acesso = true
      WHERE email = ${adminEmail}
      RETURNING *
    `
    return result.rows[0] || null
  }
}

// Session operations
export const sessionDB = {
  async create(session: {
    userId: string
    token: string
    expiresAt: Date
    ipAddress?: string
    userAgent?: string
  }) {
    const expiresAtISO = session.expiresAt.toISOString()
    const result = await sql`
      INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
      VALUES (${session.userId}, ${session.token}, ${expiresAtISO}, ${session.ipAddress || null}, ${session.userAgent || null})
      RETURNING *
    `
    return result.rows[0]
  },

  async findByToken(token: string) {
    const result = await sql`
      SELECT s.*, u.email, u.nome, u.role, u.ativo, u.primeiro_acesso
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
    `
    return result.rows[0] || null
  },

  async deleteByToken(token: string) {
    await sql`DELETE FROM sessions WHERE token = ${token}`
  },

  async deleteByUserId(userId: string) {
    await sql`DELETE FROM sessions WHERE user_id = ${userId}`
  },

  async deleteExpired() {
    await sql`DELETE FROM sessions WHERE expires_at < NOW()`
  }
}

// Audit log operations
export const auditDB = {
  async log(entry: {
    userId?: string
    action: string
    category: 'auth' | 'production' | 'health_check' | 'user_management' | 'system'
    details?: Record<string, any>
    ipAddress?: string
    userAgent?: string
    success?: boolean
    errorMessage?: string
  }) {
    await sql`
      INSERT INTO audit_logs (user_id, action, category, details, ip_address, user_agent, success, error_message)
      VALUES (
        ${entry.userId || null},
        ${entry.action},
        ${entry.category},
        ${JSON.stringify(entry.details || {})},
        ${entry.ipAddress || null},
        ${entry.userAgent || null},
        ${entry.success ?? true},
        ${entry.errorMessage || null}
      )
    `
  },

  async list(filters?: {
    userId?: string
    category?: string
    action?: string
    limit?: number
    offset?: number
  }) {
    const limit = filters?.limit || 100
    const offset = filters?.offset || 0

    let query = `
      SELECT al.*, u.email as user_email, u.nome as user_nome
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `
    const values: any[] = []
    let paramIndex = 1

    if (filters?.userId) {
      query += ` AND al.user_id = $${paramIndex++}`
      values.push(filters.userId)
    }
    if (filters?.category) {
      query += ` AND al.category = $${paramIndex++}`
      values.push(filters.category)
    }
    if (filters?.action) {
      query += ` AND al.action = $${paramIndex++}`
      values.push(filters.action)
    }

    query += ` ORDER BY al.criado_em DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`
    values.push(limit, offset)

    const result = await sql.query(query, values)
    return result.rows
  }
}

// Health check log operations
export const healthCheckDB = {
  async log(entry: {
    userId?: string
    results: any[]
    summary: any
    criticalFailures: string[]
    success: boolean
  }) {
    const criticalFailuresArray = `{${entry.criticalFailures.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',')}}`
    await sql`
      INSERT INTO health_check_logs (user_id, results, summary, critical_failures, success)
      VALUES (
        ${entry.userId || null},
        ${JSON.stringify(entry.results)},
        ${JSON.stringify(entry.summary)},
        ${criticalFailuresArray}::text[],
        ${entry.success}
      )
    `
  },

  async list(limit = 50) {
    const result = await sql`
      SELECT hcl.*, u.email as user_email
      FROM health_check_logs hcl
      LEFT JOIN users u ON hcl.user_id = u.id
      ORDER BY hcl.criado_em DESC
      LIMIT ${limit}
    `
    return result.rows
  },

  async getLatest() {
    const result = await sql`
      SELECT * FROM health_check_logs
      ORDER BY criado_em DESC
      LIMIT 1
    `
    return result.rows[0] || null
  }
}
