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
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', full_name: '', role: 'USER' });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

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
    setFeedback(null);

    // Nota: No Supabase Client padrão, signUp cria um usuário mas o faz logar.
    // Para criar usuários como Admin, o ideal é usar o Dashboard do Supabase ou Edge Functions.
    // Aqui simularemos a inserção na tabela de perfis e daremos a instrução ao usuário.
    
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          status: 'Prata',
          id: Math.random().toString(36).substring(2) // Apenas para mock/perfil
        }]);

      if (error) throw error;

      setFeedback({ 
        type: 'success', 
        message: 'Perfil criado com sucesso! Lembre-se de criar a conta de autenticação no Dashboard do Supabase.' 
      });
      setShowAddModal(false);
      setNewUser({ email: '', full_name: '', role: 'USER' });
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao criar perfil.' });
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
                          <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
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

              <form onSubmit={handleCreateUser} className="p-10 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                    placeholder="Ex: João da Silva"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">E-mail Corporativo</label>
                  <input 
                    required
                    type="email" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="joao@direx.gov.br"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nível de Acesso</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold appearance-none"
                  >
                    <option value="USER">USUÁRIO PADRÃO</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-grow py-5 bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-grow py-5 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
                  >
                    Salvar Perfil
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 text-center font-bold px-6 leading-relaxed">
                  Ao salvar, o perfil será adicionado ao banco de dados. Você precisará ativar o acesso no painel do Supabase.
                </p>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModuleLayout>
  );
}
