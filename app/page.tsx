'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search,
  Grid,
  Shield,
  Zap,
  Lock,
  History,
  Activity,
  AlertCircle,
  Users,
  BarChart3,
  ShoppingBag,
  MessageSquare,
  Mail,
  Calendar,
  LogOut,
  ArrowRight,
  Settings
} from 'lucide-react';
import { supabase, logActivity } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// --- Types ---
interface AppConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  url: string;
  adminOnly?: boolean;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  avatar_color: string;
}

interface ActivityLog {
  id: string;
  created_at: string;
  action: string;
  metadata: any;
}

// --- Mock Data ---
const APPS: AppConfig[] = [
  {
    id: 'crm',
    name: 'Gestão de Contratos',
    description: 'Controle total de vigência, aditivos e documentação.',
    icon: Users,
    color: 'bg-[#1d4ed8]',
    url: '/apps/contratos'
  },
  {
    id: 'erp',
    name: 'Medição & Empenho',
    description: 'Acompanhamento financeiro e liberação de recursos.',
    icon: BarChart3,
    color: 'bg-[#1e3a8a]',
    url: '/apps/financeiro'
  },
  {
    id: 'store',
    name: 'Almoxarifado',
    description: 'Gestão de estoque e solicitações de materiais.',
    icon: ShoppingBag,
    color: 'bg-[#3b82f6]',
    url: '/apps/estoque'
  },
  {
    id: 'chat',
    name: 'Comunicação Interna',
    description: 'Chat seguro para alinhamento entre departamentos.',
    icon: MessageSquare,
    color: 'bg-[#2563eb]',
    url: '/apps/chat'
  },
  {
    id: 'email',
    name: 'Notificações',
    description: 'Alertas automáticos de prazos e vencimentos.',
    icon: Mail,
    color: 'bg-[#1e40af]',
    url: '/apps/notificacoes'
  },
  {
    id: 'calendar',
    name: 'Cronograma de Medição',
    description: 'Calendário de vistorias e entregas técnicas.',
    icon: Calendar,
    color: 'bg-[#1d4ed8]',
    url: '/apps/agenda'
  },
  {
    id: 'admin',
    name: 'Administração',
    description: 'Gestão de usuários, permissões e configurações do sistema.',
    icon: Settings,
    color: 'bg-[#0f172a]',
    url: '/apps/admin',
    adminOnly: true
  }
];

// Fallback profiles matching DIREX design
const MOCK_PROFILES: Profile[] = [
  { id: '1', email: 'marcus@direx.gov.br', full_name: 'Marcus', role: 'ADMIN', status: 'Diamante', avatar_color: 'bg-orange-500' },
  { id: '4', email: 'engmarcus1@gmail.com', full_name: 'Marcus Admin', role: 'ADMIN', status: 'Diamante', avatar_color: 'bg-orange-500' },
  { id: '2', email: 'maria.santos@direx.gov.br', full_name: 'Maria Santos', role: 'USER', status: 'Ouro', avatar_color: 'bg-blue-600' },
  { id: '3', email: 'joao.oliveira@direx.gov.br', full_name: 'João Oliveira', role: 'USER', status: 'Prata', avatar_color: 'bg-indigo-600' }
];

export default function PortalPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [appStatuses, setAppStatuses] = useState<Record<string, 'online' | 'offline' | 'checking'>>({});
  const [loginError, setLoginError] = useState<string | null>(null);

  const router = useRouter();

  const fetchLogs = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('portal_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) setActivities(data);
    } catch {
      console.log('Tabela de logs não encontrada no Supabase.');
    }
  };

  const checkAppsConnectivity = async () => {
    // Initial state: checking
    const initialStatuses: Record<string, 'checking'> = {};
    APPS.forEach(app => initialStatuses[app.id] = 'checking');
    setAppStatuses(initialStatuses);

    // Simulate real connectivity check with delay for each app
    APPS.forEach(async (app, index) => {
      // Small random delay to feel like a real network check
      await new Promise(resolve => setTimeout(resolve, 800 + (index * 400)));
      
      // For demo purposes, systems are online if they are in the list.
      // In a real scenario, we could fetch(app.url)
      setAppStatuses(prev => ({
        ...prev,
        [app.id]: 'online'
      }));
    });
  };

  useEffect(() => {
    const initPortal = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      // Try fetching profiles from Supabase if table exists
      try {
        const { data: dbProfiles } = await supabase.from('profiles').select('*');
        if (dbProfiles && dbProfiles.length > 0) setProfiles(dbProfiles);
      } catch {
        console.log('Tabela de perfis não encontrada, usando mock.');
      }

      if (session?.user) {
        fetchLogs(session.user.id);
      }
      
      // Check connectivity for each app
      checkAppsConnectivity();
      
      setLoading(false);
    };

    initPortal();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchLogs(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setLoginError('Credenciais inválidas. Verifique seu e-mail e senha.');
    } else if (data.user) {
      await logActivity(data.user.id, 'LOGIN', { ip: 'Portal Web' });
    }
  };

  const handleLogout = async () => {
    if (user) await logActivity(user.id, 'LOGOUT');
    await supabase.auth.signOut();
  };

  const handleAccessApp = async (app: AppConfig) => {
    // Redireciona imediatamente sem checar, deixando a página de destino validar o auth
    router.push(app.url);
  };

  const filteredApps = APPS.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Mostra apps de admin apenas se o perfil atual for ADMIN
    // Buscamos o perfil mock correspondente ao email do usuário atual
    const currentProfile = profiles.find(p => p.email === user?.email);
    const isUserAdmin = currentProfile?.role === 'ADMIN';
    
    if (app.adminOnly && !isUserAdmin) return false;
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a1128]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- Login View ---
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a1128] bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[size:24px_24px]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-5xl lg:h-[700px] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row shadow-blue-900/40"
        >
          {/* Left Side - Info */}
          <div className="w-full lg:w-[40%] bg-[#1d4ed8] p-8 md:p-12 text-white flex flex-col">
            <div className="mb-16">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-white/20">
                  <Shield className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight">DIREX</h1>
                  <p className="text-sm text-blue-100/70 font-medium">Sistema de Contratos</p>
                </div>
              </div>
            </div>

            <div className="space-y-10 flex-grow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Gestão Completa</h3>
                  <p className="text-sm text-blue-50/70 leading-relaxed">Controle total de contratos, medições e empenhos</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Acesso Rápido</h3>
                  <p className="text-sm text-blue-50/70 leading-relaxed">Interface intuitiva e responsiva</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Seguro</h3>
                  <p className="text-sm text-blue-50/70 leading-relaxed">Níveis de acesso por função</p>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-white/10">
              <p className="text-sm font-medium opacity-80 mb-1">Desenvolvido por <span className="font-bold uppercase tracking-tight">Marcus Augustus</span></p>
              <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold">© {new Date().getFullYear()} DIREX - Todos os direitos reservados</p>
            </div>
          </div>

          {/* Right Side - Profile Selection */}
          <div className="w-full lg:w-[60%] bg-white p-6 md:p-12 flex flex-col overflow-y-auto max-h-[600px] lg:max-h-none">
            <div className="mb-8 lg:mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2 md:mb-3">Bem-vindo!</h2>
              <p className="text-slate-500 font-medium text-sm md:text-base">Selecione seu perfil e faça login</p>
            </div>

            <div className="space-y-4 mb-8">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Selecione seu usuário</h4>
              
              {profiles.map((p) => (
                <button 
                  key={p.id}
                  onClick={() => {
                     setEmail(p.email);
                  }}
                  className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all text-left ${email === p.email ? 'border-primary ring-2 ring-primary/10 bg-blue-50/30' : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full ${p.avatar_color || 'bg-slate-500'} flex items-center justify-center text-white font-bold text-lg uppercase`}>
                      {p.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800">{p.full_name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${p.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          {p.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{p.email}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">
                      {p.status === 'Diamante' ? '💎 Diamante' : p.status === 'Ouro' ? '🥇 Ouro' : '🥈 Prata'}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mb-6">
              <AnimatePresence>
                {loginError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-xs font-bold"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {loginError}
                  </motion.div>
                )}
              </AnimatePresence>
              {email && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Senha Corporativa</label>
                  <input 
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && email && password) {
                        handleLogin(e);
                      }
                    }}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              )}
              <button 
                onClick={handleLogin}
                disabled={!email || !password}
                className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 shadow-xl ${email && password ? 'bg-[#1d4ed8] text-white hover:bg-blue-700 shadow-blue-200' : 'bg-[#d1d5db] text-slate-400 cursor-not-allowed'}`}
              >
                <Lock className="w-5 h-5" />
                Entrar no Sistema
              </button>
            </div>

            <div className="mt-auto p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
              <h5 className="font-bold text-blue-900 text-sm mb-1 italic">Precisa de ajuda?</h5>
              <p className="text-xs text-blue-700/60 mb-4">Entre em contato com o administrador do sistema.</p>
              <button className="w-full py-3 bg-[#1d4ed8] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
                <MessageSquare className="w-4 h-4" />
                Enviar Mensagem ao Admin
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- Dashboard View ---
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#1d4ed8] min-h-[70px] md:h-[80px] sticky top-0 z-20 shadow-lg">
        <div className="max-w-[1440px] mx-auto px-6 md:px-[48px] h-full flex items-center justify-between py-3 md:py-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white backdrop-blur-sm border border-white/20">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="font-black text-2xl tracking-tighter text-white uppercase italic">DIREX</h1>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowLogs(!showLogs)}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${showLogs ? 'bg-white text-[#1d4ed8] border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
              title="Logs de Atividade"
            >
              <History className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Audit Trail</span>
            </button>
            
            <div className="h-8 w-px bg-white/20 mx-2" />

            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-white leading-none mb-1 uppercase tracking-tighter italic">Marcus ADMIN</p>
              <p className="text-blue-100/60 text-[10px] uppercase font-bold tracking-widest">{user.email}</p>
            </div>
            
            <button 
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors bg-white/10 rounded-xl border border-white/20 hover:bg-rose-600 hover:border-rose-500"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-[1440px] mx-auto w-full p-6 md:p-[48px] flex flex-col lg:flex-row gap-8 md:gap-10">
        
        {/* Apps Grid Section */}
        <div className={`flex-grow transition-all duration-300 ${showLogs ? 'lg:w-[65%]' : 'w-full'}`}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-6 md:h-8 bg-[#1d4ed8] rounded-full" />
                <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">Painel de Sistemas</h2>
              </div>
              <p className="text-slate-500 text-sm md:text-lg font-medium pl-4">Ecossistema integrado de gestão DIREX.</p>
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Pesquisar módulo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[24px] focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm text-slate-800 font-bold shadow-sm"
              />
            </div>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-8 ${showLogs ? 'xl:grid-cols-2' : 'lg:grid-cols-3 xl:grid-cols-4'}`}>
            <AnimatePresence>
              {filteredApps.map((app, idx) => (
                <motion.div
                  key={app.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  whileHover={{ y: -8 }}
                  onClick={() => handleAccessApp(app)}
                  className="group cursor-pointer"
                >
                  <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl hover:border-[#1d4ed8] hover:shadow-blue-200/50 transition-all flex flex-col h-[300px] relative overflow-hidden">
                    {/* Background Decorative Element */}
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full group-hover:bg-blue-50 transition-colors" />
                    
                    <div className={`w-14 h-14 ${app.color} rounded-[24px] flex items-center justify-center text-white mb-6 shadow-lg shadow-current/30 group-hover:scale-110 transition-transform relative z-10`}>
                      <app.icon className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-900 mb-2 truncate uppercase tracking-tight relative z-10">{app.name}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4 font-medium relative z-10">{app.description}</p>
                    
                    <div className="mt-auto flex items-center gap-3 text-[12px] font-black text-[#1d4ed8] uppercase tracking-[2px] group-hover:gap-4 transition-all relative z-10">
                      Entrar no Sistema
                      <ArrowRight className="w-5 h-5" />
                    </div>

                    <div className="absolute top-10 right-10 flex items-center gap-1.5 opacity-100 transition-opacity">
                      {appStatuses[app.id] === 'checking' ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-slate-200 animate-pulse" />
                          <span className="text-[10px] font-black text-slate-400 uppercase">Conectando...</span>
                        </>
                      ) : appStatuses[app.id] === 'online' ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          <span className="text-[10px] font-black text-emerald-600 uppercase">Online</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-rose-500" />
                          <span className="text-[10px] font-black text-rose-600 uppercase">Offline</span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Logs Section */}
        <AnimatePresence>
          {showLogs && (
            <motion.aside
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="w-full lg:w-[35%] bg-white rounded-[32px] md:rounded-[48px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col lg:h-[calc(100vh-176px)] lg:sticky lg:top-[128px]"
            >
              <div className="p-6 md:p-10 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-[#1d4ed8]" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-[2px] text-sm italic">Audit Trail</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monitoramento em tempo real</p>
                  </div>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-10 space-y-10">
                {activities.length > 0 ? (
                  activities.map((log) => (
                    <div key={log.id} className="relative pl-10 border-l-2 border-slate-100 group">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-[#1d4ed8]" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2 font-mono bg-slate-50 self-start px-2 py-1 rounded">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </span>
                        <p className="text-base font-black text-slate-800 mb-2 group-hover:text-[#1d4ed8] transition-colors leading-tight">
                          {log.action === 'LOGIN' ? '🔐 ACESSO AO PORTAL' : 
                           log.action === 'LOGOUT' ? '🚪 LOGOFF DO SISTEMA' : 
                           `📂 MÓDULO: ${log.metadata.app_name}`}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter">Autenticação Válida via DIREX-SYS</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-32">
                    <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                      <History className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-black text-xs uppercase tracking-[3px]">Aguardando atividades...</p>
                  </div>
                )}
              </div>
              
              <div className="p-10 bg-slate-50/50 border-t border-slate-100 mt-auto">
                <button className="w-full py-5 bg-[#1d4ed8] text-white font-black uppercase tracking-[3px] text-xs rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
                  Relatório Completo
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-10 bg-[#1d4ed8] border-t border-white/10 mt-auto shadow-[0_-4px_10px_rgba(29,78,216,0.1)]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[5px] mb-4">
            Sistema Integrado DIREX • Gestão de Segurança Corporativa
          </p>
          <div className="h-0.5 w-12 bg-white/20 rounded-full" />
        </div>
      </footer>
    </div>
  );
}
