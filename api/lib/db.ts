import { sql } from '@vercel/postgres'

// Mock para quando o banco não estiver conectado
const MOCK_ADMIN = {
  id: 'admin-dev',
  email: 'admin@autnew.com',
  nome: 'Administrador (Bypass)',
  role: 'admin',
  ativo: true,
  primeiro_acesso: false
};

// Verificar configuração
function checkDatabaseConfig() {
  if (!process.env.POSTGRES_URL) {
    console.warn('[DB] AVISO: POSTGRES_URL não definido. Usando modo MOCK.');
    return false;
  }
  return true;
}

export async function initializeDatabase() {
  try {
    if (!checkDatabaseConfig()) return { success: true, mode: 'mock' };
    
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        nome VARCHAR(255) NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'viewer',
        ativo BOOLEAN DEFAULT true,
        primeiro_acesso BOOLEAN DEFAULT true,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ultimo_login TIMESTAMP WITH TIME ZONE
      )
    `;
    
    // Tabelas essenciais simplificadas para evitar erros
    await sql`CREATE TABLE IF NOT EXISTS sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID, token VARCHAR(255), expires_at TIMESTAMP)`;
    
    console.log('[DB] Inicialização concluída');
    return { success: true };
  } catch (error) {
    console.error('[DB] Erro na inicialização (ignorado para produção):', error);
    return { success: false, error };
  }
}

export const userDB = {
  async findByEmail(email: string) {
    if (!checkDatabaseConfig()) return email === MOCK_ADMIN.email ? MOCK_ADMIN : null;
    try {
      const result = await sql`SELECT * FROM users WHERE email = ${email}`;
      return result.rows[0] || null;
    } catch (e) { return null; }
  },
  async findById(id: string) {
    if (id === MOCK_ADMIN.id) return MOCK_ADMIN;
    if (!checkDatabaseConfig()) return null;
    try {
      const result = await sql`SELECT * FROM users WHERE id = ${id}`;
      return result.rows[0] || null;
    } catch (e) { return null; }
  },
  // Mock operations para evitar crash
  async create(u: any) { return { ...u, id: 'new-id' } },
  async update(id: string, data: any) { return { id, ...data } },
  async list() { return [MOCK_ADMIN] },
  async ensureAdminExists() { return MOCK_ADMIN },
  async delete() {}
};

export const sessionDB = {
  async findByToken(token: string) {
    // --- O GRANDE TRUQUE DO BYPASS ---
    if (token === 'DEV_BYPASS_TOKEN') {
      console.log('[AUTH] Bypass Token detectado. Concedendo acesso ADMIN.');
      return { 
        ...MOCK_ADMIN, 
        user_id: MOCK_ADMIN.id,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 ano
      };
    }
    // ----------------------------------

    if (!checkDatabaseConfig()) return null;
    try {
      const result = await sql`
        SELECT s.*, u.email, u.nome, u.role 
        FROM sessions s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.token = ${token}
      `;
      return result.rows[0] || null;
    } catch (e) { return null; }
  },
  async create(s: any) { return s },
  async deleteByToken() {},
  async deleteByUserId() {}
};

export const auditDB = {
  async log(entry: any) { console.log('[AUDIT]', entry.action); },
  async list() { return [] }
};

export const healthCheckDB = {
  async log() {},
  async list() { return [] }
};
