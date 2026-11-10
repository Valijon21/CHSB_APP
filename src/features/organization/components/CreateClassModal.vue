<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  ClassGroupInputSchema,
  type ClassGroupInput,
  type TeacherRecord,
} from '../../../entities/organization/model';

const props = defineProps<{
  isOpen: boolean;
  schoolId: string;
  tenantSlug: string;
  availableTeachers?: TeacherRecord[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'create', input: ClassGroupInput): void;
}>();

const name = ref('');
const gradeLevel = ref<number>(9);
const shift = ref<1 | 2>(1);
const academicYear = ref('2026-2027');
const headTeacherId = ref('');
const track = ref('Umumiy ta\'lim');
const errorMessage = ref<string | null>(null);

const selectedTeacher = computed(() => {
  if (!headTeacherId.value || !props.availableTeachers) return null;
  return props.availableTeachers.find((t) => t.id === headTeacherId.value) || null;
});

function resetForm() {
  name.value = '';
  gradeLevel.value = 9;
  shift.value = 1;
  academicYear.value = '2026-2027';
  headTeacherId.value = '';
  track.value = 'Umumiy ta\'lim';
  errorMessage.value = null;
}

function handleClose() {
  resetForm();
  emit('close');
}

function handleGradeChange() {
  // If user hasn't typed a letter yet, suggest based on grade
  if (!name.value || name.value.endsWith('-A') || name.value.endsWith('-B')) {
    name.value = `${gradeLevel.value}-A`;
  }
}

function handleSubmit() {
  errorMessage.value = null;

  const rawInput: ClassGroupInput = {
    schoolId: props.schoolId,
    tenantSlug: props.tenantSlug,
    name: name.value.trim(),
    gradeLevel: Number(gradeLevel.value),
    shift: shift.value,
    academicYear: academicYear.value,
    headTeacherId: headTeacherId.value || undefined,
    headTeacherName: selectedTeacher.value?.fullName || undefined,
  };

  const parsed = ClassGroupInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    errorMessage.value = parsed.error.issues[0]?.message || "Ma'lumotlar noto'g'ri to'ldirilgan.";
    return;
  }

  emit('create', parsed.data);
  handleClose();
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    @click.self="handleClose"
  >
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
        <div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white">Yangi Sinf Guruhini Ochish</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Maktabda yangi sinf parallelini shakllantirish va sinf rahbarini biriktirish
          </p>
        </div>
        <button
          type="button"
          @click="handleClose"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Live Badge Preview -->
      <div class="px-6 pt-4 pb-2 bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-indigo-100/60 dark:border-indigo-900/40 flex items-center justify-between text-xs">
        <span class="text-indigo-900 dark:text-indigo-200 font-medium">Jonli Namunasi:</span>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-700">
            {{ name || 'Sinf nomi' }}
          </span>
          <span class="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 font-semibold text-[11px]">
            {{ gradeLevel }}-sinf
          </span>
          <span class="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px]">
            {{ shift }}-smena
          </span>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="mx-6 mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
        {{ errorMessage }}
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4 text-xs">
        <div class="grid grid-cols-2 gap-3">
          <!-- Grade Level -->
          <div>
            <label for="create-class-grade" class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Parallel (Sinf bosqichi) <span class="text-rose-600">*</span>
            </label>
            <select
              id="create-class-grade"
              v-model.number="gradeLevel"
              @change="handleGradeChange"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-teal-700 focus:outline-hidden bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
            >
              <option v-for="g in 11" :key="g" :value="g">
                {{ g }}-sinf
              </option>
            </select>
          </div>

          <!-- Class Name -->
          <div>
            <label for="create-class-name" class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sinf Nomi <span class="text-rose-600">*</span>
            </label>
            <input
              id="create-class-name"
              v-model="name"
              type="text"
              placeholder="Masalan: 9-A yoki 10-V"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-teal-700 focus:outline-hidden bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
        </div>

        <!-- Shift (Smena) Radio Pills -->
        <div>
          <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            O'qish Smenasi <span class="text-rose-600">*</span>
          </label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="shift = 1"
              class="py-2 px-3 rounded-lg border text-center font-medium transition cursor-pointer flex items-center justify-center gap-1.5"
              :class="shift === 1 ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'"
            >
              <span>🌅</span>
              <span>1-smena (Ertalabki)</span>
            </button>
            <button
              type="button"
              @click="shift = 2"
              class="py-2 px-3 rounded-lg border text-center font-medium transition cursor-pointer flex items-center justify-center gap-1.5"
              :class="shift === 2 ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'"
            >
              <span>🌇</span>
              <span>2-smena (Tushdan keyin)</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <!-- Academic Year -->
          <div>
            <label for="create-class-year" class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">O'quv Yili</label>
            <select
              id="create-class-year"
              v-model="academicYear"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-teal-700 focus:outline-hidden bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
            >
              <option value="2026-2027">2026-2027</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>

          <!-- Track / Yo'nalish -->
          <div>
            <label for="create-class-track" class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fan Yo'nalishi</label>
            <select
              id="create-class-track"
              v-model="track"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-teal-700 focus:outline-hidden bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
            >
              <option value="Umumiy ta'lim">Umumiy ta'lim</option>
              <option value="Aniq fanlar (Matematika/Fizika)">Aniq fanlar</option>
              <option value="Tabiiy fanlar (Kimyo/Biologiya)">Tabiiy fanlar</option>
              <option value="IT & Dasturlash">IT & Dasturlash</option>
              <option value="Xorijiy tillar">Xorijiy tillar</option>
            </select>
          </div>
        </div>

        <!-- Head Teacher (Sinf rahbari) Selector -->
        <div>
          <label for="create-class-teacher" class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Sinf Rahbari (O'qituvchi)
          </label>
          <select
            id="create-class-teacher"
            v-model="headTeacherId"
            class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-teal-700 focus:outline-hidden bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
          >
            <option value="">-- Biriktirilmagan (Ixtiyoriy) --</option>
            <option
              v-for="tch in availableTeachers"
              :key="tch.id"
              :value="tch.id"
            >
              {{ tch.fullName }} ({{ tch.subject }})
            </option>
          </select>
        </div>

        <!-- Modal Footer Actions -->
        <div class="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="handleClose"
            class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-semibold transition shadow-xs cursor-pointer"
          >
            Sinfni Yaratish ✓
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

