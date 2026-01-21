import { sql } from '@vercel/postgres'

// Função auxiliar para garantir que tabela existe
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
  } catch (e) {
    console.log('Tabelas já existem ou erro ignorável', e);
  }
}

export const userDB = {
  async findByEmail(email: string) {
    try {
      const result = await sql`SELECT * FROM users WHERE email = ${email}`;
      return result.rows[0] || null;
    } catch (e) { return null; }
  },
  
  async findById(id: string) {
    try {
      const result = await sql`SELECT * FROM users WHERE id = ${id}`;
      return result.rows[0] || null;
    } catch (e) { return null; }
  },
  
  // Cria usuário real no Neon se não existir
  async create(u: any) {
    try {
      await ensureTables();
      const result = await sql`
        INSERT INTO users (email, nome, senha_hash, role)
        VALUES (${u.email}, ${u.nome}, 'bypass_hash', 'admin')
        RETURNING *
      `;
      return result.rows[0];
    } catch (e) {
      console.error('Erro ao criar user:', e);
      return null;
    }
  }
};

export const sessionDB = {
  async findByToken(token: string) {
    // --- LÓGICA CORRIGIDA: BYPASS COM DADOS REAIS ---
    if (token === 'DEV_BYPASS_TOKEN') {
      try {
        await ensureTables();
        
        // 1. Tenta pegar o primeiro admin REAL do banco
        const realUser = await sql`SELECT * FROM users LIMIT 1`;
        
        if (realUser.rows.length > 0) {
           console.log('[AUTH] Usando usuário REAL do banco para o Bypass:', realUser.rows[0].email);
           return { ...realUser.rows[0], user_id: realUser.rows[0].id };
        }

        // 2. Se o banco estiver vazio, cria um admin REAL agora
        console.log('[AUTH] Banco vazio. Criando Admin Real...');
        const newUser = await sql`
          INSERT INTO users (email, nome, senha_hash, role)
          VALUES ('admin@autnew.com', 'Admin Real', 'hash_temp', 'admin')
          RETURNING *
        `;
        return { ...newUser.rows[0], user_id: newUser.rows[0].id };

      } catch (error) {
        console.error('[AUTH] Erro crítico no banco:', error);
        // Fallback de emergência apenas se o Neon cair
        return { id: 'fallback', role: 'admin', email: 'error@db.com' };
      }
    }
    // -------------------------------------------------

    try {
      const result = await sql`
        SELECT s.*, u.email, u.nome, u.role 
        FROM sessions s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.token = ${token}
      `;
      return result.rows[0] || null;
    } catch (e) { return null; }
  }
};
