<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';
import { useOrganizationStore } from '../../organization/store/organizationStore';
import CreateStudentModal from '../../organization/components/CreateStudentModal.vue';
import BulkStudentImportModal from '../../organization/components/BulkStudentImportModal.vue';
import type { StudentInput, ClassGroupRecord } from '../../../entities/organization/model';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();
const orgStore = useOrganizationStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const searchInput = ref('');
const statusFilter = ref<'all' | 'eligible' | 'inactive'>('all');

const isCreateModalOpen = ref(false);
const isBulkModalOpen = ref(false);

const displayedRoster = computed(() => {
  return teacherStore.filteredRoster.filter((stu) => {
    if (statusFilter.value === 'all') return true;
    return stu.status === statusFilter.value;
  });
});

const availableClassRecords = computed<ClassGroupRecord[]>(() => {
  return teacherStore.classes.map((c) => ({
    id: c.id,
    name: c.name,
    schoolId: tenantStore.currentTenant?.tenantId || 'sch-01',
    tenantSlug,
    gradeLevel: 10,
    shift: 1,
    academicYear: '2026-2027',
    studentCount: 0,
    createdAt: '',
  }));
});

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  await teacherStore.loadTeacherData(tenantId);
});

function handleSearch() {
  teacherStore.setSearchQuery(searchInput.value);
}

function handleClassFilter(e: Event) {
  const target = e.target as HTMLSelectElement;
  teacherStore.filterByClass(target.value || null);
}

async function handleCreateStudent(input: StudentInput) {
  const created = await orgStore.createStudent(input);
  teacherStore.roster.push({
    id: created.id,
    tenantId: tenantStore.currentTenant?.tenantId || 'tenant-al-xorazmiy',
    schoolId: input.schoolId,
    classGroupId: input.classGroupId,
    rosterCode: created.rosterCode,
    firstName: created.firstName,
    lastName: created.lastName,
    middleName: created.middleName,
    status: 'eligible',
    availableAssessmentIds: [],
  });
}

async function handleBulkImport(inputs: StudentInput[]) {
  const createdList = await orgStore.bulkImportStudents(inputs);
  for (const created of createdList) {
    teacherStore.roster.push({
      id: created.id,
      tenantId: tenantStore.currentTenant?.tenantId || 'tenant-al-xorazmiy',
      schoolId: created.schoolId,
      classGroupId: created.classGroupId,
      rosterCode: created.rosterCode,
      firstName: created.firstName,
      lastName: created.lastName,
      middleName: created.middleName,
      status: 'eligible',
      availableAssessmentIds: [],
    });
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 class="text-xl font-bold text-slate-900 dark:text-white">O'quvchilar Boshqaruvi (Roster Directory)</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Muassasadagi barcha biriktirilgan o'quvchilar va ularning imtihon ruxsatlari.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- Yangi O'quvchi Tugmasi -->
        <button
          type="button"
          @click="isCreateModalOpen = true"
          aria-label="Yangi o'quvchi qo'shish"
          class="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer min-h-[38px]"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Yangi O'quvchi</span>
        </button>

        <!-- Ommaviy Import Tugmasi -->
        <button
          type="button"
          @click="isBulkModalOpen = true"
          aria-label="O'quvchilarni ommaviy import qilish"
          class="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer min-h-[38px]"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>Ommaviy Import</span>
        </button>

        <router-link
          :to="`/t/${tenantSlug}/teacher/reports`"
          aria-label="Hisobotlar va eksport bo'limiga o'tish"
          class="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition border border-slate-200 dark:border-slate-700 min-h-[38px] flex items-center"
        >
          CSV/Excel →
        </router-link>
      </div>
    </div>

    <!-- Filter and Search Bar -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors">
      <div class="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
        <!-- Search Input -->
        <div class="relative flex-1 min-w-[200px]">
          <input
            v-model="searchInput"
            @input="handleSearch"
            type="text"
            aria-label="O'quvchi ismi yoki Roster kodi bo'yicha qidirish"
            placeholder="O'quvchi ismi yoki Roster kodi (masalan: STU-1101)..."
            class="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-700"
          />
        </div>

        <!-- Class Filter -->
        <select
          @change="handleClassFilter"
          aria-label="Sinf bo'yicha filtrlash"
          class="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-700 cursor-pointer min-h-[36px]"
        >
          <option value="">Barcha sinflar</option>
          <option v-for="cls in teacherStore.classes" :key="cls.id" :value="cls.id">
            {{ cls.name }}
          </option>
        </select>

        <!-- Status Filter -->
        <select
          v-model="statusFilter"
          aria-label="Status bo'yicha filtrlash"
          class="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-700 cursor-pointer min-h-[36px]"
        >
          <option value="all">Barcha statuslar</option>
          <option value="eligible">Ruxsat berilgan</option>
          <option value="inactive">Nofaol</option>
        </select>
      </div>

      <div class="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Jami: {{ displayedRoster.length }} nafar o'quvchi
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">O'quvchilar ro'yxati yuklanmoqda...</p>
    </div>

    <!-- Students Table -->
    <div v-else class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden transition-colors">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="p-3.5">№</th>
              <th class="p-3.5">F.I.SH.</th>
              <th class="p-3.5">Roster Kodi</th>
              <th class="p-3.5">Sinf</th>
              <th class="p-3.5">Holati</th>
              <th class="p-3.5">Topshirilgan Test</th>
              <th class="p-3.5 text-right">Profil</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/80">
            <tr
              v-for="(stu, idx) in displayedRoster"
              :key="stu.id"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
            >
              <td class="p-3.5 text-slate-400 font-mono">{{ idx + 1 }}</td>
              <td class="p-3.5 font-bold text-slate-800 dark:text-white">
                {{ stu.firstName }} {{ stu.lastName }} {{ stu.middleName || '' }}
              </td>
              <td class="p-3.5 font-mono text-teal-800 dark:text-teal-400 font-semibold">{{ stu.rosterCode }}</td>
              <td class="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                {{ teacherStore.classes.find((c) => c.id === stu.classGroupId)?.name || '11-sinf' }}
              </td>
              <td class="p-3.5">
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[11px] font-semibold',
                    stu.status === 'eligible'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  ]"
                >
                  {{ stu.status === 'eligible' ? 'Ruxsat berilgan' : 'Nofaol' }}
                </span>
              </td>
              <td class="p-3.5 font-medium text-slate-600 dark:text-slate-300">
                {{ teacherStore.results.some((r) => r.rosterRecordId === stu.id) ? 'Topshirgan' : 'Kutilmoqda' }}
              </td>
              <td class="p-3.5 text-right">
                <router-link
                  :to="`/t/${tenantSlug}/teacher/students/${stu.id}`"
                  class="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline min-h-[36px] inline-flex items-center"
                >
                  Batafsil →
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state if search finds nothing -->
      <div v-if="displayedRoster.length === 0" class="text-center py-10 text-xs text-slate-500 dark:text-slate-400">
        Qidiruv bo'yicha hech qanday o'quvchi topilmadi.
      </div>
    </div>

    <!-- 1. Yangi O'quvchi Qo'shish Modali -->
    <CreateStudentModal
      :is-open="isCreateModalOpen"
      :school-id="tenantStore.currentTenant?.tenantId || 'sch-01'"
      :tenant-slug="tenantSlug"
      :available-classes="availableClassRecords"
      @close="isCreateModalOpen = false"
      @create="handleCreateStudent"
    />

    <!-- 2. Ommaviy Import Modali -->
    <BulkStudentImportModal
      :is-open="isBulkModalOpen"
      :school-id="tenantStore.currentTenant?.tenantId || 'sch-01'"
      :tenant-slug="tenantSlug"
      :available-classes="availableClassRecords"
      @close="isBulkModalOpen = false"
      @bulk-import="handleBulkImport"
    />
  </div>
</template>

