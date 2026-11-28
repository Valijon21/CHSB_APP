<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';
import { useToast } from '../../../shared/composables/useToast';
import CreateAssessmentModal from './CreateAssessmentModal.vue';
import type { CreateAssessmentInput } from '../../../entities/assessment/model';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();
const toast = useToast();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const isCreateModalOpen = ref(false);
const pdfUploadInputRef = ref<HTMLInputElement | null>(null);
const targetPdfAssessmentId = ref<string | null>(null);
const uploadingPdfAssessmentId = ref<string | null>(null);

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  await teacherStore.loadTeacherData(tenantId);
});

async function handleCreateAssessment(input: CreateAssessmentInput) {
  try {
    const created = await teacherStore.createAssessment(input);
    toast.success(`"${created.title}" muvaffaqiyatli yaratildi!`, 'Imtihon yaratildi');
  } catch (err: unknown) {
    const msg = (err as Error)?.message || "Imtihon yaratishda xatolik yuz berdi.";
    toast.error(msg, 'Xatolik');
  }
}

function triggerAttachPdf(assessmentId: string) {
  targetPdfAssessmentId.value = assessmentId;
  if (pdfUploadInputRef.value) {
    pdfUploadInputRef.value.value = '';
    pdfUploadInputRef.value.click();
  }
}

async function handleAttachPdfSelected(event: Event) {
  const inputEl = event.target as HTMLInputElement;
  const file = inputEl.files?.[0];
  const assessmentId = targetPdfAssessmentId.value;
  if (!file || !assessmentId) return;

  uploadingPdfAssessmentId.value = assessmentId;
  try {
    const updated = await teacherStore.attachAssessmentPdf(assessmentId, file);
    toast.success(`"${updated.sourcePdfName || file.name}" imtihonga biriktirildi!`, 'PDF biriktirildi');
  } catch (err: unknown) {
    const msg = (err as Error)?.message || "PDF faylni yuklashda xatolik yuz berdi.";
    toast.error(msg, 'Xatolik');
  } finally {
    uploadingPdfAssessmentId.value = null;
    targetPdfAssessmentId.value = null;
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 class="text-xl font-bold text-slate-900 dark:text-white">Baholashlar Boshqaruvi (Assessments Catalog)</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          CHSB choraklik imtihonlari va ularning faollik holatlari.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="isCreateModalOpen = true"
          aria-label="Yangi imtihon qo'shish"
          class="px-4 py-2 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[38px]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Yangi Imtihon Qo'shish</span>
        </button>

        <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          Faol nazorat ishlari: {{ teacherStore.assessments.length }} ta
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Baholashlar yuklanmoqda...</p>
    </div>

    <!-- Assessments Cards -->
    <div v-else class="space-y-4">
      <div
        v-for="asm in teacherStore.assessments"
        :key="asm.id"
        class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-6 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div class="space-y-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-900 dark:bg-slate-700 text-white">
              {{ asm.assessmentType || 'CHSB' }}
            </span>
            <span class="px-2.5 py-0.5 rounded text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              {{ asm.grade }}-sinf
            </span>
            <span v-if="asm.targetGroup && asm.targetGroup !== 'all'" class="px-2.5 py-0.5 rounded text-xs font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
              🏷️ {{ asm.targetGroup }}
            </span>
            <span v-else class="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              Butun sinf
            </span>
            <span class="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {{ asm.quarter }}-chorak
            </span>
            <span class="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              {{ asm.status === 'available' ? 'Faol / Ochiq' : 'Rejalashtirilgan' }}
            </span>
            <span
              v-if="asm.hasPdf"
              class="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
              :title="asm.sourcePdfName || 'Asl PDF biriktirilgan'"
            >
              📄 PDF
            </span>
          </div>

          <h2 class="text-lg font-bold text-slate-900 dark:text-white">
            {{ asm.title }}
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Fan: <span class="font-medium text-slate-700 dark:text-slate-300">{{ asm.subject }}</span> • Maksimal ball: <span class="font-bold text-teal-800 dark:text-teal-400">{{ asm.maxScore }} ball</span>
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-6 text-xs text-slate-600 dark:text-slate-300">
          <div class="text-center">
            <span class="text-slate-400 dark:text-slate-400 block text-[11px]">Savollar</span>
            <span class="font-bold text-slate-900 dark:text-white text-sm">{{ asm.questionCount }} ta</span>
          </div>
          <div class="text-center">
            <span class="text-slate-400 dark:text-slate-400 block text-[11px]">Vaqt</span>
            <span class="font-bold text-slate-900 dark:text-white text-sm">{{ asm.durationMinutes }} daqiqa</span>
          </div>
          <div class="text-center">
            <span class="text-slate-400 dark:text-slate-400 block text-[11px]">Ishtirok</span>
            <span class="font-bold text-indigo-700 dark:text-indigo-400 text-sm">
              {{ teacherStore.results.filter((r) => r.assessmentId === asm.id).length }} ta topshirildi
            </span>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              @click="triggerAttachPdf(asm.id)"
              :disabled="uploadingPdfAssessmentId === asm.id"
              :aria-label="asm.hasPdf ? 'Imtihon PDF faylini almashtirish' : 'Imtihonga asl PDF fayl biriktirish'"
              class="px-3 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg font-semibold transition flex items-center gap-1.5 shadow-2xs text-xs min-h-[38px] cursor-pointer disabled:opacity-50"
              :title="asm.hasPdf ? `Yuklangan: ${asm.sourcePdfName || 'PDF'} (almashtirish)` : 'Asl PDF fayl biriktirish'"
            >
              <span>📄</span>
              <span>{{ uploadingPdfAssessmentId === asm.id ? 'Yuklanmoqda...' : (asm.hasPdf ? 'PDF almashtirish' : 'PDF biriktirish') }}</span>
            </button>

            <router-link
              :to="`/t/${tenantSlug}/teacher/assessments/${asm.id}/emaktab-sync`"
              aria-label="Baholarni eMaktab jurnaliga o'tkazish"
              class="px-3 py-2 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg font-semibold transition flex items-center gap-1.5 shadow-2xs text-xs min-h-[38px]"
              title="Baholarni eMaktab jurnaliga o'tkazish"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>eMaktab</span>
            </router-link>

            <router-link
              :to="`/t/${tenantSlug}/teacher/assessments/${asm.id}/live`"
              aria-label="Jonli nazorat xonasiga o'tish"
              class="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-lg font-semibold transition flex items-center gap-1.5 shadow-2xs text-xs min-h-[38px]"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-ping"></span>
              <span>Jonli Nazorat</span>
            </router-link>

            <router-link
              :to="`/t/${tenantSlug}/teacher/assessments/${asm.id}`"
              aria-label="Baholash tahlilini ko'rish"
              class="px-3 py-2 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white rounded-lg font-semibold transition text-xs min-h-[38px] flex items-center"
            >
              Tahlilni ko'rish →
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden file input for attaching PDF to existing assessments -->
    <input
      ref="pdfUploadInputRef"
      type="file"
      accept=".pdf,application/pdf"
      @change="handleAttachPdfSelected"
      class="hidden"
    />

    <!-- Create Assessment Modal -->
    <CreateAssessmentModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @create="handleCreateAssessment"
    />
  </div>
</template>


