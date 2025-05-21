import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';

const { Pool } = pg;

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function createAdminUser() {
  try {
    const password = '@@1234'; // Senha padrão do admin
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Gerar UUID para o ID
    const idResult = await pool.query('SELECT gen_random_uuid() as id');
    const id = idResult.rows[0].id;
    
    const now = new Date().toISOString();
    
    const result = await pool.query(`
      INSERT INTO public.usuarios (
        id,
        email,
        nome,
        tipo,
        ativo,
        created_at,
        updated_at,
        encrypted_password
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO UPDATE SET
        encrypted_password = $8,
        updated_at = $7
      RETURNING id, email, nome, tipo
    `, [
      id,
      'bruno@systemtruck.com.br',
      'Administrador',
      'admin',
      true,
      now,
      now,
      hashedPassword
    ]);

    console.log('Usuário admin criado/atualizado com sucesso:', result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();