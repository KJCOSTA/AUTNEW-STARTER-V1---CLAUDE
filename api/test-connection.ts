import type { VercelRequest, VercelResponse } from '@vercel/node'

import { sql } from '@vercel/postgres';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    // Tenta uma query simples no banco (apenas pega a hora atual)
    const startTime = Date.now();
    const result = await sql`SELECT NOW() as time`;
    const duration = Date.now() - startTime;

    // Se der certo, retorna sucesso e os dados
    return res.status(200).json({
      status: '✅ SUCESSO',
      message: 'Conexão com NEON estabelecida!',
      database_time: result.rows[0].time,
      latency_ms: duration,
      env_check: {
        has_postgres_url: !!process.env.POSTGRES_URL,
        node_env: process.env.NODE_ENV
      }
    });
  } catch (error) {
    // Se der erro, mostra o motivo
    console.error('Erro de conexão:', error);
    return res.status(500).json({
      status: '❌ ERRO DE CONEXÃO',
      message: (error as Error).message,
      hint: 'Verifique se a variável POSTGRES_URL está correta no Vercel Settings',
    });
  }
}
