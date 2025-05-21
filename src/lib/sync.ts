import { getOfflineChecklists, getOfflineSupplies, markChecklistAsSynced, markSupplyAsSynced } from './api/offline'
import { query } from './db'
import toast from 'react-hot-toast'

export async function syncOfflineData() {
  try {
    // Sync checklists
    const offlineChecklists = await getOfflineChecklists()
    
    for (const checklist of offlineChecklists) {
      try {
        const result = await query(`
          INSERT INTO checklists (
            veiculo_id,
            operador_id,
            itens,
            observacoes,
            data_checklist
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [
          checklist.vehicleId,
          checklist.operatorId,
          checklist.items,
          checklist.observations,
          checklist.createdAt
        ])

        if (result && checklist.id) {
          await markChecklistAsSynced(checklist.id)
        }
      } catch (error) {
        console.error('Error syncing checklist:', error)
      }
    }

    // Sync supplies
    const offlineSupplies = await getOfflineSupplies()
    
    for (const supply of offlineSupplies) {
      try {
        const result = await query(`
          INSERT INTO abastecimentos (
            veiculo_id,
            operador_id,
            posto_id,
            tipo_combustivel,
            litros,
            valor_total,
            data_abastecimento
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          supply.vehicleId,
          supply.operatorId,
          supply.stationId,
          supply.fuelType,
          supply.liters,
          supply.totalValue,
          supply.createdAt
        ])

        if (result && supply.id) {
          await markSupplyAsSynced(supply.id)
        }
      } catch (error) {
        console.error('Error syncing supply:', error)
      }
    }

    // Count remaining unsynced items
    const pendingChecklists = (await getOfflineChecklists()).length
    const pendingSupplies = (await getOfflineSupplies()).length

    if (pendingChecklists === 0 && pendingSupplies === 0) {
      toast.success('Todos os dados foram sincronizados!')
    } else {
      toast.error(`${pendingChecklists + pendingSupplies} registros pendentes de sincronização`)
    }
  } catch (error) {
    console.error('Error in syncOfflineData:', error)
    toast.error('Erro ao sincronizar dados')
  }
}

// Listen for online status changes
export function setupSyncListener() {
  window.addEventListener('online', () => {
    syncOfflineData()
  })
}

// Initialize sync listener
setupSyncListener()