import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1128] text-white p-6">
      <div className="text-center">
        <h2 className="text-4xl font-black mb-4">404</h2>
        <p className="text-slate-400 mb-8">Página não encontrada no Portal DIREX.</p>
        <Link 
          href="/" 
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all"
        >
          Voltar ao Portal
        </Link>
      </div>
    </div>
  );
}
