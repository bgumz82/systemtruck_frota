import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://igpxkbnwecdsnmfjelio.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlncHhrYm53ZWNkc25tZmplbGlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzUxOTY3MCwiZXhwIjoyMDUzMDk1NjcwfQ.BLmhPYtT_VC8a5Q2em9QdAeD_O4FSh3jtGIR4IJaBpY'

// Create client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  db: {
    schema: 'public'
  }
})