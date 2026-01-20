import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    // Test database connection
    const result = await sql`SELECT 1 as test`

    // Check environment variables
    const envCheck = {
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      POSTGRES_HOST: !!process.env.POSTGRES_HOST,
      POSTGRES_USER: !!process.env.POSTGRES_USER,
      POSTGRES_PASSWORD: !!process.env.POSTGRES_PASSWORD,
      POSTGRES_DATABASE: !!process.env.POSTGRES_DATABASE,
    }

    res.status(200).json({
      db: 'connected',
      test: result.rows[0],
      envVars: envCheck,
      timestamp: new Date().toISOString()
    })
  } catch (e: any) {
    res.status(500).json({
      db: 'error',
      message: e.message,
      code: e.code,
      envVars: {
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        POSTGRES_HOST: !!process.env.POSTGRES_HOST,
      }
    })
  }
}
