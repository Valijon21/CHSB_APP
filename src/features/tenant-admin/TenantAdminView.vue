<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../tenant-context/tenantStore';
import { useTeacherStore } from '../teacher/teacherStore';
import { useOrganizationStore } from '../organization/store/organizationStore';
import CreateTeacherModal from '../organization/components/CreateTeacherModal.vue';
import CreateClassModal from '../organization/components/CreateClassModal.vue';
import TeacherRosterTable from '../organization/components/TeacherRosterTable.vue';
import SystemLogViewer from './components/SystemLogViewer.vue';
import type { TeacherInput, ClassGroupInput } from '../../entities/organization/model';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();
const orgStore = useOrganizationStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const isCreateTeacherModalOpen = ref(false);
const isCreateClassModalOpen = ref(false);
const activeTab = ref<'teachers' | 'logs'>(route.query.tab === 'logs' ? 'logs' : 'teachers');

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId = tenantStore.currentTenant?.tenantId || (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  await teacherStore.loadTeacherData(tenantId);
  await orgStore.loadSchoolContext(tenantSlug);
});

async function handleCreateTeacher(input: TeacherInput) {
  await orgStore.createTeacher(input);
}

async function handleDeleteTeacher(id: string) {
  await orgStore.deleteTeacher(id);
}

async function handleCreateClass(input: ClassGroupInput) {
  const created = await orgStore.createClassGroup(input);
  teacherStore.addClass({
    id: created.id,
    tenantId: input.tenantSlug,
    schoolId: input.schoolId,
    name: created.name,
    grade: created.gradeLevel,
    academicYear: created.academicYear,
    studentCount: 0,
  });
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-white">Tenant Administrator Sozlamalari</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Muassasa boshqaruvi: <span class="font-mono text-indigo-700 dark:text-indigo-400 font-semibold">{{ tenantStore.currentTenant?.displayName }}</span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <router-link
          to="/schools"
          aria-label="Maktablar katalogiga qaytish"
          class="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition min-h-[36px] flex items-center"
        >
          ← Barcha Maktablar Katalogi
        </router-link>
        <span class="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
          Tenant Admin Portal
        </span>
      </div>
    </div>

    <!-- Tenant Settings Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3 transition-colors">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white">Muassasa Ma'lumotlari</h3>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
            <span class="text-slate-500 dark:text-slate-400">Tenant Slug:</span>
            <span class="font-mono font-medium text-slate-800 dark:text-slate-200">{{ tenantSlug }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
            <span class="text-slate-500 dark:text-slate-400">Rasmiy Nomi:</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">{{ tenantStore.currentTenant?.displayName }}</span>
          </div>
          <div class="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/60">
            <span class="text-slate-500 dark:text-slate-400">Biriktirilgan Sinflar:</span>
            <div class="flex items-center gap-2">
              <span class="font-bold text-indigo-950 dark:text-indigo-300">{{ orgStore.classGroups.length || teacherStore.classes.length }} ta sinf</span>
              <button
                type="button"
                @click="isCreateClassModalOpen = true"
                aria-label="Yangi sinf qo'shish"
                class="text-[11px] px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/80 border border-teal-200 dark:border-teal-800 font-semibold transition cursor-pointer min-h-[30px]"
              >
                + Sinf qo'shish
              </button>
            </div>
          </div>
          <div class="flex justify-between py-1">
            <span class="text-slate-500 dark:text-slate-400">Holat:</span>
            <span class="text-emerald-700 dark:text-emerald-400 font-semibold">Faol (Active)</span>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3 transition-colors">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white">Xavfsizlik & Roster Konfiguratsiyasi</h3>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
            <span class="text-slate-500 dark:text-slate-400">Kirish usuli:</span>
            <span class="font-semibold text-slate-800 dark:text-slate-200">Roster Lookup (Kod orqali)</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
            <span class="text-slate-500 dark:text-slate-400">Ochiq ro'yxatdan o'tish:</span>
            <span class="text-rose-700 dark:text-rose-400 font-semibold">O'chirilgan (Disabled)</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
            <span class="text-slate-500 dark:text-slate-400">Izolyatsiya darajasi:</span>
            <span class="text-indigo-800 dark:text-indigo-300 font-mono">Tenant Strict Isolation</span>
          </div>
          <div class="flex justify-between py-1">
            <span class="text-slate-500 dark:text-slate-400">Jami Roster:</span>
            <span class="font-bold text-slate-900 dark:text-white">{{ teacherStore.roster.length }} nafar o'quvchi</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto whitespace-nowrap">
      <button
        type="button"
        @click="activeTab = 'teachers'"
        aria-label="O'qituvchilar tarkibi varag'i"
        class="pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer min-h-[38px]"
        :class="activeTab === 'teachers' ? 'border-teal-700 dark:border-teal-400 text-teal-800 dark:text-teal-300' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
      >
        <span>👨‍🏫</span>
        <span>O'qituvchilar Tarkibi</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'logs'"
        aria-label="Tizim loglari va audit xatolar konsoli"
        class="pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer min-h-[38px]"
        :class="activeTab === 'logs' ? 'border-teal-700 dark:border-teal-400 text-teal-800 dark:text-teal-300' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
      >
        <span>📋</span>
        <span>Tizim Loglari & Audit (Xatolar Konsoli)</span>
      </button>
    </div>

    <!-- O'qituvchilar Boshqaruvi Bo'limi -->
    <div v-if="activeTab === 'teachers'" class="space-y-4 pt-1">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white">Maktab O'qituvchilari Boshqaruvi</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Maktab pedagogik tarkibini shakllantirish, fan va sinflarni biriktirish
          </p>
        </div>

        <button
          type="button"
          @click="isCreateTeacherModalOpen = true"
          aria-label="Yangi o'qituvchi qo'shish"
          class="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer min-h-[38px]"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          + Yangi O'qituvchi Qo'shish
        </button>
      </div>

      <TeacherRosterTable
        :teachers="orgStore.teachers"
        @delete="handleDeleteTeacher"
      />
    </div>

    <!-- Tizim Loglari & Audit Bo'limi -->
    <div v-else-if="activeTab === 'logs'" class="space-y-4 pt-1">
      <SystemLogViewer />
    </div>

    <!-- Yangi O'qituvchi Modal -->
    <CreateTeacherModal
      :is-open="isCreateTeacherModalOpen"
      :school-id="tenantStore.currentTenant?.tenantId || 'sch-01'"
      :tenant-slug="tenantSlug"
      :available-classes="orgStore.classGroups"
      @close="isCreateTeacherModalOpen = false"
      @create="handleCreateTeacher"
    />

    <!-- Yangi Sinf Modal -->
    <CreateClassModal
      :is-open="isCreateClassModalOpen"
      :school-id="tenantStore.currentTenant?.tenantId || 'sch-01'"
      :tenant-slug="tenantSlug"
      :available-teachers="orgStore.teachers"
      @close="isCreateClassModalOpen = false"
      @create="handleCreateClass"
    />
  </div>
</template>
