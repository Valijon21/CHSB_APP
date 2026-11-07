<script setup lang="ts">
import { computed } from 'vue';
import type { AssessmentResult } from '../../entities/result/model';
import QrCodeRenderer from '../../shared/components/QrCodeRenderer.vue';

const props = defineProps<{
  isOpen: boolean;
  result: AssessmentResult;
  schoolName?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const certificateSerial = computed(() => {
  const cleanId = props.result.attemptId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  return `CHSB-CERT-2026-${cleanId || 'REG890'}`;
});

const verifyUrl = computed(() => {
  return `https://chsb.uz/verify/${certificateSerial.value}`;
});

const formattedDate = computed(() => {
  const d = props.result.submittedAt ? new Date(props.result.submittedAt) : new Date();
  return d.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

const gradeLevel = computed(() => {
  const pct = props.result.percentage;
  if (pct >= 86) return "A'lo (I darajali)";
  if (pct >= 71) return "Yaxshi (II darajali)";
  if (pct >= 56) return "Qoniqarli (III darajali)";
  return "Ishtirokchi";
});

function handlePrint() {
  window.print();
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
    <!-- Backdrop (hidden on print) -->
    <div
      class="fixed inset-0 bg-slate-900/80 backdrop-blur-xs transition-opacity print:hidden"
      @click="emit('close')"
    ></div>

    <div class="min-h-full flex items-center justify-center p-3 sm:p-6 print:p-0">
      <div class="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden print:border-none print:shadow-none print:max-w-none print:rounded-none">
        <!-- Modal Action Bar (hidden in print) -->
        <div class="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span class="text-xs sm:text-sm font-semibold tracking-wide">
              Rasmiy A4 Sertifikat Ko'rinishi
            </span>
          </div>

          <div class="flex items-center gap-2.5">
            <button
              type="button"
              @click="handlePrint"
              class="inline-flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Chop etish / PDF saqlash</span>
            </button>

            <button
              type="button"
              @click="emit('close')"
              class="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              title="Yopish"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Printable Certificate Sheet (A4 Landscape Layout) -->
        <div class="printable-certificate p-6 sm:p-10 bg-gradient-to-br from-amber-50/40 via-white to-teal-50/30 print:p-8">
          <div class="border-4 border-amber-600/30 p-2 sm:p-3 rounded-2xl bg-white shadow-xs">
            <div class="border-2 border-teal-800 p-6 sm:p-10 rounded-xl relative text-center">
              <!-- Watermark Ornament in Background -->
              <div class="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <svg class="w-96 h-96" viewBox="0 0 100 100" fill="currentColor">
                  <circle cx="50" cy="50" r="45" stroke="currentColor" stroke-width="2" fill="none" />
                  <path d="M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18" stroke="currentColor" stroke-width="1" />
                </svg>
              </div>

              <!-- Header -->
              <div class="mb-6 relative z-10">
                <p class="text-[10px] sm:text-xs font-semibold tracking-widest text-slate-500 uppercase">
                  O'zbekiston Respublikasi Maktabgacha va Maktab Ta'limi Vazirligi
                </p>
                <p class="text-[9px] sm:text-[11px] font-medium text-teal-800 tracking-wider uppercase mt-0.5">
                  Viloyat Maktablari ChSB Yagona Baholash Tizimi
                </p>
                <div class="my-3 flex items-center justify-center gap-3">
                  <div class="h-0.5 w-12 bg-amber-600/50"></div>
                  <h1 class="text-2xl sm:text-4xl font-extrabold text-teal-950 font-serif tracking-wider uppercase">
                    Sertifikat
                  </h1>
                  <div class="h-0.5 w-12 bg-amber-600/50"></div>
                </div>
                <p class="text-xs text-amber-800 font-semibold italic">
                  Choraklik Baholash Muvaffaqiyatli Topshirilganligi To'g'risida
                </p>
              </div>

              <!-- Certificate Body -->
              <div class="my-6 relative z-10 max-w-2xl mx-auto space-y-3">
                <p class="text-xs sm:text-sm text-slate-600">
                  Ushbu rasmiy sertifikat tasdiqlaydiki:
                </p>
                <h2 class="text-xl sm:text-3xl font-bold text-slate-900 border-b-2 border-teal-800/40 pb-2 inline-block px-6">
                  {{ result.studentName }}
                </h2>
                <p class="text-xs sm:text-sm text-slate-700 font-medium">
                  {{ schoolName || "Al-Xorazmiy nomidagi ixtisoslashtirilgan maktab-internati" }}, {{ result.className }}
                </p>
                <p class="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
                  1-Chorak yakuniy nazorati bo'yicha <strong>Informatika va axborot texnologiyalari</strong> fanidan
                  muvaffaqiyatli imtihon topshirdi va quyidagi ko'rsatkichni qayd etdi:
                </p>

                <!-- Score Callout Box -->
                <div class="my-4 py-3 px-6 bg-teal-50/80 border border-teal-200 rounded-xl inline-flex items-center gap-8">
                  <div>
                    <span class="block text-[10px] text-teal-700 uppercase font-bold">To'plangan Ball</span>
                    <span class="text-lg sm:text-2xl font-extrabold text-teal-950 font-mono">
                      {{ result.score }} / {{ result.maxScore }}
                    </span>
                  </div>
                  <div class="h-8 w-px bg-teal-200"></div>
                  <div>
                    <span class="block text-[10px] text-teal-700 uppercase font-bold">Natija Foizi</span>
                    <span class="text-lg sm:text-2xl font-extrabold text-emerald-800 font-mono">
                      {{ result.percentage }}%
                    </span>
                  </div>
                  <div class="h-8 w-px bg-teal-200"></div>
                  <div>
                    <span class="block text-[10px] text-teal-700 uppercase font-bold">Daraja</span>
                    <span class="text-xs sm:text-sm font-bold text-teal-900">
                      {{ gradeLevel }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Footer with QR Verification & Signature Stamps -->
              <div class="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-end justify-between gap-4 text-left relative z-10">
                <div class="space-y-1 text-xs">
                  <p class="text-slate-500 font-medium">
                    Sertifikat raqami: <strong class="font-mono text-slate-800">{{ certificateSerial }}</strong>
                  </p>
                  <p class="text-slate-500 font-medium">
                    Berilgan sana: <strong class="text-slate-800">{{ formattedDate }}</strong>
                  </p>
                  <p class="text-[11px] text-slate-400 max-w-xs leading-tight">
                    Haqiqiylikni tasdiqlash uchun QR-kodni skanerlang yoki rasmiy portalga ushbu raqamni kiriting.
                  </p>
                </div>

                <!-- Digital Seal & QR Code -->
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16 rounded-full border-2 border-dashed border-teal-700 flex flex-col items-center justify-center text-teal-800 text-[9px] font-bold uppercase text-center p-1">
                    <span>CHSB</span>
                    <span class="text-[8px] text-amber-700">Tasdiq</span>
                    <span>2026</span>
                  </div>

                  <div class="p-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <QrCodeRenderer :value="verifyUrl" :size="84" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  .printable-certificate,
  .printable-certificate * {
    visibility: visible;
  }
  .printable-certificate {
    position: absolute;
    left: 0;
    top: 0;
    width: 100vw;
    margin: 0;
    padding: 1cm !important;
    background: white !important;
  }
  @page {
    size: A4 landscape;
    margin: 0;
  }
}
</style>

