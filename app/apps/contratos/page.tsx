'use client';

import React from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Search
} from 'lucide-react';

export default function ContratosPage() {
  return (
    <ModuleLayout title="Gestão de Contratos" subtitle="DIREX • Módulo Operacional">
      <div className="space-y-12">
        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <MetricCard 
            icon={<FileText className="w-6 h-6 text-blue-600" />} 
            label="Total Contratos" 
            value="142" 
            trend="+12% este mês"
            color="blue"
          />
          <MetricCard 
            icon={<AlertTriangle className="w-6 h-6 text-amber-600" />} 
            label="Vencimento Próximo" 
            value="08" 
            trend="Ação requerida"
            color="amber"
            warning
          />
          <MetricCard 
            icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />} 
            label="Aditivos Firmados" 
            value="24" 
            trend="+3 novos"
            color="emerald"
          />
          <MetricCard 
            icon={<Clock className="w-6 h-6 text-indigo-600" />} 
            label="Em Medição" 
            value="56" 
            trend="Fluxo normal"
            color="indigo"
          />
        </div>

        {/* Main Grid: List + Alerts */}
        <div className="flex flex-col xl:flex-row gap-10">
          <div className="flex-grow bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Contratos Recentes</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Últimas atualizações do sistema</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold w-64" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrato</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <TableRow id="CTR-2024-001" object="Manutenção Predial" company="Engenharia Total" value="R$ 1.250.000" status="ativo" />
                  <TableRow id="CTR-2024-015" object="Serviços de TI" company="Tech Solution" value="R$ 450.000" status="vencimento" />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}

function MetricCard({ icon, label, value, trend, color, warning }: any) {
  return (
    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
      <div className={`w-12 h-12 bg-${color}-50 rounded-2xl flex items-center justify-center mb-6`}>{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
        <span className={`text-[10px] font-black uppercase tracking-tighter ${warning ? 'text-amber-600' : 'text-emerald-600'}`}>{trend}</span>
      </div>
    </div>
  );
}

function TableRow({ id, object, company, value, status }: any) {
  const styles: any = {
    ativo: "bg-emerald-50 text-emerald-600 border-emerald-100",
    vencimento: "bg-amber-50 text-amber-600 border-amber-100"
  };
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-10 py-8">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-blue-600 uppercase mb-1">{id}</span>
          <span className="font-bold text-slate-800">{object}</span>
        </div>
      </td>
      <td className="px-10 py-8 text-sm">{company}</td>
      <td className="px-10 py-8 font-bold">{value}</td>
      <td className="px-10 py-8">
        <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>{status}</span>
      </td>
    </tr>
  );
}
