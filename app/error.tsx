'use client';

import React, { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro na aplicação:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1128] text-white p-6">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-black mb-4 uppercase tracking-tight">Ocorreu um Erro Inesperado</h2>
        <p className="text-slate-400 mb-8 text-sm">O sistema encontrou uma falha ao carregar este módulo corporativo.</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all"
          >
            Tentar Novamente
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all text-xs"
          >
            Voltar para a Home
          </button>
        </div>
      </div>
    </div>
  );
}
