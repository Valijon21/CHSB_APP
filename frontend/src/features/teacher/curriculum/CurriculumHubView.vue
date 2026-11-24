<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
const tenantSlug = computed(() => (route.params.tenantSlug as string) || 'al-xorazmiy');

// State
const selectedGrade = ref<number>(11);
const selectedQuarter = ref<number>(1);
const activeTab = ref<'presentations' | 'solutions' | 'workbooks' | 'worksheets'>('presentations');
const activeSlideIndex = ref<number>(0);
const expandedSolutionId = ref<string | null>(null);
const isLoading = ref<boolean>(false);

interface CurriculumResource {
  id: string;
  gradeLevel: number;
  quarter: number;
  title: string;
  topic: string;
  resourceType: 'PRESENTATION' | 'WORKSHEET' | 'WORKBOOK' | 'SOLUTION';
  description: string;
  contentJson: string;
  downloadCount: number;
}

interface AssessmentSolution {
  id: string;
  assessmentId: string;
  questionId: string;
  variantNumber: number;
  stepByStepSolution: string;
  solutionFormulas?: string;
  rubricCriteriaJson: string;
  authorNote?: string;
}

const resources = ref<CurriculumResource[]>([]);
const solutions = ref<AssessmentSolution[]>([]);

const availableGrades = [5, 6, 7, 8, 9, 10, 11];
const availableQuarters = [
  { id: 1, name: '1-Chorak' },
  { id: 2, name: '2-Chorak' },
  { id: 3, name: '3-Chorak' },
  { id: 4, name: '4-Chorak' },
];

async function loadCurriculum() {
  isLoading.value = true;
  activeSlideIndex.value = 0;
  try {
    const res = await fetch(
      `/api/v1/curriculum/resources?gradeLevel=${selectedGrade.value}&quarter=${selectedQuarter.value}&tenantSlug=${tenantSlug.value}`
    );
    if (res.ok) {
      resources.value = await res.json();
    }
  } catch (err) {
    console.error('Failed to load curriculum resources:', err);
  } finally {
    isLoading.value = false;
  }
}

async function loadSolutions() {
  try {
    const res = await fetch(`/api/v1/curriculum/solutions/chsb-inf-11-q1`);
    if (res.ok) {
      solutions.value = await res.json();
    }
  } catch (err) {
    console.error('Failed to load solutions:', err);
  }
}

onMounted(async () => {
  await loadCurriculum();
  await loadSolutions();
});

watch([selectedGrade, selectedQuarter], async () => {
  await loadCurriculum();
});

// Computed active resources by type
const currentPresentation = computed(() => {
  const pres = resources.value.find((r) => r.resourceType === 'PRESENTATION');
  if (pres) {
    try {
      return { ...pres, parsed: JSON.parse(pres.contentJson) };
    } catch {
      return null;
    }
  }
  return null;
});

const currentWorksheet = computed(() => {
  const ws = resources.value.find((r) => r.resourceType === 'WORKSHEET');
  if (ws) {
    try {
      return { ...ws, parsed: JSON.parse(ws.contentJson) };
    } catch {
      return null;
    }
  }
  return null;
});

const currentSolutionResource = computed(() => {
  const sol = resources.value.find((r) => r.resourceType === 'SOLUTION');
  if (sol) {
    try {
      return { ...sol, parsed: JSON.parse(sol.contentJson) };
    } catch {
      return null;
    }
  }
  return null;
});

// Presentation Slides Navigation
const currentSlides = computed(() => currentPresentation.value?.parsed?.slides || []);
const activeSlide = computed(() => currentSlides.value[activeSlideIndex.value] || null);

function nextSlide() {
  if (activeSlideIndex.value < currentSlides.value.length - 1) {
    activeSlideIndex.value++;
  }
}

function prevSlide() {
  if (activeSlideIndex.value > 0) {
    activeSlideIndex.value--;
  }
}

function toggleSolution(id: string) {
  expandedSolutionId.value = expandedSolutionId.value === id ? null : id;
}

function printWorkbook() {
  window.print();
}
</script>

<template>
  <div class="space-y-6 font-sans">
    <!-- Header Banner -->
    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors">
      <div>
        <div class="flex items-center gap-2 mb-1.5">
          <span class="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
            Metodik Resurslar Markazi
          </span>
          <span class="text-xs text-slate-400 dark:text-slate-500">• 5–11-sinflar</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          O‘quv Materiallari, Taqdimotlar & BSB/CHSB Yechimlari
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Informatika va axborot texnologiyalari fani bo‘yicha dars taqdimotlari, nazorat daftarlari va baholash mezonlari ombori.
        </p>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex items-center gap-2">
        <button
          @click="printWorkbook"
          class="px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <span>🖨️ Chop etish / PDF</span>
        </button>
      </div>
    </div>

    <!-- Filters Bar: Grade Selector & Quarter Selector -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <!-- Grade Buttons (5 - 11) -->
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Sinf:</span>
        <button
          v-for="grade in availableGrades"
          :key="grade"
          @click="selectedGrade = grade"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer',
            selectedGrade === grade
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          ]"
        >
          {{ grade }}-sinf
        </button>
      </div>

      <!-- Quarter Selector (1 - 4) -->
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Chorak:</span>
        <button
          v-for="q in availableQuarters"
          :key="q.id"
          @click="selectedQuarter = q.id"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer',
            selectedQuarter === q.id
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          ]"
        >
          {{ q.name }}
        </button>
      </div>
    </div>

    <!-- 4 Main Navigation Tabs -->
    <div class="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto gap-2">
      <button
        @click="activeTab = 'presentations'"
        :class="[
          'px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap',
          activeTab === 'presentations'
            ? 'border-teal-500 text-teal-600 dark:text-teal-400'
            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        ]"
      >
        <span>🖥️ Dars Taqdimotlari</span>
      </button>

      <button
        @click="activeTab = 'solutions'"
        :class="[
          'px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap',
          activeTab === 'solutions'
            ? 'border-teal-500 text-teal-600 dark:text-teal-400'
            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        ]"
      >
        <span>📝 BSB & CHSB Yechimlari</span>
      </button>

      <button
        @click="activeTab = 'workbooks'"
        :class="[
          'px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap',
          activeTab === 'workbooks'
            ? 'border-teal-500 text-teal-600 dark:text-teal-400'
            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        ]"
      >
        <span>📓 Nazorat Ishi Daftarlari</span>
      </button>

      <button
        @click="activeTab = 'worksheets'"
        :class="[
          'px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap',
          activeTab === 'worksheets'
            ? 'border-teal-500 text-teal-600 dark:text-teal-400'
            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        ]"
      >
        <span>🎯 Tayyor Dars Topshiriqlari</span>
      </button>
    </div>

    <!-- TAB 1: PRESENTATIONS (SLIDE VIEWER) -->
    <div v-if="activeTab === 'presentations'" class="space-y-4">
      <div v-if="currentPresentation" class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ currentPresentation.title }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ currentPresentation.topic }}</p>
          </div>
          <div class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
            Slayd {{ activeSlideIndex + 1 }} / {{ currentSlides.length }}
          </div>
        </div>

        <!-- Slide Canvas Display -->
        <div class="aspect-video bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-8 flex flex-col justify-between shadow-xl border border-slate-700 relative overflow-hidden">
          <div class="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <span class="text-xs font-bold text-teal-400 uppercase tracking-widest">{{ selectedGrade }}-sinf Informatika</span>
            <span class="text-xs text-slate-400 font-mono">CHSB Dars Taqdimoti</span>
          </div>

          <div v-if="activeSlide" class="my-auto space-y-4">
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{{ activeSlide.title }}</h2>
            <p class="text-sm text-teal-300 font-medium">{{ activeSlide.subtitle }}</p>

            <ul class="space-y-2.5 mt-4 text-xs sm:text-sm text-slate-300">
              <li v-for="(bullet, bIdx) in activeSlide.bullets" :key="bIdx" class="flex items-center gap-2.5">
                <span class="w-2 h-2 rounded-full bg-teal-400 shrink-0"></span>
                <span>{{ bullet }}</span>
              </li>
            </ul>
          </div>

          <!-- Bottom Navigation Controls -->
          <div class="flex items-center justify-between pt-4 border-t border-slate-700/60">
            <button
              @click="prevSlide"
              :disabled="activeSlideIndex === 0"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <span>← Oldingi Slayd</span>
            </button>

            <div class="flex items-center gap-1">
              <span
                v-for="(_, sIdx) in currentSlides"
                :key="sIdx"
                @click="activeSlideIndex = sIdx"
                :class="[
                  'w-2.5 h-2.5 rounded-full cursor-pointer transition-all',
                  activeSlideIndex === sIdx ? 'bg-teal-400 w-6' : 'bg-slate-600 hover:bg-slate-500'
                ]"
              ></span>
            </div>

            <button
              @click="nextSlide"
              :disabled="activeSlideIndex === currentSlides.length - 1"
              class="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Keyingi Slayd →</span>
            </button>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-12 text-slate-500">
        Ushbu sinf uchun dars taqdimoti yuklanmoqda...
      </div>
    </div>

    <!-- TAB 2: SOLUTIONS (BSB & CHSB SAVOLLAR HAMDA YECHIMLAR) -->
    <div v-if="activeTab === 'solutions'" class="space-y-4">
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">
              {{ selectedGrade }}-sinf BSB va CHSB Savollari hamda Bosqichma-bosqich Yechimlari
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              O‘qituvchi uchun to‘liq metodik qo‘llanma, formulalar va baholash mezonlari (rubrika).
            </p>
          </div>
          <span class="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
            Jami 15 ta topshiriq
          </span>
        </div>

        <div class="space-y-3">
          <div
            v-for="(sol, idx) in (solutions.length > 0 ? solutions : currentSolutionResource?.parsed?.questions || [])"
            :key="idx"
            class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40 transition"
          >
            <!-- Question Bar -->
            <div
              @click="toggleSolution(String(idx))"
              class="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
            >
              <div class="flex items-center gap-3">
                <span class="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  #{{ sol.number || (idx + 1) }}
                </span>
                <span class="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  {{ sol.question || `Savol #${idx + 1} bo‘yicha metodik yechim va tahlil` }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                  {{ sol.bloomLevel || 'KOGNITIV' }}
                </span>
                <span class="text-xs text-slate-400 font-bold">
                  {{ expandedSolutionId === String(idx) ? '▲ Yopish' : '▼ Yechimni ko‘rish' }}
                </span>
              </div>
            </div>

            <!-- Expanded Solution Details -->
            <div
              v-if="expandedSolutionId === String(idx)"
              class="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 space-y-3 text-xs"
            >
              <div class="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span class="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">✓ To‘g‘ri Javob va Qadamma-qadam Yechim:</span>
                <p class="text-slate-700 dark:text-slate-300 leading-relaxed">{{ sol.stepByStepSolution }}</p>
              </div>

              <div v-if="sol.solutionFormulas" class="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 font-mono text-indigo-700 dark:text-indigo-300">
                <span class="font-bold block mb-1">📐 Formulalar va Qonuniyatlar:</span>
                <code>{{ sol.solutionFormulas }}</code>
              </div>

              <div v-if="sol.authorNote" class="text-slate-500 dark:text-slate-400 italic">
                ℹ️ {{ sol.authorNote }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: WORKBOOKS (NAZORAT ISHI DAFTARLARI) -->
    <div v-if="activeTab === 'workbooks'" class="space-y-4">
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
        <!-- Printable Assessment Notebook Container -->
        <div class="max-w-3xl mx-auto border-2 border-slate-300 dark:border-slate-600 rounded-2xl p-8 bg-white dark:bg-slate-900 shadow-md space-y-6">
          <!-- Cover Title -->
          <div class="text-center border-b-2 border-slate-800 dark:border-slate-400 pb-6 space-y-2">
            <h2 class="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              O‘zbekiston Respublikasi Maktabgacha va Maktab Ta’limi Vazirligi
            </h2>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase">
              {{ selectedGrade }}-sinf Nazorat Ishi Daftari
            </h1>
            <p class="text-xs font-semibold text-teal-600 dark:text-teal-400">
              Informatika va axborot texnologiyalari fani • {{ selectedQuarter }}-Chorak
            </p>
          </div>

          <!-- Student Metadata Form -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span class="text-slate-400 block mb-1">Maktab / Muassasa:</span>
              <span class="font-bold text-slate-900 dark:text-white">Al-Xorazmiy nomidagi IT-maktab</span>
            </div>
            <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span class="text-slate-400 block mb-1">Sinf:</span>
              <span class="font-bold text-slate-900 dark:text-white">{{ selectedGrade }}-A sinf</span>
            </div>
            <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 col-span-1 sm:col-span-2">
              <span class="text-slate-400 block mb-1">O‘quvchi F.I.Sh:</span>
              <span class="font-bold text-slate-900 dark:text-white border-b border-dashed border-slate-400 block pb-1">
                ____________________________________________________________________
              </span>
            </div>
          </div>

          <!-- Answer Matrix Table (Chop etishga tayyor javoblar jadvali) -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Javoblar Qayd Varaqasi (Test Matrisasi):
            </h4>
            <div class="grid grid-cols-5 sm:grid-cols-8 gap-2 text-center text-xs">
              <div v-for="qNum in 15" :key="qNum" class="border border-slate-300 dark:border-slate-700 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80">
                <span class="block text-[10px] text-slate-400 font-bold mb-1">#{{ qNum }}</span>
                <span class="block h-6 border-b border-slate-400 font-bold"></span>
              </div>
            </div>
          </div>

          <!-- Assessment Evaluation Table -->
          <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span class="text-slate-500 dark:text-slate-400 block">Jami Ball:</span>
              <span class="font-black text-slate-900 dark:text-white text-base">___ / 40.0 ball</span>
            </div>
            <div>
              <span class="text-slate-500 dark:text-slate-400 block">Qo‘yilgan Baho:</span>
              <span class="font-black text-slate-900 dark:text-white text-base">[ 5 | 4 | 3 | 2 ]</span>
            </div>
            <div>
              <span class="text-slate-500 dark:text-slate-400 block">O‘qituvchi Imzosi:</span>
              <span class="font-black text-slate-900 dark:text-white text-base">_____________</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: WORKSHEETS (TAYYOR DARS TOPSHIRIQLARI) -->
    <div v-if="activeTab === 'worksheets'" class="space-y-4">
      <div v-if="currentWorksheet" class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
        <div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ currentWorksheet.title }}</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            45 daqiqalik dars bosqichlari bo‘yicha taqsimlangan amaliy mashqlar va kognitiv topshiriqlar.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(step, sIdx) in currentWorksheet.parsed?.steps || []"
            :key="sIdx"
            class="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/50 space-y-3"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-wide">
                {{ step.phase }}
              </span>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {{ step.timeMinutes }} daqiqa • {{ step.points }} ball
              </span>
            </div>

            <p class="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {{ step.task }}
            </p>

            <div class="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
              <span>Metodik status: Tayyor</span>
              <button class="text-teal-600 dark:text-teal-400 hover:underline font-bold cursor-pointer">
                Nusxa ko‘chirish 📋
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-12 text-slate-500">
        Ushbu sinf uchun ish varaqlari yuklanmoqda...
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  /* Clean print layout for workbooks */
  nav, aside, header, button {
    display: none !important;
  }
  body, main {
    background: white !important;
    color: black !important;
  }
}
</style>
