<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../store/authStore';
import { MIN_PASSWORD_LENGTH } from '../types';

const authStore = useAuthStore();

const currentPassword = ref('');
const newPassword = ref('');
const repeatedPassword = ref('');
const errorMessage = ref('');
const isDone = ref(false);
const isSaving = ref(false);

async function handleSubmit() {
  errorMessage.value = '';
  isDone.value = false;

  if (newPassword.value.length < MIN_PASSWORD_LENGTH) {
    errorMessage.value = `Yangi parol kamida ${MIN_PASSWORD_LENGTH} belgidan iborat bo'lishi kerak.`;
    return;
  }
  if (newPassword.value !== repeatedPassword.value) {
    errorMessage.value = 'Yangi parollar bir-biriga mos kelmadi.';
    return;
  }

  isSaving.value = true;
  try {
    await authStore.changePassword(currentPassword.value, newPassword.value);
    currentPassword.value = '';
    newPassword.value = '';
    repeatedPassword.value = '';
    isDone.value = true;
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : "Parolni almashtirib bo'lmadi.";
  } finally {
    isSaving.value = false;
  }
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-700';
</script>

<template>
  <section class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 space-y-4">
    <div>
      <h2 class="text-sm font-bold text-slate-900 dark:text-white">Parolni almashtirish</h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        Parol almashgach, boshqa qurilmalardagi sessiyalar yakunlanadi.
      </p>
    </div>

    <form class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs" @submit.prevent="handleSubmit">
      <label class="block font-bold text-slate-700 dark:text-slate-300 space-y-1.5">
        <span>Joriy parol</span>
        <input
          v-model="currentPassword"
          type="password"
          name="current-password"
          autocomplete="current-password"
          required
          :class="inputClass"
        />
      </label>
      <label class="block font-bold text-slate-700 dark:text-slate-300 space-y-1.5">
        <span>Yangi parol</span>
        <input
          v-model="newPassword"
          type="password"
          name="new-password"
          autocomplete="new-password"
          required
          :class="inputClass"
        />
      </label>
      <label class="block font-bold text-slate-700 dark:text-slate-300 space-y-1.5">
        <span>Yangi parolni takrorlang</span>
        <input
          v-model="repeatedPassword"
          type="password"
          name="repeat-password"
          autocomplete="new-password"
          required
          :class="inputClass"
        />
      </label>

      <div class="sm:col-span-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p v-if="errorMessage" role="alert" class="font-semibold text-rose-700 dark:text-rose-300">{{ errorMessage }}</p>
        <p v-else-if="isDone" role="status" class="font-semibold text-emerald-700 dark:text-emerald-300">Parol yangilandi.</p>
        <span v-else></span>
        <button
          type="submit"
          :disabled="isSaving"
          class="w-full sm:w-auto px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition cursor-pointer min-h-[40px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSaving ? 'Saqlanmoqda...' : 'Parolni almashtirish' }}
        </button>
      </div>
    </form>
  </section>
</template>
