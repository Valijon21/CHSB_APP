<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';
import { useToast } from '../../../shared/composables/useToast';
import ClassScoreHistogram from './components/ClassScoreHistogram.vue';
import ClassHonorRoll, { type TopPerformer, type NeedsSupportStudent } from './components/ClassHonorRoll.vue';
import TablePagination from '../../../shared/components/TablePagination.vue';
import type { StudentRosterRecord } from '../../../entities/roster/model';
import type { AssessmentResult } from '../../../entities/result/model';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();
const toast = useToast();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const classId = (route.params.classId as string) || '';

const searchQuery = ref('');
const selectedGroupTab = ref<'ALL' | '1-guruh' | '2-guruh'>('ALL');
const selectedGradeFilter = ref<'ALL' | '5' | '4' | '3' | 'PENDING'>('ALL');
const sortBy = ref<'score_desc' | 'score_asc' | 'name_asc'>('score_desc');

// Pagination State
const currentPage = ref(1);
const pageSize = ref(10);

const countGroup1 = computed(() => {
  return teacherStore.classDetail?.students.filter((s) => s.group === '1-guruh').length ?? 0;
});

const countGroup2 = computed(() => {
  return teacherStore.classDetail?.students.filter((s) => s.group === '2-guruh').length ?? 0;
});

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  await teacherStore.loadClassDetail(tenantId, classId);
});

// Helper: Convert score/percentage to 5-scale Uzbek grade
function getGradeScale(percentage: number): '5' | '4' | '3' | '2' {
  if (percentage >= 86) return '5';
  if (percentage >= 71) return '4';
  if (percentage >= 56) return '3';
  return '2';
}

function getGradeBadgeStyle(grade: '5' | '4' | '3' | '2') {
  switch (grade) {
    case '5':
      return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
    case '4':
      return 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800';
    case '3':
      return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
    case '2':
      return 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
  }
}

// Analytics and Metrics Engine
const classMetrics = computed(() => {
  const detail = teacherStore.classDetail;
  if (!detail) {
    return {
      totalStudents: 0,
      totalResults: 0,
      participationRate: 0,
      averageScore: 0,
      averagePercentage: 0,
      qualityRate: 0,
      passingRate: 0,
      maxScore: 0,
      minScore: 0,
      distribution: { grade5: 0, grade4: 0, grade3: 0, grade2: 0, total: 0 },
      topPerformers: [] as TopPerformer[],
      needsSupportList: [] as NeedsSupportStudent[],
    };
  }

  const students = detail.students;
  const results = detail.results;
  const totalStudents = students.length;
  const totalResults = results.length;
  const participationRate = detail.participationRate;
  const averageScore = detail.averageScore;

  let g5 = 0;
  let g4 = 0;
  let g3 = 0;
  let g2 = 0;

  for (const res of results) {
    const g = getGradeScale(res.percentage);
    if (g === '5') g5++;
    else if (g === '4') g4++;
    else if (g === '3') g3++;
    else g2++;
  }

  const averagePercentage =
    totalResults > 0
      ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / totalResults)
      : 0;

  const qualityRate = totalResults > 0 ? Math.round(((g5 + g4) / totalResults) * 100) : 0;
  const passingRate = totalResults > 0 ? Math.round(((g5 + g4 + g3) / totalResults) * 100) : 0;
  const maxScore = totalResults > 0 ? Math.max(...results.map((r) => r.score)) : 0;
  const minScore = totalResults > 0 ? Math.min(...results.map((r) => r.score)) : 0;

  // Top 3 Performers
  const sortedByScore = [...results].sort((a, b) => b.score - a.score || b.percentage - a.percentage);
  const topPerformers: TopPerformer[] = sortedByScore.slice(0, 3).map((res, index) => {
    const stu = students.find((s) => s.id === res.rosterRecordId);
    return {
      rank: (index + 1) as 1 | 2 | 3,
      studentId: res.rosterRecordId,
      name: stu ? `${stu.firstName} ${stu.lastName}` : res.studentName,
      rosterCode: stu?.rosterCode || 'STU-UNKNOWN',
      score: res.score,
      maxScore: res.maxScore || 40,
      percentage: res.percentage,
      grade: '5',
    };
  });

  // Needs Support List (students with score < 70% or no result submitted yet)
  const needsSupportList: NeedsSupportStudent[] = [];
  for (const stu of students) {
    const res = results.find((r) => r.rosterRecordId === stu.id);
    if (!res) {
      needsSupportList.push({
        studentId: stu.id,
        name: `${stu.firstName} ${stu.lastName}`,
        rosterCode: stu.rosterCode,
        reason: 'Imtihon topshirmagan (Kutilmoqda)',
      });
    } else if (res.percentage < 70) {
      needsSupportList.push({
        studentId: stu.id,
        name: `${stu.firstName} ${stu.lastName}`,
        rosterCode: stu.rosterCode,
        score: res.score,
        percentage: res.percentage,
        reason: "O'zlashtirish 70% dan past (Konsultatsiya kerak)",
      });
    }
  }

  return {
    totalStudents,
    totalResults,
    participationRate,
    averageScore,
    averagePercentage,
    qualityRate,
    passingRate,
    maxScore,
    minScore,
    distribution: {
      grade5: g5,
      grade4: g4,
      grade3: g3,
      grade2: g2,
      total: totalResults,
    },
    topPerformers,
    needsSupportList: needsSupportList.slice(0, 5),
  };
});

// Merged Student Table Items
interface StudentTableItem {
  student: StudentRosterRecord;
  result?: AssessmentResult;
  grade?: '5' | '4' | '3' | '2';
}

const displayedStudents = computed<StudentTableItem[]>(() => {
  const detail = teacherStore.classDetail;
  if (!detail) return [];

  let list: StudentTableItem[] = detail.students.map((stu) => {
    const result = detail.results.find((r) => r.rosterRecordId === stu.id);
    const grade = result ? getGradeScale(result.percentage) : undefined;
    return { student: stu, result, grade };
  });

  // Filter by group tab
  if (selectedGroupTab.value !== 'ALL') {
    list = list.filter((item) => (item.student.group || '1-guruh') === selectedGroupTab.value);
  }

  // Filter by search query
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter((item) => {
      const full = `${item.student.firstName} ${item.student.lastName} ${item.student.middleName || ''}`.toLowerCase();
      const code = item.student.rosterCode.toLowerCase();
      return full.includes(q) || code.includes(q);
    });
  }

  // Filter by grade scale
  if (selectedGradeFilter.value !== 'ALL') {
    if (selectedGradeFilter.value === 'PENDING') {
      list = list.filter((item) => !item.result);
    } else {
      list = list.filter((item) => item.grade === selectedGradeFilter.value);
    }
  }

  // Sorting
  list.sort((a, b) => {
    if (sortBy.value === 'name_asc') {
      return a.student.lastName.localeCompare(b.student.lastName);
    }
    const scoreA = a.result ? a.result.score : -1;
    const scoreB = b.result ? b.result.score : -1;
    if (sortBy.value === 'score_asc') {
      return scoreA - scoreB;
    }
    return scoreB - scoreA;
  });

  return list;
});

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return displayedStudents.value.slice(start, start + pageSize.value);
});

watch([searchQuery, selectedGroupTab, selectedGradeFilter, sortBy], () => {
  currentPage.value = 1;
});

// CSV Export Handler
function handleExportCSV() {
  const detail = teacherStore.classDetail;
  if (!detail) return;

  const className = detail.classGroup.name;
  const rows = [
    ['№', 'F.I.SH', 'Roster Kodi', 'Holati', 'Ball (40)', 'Foiz (%)', 'Baho', 'Topshirilgan Vaqt'],
  ];

  displayedStudents.value.forEach((item, idx) => {
    rows.push([
      String(idx + 1),
      `"${item.student.lastName} ${item.student.firstName} ${item.student.middleName || ''}"`,
      item.student.rosterCode,
      item.student.status === 'eligible' ? 'Ruxsat berilgan' : 'Nofaol',
      item.result ? String(item.result.score) : 'Topshirmagan',
      item.result ? `${item.result.percentage}%` : '-',
      item.grade || '-',
      item.result ? item.result.submittedAt : '-',
    ]);
  });

  const csvContent = '\uFEFF' + rows.map((r) => r.join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  if (typeof window !== 'undefined' && window.URL && typeof window.URL.createObjectURL === 'function') {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CHSB_${className}_Natijalar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof window.URL.revokeObjectURL === 'function') {
      window.URL.revokeObjectURL(url);
    }
  }

  toast.success(
    `${className} sinfi bo'yicha ${displayedStudents.value.length} nafar o'quvchi ma'lumotlari CSV formatida yuklab olindi!`,
    'Eksport Muvaffaqiyatli'
  );
}
</script>

<template>
  <div class="space-y-6">
    <!-- Breadcrumbs & Quick Header Actions -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <router-link
          :to="`/t/${tenantSlug}/teacher/classes`"
          class="hover:text-teal-800 dark:hover:text-teal-400 underline font-medium"
        >
          ← Barcha sinflar
        </router-link>
        <span>/</span>
        <span class="font-bold text-slate-800 dark:text-slate-100 font-mono">
          {{ teacherStore.classDetail?.classGroup.name || 'Sinf' }}
        </span>
        <span class="text-slate-400">/</span>
        <span class="text-teal-700 dark:text-teal-400 font-medium">Pedagogik Diagnostika</span>
      </div>

      <div class="flex items-center gap-2">
        <router-link
          :to="`/t/${tenantSlug}/teacher/reports`"
          aria-label="Ushbu sinf uchun A4 hisobot ochish"
          class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-300 dark:border-slate-700 min-h-[36px] flex items-center gap-1.5"
        >
          <span>📑</span>
          <span>A4 Rasmiy Qaydnoma</span>
        </router-link>

        <button
          type="button"
          @click="handleExportCSV"
          :disabled="!teacherStore.classDetail || teacherStore.isLoading"
          aria-label="Sinf natijalarini CSV faylga yuklab olish"
          class="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer min-h-[36px] disabled:opacity-50"
        >
          <span>📥</span>
          <span>CSV Yuklab Olish</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-16">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Sinf ko'rsatkichlari yuklanmoqda...</p>
    </div>

    <!-- Main Detail Content -->
    <div v-else-if="teacherStore.classDetail" class="space-y-6">
      <!-- Class Banner -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold px-2.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-mono">
              {{ teacherStore.classDetail.classGroup.name }}
            </span>
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">
              {{ teacherStore.classDetail.classGroup.academicYear }} o'quv yili
            </span>
          </div>
          <h1 class="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {{ teacherStore.classDetail.classGroup.name }} Guruhi Ko'rsatkichlari
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Informatika va axborot texnologiyalari • {{ teacherStore.classDetail.classGroup.grade }}-parallel • Jami {{ classMetrics.totalStudents }} nafar o'quvchi
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center min-w-[110px]">
            <span class="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">O'rtacha Ball</span>
            <span class="text-2xl font-black text-teal-800 dark:text-teal-300 font-mono">
              {{ classMetrics.averageScore }} <span class="text-xs text-slate-400">/ 40</span>
            </span>
          </div>
          <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center min-w-[110px]">
            <span class="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">Sifat Foizi</span>
            <span class="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
              {{ classMetrics.qualityRate }}%
            </span>
          </div>
        </div>
      </div>

      <!-- 4-Card Executive KPI Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 1. O'zlashtirish Darajasi -->
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-1">
          <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">O'zlashtirish Darajasi</span>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono">
              {{ classMetrics.passingRate }}%
            </span>
          </div>
          <span class="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">
            ≥ 56% to'plaganlar ulushi
          </span>
        </div>

        <!-- 2. Ishtirok / Qamrov -->
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-1">
          <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Imtihon Ishtiroki</span>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono">
              {{ classMetrics.participationRate }}%
            </span>
          </div>
          <span class="text-[10px] text-slate-500 dark:text-slate-400 block">
            {{ classMetrics.totalResults }} / {{ classMetrics.totalStudents }} nafar o'quvchi
          </span>
        </div>

        <!-- 3. Eng Yuqori Natija -->
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-1">
          <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Maksimal Ball</span>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
              {{ classMetrics.maxScore }}
            </span>
            <span class="text-xs text-slate-400">/ 40</span>
          </div>
          <span class="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">
            Sinf rekordi (100%)
          </span>
        </div>

        <!-- 4. Eng Past Natija -->
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-1">
          <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Minimal Ball</span>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
              {{ classMetrics.minScore }}
            </span>
            <span class="text-xs text-slate-400">/ 40</span>
          </div>
          <span class="text-[10px] text-slate-500 dark:text-slate-400 block">
            Eng past qayd etilgan ball
          </span>
        </div>
      </div>

      <!-- Visuals Row: Histogram + Honor Roll / Needs Support -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Histogram Component -->
        <ClassScoreHistogram :distribution="classMetrics.distribution" />

        <!-- Honor Roll & Needs Support -->
        <ClassHonorRoll
          :top-performers="classMetrics.topPerformers"
          :needs-support-list="classMetrics.needsSupportList"
          :tenant-slug="tenantSlug"
        />
      </div>

      <!-- Interactive Roster Table & Toolbar -->
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden transition-colors">
        <!-- Table Toolbar -->
        <div class="p-4 border-b border-slate-100 dark:border-slate-700/80 space-y-3">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Sinf O'quvchilari va Natijalari ({{ displayedStudents.length }})
              </h2>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">
                Har bir o'quvchining shaxsiy ko'rsatkichlari, guruhi va 5 ballik baho shkalasi
              </p>
            </div>

            <!-- Group Switcher Tabs -->
            <div class="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl">
              <button
                type="button"
                @click="selectedGroupTab = 'ALL'"
                :class="[
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5',
                  selectedGroupTab === 'ALL'
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                ]"
              >
                <span>Barchasi</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">{{ teacherStore.classDetail?.students.length || 0 }}</span>
              </button>

              <button
                type="button"
                @click="selectedGroupTab = '1-guruh'"
                :class="[
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5',
                  selectedGroupTab === '1-guruh'
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                ]"
              >
                <span>1-guruh</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">{{ countGroup1 }}</span>
              </button>

              <button
                type="button"
                @click="selectedGroupTab = '2-guruh'"
                :class="[
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5',
                  selectedGroupTab === '2-guruh'
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                ]"
              >
                <span>2-guruh</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">{{ countGroup2 }}</span>
              </button>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <!-- Search Input -->
            <div class="relative min-w-[200px] flex-1 max-w-xs">
              <input
                v-model="searchQuery"
                type="text"
                aria-label="O'quvchi F.I.SH yoki roster kodi bo'yicha qidirish"
                placeholder="F.I.SH yoki Roster kod..."
                class="w-full px-3 py-1.5 pl-8 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-2 focus:ring-teal-700 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs"
              />
              <span class="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <!-- Grade Filter -->
              <select
                v-model="selectedGradeFilter"
                aria-label="Baho bo'yicha saralash"
                class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden text-xs"
              >
                <option value="ALL">Barcha baholar</option>
                <option value="5">5 - A'lo</option>
                <option value="4">4 - Yaxshi</option>
                <option value="3">3 - Qoniqarli</option>
                <option value="PENDING">Topshirmagan</option>
              </select>

              <!-- Sort By -->
              <select
                v-model="sortBy"
                aria-label="Natijalarni tartiblash"
                class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden text-xs"
              >
                <option value="score_desc">Ball: Kamayish tartibida</option>
                <option value="score_asc">Ball: O'sish tartibida</option>
                <option value="name_asc">Ism: A – Z</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Table View -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th class="p-3.5">№</th>
                <th class="p-3.5">O'quvchi F.I.SH.</th>
                <th class="p-3.5">Roster Kodi</th>
                <th class="p-3.5 text-center">Guruh</th>
                <th class="p-3.5">Holati</th>
                <th class="p-3.5 text-center">CHSB Bali</th>
                <th class="p-3.5 text-center">Foiz (%)</th>
                <th class="p-3.5 text-center">Baho</th>
                <th class="p-3.5 text-right">Amal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700/80">
              <tr
                v-for="(item, idx) in paginatedStudents"
                :key="item.student.id"
                class="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition"
              >
                <td class="p-3.5 text-slate-400 font-mono">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
                <td class="p-3.5">
                  <div class="font-bold text-slate-900 dark:text-white">
                    {{ item.student.lastName }} {{ item.student.firstName }} {{ item.student.middleName || '' }}
                  </div>
                  <div v-if="item.student.emaktabId" class="text-[10px] font-mono text-slate-400 dark:text-slate-400">
                    eMaktab ID: {{ item.student.emaktabId }}
                  </div>
                </td>
                <td class="p-3.5 font-mono text-teal-800 dark:text-teal-400 font-semibold">
                  {{ item.student.rosterCode }}
                </td>
                <td class="p-3.5 text-center">
                  <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    {{ item.student.group || '1-guruh' }}
                  </span>
                </td>
                <td class="p-3.5">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[11px] font-semibold',
                      item.student.status === 'eligible'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    ]"
                  >
                    {{ item.student.status === 'eligible' ? 'Ruxsat berilgan' : 'Nofaol' }}
                  </span>
                </td>
                <td class="p-3.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                  <span v-if="item.result">
                    {{ item.result.score }} <span class="text-[11px] text-slate-400">/ 40</span>
                  </span>
                  <span v-else class="text-slate-400 text-xs italic">Kutilmoqda</span>
                </td>
                <td class="p-3.5 text-center font-mono font-semibold">
                  <span v-if="item.result" :class="item.result.percentage >= 71 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'">
                    {{ item.result.percentage }}%
                  </span>
                  <span v-else class="text-slate-400 text-xs">-</span>
                </td>
                <td class="p-3.5 text-center">
                  <span
                    v-if="item.grade"
                    :class="['px-2.5 py-0.5 rounded font-bold text-xs', getGradeBadgeStyle(item.grade)]"
                  >
                    {{ item.grade }} ({{ item.grade === '5' ? "A'lo" : item.grade === '4' ? "Yaxshi" : item.grade === '3' ? "Qoniqarli" : "Qoniqarsiz" }})
                  </span>
                  <span v-else class="text-slate-400 text-xs italic">Topshirmagan</span>
                </td>
                <td class="p-3.5 text-right">
                  <router-link
                    :to="`/t/${tenantSlug}/teacher/students/${item.student.id}`"
                    class="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline min-h-[36px] inline-flex items-center"
                  >
                    Profil →
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table Pagination (10, 20, 30, 50) -->
        <TablePagination
          v-if="displayedStudents.length > 0"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total-items="displayedStudents.length"
        />

        <div v-if="displayedStudents.length === 0" class="text-center py-8 text-xs text-slate-500">
          Qidiruv yoki filtr bo'yicha hech qanday o'quvchi topilmadi.
        </div>
      </div>
    </div>

    <!-- Error/Not Found State -->
    <div v-else class="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <p class="text-sm text-slate-500 dark:text-slate-400">Sinf topilmadi yoki bu muassasaga tegishli emas.</p>
      <router-link
        :to="`/t/${tenantSlug}/teacher/classes`"
        class="mt-3 inline-block text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
      >
        Sinflar ro'yxatiga qaytish
      </router-link>
    </div>
  </div>
</template>
