import { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'

// Usando _req para indicar que não é usada
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    console.log('[INIT-DB] Starting database initialization...')

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
    
    // Check/Create Admin
    const existing = await sql`SELECT id FROM users WHERE email = 'admin@autnew.com' LIMIT 1`
    
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10)
      await sql`
        INSERT INTO users (email, nome, senha_hash, role, ativo, primeiro_acesso)
        VALUES ('admin@autnew.com', 'Admin', ${hash}, 'admin', true, false)
      `
    }

    return res.status(200).json({ success: true, message: 'DB Initialized' })
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message })
  }
}
