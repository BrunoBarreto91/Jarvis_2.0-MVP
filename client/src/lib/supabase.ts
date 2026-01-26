import { createClient } from '@supabase/supabase-js';

// No Amplify/Vite, usamos import.meta.env
const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Atenção: Variáveis de ambiente do Supabase não encontradas.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');