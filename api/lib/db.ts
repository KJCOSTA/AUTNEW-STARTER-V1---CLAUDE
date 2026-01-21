import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

// --- ENVIRONMENT & SECURITY ---
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development';
const DEV_BYPASS_ENABLED = isDevelopment && process.env.ENABLE_DEV_BYPASS === 'true';

// Validate critical environment variables
function validateEnvironment() {
  const warnings = [];

  if (!process.env.POSTGRES_URL && !process.env.POSTGRES_URL_NON_POOLING) {
    warnings.push('⚠️ Missing POSTGRES_URL - database operations will fail');
  }

  if (!process.env.YOUTUBE_API_KEY) {
    warnings.push('⚠️ Missing YOUTUBE_API_KEY - YouTube stats will use fallback data');
  }

  if (!process.env.OPENAI_API_KEY) {
    warnings.push('⚠️ Missing OPENAI_API_KEY - AI plan generation will use fallback');
  }

  if (warnings.length > 0) {
    console.warn('[ENV CHECK]', warnings.join('\n'));
  }

  return warnings;
}

// Run validation on module load
validateEnvironment();

// --- FUNÇÕES AUXILIARES ---
async function ensureTables() {
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
    `;
    await sql`CREATE TABLE IF NOT EXISTS sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID, token VARCHAR(255), expires_at TIMESTAMP)`;
    console.log('[DB] Tables ensured successfully');
  } catch (e) {
    console.error('[DB ERROR] Failed to ensure tables:', e);
    throw e;
  }
}

export async function initializeDatabase() {
  await ensureTables();
  return { success: true };
}

// --- USER DB COMPLETO ---
export const userDB = {
  async findByEmail(email: string) {
    try {
      const result = await sql`SELECT * FROM users WHERE email = ${email}`;
      return result.rows[0] || null;
    } catch (e) {
      console.error('[DB ERROR] findByEmail failed:', e);
      return null;
    }
  },

  async findById(id: string) {
    try {
      const result = await sql`SELECT * FROM users WHERE id = ${id}`;
      return result.rows[0] || null;
    } catch (e) {
      console.error('[DB ERROR] findById failed:', e);
      return null;
    }
  },

  async create(u: any) {
    try {
      await ensureTables();

      // Hash the password properly
      const passwordHash = u.senha_hash
        ? await bcrypt.hash(u.senha_hash, 10)
        : await bcrypt.hash('temp_password_123', 10);

      const result = await sql`
        INSERT INTO users (email, nome, senha_hash, role, ativo, primeiro_acesso)
        VALUES (
          ${u.email},
          ${u.nome},
          ${passwordHash},
          ${u.role || 'admin'},
          ${u.ativo !== undefined ? u.ativo : true},
          ${u.primeiro_acesso !== undefined ? u.primeiro_acesso : false}
        )
        RETURNING *
      `;

      console.log('[DB] User created:', result.rows[0].email);
      return result.rows[0];
    } catch (e) {
      console.error('[DB ERROR] create user failed:', e);
      return null;
    }
  },

  async update(id: string, data: any) {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic UPDATE query
      if (data.nome !== undefined) {
        updates.push(`nome = $${paramIndex++}`);
        values.push(data.nome);
      }
      if (data.email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(data.email);
      }
      if (data.senha_hash !== undefined) {
        const hash = await bcrypt.hash(data.senha_hash, 10);
        updates.push(`senha_hash = $${paramIndex++}`);
        values.push(hash);
      }
      if (data.role !== undefined) {
        updates.push(`role = $${paramIndex++}`);
        values.push(data.role);
      }
      if (data.ativo !== undefined) {
        updates.push(`ativo = $${paramIndex++}`);
        values.push(data.ativo);
      }
      if (data.primeiro_acesso !== undefined) {
        updates.push(`primeiro_acesso = $${paramIndex++}`);
        values.push(data.primeiro_acesso);
      }

      if (updates.length === 0) {
        console.warn('[DB WARN] update called with no fields to update');
        return await userDB.findById(id);
      }

      values.push(id);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

      const result = await sql.query(query, values);
      console.log('[DB] User updated:', id);
      return result.rows[0] || null;
    } catch (e) {
      console.error('[DB ERROR] update user failed:', e);
      return null;
    }
  },

  async delete(id: string) {
    try {
      await sql`DELETE FROM users WHERE id = ${id}`;
      console.log('[DB] User deleted:', id);
      return true;
    } catch (e) {
      console.error('[DB ERROR] delete user failed:', e);
      return false;
    }
  },

  async list() {
    try {
      const result = await sql`SELECT id, email, nome, role, ativo, primeiro_acesso, criado_em FROM users ORDER BY criado_em DESC LIMIT 100`;
      return result.rows;
    } catch (e) {
      console.error('[DB ERROR] list users failed:', e);
      return [];
    }
  },

  async ensureAdminExists() {
    try {
      await ensureTables();

      // Check if any admin exists
      const adminCheck = await sql`SELECT * FROM users WHERE role = 'admin' LIMIT 1`;

      if (adminCheck.rows.length > 0) {
        console.log('[DB] Admin already exists');
        return adminCheck.rows[0];
      }

      // Create default admin if none exists
      const defaultPassword = await bcrypt.hash('admin123', 10);
      const result = await sql`
        INSERT INTO users (email, nome, senha_hash, role, primeiro_acesso)
        VALUES ('admin@autnew.com', 'Admin', ${defaultPassword}, 'admin', true)
        RETURNING *
      `;

      console.log('[DB] Default admin created - Email: admin@autnew.com, Password: admin123');
      return result.rows[0];
    } catch (e) {
      console.error('[DB ERROR] ensureAdminExists failed:', e);
      return null;
    }
  },

  async verifyPassword(plainPassword: string, hashedPassword: string) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (e) {
      console.error('[DB ERROR] verifyPassword failed:', e);
      return false;
    }
  }
};

// --- SESSION DB ---
export const sessionDB = {
  async findByToken(token: string) {
    // === DEV BYPASS (only in development with explicit flag) ===
    if (token === 'DEV_BYPASS_TOKEN' && DEV_BYPASS_ENABLED) {
      console.warn('[SECURITY] DEV_BYPASS_TOKEN used - this should NEVER happen in production!');
      try {
        await ensureTables();
        const realUser = await sql`SELECT * FROM users LIMIT 1`;
        if (realUser.rows.length > 0) {
          return { ...realUser.rows[0], user_id: realUser.rows[0].id };
        }

        // Create admin if no users exist
        const admin = await userDB.ensureAdminExists();
        return admin ? { ...admin, user_id: admin.id } : null;
      } catch (error) {
        console.error('[DB ERROR] DEV_BYPASS failed:', error);
        return null;
      }
    }

    // Block bypass token in production
    if (token === 'DEV_BYPASS_TOKEN' && !DEV_BYPASS_ENABLED) {
      console.error('[SECURITY ALERT] Attempted use of DEV_BYPASS_TOKEN in production!');
      return null;
    }
    // =====================

    try {
      const result = await sql`
        SELECT s.*, u.email, u.nome, u.role, u.ativo
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ${token} AND s.expires_at > NOW()
      `;
      return result.rows[0] || null;
    } catch (e) {
      console.error('[DB ERROR] findByToken failed:', e);
      return null;
    }
  },

  async create(sessionData: any) {
    try {
      const expiresAt = sessionData.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default

      const result = await sql`
        INSERT INTO sessions (user_id, token, expires_at)
        VALUES (${sessionData.user_id}, ${sessionData.token}, ${expiresAt})
        RETURNING *
      `;

      console.log('[DB] Session created for user:', sessionData.user_id);
      return result.rows[0];
    } catch (e) {
      console.error('[DB ERROR] create session failed:', e);
      return null;
    }
  },

  async deleteByToken(token: string) {
    try {
      await sql`DELETE FROM sessions WHERE token = ${token}`;
      console.log('[DB] Session deleted by token');
      return true;
    } catch (e) {
      console.error('[DB ERROR] deleteByToken failed:', e);
      return false;
    }
  },

  async deleteByUserId(userId: string) {
    try {
      await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
      console.log('[DB] All sessions deleted for user:', userId);
      return true;
    } catch (e) {
      console.error('[DB ERROR] deleteByUserId failed:', e);
      return false;
    }
  },

  async cleanup() {
    try {
      const result = await sql`DELETE FROM sessions WHERE expires_at < NOW()`;
      console.log('[DB] Cleaned up expired sessions:', result.rowCount);
      return result.rowCount || 0;
    } catch (e) {
      console.error('[DB ERROR] cleanup sessions failed:', e);
      return 0;
    }
  }
};

// --- AUDIT DB ---
export const auditDB = {
  async log(entry: any) {
    try {
      // Log to console for now (could be extended to store in DB or send to monitoring service)
      const logEntry = {
        timestamp: new Date().toISOString(),
        action: entry.action,
        userId: entry.userId,
        details: entry.details,
        ip: entry.ip,
      };
      console.log('[AUDIT]', JSON.stringify(logEntry));
      return true;
    } catch (e) {
      console.error('[AUDIT ERROR] Failed to log audit entry:', e);
      return false;
    }
  },

  async list() {
    // Placeholder - could be implemented to retrieve from audit table
    console.warn('[AUDIT] List function not yet implemented');
    return [];
  }
};

// --- HEALTH CHECK DB ---
export const healthCheckDB = {
  async check() {
    try {
      // Test database connection
      await sql`SELECT 1 as health_check`;
      console.log('[HEALTH] Database connection OK');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (e) {
      console.error('[HEALTH ERROR] Database connection failed:', e);
      return { status: 'unhealthy', error: (e as Error).message, timestamp: new Date().toISOString() };
    }
  },

  async log(checkResult: any) {
    try {
      console.log('[HEALTH LOG]', checkResult);
      return true;
    } catch (e) {
      console.error('[HEALTH ERROR] Failed to log health check:', e);
      return false;
    }
  },

  async list() {
    // Placeholder - could be implemented to retrieve health check history
    console.warn('[HEALTH] List function not yet implemented');
    return [];
  }
};
