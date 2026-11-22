<script setup lang="ts">
import { ref } from 'vue';
import { generateSampleRosterCsv } from '../services/rosterParserService';
import { readSpreadsheetFile } from '../services/excelFileReaderService';

const emit = defineEmits<{
  (e: 'import-roster', content: string): void;
}>();

const activeTab = ref<'file' | 'text'>('file');
const pastedText = ref<string>('');
const isDragging = ref<boolean>(false);
const fileName = ref<string | null>(null);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    processFile(file);
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    processFile(file);
  }
}

async function processFile(file: File) {
  fileName.value = file.name;
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const text = await readSpreadsheetFile(file);
    if (!text || text.trim().length === 0) {
      throw new Error("Fayl bo'sh yoki o'qib bo'lmadi.");
    }
    emit('import-roster', text);
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : "Faylni o'qishda xatolik yuz berdi.";
  } finally {
    isLoading.value = false;
  }
}

function handleTextSubmit() {
  if (pastedText.value.trim()) {
    emit('import-roster', pastedText.value);
  }
}

function downloadSample() {
  const sample = generateSampleRosterCsv();
  const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'eMaktab_sinf_namuna.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-2xs">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
      <div>
        <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <svg class="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          eMaktab Sinf Ro'yxatini Yuklash
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          eMaktab jurnalidan eksport qilingan Excel (.xls, .xlsx), CSV yoki matnli ro'yxatni yuklang
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="downloadSample"
          class="text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800/60 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Namuna CSV yuklash
        </button>

        <!-- Tab almashtirish -->
        <div class="flex rounded-lg bg-slate-100 dark:bg-slate-700/60 p-0.5 text-xs font-semibold">
          <button
            type="button"
            :class="[
              'px-3 py-1 rounded-md transition-all',
              activeTab === 'file'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
            ]"
            @click="activeTab = 'file'"
          >
            Fayl (.xls, .xlsx, .csv)
          </button>
          <button
            type="button"
            :class="[
              'px-3 py-1 rounded-md transition-all',
              activeTab === 'text'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
            ]"
            @click="activeTab = 'text'"
          >
            Matn nusxasi
          </button>
        </div>
      </div>
    </div>

    <!-- Xatolik xabari -->
    <div
      v-if="errorMessage"
      class="mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ errorMessage }}</span>
      </div>
      <button type="button" @click="errorMessage = null" class="text-rose-500 hover:text-rose-700">✕</button>
    </div>

    <!-- 1. Fayl yuklash (Dropzone) -->
    <div
      v-if="activeTab === 'file'"
      class="border-2 border-dashed rounded-xl p-6 text-center transition-colors relative"
      :class="[
        isDragging
          ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20'
          : 'border-slate-300 dark:border-slate-600 hover:border-teal-400 dark:hover:border-teal-500',
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input
        type="file"
        id="roster-file-input"
        accept=".xlsx,.xls,.csv,.txt"
        class="hidden"
        @change="handleFileSelect"
      />
      <label for="roster-file-input" class="cursor-pointer flex flex-col items-center">
        <!-- Yuklanish holati indikatori -->
        <div
          v-if="isLoading"
          class="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3 animate-spin"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <div
          v-else
          class="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <span class="text-sm font-bold text-slate-800 dark:text-white">
          <span v-if="isLoading">Excel fayli tahlil qilinmoqda...</span>
          <span v-else-if="fileName" class="text-teal-600 dark:text-teal-400">📄 {{ fileName }} (Yuklandi)</span>
          <span v-else>eMaktab Excel (.xls, .xlsx), CSV yoki TXT faylini bu yerga tashlang</span>
        </span>
        <span class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          yoki kompyuterdan tanlash uchun bosing (drag & drop qo'llab-quvvatlanadi)
        </span>
      </label>
    </div>

    <!-- 2. Matn kiritish (Textarea) -->
    <div v-else class="space-y-3">
      <textarea
        v-model="pastedText"
        rows="4"
        placeholder="Masalan:&#10;1. O'ktamov Jasur&#10;2. Aliyeva Madina&#10;3. Boboyev Sardor"
        class="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
      ></textarea>
      <div class="flex justify-end">
        <button
          type="button"
          @click="handleTextSubmit"
          :disabled="!pastedText.trim()"
          class="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
        >
          Ro'yxatni Tahlil Qilish
        </button>
      </div>
    </div>
  </div>
</template>
