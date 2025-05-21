import { createClient } from '@supabase/supabase-js'
import pkg from 'pg'
import * as dotenv from 'dotenv'
const { Pool } = pkg

// Load environment variables
dotenv.config()

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
}

// Create client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Configuração do banco de dados de destino
const targetPool = new Pool({
  user: 'postgres',
  host: 'db.systemtruck.com.br',
  database: 'frota_management',
  password: 'bytecross8682',
  port: 5454,
  ssl: false,
  // Aumentar timeouts para operações longas
  statement_timeout: 0,
  query_timeout: 0,
  connectionTimeoutMillis: 0,
  idle_in_transaction_session_timeout: 0
})

// Função auxiliar para fazer consultas com retry e logging
async function fetchWithRetry(tableName: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Buscando dados da tabela ${tableName}...`)
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error(`Erro ao buscar dados da tabela ${tableName}:`, error)
        throw error
      }

      console.log(`Dados encontrados na tabela ${tableName}:`, data?.length || 0, 'registros')
      return data || []
    } catch (error) {
      console.error(`Tentativa ${i + 1} falhou para tabela ${tableName}:`, error)
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  return []
}

async function migrateData() {
  try {
    console.log('Iniciando migração...')

    // Verificar conexão com Supabase
    const { data: testData, error: testError } = await supabase.auth.getSession()
    if (testError) {
      throw new Error(`Erro ao conectar com Supabase: ${testError.message}`)
    }
    console.log('Conexão com Supabase estabelecida com sucesso')

    // 1. Migrar funcionários
    console.log('Migrando funcionários...')
    const funcionarios = await fetchWithRetry('funcionarios')
    
    if (funcionarios.length > 0) {
      console.log(`Encontrados ${funcionarios.length} funcionários para migrar`)
      for (const funcionario of funcionarios) {
        try {
          await targetPool.query(`
            INSERT INTO funcionarios (
              id, nome, cpf, rg, matricula, data_admissao, data_nascimento,
              telefone, foto_url, funcao, ativo, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (id) DO UPDATE SET
              nome = EXCLUDED.nome,
              cpf = EXCLUDED.cpf,
              rg = EXCLUDED.rg,
              matricula = EXCLUDED.matricula,
              data_admissao = EXCLUDED.data_admissao,
              data_nascimento = EXCLUDED.data_nascimento,
              telefone = EXCLUDED.telefone,
              foto_url = EXCLUDED.foto_url,
              funcao = EXCLUDED.funcao,
              ativo = EXCLUDED.ativo,
              updated_at = EXCLUDED.updated_at
          `, [
            funcionario.id,
            funcionario.nome,
            funcionario.cpf,
            funcionario.rg,
            funcionario.matricula,
            funcionario.data_admissao,
            funcionario.data_nascimento,
            funcionario.telefone,
            funcionario.foto_url,
            funcionario.funcao,
            funcionario.ativo,
            funcionario.created_at,
            funcionario.updated_at
          ])
          console.log(`Funcionário ${funcionario.nome} migrado com sucesso`)
        } catch (error) {
          console.error(`Erro ao migrar funcionário ${funcionario.nome}:`, error)
        }
      }
    } else {
      console.log('Nenhum funcionário encontrado para migrar')
    }

    // 2. Migrar usuários (incluindo auth.users)
    console.log('Migrando usuários...')
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Erro ao buscar usuários do auth:', authError)
    } else if (authUsers) {
      console.log(`Encontrados ${authUsers.length} usuários auth para migrar`)
      
      for (const authUser of authUsers) {
        try {
          // Primeiro insere na tabela auth.users
          await targetPool.query(`
            INSERT INTO auth.users (
              instance_id,
              id,
              aud,
              role,
              email,
              encrypted_password,
              email_confirmed_at,
              last_sign_in_at,
              raw_app_meta_data,
              raw_user_meta_data,
              is_super_admin,
              created_at,
              updated_at,
              phone,
              phone_confirmed_at,
              confirmation_token,
              recovery_token,
              email_change_token_new,
              email_change,
              email_change_token_current,
              email_change_confirm_status,
              banned_until,
              reauthentication_token,
              refresh_token
            ) VALUES (
              '00000000-0000-0000-0000-000000000000',
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
              NULL, NULL, '', '', '', '', '', 0, NULL, '', ''
            )
            ON CONFLICT (id) DO UPDATE SET
              email = EXCLUDED.email,
              encrypted_password = EXCLUDED.encrypted_password,
              email_confirmed_at = EXCLUDED.email_confirmed_at,
              last_sign_in_at = EXCLUDED.last_sign_in_at,
              raw_app_meta_data = EXCLUDED.raw_app_meta_data,
              raw_user_meta_data = EXCLUDED.raw_user_meta_data,
              updated_at = EXCLUDED.updated_at
          `, [
            authUser.id,
            'authenticated',
            'authenticated',
            authUser.email,
            authUser.encrypted_password,
            authUser.email_confirmed_at,
            authUser.last_sign_in_at,
            JSON.stringify(authUser.app_metadata),
            JSON.stringify(authUser.user_metadata),
            false,
            authUser.created_at,
            authUser.updated_at
          ])
          console.log(`Usuário auth ${authUser.email} migrado com sucesso`)
        } catch (error) {
          console.error(`Erro ao migrar usuário auth ${authUser.email}:`, error)
        }
      }
    }

    // Agora migra os dados da tabela usuarios
    const users = await fetchWithRetry('usuarios')
    
    if (users.length > 0) {
      console.log(`Encontrados ${users.length} usuários para migrar`)
      for (const user of users) {
        try {
          await targetPool.query(`
            INSERT INTO usuarios (
              id, email, nome, tipo, ativo, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
              email = EXCLUDED.email,
              nome = EXCLUDED.nome,
              tipo = EXCLUDED.tipo,
              ativo = EXCLUDED.ativo,
              updated_at = EXCLUDED.updated_at
          `, [
            user.id,
            user.email,
            user.nome,
            user.tipo,
            user.ativo,
            user.created_at,
            user.updated_at
          ])
          console.log(`Usuário ${user.email} migrado com sucesso`)
        } catch (error) {
          console.error(`Erro ao migrar usuário ${user.email}:`, error)
        }
      }
    }

    // 3. Migrar checklists e fotos
    console.log('Migrando checklists...')
    const checklists = await fetchWithRetry('checklists')
    
    if (checklists.length > 0) {
      console.log(`Encontrados ${checklists.length} checklists para migrar`)
      for (const checklist of checklists) {
        try {
          await targetPool.query(`
            INSERT INTO checklists (
              id, veiculo_id, operador_id, data_checklist,
              itens, observacoes, email_enviado, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
              veiculo_id = EXCLUDED.veiculo_id,
              operador_id = EXCLUDED.operador_id,
              data_checklist = EXCLUDED.data_checklist,
              itens = EXCLUDED.itens,
              observacoes = EXCLUDED.observacoes,
              email_enviado = EXCLUDED.email_enviado
          `, [
            checklist.id,
            checklist.veiculo_id,
            checklist.operador_id,
            checklist.data_checklist,
            checklist.itens,
            checklist.observacoes,
            checklist.email_enviado,
            checklist.created_at
          ])
          console.log(`Checklist ${checklist.id} migrado com sucesso`)

          // Migrar fotos do checklist
          const { data: photos, error: photosError } = await supabase
            .from('checklist_fotos')
            .select('*')
            .eq('checklist_id', checklist.id)

          if (photosError) {
            console.error(`Erro ao buscar fotos do checklist ${checklist.id}:`, photosError)
          } else if (photos) {
            for (const photo of photos) {
              try {
                await targetPool.query(`
                  INSERT INTO checklist_fotos (
                    id, checklist_id, tipo, url, created_at
                  ) VALUES ($1, $2, $3, $4, $5)
                  ON CONFLICT (id) DO UPDATE SET
                    tipo = EXCLUDED.tipo,
                    url = EXCLUDED.url
                `, [
                  photo.id,
                  photo.checklist_id,
                  photo.tipo,
                  photo.url,
                  photo.created_at
                ])
                console.log(`Foto ${photo.id} do checklist ${checklist.id} migrada com sucesso`)
              } catch (error) {
                console.error(`Erro ao migrar foto ${photo.id} do checklist ${checklist.id}:`, error)
              }
            }
          }
        } catch (error) {
          console.error(`Erro ao migrar checklist ${checklist.id}:`, error)
        }
      }
    }

    // 4. Migrar abastecimentos
    console.log('Migrando abastecimentos...')
    const supplies = await fetchWithRetry('abastecimentos')
    
    if (supplies.length > 0) {
      console.log(`Encontrados ${supplies.length} abastecimentos para migrar`)
      for (const supply of supplies) {
        try {
          await targetPool.query(`
            INSERT INTO abastecimentos (
              id, veiculo_id, operador_id, posto_id, tipo_combustivel,
              litros, valor_total, data_abastecimento, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
              veiculo_id = EXCLUDED.veiculo_id,
              operador_id = EXCLUDED.operador_id,
              posto_id = EXCLUDED.posto_id,
              tipo_combustivel = EXCLUDED.tipo_combustivel,
              litros = EXCLUDED.litros,
              valor_total = EXCLUDED.valor_total,
              data_abastecimento = EXCLUDED.data_abastecimento
          `, [
            supply.id,
            supply.veiculo_id,
            supply.operador_id,
            supply.posto_id,
            supply.tipo_combustivel,
            supply.litros,
            supply.valor_total,
            supply.data_abastecimento,
            supply.created_at
          ])
          console.log(`Abastecimento ${supply.id} migrado com sucesso`)
        } catch (error) {
          console.error(`Erro ao migrar abastecimento ${supply.id}:`, error)
        }
      }
    }

    console.log('Migração concluída com sucesso!')
  } catch (error) {
    console.error('Erro durante a migração:', error)
    throw error
  } finally {
    await targetPool.end()
  }
}

// Executar migração
migrateData().catch(console.error)