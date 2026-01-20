import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { sql } from '@vercel/postgres'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    steps: []
  }

  try {
    // Step 1: Test bcrypt
    diagnostics.steps.push({ step: 'bcrypt_start', status: 'running' })
    const testPassword = 'jangada'
    const hash = await bcrypt.hash(testPassword, 12)
    const verified = await bcrypt.compare(testPassword, hash)
    diagnostics.steps.push({
      step: 'bcrypt_complete',
      status: 'success',
      hashLength: hash.length,
      verified
    })

    // Step 2: Test database connection
    diagnostics.steps.push({ step: 'db_connection_start', status: 'running' })
    const dbTest = await sql`SELECT 1 as test`
    diagnostics.steps.push({
      step: 'db_connection_complete',
      status: 'success',
      result: dbTest.rows[0]
    })

    // Step 3: Test table creation
    diagnostics.steps.push({ step: 'table_creation_start', status: 'running' })
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
    diagnostics.steps.push({ step: 'users_table_created', status: 'success' })

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
    diagnostics.steps.push({ step: 'sessions_table_created', status: 'success' })

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
    diagnostics.steps.push({ step: 'audit_logs_table_created', status: 'success' })

    // Step 4: Check if admin exists
    diagnostics.steps.push({ step: 'check_admin_start', status: 'running' })
    const adminEmail = 'kleiton@autnew.com'
    const existingAdmin = await sql`SELECT id, email, nome, role FROM users WHERE email = ${adminEmail}`

    if (existingAdmin.rows.length > 0) {
      diagnostics.steps.push({
        step: 'admin_exists',
        status: 'success',
        admin: existingAdmin.rows[0]
      })
    } else {
      // Create admin
      diagnostics.steps.push({ step: 'creating_admin', status: 'running' })
      const adminHash = await bcrypt.hash('jangada', 12)
      const newAdmin = await sql`
        INSERT INTO users (email, nome, senha_hash, role, primeiro_acesso)
        VALUES (${adminEmail}, ${'Kleiton'}, ${adminHash}, ${'admin'}, ${true})
        RETURNING id, email, nome, role
      `
      diagnostics.steps.push({
        step: 'admin_created',
        status: 'success',
        admin: newAdmin.rows[0]
      })
    }

    // Step 5: Test admin password
    diagnostics.steps.push({ step: 'test_password_start', status: 'running' })
    const adminUser = await sql`SELECT id, email, senha_hash FROM users WHERE email = ${adminEmail}`
    if (adminUser.rows.length > 0) {
      const passwordMatch = await bcrypt.compare('jangada', adminUser.rows[0].senha_hash)
      diagnostics.steps.push({
        step: 'test_password_complete',
        status: passwordMatch ? 'success' : 'password_mismatch',
        passwordMatch
      })

      // If password doesn't match, reset it
      if (!passwordMatch) {
        diagnostics.steps.push({ step: 'resetting_password', status: 'running' })
        const newHash = await bcrypt.hash('jangada', 12)
        await sql`UPDATE users SET senha_hash = ${newHash}, primeiro_acesso = true WHERE email = ${adminEmail}`
        diagnostics.steps.push({
          step: 'password_reset_complete',
          status: 'success',
          message: 'Senha resetada para: jangada'
        })
      }
    }

    diagnostics.success = true
    diagnostics.message = 'Todas as etapas concluídas. Tente fazer login com: kleiton@autnew.com / jangada'
    return res.status(200).json(diagnostics)

  } catch (error: any) {
    diagnostics.success = false
    diagnostics.error = {
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 5)
    }
    return res.status(500).json(diagnostics)
  }
}
