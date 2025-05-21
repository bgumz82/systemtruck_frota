export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          email: string
          nome: string
          tipo: 'admin' | 'operador_abastecimento' | 'operador_checklist'
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          nome: string
          tipo: 'admin' | 'operador_abastecimento' | 'operador_checklist'
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nome?: string
          tipo?: 'admin' | 'operador_abastecimento' | 'operador_checklist'
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      funcionarios: {
        Row: {
          id: string
          nome: string
          cpf: string
          rg: string
          matricula: string
          data_admissao: string
          data_nascimento: string
          telefone: string | null
          foto_url: string | null
          funcao: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cpf: string
          rg: string
          matricula: string
          data_admissao: string
          data_nascimento: string
          telefone?: string | null
          foto_url?: string | null
          funcao: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cpf?: string
          rg?: string
          matricula?: string
          data_admissao?: string
          data_nascimento?: string
          telefone?: string | null
          foto_url?: string | null
          funcao?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      veiculos: {
        Row: {
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
        Insert: {
          id?: string
          placa: string
          tipo: 'carro' | 'caminhao' | 'maquina_pesada' | 'implementos' | 'onibus'
          marca: string
          modelo: string
          ano: number
          qrcode_data: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          placa?: string
          tipo?: 'carro' | 'caminhao' | 'maquina_pesada' | 'implementos' | 'onibus'
          marca?: string
          modelo?: string
          ano?: number
          qrcode_data?: string
          created_at?: string
          updated_at?: string
        }
      }
      postos: {
        Row: {
          id: string
          nome: string
          endereco: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          endereco: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          endereco?: string
          created_at?: string
          updated_at?: string
        }
      }
      abastecimentos: {
        Row: {
          id: string
          veiculo_id: string
          operador_id: string
          posto_id: string
          tipo_combustivel: 'gasolina' | 'diesel' | 'etanol' | 'gnv'
          litros: number
          valor_total: number
          data_abastecimento: string
          created_at: string
        }
        Insert: {
          id?: string
          veiculo_id: string
          operador_id: string
          posto_id: string
          tipo_combustivel: 'gasolina' | 'diesel' | 'etanol' | 'gnv'
          litros: number
          valor_total: number
          data_abastecimento: string
          created_at?: string
        }
        Update: {
          id?: string
          veiculo_id?: string
          operador_id?: string
          posto_id?: string
          tipo_combustivel?: 'gasolina' | 'diesel' | 'etanol' | 'gnv'
          litros?: number
          valor_total?: number
          data_abastecimento?: string
          created_at?: string
        }
      }
      manutencoes: {
        Row: {
          id: string
          veiculo_id: string
          tipo: string
          descricao: string
          data_prevista: string
          data_realizada: string | null
          alerta_enviado: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          veiculo_id: string
          tipo: string
          descricao: string
          data_prevista: string
          data_realizada?: string | null
          alerta_enviado?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          veiculo_id?: string
          tipo?: string
          descricao?: string
          data_prevista?: string
          data_realizada?: string | null
          alerta_enviado?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      checklists: {
        Row: {
          id: string
          veiculo_id: string
          operador_id: string
          data_checklist: string
          itens: string
          observacoes: string | null
          email_enviado: boolean
          created_at: string
        }
        Insert: {
          id?: string
          veiculo_id: string
          operador_id: string
          data_checklist: string
          itens: string | Json
          observacoes?: string | null
          email_enviado?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          veiculo_id?: string
          operador_id?: string
          data_checklist?: string
          itens?: string | Json
          observacoes?: string | null
          email_enviado?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}