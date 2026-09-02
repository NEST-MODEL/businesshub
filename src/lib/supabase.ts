import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly and clearly instead of a cryptic runtime error later.
  console.error(
    'Supabase env vars отсутствуют. Проверь website/.env — см. docs/SETUP.md'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
