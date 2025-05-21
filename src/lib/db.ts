import axios from 'axios'

// Helper function for queries
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  try {
    const response = await axios.post('/api/db/query', {
      query: text,
      params
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth.token')}`
      }
    })
    return response.data.rows
  } catch (error) {
    console.error('Erro na consulta ao banco de dados:', error)
    throw error
  }
}

// Get single row or null
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  try {
    const rows = await query<T>(text, params)
    return rows[0] || null
  } catch (error) {
    console.error('Erro na consulta ao banco de dados:', error)
    throw error
  }
}

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    const response = await axios.get('/api/health', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth.token')}`
      }
    })
    return response.data.status === 'ok'
  } catch (error) {
    console.error('Erro na conexão com o banco de dados:', error)
    return false
  }
}