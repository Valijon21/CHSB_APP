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
    <div class="flex items-center justify-between pb-4 border-b border-slate-200">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Tenant Administrator Sozlamalari</h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Muassasa boshqaruvi: <span class="font-mono text-indigo-700 font-semibold">{{ tenantStore.currentTenant?.displayName }}</span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <router-link
          to="/schools"
          class="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold transition"
        >
          ← Barcha Maktablar Katalogi
        </router-link>
        <span class="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-600 font-mono">
          Tenant Admin Portal
        </span>
      </div>
    </div>

    <!-- Tenant Settings Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h3 class="text-sm font-bold text-slate-900">Muassasa Ma'lumotlari</h3>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">Tenant Slug:</span>
            <span class="font-mono font-medium">{{ tenantSlug }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">Rasmiy Nomi:</span>
            <span class="font-medium">{{ tenantStore.currentTenant?.displayName }}</span>
          </div>
          <div class="flex justify-between items-center py-1 border-b border-slate-100">
            <span class="text-slate-500">Biriktirilgan Sinflar:</span>
            <div class="flex items-center gap-2">
              <span class="font-bold text-indigo-950">{{ orgStore.classGroups.length || teacherStore.classes.length }} ta sinf</span>
              <button
                type="button"
                @click="isCreateClassModalOpen = true"
                class="text-[11px] px-2 py-0.5 rounded bg-teal-50 text-teal-800 hover:bg-teal-100 font-semibold transition cursor-pointer"
              >
                + Sinf qo'shish
              </button>
            </div>
          </div>
          <div class="flex justify-between py-1">
            <span class="text-slate-500">Holat:</span>
            <span class="text-emerald-700 font-semibold">Faol (Active)</span>
          </div>
        </div>
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h3 class="text-sm font-bold text-slate-900">Xavfsizlik & Roster Konfiguratsiyasi</h3>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">Kirish usuli:</span>
            <span class="font-semibold text-slate-800">Roster Lookup (Kod orqali)</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">Ochiq ro'yxatdan o'tish:</span>
            <span class="text-rose-700 font-semibold">O'chirilgan (Disabled)</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">Izolyatsiya darajasi:</span>
            <span class="text-indigo-800 font-mono">Tenant Strict Isolation</span>
          </div>
          <div class="flex justify-between py-1">
            <span class="text-slate-500">Jami Roster:</span>
            <span class="font-bold text-slate-900">{{ teacherStore.roster.length }} nafar o'quvchi</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="flex items-center gap-2 border-b border-slate-200">
      <button
        type="button"
        @click="activeTab = 'teachers'"
        class="pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer"
        :class="activeTab === 'teachers' ? 'border-teal-700 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'"
      >
        <span>👨‍🏫</span>
        <span>O'qituvchilar Tarkibi</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'logs'"
        class="pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer"
        :class="activeTab === 'logs' ? 'border-teal-700 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'"
      >
        <span>📋</span>
        <span>Tizim Loglari & Audit (Xatolar Konsoli)</span>
      </button>
    </div>

    <!-- O'qituvchilar Boshqaruvi Bo'limi -->
    <div v-if="activeTab === 'teachers'" class="space-y-4 pt-1">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-base font-bold text-slate-900">Maktab O'qituvchilari Boshqaruvi</h3>
          <p class="text-xs text-slate-500">
            Maktab pedagogik tarkibini shakllantirish, fan va sinflarni biriktirish
          </p>
        </div>

        <button
          type="button"
          @click="isCreateTeacherModalOpen = true"
          class="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
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
