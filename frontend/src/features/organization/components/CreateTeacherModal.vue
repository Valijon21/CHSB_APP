<script setup lang="ts">
import { ref, computed, toRef } from 'vue';
import { getActivePinia } from 'pinia';
import { useModalA11y } from '../../../shared/composables/useModalA11y';
import { useOrganizationStore } from '../store/organizationStore';
import type { TeacherInput, TeacherQualification } from '../../../entities/organization/model';
import type { ClassGroupRecord } from '../../../entities/organization/model';

const props = defineProps<{
  isOpen: boolean;
  schoolId: string;
  tenantSlug: string;
  availableClasses: ClassGroupRecord[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'create', input: TeacherInput): void;
}>();

function handleClose() {
  resetForm();
  emit('close');
}

useModalA11y(toRef(props, 'isOpen'), handleClose);

const orgStore = getActivePinia() ? useOrganizationStore() : null;

const DEFAULT_SUBJECTS = [
  'Matematika',
  'Informatika va AT',
  'Fizika',
  'Kimyo',
  'Biologiya',
  'Ingliz tili',
  'Ona tili va adabiyot',
  'Tarix',
  'Geografiya',
];

const availableSubjects = computed(() => {
  if (orgStore?.subjects && orgStore.subjects.length > 0) {
    return orgStore.subjects.filter((s) => s.isActive).map((s) => s.name);
  }
  return DEFAULT_SUBJECTS;
});

const fullName = ref('');
const subject = ref(DEFAULT_SUBJECTS[0] || 'Matematika');
const qualification = ref<TeacherQualification>('oliy');
const selectedClassIds = ref<string[]>([]);
const phone = ref('+998');
const email = ref('');
const errorMessage = ref<string | null>(null);

function handleSubmit() {
  errorMessage.value = null;

  if (fullName.value.trim().length < 3) {
    errorMessage.value = "O'qituvchi F.I.SH. kamida 3 ta harfdan iborat bo'lishi kerak!";
    return;
  }
  if (!subject.value.trim()) {
    errorMessage.value = "Dars beradigan fan kiritilishi shart!";
    return;
  }
  if (phone.value.trim().length < 9) {
    errorMessage.value = "Telefon raqami kamida 9 ta raqam bo'lishi shart!";
    return;
  }

  emit('create', {
    schoolId: props.schoolId,
    tenantSlug: props.tenantSlug,
    fullName: fullName.value.trim(),
    subject: subject.value,
    qualification: qualification.value,
    assignedClassIds: [...selectedClassIds.value],
    phone: phone.value.trim(),
    email: email.value.trim() || undefined,
    status: 'active',
  });

  resetForm();
  emit('close');
}

function resetForm() {
  fullName.value = '';
  subject.value = DEFAULT_SUBJECTS[0] || 'Matematika';
  qualification.value = 'oliy';
  selectedClassIds.value = [];
  phone.value = '+998';
  email.value = '';
  errorMessage.value = null;
}

function toggleClassSelection(classId: string) {
  const idx = selectedClassIds.value.indexOf(classId);
  if (idx === -1) {
    selectedClassIds.value.push(classId);
  } else {
    selectedClassIds.value.splice(idx, 1);
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    role="dialog"
    aria-modal="true"
    aria-labelledby="create-teacher-modal-title"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
  >
    <div
      class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
    >
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <div>
          <h3 id="create-teacher-modal-title" class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Yangi O'qituvchi Qo'shish
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Maktab pedagogik tarkibiga yangi mutaxassis biriktirish
          </p>
        </div>

        <button
          type="button"
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="errorMessage" class="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3.5 text-xs">
        <!-- F.I.SH -->
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">O'qituvchi F.I.SH. *</label>
          <input
            v-model="fullName"
            type="text"
            placeholder="Masalan: Karimova Dilnoza Anvarovna"
            class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium"
          />
        </div>

        <!-- Fan va Toifa -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mutaxassislik Fani *</label>
            <select
              v-model="subject"
              class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option v-for="s in availableSubjects" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Malaka Toifasi *</label>
            <select
              v-model="qualification"
              class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="oliy">Oliy toifa</option>
              <option value="birinchi">1-toifa</option>
              <option value="ikkinchi">2-toifa</option>
              <option value="mutaxassis">Mutaxassis</option>
            </select>
          </div>
        </div>

        <!-- Biriktiriladigan sinflar -->
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            Dars beradigan sinflari (Biriktirish)
          </label>
          <div v-if="availableClasses.length > 0" class="flex flex-wrap gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
            <button
              v-for="cls in availableClasses"
              :key="cls.id"
              type="button"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border',
                selectedClassIds.includes(cls.id)
                  ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100',
              ]"
              @click="toggleClassSelection(cls.id)"
            >
              {{ cls.name }}
            </button>
          </div>
          <p v-else class="text-[11px] text-slate-400 italic">
            Hozircha birorta ham sinf ochilmagan.
          </p>
        </div>

        <!-- Aloqa -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Telefon Raqami *</label>
            <input
              v-model="phone"
              type="text"
              placeholder="+998901234567"
              class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Manzili</label>
            <input
              v-model="email"
              type="email"
              placeholder="uqituvchi@maktab.uz"
              class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            @click="handleClose"
            class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            class="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            O'qituvchini Saqlash
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
