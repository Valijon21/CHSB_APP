<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  await teacherStore.loadTeacherData(tenantId);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Biriktirilgan Sinflar Boshqaruvi</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          O'qituvchiga biriktirilgan sinflar va ularning o'zlashtirish ko'rsatkichlari.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <router-link
          :to="`/t/${tenantSlug}/teacher/students`"
          class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition border border-slate-200"
        >
          O'quvchilar ro'yxati (Roster) →
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 font-medium">Sinflar yuklanmoqda...</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Classes Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="cls in teacherStore.classes"
          :key="cls.id"
          class="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <span class="text-base font-bold text-slate-900">{{ cls.name }}</span>
              <span class="px-2.5 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                {{ cls.grade }}-sinf
              </span>
            </div>

            <div class="mt-4 space-y-2 text-xs text-slate-600">
              <div class="flex justify-between">
                <span class="text-slate-500">O'quvchilar soni:</span>
                <span class="font-bold text-slate-800">{{ cls.studentCount }} nafar</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">O'quv yili:</span>
                <span class="font-medium text-slate-700">{{ cls.academicYear }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Fan:</span>
                <span class="font-medium text-slate-700">Informatika va AT</span>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span class="text-[11px] text-emerald-600 font-medium">Faol guruh</span>
            <router-link
              :to="`/t/${tenantSlug}/teacher/classes/${cls.id}`"
              class="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-md text-xs font-semibold transition"
            >
              Sinfni ko'rish →
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
