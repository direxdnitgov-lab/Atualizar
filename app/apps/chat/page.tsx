'use client';

import React, { useState, useEffect, useRef } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/lib/supabase';
import { Send, MessageSquare, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface Message {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  profiles?: {
    full_name: string;
    email: string;
    role: string;
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Pega usuário logado
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) {
        setCurrentUser(session?.user || null);
      }
    };
    getCurrentUser();

    // 2. Busca histórico de mensagens
    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            created_at,
            content,
            user_id,
            profiles ( full_name, email, role )
          `)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) {
          if (error.code === '42P01') {
            if (isMounted) setError('A tabela "messages" não existe no Supabase. Por favor, rode o script SQL que acabei de fornecer no chat.');
          } else {
            if (isMounted) setError(`Erro no banco: ${error.message} - DICA: Verifique suas permissões (RLS) ou chaves estrangeiras.`);
          }
        } else if (isMounted) {
          setMessages(data as any || []);
        }
      } catch (err: any) {
        if (isMounted) setError(`Falha geral ao puxar chat: ${err.message}`);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchMessages();

    // 3. Ouve novas mensagens chegando na mesa
    const channel = supabase
      .channel('public-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          // Busca a mensagem completa do banco para ter os dados de perfil
          const { data, error } = await supabase
            .from('messages')
            .select(`
              id,
              created_at,
              content,
              user_id,
              profiles ( full_name, email, role )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data && !error && isMounted) {
            setMessages((prev) => {
              // Se eu próprio enviei, eu já botei na tela. Evita colocar de novo
              if (prev.find(m => m.id === data.id)) return prev;
              return [...prev, data as any];
            });
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Limpa o input no milisegundo que clica (dá impressão de rapidez)

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          content: messageText,
          user_id: currentUser.id
        }])
        .select(`
          id,
          created_at,
          content,
          user_id,
          profiles ( full_name, email, role )
        `)
        .single();

      if (error) {
        setError(`Falha ao arquivar mensagem: ${error.message} - DICA: Verifique a permissão RLS ou chave estrangeira.`);
      } else if (data) {
        // Acopla a mensagem enviada logo na tela
        setMessages((prev) => [...prev, data as any]);
      }
    } catch (err: any) {
      setError(`Falha crítica de conexão: ${err.message}`);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ModuleLayout title="Comunicação Interna" subtitle="DIREX • Módulo de Colaboração">
      <div className="max-w-5xl mx-auto flex flex-col h-[75vh]">
        
        {/* Header do Chat */}
        <div className="bg-white p-6 rounded-t-[32px] border-b border-slate-100 flex items-center gap-4 shrink-0 shadow-sm relative z-10">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Mural Geral</h2>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">
              {messages.length} Mensagens Carregadas
            </p>
          </div>
        </div>

        {/* Corpo das Mensagens */}
        <div className="flex-grow bg-[#f8fafc] overflow-y-auto p-6 md:p-10 space-y-6 flex flex-col relative z-0">
          {error ? (
            <div className="m-auto bg-amber-50 text-amber-700 p-8 rounded-[32px] max-w-lg text-center shadow-xl border border-amber-200">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
              <h3 className="text-lg font-black uppercase mb-2">Banco não configurado</h3>
              <p className="text-sm font-medium leading-relaxed">{error}</p>
            </div>
          ) : loading ? (
            <div className="m-auto flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Puxando mensagens do banco...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="m-auto text-center opacity-40">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Nenhuma mensagem ainda.</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-[2px] mt-2">Dê o primeiro oi!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMine = msg.user_id === currentUser?.id;
              
              // Fallacks de Segurança pro nome
              const senderName = msg.profiles?.full_name || msg.profiles?.email?.split('@')[0] || "Usuário Desconhecido";
              const senderRole = msg.profiles?.role || "USER";

              // Só mostra a linha do nome em cima se for a primeira mensagem ou de uma pessoa diferente da anterior
              const showHeader = index === 0 || messages[index - 1].user_id !== msg.user_id;

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  key={msg.id} 
                  className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  {showHeader && (
                    <div className={`flex items-baseline gap-2 mb-1.5 px-3 select-none ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{senderName}</span>
                      {senderRole === 'ADMIN' && (
                        <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-black tracking-widest uppercase uppercase">Admin</span>
                      )}
                      <span className="text-[9px] font-bold text-slate-300">{formatTime(msg.created_at)}</span>
                    </div>
                  )}
                  
                  <div className={`px-6 py-4 rounded-[28px] text-sm leading-relaxed shadow-sm font-medium
                    ${isMine 
                      ? 'bg-blue-600 text-white rounded-br-sm shadow-blue-200' 
                      : 'bg-white border border-slate-100/50 text-slate-700 rounded-bl-sm shadow-slate-200/50'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white p-6 rounded-b-[32px] border-t border-slate-100 shrink-0 shadow-sm relative z-10">
          <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={error ? "Corrija o banco de dados antes..." : "Digite uma mensagem para a equipe..."}
              disabled={!!error || loading}
              className="flex-grow px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 font-bold"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim() || !!error}
              className="w-full sm:w-16 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed group shrink-0"
            >
              <Send className="w-5 h-5 sm:ml-1 group-hover:translate-x-1 sm:group-hover:-translate-y-1 transition-transform" />
            </button>
          </form>
          <div className="text-center mt-5">
            <p className="text-[9px] font-black uppercase tracking-[3px] text-slate-300 italic">
              Ambiente Seguro • Histórico Auditável
            </p>
          </div>
        </div>
        
      </div>
    </ModuleLayout>
  );
}
