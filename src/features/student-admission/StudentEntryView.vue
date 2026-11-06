<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const rosterCode = ref('');
const error = ref('');

function handleSubmit() {
  if (!rosterCode.value.trim()) {
    error.value = "Iltimos, o'quvchi kodingizni kiriting.";
    return;
  }
  error.value = '';
  // Navigates to verify step
  router.push({
    path: `/t/${tenantSlug}/student/verify`,
    query: { code: rosterCode.value.trim() },
  });
}
</script>

<template>
  <div class="w-full max-w-md bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
    <div class="mb-6 text-center">
      <h2 class="text-xl font-bold text-slate-900">CHSB Imtihoniga Kirish</h2>
      <p class="text-sm text-slate-500 mt-1">
        O'qituvchingiz bergan o'quvchi kodi (Roster Code) orqali tizimga kiring.
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="rosterCode" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          O'quvchi Kodi (masalan: STU-1101)
        </label>
        <input
          id="rosterCode"
          v-model="rosterCode"
          type="text"
          placeholder="STU-..."
          class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 font-mono text-sm uppercase"
          autocomplete="off"
        />
        <p v-if="error" class="text-xs text-rose-600 mt-1.5 font-medium" role="alert">
          {{ error }}
        </p>
      </div>

      <div class="pt-2">
        <button
          type="submit"
          class="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white font-medium rounded-lg transition shadow-xs cursor-pointer text-sm"
        >
          Tekshirish va davom etish
        </button>
      </div>
    </form>

    <div class="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
      <span>Yordam kerakmi?</span>
      <router-link :to="`/t/${tenantSlug}/teacher`" class="text-indigo-600 hover:underline">
        O'qituvchi paneli (Demo)
      </router-link>
    </div>
  </div>
</template>
