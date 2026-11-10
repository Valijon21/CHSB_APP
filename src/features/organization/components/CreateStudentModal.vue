<script setup lang="ts">
import { ref } from 'vue';
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
  (e: 'create', input: StudentInput): void;
}>();

const firstName = ref('');
const lastName = ref('');
const middleName = ref('');
const selectedClassId = ref(props.availableClasses[0]?.id || '');
const gender = ref<StudentGender>('M');
const birthDate = ref('2009-01-01');
const rosterCode = ref('');
const emaktabId = ref('');
const errorMessage = ref<string | null>(null);

function handleSubmit() {
  errorMessage.value = null;

  if (firstName.value.trim().length < 2) {
    errorMessage.value = "O'quvchi ismi kamida 2 ta harfdan iborat bo'lishi shart!";
    return;
  }
  if (lastName.value.trim().length < 2) {
    errorMessage.value = "O'quvchi familiyasi kamida 2 ta harfdan iborat bo'lishi shart!";
    return;
  }
  if (!selectedClassId.value) {
    errorMessage.value = "Sinf tanlanishi shart!";
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate.value)) {
    errorMessage.value = "Tug'ilgan sana YYYY-MM-DD formatida bo'lishi kerak!";
    return;
  }

  const cls = props.availableClasses.find((c) => c.id === selectedClassId.value);

  emit('create', {
    tenantSlug: props.tenantSlug,
    schoolId: props.schoolId,
    classGroupId: selectedClassId.value,
    className: cls?.name || '9-A',
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    middleName: middleName.value.trim() || undefined,
    gender: gender.value,
    birthDate: birthDate.value.trim(),
    rosterCode: rosterCode.value.trim() || undefined,
    emaktabId: emaktabId.value.trim() || undefined,
    status: 'eligible',
  });

  resetForm();
  emit('close');
}

function resetForm() {
  firstName.value = '';
  lastName.value = '';
  middleName.value = '';
  gender.value = 'M';
  birthDate.value = '2009-01-01';
  rosterCode.value = '';
  emaktabId.value = '';
  errorMessage.value = null;
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
  >
    <div
      class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
    >
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Yakka Tartibda O'quvchi Qo'shish
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sinfga yangi o'quvchini kiritish va Roster kodi berish
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
        <!-- Familiya va Ism -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Familiyasi *</label>
            <input
              v-model="lastName"
              type="text"
              placeholder="Olimov"
              class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ismi *</label>
            <input
              v-model="firstName"
              type="text"
              placeholder="Jasurbek"
              class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium"
            />
          </div>
        </div>

        <!-- Otasining ismi -->
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Otasining ismi (Sharifi)</label>
          <input
            v-model="middleName"
            type="text"
            placeholder="Anvar o'g'li"
            class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
          />
        </div>

        <!-- Sinf va Jinsi -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Biriktiriladigan Sinf *</label>
            <select
              v-model="selectedClassId"
              class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-teal-700 dark:text-teal-400"
            >
              <option v-for="c in availableClasses" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jinsi *</label>
            <div class="flex items-center gap-3 pt-1.5">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" value="M" v-model="gender" />
                <span class="font-medium">O'g'il bola</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" value="F" v-model="gender" />
                <span class="font-medium">Qiz bola</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Tug'ilgan sana va Roster kodi -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tug'ilgan sana (YYYY-MM-DD) *</label>
            <input
              v-model="birthDate"
              type="text"
              placeholder="2009-05-18"
              class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Roster Kodi (Ixtiyoriy)</label>
            <input
              v-model="rosterCode"
              type="text"
              placeholder="Bo'sh qolsa avtomatik beriladi"
              class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[11px]"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            class="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            O'quvchini Saqlash
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
