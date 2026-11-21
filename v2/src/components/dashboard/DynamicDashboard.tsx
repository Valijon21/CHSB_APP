'use client';

import React, { useState } from 'react';
import { StatCards } from '@/components/widgets/StatCards';
import { ClassPerformanceChart } from '@/components/widgets/ClassPerformanceChart';
import { StudentRosterTable } from '@/components/widgets/StudentRosterTable';
import { PISACognitiveRadar } from '@/components/widgets/PISACognitiveRadar';
import { BloomDistributionChart } from '@/components/widgets/BloomDistributionChart';
import { Terminal, CheckCircle2, SlidersHorizontal, RotateCcw } from 'lucide-react';
import type { AIAnalysisResponse } from '@/lib/ai-engine';

interface DynamicDashboardProps {
  response: AIAnalysisResponse | null;
}

export const DynamicDashboard: React.FC<DynamicDashboardProps> = ({ response }) => {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedBloom, setSelectedBloom] = useState<string | null>(null);

  if (!response) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-500">
        <p>Iltimos, chapdagi tezkor savollardan birini tanlang yoki o‘z savolingizni yozing.</p>
      </div>
    );
  }

  const { sqlExecuted, data, summary, pedagogicalInsight, openUiComponent } = response;

  const hasActiveCrossFilter = Boolean(selectedClass || selectedBloom);

  const clearAllFilters = () => {
    setSelectedClass(null);
    setSelectedBloom(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
      {/* Header Banner & Insight */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-slate-900 border border-blue-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Generativ Tahlil Muvaffaqiyatli Bajarildi</span>
          </div>

          {hasActiveCrossFilter && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Barcha filtrlarni bekor qilish</span>
            </button>
          )}
        </div>

        <h2 className="text-xl font-extrabold text-white tracking-tight">{summary}</h2>

        {/* SQL Execution Inspector */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-cyan-400 flex items-center gap-2 overflow-x-auto">
          <Terminal className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-slate-500">Bajarilgan SQL:</span>
          <span className="truncate">{sqlExecuted}</span>
        </div>
      </div>

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
