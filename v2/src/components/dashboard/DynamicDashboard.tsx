'use client';

import React, { useState } from 'react';
import { StatCards } from '@/components/widgets/StatCards';
import { ClassPerformanceChart } from '@/components/widgets/ClassPerformanceChart';
import { StudentRosterTable } from '@/components/widgets/StudentRosterTable';
import { PISACognitiveRadar } from '@/components/widgets/PISACognitiveRadar';
import { BloomDistributionChart } from '@/components/widgets/BloomDistributionChart';
import {
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Database,
  Search,
  Sparkles,
} from 'lucide-react';
import type { AIAnalysisResponse } from '@/lib/ai-engine';

interface DynamicDashboardProps {
  response: AIAnalysisResponse | null;
  onSelectPrompt?: (prompt: string) => void;
}

export const DynamicDashboard: React.FC<DynamicDashboardProps> = ({ response, onSelectPrompt }) => {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedBloom, setSelectedBloom] = useState<string | null>(null);

  if (!response) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-500">
        <p>Iltimos, chapdagi tezkor savollardan birini tanlang yoki o‘z savolingizni yozing.</p>
      </div>
    );
  }

  const { data, summary, pedagogicalInsight, openUiComponent, grounding } = response;

  const hasActiveCrossFilter = Boolean(selectedClass || selectedBloom);

  const clearAllFilters = () => {
    setSelectedClass(null);
    setSelectedBloom(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
      {/* Header Banner & Insight */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-slate-900 border border-blue-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            {openUiComponent === 'DomainRejection' ? (
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Mavzudan Tashqari So‘rov (Domain Guardrail)</span>
              </div>
            ) : openUiComponent === 'MissingDataNotice' ? (
              <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-xs">
                <Database className="w-4 h-4" />
                <span>Faktik Baza Cheklovi (Data Bounds Guardrail)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Generativ Tahlil Muvaffaqiyatli Bajarildi</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Grounding / Anti-Hallucination Shield Badge */}
            {grounding && grounding.isGrounded && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Tasdiqlangan (Zero Hallucination)</span>
              </div>
            )}

            {hasActiveCrossFilter && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Filtrlarni bekor qilish</span>
              </button>
            )}
          </div>
        </div>

        <h2 className="text-xl font-extrabold text-white tracking-tight">{summary}</h2>
        {pedagogicalInsight && (
          <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-4xl">{pedagogicalInsight}</p>
        )}
      </div>

      {/* Special Guardrail State: Domain Rejection */}
      {openUiComponent === 'DomainRejection' && (
        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/80 p-8 text-center space-y-4 shadow-2xl backdrop-blur-md">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-lg font-bold text-white">Ta’lim Doirasidan Tashqari So‘rov Aniqlangan</h3>
            <p className="text-sm text-slate-400">{summary}</p>
            <div className="pt-2 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-left">
              <p className="font-semibold text-amber-400 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Tavsiya etilgan so‘rovlar:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>&ldquo;Umumiy maktablar va CHSB ko‘rsatkichlarini ko‘rsat&rdquo;</li>
                <li>&ldquo;11-sinflar kesimida CHSB natijalari va baholar taqsimoti&rdquo;</li>
                <li>&ldquo;Past o‘zlashtirgan o‘quvchilar ro‘yxati va PISA darajalari&rdquo;</li>
                <li>&ldquo;Bloom taksonomiyasi va savollar kognitiv qiyinligi tahlili&rdquo;</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Special Guardrail State: Missing Data Notice */}
      {openUiComponent === 'MissingDataNotice' && (
        <div className="rounded-2xl border border-sky-500/30 bg-slate-900/80 p-8 space-y-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Faktik Baza Cheklovi (Nol To‘qima Siyosati)</h3>
              <p className="text-sm text-slate-400 mt-1">{pedagogicalInsight}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/20">
              <div className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Bazada Mavjud Sinflar:
              </div>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• 11-A sinf (9 ta CHSB bahosi)</li>
                <li>• 11-B sinf (5 ta CHSB bahosi)</li>
                <li>• 11-Guruh-1 (Harbiy-AT) (4 ta CHSB bahosi)</li>
                <li>• 11-Guruh-2 (Harbiy-AT) (1 ta CHSB bahosi)</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                <Search className="w-4 h-4" /> Kiritilishi kutilayotgan:
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                9-sinf va 10-sinf sinflari bazada ro‘yxatga olingan, biroq imtihon baholari hali kiritilmagan. Sun’iy intellekt soxta ma’lumotlarni to‘qimasligi kafolatlanadi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Widget Composition based on OpenUI Intent */}
      {openUiComponent === 'OverviewDashboard' && (
        <>
          <StatCards data={data} />
          <div className="grid grid-cols-1 gap-6">
            <BloomDistributionChart
              data={[]}
              insightText={pedagogicalInsight}
              selectedLevel={selectedBloom}
              onSelectLevel={setSelectedBloom}
            />
            <PISACognitiveRadar insightText={pedagogicalInsight} />
          </div>
        </>
      )}

      {openUiComponent === 'ClassPerformance' && (
        <>
          <ClassPerformanceChart
            data={data}
            selectedClass={selectedClass}
            onSelectClass={setSelectedClass}
          />

          {/* Interactive Drill-down: Student Roster when a class is selected */}
          {selectedClass && response.studentsRoster && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                  <span>{selectedClass} o‘quvchilarining individual jurnali va baholari</span>
                </h4>
                <span className="text-xs text-blue-300 font-medium">
                  Tanlangan sinf bo‘yicha avtomatik filtrlangan
                </span>
              </div>
              <StudentRosterTable
                data={response.studentsRoster}
                externalClassFilter={selectedClass}
                onClearClassFilter={() => setSelectedClass(null)}
              />
            </div>
          )}

          <PISACognitiveRadar insightText={pedagogicalInsight} />
        </>
      )}

      {openUiComponent === 'StudentRoster' && (
        <>
          <StudentRosterTable
            data={data}
            externalClassFilter={selectedClass}
            onClearClassFilter={() => setSelectedClass(null)}
            externalPisaFilter={selectedBloom}
            onClearPisaFilter={() => setSelectedBloom(null)}
          />
          <PISACognitiveRadar insightText={pedagogicalInsight} />
        </>
      )}

      {openUiComponent === 'BloomTaxonomy' && (
        <>
          <BloomDistributionChart
            data={data}
            insightText={pedagogicalInsight}
            selectedLevel={selectedBloom}
            onSelectLevel={setSelectedBloom}
          />
          <PISACognitiveRadar insightText={pedagogicalInsight} />
        </>
      )}

      {openUiComponent === 'SchoolRanking' && (
        <>
          <StatCards data={data} />
          <ClassPerformanceChart
            data={data}
            selectedClass={selectedClass}
            onSelectClass={setSelectedClass}
          />
          <PISACognitiveRadar insightText={pedagogicalInsight} />
        </>
      )}
    </div>
  );
};
