'use client';

import React, { useState, useEffect } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  UserPlus, 
  ExternalLink, 
  ShieldCheck, 
  Mail, 
  Trash2, 
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at?: string;
  allowed_apps?: string[];
}

const AVAILABLE_MODULES = [
  { id: 'crm', name: 'Gestão de Contratos' },
  { id: 'erp', name: 'Medição & Empenho' },
  { id: 'store', name: 'Almoxarifado' },
  { id: 'chat', name: 'Comunicação Interna' },
  { id: 'email', name: 'Notificações' },
  { id: 'calendar', name: 'Cronograma de Medição' }
];

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newUser, setNewUser] = useState({ email: '', full_name: '', role: 'USER', allowed_apps: [] as string[] });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    checkAdminAccess();
    fetchUsers();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return; // Will be handled by the layout now
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (profile && profile.role !== 'ADMIN') {
      window.location.href = '/'; // kick non-admin out back to home
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Tenta buscar da tabela de perfis
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setUsers(data);
      } else {
        // Fallback para mocks se a tabela não existir
        setUsers([
          { id: '1', email: 'marcus@direx.gov.br', full_name: 'Marcus', role: 'ADMIN', status: 'Diamante', created_at: new Date().toISOString() },
          { id: '4', email: 'engmarcus1@gmail.com', full_name: 'Marcus Admin', role: 'ADMIN', status: 'Diamante', created_at: new Date().toISOString() },
          { id: '2', email: 'maria.santos@direx.gov.br', full_name: 'Maria Santos', role: 'USER', status: 'Ouro', created_at: new Date().toISOString() },
          { id: '3', email: 'joao.oliveira@direx.gov.br', full_name: 'João Oliveira', role: 'USER', status: 'Prata', created_at: new Date().toISOString() }
        ]);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mostramos a instrução correta para criação segura de conta
    setFeedback({ 
      type: 'success', 
      message: 'Por questões de segurança estrutural de Chave Estrangeira, novos usuários devem ser adicionados na aba "Authentication -> Add user" do painel Supabase. Após criar o e-mail/senha lá, o perfil aparecerá nesta tabela automaticamente para você editar as permissões.' 
    });
    
    // Fechamos o modal após instruir
    setTimeout(() => {
      setShowAddModal(false);
      setNewUser({ email: '', full_name: '', role: 'USER', allowed_apps: [] });
    }, 8000);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFeedback(null);

    // Na tabela "profiles", atualiza quais aplicativos a pessoa tem acesso e níveis
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editingUser.full_name,
          role: editingUser.role,
          allowed_apps: editingUser.allowed_apps
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setFeedback({ type: 'success', message: 'Permissões atualizadas com sucesso!' });
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      
      // If column does not exist because user hasn't run the script
      if (err.message && err.message.includes('column "allowed_apps"')) {
         setFeedback({ 
            type: 'error', 
            message: 'Erro crítico: A coluna "allowed_apps" não existe no Supabase. Por favor, execute o código SQL pendente no Editor.' 
         });
      } else {
         setFeedback({ type: 'error', message: 'Erro ao atualizar permissões do usuário.' });
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const supabaseDashboardUrl = `https://supabase.com/dashboard/project/_/auth/users`;

  return (
    <ModuleLayout title="Administração do Sistema" subtitle="DIREX • Gestão de Acessos">
      <div className="space-y-8">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Gestão de Usuários</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Controle de quem acessa o portal</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a 
              href={supabaseDashboardUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg text-xs uppercase tracking-widest"
            >
              <ExternalLink className="w-4 h-4" />
              Contas Supabase
            </a>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg text-xs uppercase tracking-widest shadow-blue-200"
            >
              <UserPlus className="w-4 h-4" />
              Novo Usuário
            </button>
          </div>
        </div>

        {/* Feedback Message */}
        <AnimatePresence>
          {feedback && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}
            >
              {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {feedback.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters & Table */}
        <div className="bg-white rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all">
                <Filter className="w-4 h-4" />
              </button>
              <div className="h-6 w-px bg-slate-200" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredUsers.length} Usuários Encontrados</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesso</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Cadastro</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando usuários...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold bg-[#1e293b] group-hover:scale-110 transition-transform`}>
                            {user.full_name?.charAt(0) || user.email?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{user.full_name || 'Usuário Sem Nome'}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-300" />
                              <p className="text-[11px] text-slate-400 font-medium">{user.email}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${user.role === 'ADMIN' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className={`w-4 h-4 ${user.status === 'Diamante' ? 'text-blue-500' : user.status === 'Ouro' ? 'text-amber-500' : 'text-slate-300'}`} />
                          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter">{user.status}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[11px] font-mono text-slate-400">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingUser({ ...user, allowed_apps: user.allowed_apps || [] });
                              setShowEditModal(true);
                            }}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center mb-2">
                          <Users className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Nenhum usuário encontrado</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supabase Dashboard Integration Hint */}
        <div className="p-8 bg-blue-600 rounded-[32px] md:rounded-[40px] text-white flex flex-col md:flex-row items-center gap-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="w-20 h-20 bg-white/20 rounded-[32px] flex items-center justify-center shrink-0 border border-white/20">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="flex-grow z-10 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic">Integração Supabase Auth</h3>
            <p className="text-blue-100 text-sm mt-2 leading-relaxed max-w-2xl font-medium">
              Este painel gerencia os <span className="font-black text-white italic">Perfis de Usuário</span> (dados corporativos). 
              Para gerenciar as <span className="font-black text-white italic">Contas de Acesso</span> (e-mail, senha, recuperação), 
              utilize o Dashboard oficial do Supabase em "Authentication".
            </p>
          </div>
          <a 
            href={supabaseDashboardUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-[2px] hover:bg-blue-50 transition-all shadow-xl group z-10 shrink-0"
          >
            Acessar Auth Admin
            <ExternalLink className="w-4 h-4 inline-block ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Novo Usuário</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Defina o perfil de acesso</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-500 transition-all"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-10 text-center space-y-6">
                
                {feedback && (
                  <div className={`p-4 rounded-2xl text-xs font-bold leading-relaxed mb-6 ${
                    feedback.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {feedback.message}
                  </div>
                )}

                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                
                <h4 className="text-lg font-black text-slate-800 uppercase italic">Criação de Contas</h4>
                
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                  Por razões de segurança, toda nova conta corporativa deve ser criada diretamente no painel de Autenticação do Supabase. 
                  Ao criar uma conta lá (e-mail e senha), o perfil aparecerá nesta tabela automaticamente para você editar as permissões.
                </p>

                <div className="pt-6 flex flex-col gap-3">
                  <a 
                    href={supabaseDashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all flex items-center justify-center shadow-lg shadow-blue-200"
                  >
                    Ir para o Supabase Auth
                  </a>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditModal && editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                    <Edit3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Editar Permissões</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{editingUser.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-500 transition-all"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="p-10 space-y-6 overflow-y-auto">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    value={editingUser.full_name}
                    onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 outline-none transition-all placeholder:text-slate-300 font-bold"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nível de Acesso</label>
                  <select 
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-100 outline-none transition-all font-bold appearance-none"
                  >
                    <option value="USER">USUÁRIO PADRÃO</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Módulos Liberados</label>
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_MODULES.map(module => (
                      <label key={module.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                        <input 
                          type="checkbox"
                          checked={(editingUser.allowed_apps || []).includes(module.id)}
                          onChange={(e) => {
                            const currentApps = editingUser.allowed_apps || [];
                            if (e.target.checked) {
                              setEditingUser({ ...editingUser, allowed_apps: [...currentApps, module.id] });
                            } else {
                              setEditingUser({ ...editingUser, allowed_apps: currentApps.filter(id => id !== module.id) });
                            }
                          }}
                          className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                        />
                        <span className="text-xs font-bold text-slate-700 leading-none">{module.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                   <button
                    type="button"
                    onClick={async () => {
                      if(window.confirm(`Deseja enviar um e-mail de redefinição de senha para ${editingUser.email}?`)){
                        const { error } = await supabase.auth.resetPasswordForEmail(editingUser.email);
                        if(error) {
                          alert(`Erro ao solicitar redefinição: ${error.message}`);
                        } else {
                          alert(`E-mail de redefinição de senha enviado para ${editingUser.email} com sucesso!`);
                        }
                      }
                    }}
                    className="w-full py-4 bg-slate-100/50 hover:bg-slate-100 text-slate-600 font-bold uppercase tracking-widest text-[10px] rounded-2xl transition-all border border-slate-200 flex items-center justify-center gap-2"
                   >
                     Solicitar Redefinição de Senha por E-mail
                   </button>
                   <p className="text-[9px] text-center text-slate-400 uppercase font-bold px-2">Por segurança, senhas só podem ser alteradas direto no Painel Supabase ou validando o e-mail.</p>
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-grow py-5 bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-grow py-5 bg-amber-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-amber-200 hover:bg-amber-600 transition-all"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModuleLayout>
  );
}
