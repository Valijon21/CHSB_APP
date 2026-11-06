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
        <h2 class="text-xl font-bold text-slate-900">O'quvchilar Natijalari (Prototip)</h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Muassasa: <span class="font-mono text-indigo-700 font-semibold">{{ tenantStore.currentTenant?.displayName }}</span>
        </p>
      </div>
      <span class="text-xs px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
        Sintetik Natijalar
      </span>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-indigo-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500">Natijalar yuklanmoqda...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="teacherStore.results.length === 0" class="p-8 text-center bg-white rounded-xl border border-slate-200">
      <p class="text-sm text-slate-500">Ushbu muassasa bo'yicha hali topshirilgan natijalar mavjud emas.</p>
    </div>

    <div v-else class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th class="p-3.5">Urinish kodi</th>
              <th class="p-3.5">O'quvchi F.I.Sh.</th>
              <th class="p-3.5">Sinf</th>
              <th class="p-3.5">Ball / Foiz</th>
              <th class="p-3.5">Topshirilgan vaqt</th>
              <th class="p-3.5">Holati</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr
              v-for="r in teacherStore.results"
              :key="r.attemptId"
              class="hover:bg-slate-50/60"
            >
              <td class="p-3.5 font-mono font-medium text-slate-900">{{ r.attemptId }}</td>
              <td class="p-3.5 font-medium">{{ r.studentName }}</td>
              <td class="p-3.5">{{ r.className }}</td>
              <td class="p-3.5 font-bold text-teal-800">
                {{ r.score }} / {{ r.maxScore }} ({{ r.percentage }}%)
              </td>
              <td class="p-3.5 text-slate-500">
                {{ new Date(r.submittedAt).toLocaleTimeString('uz-UZ') }}
              </td>
              <td class="p-3.5">
                <span
                  :class="[
                    'inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold',
                    r.verifiedByTeacher
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  ]"
                >
                  {{ r.verifiedByTeacher ? 'Tekshirildi' : 'Kutilmoqda' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
