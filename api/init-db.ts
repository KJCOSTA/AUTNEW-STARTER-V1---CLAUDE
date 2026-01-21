import { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('[INIT-DB] Starting database initialization...')

    // 1. Create tables if they don't exist
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
    console.log('[INIT-DB] Users table ensured')

    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    console.log('[INIT-DB] Sessions table ensured')

    // 2. Check if admin exists
    const existingAdmins = await sql`
      SELECT * FROM users WHERE email = 'admin@autnew.com'
    `

    if (existingAdmins.rows.length > 0) {
      // Admin exists - update password to known value
      const passwordHash = await bcrypt.hash('admin123', 10)

      await sql`
        UPDATE users
        SET senha_hash = ${passwordHash}, primeiro_acesso = false
        WHERE email = 'admin@autnew.com'
      `

      console.log('[INIT-DB] Admin password updated to: admin123')

      // Delete duplicate admins (keep only first one)
      const admins = await sql`SELECT id FROM users WHERE email = 'admin@autnew.com' ORDER BY criado_em LIMIT 1`
      const firstAdminId = admins.rows[0]?.id

      if (firstAdminId) {
        await sql`DELETE FROM users WHERE email = 'admin@autnew.com' AND id != ${firstAdminId}`
        console.log('[INIT-DB] Removed duplicate admin accounts')
      }
    } else {
      // No admin - create one
      const passwordHash = await bcrypt.hash('admin123', 10)

      await sql`
        INSERT INTO users (email, nome, senha_hash, role, ativo, primeiro_acesso)
        VALUES ('admin@autnew.com', 'Admin', ${passwordHash}, 'admin', true, false)
      `

      console.log('[INIT-DB] Admin created with email: admin@autnew.com, password: admin123')
    }

    // 3. Get final admin user
    const finalAdmin = await sql`
      SELECT id, email, nome, role, ativo, primeiro_acesso, criado_em
      FROM users WHERE email = 'admin@autnew.com'
      LIMIT 1
    `

    return res.status(200).json({
      success: true,
      message: 'Database initialized successfully',
      admin: finalAdmin.rows[0],
      credentials: {
        email: 'admin@autnew.com',
        password: 'admin123',
        note: 'Use these credentials to login'
      }
    })
  } catch (error) {
    console.error('[INIT-DB] Error:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
