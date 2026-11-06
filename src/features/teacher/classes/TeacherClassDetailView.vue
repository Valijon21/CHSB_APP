<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const classId = (route.params.classId as string) || '';

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  await teacherStore.loadClassDetail(tenantId, classId);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Breadcrumbs & Header -->
    <div class="flex items-center gap-2 text-xs text-slate-500">
      <router-link :to="`/t/${tenantSlug}/teacher/classes`" class="hover:text-teal-800 underline">
        ← Barcha sinflar
      </router-link>
      <span>/</span>
      <span class="font-semibold text-slate-700">{{ teacherStore.classDetail?.classGroup.name || 'Sinf' }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 font-medium">Sinf tafsilotlari yuklanmoqda...</p>
    </div>

    <!-- Detail Content -->
    <div v-else-if="teacherStore.classDetail" class="space-y-6">
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
            {{ teacherStore.classDetail.classGroup.academicYear }}
          </span>
          <h1 class="text-2xl font-bold text-slate-900 mt-2">
            {{ teacherStore.classDetail.classGroup.name }} Tafsilotlari
          </h1>
          <p class="text-xs text-slate-500 mt-1">
            Informatika va axborot texnologiyalari • {{ teacherStore.classDetail.classGroup.grade }}-sinf
          </p>
        </div>

        <div class="flex items-center gap-4 text-center">
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span class="text-xs text-slate-500 block">O'rtacha Ball</span>
            <span class="text-xl font-bold text-teal-800">{{ teacherStore.classDetail.averageScore }} / 40</span>
          </div>
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span class="text-xs text-slate-500 block">Ishtirok Foizi</span>
            <span class="text-xl font-bold text-indigo-700">{{ teacherStore.classDetail.participationRate }}%</span>
          </div>
        </div>
      </div>

      <!-- Students in this Class -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Sinf O'quvchilari ({{ teacherStore.classDetail.students.length }})
          </h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th class="p-3.5">№</th>
                <th class="p-3.5">O'quvchi F.I.SH.</th>
                <th class="p-3.5">Roster Kodi</th>
                <th class="p-3.5">Holati</th>
                <th class="p-3.5">Ball</th>
                <th class="p-3.5 text-right">Amal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="(stu, idx) in teacherStore.classDetail.students"
                :key="stu.id"
                class="hover:bg-slate-50/60"
              >
                <td class="p-3.5 text-slate-400 font-mono">{{ idx + 1 }}</td>
                <td class="p-3.5 font-bold text-slate-800">
                  {{ stu.firstName }} {{ stu.lastName }} {{ stu.middleName || '' }}
                </td>
                <td class="p-3.5 font-mono text-teal-800 font-semibold">{{ stu.rosterCode }}</td>
                <td class="p-3.5">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[11px] font-semibold',
                      stu.status === 'eligible'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    ]"
                  >
                    {{ stu.status === 'eligible' ? 'Ruxsat berilgan' : 'Nofaol' }}
                  </span>
                </td>
                <td class="p-3.5 font-bold text-slate-900">
                  {{
                    teacherStore.classDetail.results.find((r) => r.rosterRecordId === stu.id)?.score
                      ? teacherStore.classDetail.results.find((r) => r.rosterRecordId === stu.id)?.score + ' ball'
                      : 'Kutilmoqda'
                  }}
                </td>
                <td class="p-3.5 text-right">
                  <router-link
                    :to="`/t/${tenantSlug}/teacher/students/${stu.id}`"
                    class="text-xs font-semibold text-teal-700 hover:underline"
                  >
                    Profil →
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Error/Not Found State -->
    <div v-else class="text-center py-12 bg-white rounded-xl border border-slate-200">
      <p class="text-sm text-slate-500">Sinf topilmadi yoki bu muassasaga tegishli emas.</p>
      <router-link
        :to="`/t/${tenantSlug}/teacher/classes`"
        class="mt-3 inline-block text-xs font-semibold text-teal-700 hover:underline"
      >
        Sinflar ro'yxatiga qaytish
      </router-link>
    </div>
  </div>
</template>
