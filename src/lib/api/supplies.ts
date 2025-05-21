import { query, queryOne } from '@/lib/db'

export interface Supply {
  id: string
  veiculo_id: string
  operador_id: string
  posto_id: string
  tipo_combustivel: 'gasolina' | 'diesel' | 'etanol' | 'gnv'
  litros: number
  valor_total: number
  data_abastecimento: string
  created_at: string
  veiculo?: {
    placa: string
    modelo: string
  }
  posto?: {
    nome: string
  }
  operador?: {
    nome: string
  }
}

export interface SupplyInsert {
  veiculo_id: string
  operador_id: string
  posto_id: string
  tipo_combustivel: 'gasolina' | 'diesel' | 'etanol' | 'gnv'
  litros: number
  valor_total: number
  data_abastecimento: string
}

export async function getSupplies() {
  const supplies = await query(`
    SELECT 
      a.*,
      v.placa as veiculo_placa,
      v.modelo as veiculo_modelo,
      p.nome as posto_nome,
      u.email as operador_email
    FROM abastecimentos a
    JOIN veiculos v ON a.veiculo_id = v.id
    JOIN postos p ON a.posto_id = p.id
    JOIN auth.users u ON a.operador_id = u.id
    ORDER BY a.data_abastecimento DESC
  `)

  return supplies.map(supply => ({
    ...supply,
    veiculo: {
      placa: supply.veiculo_placa,
      modelo: supply.veiculo_modelo
    },
    posto: {
      nome: supply.posto_nome
    },
    operador: {
      nome: supply.operador_email
    }
  }))
}

export async function createSupply(supply: SupplyInsert) {
  const result = await queryOne(`
    INSERT INTO abastecimentos (
      veiculo_id,
      operador_id,
      posto_id,
      tipo_combustivel,
      litros,
      valor_total,
      data_abastecimento
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    supply.veiculo_id,
    supply.operador_id,
    supply.posto_id,
    supply.tipo_combustivel,
    supply.litros,
    supply.valor_total,
    supply.data_abastecimento
  ])

  return result
}

export async function getVehicles() {
  return await query(`
    SELECT id, placa, modelo
    FROM veiculos
    ORDER BY placa
  `)
}

export async function getStations() {
  return await query(`
    SELECT id, nome
    FROM postos
    ORDER BY nome
  `)
}