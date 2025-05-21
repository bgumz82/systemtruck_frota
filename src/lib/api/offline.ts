import { getDB, type OfflineChecklist, type OfflineSupply } from '@/lib/db/indexedDB'
import type { ChecklistItem } from '@/lib/api/checklists'

export async function saveOfflineChecklist(checklistData: {
  veiculo_id: string
  operador_id: string
  data_checklist: string
  itens: ChecklistItem[]
  observacoes?: string
}): Promise<boolean> {
  try {
    const db = await getDB()
    await db.add('checklists', {
      vehicleId: checklistData.veiculo_id,
      operatorId: checklistData.operador_id,
      items: JSON.stringify(checklistData.itens),
      observations: checklistData.observacoes,
      createdAt: checklistData.data_checklist,
      synced: 0
    })
    return true
  } catch (error) {
    console.error('Error saving offline checklist:', error)
    return false
  }
}

export async function saveOfflineSupply(supplyData: {
  vehicleId: string
  operatorId: string
  stationId: string
  fuelType: string
  liters: number
  totalValue: number
}): Promise<boolean> {
  try {
    const db = await getDB()
    await db.add('supplies', {
      ...supplyData,
      createdAt: new Date().toISOString(),
      synced: 0
    })
    return true
  } catch (error) {
    console.error('Error saving offline supply:', error)
    return false
  }
}

export async function getOfflineChecklists(): Promise<OfflineChecklist[]> {
  const db = await getDB()
  return db.getAllFromIndex('checklists', 'by-synced', 0)
}

export async function getOfflineSupplies(): Promise<OfflineSupply[]> {
  const db = await getDB()
  return db.getAllFromIndex('supplies', 'by-synced', 0)
}

export async function markChecklistAsSynced(id: number): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('checklists', 'readwrite')
  const checklist = await tx.store.get(id)
  if (checklist) {
    checklist.synced = 1
    await tx.store.put(checklist)
  }
  await tx.done
}

export async function markSupplyAsSynced(id: number): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('supplies', 'readwrite')
  const supply = await tx.store.get(id)
  if (supply) {
    supply.synced = 1
    await tx.store.put(supply)
  }
  await tx.done
}