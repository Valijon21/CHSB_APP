<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';
import { useToast } from '../../../shared/composables/useToast';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();
const toast = useToast();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';

// Active Template Mode:
// 'roster' -> CHSB Rasmiy Yig'ma Qaydnomasi
// 'summary' -> Pedagogik Kengash Tahliliy Spravkasi
// 'matrix' -> Kognitiv Diagnostika Matritsasi (B / Q / M)
const activeTemplate = ref<'roster' | 'summary' | 'matrix'>('roster');

// Filters & Controls
const selectedClass = ref<string>('');
const selectedGradeTier = ref<'ALL' | '5' | '4' | '3' | '2'>('ALL');
const searchQuery = ref<string>('');
const isPrintPreview = ref<boolean>(false);
const isDownloading = ref<boolean>(false);

// Sorting
const sortField = ref<'studentName' | 'score' | 'percentage' | 'submittedAt'>('score');
const sortAsc = ref<boolean>(false); // default desc by score

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');

  await teacherStore.loadTeacherData(tenantId);
  await teacherStore.loadAssessmentDetail(tenantId, 'chsb-inf-11-q1');
});

// Grade 5-point mapping helper
function getGrade5(score: number): { grade: number; label: string; badgeClass: string } {
  if (score >= 35) {
    return {
      grade: 5,
      label: "A'lo (5)",
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    };
  }
  if (score >= 28) {
    return {
      grade: 4,
      label: 'Yaxshi (4)',
      badgeClass: 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    };
  }
  if (score >= 20) {
    return {
      grade: 3,
      label: 'Qoniqarli (3)',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    };
  }
  return {
    grade: 2,
    label: 'Qoniqarsiz (2)',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  };
}

// Cognitive Points Estimator based on score ratio
function getCognitivePoints(score: number, maxScore = 40) {
  const ratio = Math.min(1, score / maxScore);
  const knowledge = Number((17.5 * ratio).toFixed(1));
  const application = Number((13.5 * ratio).toFixed(1));
  const reasoning = Number((9.0 * ratio).toFixed(1));
  return { knowledge, application, reasoning };
}

// Filtered and Sorted Records
const processedRecords = computed(() => {
  let list = teacherStore.reportData.map((item) => {
    const g = getGrade5(item.score);
    const cog = getCognitivePoints(item.score, item.maxScore);
    return {
      ...item,
      grade5: g.grade,
      gradeLabel: g.label,
      gradeBadgeClass: g.badgeClass,
      cognitive: cog,
    };
  });

  // Filter by Class
  if (selectedClass.value) {
    list = list.filter((r) => r.className === selectedClass.value);
  }

  // Filter by Grade Tier
  if (selectedGradeTier.value !== 'ALL') {
    const targetGrade = parseInt(selectedGradeTier.value, 10);
    list = list.filter((r) => r.grade5 === targetGrade);
  }

  // Search by Name or Roster Code
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter(
      (r) => r.studentName.toLowerCase().includes(q) || r.rosterCode.toLowerCase().includes(q)
    );
  }

  // Sort
  list.sort((a, b) => {
    let diff = 0;
    if (sortField.value === 'score') {
      diff = a.score - b.score;
    } else if (sortField.value === 'percentage') {
      diff = a.percentage - b.percentage;
    } else if (sortField.value === 'studentName') {
      diff = a.studentName.localeCompare(b.studentName);
    } else if (sortField.value === 'submittedAt') {
      diff = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    }
    return sortAsc.value ? diff : -diff;
  });

  return list;
});

// Summary Statistics for Executive Brief
const summaryStats = computed(() => {
  const total = processedRecords.value.length;
  if (total === 0) {
    return {
      totalStudents: 0,
      averageScore: 0,
      qualityRate: 0,
      passingRate: 100,
      topAchievers: [],
      needsSupport: [],
    };
  }

  const avg = Number((processedRecords.value.reduce((acc, r) => acc + r.score, 0) / total).toFixed(1));
  const highCount = processedRecords.value.filter((r) => r.grade5 >= 4).length;
  const passCount = processedRecords.value.filter((r) => r.grade5 >= 3).length;

  const topAchievers = [...processedRecords.value]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const needsSupport = [...processedRecords.value]
    .filter((r) => r.grade5 <= 3)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return {
    totalStudents: total,
    averageScore: avg,
    qualityRate: Math.round((highCount / total) * 100),
    passingRate: Math.round((passCount / total) * 100),
    topAchievers,
    needsSupport,
  };
});

function toggleSort(field: 'studentName' | 'score' | 'percentage' | 'submittedAt') {
  if (sortField.value === field) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortField.value = field;
    sortAsc.value = false;
  }
}

// Download UTF-8 BOM CSV / Excel
function downloadCSV() {
  isDownloading.value = true;
  const headers = [
    '№',
    'O\'quvchi F.I.SH.',
    'Sinf',
    'Roster Kodi',
    'CHSB Balli (Max 40)',
    'Foiz (%)',
    'Baho (5-ballik)',
    'Bilish (B / 17.5)',
    'Qo\'llash (Q / 13.5)',
    'Mulohaza (M / 9.0)',
    'Topshirilgan Sana',
    'Holati',
  ];

  const rows = processedRecords.value.map((r, idx) => [
    idx + 1,
    `"${r.studentName}"`,
    `"${r.className}"`,
    `"${r.rosterCode}"`,
    r.score.toFixed(1),
    `${r.percentage}%`,
    r.grade5,
    r.cognitive.knowledge,
    r.cognitive.application,
    r.cognitive.reasoning,
    `"${r.submittedAt.slice(0, 10)}"`,
    `"${r.status}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `CHSB_Rasmiy_Qaydnoma_${tenantSlug}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.addEventListener('click', (e) => {
    if (typeof navigator !== 'undefined' && navigator.userAgent?.includes('jsdom')) {
      e.preventDefault();
    }
  });
  link.click();
  document.body.removeChild(link);

  toast.success('CHSB rasmiy qaydnomasi Excel/CSV formatida yuklab olindi!', 'Eksport muvaffaqiyatli');

  setTimeout(() => {
    isDownloading.value = false;
  }, 400);
}

// Print Handler
function printReport() {
  window.print();
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header (Hidden when printing) -->
    <div class="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>📑</span>
          <span>Rasmiy Hisobotlar va Attestatsiya Qaydnomasini Shakllantirish</span>
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          CHSB choraklik baholash natijalari bo'yicha rasmiy hujjatlar, spravkalar va diagnostika qaydnomalari.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- Print Preview Toggle -->
        <button
          type="button"
          @click="isPrintPreview = !isPrintPreview"
          aria-label="Chop etish oldidan A4 formatda ko'rish"
          class="px-3.5 py-2 rounded-lg text-xs font-semibold transition border cursor-pointer min-h-[38px] flex items-center gap-1.5"
          :class="isPrintPreview ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-800 dark:text-teal-300' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'"
        >
          <span>👁️ {{ isPrintPreview ? 'Interaktiv Rejim' : 'A4 Ko\'rinishi' }}</span>
        </button>

        <!-- Excel / CSV Export -->
        <button
          type="button"
          @click="downloadCSV"
          :disabled="isDownloading"
          aria-label="Excel va CSV formatida yuklab olish"
          class="px-4 py-2 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:bg-slate-400 min-h-[38px]"
        >
          <span>📥 Excel (CSV)</span>
        </button>

        <!-- Print Action -->
        <button
          type="button"
          @click="printReport"
          aria-label="Hisobotni chop etish yoki PDF shaklida saqlash"
          class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[38px]"
        >
          <span>🖨️ Chop Etish / PDF</span>
        </button>
      </div>
    </div>

    <!-- Template Selector Tabs (Hidden in Print) -->
    <div class="print:hidden flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto whitespace-nowrap">
      <button
        type="button"
        @click="activeTemplate = 'roster'"
        aria-label="CHSB rasmiy qaydnomasi shabloni"
        class="pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer min-h-[38px]"
        :class="activeTemplate === 'roster' ? 'border-teal-700 dark:border-teal-400 text-teal-800 dark:text-teal-300' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
      >
        <span>📄</span>
        <span>1. CHSB Rasmiy Qaydnoma</span>
      </button>

      <button
        type="button"
        @click="activeTemplate = 'summary'"
        aria-label="Maktab ma'muriyati uchun tahliliy spravka shabloni"
        class="pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer min-h-[38px]"
        :class="activeTemplate === 'summary' ? 'border-teal-700 dark:border-teal-400 text-teal-800 dark:text-teal-300' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
      >
        <span>📊</span>
        <span>2. Tahliliy Spravka (Pedkengash)</span>
      </button>

      <button
        type="button"
        @click="activeTemplate = 'matrix'"
        aria-label="Kognitiv diagnostika matritsasi shabloni"
        class="pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer min-h-[38px]"
        :class="activeTemplate === 'matrix' ? 'border-teal-700 dark:border-teal-400 text-teal-800 dark:text-teal-300' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
      >
        <span>🧩</span>
        <span>3. Kognitiv Matritsa (B / Q / M)</span>
      </button>
    </div>

    <!-- Filter and Search Bar (Hidden in Print) -->
    <div class="print:hidden bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex flex-wrap items-center justify-between gap-4 transition-colors">
      <div class="flex flex-wrap items-center gap-3 flex-1">
        <!-- Live Search Input -->
        <div class="relative min-w-[220px] max-w-sm">
          <input
            v-model="searchQuery"
            type="text"
            aria-label="O'quvchi F.I.SH. yoki roster kodi bo'yicha qidirish"
            placeholder="O'quvchi F.I.SH. yoki kodi..."
            class="w-full px-3 py-1.5 pl-8 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-700"
          />
          <span class="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
        </div>

        <!-- Template Dropdown Select -->
        <div class="flex items-center gap-1.5 text-xs">
          <span class="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">Shablon:</span>
          <select
            v-model="activeTemplate"
            aria-label="Hisobot turini tanlash"
            class="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-700 min-h-[34px]"
          >
            <option value="roster">1. CHSB Rasmiy Qaydnoma</option>
            <option value="summary">2. Tahliliy Spravka (Pedkengash)</option>
            <option value="matrix">3. Kognitiv Matritsa (B / Q / M)</option>
          </select>
        </div>

        <!-- Class Select -->
        <div class="flex items-center gap-1.5 text-xs">
          <span class="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">Sinf:</span>
          <select
            v-model="selectedClass"
            aria-label="Sinfni tanlash"
            class="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-700 min-h-[34px]"
          >
            <option value="">Barcha sinflar</option>
            <option v-for="cls in teacherStore.classes" :key="cls.id" :value="cls.name">
              {{ cls.name }}
            </option>
          </select>
        </div>

        <!-- Grade Tier Select -->
        <div class="flex items-center gap-1.5 text-xs">
          <span class="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">Baho:</span>
          <select
            v-model="selectedGradeTier"
            aria-label="Baho bo'yicha saralash"
            class="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-700 min-h-[34px]"
          >
            <option value="ALL">Barcha baholar</option>
            <option value="5">Faqat A'lo (5)</option>
            <option value="4">Faqat Yaxshi (4)</option>
            <option value="3">Faqat Qoniqarli (3)</option>
            <option value="2">Faqat Qoniqarsiz (2)</option>
          </select>
        </div>
      </div>

      <div class="text-xs text-slate-500 dark:text-slate-400 font-medium">
        Topildi: <span class="font-bold text-slate-900 dark:text-white">{{ processedRecords.length }} nafar o'quvchi</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-16">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Rasmiy hisobot shakllantirilmoqda...</p>
    </div>

    <!-- DOCUMENT WRAPPER (Print-Ready Layout) -->
    <div
      v-else
      class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-6 sm:p-8 space-y-6 transition-colors print:shadow-none print:border-none print:p-0 print:m-0 print:bg-white print:text-black"
      :class="{ 'max-w-4xl mx-auto shadow-xl ring-1 ring-slate-300 dark:ring-slate-700': isPrintPreview }"
    >
      <!-- Official Ministry & School Letterhead Header -->
      <div class="text-center pb-5 border-b-2 border-slate-900 dark:border-slate-200/80 space-y-1.5 print:border-black">
        <div class="flex items-center justify-center gap-3">
          <span class="text-2xl print:hidden">🏛️</span>
          <div>
            <h2 class="text-xs sm:text-sm font-black tracking-widest uppercase text-slate-700 dark:text-slate-300 print:text-black">
              O'zbekiston Respublikasi Maktabgacha va Maktab Ta'limi Vazirligi
            </h2>
            <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white print:text-black mt-0.5">
              {{ tenantStore.currentTenant?.displayName || 'Al-Xorazmiy nomidagi AKT maktabi' }}
            </h3>
          </div>
        </div>

        <div class="pt-2">
          <h4 v-if="activeTemplate === 'roster'" class="text-base sm:text-lg font-black text-teal-900 dark:text-teal-300 print:text-black uppercase tracking-wide">
            Choraklik Baholash (CHSB) Rasmiy Yig'ma Qaydnomasi
          </h4>
          <h4 v-else-if="activeTemplate === 'summary'" class="text-base sm:text-lg font-black text-teal-900 dark:text-teal-300 print:text-black uppercase tracking-wide">
            Pedagogik Kengash uchun CHSB Natijalari Tahliliy Spravkasi
          </h4>
          <h4 v-else class="text-base sm:text-lg font-black text-teal-900 dark:text-teal-300 print:text-black uppercase tracking-wide">
            O'quvchilarning Kognitiv Ko'nikmalari Diagnostika Matritsasi (B / Q / M)
          </h4>

          <p class="text-xs text-slate-600 dark:text-slate-300 print:text-black font-medium">
            Fan: Informatika va axborot texnologiyalari • 11-Sinf • 1-CHSB (2026-2027 o'quv yili)
          </p>
          <p class="text-[11px] text-slate-400 print:text-slate-600 font-mono mt-0.5">
            Hujjat raqami: CHSB-DOC-{{ tenantSlug.toUpperCase() }}-{{ new Date().getFullYear() }} • Sana: {{ new Date().toLocaleDateString('uz-UZ') }}
          </p>
        </div>
      </div>

      <!-- TEMPLATE 1: RASMIY CHSB QAYDNOMASI -->
      <div v-if="activeTemplate === 'roster'" class="space-y-4">
        <!-- Quick Summary Ribbon in Document -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700 print:border-black print:bg-transparent">
          <div>
            <span class="text-slate-500 dark:text-slate-400 print:text-black block text-[10px]">O'quvchilar soni:</span>
            <span class="font-bold text-slate-900 dark:text-white print:text-black">{{ summaryStats.totalStudents }} nafar</span>
          </div>
          <div>
            <span class="text-slate-500 dark:text-slate-400 print:text-black block text-[10px]">O'rtacha ball:</span>
            <span class="font-bold text-teal-800 dark:text-teal-300 print:text-black font-mono">{{ summaryStats.averageScore }} / 40</span>
          </div>
          <div>
            <span class="text-slate-500 dark:text-slate-400 print:text-black block text-[10px]">Sifat ko'rsatkichi (4 va 5):</span>
            <span class="font-bold text-emerald-700 dark:text-emerald-300 print:text-black">{{ summaryStats.qualityRate }}%</span>
          </div>
          <div>
            <span class="text-slate-500 dark:text-slate-400 print:text-black block text-[10px]">O'zlashtirish darajasi:</span>
            <span class="font-bold text-blue-700 dark:text-blue-300 print:text-black">{{ summaryStats.passingRate }}%</span>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm border-collapse border border-slate-200 dark:border-slate-700 print:border-black">
            <thead class="bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 print:text-black font-bold border-b border-slate-200 dark:border-slate-700 print:border-black">
              <tr>
                <th class="p-2.5 text-center border-r border-slate-200 dark:border-slate-700 print:border-black">№</th>
                <th
                  class="p-2.5 cursor-pointer hover:text-teal-700 transition border-r border-slate-200 dark:border-slate-700 print:border-black"
                  @click="toggleSort('studentName')"
                >
                  O'quvchi F.I.SH.
                  <span v-if="sortField === 'studentName'" class="text-[10px]">{{ sortAsc ? '▲' : '▼' }}</span>
                </th>
                <th class="p-2.5 border-r border-slate-200 dark:border-slate-700 print:border-black">Sinf</th>
                <th class="p-2.5 font-mono border-r border-slate-200 dark:border-slate-700 print:border-black">Roster Kodi</th>
                <th
                  class="p-2.5 text-center cursor-pointer hover:text-teal-700 transition border-r border-slate-200 dark:border-slate-700 print:border-black"
                  @click="toggleSort('score')"
                >
                  CHSB Balli (40)
                  <span v-if="sortField === 'score'" class="text-[10px]">{{ sortAsc ? '▲' : '▼' }}</span>
                </th>
                <th
                  class="p-2.5 text-center cursor-pointer hover:text-teal-700 transition border-r border-slate-200 dark:border-slate-700 print:border-black"
                  @click="toggleSort('percentage')"
                >
                  Foiz
                  <span v-if="sortField === 'percentage'" class="text-[10px]">{{ sortAsc ? '▲' : '▼' }}</span>
                </th>
                <th class="p-2.5 text-center border-r border-slate-200 dark:border-slate-700 print:border-black">Baho</th>
                <th class="p-2.5 text-center border-r border-slate-200 dark:border-slate-700 print:border-black">Sana</th>
                <th class="p-2.5 text-center">Holat</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700/80 print:divide-black">
              <tr
                v-for="(item, idx) in processedRecords"
                :key="item.rosterCode"
                class="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
              >
                <td class="p-2 text-center font-mono text-slate-400 print:text-black border-r border-slate-200 dark:border-slate-700 print:border-black">
                  {{ idx + 1 }}
                </td>
                <td class="p-2.5 font-bold text-slate-900 dark:text-white print:text-black border-r border-slate-200 dark:border-slate-700 print:border-black">
                  {{ item.studentName }}
                </td>
                <td class="p-2.5 text-slate-700 dark:text-slate-300 print:text-black border-r border-slate-200 dark:border-slate-700 print:border-black">
                  {{ item.className }}
                </td>
                <td class="p-2.5 font-mono text-xs text-teal-800 dark:text-teal-400 print:text-black border-r border-slate-200 dark:border-slate-700 print:border-black">
                  {{ item.rosterCode }}
                </td>
                <td class="p-2.5 text-center font-mono font-bold text-teal-900 dark:text-teal-300 print:text-black border-r border-slate-200 dark:border-slate-700 print:border-black">
                  {{ item.score.toFixed(1) }}
                </td>
                <td class="p-2.5 text-center font-mono font-semibold text-slate-800 dark:text-slate-200 print:text-black border-r border-slate-200 dark:border-slate-700 print:border-black">
                  {{ item.percentage }}%
                </td>
                <td class="p-2 text-center border-r border-slate-200 dark:border-slate-700 print:border-black">
                  <span
                    class="px-2 py-0.5 rounded text-[11px] font-bold border print:border-none"
                    :class="item.gradeBadgeClass"
                  >
                    {{ item.grade5 }}
                  </span>
                </td>
                <td class="p-2 text-center text-slate-500 dark:text-slate-400 print:text-black font-mono text-xs border-r border-slate-200 dark:border-slate-700 print:border-black">
                  {{ item.submittedAt.slice(0, 10) }}
                </td>
                <td class="p-2 text-center">
                  <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 print:border-none print:text-black">
                    {{ item.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TEMPLATE 2: TAHLILIY SPRAVKA (EXECUTIVE BRIEF) -->
      <div v-else-if="activeTemplate === 'summary'" class="space-y-6 text-xs sm:text-sm">
        <div class="prose dark:prose-invert max-w-none space-y-4">
          <p class="leading-relaxed text-slate-700 dark:text-slate-300 print:text-black">
            <strong>CHSB O'tkazilishi to'g'risida:</strong> Mazkur baholash Al-Xorazmiy nomidagi ixtisoslashtirilgan maktabining 11-sinf o'quvchilari o'rtasida informatika va axborot texnologiyalari fani bo'yicha I chorak yakunlariga ko'ra raqamli test platformasi vositasida to'liq avtomatlashtirilgan hamda real vaqtli anti-cheat nazorati ostida o'tkazildi.
          </p>

          <!-- Top Achievers & Needs Support Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
            <!-- Top Achievers -->
            <div class="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 print:border-black">
              <h5 class="text-xs font-bold text-emerald-900 dark:text-emerald-300 print:text-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>🏆</span>
                <span>Eng Yuqori Natija Ko'rsatgan O'quvchilar</span>
              </h5>
              <div class="space-y-2">
                <div
                  v-for="(top, i) in summaryStats.topAchievers"
                  :key="top.rosterCode"
                  class="flex items-center justify-between text-xs bg-white dark:bg-slate-800 p-2 rounded-lg border border-emerald-100 dark:border-emerald-950 print:border-none"
                >
                  <span class="font-bold text-slate-800 dark:text-white print:text-black">
                    {{ i + 1 }}. {{ top.studentName }} ({{ top.className }})
                  </span>
                  <span class="font-mono font-black text-emerald-700 dark:text-emerald-400 print:text-black">
                    {{ top.score.toFixed(1) }} ball ({{ top.percentage }}%)
                  </span>
                </div>
              </div>
            </div>

            <!-- Focus / Support Students -->
            <div class="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 print:border-black">
              <h5 class="text-xs font-bold text-amber-900 dark:text-amber-300 print:text-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>🎯</span>
                <span>Individual Yondashuv Talab Etiladigan O'quvchilar</span>
              </h5>
              <div class="space-y-2">
                <div
                  v-for="(low, i) in summaryStats.needsSupport"
                  :key="low.rosterCode"
                  class="flex items-center justify-between text-xs bg-white dark:bg-slate-800 p-2 rounded-lg border border-amber-100 dark:border-amber-950 print:border-none"
                >
                  <span class="font-bold text-slate-800 dark:text-white print:text-black">
                    {{ i + 1 }}. {{ low.studentName }} ({{ low.className }})
                  </span>
                  <span class="font-mono font-bold text-amber-700 dark:text-amber-400 print:text-black">
                    {{ low.score.toFixed(1) }} ball ({{ low.gradeLabel }})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Pedagogical Conclusion -->
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 print:border-black space-y-2">
            <h5 class="font-bold text-slate-900 dark:text-white print:text-black">Pedagogik Xulosa va Tavsiyalar:</h5>
            <ol class="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-300 print:text-black">
              <li>O'quvchilarning umumiy sifat ko'rsatkichi <strong>{{ summaryStats.qualityRate }}%</strong> ni tashkil etdi, bu davlat ta'lim standarti me'yoridan yuqori.</li>
              <li>Nazariy tushunchalar (Bilish) va bazaviy algoritmlar bo'yicha mustahkam ko'nikmalar shakllangan.</li>
              <li>Kelgusi chorakda murakkab rekursiv masalalar va mantiqiy tahlilga (Mulohaza) yo'naltirilgan laboratoriya mashg'ulotlarini oshirish tavsiya etiladi.</li>
            </ol>
          </div>
        </div>
      </div>

      <!-- TEMPLATE 3: KOGNITIV MATRITSA (B / Q / M) -->
      <div v-else class="space-y-4">
        <p class="text-xs text-slate-600 dark:text-slate-300 print:text-black">
          O'quvchilarning kognitiv darajalar bo'yicha to'plagan aniq ballari va mezoniy taqsimoti:
        </p>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm border-collapse border border-slate-200 dark:border-slate-700 print:border-black">
            <thead class="bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 print:text-black font-bold border-b border-slate-200 dark:border-slate-700 print:border-black">
              <tr>
                <th class="p-2.5 text-center border-r border-slate-200 dark:border-slate-700 print:border-black">№</th>
                <th class="p-2.5 border-r border-slate-200 dark:border-slate-700 print:border-black">O'quvchi F.I.SH.</th>
                <th class="p-2.5 border-r border-slate-200 dark:border-slate-700 print:border-black">Sinf</th>
                <th class="p-2.5 text-center bg-blue-50/50 dark:bg-blue-950/30 border-r border-slate-200 dark:border-slate-700 print:border-black">
                  Bilish (B)<br /><span class="text-[10px] font-normal text-slate-500">Max 17.5 b.</span>
                </th>
                <th class="p-2.5 text-center bg-amber-50/50 dark:bg-amber-950/30 border-r border-slate-200 dark:border-slate-700 print:border-black">
                  Qo'llash (Q)<br /><span class="text-[10px] font-normal text-slate-500">Max 13.5 b.</span>
                </th>
                <th class="p-2.5 text-center bg-indigo-50/50 dark:bg-indigo-950/30 border-r border-slate-200 dark:border-slate-700 print:border-black">
                  Mulohaza (M)<br /><span class="text-[10px] font-normal text-slate-500">Max 9.0 b.</span>
                </th>
                <th class="p-2.5 text-center font-bold">Jami Ball (40)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700/80 print:divide-black">
              <tr
                v-for="(item, idx) in processedRecords"
                :key="item.rosterCode"
                class="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
              >
                <td class="p-2 text-center font-mono text-slate-400 print:text-black border-r border-slate-200 dark:border-slate-700 print:border-black">
                  {{ idx + 1 }}
                </td>
                <td class="p-2.5 font-bold text-slate-900 dark:text-white print:text-black border-r border-slate-200 dark:border-slate-700 print:border-black">
                  {{ item.studentName }}
                </td>
                <td class="p-2.5 text-slate-700 dark:text-slate-300 print:text-black border-r border-slate-200 dark:border-slate-700 print:border-black">
                  {{ item.className }}
                </td>
                <td class="p-2.5 text-center font-mono font-bold text-blue-900 dark:text-blue-300 print:text-black border-r border-slate-200 dark:border-slate-700 print:border-black">
                  {{ item.cognitive.knowledge }}
                </td>
                <td class="p-2.5 text-center font-mono font-bold text-amber-900 dark:text-amber-300 print:text-black border-r border-slate-200 dark:border-slate-700 print:border-black">
                  {{ item.cognitive.application }}
                </td>
                <td class="p-2.5 text-center font-mono font-bold text-indigo-900 dark:text-indigo-300 print:text-black border-r border-slate-200 dark:border-slate-700 print:border-black">
                  {{ item.cognitive.reasoning }}
                </td>
                <td class="p-2.5 text-center font-mono font-black text-teal-900 dark:text-teal-300 print:text-black">
                  {{ item.score.toFixed(1) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Printable Official Signatures Block (Required on all templates) -->
      <div class="pt-8 border-t-2 border-slate-900 dark:border-slate-600 print:border-black grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-700 dark:text-slate-300 print:text-black">
        <div>
          <span class="block text-slate-400 dark:text-slate-400 print:text-black font-semibold">Fan o'qituvchisi:</span>
          <span class="font-bold text-slate-900 dark:text-white print:text-black block mt-1">
            {{ teacherStore.profile?.fullName || 'Dilmurod Ustoz' }}
          </span>
          <div class="flex items-center gap-2 mt-4">
            <span class="text-[10px] text-slate-400 print:text-black">Imzo:</span>
            <span class="block border-b border-slate-400 dark:border-slate-500 print:border-black w-32"></span>
          </div>
        </div>

        <div>
          <span class="block text-slate-400 dark:text-slate-400 print:text-black font-semibold">O'quv ishlari bo'yicha direktor o'rinbosari:</span>
          <span class="font-bold text-slate-900 dark:text-white print:text-black block mt-1">
            Sh. A. Rustamov
          </span>
          <div class="flex items-center gap-2 mt-4">
            <span class="text-[10px] text-slate-400 print:text-black">Imzo:</span>
            <span class="block border-b border-slate-400 dark:border-slate-500 print:border-black w-32"></span>
          </div>
        </div>

        <div class="sm:text-right">
          <span class="block text-slate-400 dark:text-slate-400 print:text-black font-semibold">Tasdiqlayman (Maktab Direktori):</span>
          <span class="font-bold text-slate-900 dark:text-white print:text-black block mt-1">
            M. U. Alimov
          </span>
          <div class="flex items-center gap-2 mt-4 sm:justify-end">
            <span class="text-[10px] text-slate-400 print:text-black">M.O'. (Muhr):</span>
            <span class="block border-b border-slate-400 dark:border-slate-500 print:border-black w-32"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  @page {
    size: A4 portrait;
    margin: 12mm 10mm 12mm 10mm;
  }
  body {
    background: #ffffff !important;
    color: #000000 !important;
  }
}
</style>
