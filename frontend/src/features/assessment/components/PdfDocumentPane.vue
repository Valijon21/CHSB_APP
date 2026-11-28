<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
}

const props = withDefaults(
  defineProps<{
    assessmentId: string;
    sourcePdfUrl?: string;
    fileName?: string;
    heightClass?: string;
  }>(),
  {
    sourcePdfUrl: '',
    fileName: '',
    heightClass: 'h-[74vh] min-h-[520px]',
  }
);

const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const numPages = ref(0);
const scale = ref(1.1);
const canvasRefs = ref<Record<number, HTMLCanvasElement | null>>({});

let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
let renderGeneration = 0;

const zoomPercent = computed(() => Math.round(scale.value * 100));

function setCanvasRef(pageNumber: number, el: unknown) {
  if (el instanceof HTMLCanvasElement) {
    canvasRefs.value[pageNumber] = el;
  } else if (el === null) {
    delete canvasRefs.value[pageNumber];
  }
}

function readAuthToken(): string | null {
  try {
    const studentToken = sessionStorage.getItem('chsb_student_session_token');
    if (studentToken) return studentToken;

    const rawSession =
      sessionStorage.getItem('chsb_auth_session') ||
      localStorage.getItem('chsb_auth_session');
    if (!rawSession) return null;
    const parsed = JSON.parse(rawSession);
    return parsed?.token || parsed?.user?.token || null;
  } catch {
    return null;
  }
}

function resolvePdfEndpoint(): string {
  if (props.sourcePdfUrl && /^https?:\/\//i.test(props.sourcePdfUrl)) {
    return props.sourcePdfUrl;
  }
  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.port === '5173' ||
      window.location.port === '5174');
  const apiBase = isLocal ? '/api/v1' : (import.meta.env.VITE_API_BASE_URL || '/api/v1');
  if (props.sourcePdfUrl && props.sourcePdfUrl.startsWith('/api/v1/')) {
    const suffix = props.sourcePdfUrl.slice('/api/v1'.length);
    return `${apiBase.replace(/\/$/, '')}${suffix}`;
  }
  return `${apiBase.replace(/\/$/, '')}/assessments/${encodeURIComponent(props.assessmentId)}/pdf`;
}

async function renderAllPages() {
  if (!pdfDoc) return;
  const currentGen = ++renderGeneration;
  await nextTick();

  for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
    if (currentGen !== renderGeneration) return;
    const canvas = canvasRefs.value[pageNumber];
    if (!canvas) continue;

    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    const page = await pdfDoc.getPage(pageNumber);
    if (currentGen !== renderGeneration) return;

    const viewport = page.getViewport({ scale: scale.value });
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    await page.render({ canvasContext: ctx, canvas, viewport }).promise;
  }
}

async function loadPdfDocument() {
  if (!props.assessmentId) return;
  isLoading.value = true;
  errorMessage.value = null;
  numPages.value = 0;

  if (pdfDoc) {
    await pdfDoc.destroy().catch(() => {});
    pdfDoc = null;
  }

  try {
    const token = readAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(resolvePdfEndpoint(), { headers });
    if (!res.ok) {
      throw new Error(
        res.status === 404
          ? 'Imtihon uchun PDF hujjat topilmadi.'
          : "Asl PDF hujjatni yuklashda xatolik yuz berdi."
      );
    }

    const buffer = await res.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    });
    pdfDoc = await loadingTask.promise;
    numPages.value = pdfDoc.numPages;
    isLoading.value = false;
    await renderAllPages();
  } catch (err: unknown) {
    errorMessage.value = (err as Error)?.message || "PDF hujjatni ko'rsatishda xatolik yuz berdi.";
    isLoading.value = false;
  }
}

function zoomOut() {
  scale.value = Math.max(0.75, Math.round((scale.value - 0.15) * 100) / 100);
}

function zoomIn() {
  scale.value = Math.min(2.0, Math.round((scale.value + 0.15) * 100) / 100);
}

function resetZoom() {
  scale.value = 1.1;
}

watch(scale, () => {
  if (pdfDoc) {
    renderAllPages();
  }
});

watch(
  () => [props.assessmentId, props.sourcePdfUrl],
  () => {
    loadPdfDocument();
  }
);

onMounted(() => {
  loadPdfDocument();
});

onBeforeUnmount(() => {
  renderGeneration++;
  if (pdfDoc) {
    pdfDoc.destroy().catch(() => {});
    pdfDoc = null;
  }
});
</script>

<template>
  <section
    class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden flex flex-col"
    :class="heightClass"
    @contextmenu.prevent
    aria-label="Asl imtihon hujjati (PDF)"
  >
    <!-- Toolbar -->
    <div class="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap shrink-0">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-base shrink-0">📄</span>
        <div class="min-w-0">
          <h3 class="text-xs font-bold text-slate-900 dark:text-white truncate">
            {{ fileName || 'Asl imtihon hujjati' }}
          </h3>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">
            {{ numPages > 0 ? `${numPages} sahifa • Asl ko'rinish` : 'PDF hujjat yuklanmoqda...' }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          @click="zoomOut"
          aria-label="PDF ni kichraytirish"
          class="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
        >
          −
        </button>
        <button
          type="button"
          @click="resetZoom"
          aria-label="PDF masshtabini tiklash"
          class="px-2 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-mono font-bold text-[11px] hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
        >
          {{ zoomPercent }}%
        </button>
        <button
          type="button"
          @click="zoomIn"
          aria-label="PDF ni kattalashtirish"
          class="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
        >
          +
        </button>
      </div>
    </div>

    <!-- Scrollable PDF Canvas Container -->
    <div class="flex-1 overflow-y-auto bg-slate-200/75 dark:bg-slate-950/75 p-3 sm:p-4 space-y-4">
      <div v-if="isLoading" class="h-full min-h-[260px] flex flex-col items-center justify-center text-center gap-3">
        <div class="w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs font-medium text-slate-600 dark:text-slate-300">
          Asl PDF sahifalari tayyorlanmoqda...
        </p>
      </div>

      <div v-else-if="errorMessage" class="h-full min-h-[260px] flex flex-col items-center justify-center text-center gap-3 p-4">
        <p class="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-4 py-3 rounded-xl">
          {{ errorMessage }}
        </p>
        <button
          type="button"
          @click="loadPdfDocument"
          class="px-3.5 py-2 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold cursor-pointer"
        >
          Qayta yuklash
        </button>
      </div>

      <template v-else>
        <div
          v-for="pageNumber in numPages"
          :key="pageNumber"
          class="flex flex-col items-center gap-1.5"
        >
          <div class="bg-white rounded-lg shadow-md overflow-hidden border border-slate-300/60 dark:border-slate-700 max-w-full overflow-x-auto">
            <canvas
              :ref="(el) => setCanvasRef(pageNumber, el)"
              class="block"
            ></canvas>
          </div>
          <span class="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {{ pageNumber }} / {{ numPages }} sahifa
          </span>
        </div>
      </template>
    </div>
  </section>
</template>
