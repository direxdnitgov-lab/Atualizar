import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: false,
  },
});

/**
 * Registra uma atividade no banco de dados do Supabase.
 * Requer uma tabela 'portal_logs' com as colunas: user_id (uuid), action (text), metadata (jsonb)
 */
export async function logActivity(userId: string | undefined, action: string, metadata: any = {}) {
  // Log activity is disabled to prevent database errors and UI crashes
  return;
}
