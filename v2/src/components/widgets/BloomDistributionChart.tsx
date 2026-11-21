'use client';

import React, { useState } from 'react';
import { Brain, Layers, CheckCircle, AlertCircle, ArrowUpRight, BarChart3 } from 'lucide-react';

export interface BloomItem {
  bloom_level: string;
  difficulty?: string;
  total_questions: number;
  total_points: number;
  avg_points?: number;
  mastery_percentage?: number;
}

interface BloomDistributionChartProps {
  data: Record<string, unknown>[];
  insightText?: string;
  onSelectLevel?: (level: string | null) => void;
  selectedLevel?: string | null;
}

const BLOOM_METADATA: Record<
  string,
  { label: string; pisaLevel: string; desc: string; color: string; bg: string; border: string; barColor: string }
> = {
  KNOWLEDGE: {
    label: 'Bilish & Eslab Qolish',
    pisaLevel: 'PISA 1-2 Daraja (Bazaviy)',
    desc: 'Atamalar, faktlar va qoidalarni to‘g‘ridan-to‘g‘ri xotiradan takrorlash',
    color: 'text-sky-400',
    bg: 'bg-sky-950/40',
    border: 'border-sky-800/60',
    barColor: 'from-sky-500 to-blue-600',
  },
  COMPREHENSION: {
    label: 'Tushunish & Izohlash',
    pisaLevel: 'PISA 3 Daraja (O‘rta)',
    desc: 'Matn va grafik ma’lumotlarni tushunish, asosiy fikrni ajrata olish',
    color: 'text-indigo-400',
    bg: 'bg-indigo-950/40',
    border: 'border-indigo-800/60',
    barColor: 'from-indigo-500 to-purple-600',
  },
  APPLICATION: {
    label: 'Qo‘llash & Amaliyot',
    pisaLevel: 'PISA 4-5 Daraja (Yuqori)',
    desc: 'Nazariy bilimlarni yangi amaliy vaziyatlarda mustaqil qo‘llay olish',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-800/60',
    barColor: 'from-emerald-500 to-teal-600',
  },
  ANALYSIS: {
    label: 'Tahlil & Muammoli Vaziyat',
    pisaLevel: 'PISA 6 Daraja (Iqtidorli)',
    desc: 'Murakkab tizimlarni tahlil qilish, sabab-oqibat bog‘liqligini topish',
    color: 'text-amber-400',
    bg: 'bg-amber-950/40',
    border: 'border-amber-800/60',
    barColor: 'from-amber-500 to-orange-600',
  },
};

export const BloomDistributionChart: React.FC<BloomDistributionChartProps> = ({
  data,
  insightText,
  onSelectLevel,
  selectedLevel,
}) => {
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const activeLevel = selectedLevel !== undefined ? selectedLevel : internalSelected;

  const items = (data as unknown as BloomItem[]) || [];

  // Group or aggregate by bloom_level
  const aggregated: Record<string, { count: number; points: number }> = {
    KNOWLEDGE: { count: 0, points: 0 },
    COMPREHENSION: { count: 0, points: 0 },
    APPLICATION: { count: 0, points: 0 },
    ANALYSIS: { count: 0, points: 0 },
  };

  let totalQuestions = 0;
  let totalPoints = 0;

  items.forEach((item) => {
    const key = (item.bloom_level || '').toUpperCase();
    if (aggregated[key]) {
      const qCount = Number(item.total_questions || 1);
      const pts = Number(item.total_points || 0);
      aggregated[key].count += qCount;
      aggregated[key].points += pts;
      totalQuestions += qCount;
      totalPoints += pts;
    }
  });

  // Fallback defaults if no questions data provided directly
  if (totalQuestions === 0) {
    aggregated.KNOWLEDGE = { count: 5, points: 10 };
    aggregated.COMPREHENSION = { count: 4, points: 12 };
    aggregated.APPLICATION = { count: 4, points: 14 };
    aggregated.ANALYSIS = { count: 2, points: 8 };
    totalQuestions = 15;
    totalPoints = 44;
  }

  const handleSelect = (level: string) => {
    const next = activeLevel === level ? null : level;
    if (onSelectLevel) {
      onSelectLevel(next);
    } else {
      setInternalSelected(next);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            Bloom Taksonomiyasi & OECD PISA Kognitiv Taqsimoti
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Savollar bankining kognitiv chuqurligi, qiyinlik darajalari va kutilayotgan kompetensiyalar balansi
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Jami Savollar: <strong className="text-white">{totalQuestions} ta</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Jami Ball: <strong className="text-white">{totalPoints} ball</strong></span>
          </div>
        </div>
      </div>

      {/* Grid of Cognitive Levels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(BLOOM_METADATA).map(([key, meta]) => {
          const stats = aggregated[key] || { count: 0, points: 0 };
          const percent = totalQuestions > 0 ? Math.round((stats.count / totalQuestions) * 100) : 0;
          const isSelected = activeLevel === key;

          return (
            <div
              key={key}
              onClick={() => handleSelect(key)}
              className={`p-5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? `${meta.bg} ${meta.border} ring-2 ring-indigo-500/50 shadow-lg scale-[1.01]`
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950/90'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-extrabold ${meta.color}`}>{meta.label}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                      {meta.pisaLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{meta.desc}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xl font-black text-white">{stats.count}</span>
                  <span className="text-xs text-slate-500 block">savol ({percent}%)</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${meta.barColor} transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Ajratilgan ball: <strong className="text-white">{stats.points} ball</strong></span>
                  <span className="flex items-center gap-1 font-medium text-slate-300">
                    {percent >= 25 ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        Optimal ulush
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                        Ulushni oshirish kerak
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pedagogical Insight & OECD Benchmark Note */}
      {insightText && (
        <div className="mt-6 p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 flex items-start gap-3">
          <ArrowUpRight className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-200 leading-relaxed">
            <strong className="text-indigo-300 block mb-1">OECD PISA & Attestatsiya Standarti Bo‘yicha Metodik Tavsiya:</strong>
            {insightText}
          </div>
        </div>
      )}
    </div>
  );
};
