<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';
import { useOrganizationStore } from '../../organization/store/organizationStore';
import CreateClassModal from '../../organization/components/CreateClassModal.vue';
import ClassCard from './components/ClassCard.vue';
import type { ClassGroupInput } from '../../../entities/organization/model';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();
const orgStore = useOrganizationStore();

const tenantSlug = computed(() => (route?.params?.tenantSlug as string) || 'al-xorazmiy');
const isCreateClassModalOpen = ref(false);
const searchQuery = ref('');
const selectedGrade = ref<'ALL' | number>('ALL');
const selectedShift = ref<'ALL' | 1 | 2>('ALL');

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug.value);
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug.value === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  await Promise.all([
    teacherStore.loadTeacherData(tenantId, true),
    orgStore.loadSchoolContext(tenantSlug.value),
  ]);
});

// Merges class groups from organizationStore and teacherStore
const allSchoolClasses = computed(() => {
  if (orgStore.classGroups.length > 0) {
    return orgStore.classGroups;
  }
  return teacherStore.classes.map((c) => ({
    id: c.id,
    schoolId: c.schoolId,
    tenantSlug: c.tenantId,
    name: c.name,
    gradeLevel: c.grade,
    shift: 1 as const,
    academicYear: c.academicYear,
    headTeacherId: undefined as string | undefined,
    headTeacherName: undefined as string | undefined,
    studentCount: c.studentCount,
    createdAt: new Date().toISOString(),
  }));
});

const filteredClasses = computed(() => {
  return allSchoolClasses.value.filter((cls) => {
    if (selectedGrade.value !== 'ALL' && cls.gradeLevel !== selectedGrade.value) {
      return false;
    }
    if (selectedShift.value !== 'ALL' && cls.shift !== selectedShift.value) {
      return false;
    }
    if (searchQuery.value.trim() !== '') {
      const q = searchQuery.value.toLowerCase();
      const matchName = cls.name.toLowerCase().includes(q);
      const matchHead = cls.headTeacherName?.toLowerCase().includes(q);
      if (!matchName && !matchHead) {
        return false;
      }
    }
    return true;
  });
});

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
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 class="text-xl font-bold text-slate-900 dark:text-white">Maktab Sinflari Boshqaruvi</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Maktabdagi barcha sinflar, ularning o'quvchilari soni va sinf rahbarlari tarkibi.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <router-link
          :to="`/t/${tenantSlug}/teacher/students`"
          aria-label="O'quvchilar ro'yxatiga o'tish"
          class="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg text-xs transition border border-slate-200 dark:border-slate-700 min-h-[38px] flex items-center"
        >
          O'quvchilar ro'yxati (Roster) →
        </router-link>

        <button
          type="button"
          @click="isCreateClassModalOpen = true"
          aria-label="Yangi sinf qo'shish"
          class="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer min-h-[38px]"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Yangi Sinf Qo'shish</span>
        </button>
      </div>
    </div>

    <!-- Search & Filter Toolbar -->
    <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs transition-colors">
      <!-- Search Input -->
      <div class="relative flex-1 max-w-md">
        <input
          v-model="searchQuery"
          type="text"
          aria-label="Sinf nomi yoki rahbari bo'yicha qidirish"
          placeholder="Sinf nomi (masalan: 9-A) yoki sinf rahbari..."
          class="w-full px-3 py-1.5 pl-8 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-hidden focus:ring-2 focus:ring-teal-700 bg-white dark:bg-slate-700/90 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400"
        />
        <span class="absolute left-2.5 top-2 text-slate-400 dark:text-slate-400 text-xs">🔍</span>
      </div>

      <!-- Parallel & Shift Filters -->
      <div class="flex items-center gap-2 flex-wrap">
        <div class="flex items-center gap-1">
          <span class="text-slate-500 dark:text-slate-400 text-[11px]">Parallel:</span>
          <select
            v-model="selectedGrade"
            aria-label="Parallel sinf bo'yicha saralash"
            class="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden text-xs"
          >
            <option value="ALL">Barcha sinflar</option>
            <option v-for="g in 11" :key="g" :value="g">{{ g }}-sinflar</option>
          </select>
        </div>

        <div class="flex items-center gap-1">
          <span class="text-slate-500 dark:text-slate-400 text-[11px]">Smena:</span>
          <select
            v-model="selectedShift"
            aria-label="Smena bo'yicha saralash"
            class="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden text-xs"
          >
            <option value="ALL">Barchasi</option>
            <option :value="1">1-smena</option>
            <option :value="2">2-smena</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading || orgStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Sinflar yuklanmoqda...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredClasses.length === 0"
      class="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8"
    >
      <span class="text-3xl block mb-2">🏫</span>
      <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Birorta ham sinf topilmadi</h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
        Filtrlarni o'zgartiring yoki yangi sinf parallelini ochish uchun quyidagi tugmani bosing.
      </p>
      <button
        type="button"
        @click="isCreateClassModalOpen = true"
        aria-label="Yangi sinf ochish"
        class="px-4 py-2 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 mx-auto cursor-pointer min-h-[38px]"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Yangi Sinf Ochish</span>
      </button>
    </div>

    <!-- Classes Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <ClassCard
        v-for="cls in filteredClasses"
        :key="cls.id"
        :class-item="cls"
        :tenant-slug="tenantSlug"
      />
    </div>

    <!-- Create Class Modal -->
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
