'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Shield, LogOut, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface ModuleLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function ModuleLayout({ children, title, subtitle }: ModuleLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    let isMounted = true;

    // Busca a sessão inicial com segurança e não faz redirecionamento forçado no código síncrono.
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Erro ao buscar sessão:", error);
      }
      if (isMounted) {
        if (session?.user) {
          setUser(session.user);
        }
        setLoading(false);
      }
    });

    // Escuta as mudanças de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        if (session?.user) {
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Evita erros de hidratação garantindo que o conteúdo inicial corresponda ao servidor
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Fallback visual muito mais seguro (sem redirecionamentos loopados)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a] p-6">
        <div className="bg-white p-10 rounded-[32px] max-w-md w-full text-center shadow-2xl flex flex-col items-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">Acesso Negado</h2>
          <p className="text-slate-500 font-medium mb-8">
            Sua sessão não foi confirmada pelo servidor ou você foi desconectado.
          </p>
          <Link 
            href="/"
            className="w-full py-4 bg-[#1d4ed8] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Menu Principal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900">
      <header className="bg-[#1e293b] text-white py-6 sticky top-0 z-30 shadow-xl">
        <div className="max-w-[1440px] mx-auto px-6 md:px-[48px] flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all border border-white/10 group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div className="h-10 w-px bg-white/10 hidden md:block" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white border border-blue-400 shadow-lg shadow-blue-500/20">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-black text-xl tracking-tighter uppercase italic leading-none">{title}</h1>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">{subtitle}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div className="hidden sm:block">
              <p className="text-xs font-black text-white italic uppercase leading-none mb-1">{user.email?.split('@')[0]}</p>
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Acesso Seguro</p>
            </div>
            <button 
              onClick={() => {
                router.push('/');
              }}
              className="w-10 h-10 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-[1440px] mx-auto w-full p-6 md:p-[48px]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {children}
        </motion.div>
      </main>
      <footer className="py-8 bg-[#0f172a] border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <p className="text-white/20 text-[10px] font-black uppercase tracking-[5px] italic">
            Portal Logístico DIREX
          </p>
        </div>
      </footer>
    </div>
  );
}
