'use client';

import React from 'react';
import { BarChart3, Filter, X } from 'lucide-react';

interface ClassRow {
  class_name: string;
  grade_level: number;
  student_count: number;
  avg_score: number;
  avg_percentage: number;
  count_grade_5: number;
  count_grade_4: number;
  count_grade_3: number;
  count_grade_2: number;
}

interface ClassPerformanceChartProps {
  data: Record<string, unknown>[];
  selectedClass?: string | null;
  onSelectClass?: (className: string | null) => void;
}

export const ClassPerformanceChart: React.FC<ClassPerformanceChartProps> = ({
  data,
  selectedClass,
  onSelectClass,
}) => {
  const rows = (data as unknown as ClassRow[]) || [];

  const handleClassClick = (className: string) => {
    if (!onSelectClass) return;
    if (selectedClass === className) {
      onSelectClass(null);
    } else {
      onSelectClass(className);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Sinflar Kesimida CHSB O‘zlashtirish va Baholar Taqsimoti
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Har bir sinfning o‘rtacha ko‘rsatkichi va baholar balansi (Interaktiv filtr uchun sinf ustiga bosing)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedClass && (
            <button
              onClick={() => onSelectClass && onSelectClass(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-lg border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtr: {selectedClass}</span>
              <X className="w-3 h-3 ml-1" />
            </button>
          )}
          <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/20">
            Jonli Real Baza
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {rows.map((row, i) => {
          const pct = row.avg_percentage || 0;
          const isSelected = selectedClass === row.class_name;
          const colorClass =
            pct >= 75
              ? 'bg-emerald-500 text-emerald-400'
              : pct >= 60
              ? 'bg-blue-500 text-blue-400'
              : pct >= 40
              ? 'bg-amber-500 text-amber-400'
              : 'bg-rose-500 text-rose-400';

          return (
            <div
              key={i}
              onClick={() => handleClassClick(row.class_name)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/40 shadow-lg scale-[1.008]'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/90'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white text-base">{row.class_name}</span>
                  <span className="text-xs text-slate-400">({row.student_count} ta o‘quvchi)</span>
                  {isSelected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Jurnalda tanlangan
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">O‘rtacha:</span>
                  <span className="font-extrabold text-sm text-white">{pct}%</span>
                  <span className="text-xs text-slate-400">({row.avg_score} ball)</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-500 ${colorClass.split(' ')[0]}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>

              {/* Grades breakdown badges */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    5 baho: <strong className="text-white">{row.count_grade_5 || 0}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    4 baho: <strong className="text-white">{row.count_grade_4 || 0}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    3 baho: <strong className="text-white">{row.count_grade_3 || 0}</strong>
                  </span>
                  {row.count_grade_2 > 0 && (
                    <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      2 baho: <strong className="text-white">{row.count_grade_2}</strong>
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500">Sinf darajasi: {row.grade_level}-sinf</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
