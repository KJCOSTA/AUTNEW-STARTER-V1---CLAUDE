import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check database connection
    const dbCheck = await sql`SELECT 1 as connected`
    const dbConnected = dbCheck.rows.length > 0

    // Check users table
    const usersCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'users'
      ) as exists
    `
    const usersTableExists = usersCheck.rows[0]?.exists === true

    // Check sessions table
    const sessionsCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'sessions'
      ) as exists
    `
    const sessionsTableExists = sessionsCheck.rows[0]?.exists === true

    // Count users
    let userCount = 0
    if (usersTableExists) {
      const countResult = await sql`SELECT COUNT(*) as count FROM users`
      userCount = parseInt(countResult.rows[0]?.count || '0')
    }

    // Count active sessions
    let sessionCount = 0
    if (sessionsTableExists) {
      const sessionResult = await sql`SELECT COUNT(*) as count FROM sessions WHERE expires_at > NOW()`
      sessionCount = parseInt(sessionResult.rows[0]?.count || '0')
    }

    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: dbConnected ? 'ok' : 'error',
      users_table: usersTableExists,
      sessions_table: sessionsTableExists,
      user_count: userCount,
      active_sessions: sessionCount,
      env: process.env.NODE_ENV || 'development'
    })
  } catch (error) {
    console.error('Health check error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      db: 'error',
      users_table: false,
      sessions_table: false,
      env: process.env.NODE_ENV || 'development',
      error: process.env.NODE_ENV === 'development' ? errorMessage : 'Database connection failed'
    })
  }
}
