import { query, queryOne } from '../db'

// Cache key for vehicles
const VEHICLES_CACHE_KEY = 'vehicles_cache'

export interface Vehicle {
  id: string
  placa: string
  tipo: 'carro' | 'caminhao' | 'maquina_pesada' | 'implementos' | 'onibus'
  marca: string
  modelo: string
  ano: number
  qrcode_data: string
  created_at: string
  updated_at: string
}

export interface VehicleInsert {
  placa: string
  tipo: 'carro' | 'caminhao' | 'maquina_pesada' | 'implementos' | 'onibus'
  marca: string
  modelo: string
  ano: number
  qrcode_data: string
}

// Save vehicles to cache
const saveVehiclesToCache = (vehicles: Vehicle[]) => {
  try {
    localStorage.setItem(VEHICLES_CACHE_KEY, JSON.stringify(vehicles))
  } catch (error) {
    console.error('Erro ao salvar veículos no cache:', error)
  }
}

// Get vehicles from cache
const getVehiclesFromCache = (): Vehicle[] => {
  try {
    const cached = localStorage.getItem(VEHICLES_CACHE_KEY)
    return cached ? JSON.parse(cached) : []
  } catch (error) {
    console.error('Erro ao obter veículos do cache:', error)
    return []
  }
}

export async function getVehicles() {
  try {
    if (navigator.onLine) {
      const vehicles = await query(`
        SELECT *
        FROM veiculos
        ORDER BY created_at DESC
      `)

      if (vehicles) {
        saveVehiclesToCache(vehicles)
      }

      return vehicles
    }

    return getVehiclesFromCache()
  } catch (error) {
    console.error('Erro ao buscar veículos:', error)
    return getVehiclesFromCache()
  }
}

export async function getVehicle(id: string) {
  try {
    if (navigator.onLine) {
      const vehicle = await queryOne(`
        SELECT *
        FROM veiculos
        WHERE id = $1
      `, [id])

      return vehicle
    }

    const vehicles = getVehiclesFromCache()
    return vehicles.find(v => v.id === id) || null
  } catch (error) {
    console.error('Erro ao buscar veículo:', error)
    const vehicles = getVehiclesFromCache()
    return vehicles.find(v => v.id === id) || null
  }
}

export async function getVehicleByPlate(placa: string) {
  try {
    if (navigator.onLine) {
      const vehicle = await queryOne(`
        SELECT *
        FROM veiculos
        WHERE placa = $1
      `, [placa])

      return vehicle
    }

    const vehicles = getVehiclesFromCache()
    return vehicles.find(v => v.placa === placa) || null
  } catch (error) {
    console.error('Erro ao buscar veículo pela placa:', error)
    const vehicles = getVehiclesFromCache()
    return vehicles.find(v => v.placa === placa) || null
  }
}

export async function getVehicleByQRCode(qrcode: string) {
  try {
    const placa = qrcode.replace('vehicle_', '')
    
    if (navigator.onLine) {
      const vehicle = await queryOne(`
        SELECT *
        FROM veiculos
        WHERE placa = $1
      `, [placa])

      if (!vehicle) {
        throw new Error('Veículo não encontrado')
      }

      return vehicle
    }

    const vehicles = getVehiclesFromCache()
    const vehicle = vehicles.find(v => v.placa === placa)
    
    if (!vehicle) {
      throw new Error('Veículo não encontrado no cache local')
    }
    
    return vehicle
  } catch (error) {
    console.error('Erro ao buscar veículo por QR Code:', error)
    throw error
  }
}

export async function createVehicle(vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) {
  const result = await queryOne(`
    INSERT INTO veiculos (
      placa,
      tipo,
      marca,
      modelo,
      ano,
      qrcode_data
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [
    vehicle.placa,
    vehicle.tipo,
    vehicle.marca,
    vehicle.modelo,
    vehicle.ano,
    `vehicle_${vehicle.placa}`
  ])

  return result
}

export async function updateVehicle(id: string, vehicle: Partial<Vehicle>) {
  const result = await queryOne(`
    UPDATE veiculos
    SET
      placa = COALESCE($1, placa),
      tipo = COALESCE($2, tipo),
      marca = COALESCE($3, marca),
      modelo = COALESCE($4, modelo),
      ano = COALESCE($5, ano),
      qrcode_data = CASE 
        WHEN $1 IS NOT NULL THEN 'vehicle_' || $1
        ELSE qrcode_data
      END,
      updated_at = NOW()
    WHERE id = $6
    RETURNING *
  `, [
    vehicle.placa,
    vehicle.tipo,
    vehicle.marca,
    vehicle.modelo,
    vehicle.ano,
    id
  ])

  return result
}

export async function deleteVehicle(id: string) {
  await query('DELETE FROM veiculos WHERE id = $1', [id])
}