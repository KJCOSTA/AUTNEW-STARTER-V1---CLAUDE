import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

/**
 * Cron Job: Limpeza Automática do Sistema
 *
 * Executa diariamente para:
 * - Remover sessões expiradas
 * - Limpar logs antigos (> 90 dias)
 * - Remover health checks antigos (> 30 dias)
 *
 * Configurado no vercel.json com schedule
 */

interface CleanupResult {
  task: string
  deletedCount: number
  success: boolean
  error?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret (security - only Vercel can call this)
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET

  // In production, verify the cron secret
  if (process.env.VERCEL_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const results: CleanupResult[] = []
  const startTime = Date.now()

  // 1. Delete expired sessions
  try {
    const expiredSessions = await sql`
      DELETE FROM sessions
      WHERE expires_at < NOW()
      RETURNING id
    `
    results.push({
      task: 'expired_sessions',
      deletedCount: expiredSessions.rowCount || 0,
      success: true
    })
  } catch (error) {
    results.push({
      task: 'expired_sessions',
      deletedCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // 2. Delete old audit logs (> 90 days)
  try {
    const oldLogs = await sql`
      DELETE FROM audit_logs
      WHERE criado_em < NOW() - INTERVAL '90 days'
      RETURNING id
    `
    results.push({
      task: 'old_audit_logs',
      deletedCount: oldLogs.rowCount || 0,
      success: true
    })
  } catch (error) {
    results.push({
      task: 'old_audit_logs',
      deletedCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // 3. Delete old health check logs (> 30 days)
  try {
    const oldHealthChecks = await sql`
      DELETE FROM health_check_logs
      WHERE criado_em < NOW() - INTERVAL '30 days'
      RETURNING id
    `
    results.push({
      task: 'old_health_checks',
      deletedCount: oldHealthChecks.rowCount || 0,
      success: true
    })
  } catch (error) {
    results.push({
      task: 'old_health_checks',
      deletedCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // 4. Log the cleanup execution
  try {
    await sql`
      INSERT INTO audit_logs (action, category, details, success)
      VALUES (
        'cron_cleanup',
        'system',
        ${JSON.stringify({ results, duration: Date.now() - startTime })},
        ${results.every(r => r.success)}
      )
    `
  } catch (error) {
    console.error('Failed to log cron execution:', error)
  }

  const totalDeleted = results.reduce((sum, r) => sum + r.deletedCount, 0)
  const allSuccess = results.every(r => r.success)

  return res.status(200).json({
    success: allSuccess,
    message: allSuccess
      ? `Limpeza concluída: ${totalDeleted} registros removidos`
      : 'Limpeza concluída com alguns erros',
    results,
    duration: `${Date.now() - startTime}ms`,
    timestamp: new Date().toISOString()
  })
}
