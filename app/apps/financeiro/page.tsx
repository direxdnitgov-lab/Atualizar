'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Construction } from 'lucide-react';
import ModuleLayout from '@/components/ModuleLayout';

export default function FinanceiroPage() {
  return (
    <ModuleLayout title="Medição & Empenho" subtitle="DIREX • Módulo Financeiro">
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mb-8"
        >
          <Construction className="w-12 h-12" />
        </motion.div>
        
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic mb-4">
          Módulo em Implantação
        </h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-8 max-w-sm mx-auto leading-relaxed">
          Este sistema está em fase de implantação técnica pela equipe de TI. 
          Em breve estará disponível para acompanhamento de medições e empenhos.
        </p>
      </div>
    </ModuleLayout>
  );
}
