'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, FileText, CheckCircle, TrendingUp, 
  Plus, Search, Filter, MoreHorizontal, Loader2, AlertCircle 
} from 'lucide-react';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/lib/supabase';

type RegistroFinanceiro = {
  id: string;
  contrato: string;
  tipo: 'Empenho' | 'Medição';
  data: string;
  valor: number;
  status: 'Pendente' | 'Aprovado' | 'Pago';
  fornecedor: string;
};

const formatMoney = (value: number | string) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue || 0);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch (e) {
    return dateStr;
  }
};

export default function FinanceiroPage() {
  const [registros, setRegistros] = useState<RegistroFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'Todos' | 'Empenho' | 'Medição'>('Todos');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RegistroFinanceiro | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<RegistroFinanceiro>>({});

  useEffect(() => {
    fetchRegistros();
  }, []);

  const fetchRegistros = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financeiro_registros')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw error;
      setRegistros(data || []);
      setDbError(null);
    } catch (err: any) {
      console.error('Erro ao buscar registros:', err);
      if (err.code === '42P01') {
        setDbError('Tabela financeiro_registros não encontrada no Supabase. Execute o script SQL para criá-la.');
      } else {
        setDbError('Erro ao carregar dados. Verifique a conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredData = registros.filter(item => {
    const contrato = item.contrato || '';
    const fornecedor = item.fornecedor || '';
    const id = item.id || '';
    const search = searchTerm || '';

    const matchesSearch = contrato.toLowerCase().includes(search.toLowerCase()) || 
                          fornecedor.toLowerCase().includes(search.toLowerCase()) ||
                          id.toLowerCase().includes(search.toLowerCase());
    const matchesTipo = filterTipo === 'Todos' || item.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  const totalEmpenhado = registros.filter(i => i.tipo === 'Empenho').reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  const totalMedido = registros.filter(i => i.tipo === 'Medição').reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  const saldoPagar = totalEmpenhado - totalMedido;

  const handleOpenModal = (record?: RegistroFinanceiro) => {
    if (record) {
      setEditingRecord(record);
      setFormData(record);
    } else {
      setEditingRecord(null);
      setFormData({
        id: `REG-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        tipo: 'Empenho',
        status: 'Pendente',
        data: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    setFormData({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contrato || !formData.fornecedor || !formData.valor) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }
    
    setIsSaving(true);
    const novoRegistro = formData as RegistroFinanceiro;

    try {
      if (editingRecord) {
        const { error } = await supabase
          .from('financeiro_registros')
          .update(novoRegistro)
          .eq('id', editingRecord.id);
        
        if (error) throw error;
        setRegistros(prev => prev.map(r => r.id === editingRecord.id ? novoRegistro : r));
      } else {
        const { error } = await supabase
          .from('financeiro_registros')
          .insert([novoRegistro]);
          
        if (error) throw error;
        setRegistros(prev => [novoRegistro, ...prev]);
      }
      handleCloseModal();
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar registro: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("Tem certeza que deseja excluir este registro?")) {
      try {
        const { error } = await supabase
          .from('financeiro_registros')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        setRegistros(prev => prev.filter(r => r.id !== id));
      } catch (err: any) {
        console.error('Erro ao excluir:', err);
        alert('Erro ao excluir: ' + err.message);
      }
    }
  };

  if (loading) {
    return (
      <ModuleLayout title="Medição & Empenho" subtitle="DIREX • Módulo Financeiro">
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
          <Loader2 className="w-12 h-12 text-[#1d4ed8] animate-spin mb-4" />
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Carregando dados...</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Sincronizando com Supabase</p>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title="Medição & Empenho" subtitle="DIREX • Módulo Financeiro">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <AnimatePresence>
          {dbError && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-rose-800 font-black uppercase tracking-tight text-sm">Aviso de Banco de Dados</h4>
                  <p className="text-rose-600/80 text-xs font-bold mt-0.5">{dbError}</p>
                </div>
              </div>
              <button 
                onClick={() => alert("Para criar a tabela, execute o SQL fornecido no chat no banco de dados do Supabase.")}
                className="px-4 py-2 bg-white text-rose-600 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 transition-colors whitespace-nowrap"
              >
                Como resolver?
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-50 rounded-full opacity-50 pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Empenhado</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{formatMoney(totalEmpenhado)}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
              <TrendingUp className="w-4 h-4" />
              <span>Acumulado do ano</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-50 rounded-full opacity-50 pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Medido</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{formatMoney(totalMedido)}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>{registros.filter(i => i.tipo === 'Medição').length} medições processadas</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-50 rounded-full opacity-50 pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Saldo a Medir</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{formatMoney(saldoPagar)}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4">
              <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, (saldoPagar / (totalEmpenhado || 1)) * 100))}%` }} />
            </div>
          </motion.div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative z-10">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar contrato, ID ou fornecedor..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            <div className="relative group">
              <button className="h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                <Filter className="w-4 h-4" />
              </button>
              {/* Dropdown de filtro */}
              <div className="absolute left-0 md:right-0 md:left-auto top-full mt-2 w-40 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {(['Todos', 'Empenho', 'Medição'] as const).map(op => (
                  <button 
                    key={op}
                    onClick={() => setFilterTipo(op)}
                    className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors ${filterTipo === op ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-600' : 'text-slate-600 hover:bg-slate-50 border-l-2 border-transparent'}`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="w-full md:w-auto px-6 py-3 bg-[#1d4ed8] hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 uppercase tracking-wide">
            <Plus className="w-4 h-4" />
            Novo Registro
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">ID do Registro</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Tipo</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Contrato & Fornecedor</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Data</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400 text-right">Valor</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {filteredData.map((item, idx) => (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleOpenModal(item)}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-5">
                        <span className="text-sm font-bold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-sm">{item.id}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          item.tipo === 'Empenho' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {item.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-[#1d4ed8]">{item.contrato}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{item.fornecedor}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-medium text-slate-500">{formatDate(item.data)}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-sm font-black text-slate-800">{formatMoney(item.valor)}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                         <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          item.status === 'Pago' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50' :
                          item.status === 'Aprovado' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200/50' :
                          'bg-amber-50 text-amber-600 ring-1 ring-amber-200/50'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'Pago' ? 'bg-emerald-500' :
                            item.status === 'Aprovado' ? 'bg-blue-500' :
                            'bg-amber-500'
                          }`} />
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 uppercase text-[10px] font-black"
                        >
                          Excluir
                        </button>
                      </td>
                    </motion.tr>
                  ))}

                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-50 mb-4 border border-slate-100 shadow-inner">
                          <Search className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-600">Nenhum registro encontrado</p>
                        <p className="text-xs text-slate-400 mt-1">Tente mudar os filtros ou o termo de busca.</p>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal / Forms */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase italic">
                    {editingRecord ? 'Editar Registro' : 'Novo Registro'}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão Financeira</p>
                </div>
                <button onClick={handleCloseModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-slate-500 font-bold">
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="financeForm" onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ID</label>
                      <input 
                        type="text" 
                        value={formData.id} 
                        disabled
                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data</label>
                      <input 
                        type="date"
                        value={formData.data || ''}
                        onChange={(e) => setFormData({...formData, data: e.target.value})}
                        required
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Contrato</label>
                    <input 
                      type="text" 
                      placeholder="Ex: CT-001/2024"
                      value={formData.contrato || ''} 
                      onChange={(e) => setFormData({...formData, contrato: e.target.value})}
                      required
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fornecedor</label>
                    <input 
                      type="text" 
                      placeholder="Nome da empresa"
                      value={formData.fornecedor || ''} 
                      onChange={(e) => setFormData({...formData, fornecedor: e.target.value})}
                      required
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tipo</label>
                      <select 
                        value={formData.tipo || 'Empenho'}
                        onChange={(e) => setFormData({...formData, tipo: e.target.value as 'Empenho' | 'Medição'})}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all"
                      >
                        <option value="Empenho">Empenho</option>
                        <option value="Medição">Medição</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                      <select 
                        value={formData.status || 'Pendente'}
                        onChange={(e) => setFormData({...formData, status: e.target.value as 'Pendente' | 'Aprovado' | 'Pago'})}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all"
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Pago">Pago</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Valor (R$)</label>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.valor || ''} 
                      onChange={(e) => setFormData({...formData, valor: parseFloat(e.target.value) || 0})}
                      required
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#1d4ed8] focus:border-[#1d4ed8] outline-none transition-all"
                    />
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors uppercase tracking-widest disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  form="financeForm"
                  disabled={isSaving}
                  className="px-8 py-2.5 rounded-xl font-bold text-sm text-white bg-[#1d4ed8] hover:bg-blue-700 shadow-md shadow-blue-200 transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuleLayout>
  );
}
