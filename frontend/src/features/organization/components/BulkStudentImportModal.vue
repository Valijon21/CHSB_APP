<script setup lang="ts">
import { ref, toRef } from 'vue';
import { useModalA11y } from '../../../shared/composables/useModalA11y';
import type { StudentInput, StudentGender } from '../../../entities/organization/model';
import type { ClassGroupRecord } from '../../../entities/organization/model';

const props = defineProps<{
  isOpen: boolean;
  schoolId: string;
  tenantSlug: string;
  availableClasses: ClassGroupRecord[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'bulk-import', students: StudentInput[]): void;
}>();

useModalA11y(toRef(props, 'isOpen'), () => {
  reset();
  emit('close');
});

const selectedClassId = ref(props.availableClasses[0]?.id || '');
const rawText = ref('');
const parsedStudents = ref<StudentInput[]>([]);
const isParsed = ref(false);
const isDragging = ref(false);
const uploadedFileName = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleFileInputChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    readFile(file);
  }
}

function handleFileDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    readFile(file);
  }
}

function readFile(file: File) {
  uploadedFileName.value = file.name;
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target?.result as string;
    if (text) {
      rawText.value = text;
      parseInput();
    }
  };
  reader.readAsText(file);
}

function parseInput() {
  if (!rawText.value.trim() || !selectedClassId.value) return;

  const cls = props.availableClasses.find((c) => c.id === selectedClassId.value);
  const className = cls?.name || 'Sinf';

  const lines = rawText.value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.toLowerCase().includes('familiya') && !l.toLowerCase().includes('f.i.sh'));

  const result: StudentInput[] = [];

  for (const line of lines) {
    // Delimiter: vergul, nuqtali vergul yoki tab (Excel copy-paste)
    const parts = line.split(/[,;\t]/).map((p) => p.trim());
    if (parts.length >= 1) {
      let rawName = cleanPrefix(parts[0] ?? '');
      let gender: StudentGender = 'M';
      let birthDate = '2009-01-01';

      if (parts[1]) {
        const g = parts[1].toUpperCase();
        if (g === 'M' || g === 'F') gender = g;
      }
      if (parts[2] && /^\d{4}-\d{2}-\d{2}$/.test(parts[2])) {
        birthDate = parts[2];
      }

      const nameTokens = rawName.split(' ').filter(Boolean);
      const lastName = nameTokens[0] || 'Familiyasiz';
      const firstName = nameTokens[1] || 'Ismsiz';
      const middleName = nameTokens.slice(2).join(' ') || undefined;

      result.push({
        tenantSlug: props.tenantSlug,
        schoolId: props.schoolId,
        classGroupId: selectedClassId.value,
        className,
        firstName,
        lastName,
        middleName,
        gender,
        birthDate,
        status: 'eligible',
      });
    }
  }

  parsedStudents.value = result;
  isParsed.value = true;
}

function removeStudent(index: number) {
  parsedStudents.value.splice(index, 1);
  if (parsedStudents.value.length === 0) {
    isParsed.value = false;
  }
}

function handleConfirm() {
  if (parsedStudents.value.length > 0) {
    emit('bulk-import', [...parsedStudents.value]);
    reset();
    emit('close');
  }
}

function reset() {
  rawText.value = '';
  parsedStudents.value = [];
  isParsed.value = false;
  uploadedFileName.value = null;
  if (fileInputRef.value) fileInputRef.value.value = '';
}

function cleanPrefix(name: string): string {
  return name.replace(/^\d+[\s.)-]+/, '').trim();
}

function downloadSample() {
  const content =
    '\uFEFF' +
    [
      'F.I.SH,Jinsi,Tug\'ilgan sana',
      'Olimov Jasurbek Anvarovich,M,2009-04-12',
      'Aliyeva Madina Rustam qizi,F,2009-09-20',
      'Boboyev Sardor Ilhomovich,M,2009-02-14',
      'Karimova Dilnoza Alisher qizi,F,2009-11-05',
    ].join('\r\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'oquvchilar_shablon.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div
    v-if="isOpen"
    role="dialog"
    aria-modal="true"
    aria-labelledby="bulk-student-import-modal-title"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
  >
    <div
      class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
    >
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <div>
          <h3 id="bulk-student-import-modal-title" class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            O'quvchilarni Ommaviy Yuklash (Excel / CSV)
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Excel / CSV faylini yuklash yoki nusxalangan ro'yxatni joylashtirish orqali butun sinfni bir martada qo'shish
          </p>
        </div>

        <button
          type="button"
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 1. Sinf tanlash va Namuna yuklash -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2">
          <label class="font-bold text-slate-700 dark:text-slate-300">Biriktiriladigan Sinf:</label>
          <select
            v-model="selectedClassId"
            class="p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-teal-800 dark:text-teal-300"
          >
            <option v-for="c in availableClasses" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <button
          type="button"
          @click="downloadSample"
          class="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Namuna CSV / Excel shablonini yuklab olish
        </button>
      </div>

      <!-- Hidden File Input -->
      <input
        ref="fileInputRef"
        type="file"
        accept=".csv,.xlsx,.xls,.tsv,.txt"
        class="hidden"
        @change="handleFileInputChange"
      />

      <!-- 2. Fayl Yuklash Dropzone va Matn maydoni -->
      <div v-if="!isParsed" class="space-y-3 text-xs">
        <!-- Interactive Drag & Drop Area -->
        <div
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleFileDrop"
          :class="[
            'border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2',
            isDragging
              ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30'
              : 'border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/60'
          ]"
          @click="triggerFileInput"
        >
          <div class="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-800 dark:text-teal-300 text-xl shadow-xs">
            📊
          </div>
          <div>
            <span class="font-bold text-slate-800 dark:text-white block">
              Excel (.xlsx, .xls) yoki CSV faylini shu yerga tashlang
            </span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              yoki kompyuterdan tanlash uchun bosing
            </span>
          </div>
          <span v-if="uploadedFileName" class="px-2.5 py-1 rounded bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-mono text-[11px] font-semibold">
            📄 {{ uploadedFileName }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <div class="h-px bg-slate-200 dark:border-slate-700 flex-1"></div>
          <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Yoki matn sifatida kiriting</span>
          <div class="h-px bg-slate-200 dark:border-slate-700 flex-1"></div>
        </div>

        <textarea
          v-model="rawText"
          rows="5"
          placeholder="Excel jadvalidan nusxalangan qatorlarni bu yerga joylashtiring (har bir qatorda bitta o'quvchi).&#10;Masalan:&#10;1. Olimov Jasurbek, M, 2009-04-12&#10;2. Aliyeva Madina, F, 2009-09-20"
          class="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
        ></textarea>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            @click="parseInput"
            :disabled="!rawText.trim()"
            class="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer min-h-[38px] flex items-center gap-1.5"
          >
            <span>Ro'yxatni Tahlil Qilish (Preview) →</span>
          </button>
        </div>
      </div>

      <!-- 3. Tahlil qilingan natija (Preview Table) -->
      <div v-else class="space-y-3 text-xs">
        <div class="flex items-center justify-between">
          <span class="font-bold text-slate-800 dark:text-white">
            Tahlil natijasi: {{ parsedStudents.length }} nafar o'quvchi aniqlandi
          </span>
          <button
            type="button"
            @click="isParsed = false"
            class="text-xs text-teal-700 dark:text-teal-400 hover:underline cursor-pointer font-medium"
          >
            ← Boshqa fayl yoki matn kiritish
          </button>
        </div>

        <div class="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th class="p-2.5 w-10 text-center">№</th>
                <th class="p-2.5">Familiya va Ism</th>
                <th class="p-2.5 text-center">Jinsi</th>
                <th class="p-2.5 text-center">Tug'ilgan sana</th>
                <th class="p-2.5 text-right">O'chirish</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
              <tr v-for="(stu, idx) in parsedStudents" :key="idx" class="hover:bg-slate-50/50 dark:hover:bg-slate-700/40">
                <td class="p-2.5 text-center font-mono text-slate-400">{{ idx + 1 }}</td>
                <td class="p-2.5 font-bold text-slate-900 dark:text-white">{{ stu.lastName }} {{ stu.firstName }} {{ stu.middleName || '' }}</td>
                <td class="p-2.5 text-center">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="stu.gender === 'M' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' : 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300'">
                    {{ stu.gender === 'M' ? "O'g'il" : "Qiz" }}
                  </span>
                </td>
                <td class="p-2.5 text-center font-mono text-slate-600 dark:text-slate-400">{{ stu.birthDate }}</td>
                <td class="p-2.5 text-right">
                  <button
                    type="button"
                    @click="removeStudent(idx)"
                    class="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                    title="Qatordan o'chirish"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
          <span class="text-xs text-slate-500 dark:text-slate-400">
            Biriktirilmoqda: <strong class="text-teal-800 dark:text-teal-300">{{ availableClasses.find(c => c.id === selectedClassId)?.name }}</strong>
          </span>

          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer min-h-[38px]"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              @click="handleConfirm"
              class="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer min-h-[38px] flex items-center gap-1.5"
            >
              <span>Tasdiqlash va Bazaga Saqlash ({{ parsedStudents.length }} ta)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


