import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface OfflineDB extends DBSchema {
  checklists: {
    key: number
    value: {
      id?: number
      vehicleId: string
      operatorId: string
      items: string
      observations?: string
      createdAt: string
      synced: number
    }
    indexes: { 'by-synced': number }
  }
  supplies: {
    key: number
    value: {
      id?: number
      vehicleId: string
      operatorId: string
      stationId: string
      fuelType: string
      liters: number
      totalValue: number
      createdAt: string
      synced: number
    }
    indexes: { 'by-synced': number }
  }
}

let dbPromise: Promise<IDBPDatabase<OfflineDB>>

export async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>('frota-management', 1, {
      upgrade(db) {
        // Checklists store
        const checklistStore = db.createObjectStore('checklists', {
          keyPath: 'id',
          autoIncrement: true
        })
        checklistStore.createIndex('by-synced', 'synced')

        // Supplies store
        const supplyStore = db.createObjectStore('supplies', {
          keyPath: 'id',
          autoIncrement: true
        })
        supplyStore.createIndex('by-synced', 'synced')
      }
    })
  }
  return dbPromise
}

export interface OfflineChecklist {
  id?: number
  vehicleId: string
  operatorId: string
  items: string
  observations?: string
  createdAt: string
  synced: number
}

export interface OfflineSupply {
  id?: number
  vehicleId: string
  operatorId: string
  stationId: string
  fuelType: string
  liters: number
  totalValue: number
  createdAt: string
  synced: number
}