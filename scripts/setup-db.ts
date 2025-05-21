import pkg from 'pg'
import * as dotenv from 'dotenv'

const { Pool } = pkg

// Load environment variables
dotenv.config()

// Function to execute queries with error handling
async function executeQuery(client: pkg.PoolClient, query: string) {
  try {
    await client.query(query)
  } catch (error) {
    console.error('Error executing query:', error)
    throw error
  }
}

async function setupDatabase() {
  const pool = new Pool({
    user: 'postgres',
    host: 'db.systemtruck.com.br',
    database: 'postgres',
    password: 'bytecross8682',
    port: 5454,
    ssl: false
  })

  let client = await pool.connect()
  
  try {
    // Create database if it doesn't exist
    await executeQuery(client, `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'frota_management') THEN
          CREATE DATABASE frota_management;
        END IF;
      END
      $$;
    `)

    // Release client and close pool
    await client.release()
    await pool.end()

    // Connect to frota_management database
    const dbPool = new Pool({
      user: 'postgres',
      host: 'db.systemtruck.com.br',
      database: 'frota_management',
      password: 'bytecross8682',
      port: 5454,
      ssl: false
    })

    client = await dbPool.connect()

    // Create extensions
    await executeQuery(client, 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    await executeQuery(client, 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";')

    // Create enums
    await executeQuery(client, `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_usuario') THEN
          CREATE TYPE tipo_usuario AS ENUM ('admin', 'operador_abastecimento', 'operador_checklist');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_veiculo') THEN
          CREATE TYPE tipo_veiculo AS ENUM ('carro', 'caminhao', 'maquina_pesada', 'implementos', 'onibus');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_combustivel') THEN
          CREATE TYPE tipo_combustivel AS ENUM ('gasolina', 'diesel', 'etanol', 'gnv');
        END IF;
      END
      $$;
    `)

    // Drop views if they exist to avoid conflicts
    await executeQuery(client, `
      DROP VIEW IF EXISTS vw_abastecimentos_report;
      DROP VIEW IF EXISTS vw_checklists_report;
    `)

    // Create schema and tables
    await executeQuery(client, `
      -- Create auth schema if it doesn't exist
      CREATE SCHEMA IF NOT EXISTS auth;

      -- Create auth.users table
      CREATE TABLE IF NOT EXISTS auth.users (
        instance_id uuid,
        id uuid PRIMARY KEY,
        aud text,
        role text,
        email text UNIQUE,
        encrypted_password text,
        email_confirmed_at timestamptz,
        last_sign_in_at timestamptz,
        raw_app_meta_data jsonb,
        raw_user_meta_data jsonb,
        is_super_admin boolean,
        created_at timestamptz,
        updated_at timestamptz,
        phone text,
        phone_confirmed_at timestamptz,
        confirmation_token text,
        recovery_token text,
        email_change_token_new text,
        email_change text,
        email_change_token_current text,
        email_change_confirm_status smallint,
        banned_until timestamptz,
        reauthentication_token text,
        refresh_token text
      );

      -- Create usuarios table
      CREATE TABLE IF NOT EXISTS usuarios (
        id uuid PRIMARY KEY REFERENCES auth.users(id),
        email text UNIQUE NOT NULL,
        nome text NOT NULL,
        tipo tipo_usuario NOT NULL,
        ativo boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Create funcionarios table
      CREATE TABLE IF NOT EXISTS funcionarios (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome text NOT NULL,
        cpf text UNIQUE NOT NULL,
        rg text NOT NULL,
        matricula text UNIQUE NOT NULL,
        data_admissao date NOT NULL,
        data_nascimento date NOT NULL,
        telefone text,
        foto_url text,
        funcao text NOT NULL,
        ativo boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Create veiculos table
      CREATE TABLE IF NOT EXISTS veiculos (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        placa text UNIQUE NOT NULL,
        tipo tipo_veiculo NOT NULL,
        marca text NOT NULL,
        modelo text NOT NULL,
        ano integer NOT NULL,
        qrcode_data text UNIQUE NOT NULL,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Create postos table
      CREATE TABLE IF NOT EXISTS postos (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome text NOT NULL,
        endereco text NOT NULL,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Create abastecimentos table
      CREATE TABLE IF NOT EXISTS abastecimentos (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        veiculo_id uuid REFERENCES veiculos(id) NOT NULL,
        operador_id uuid REFERENCES auth.users(id) NOT NULL,
        posto_id uuid REFERENCES postos(id) NOT NULL,
        tipo_combustivel tipo_combustivel NOT NULL,
        litros numeric(10,2) NOT NULL,
        valor_total numeric(10,2) NOT NULL,
        data_abastecimento timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz DEFAULT now()
      );

      -- Create manutencoes table
      CREATE TABLE IF NOT EXISTS manutencoes (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        veiculo_id uuid REFERENCES veiculos(id) NOT NULL,
        tipo text NOT NULL,
        descricao text NOT NULL,
        data_prevista date NOT NULL,
        data_realizada date,
        alerta_enviado boolean DEFAULT false,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Create checklists table
      CREATE TABLE IF NOT EXISTS checklists (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        veiculo_id uuid REFERENCES veiculos(id) NOT NULL,
        operador_id uuid REFERENCES auth.users(id) NOT NULL,
        data_checklist timestamptz NOT NULL DEFAULT now(),
        itens jsonb NOT NULL,
        observacoes text,
        email_enviado boolean DEFAULT false,
        created_at timestamptz DEFAULT now()
      );

      -- Create checklist_fotos table
      CREATE TABLE IF NOT EXISTS checklist_fotos (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        checklist_id uuid REFERENCES checklists(id) ON DELETE CASCADE NOT NULL,
        tipo text NOT NULL,
        url text NOT NULL,
        created_at timestamptz DEFAULT now()
      );
    `)

    // Create views after all tables are created
    await executeQuery(client, `
      CREATE VIEW vw_abastecimentos_report AS
      SELECT 
        a.id,
        a.data_abastecimento,
        a.tipo_combustivel,
        a.litros,
        a.valor_total,
        a.operador_id,
        v.placa as veiculo_placa,
        v.modelo as veiculo_modelo,
        p.nome as posto_nome,
        u.email as operador_email
      FROM abastecimentos a
      JOIN veiculos v ON a.veiculo_id = v.id
      JOIN postos p ON a.posto_id = p.id
      JOIN auth.users u ON a.operador_id = u.id;

      CREATE VIEW vw_checklists_report AS
      SELECT 
        c.id,
        c.data_checklist,
        c.itens,
        c.observacoes,
        c.operador_id,
        c.veiculo_id,
        v.placa as veiculo_placa,
        v.modelo as veiculo_modelo,
        u.email as operador_email
      FROM checklists c
      JOIN veiculos v ON c.veiculo_id = v.id
      JOIN auth.users u ON c.operador_id = u.id;
    `)

    console.log('Database setup completed successfully!')
  } catch (error) {
    console.error('Error setting up database:', error)
    throw error
  } finally {
    if (client) {
      await client.release()
    }
    if (pool) {
      await pool.end()
    }
  }
}

// Run setup
setupDatabase().catch(console.error)