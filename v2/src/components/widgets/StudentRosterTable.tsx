'use client';

import React, { useState } from 'react';
import { Search, Download, Printer, AlertTriangle, CheckCircle, ShieldAlert, Filter, X } from 'lucide-react';

export interface StudentRow {
  roster_code: string;
  student_name: string;
  class_name: string;
  score: number;
  max_score: number;
  percentage: number;
  grade: string;
  pisa_level: string;
}

interface StudentRosterTableProps {
  data: Record<string, unknown>[];
  externalClassFilter?: string | null;
  onClearClassFilter?: () => void;
  externalPisaFilter?: string | null;
  onClearPisaFilter?: () => void;
}

export const StudentRosterTable: React.FC<StudentRosterTableProps> = ({
  data,
  externalClassFilter,
  onClearClassFilter,
  externalPisaFilter,
  onClearPisaFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  const rows = (data as unknown as StudentRow[]) || [];

  const filtered = rows.filter((r) => {
    const matchesSearch =
      r.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.roster_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.class_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade = gradeFilter === 'ALL' || r.grade === gradeFilter;
    const matchesClass = !externalClassFilter || r.class_name === externalClassFilter;
    const matchesPisa = !externalPisaFilter || r.pisa_level?.includes(externalPisaFilter);

    return matchesSearch && matchesGrade && matchesClass && matchesPisa;
  });

  // Export to CSV with UTF-8 BOM for Microsoft Excel compatibility
  const exportToExcelCsv = () => {
    if (filtered.length === 0) return;

    const headers = [
      'Roster Kodi',
      'O‘quvchi F.I.Sh',
      'Sinfi',
      'To‘plangan Ball',
      'Maksimal Ball',
      'Foiz (%)',
      'Baho',
      'OECD PISA Darajasi',
    ];

    const csvRows = filtered.map((r) =>
      [
        `"${r.roster_code || ''}"`,
        `"${r.student_name || ''}"`,
        `"${r.class_name || ''}"`,
        r.score ?? 0,
        r.max_score ?? 0,
        `"${r.percentage ?? 0}%"`,
        `"${r.grade || ''}"`,
        `"${r.pisa_level || ''}"`,
      ].join(',')
    );

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `CHSB_Oquvchilar_Jurnali_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            O‘quvchilarning CHSB Natijalari va OECD PISA Darajalari
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Har bir o‘quvchining individual to‘plagan bali, bahosi va PISA kompetensiya tabaqasi
          </p>

          {/* Active Cross Filter Indicator */}
          {(externalClassFilter || externalPisaFilter) && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {externalClassFilter && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
                  <Filter className="w-3.5 h-3.5" />
                  Sinf: {externalClassFilter}
                  {onClearClassFilter && (
                    <button
                      onClick={onClearClassFilter}
                      className="hover:text-white transition-colors"
                      title="Sinf filtrini tozalash"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
              )}
              {externalPisaFilter && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                  <Filter className="w-3.5 h-3.5" />
                  Kognitiv: {externalPisaFilter}
                  {onClearPisaFilter && (
                    <button
                      onClick={onClearPisaFilter}
                      className="hover:text-white transition-colors"
                      title="Kognitiv filtrni tozalash"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Controls & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Qidirish (F.I.Sh, Roster, Sinf)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 sm:w-56"
            />
          </div>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Barcha Baholar</option>
            <option value="5">Faqat 5 baho</option>
            <option value="4">Faqat 4 baho</option>
            <option value="3">Faqat 3 baho</option>
            <option value="2">Faqat 2 baho</option>
          </select>

          {/* Export to Excel (CSV) Button */}
          <button
            onClick={exportToExcelCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            title="Excel formatida eksport qilish (UTF-8 BOM)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel / CSV</span>
          </button>

          {/* Print / PDF Report Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors shadow-sm"
            title="Hisobotni chop etish yoki PDF sifatida saqlash"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Chop etish (PDF)</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Roster Kodi</th>
              <th className="px-4 py-3">O‘quvchi F.I.Sh</th>
              <th className="px-4 py-3">Sinfi</th>
              <th className="px-4 py-3 text-center">To‘plangan Ball</th>
              <th className="px-4 py-3 text-center">Foiz (%)</th>
              <th className="px-4 py-3 text-center">Baho</th>
              <th className="px-4 py-3">OECD PISA Kompetensiya Darajasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Mos keluvchi o‘quvchilar topilmadi.
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => {
                const isUnsubmitted = row.pisa_level === 'Topshirmagan' || row.grade === '-';
                const isAtRisk = !isUnsubmitted && (row.grade === '2' || (row.percentage || 0) < 40);
                const isExcellent = row.grade === '5';

                return (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-400">{row.roster_code}</td>
                    <td className="px-4 py-3 text-white font-semibold flex items-center gap-2">
                      {row.student_name}
                      {isAtRisk && (
                        <span title="Xavf guruhi (past o‘zlashtirish)">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 inline" />
                        </span>
                      )}
                      {isExcellent && (
                        <span title="A'lochi o‘quvchi">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 inline" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{row.class_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-white">{row.score ?? '-'}</span> / {row.max_score ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-bold ${
                          isUnsubmitted
                            ? 'text-slate-500'
                            : (row.percentage ?? 0) >= 75
                            ? 'text-emerald-400'
                            : (row.percentage ?? 0) >= 60
                            ? 'text-blue-400'
                            : (row.percentage ?? 0) >= 40
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {isUnsubmitted ? '—' : `${row.percentage}%`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          isUnsubmitted
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : row.grade === '5'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : row.grade === '4'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : row.grade === '3'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {row.grade}
                      </span>
                    </td>
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {row.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                        {row.pisa_level}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
