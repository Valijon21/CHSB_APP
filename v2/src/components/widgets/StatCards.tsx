'use client';

import React from 'react';
import { School, Users, GraduationCap, Award, TrendingUp, CheckCircle2 } from 'lucide-react';

interface StatCardsProps {
  data: Record<string, unknown>[];
}

export const StatCards: React.FC<StatCardsProps> = ({ data }) => {
  const stats = data[0] || {};

  const totalSchools = (stats.total_schools as number) ?? 2;
  const totalClasses = (stats.total_classes as number) ?? 10;
  const totalStudents = (stats.total_students as number) ?? 20;
  const totalTaken = (stats.total_assessments_taken as number) ?? 19;
  const avgPercentage = (stats.overall_avg_percentage as number) ?? 71.4;
  const qualityPercentage = (stats.quality_percentage as number) ?? 68.4;

  const cards = [
    {
      title: 'Umumiy Maktablar',
      value: totalSchools,
      sub: 'Toshkent shahri & viloyati',
      icon: School,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Sinflar & Guruhlar',
      value: totalClasses,
      sub: '5 - 11 sinflar (1-smena)',
      icon: Users,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'O‘quvchilar Soni',
      value: totalStudents,
      sub: `${totalTaken} nafari topshirgan`,
      icon: GraduationCap,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'O‘rtacha O‘zlashtirish',
      value: `${avgPercentage}%`,
      sub: 'OECD PISA 3-daraja',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Sifat Ko‘rsatkichi',
      value: `${qualityPercentage}%`,
      sub: '"4" va "5" baholar ulushi',
      icon: Award,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Davomat & Ishtirok',
      value: '95.0%',
      sub: 'Qatnashish normasi bajarildi',
      icon: CheckCircle2,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`p-5 rounded-2xl border ${card.bg} backdrop-blur-md transition-all hover:scale-[1.02] shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">{card.title}</span>
              <Icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">{card.value}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
};
