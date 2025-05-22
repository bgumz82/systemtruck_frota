import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim()
    })
    
    if (error) {
      throw error
    }
    
    if (!data.user) {
      throw new Error('Resposta inválida do servidor')
    }
    
    return data
  } catch (error: any) {
    console.error('Erro de autenticação:', {
      message: error.message,
      name: error.name,
      status: error.status
    })
    
    if (error.message === 'Invalid login credentials') {
      throw new Error('Email ou senha incorretos')
    }
    
    if (error.status === 404) {
      throw new Error('Serviço de autenticação indisponível')
    }
    
    throw new Error('Erro ao fazer login. Tente novamente.')
  }
}

export async function getCurrentUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user || null
  } catch (error: any) {
    console.error('Erro ao obter usuário atual:', error)
    return null
  }
}