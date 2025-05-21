import { query, queryOne } from '@/lib/db'
import { hash } from 'bcryptjs'

export interface User {
  id: string
  email: string
  nome: string
  tipo: 'admin' | 'operador_abastecimento' | 'operador_checklist'
  ativo: boolean
  created_at: string
  updated_at: string
}

const SALT_ROUNDS = 10

export async function getUsers() {
  return await query(`
    SELECT u.*, au.email
    FROM usuarios u
    JOIN auth.users au ON u.id = au.id
    ORDER BY u.created_at DESC
  `)
}

export async function createUser(userData: { 
  email: string;
  password: string;
  nome: string;
  tipo: 'admin' | 'operador_abastecimento' | 'operador_checklist';
}) {
  try {
    // First check if user already exists
    const existingUser = await queryOne(
      'SELECT id FROM usuarios WHERE email = $1',
      [userData.email]
    )

    if (existingUser) {
      throw new Error('Email já cadastrado')
    }

    // Hash password
    const hashedPassword = await hash(userData.password, SALT_ROUNDS)

    // Create user
    const result = await query(`
      WITH new_auth_user AS (
        INSERT INTO auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          created_at,
          updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          uuid_generate_v4(),
          'authenticated',
          'authenticated',
          $1,
          $2,
          NOW(),
          '{"provider": "email", "providers": ["email"]}'::jsonb,
          jsonb_build_object('tipo', $3),
          NOW(),
          NOW()
        ) RETURNING id
      )
      INSERT INTO usuarios (id, email, nome, tipo)
      SELECT id, $1, $4, $3
      FROM new_auth_user
      RETURNING *
    `, [userData.email, hashedPassword, userData.tipo, userData.nome])

    return result[0]
  } catch (error) {
    console.error('Error in createUser:', error)
    throw error
  }
}

export async function updateUser(id: string, userData: Partial<User>) {
  try {
    const fields = Object.keys(userData)
    const values = Object.values(userData)
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
    
    const result = await queryOne(
      `UPDATE usuarios 
       SET ${setClause}, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, ...values]
    )

    return result
  } catch (error) {
    console.error('Error in updateUser:', error)
    throw error
  }
}

export async function deleteUser(id: string) {
  try {
    await query(`
      WITH deleted_auth AS (
        DELETE FROM auth.users WHERE id = $1
      )
      DELETE FROM usuarios WHERE id = $1
    `, [id])
  } catch (error: any) {
    console.error('Error in deleteUser:', error)
    throw error
  }
}