import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Registra uma atividade no banco de dados do Supabase.
 * Requer uma tabela 'portal_logs' com as colunas: user_id (uuid), action (text), metadata (jsonb)
 */
export async function logActivity(userId: string | undefined, action: string, metadata: any = {}) {
  if (!userId) return;
  
  try {
    const { error } = await supabase
      .from('portal_logs')
      .insert([
        { 
          user_id: userId, 
          action, 
          metadata,
          created_at: new Date().toISOString()
        }
      ]);
      
    if (error) console.error('Erro ao salvar log:', error);
  } catch (err) {
    console.error('Falha na integração de log:', err);
  }
}
