'use client';

import React, { useState } from 'react';
import { Send, Sparkles, MessageSquare, Database, ArrowRight, Bot, Loader2 } from 'lucide-react';

interface ChatSidebarProps {
  onSendPrompt: (prompt: string) => Promise<void>;
  isLoading: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ onSendPrompt, isLoading }) => {
  const [input, setInput] = useState('');

  const quickPrompts = [
    'Umumiy maktablar va CHSB ko‘rsatkichlarini ko‘rsat',
    '11-sinflar va boshqa sinflar kesimida CHSB natijalari',
    'Past o‘zlashtirgan o‘quvchilar ro‘yxati va PISA darajalari',
    'Bloom taksonomiyasi va savollar kognitiv qiyinligi tahlili',
    'Maktablarni sifat ko‘rsatkichi bo‘yicha solishtir va reyting ber',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendPrompt(input);
    setInput('');
  };

  return (
    <aside className="w-full lg:w-96 bg-slate-900/90 border-r border-slate-800 flex flex-col h-full shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              CHSB School AI
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md">
                v2
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">OpenDashboards + Generative UI</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-semibold">Online</span>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Tezkor Savollar (AI Tahlil):
        </span>
        <div className="flex flex-col gap-1.5">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onSendPrompt(q)}
              disabled={isLoading}
              className="text-left text-xs p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/10 transition-all flex items-center justify-between group disabled:opacity-50"
            >
              <span className="truncate pr-2">{q}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Educational Domain Badge */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs text-slate-400">
        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
          <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
            <Database className="w-4 h-4 text-cyan-400" />
            Ulanish Holati:
          </div>
          <p className="text-[11px] text-slate-400">
            CHSB maktab baholash tizimi bazasiga to‘g‘ridan-to‘g‘ri ulangan. 20 nafar o‘quvchi va 19 ta rasmiy imtihon natijalari real vaqtda tahlil qilinmoqda.
          </p>
        </div>
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-950/80">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Maktab yoki sinf haqida savol bering..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-11 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 transition-all"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </aside>
  );
};
