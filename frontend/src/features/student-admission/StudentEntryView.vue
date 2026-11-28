<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTenantStore } from '../tenant-context/tenantStore';
import { useStudentAdmissionStore } from './admissionStore';

const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();
const admissionStore = useStudentAdmissionStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const rosterCode = ref('');

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
});

async function handleSubmit() {
  if (tenantStore.error) return;

  const ok = await admissionStore.lookup(tenantSlug, rosterCode.value);
  if (ok) {
    router.push({
      path: `/t/${tenantSlug}/student/verify`,
    });
  }
}
</script>

<template>
  <div class="w-full max-w-md bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-colors">
    <!-- Tenant Loading / Inactive States -->
    <div v-if="tenantStore.isLoading" class="text-center py-8">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Muassasa ma'lumotlari yuklanmoqda...</p>
    </div>

    <div v-else-if="tenantStore.error" class="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-center">
      <div class="text-rose-700 dark:text-rose-300 font-bold text-sm mb-1">Muassasa faol emas yoki topilmadi</div>
      <p class="text-xs text-rose-600 dark:text-rose-400">{{ tenantStore.error }}</p>
      <router-link
        to="/t/al-xorazmiy/student"
        class="mt-3 inline-block text-xs font-semibold text-rose-800 dark:text-rose-300 underline"
      >
        Standart muassasaga o'tish (Al-Xorazmiy)
      </router-link>
    </div>

    <!-- Normal Admission Form -->
    <div v-else>
      <div class="mb-6 text-center">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">CHSB Imtihoniga Kirish</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {{ tenantStore.currentTenant?.displayName }} o'quvchilari uchun maxsus portal
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="rosterCodeInput" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            O'quvchi Kodi (Roster Code)
          </label>
          <input
            id="rosterCodeInput"
            v-model="rosterCode"
            type="text"
            aria-label="O'quvchi Roster kodi"
            placeholder="Masalan: STU-1101"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-700 focus:border-teal-700 font-mono text-sm uppercase placeholder:normal-case placeholder:text-slate-400 dark:placeholder:text-slate-400"
            autocomplete="off"
            :disabled="admissionStore.status === 'looking_up'"
          />

          <!-- Error message display -->
          <div
            v-if="admissionStore.errorMessage"
            class="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium mt-2 flex items-center gap-1.5"
            role="alert"
          >
            <span>⚠️</span>
            <span>{{ admissionStore.errorMessage }}</span>
          </div>
        </div>

        <div class="pt-2">
          <button
            type="submit"
            aria-label="Kodni tekshirish va davom etish"
            :disabled="admissionStore.status === 'looking_up'"
            class="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 disabled:bg-slate-400 text-white font-medium rounded-xl transition shadow-xs cursor-pointer text-sm flex items-center justify-center gap-2 min-h-[42px]"
          >
            <span v-if="admissionStore.status === 'looking_up'" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{{ admissionStore.status === 'looking_up' ? 'Tekshirilmoqda...' : 'Tekshirish va davom etish' }}</span>
          </button>
        </div>
      </form>

      <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Kodingizni o'qituvchidan oling</span>
        <router-link :to="`/t/${tenantSlug}/teacher`" class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
          O'qituvchi paneli
        </router-link>
      </div>
    </div>
  </div>
</template>
