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
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Sinflar va Roster Boshqaruvi</h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Muassasa: <span class="font-mono text-indigo-700 font-semibold">{{ tenantStore.currentTenant?.displayName }}</span>
        </p>
      </div>
      <span class="text-xs px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 font-semibold border border-indigo-100 self-start sm:self-auto">
        Sintetik Roster Rejimi
      </span>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-indigo-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500">Sinflar va o'quvchilar ro'yxati yuklanmoqda...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="teacherStore.classes.length === 0" class="p-8 text-center bg-white rounded-xl border border-slate-200">
      <p class="text-sm text-slate-500">Ushbu muassasada hozircha biriktirilgan sinflar mavjud emas.</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Class Filter Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <button
          @click="teacherStore.selectClass(null)"
          :class="[
            'p-4 rounded-xl border text-left transition cursor-pointer',
            teacherStore.selectedClassId === null
              ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          ]"
        >
          <div class="flex justify-between items-center mb-1">
            <span class="font-bold text-sm text-slate-900">Barcha sinflar</span>
            <span class="text-xs px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
              {{ teacherStore.roster.length }}
            </span>
          </div>
          <span class="text-xs text-slate-500">Umumiy o'quvchilar</span>
        </button>

        <button
          v-for="c in teacherStore.classes"
          :key="c.id"
          @click="teacherStore.selectClass(c.id)"
          :class="[
            'p-4 rounded-xl border text-left transition cursor-pointer',
            teacherStore.selectedClassId === c.id
              ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          ]"
        >
          <div class="flex justify-between items-center mb-1">
            <span class="font-bold text-sm text-slate-900">{{ c.name }}</span>
            <span class="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
              {{ c.studentCount }} ta
            </span>
          </div>
          <span class="text-xs text-slate-500">{{ c.grade }}-sinf ({{ c.academicYear }})</span>
        </button>
      </div>

      <!-- Roster Table for selected class -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 class="font-bold text-sm text-slate-900">
            Roster O'quvchilari Ro'yxati
            <span class="text-slate-400 font-normal">({{ teacherStore.filteredRoster.length }} nafar)</span>
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th class="p-3.5">O'quvchi Kodi</th>
                <th class="p-3.5">F.I.Sh.</th>
                <th class="p-3.5">Holati</th>
                <th class="p-3.5">Biriktirilgan Imtihon</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr
                v-for="student in teacherStore.filteredRoster"
                :key="student.id"
                class="hover:bg-slate-50/50"
              >
                <td class="p-3.5 font-mono font-bold text-indigo-900">
                  {{ student.rosterCode }}
                </td>
                <td class="p-3.5 font-medium text-slate-900">
                  {{ student.firstName }} {{ student.lastName }}
                  <span v-if="student.middleName" class="text-slate-500"> {{ student.middleName }}</span>
                </td>
                <td class="p-3.5">
                  <span
                    :class="[
                      'inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold',
                      student.status === 'eligible'
                        ? 'bg-emerald-100 text-emerald-800'
                        : student.status === 'inactive'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                    ]"
                  >
                    {{ student.status === 'eligible' ? 'Faol / Ruxsat bor' : student.status === 'inactive' ? 'Nofaol' : 'Noaniq' }}
                  </span>
                </td>
                <td class="p-3.5 font-mono text-slate-500">
                  {{ student.availableAssessmentIds.join(', ') || 'Biriktirilmagan' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
