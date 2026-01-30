import { createClient } from '@supabase/supabase-js';

// Tenta ler do ambiente, se falhar usa a string direta (Plano B)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mmbatzhqzjpxdmqrrvgf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tYmF0emhxempweGRtcXJydmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjE1NzgsImV4cCI6MjA4NDk5NzU3OH0.jzql4S6b1RYPnkojgvATZdxNtM1f5f6rJkbZah7-fr0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("Jarvis: ConexÃ£o inicializada com URL:", supabaseUrl);
