import { createClient } from '@supabase/supabase-js';

// No Vite, usamos import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação de segurança em tempo de execução
if (!supabaseUrl || supabaseUrl === 'undefined') {
  throw new Error("Jarvis Critical Error: VITE_SUPABASE_URL is missing or undefined.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || '');