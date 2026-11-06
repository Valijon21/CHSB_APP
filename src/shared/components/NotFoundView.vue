<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
function goHome() {
  router.push('/t/al-xorazmiy/student');
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-slate-50 text-slate-800">
    <div class="max-w-md w-full bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
      <div class="w-14 h-14 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
        404
      </div>
      <h2 class="text-xl font-bold text-slate-900 mb-2">Sahifa topilmadi</h2>
      <p class="text-sm text-slate-600 mb-6">
        Siz qidirayotgan sahifa mavjud emas yoki tenant manzili noto'g'ri kiritilgan.
      </p>
      <button
        @click="goHome"
        class="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white font-medium rounded-lg transition shadow-xs cursor-pointer"
      >
        Bosh sahifaga qaytish
      </button>
    </div>
  </div>
</template>

