<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';

const notifyOnSubmit = ref(true);
const notifyLowAttendance = ref(true);
const defaultLanguage = ref('uz');
const rowsPerPage = ref('25');
const savedMessage = ref(false);

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  await teacherStore.loadTeacherData(tenantId);
});

function handleSave() {
  savedMessage.value = true;
  setTimeout(() => {
    savedMessage.value = false;
  }, 2500);
}
</script>

<template>
  <div class="space-y-6 max-w-4xl">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
      <div>
        <h1 class="text-xl font-bold text-slate-900">O'qituvchi Profili va Sozlamalari</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Pedagogik rekvizitlar, biriktirilgan ta'lim muassasasi va bildirishnoma parametrlari.
        </p>
      </div>

      <div v-if="savedMessage" class="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
        ✓ Sozlamalar saqlandi
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 font-medium">Profil yuklanmoqda...</p>
    </div>

    <div v-else-if="teacherStore.profile" class="space-y-6">
      <!-- Profile Card -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
        <div class="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div class="w-16 h-16 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xl">
            DU
          </div>
          <div>
            <h2 class="text-xl font-bold text-slate-900">{{ teacherStore.profile.fullName }}</h2>
            <p class="text-xs text-teal-800 font-semibold mt-0.5">{{ teacherStore.profile.title }}</p>
            <p class="text-xs text-slate-500 mt-1">Muassasa: {{ teacherStore.profile.assignedSchoolName }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span class="text-slate-500 block">Elektron pochta:</span>
            <span class="font-bold text-slate-800 mt-0.5 block">{{ teacherStore.profile.email }}</span>
          </div>
          <div>
            <span class="text-slate-500 block">Telefon raqam:</span>
            <span class="font-bold text-slate-800 mt-0.5 block">{{ teacherStore.profile.phone }}</span>
          </div>
          <div>
            <span class="text-slate-500 block">Biriktirilgan fanlar:</span>
            <div class="flex flex-wrap gap-1.5 mt-1">
              <span
                v-for="sub in teacherStore.profile.subjects"
                :key="sub"
                class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
              >
                {{ sub }}
              </span>
            </div>
          </div>
          <div>
            <span class="text-slate-500 block">Biriktirilgan sinflar:</span>
            <div class="flex flex-wrap gap-1.5 mt-1">
              <span
                v-for="cls in teacherStore.classes"
                :key="cls.id"
                class="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-medium"
              >
                {{ cls.name }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings & Preferences -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
          Kabinet Sozlamalari
        </h3>

        <div class="space-y-4 text-xs">
          <div class="flex items-center justify-between">
            <div>
              <span class="font-bold text-slate-800 block">O'quvchi test topshirganda xabarnoma</span>
              <span class="text-slate-500 text-[11px]">Har bir o'quvchi imtihonni topshirishi bilanoq yangilanish ko'rinadi.</span>
            </div>
            <input
              v-model="notifyOnSubmit"
              type="checkbox"
              class="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700 cursor-pointer"
            />
          </div>

          <div class="flex items-center justify-between">
            <div>
              <span class="font-bold text-slate-800 block">Past ishtirok ogohlantirishi</span>
              <span class="text-slate-500 text-[11px]">Sinfda ishtirok 80% dan kam bo'lsa panelda ogohlantirish ko'rsatiladi.</span>
            </div>
            <input
              v-model="notifyLowAttendance"
              type="checkbox"
              class="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700 cursor-pointer"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Tizim Tili:</label>
              <select
                v-model="defaultLanguage"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700"
              >
                <option value="uz">O'zbek tili (Lotin)</option>
                <option value="ru">Русский язык</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Jadvallardagi qatorlar soni:</label>
              <select
                v-model="rowsPerPage"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700"
              >
                <option value="15">15 ta qator</option>
                <option value="25">25 ta qator</option>
                <option value="50">50 ta qator</option>
              </select>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 flex justify-end">
          <button
            @click="handleSave"
            class="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-medium rounded-lg text-xs transition cursor-pointer"
          >
            Sozlamalarni saqlash
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

