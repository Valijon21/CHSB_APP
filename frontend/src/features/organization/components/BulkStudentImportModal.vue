<script setup lang="ts">
import { ref, toRef, computed, watch } from 'vue';
import { useModalA11y } from '../../../shared/composables/useModalA11y';
import type { StudentInput, StudentGender } from '../../../entities/organization/model';
import type { ClassGroupRecord } from '../../../entities/organization/model';
import { detectGroupFromText } from '../../emaktab/services/rosterParserService';
import TablePagination from '../../../shared/components/TablePagination.vue';
import { extractStudentsRosterWithAi } from '../../../shared/utils/groundedAiExtractor';
import { parseExcelFileClientSide } from '../../emaktab/services/clientExcelParser';
import { useTeacherStore } from '../../teacher/teacherStore';
import { useOrganizationStore } from '../store/organizationStore';

const props = defineProps<{
  isOpen: boolean;
  schoolId: string;
  tenantSlug: string;
  availableClasses: ClassGroupRecord[];
  isSubmitting?: boolean;
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
const selectedGroup = ref<'1-guruh' | '2-guruh' | null>(null);
const autoDetectedGroup = ref<string | null>(null);
const autoDetectedClass = ref<string | null>(null);
const rawText = ref('');
const parsedStudents = ref<StudentInput[]>([]);
const isParsed = ref(false);
const isDragging = ref(false);
const isLoadingFile = ref(false);
const isAiExtracting = ref(false);
const errorMessage = ref<string | null>(null);
const uploadedFileName = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

// Watch availableClasses to ensure selectedClassId is populated
watch(
  () => props.availableClasses,
  (classes) => {
    if ((!selectedClassId.value || !classes.some((c) => c.id === selectedClassId.value)) && classes.length > 0) {
      if (classes[0]) selectedClassId.value = classes[0].id;
    }
  },
  { immediate: true }
);

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if ((!selectedClassId.value || !props.availableClasses.some((c) => c.id === selectedClassId.value)) && props.availableClasses.length > 0) {
        if (props.availableClasses[0]) selectedClassId.value = props.availableClasses[0].id;
      }
    } else {
      reset();
    }
  }
);

watch(
  () => selectedClassId.value,
  (newId) => {
    const cls = props.availableClasses.find((c) => c.id === newId);
    if (cls && parsedStudents.value.length > 0) {
      parsedStudents.value.forEach((s) => {
        s.classGroupId = newId;
        s.className = cls.name;
      });
    }
  }
);

const teacherStore = useTeacherStore();
const orgStore = useOrganizationStore();

function normalizeClassCode(name?: string | null): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/sinf/g, '')
    .replace(/[\s-_]/g, '')
    .replace(/в/g, 'v')
    .replace(/а/g, 'a')
    .replace(/б/g, 'b')
    .replace(/г/g, 'g')
    .replace(/д/g, 'd')
    .trim();
}

function normalizeName(str?: string | null): string {
  if (!str) return '';
  return str.replace(/[’‘`']/g, "'").toLowerCase().trim();
}

export interface AnnotatedStudent extends StudentInput {
  isDuplicate?: boolean;
  duplicateReason?: string;
}

const evaluatedStudents = computed<AnnotatedStudent[]>(() => {
  const existingInClass = teacherStore.roster.filter(
    (r) => r.classGroupId === selectedClassId.value
  );

  const seenEmaktab = new Set<string>();
  const seenNames = new Set<string>();

  for (const ex of existingInClass) {
    if (ex.emaktabId) seenEmaktab.add(ex.emaktabId.trim());
    const fn = normalizeName(ex.firstName);
    const ln = normalizeName(ex.lastName);
    if (fn || ln) {
      seenNames.add(`${ln} ${fn}`.trim());
      seenNames.add(`${fn} ${ln}`.trim());
    }
    const anyEx = ex as any;
    if (anyEx.name) {
      seenNames.add(normalizeName(anyEx.name));
    }
    if (anyEx.fullName) {
      seenNames.add(normalizeName(anyEx.fullName));
    }
  }

  const inBatchEmaktab = new Set<string>();
  const inBatchNames = new Set<string>();

  return parsedStudents.value.map((s) => {
    const normLast = normalizeName(s.lastName);
    const normFirst = normalizeName(s.firstName);
    const fullName1 = `${normLast} ${normFirst}`.trim();
    const fullName2 = `${normFirst} ${normLast}`.trim();
    const directName = normalizeName((s as any).name || (s as any).fullName);
    const emaktab = s.emaktabId?.trim();

    if (emaktab && seenEmaktab.has(emaktab)) {
      return { ...s, isDuplicate: true, duplicateReason: "Ushbu sinfda eMaktab ID bilan mavjud" };
    }
    if (
      (fullName1 && seenNames.has(fullName1)) ||
      (fullName2 && seenNames.has(fullName2)) ||
      (directName && seenNames.has(directName))
    ) {
      return { ...s, isDuplicate: true, duplicateReason: "Ushbu sinfda bu ismli o'quvchi allaqachon mavjud" };
    }

    if (emaktab && inBatchEmaktab.has(emaktab)) {
      return { ...s, isDuplicate: true, duplicateReason: "Fayl ichida takrorlangan qator" };
    }
    if (
      (fullName1 && inBatchNames.has(fullName1)) ||
      (fullName2 && inBatchNames.has(fullName2)) ||
      (directName && inBatchNames.has(directName))
    ) {
      return { ...s, isDuplicate: true, duplicateReason: "Fayl ichida takrorlangan qator" };
    }

    if (emaktab) inBatchEmaktab.add(emaktab);
    if (fullName1) inBatchNames.add(fullName1);
    if (fullName2) inBatchNames.add(fullName2);
    if (directName) inBatchNames.add(directName);

    return { ...s, isDuplicate: false };
  });
});

const newStudentsToImport = computed(() => {
  return evaluatedStudents.value.filter((s) => !s.isDuplicate);
});

const duplicateStudentsCount = computed(() => {
  return evaluatedStudents.value.filter((s) => s.isDuplicate).length;
});

// Pagination in preview
const previewPage = ref(1);
const previewPageSize = ref(10);

const paginatedPreviewStudents = computed(() => {
  const start = (previewPage.value - 1) * previewPageSize.value;
  return evaluatedStudents.value.slice(start, start + previewPageSize.value);
});

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

async function readFile(file: File) {
  uploadedFileName.value = file.name;
  isLoadingFile.value = true;
  errorMessage.value = null;

  const detected = detectGroupFromText(file.name);
  if (detected) {
    selectedGroup.value = detected as '1-guruh' | '2-guruh';
    autoDetectedGroup.value = detected;
  } else {
    selectedGroup.value = null;
    autoDetectedGroup.value = null;
  }

  // 1. Client-side deterministic Excel parser (Instant, offline, zero-network dependency)
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
    try {
      const clientRes = await parseExcelFileClientSide(file, selectedGroup.value);
      if (clientRes.success && clientRes.students.length > 0) {
        if (clientRes.detectedGroup) {
          selectedGroup.value = clientRes.detectedGroup;
          autoDetectedGroup.value = clientRes.detectedGroup;
        } else if (!detected) {
          selectedGroup.value = null;
          autoDetectedGroup.value = null;
        }

        if (clientRes.detectedClass) {
          autoDetectedClass.value = clientRes.detectedClass;
          const normDetected = normalizeClassCode(clientRes.detectedClass);
          let matched = props.availableClasses.find((c) => {
            const normC = normalizeClassCode(c.name);
            return normC === normDetected || normC.includes(normDetected) || normDetected.includes(normC);
          });

          if (!matched) {
            // Auto-create class group in database and store!
            const gradeMatch = clientRes.detectedClass.match(/^(\d+)/);
            const grade = gradeMatch ? parseInt(gradeMatch[1]!, 10) : 10;
            const newClassName = `${clientRes.detectedClass} sinf`;

            try {
              const created = await orgStore.createClassGroup({
                schoolId: props.schoolId,
                tenantSlug: props.tenantSlug,
                name: newClassName,
                gradeLevel: grade,
                shift: 1,
                academicYear: '2026-2027',
              });
              matched = created;
              if (!props.availableClasses.some((c) => c.id === created.id)) {
                props.availableClasses.push(created);
              }
            } catch (err) {
              console.warn("Failed to auto-create class group:", err);
            }
          }

          if (matched) {
            selectedClassId.value = matched.id;
          }
        }

        const cls = props.availableClasses.find((c) => c.id === selectedClassId.value);
        const className = cls?.name || (autoDetectedClass.value ? `${autoDetectedClass.value} sinf` : 'Sinf');

        parsedStudents.value = clientRes.students.map((s) => ({
          tenantSlug: props.tenantSlug,
          schoolId: props.schoolId,
          classGroupId: selectedClassId.value,
          className,
          firstName: s.firstName,
          lastName: s.lastName,
          middleName: s.middleName,
          gender: (s.gender === 'F' ? 'F' : 'M') as StudentGender,
          birthDate: s.birthDate || '2009-01-01',
          group: s.group || selectedGroup.value || null,
          emaktabId: s.emaktabId,
          status: 'eligible',
        }));

        rawText.value = clientRes.rawTextPreview;
        previewPage.value = 1;
        isParsed.value = true;
        isLoadingFile.value = false;
        return;
      }
    } catch (clientErr) {
      console.warn("Client-side Excel parsing error, falling back to server:", clientErr);
    }
  }

  // 2. Try backend binary parse endpoint (for .xlsx, .xls, .csv)
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (selectedGroup.value) {
      formData.append('group', selectedGroup.value);
    }

    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.port === '5173');
    const apiBase = isLocal ? '/api/v1' : (import.meta.env.VITE_API_BASE_URL || '/api/v1');
    const endpoint = apiBase.endsWith('/')
      ? `${apiBase}students/parse-file`
      : `${apiBase}/students/parse-file`;

    const parseHeaders: Record<string, string> = {};
    try {
      const rawSession =
        sessionStorage.getItem('chsb_auth_session') ||
        localStorage.getItem('chsb_auth_session');
      if (rawSession) {
        const parsedSession = JSON.parse(rawSession);
        const token = parsedSession?.token || parsedSession?.user?.token;
        if (token) parseHeaders.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore storage read errors
    }

    let res: Response | null = null;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: parseHeaders,
        body: formData,
      });
    } catch {
      // Direct connection error fallback to relative path (Vite proxy)
      try {
        res = await fetch('/api/v1/students/parse-file', {
          method: 'POST',
          headers: parseHeaders,
          body: formData,
        });
      } catch {
        res = null;
      }
    }

    if (res && res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.students) && data.students.length > 0) {
        if (data.detectedGroup) {
          selectedGroup.value = data.detectedGroup as '1-guruh' | '2-guruh';
          autoDetectedGroup.value = data.detectedGroup;
        } else if (!detected) {
          selectedGroup.value = null;
          autoDetectedGroup.value = null;
        }

        if (data.detectedClass) {
          autoDetectedClass.value = data.detectedClass;
          const normDetected = normalizeClassCode(data.detectedClass);
          let matched = props.availableClasses.find((c) => {
            const normC = normalizeClassCode(c.name);
            return normC === normDetected || normC.includes(normDetected) || normDetected.includes(normC);
          });

          if (!matched) {
            const gradeMatch = data.detectedClass.match(/^(\d+)/);
            const grade = gradeMatch ? parseInt(gradeMatch[1]!, 10) : 10;
            const newClassName = `${data.detectedClass} sinf`;

            try {
              const created = await orgStore.createClassGroup({
                schoolId: props.schoolId,
                tenantSlug: props.tenantSlug,
                name: newClassName,
                gradeLevel: grade,
                shift: 1,
                academicYear: '2026-2027',
              });
              matched = created;
              if (!props.availableClasses.some((c) => c.id === created.id)) {
                props.availableClasses.push(created);
              }
            } catch (err) {
              console.warn("Failed to auto-create class group:", err);
            }
          }

          if (matched) {
            selectedClassId.value = matched.id;
          }
        }

        const cls = props.availableClasses.find((c) => c.id === selectedClassId.value);
        const className = cls?.name || (autoDetectedClass.value ? `${autoDetectedClass.value} sinf` : 'Sinf');

        parsedStudents.value = data.students.map((s: any) => ({
          tenantSlug: props.tenantSlug,
          schoolId: props.schoolId,
          classGroupId: selectedClassId.value,
          className,
          firstName: s.firstName,
          lastName: s.lastName,
          middleName: s.middleName || undefined,
          gender: (s.gender === 'F' ? 'F' : 'M') as StudentGender,
          birthDate: s.birthDate || '2009-01-01',
          group: s.group || selectedGroup.value || null,
          emaktabId: s.emaktabId,
          status: 'eligible',
        }));
        previewPage.value = 1;
        isParsed.value = true;
        isLoadingFile.value = false;
        return;
      } else if (data.error) {
        errorMessage.value = data.error;
      }
    }
  } catch {
    // If backend is not reached, fall through to client fallback
  }

  // 2. Client-side fallback for CSV / text
  if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt')) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        rawText.value = text;
        const textDetected = detectGroupFromText(text);
        if (textDetected) {
          selectedGroup.value = textDetected as '1-guruh' | '2-guruh';
          autoDetectedGroup.value = textDetected;
        } else if (!detected) {
          selectedGroup.value = null;
          autoDetectedGroup.value = null;
        }
        parseInput();
      }
      isLoadingFile.value = false;
    };
    reader.readAsText(file);
  } else {
    isLoadingFile.value = false;
    errorMessage.value = "Fayldan o'quvchilar ro'yxatini aniqlab bo'lmadi. Iltimos ustunlarni tekshiring yoki matn sifatida kiriting.";
  }
}

async function handleAiExtract() {
  if (!rawText.value.trim() || !selectedClassId.value) return;

  isAiExtracting.value = true;
  errorMessage.value = null;

  try {
    const res = await extractStudentsRosterWithAi(rawText.value, {
      defaultGroup: selectedGroup.value || undefined,
    });

    if (res.success && res.students.length > 0) {
      const cls = props.availableClasses.find((c) => c.id === selectedClassId.value);
      const className = cls?.name || 'Sinf';

      if (res.detectedGroup) {
        selectedGroup.value = res.detectedGroup as '1-guruh' | '2-guruh';
        autoDetectedGroup.value = res.detectedGroup;
      }

      parsedStudents.value = res.students.map((s) => ({
        tenantSlug: props.tenantSlug,
        schoolId: props.schoolId,
        classGroupId: selectedClassId.value,
        className,
        firstName: s.firstName,
        lastName: s.lastName,
        middleName: s.middleName,
        gender: (s.gender === 'F' ? 'F' : 'M') as StudentGender,
        birthDate: s.birthDate || '2009-01-01',
        group: s.group || selectedGroup.value || undefined,
        emaktabId: s.emaktabId,
        status: 'eligible',
      }));

      previewPage.value = 1;
      isParsed.value = true;
    } else {
      errorMessage.value = res.error || "AI orqali ro'yxatni ajratib bo'lmadi. Oddiy tahlil tugmasidan foydalaning.";
    }
  } catch (err: unknown) {
    errorMessage.value = (err as Error)?.message || "AI tahlilida kutilmagan xatolik yuz berdi.";
  } finally {
    isAiExtracting.value = false;
  }
}

function parseInput() {
  if (!rawText.value.trim() || !selectedClassId.value) return;

  errorMessage.value = null;

  if (!autoDetectedGroup.value) {
    const detected = detectGroupFromText(rawText.value);
    if (detected) {
      selectedGroup.value = detected;
      autoDetectedGroup.value = detected;
    }
  }

  const cls = props.availableClasses.find((c) => c.id === selectedClassId.value);
  const className = cls?.name || 'Sinf';

  const lines = rawText.value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => {
      if (!l || l.startsWith('#') || l.startsWith('^') || l.includes('\ufffd')) return false;
      const lower = l.toLowerCase();
      const isHeader =
        lower.includes('familiya va ism') ||
        lower.includes('familiya, ism') ||
        (lower.includes('familiya') && lower.includes('ism')) ||
        lower.includes('f.i.sh') ||
        lower.includes('fish') ||
        (lower.includes('t/r') && (lower.includes('id') || lower.includes('guruh') || lower.includes('jins')));
      if (isHeader) return false;
      return true;
    });

  const result: StudentInput[] = [];

  for (const line of lines) {
    const parts = line.split(/[,;\t]/).map((p) => p.trim());
    if (parts.length >= 1) {
      let rawName = cleanPrefix(parts[0] ?? '');
      let emaktabId: string | undefined = undefined;
      let gender: StudentGender = 'M';
      let birthDate = '2009-01-01';

      if (parts[0] && /^\d{1,3}(\.0)?$/.test(parts[0]) && parts[1]) {
        rawName = cleanPrefix(parts[1]);
        if (parts[2] && /^\d{7,}$/.test(parts[2])) {
          emaktabId = parts[2];
        }
      } else if (parts[1] && /^\d{7,}$/.test(parts[1])) {
        emaktabId = parts[1];
      }

      if (parts[1] && (parts[1].toUpperCase() === 'M' || parts[1].toUpperCase() === 'F')) {
        gender = parts[1].toUpperCase() as StudentGender;
      } else if (parts[2] && (parts[2].toUpperCase() === 'M' || parts[2].toUpperCase() === 'F')) {
        gender = parts[2].toUpperCase() as StudentGender;
      }

      const dateMatch = parts.find((p) => /^\d{4}-\d{2}-\d{2}$/.test(p));
      if (dateMatch) {
        birthDate = dateMatch;
      }

      const nameTokens = rawName.split(' ').filter(Boolean);
      if (nameTokens.length === 0 || rawName.length < 3 || rawName.toLowerCase().includes('ismsiz')) {
        continue;
      }

      let lastName = nameTokens[0] || 'O\'quvchi';
      let firstName = nameTokens[1] || 'O\'quvchi';
      let middleName = nameTokens.slice(2).join(' ') || undefined;

      const lowerRaw = rawName.toLowerCase();
      if (lowerRaw.includes('qizi') || lowerRaw.endsWith('eva') || lowerRaw.endsWith('ova')) {
        gender = 'F';
      }

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
        group: selectedGroup.value || null,
        emaktabId,
        status: 'eligible',
      });
    }
  }

  if (result.length === 0) {
    errorMessage.value = "Kiritilgan matndan hech qanday o'quvchi aniqlanmadi. Iltimos formatni tekshiring.";
    return;
  }

  parsedStudents.value = result;
  previewPage.value = 1;
  isParsed.value = true;
}

function removeStudent(index: number) {
  parsedStudents.value.splice(index, 1);
  if (parsedStudents.value.length === 0) {
    isParsed.value = false;
  }
}

function handleConfirm() {
  if (newStudentsToImport.value.length > 0 && !props.isSubmitting) {
    const cls = props.availableClasses.find((c) => c.id === selectedClassId.value);
    const finalClassName = cls?.name || (autoDetectedClass.value ? `${autoDetectedClass.value} sinf` : 'Sinf');
    emit(
      'bulk-import',
      newStudentsToImport.value.map((s) => {
        const { isDuplicate, duplicateReason, ...clean } = s;
        return {
          ...clean,
          classGroupId: selectedClassId.value,
          className: finalClassName,
          group: clean.group || null,
        };
      })
    );
  }
}

function reset() {
  rawText.value = '';
  parsedStudents.value = [];
  isParsed.value = false;
  isLoadingFile.value = false;
  isAiExtracting.value = false;
  errorMessage.value = null;
  uploadedFileName.value = null;
  selectedGroup.value = null;
  autoDetectedGroup.value = null;
  autoDetectedClass.value = null;
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

      <!-- 1. Sinf tanlash va Avtomatik aniqlash ma'lumotlari -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <label class="font-bold text-slate-700 dark:text-slate-300">Sinf:</label>
            <select
              v-model="selectedClassId"
              class="p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-teal-800 dark:text-teal-300"
            >
              <option v-if="availableClasses.length === 0" value="">Sinf tanlanmagan</option>
              <option v-for="c in availableClasses" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <span v-if="autoDetectedClass" class="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-semibold text-xs border border-teal-200 dark:border-teal-800 flex items-center gap-1">
            <span>✓ Sinf:</span>
            <strong>{{ autoDetectedClass }}</strong>
          </span>

          <span v-if="autoDetectedGroup" class="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-semibold text-xs border border-teal-200 dark:border-teal-800 flex items-center gap-1">
            <span>✓ Guruh:</span>
            <strong>{{ autoDetectedGroup }}</strong>
          </span>

          <span v-else-if="isParsed && !autoDetectedGroup" class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1">
            <span>✓</span>
            <strong>Umumiy sinf (Guruhsiz)</strong>
          </span>
        </div>

        <button
          type="button"
          @click="downloadSample"
          class="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Namuna shablon
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

      <!-- Error Alert -->
      <div v-if="errorMessage" class="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between">
        <span>⚠️ {{ errorMessage }}</span>
        <button type="button" @click="errorMessage = null" class="text-rose-600 hover:text-rose-800 font-bold ml-2">✕</button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingFile || isAiExtracting" class="py-12 text-center space-y-3">
        <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs text-teal-800 dark:text-teal-300 font-bold">
          {{ isAiExtracting ? "AI RAG ro'yxatni aqlli tahlil qilmoqda..." : "Excel fayli o'qilmoqda va ustunlar ajratilmoqda..." }}
        </p>
      </div>

      <!-- 2. Fayl Yuklash Dropzone va Matn maydoni -->
      <div v-else-if="!isParsed" class="space-y-3 text-xs">
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
              eMaktab jurnali eksporti yoki nusxalangan ro'yxatni yuklang (1-guruh / 2-guruh avtomatik aniqlanadi)
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
          placeholder="Excel jadvalidan nusxalangan qatorlarni bu yerga joylashtiring (har bir qatorda bitta o'quvchi).&#10;Masalan:&#10;1. Abduraximova Zuxra, M, 2009-04-12&#10;2. Miradjonova Shabnam, F, 2009-09-20"
          class="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
        ></textarea>

        <div class="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            @click="handleAiExtract"
            :disabled="!rawText.trim() || isAiExtracting"
            class="px-3.5 py-2 bg-gradient-to-r from-teal-800 to-teal-900 hover:from-teal-900 hover:to-teal-950 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50 min-h-[36px]"
          >
            <span>✨ AI RAG bilan tahlil qilish</span>
          </button>

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

      <!-- 3. Tahlil qilingan natija (Preview Table with Pagination) -->
      <div v-else class="space-y-3 text-xs">
        <div class="flex items-center justify-between">
          <span class="font-bold text-slate-800 dark:text-white">
            Tahlil natijasi: {{ evaluatedStudents.length }} nafar o'quvchi aniqlandi
            <span v-if="duplicateStudentsCount > 0" class="text-amber-700 dark:text-amber-400 font-semibold ml-1">
              ({{ newStudentsToImport.length }} ta yangi, {{ duplicateStudentsCount }} ta mavjud o'tkaziladi)
            </span>
            <span v-else class="text-emerald-700 dark:text-emerald-400 font-semibold ml-1">
              (barchasi yangi)
            </span>
          </span>
          <button
            type="button"
            @click="isParsed = false"
            class="text-xs text-teal-700 dark:text-teal-400 hover:underline cursor-pointer font-medium"
          >
            ← Boshqa fayl yoki matn kiritish
          </button>
        </div>

        <div class="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th class="p-2.5 w-10 text-center">№</th>
                <th class="p-2.5">Familiya va Ism</th>
                <th class="p-2.5 text-center">Holat</th>
                <th class="p-2.5 text-center">Guruh</th>
                <th class="p-2.5 text-center">Jinsi</th>
                <th class="p-2.5 text-center">Tug'ilgan sana</th>
                <th class="p-2.5 text-right">O'chirish</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
              <tr v-for="(stu, idx) in paginatedPreviewStudents" :key="idx" class="hover:bg-slate-50/50 dark:hover:bg-slate-700/40">
                <td class="p-2.5 text-center font-mono text-slate-400">{{ (previewPage - 1) * previewPageSize + idx + 1 }}</td>
                <td class="p-2.5">
                  <div class="font-bold text-slate-900 dark:text-white">
                    {{ stu.lastName }} {{ stu.firstName }} {{ stu.middleName || '' }}
                  </div>
                  <div v-if="stu.emaktabId" class="text-[10px] font-mono text-slate-400 dark:text-slate-400">
                    eMaktab ID: {{ stu.emaktabId }}
                  </div>
                </td>
                <td class="p-2.5 text-center">
                  <span
                    v-if="stu.isDuplicate"
                    class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                    :title="stu.duplicateReason"
                  >
                    ⚠️ Mavjud (Yuklanmaydi)
                  </span>
                  <span
                    v-else
                    class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    ✓ Yangi
                  </span>
                </td>
                <td class="p-2.5 text-center">
                  <span
                    v-if="stu.group === '1-guruh'"
                    class="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                  >
                    1-guruh
                  </span>
                  <span
                    v-else-if="stu.group === '2-guruh'"
                    class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    2-guruh
                  </span>
                  <span
                    v-else
                    class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                  >
                    Umumiy sinf
                  </span>
                </td>
                <td class="p-2.5 text-center">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="stu.gender === 'M' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' : 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300'">
                    {{ stu.gender === 'M' ? "O'g'il" : "Qiz" }}
                  </span>
                </td>
                <td class="p-2.5 text-center font-mono text-slate-600 dark:text-slate-400">{{ stu.birthDate }}</td>
                <td class="p-2.5 text-right">
                  <button
                    type="button"
                    @click="removeStudent((previewPage - 1) * previewPageSize + idx)"
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

        <!-- Table Pagination in Preview -->
        <TablePagination
          v-if="evaluatedStudents.length > 0"
          v-model:current-page="previewPage"
          v-model:page-size="previewPageSize"
          :total-items="evaluatedStudents.length"
        />

        <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
          <span class="text-xs text-slate-500 dark:text-slate-400">
            Biriktirilmoqda: <strong class="text-teal-800 dark:text-teal-300">{{ availableClasses.find(c => c.id === selectedClassId)?.name }} {{ selectedGroup ? `(${selectedGroup})` : '(Umumiy sinf)' }}</strong>
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
              :disabled="props.isSubmitting || newStudentsToImport.length === 0"
              @click="handleConfirm"
              class="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer min-h-[38px] flex items-center gap-1.5"
            >
              <svg v-if="props.isSubmitting" class="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ props.isSubmitting ? "Bazaga saqlanmoqda..." : newStudentsToImport.length > 0 ? `Tasdiqlash va Bazaga Saqlash (${newStudentsToImport.length} ta yangi)` : "Barcha o'quvchilar allaqachon mavjud" }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


