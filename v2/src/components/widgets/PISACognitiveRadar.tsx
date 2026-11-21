'use client';

import React from 'react';
import { Target, Lightbulb, Compass, Award } from 'lucide-react';

interface PISACognitiveRadarProps {
  insightText?: string;
}

export const PISACognitiveRadar: React.FC<PISACognitiveRadarProps> = ({
  insightText = '1-darajadagi o‘quvchilar bilan individual ishlash va differensial topshiriqlar berish tavsiya etiladi.',
}) => {
  const pisaLevels = [
    { level: '6-Daraja', title: 'Iqtidorli / Mukammal', pct: 90, color: 'bg-purple-500 text-purple-400 border-purple-500/30' },
    { level: '4-5 Daraja', title: 'Yuqori Savodxonlik', pct: 75, color: 'bg-emerald-500 text-emerald-400 border-emerald-500/30' },
    { level: '3-Daraja', title: 'O‘rta O‘zlashtirish', pct: 60, color: 'bg-blue-500 text-blue-400 border-blue-500/30' },
    { level: '2-Daraja', title: 'Bazaviy Savodxonlik', pct: 40, color: 'bg-amber-500 text-amber-400 border-amber-500/30' },
    { level: '1-Daraja', title: 'Xavf Guruhi (Past)', pct: 20, color: 'bg-rose-500 text-rose-400 border-rose-500/30' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* PISA Tabaqalanishi */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-purple-400" />
          OECD PISA 2025/2026 Kognitiv Kompetensiya Pog‘onalari
        </h3>
        <div className="space-y-3">
          {pisaLevels.map((lvl, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${lvl.color}`}>
                  {lvl.level}
                </span>
                <span className="text-xs text-slate-300 font-medium">{lvl.title}</span>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{lvl.pct}% +</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Pedagogik Tavsiyalar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            AI Pedagogik Tavsiya & Metodik Ko‘rsatma
          </h3>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-200 text-sm leading-relaxed">
            {insightText}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-blue-400" />
            O‘zbekiston MMTO va Respublika Ta’lim Markazi mezonlari asosida
          </span>
          <span className="text-emerald-400 font-semibold">Tavsiya faol</span>
        </div>
      </div>
    </div>
  );
};
