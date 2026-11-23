<script setup lang="ts">
import { ref, toRef, computed } from 'vue';
import { useModalA11y } from '../../../shared/composables/useModalA11y';
import type { StudentInput } from '../../../entities/organization/model';
import type { ClassGroupRecord } from '../../../entities/organization/model';
import { parseSmartTableText } from '../services/smartTableTextParser';
import { readSpreadsheetFile } from '../../emaktab/services/excelFileReaderService';
import { parseEmaktabJournal } from '../../emaktab/services/emaktabJournalParser';

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

const activeTab = ref<'file' | 'text'>('file');
const selectedClassId = ref(props.availableClasses[0]?.id || '');
const rawText = ref('');
const parsedStudents = ref<StudentInput[]>([]);
const isParsed = ref(false);
const isFileLoading = ref(false);
const fileError = ref<string | null>(null);
const uploadedFileName = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

const selectedClass = computed(() => {
  return props.availableClasses.find((c) => c.id === selectedClassId.value);
});

function handleTabChange(tab: 'file' | 'text') {
  activeTab.value = tab;
  fileError.value = null;
}

function parseInput() {
  fileError.value = null;
  if (!rawText.value.trim() || !selectedClassId.value) return;

  // Binar fayl tekshiruvi
  if (rawText.value.includes('ࡱ') || rawText.value.includes('\u0000')) {
    fileError.value =
      "Diqqat: Siz ikkilik (binary) Excel faylini matn sifatida nusxalagansiz. Iltimos, faylni '📁 Excel / CSV Fayl Yuklash' bo'limi orqali to'g'ridan-to'g'ri yuklang.";
    return;
  }

  const cls = selectedClass.value;
  const className = cls?.name || 'Sinf';

  const context = {
    tenantSlug: props.tenantSlug,
    schoolId: props.schoolId,
    classGroupId: selectedClassId.value,
    className,
  };

  const students = parseSmartTableText(rawText.value, context);
  if (students.length === 0) {
    fileError.value = "Kiritilgan matndan birorta ham o'quvchi aniqlanmadi. Formatni tekshirib qaytadan urinib ko'ring.";
    return;
  }

  parsedStudents.value = students;
  isParsed.value = true;
}

async function handleFileUpload(file: File) {
  fileError.value = null;
  uploadedFileName.value = file.name;
  isFileLoading.value = true;

  try {
    const csvContent = await readSpreadsheetFile(file);
    if (!csvContent || csvContent.trim().length === 0) {
      throw new Error("Fayl bo'sh yoki o'qib bo'lmadi.");
    }

    const cls = selectedClass.value;
    const currentClassName = cls?.name || 'Sinf';

    // 1. eMaktab rasmiy jurnali bo'lsa
    const journalData = parseEmaktabJournal(csvContent);
    if (journalData.students.length > 0) {
      // Agar jurnalda sinf nomi bo'lsa va sinflar ro'yxatida mavjud bo'lsa, moslashtirish
      if (journalData.metadata.className) {
        const matchedCls = props.availableClasses.find(
          (c) => c.name.toLowerCase().replace(/\s+/g, '') === journalData.metadata.className.toLowerCase().replace(/\s+/g, '')
        );
        if (matchedCls) {
          selectedClassId.value = matchedCls.id;
        }
      }

      const activeClassName = selectedClass.value?.name || currentClassName;

      parsedStudents.value = journalData.students.map((st) => {
        const fullName = st.fullNameLatin || st.fullName;
        const tokens = fullName.split(/\s+/).filter(Boolean);
        const lastName = tokens[0] || 'Familiyasiz';
        const firstName = tokens[1] || 'Ismsiz';
        const middleName = tokens.slice(2).join(' ') || undefined;

        // Jinsini familiya yoki sharifdan aniqlash
        const isFemale =
          fullName.toLowerCase().includes('qizi') ||
          lastName.toLowerCase().endsWith('eva') ||
          lastName.toLowerCase().endsWith('ova') ||
          lastName.toLowerCase().endsWith('yeva');

        return {
          tenantSlug: props.tenantSlug,
          schoolId: props.schoolId,
          classGroupId: selectedClassId.value,
          className: activeClassName,
          lastName,
          firstName,
          middleName,
          gender: isFemale ? 'F' : 'M',
          birthDate: '2009-01-01',
          emaktabId: st.emaktabId || undefined,
          status: 'eligible',
        };
      });

      isParsed.value = true;
      return;
    }

    // 2. Standart Excel/CSV jadvali bo'lsa
    const context = {
      tenantSlug: props.tenantSlug,
      schoolId: props.schoolId,
      classGroupId: selectedClassId.value,
      className: currentClassName,
    };

    const students = parseSmartTableText(csvContent, context);
    if (students.length === 0) {
      throw new Error("Fayldan birorta ham o'quvchi ma'lumoti aniqlanmadi. Fayl shablonini tekshiring.");
    }

    parsedStudents.value = students;
    isParsed.value = true;
  } catch (err) {
    fileError.value = err instanceof Error ? err.message : "Faylni o'qishda xatolik yuz berdi.";
  } finally {
    isFileLoading.value = false;
  }
}

function onFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    handleFileUpload(target.files[0]);
  }
}

function onFileDrop(event: DragEvent) {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    handleFileUpload(event.dataTransfer.files[0]);
  }
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
  isFileLoading.value = false;
  fileError.value = null;
  uploadedFileName.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function downloadSample() {
  const content =
    '\uFEFF' +
    [
      'T/r,Familiya va Ism,Jinsi,Tug\'ilgan sana,eMaktab ID',
      '1,Olimov Jasurbek Anvarovich,M,2009-04-12,2555715665172681001',
      '2,Aliyeva Madina Rustam qizi,F,2009-09-20,2555715665172681002',
      '3,Boboyev Sardor Ilhomovich,M,2009-02-14,2555715665172681003',
      '4,Karimova Dilnoza Alisher qizi,F,2009-11-05,2555715665172681004',
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
      <!-- Modal Header -->
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
          aria-label="Yopish"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 1. Sinf tanlash va Namuna shablon -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <label class="font-bold text-slate-700 dark:text-slate-300">Biriktiriladigan Sinf:</label>
          <select
            v-model="selectedClassId"
            class="p-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-teal-700 dark:text-teal-400"
          >
            <option v-for="c in availableClasses" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <button
          type="button"
          @click="downloadSample"
          class="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Namuna CSV / Excel shablonini yuklab olish
        </button>
      </div>

      <!-- Xatolik xabari -->
      <div v-if="fileError" class="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ fileError }}</span>
      </div>

      <!-- 2. Yuklash Usullari (Fayl yoki Matn) -->
      <div v-if="!isParsed" class="space-y-3">
        <!-- Tab tugmalari -->
        <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 text-xs">
          <button
            type="button"
            @click="handleTabChange('file')"
            class="pb-2 px-3 font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer"
            :class="activeTab === 'file' ? 'border-teal-600 text-teal-700 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
          >
            <span>📁</span>
            <span>Excel / CSV Fayl Yuklash</span>
          </button>
          <button
            type="button"
            @click="handleTabChange('text')"
            class="pb-2 px-3 font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer"
            :class="activeTab === 'text' ? 'border-teal-600 text-teal-700 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
          >
            <span>📝</span>
            <span>Nusxalangan Matn (Clipboard)</span>
          </button>
        </div>

        <!-- Fayl Yuklash Drag & Drop Zone -->
        <div
          v-show="activeTab === 'file'"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onFileDrop"
          class="border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3"
          :class="isDragging ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20' : 'border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'"
          @click="fileInputRef?.click()"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept=".xlsx,.xls,.csv,.txt"
            class="hidden"
            @change="onFileSelect"
          />

          <div v-if="isFileLoading" class="flex flex-col items-center gap-2 py-4">
            <svg class="animate-spin h-8 w-8 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">Excel fayli tahlil qilinmoqda...</span>
          </div>

          <div v-else class="flex flex-col items-center gap-1.5 py-2">
            <div class="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center text-2xl">
              📊
            </div>
            <div class="text-xs font-bold text-slate-800 dark:text-slate-200">
              Excel (.xlsx, .xls) yoki CSV faylini bu yerga sudrab tashlang
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">
              eMaktab rasmiy jurnali yoki maktab ro'yxati fayllari to'liq qo'llab-quvvatlanadi
            </p>
            <button
              type="button"
              class="mt-2 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Faylni tanlash
            </button>
          </div>
        </div>

        <!-- Matn kiritish (Textarea) -->
        <div v-show="activeTab === 'text'" class="space-y-3 text-xs">
          <textarea
            v-model="rawText"
            rows="6"
            placeholder="O'quvchilar ro'yxatini bu yerga joylashtiring (har bir qatorda bitta o'quvchi).&#10;Masalan:&#10;1. Olimov Jasurbek, M, 2008-04-12&#10;2. Aliyeva Madina, F, 2008-09-20&#10;yoki eMaktab jadvalidan nusxalangan matn"
            class="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          ></textarea>

          <div class="flex justify-end gap-2">
            <button
              type="button"
              @click="parseInput"
              :disabled="!rawText.trim()"
              class="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              Ro'yxatni Tahlil Qilish (Preview) →
            </button>
          </div>
        </div>
      </div>

      <!-- 3. Tahlil qilingan natija (Preview Table) -->
      <div v-else class="space-y-3 text-xs">
        <div class="flex items-center justify-between pb-1">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span class="font-bold text-slate-800 dark:text-white text-sm">
              Tahlil natijasi: {{ parsedStudents.length }} nafar o'quvchi aniqlandi
            </span>
          </div>
          <button
            type="button"
            @click="isParsed = false"
            class="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold cursor-pointer"
          >
            ← Boshqa fayl yoki matn kiritish
          </button>
        </div>

        <div class="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl shadow-inner">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 backdrop-blur-xs">
              <tr>
                <th class="p-2.5 w-10 text-center">№</th>
                <th class="p-2.5">Familiya va Ism</th>
                <th class="p-2.5 text-center">Jinsi</th>
                <th class="p-2.5 text-center">Tug'ilgan sana</th>
                <th class="p-2.5 text-center">eMaktab ID</th>
                <th class="p-2.5 w-10 text-center">O'chirish</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="(stu, idx) in parsedStudents" :key="idx" class="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                <td class="p-2.5 text-center font-mono text-slate-400">{{ idx + 1 }}</td>
                <td class="p-2.5 font-bold text-slate-900 dark:text-white">
                  {{ stu.lastName }} {{ stu.firstName }} {{ stu.middleName || '' }}
                </td>
                <td class="p-2.5 text-center">
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    :class="stu.gender === 'F' ? 'bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'"
                  >
                    {{ stu.gender === 'M' ? "O'g'il" : "Qiz" }}
                  </span>
                </td>
                <td class="p-2.5 text-center font-mono text-slate-600 dark:text-slate-300">{{ stu.birthDate }}</td>
                <td class="p-2.5 text-center font-mono text-[11px] text-slate-500">
                  <span v-if="stu.emaktabId" class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
                    {{ stu.emaktabId }}
                  </span>
                  <span v-else class="text-slate-300 dark:text-slate-600">—</span>
                </td>
                <td class="p-2.5 text-center">
                  <button
                    type="button"
                    @click="removeStudent(idx)"
                    aria-label="O'chirish"
                    class="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
          <div class="text-[11px] text-slate-500">
            Biriktirilmoqda: <strong class="text-teal-700 dark:text-teal-400">{{ selectedClass?.name }}</strong>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              @click="handleConfirm"
              class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Tasdiqlash va Bazaga Saqlash ({{ parsedStudents.length }} ta)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
