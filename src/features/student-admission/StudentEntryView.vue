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
  <div class="w-full max-w-md bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
    <!-- Tenant Loading / Inactive States -->
    <div v-if="tenantStore.isLoading" class="text-center py-8">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 font-medium">Muassasa ma'lumotlari yuklanmoqda...</p>
    </div>

    <div v-else-if="tenantStore.error" class="p-4 rounded-lg bg-rose-50 border border-rose-200 text-center">
      <div class="text-rose-700 font-bold text-sm mb-1">Muassasa faol emas yoki topilmadi</div>
      <p class="text-xs text-rose-600">{{ tenantStore.error }}</p>
      <router-link
        to="/t/al-xorazmiy/student"
        class="mt-3 inline-block text-xs font-semibold text-rose-800 underline"
      >
        Standart muassasaga o'tish (Al-Xorazmiy)
      </router-link>
    </div>

    <!-- Normal Admission Form -->
    <div v-else>
      <div class="mb-6 text-center">
        <h2 class="text-xl font-bold text-slate-900">CHSB Imtihoniga Kirish</h2>
        <p class="text-xs text-slate-500 mt-1">
          {{ tenantStore.currentTenant?.displayName }} o'quvchilari uchun maxsus portal
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="rosterCodeInput" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            O'quvchi Kodi (Roster Code)
          </label>
          <input
            id="rosterCodeInput"
            v-model="rosterCode"
            type="text"
            placeholder="masalan: STU-1101"
            class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 font-mono text-sm uppercase placeholder:normal-case placeholder:text-slate-400"
            autocomplete="off"
            :disabled="admissionStore.status === 'looking_up'"
          />

          <!-- Error message display -->
          <div
            v-if="admissionStore.errorMessage"
            class="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium mt-2 flex items-center gap-1.5"
            role="alert"
          >
            <span>⚠️</span>
            <span>{{ admissionStore.errorMessage }}</span>
          </div>
        </div>

        <div class="pt-2">
          <button
            type="submit"
            :disabled="admissionStore.status === 'looking_up'"
            class="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 disabled:bg-slate-400 text-white font-medium rounded-lg transition shadow-xs cursor-pointer text-sm flex items-center justify-center gap-2"
          >
            <span v-if="admissionStore.status === 'looking_up'" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{{ admissionStore.status === 'looking_up' ? 'Tekshirilmoqda...' : 'Tekshirish va davom etish' }}</span>
          </button>
        </div>
      </form>

      <!-- Synthetic Demo Hint -->
      <div class="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2 text-xs text-slate-500">
        <div class="flex justify-between items-center">
          <span>Demo kodlar:</span>
          <span class="font-mono font-semibold text-slate-700">STU-1101, STU-1102</span>
        </div>
        <div class="flex justify-between items-center text-[11px] text-slate-400">
          <span>Nofaol kod: <code class="font-mono">STU-1103</code></span>
          <router-link :to="`/t/${tenantSlug}/teacher`" class="text-indigo-600 hover:underline">
            O'qituvchi paneli
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
