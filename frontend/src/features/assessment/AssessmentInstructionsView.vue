<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTenantStore } from '../tenant-context/tenantStore';
import { useStudentAdmissionStore } from '../student-admission/admissionStore';
import { useAssessmentStore } from './assessmentStore';
import { useNetworkStatus } from '../../shared/composables/useNetworkStatus';

const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();
const admissionStore = useStudentAdmissionStore();
const assessmentStore = useAssessmentStore();
const { isOnline } = useNetworkStatus();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const assessmentId = (route.params.assessmentId as string) || 'chsb-inf-11-q1';

const isStarting = ref(false);
const isRulesAgreed = ref(false);
const isLoadingOverview = ref(true);

onMounted(async () => {
  isLoadingOverview.value = true;
  try {
    await tenantStore.loadTenant(tenantSlug);
    const tenantId =
      tenantStore.currentTenant?.tenantId ||
      (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
    await assessmentStore.loadAssessmentOverview(tenantId, assessmentId);
  } finally {
    isLoadingOverview.value = false;
  }
});

// Dynamic values from loaded assessment
const assessmentTitle = computed(() => {
  return (
    assessmentStore.assessment?.title ||
    'Informatika va axborot texnologiyalari, 11-sinf. 1-ChSB'
  );
});

const quarterBadge = computed(() => {
  const q = assessmentStore.assessment?.quarter;
  return q ? `${q}-chorak baholash` : 'I chorak baholash';
});

const questionCount = computed(() => {
  return (
    assessmentStore.assessment?.questionCount ||
    assessmentStore.assessment?.questions.length ||
    15
  );
});

const maxScore = computed(() => {
  return assessmentStore.assessment?.maxScore || 40;
});

const isBsbType = computed(() => {
  const t = assessmentStore.assessment?.assessmentType;
  return t === 'BSB' || t === 'PRACTICAL' || t === 'PROJECT';
});

const durationMinutes = computed(() => {
  if (assessmentStore.assessment?.durationMinutes) {
    return assessmentStore.assessment.durationMinutes;
  }
  if (assessmentStore.assessment?.durationSeconds) {
    return Math.round(assessmentStore.assessment.durationSeconds / 60);
  }
  return 40;
});

async function startExam() {
  if (!isRulesAgreed.value) return;

  isStarting.value = true;
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  const rosterRecordId = admissionStore.confirmedStudent?.rosterRecordId || 'rec-ax-101';

  const ok = await assessmentStore.startAssessment(tenantId, assessmentId, rosterRecordId);
  isStarting.value = false;

  if (ok) {
    router.push(`/t/${tenantSlug}/assessments/${assessmentId}/attempt`);
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 sm:p-8 space-y-6 transition-colors font-sans">
    
    <!-- Assessment Header -->
    <div class="border-b border-slate-100 dark:border-slate-700/80 pb-5">
      <div class="flex items-center gap-2 mb-2">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200/70 dark:border-teal-800">
          {{ quarterBadge }}
        </span>
        <span class="text-xs text-slate-400 font-mono">
          ID: {{ assessmentId }}
        </span>
      </div>

      <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
        {{ assessmentTitle }}
      </h2>
      
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
        <span>Muassasa:</span>
        <span class="font-bold text-slate-800 dark:text-slate-200">
          {{ tenantStore.currentTenant?.displayName || 'Al-Xorazmiy nomidagi IT-maktab' }}
        </span>
      </p>
    </div>

    <!-- Student details badge -->
    <div
      v-if="admissionStore.confirmedStudent"
      class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-2"
    >
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0">
          {{ admissionStore.confirmedStudent.displayName.charAt(0) }}
        </div>
        <div>
          <span class="font-bold text-slate-900 dark:text-white block">
            {{ admissionStore.confirmedStudent.displayName }}
          </span>
          <span class="text-slate-500 dark:text-slate-400 text-[11px]">
            Sinf: {{ admissionStore.confirmedStudent.className }} • {{ admissionStore.confirmedStudent.schoolName }}
          </span>
        </div>
      </div>
      <span class="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
        ✓ Tasdiqlangan
      </span>
    </div>

    <!-- Assessment Facts Grid with Icons -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <!-- 1. Savollar soni -->
      <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/80 text-center transition hover:border-teal-400 dark:hover:border-teal-500">
        <span class="text-lg block mb-0.5">📝</span>
        <span class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Savollar</span>
        <span class="text-lg font-black text-slate-900 dark:text-white font-mono">{{ questionCount }} ta</span>
      </div>

      <!-- 2. Maksimal ball -->
      <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/80 text-center transition hover:border-teal-400 dark:hover:border-teal-500">
        <span class="text-lg block mb-0.5">🎯</span>
        <span class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Maks. ball</span>
        <span class="text-lg font-black text-slate-900 dark:text-white font-mono">{{ maxScore }} ball</span>
      </div>

      <!-- 3. Ajratilgan vaqt -->
      <div class="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 text-center transition">
        <span class="text-lg block mb-0.5">⏱️</span>
        <span class="block text-[11px] font-semibold text-teal-800 dark:text-teal-300">Vaqt</span>
        <span class="text-lg font-black text-teal-800 dark:text-teal-300 font-mono">{{ durationMinutes }} daqiqa</span>
      </div>

      <!-- 4. Savol turi -->
      <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/80 text-center transition hover:border-teal-400 dark:hover:border-teal-500">
        <span class="text-lg block mb-0.5">{{ isBsbType ? '✍️' : '🔠' }}</span>
        <span class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">Format</span>
        <span class="text-xs font-black text-slate-900 dark:text-white mt-1 block">
          {{ isBsbType ? 'Amaliy / Yozma (BSB)' : 'A / B / C / D Test' }}
        </span>
      </div>
    </div>

    <!-- Pre-Flight Technical Diagnostics -->
    <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
      <div class="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <span class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <svg class="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Texnik Tayyorgarlik Tekshiruvi:
        </span>
        <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          Tayyor
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <!-- 1. Internet -->
        <div class="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span
            class="w-2.5 h-2.5 rounded-full shrink-0"
            :class="isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'"
          ></span>
          <span class="text-[11px] font-medium text-slate-700 dark:text-slate-300">
            {{ isOnline ? "Internet: Online" : "Oflayn rejim faol" }}
          </span>
        </div>

        <!-- 2. Fullscreen -->
        <div class="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span class="text-xs">🖥️</span>
          <span class="text-[11px] font-medium text-slate-700 dark:text-slate-300">
            To'liq ekran nazorati
          </span>
        </div>

        <!-- 3. Local Cache -->
        <div class="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span class="text-xs">💾</span>
          <span class="text-[11px] font-medium text-slate-700 dark:text-slate-300">
            Avto-saqlash faol
          </span>
        </div>
      </div>
    </div>

    <!-- Instructions list -->
    <div class="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 bg-amber-50/80 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60">
      <h3 class="font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
        <span>⚠️</span>
        <span>Muhim qoidalar va intizom:</span>
      </h3>
      <ul class="list-disc list-inside space-y-1 text-amber-950 dark:text-amber-200/90 leading-relaxed">
        <li v-if="isBsbType">Har bir BSB topshirig'i va bandi bo'yicha to'liq, mantiqiy yozma yoki amaliy javob kiriting (o'qituvchi rubrika mezoniga ko'ra baholaydi).</li>
        <li v-else>Har bir savolda faqat bitta to'g'ri javob variantini belgilang.</li>
        <li>Imtihon davomida boshqa ilova yoki brauzer sahifasiga o'tish qat'iyan taqiqlanadi (nazoratchi tizimi qayd etadi).</li>
        <li>Vaqt ko'rsatkichi {{ durationMinutes }} daqiqadan orqaga sanaydi, oxirgi 5 daqiqada ogohlantirish beriladi.</li>
        <li>Barcha topshiriqlar yakunlangach, "Imtihonni yakunlash" tugmasini bosing.</li>
      </ul>
    </div>

    <!-- Error message if any -->
    <div v-if="assessmentStore.errorMessage" class="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
      {{ assessmentStore.errorMessage }}
    </div>

    <!-- Rules Agreement Checkbox -->
    <div class="pt-2">
      <label class="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 bg-slate-50/60 dark:bg-slate-900/40 cursor-pointer transition select-none">
        <input
          id="rules-agreement"
          v-model="isRulesAgreed"
          type="checkbox"
          aria-label="Imtihon qoidalariga rozilik bildirish"
          class="w-4 h-4 mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
        />
        <span class="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
          Men CHSB imtihoni qoidalari bilan to'liq tanishdim, begona yordamsiz va intizomga rioya qilgan holda topshirishga roziman.
        </span>
      </label>
    </div>

    <!-- Action Button (Safe CTA) -->
    <div class="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
      <span v-if="!isRulesAgreed" class="text-[11px] text-slate-400 font-medium">
        Boshlash uchun yuqoridagi qoidalarga rozilik bildiring
      </span>
      <button
        @click="startExam"
        :disabled="!isRulesAgreed || isStarting"
        aria-label="Imtihonni boshlash"
        class="w-full sm:w-auto px-7 py-3.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-md shadow-teal-600/20 disabled:shadow-none cursor-pointer text-xs sm:text-sm text-center flex items-center justify-center gap-2"
      >
        <span v-if="isStarting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <span>{{ isStarting ? 'Yuklanmoqda...' : `Imtihonni Boshlash (${durationMinutes} daqiqa) →` }}</span>
      </button>
    </div>

  </div>
</template>
