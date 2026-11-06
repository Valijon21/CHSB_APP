<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../tenant-context/tenantStore';
import { useTeacherStore } from './teacherStore';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId = tenantStore.currentTenant?.tenantId || (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  await teacherStore.loadTeacherData(tenantId);
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between pb-4 border-b border-slate-200">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Baholashlar Ro'yxati</h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Muassasa: <span class="font-mono text-indigo-700 font-semibold">{{ tenantStore.currentTenant?.displayName }}</span>
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-indigo-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500">Baholashlar yuklanmoqda...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="teacherStore.assessments.length === 0" class="p-8 text-center bg-white rounded-xl border border-slate-200">
      <p class="text-sm text-slate-500">Ushbu muassasada hech qanday baholash topilmadi.</p>
    </div>

    <!-- Assessment List Table -->
    <div v-else class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th class="p-3.5">Baholash nomi</th>
              <th class="p-3.5">Fan</th>
              <th class="p-3.5">Sinf</th>
              <th class="p-3.5">Savollar / Ball</th>
              <th class="p-3.5">Vaqt</th>
              <th class="p-3.5">Holati</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr
              v-for="a in teacherStore.assessments"
              :key="a.id"
              class="hover:bg-slate-50/60"
            >
              <td class="p-3.5 font-bold text-slate-900">
                {{ a.title }}
              </td>
              <td class="p-3.5">{{ a.subject }}</td>
              <td class="p-3.5">{{ a.grade }}-sinf</td>
              <td class="p-3.5">{{ a.questionCount }} ta / {{ a.maxScore }} ball</td>
              <td class="p-3.5">{{ a.durationMinutes }} daqiqa</td>
              <td class="p-3.5">
                <span
                  :class="[
                    'inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold',
                    a.status === 'available'
                      ? 'bg-emerald-100 text-emerald-800'
                      : a.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                  ]"
                >
                  {{ a.status === 'available' ? 'Faol' : a.status === 'scheduled' ? 'Rejalashtirilgan' : 'Yopilgan' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
