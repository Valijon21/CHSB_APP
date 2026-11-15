<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
function goHome() {
  router.push('/t/al-xorazmiy/student');
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors">
    <div class="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs text-center transition-colors">
      <div class="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
        404
      </div>
      <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Sahifa topilmadi</h2>
      <p class="text-sm text-slate-600 dark:text-slate-300 mb-6">
        Siz qidirayotgan sahifa mavjud emas yoki tenant manzili noto'g'ri kiritilgan.
      </p>
      <button
        @click="goHome"
        aria-label="Bosh sahifaga qaytish"
        class="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-medium rounded-xl transition shadow-xs cursor-pointer min-h-[42px]"
      >
        Bosh sahifaga qaytish
      </button>
    </div>
  </div>
</template>

