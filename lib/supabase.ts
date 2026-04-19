import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Resilient storage para ambientes onde localStorage é bloqueado (como iframes no Safari/Mobile)
const isBrowser = typeof window !== 'undefined';
const memoryStorage = {
  items: new Map<string, string>(),
  getItem: (key: string) => memoryStorage.items.get(key) || null,
  setItem: (key: string, value: string) => memoryStorage.items.set(key, value),
  removeItem: (key: string) => memoryStorage.items.delete(key),
};

const getStorage = () => {
  if (!isBrowser) return memoryStorage;
  try {
    window.localStorage.setItem('___test___', 'test');
    window.localStorage.removeItem('___test___');
    return window.localStorage;
  } catch (e) {
    console.warn('localStorage bloqueado, usando memória. A sessão será perdida ao recarregar a página.');
    return memoryStorage;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: false,
    storage: getStorage(),
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
