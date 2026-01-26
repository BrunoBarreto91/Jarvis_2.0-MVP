import { createClient } from '@supabase/supabase-js';

// Captura as variáveis
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// LOG DE DEPURAÇÃO (Aparecerá no console do seu navegador)
console.log("--- Jarvis Connection Debug ---");
console.log("URL length:", supabaseUrl?.length || 0);
console.log("URL starts with https:", supabaseUrl?.startsWith('https'));
console.log("-------------------------------");

if (!supabaseUrl || supabaseUrl.length < 10) {
  // Se chegar aqui, o problema é 100% no Vercel/Build
  throw new Error("Jarvis Critical: VITE_SUPABASE_URL está vazia ou mal configurada no Vercel.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || '');