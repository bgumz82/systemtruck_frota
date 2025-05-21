import { query } from '@/lib/db'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface DashboardStats {
  totalVeiculos: number
  manutencoesPendentes: number
  checklistsHoje: number
  abastecimentosHoje: number
}

export interface ProximasManutencoes {
  id: string
  tipo: string
  data_prevista: string
  veiculo: {
    placa: string
    modelo: string
  }
}

export interface ConsumoMensal {
  mes: string
  total_litros: number
  valor_total: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const hoje = new Date()
    const inicioDia = format(hoje, 'yyyy-MM-dd 00:00:00')
    const fimDia = format(hoje, 'yyyy-MM-dd 23:59:59')

    // Usar Promise.all para fazer todas as consultas em paralelo
    const [
      totalVeiculos,
      manutencoesPendentes,
      checklistsHoje,
      abastecimentosHoje
    ] = await Promise.all([
      query('SELECT COUNT(*) as total FROM veiculos'),
      query(`
        SELECT COUNT(*) as total 
        FROM manutencoes 
        WHERE data_realizada IS NULL 
        AND data_prevista <= $1
      `, [format(hoje, 'yyyy-MM-dd')]),
      query(`
        SELECT COUNT(*) as total 
        FROM checklists 
        WHERE data_checklist >= $1 
        AND data_checklist <= $2
      `, [inicioDia, fimDia]),
      query(`
        SELECT COUNT(*) as total 
        FROM abastecimentos 
        WHERE data_abastecimento >= $1 
        AND data_abastecimento <= $2
      `, [inicioDia, fimDia])
    ])

    return {
      totalVeiculos: parseInt(totalVeiculos[0].total),
      manutencoesPendentes: parseInt(manutencoesPendentes[0].total),
      checklistsHoje: parseInt(checklistsHoje[0].total),
      abastecimentosHoje: parseInt(abastecimentosHoje[0].total)
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

export async function getProximasManutencoes(): Promise<ProximasManutencoes[]> {
  try {
    const result = await query(`
      SELECT 
        m.id,
        m.tipo,
        m.data_prevista,
        v.placa,
        v.modelo
      FROM manutencoes m
      JOIN veiculos v ON m.veiculo_id = v.id
      WHERE m.data_realizada IS NULL
      ORDER BY m.data_prevista ASC
      LIMIT 5
    `)

    return result.map(item => ({
      id: item.id,
      tipo: item.tipo,
      data_prevista: item.data_prevista,
      veiculo: {
        placa: item.placa,
        modelo: item.modelo
      }
    }))
  } catch (error) {
    console.error('Error fetching próximas manutenções:', error)
    throw error
  }
}

export async function getConsumoMensal(): Promise<ConsumoMensal[]> {
  try {
    const result = await query(`
      WITH meses AS (
        SELECT generate_series(
          date_trunc('year', CURRENT_DATE),
          date_trunc('month', CURRENT_DATE),
          '1 month'::interval
        ) as mes
      )
      SELECT 
        TO_CHAR(m.mes, 'YYYY-MM') as mes,
        COALESCE(SUM(a.litros), 0) as total_litros,
        COALESCE(SUM(a.valor_total), 0) as valor_total
      FROM meses m
      LEFT JOIN abastecimentos a ON 
        TO_CHAR(a.data_abastecimento, 'YYYY-MM') = TO_CHAR(m.mes, 'YYYY-MM')
      GROUP BY TO_CHAR(m.mes, 'YYYY-MM')
      ORDER BY mes
    `)

    return result.map(item => ({
      mes: format(new Date(item.mes + '-01'), 'MMM/yyyy', { locale: ptBR }),
      total_litros: parseFloat(item.total_litros),
      valor_total: parseFloat(item.valor_total)
    }))
  } catch (error) {
    console.error('Error fetching consumo mensal:', error)
    throw error
  }
}