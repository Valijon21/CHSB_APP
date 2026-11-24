<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';
import { useOrganizationStore } from '../../organization/store/organizationStore';
import { useToast } from '../../../shared/composables/useToast';
import CreateStudentModal from '../../organization/components/CreateStudentModal.vue';
import BulkStudentImportModal from '../../organization/components/BulkStudentImportModal.vue';
import TablePagination from '../../../shared/components/TablePagination.vue';
import type { StudentInput, ClassGroupRecord } from '../../../entities/organization/model';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();
const orgStore = useOrganizationStore();
const toast = useToast();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const searchInput = ref('');
const statusFilter = ref<'all' | 'eligible' | 'inactive'>('all');

const isCreateModalOpen = ref(false);
const isBulkModalOpen = ref(false);
const isBulkImporting = ref(false);

// Pagination State
const currentPage = ref(1);
const pageSize = ref(10);

const displayedRoster = computed(() => {
  return teacherStore.filteredRoster.filter((stu) => {
    if (statusFilter.value === 'all') return true;
    return stu.status === statusFilter.value;
  });
});

const paginatedRoster = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return displayedRoster.value.slice(start, start + pageSize.value);
});

const currentSchoolId = computed(() => {
  return teacherStore.classes[0]?.schoolId || 'school-ax-1';
});

const availableClassRecords = computed<ClassGroupRecord[]>(() => {
  return teacherStore.classes.map((c) => ({
    id: c.id,
    name: c.name,
    schoolId: c.schoolId || currentSchoolId.value,
    tenantSlug,
    gradeLevel: c.grade || 10,
    shift: 1,
    academicYear: c.academicYear || '2026-2027',
    studentCount: c.studentCount || 0,
    createdAt: '',
  }));
});

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  await teacherStore.loadTeacherData(tenantId, true);
});

function handleSearch() {
  currentPage.value = 1;
  teacherStore.setSearchQuery(searchInput.value);
}

function handleClassFilter(e: Event) {
  currentPage.value = 1;
  const target = e.target as HTMLSelectElement;
  teacherStore.filterByClass(target.value || null);
}

function handleGroupFilter(e: Event) {
  currentPage.value = 1;
  const target = e.target as HTMLSelectElement;
  teacherStore.filterByGroup(target.value as 'ALL' | '1-guruh' | '2-guruh' | 'NONE');
}

function handleStatusFilterChange() {
  currentPage.value = 1;
}

async function handleCreateStudent(input: StudentInput) {
  try {
    const created = await orgStore.createStudent(input);
    toast.success(`${created.firstName} ${created.lastName} muvaffaqiyatli qo'shildi!`, "O'quvchi qo'shildi");
    const tenantId =
      tenantStore.currentTenant?.tenantId ||
      (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
    await teacherStore.loadTeacherData(tenantId, true);
  } catch (err: any) {
    toast.error(err?.message || "O'quvchi qo'shishda xatolik yuz berdi", 'Xatolik');
  }
}

async function handleBulkImport(inputs: StudentInput[]) {
  isBulkImporting.value = true;
  try {
    const createdList = await orgStore.bulkImportStudents(inputs);
    toast.success(`${createdList.length} nafar o'quvchi muvaffaqiyatli import qilindi!`, 'Ommaviy import');
    const tenantId =
      tenantStore.currentTenant?.tenantId ||
      (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
    await teacherStore.loadTeacherData(tenantId, true);
    teacherStore.selectedClassId = null;
    teacherStore.selectedGroupFilter = 'ALL';
    teacherStore.setSearchQuery('');
    searchInput.value = '';
    currentPage.value = 1;
    isBulkModalOpen.value = false;
  } catch (err: any) {
    toast.error(err?.message || "O'quvchilarni import qilishda xatolik yuz berdi", 'Import xatosi');
  } finally {
    isBulkImporting.value = false;
  }
}

// Selection State
const selectedStudentIds = ref<string[]>([]);

const isAllOnPageSelected = computed(() => {
  if (paginatedRoster.value.length === 0) return false;
  return paginatedRoster.value.every((stu) => selectedStudentIds.value.includes(stu.id));
});

function toggleSelectAllOnPage() {
  if (isAllOnPageSelected.value) {
    const pageIds = new Set(paginatedRoster.value.map((s) => s.id));
    selectedStudentIds.value = selectedStudentIds.value.filter((id) => !pageIds.has(id));
  } else {
    const current = new Set(selectedStudentIds.value);
    for (const stu of paginatedRoster.value) {
      current.add(stu.id);
    }
    selectedStudentIds.value = Array.from(current);
  }
}

function clearSelection() {
  selectedStudentIds.value = [];
}

// Delete Confirmation Modal State
const isDeleteModalOpen = ref(false);
const deleteModalType = ref<'selected' | 'class' | 'single'>('selected');
const studentToDelete = ref<{ id: string; name: string } | null>(null);
const isDeleting = ref(false);

const selectedClassName = computed(() => {
  if (!teacherStore.selectedClassId) return '';
  const c = teacherStore.classes.find((cls) => cls.id === teacherStore.selectedClassId);
  return c?.name || 'Sinf';
});

const classStudentsCount = computed(() => {
  if (!teacherStore.selectedClassId) return 0;
  return teacherStore.roster.filter((r) => r.classGroupId === teacherStore.selectedClassId).length;
});

function openDeleteSelectedModal() {
  if (selectedStudentIds.value.length === 0) return;
  deleteModalType.value = 'selected';
  isDeleteModalOpen.value = true;
}

function openDeleteClassModal() {
  if (!teacherStore.selectedClassId) return;
  deleteModalType.value = 'class';
  isDeleteModalOpen.value = true;
}

function openDeleteSingleModal(stu: { id: string; firstName: string; lastName: string }) {
  studentToDelete.value = { id: stu.id, name: `${stu.lastName} ${stu.firstName}` };
  deleteModalType.value = 'single';
  isDeleteModalOpen.value = true;
}

async function handleConfirmDelete() {
  isDeleting.value = true;
  try {
    if (deleteModalType.value === 'class' && teacherStore.selectedClassId) {
      const clsName = selectedClassName.value;
      const count = await orgStore.deleteClassStudents(teacherStore.selectedClassId);
      toast.success(`${clsName}dagi barcha (${count} nafar) o'quvchi o'chirildi!`, "Sinf tozalandi");
      selectedStudentIds.value = [];
    } else if (deleteModalType.value === 'selected' && selectedStudentIds.value.length > 0) {
      const count = await orgStore.bulkDeleteStudents(selectedStudentIds.value);
      toast.success(`${count} nafar o'quvchi muvaffaqiyatli o'chirildi!`, "O'quvchilar o'chirildi");
      selectedStudentIds.value = [];
    } else if (deleteModalType.value === 'single' && studentToDelete.value) {
      await orgStore.deleteStudent(studentToDelete.value.id);
      toast.success(`${studentToDelete.value.name} muvaffaqiyatli o'chirildi!`, "O'quvchi o'chirildi");
      selectedStudentIds.value = selectedStudentIds.value.filter((id) => id !== studentToDelete.value?.id);
    }

    const tenantId =
      tenantStore.currentTenant?.tenantId ||
      (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
    await teacherStore.loadTeacherData(tenantId, true);
    isDeleteModalOpen.value = false;
  } catch (err: any) {
    toast.error(err?.message || "O'chirishda xatolik yuz berdi", "Xatolik");
  } finally {
    isDeleting.value = false;
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

        <!-- Sinfni Tozalash Tugmasi (faqat sinf tanlanganida chiqadi) -->
        <button
          v-if="teacherStore.selectedClassId"
          type="button"
          @click="openDeleteClassModal"
          :disabled="classStudentsCount === 0 || isDeleting"
          aria-label="Sinf o'quvchilarini tozalash"
          class="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer min-h-[38px]"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Sinfni tozalash ({{ classStudentsCount }} ta)</span>
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

        <!-- Group Filter -->
        <select
          :value="teacherStore.selectedGroupFilter"
          @change="handleGroupFilter"
          aria-label="Guruh bo'yicha filtrlash"
          class="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-700 cursor-pointer min-h-[36px]"
        >
          <option value="ALL">Barcha o'quvchilar</option>
          <option value="1-guruh">1-guruh</option>
          <option value="2-guruh">2-guruh</option>
          <option value="NONE">Guruhsiz (Umumiy sinf)</option>
        </select>

        <!-- Status Filter -->
        <select
          v-model="statusFilter"
          @change="handleStatusFilterChange"
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

    <!-- Selected Students Action Bar -->
    <div
      v-if="selectedStudentIds.length > 0"
      class="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs transition"
    >
      <div class="flex items-center gap-2">
        <span class="w-6 h-6 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-bold text-xs flex items-center justify-center">
          {{ selectedStudentIds.length }}
        </span>
        <span class="text-xs font-bold text-rose-900 dark:text-rose-200">
          ta o'quvchi belgilandi
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="clearSelection"
          class="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
        >
          Bekor qilish
        </button>
        <button
          type="button"
          @click="openDeleteSelectedModal"
          :disabled="isDeleting"
          class="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Tanlanganlarni o'chirish ({{ selectedStudentIds.length }} ta)</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">O'quvchilar ro'yxati yuklanmoqda...</p>
    </div>

    <!-- Students Table with Pagination -->
    <div v-else class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden transition-colors">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="p-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  :checked="isAllOnPageSelected"
                  @change="toggleSelectAllOnPage"
                  class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  title="Sahifadagi barchasini belgilash"
                />
              </th>
              <th class="p-3.5">№</th>
              <th class="p-3.5">F.I.SH.</th>
              <th class="p-3.5">Roster Kodi</th>
              <th class="p-3.5">Sinf</th>
              <th class="p-3.5 text-center">Guruh</th>
              <th class="p-3.5">Holati</th>
              <th class="p-3.5">Topshirilgan Test</th>
              <th class="p-3.5 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/80">
            <tr
              v-for="(stu, idx) in paginatedRoster"
              :key="stu.id"
              :class="[
                'hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition',
                selectedStudentIds.includes(stu.id) ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
              ]"
            >
              <td class="p-3.5 text-center">
                <input
                  type="checkbox"
                  :value="stu.id"
                  v-model="selectedStudentIds"
                  class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
              </td>
              <td class="p-3.5 text-slate-400 font-mono">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
              <td class="p-3.5">
                <div class="font-bold text-slate-800 dark:text-white">
                  {{ stu.firstName }} {{ stu.lastName }} {{ stu.middleName || '' }}
                </div>
                <div v-if="stu.emaktabId" class="text-[11px] font-mono text-slate-400 dark:text-slate-400">
                  eMaktab ID: {{ stu.emaktabId }}
                </div>
              </td>
              <td class="p-3.5 font-mono text-teal-800 dark:text-teal-400 font-semibold">{{ stu.rosterCode }}</td>
              <td class="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                {{ teacherStore.classes.find((c) => c.id === stu.classGroupId)?.name || '11-sinf' }}
              </td>
              <td class="p-3.5 text-center">
                <span
                  v-if="stu.group"
                  :class="[
                    'px-2 py-0.5 rounded text-[11px] font-bold border',
                    stu.group === '2-guruh'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                  ]"
                >
                  {{ stu.group }}
                </span>
                <span
                  v-else
                  class="px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700"
                >
                  Umumiy sinf
                </span>
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
                <div class="flex items-center justify-end gap-2">
                  <router-link
                    :to="`/t/${tenantSlug}/teacher/students/${stu.id}`"
                    class="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline min-h-[36px] inline-flex items-center"
                  >
                    Batafsil →
                  </router-link>
                  <button
                    type="button"
                    @click="openDeleteSingleModal(stu)"
                    class="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                    title="O'quvchini o'chirish"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table Pagination (10, 20, 30, 50) -->
      <TablePagination
        v-if="displayedRoster.length > 0"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total-items="displayedRoster.length"
      />

      <!-- Empty state -->
      <div v-if="displayedRoster.length === 0" class="text-center py-12 text-xs text-slate-500 dark:text-slate-400 space-y-2">
        <div class="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl text-slate-400">
          👥
        </div>
        <p class="font-bold text-slate-700 dark:text-slate-300 text-sm">Hozircha o'quvchilar ro'yxati bo'sh</p>
        <p>Excel faylini yuklash uchun yuqoridagi <strong>"Ommaviy Import"</strong> tugmasidan foydalanishingiz mumkin.</p>
      </div>
    </div>

    <!-- 1. Yangi O'quvchi Qo'shish Modali -->
    <CreateStudentModal
      :is-open="isCreateModalOpen"
      :school-id="currentSchoolId"
      :tenant-slug="tenantSlug"
      :available-classes="availableClassRecords"
      @close="isCreateModalOpen = false"
      @create="handleCreateStudent"
      @open-bulk="isCreateModalOpen = false; isBulkModalOpen = true"
    />

    <!-- 2. Ommaviy Import Modali -->
    <BulkStudentImportModal
      :is-open="isBulkModalOpen"
      :school-id="currentSchoolId"
      :tenant-slug="tenantSlug"
      :available-classes="availableClassRecords"
      :is-submitting="isBulkImporting"
      @close="isBulkModalOpen = false"
      @bulk-import="handleBulkImport"
    />

    <!-- 3. O'chirishni Tasdiqlash Modali -->
    <div
      v-if="isDeleteModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      @click.self="isDeleteModalOpen = false"
    >
      <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 text-lg">
            ⚠️
          </div>
          <div>
            <h3 class="font-bold text-slate-900 dark:text-white text-base">
              O'quvchilarni o'chirishni tasdiqlang
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Bu amalni ortga qaytarib bo'lmaydi.
            </p>
          </div>
        </div>

        <div class="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 leading-relaxed text-xs">
          <p v-if="deleteModalType === 'class'">
            Haqiqatan ham <strong>{{ selectedClassName }}</strong> sinfidagi barcha <strong>{{ classStudentsCount }} nafar</strong> o'quvchini o'chirmoqchimisiz? Ularning barcha test topshirish natijalari ham to'liq tozalanadi.
          </p>
          <p v-else-if="deleteModalType === 'selected'">
            Haqiqatan ham tanlangan <strong>{{ selectedStudentIds.length }} nafar</strong> o'quvchini o'chirmoqchimisiz?
          </p>
          <p v-else-if="deleteModalType === 'single'">
            Haqiqatan ham <strong>{{ studentToDelete?.name }}</strong> o'quvchisini o'chirmoqchimisiz?
          </p>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            @click="isDeleteModalOpen = false"
            :disabled="isDeleting"
            class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer min-h-[38px]"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            @click="handleConfirmDelete"
            :disabled="isDeleting"
            class="px-5 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer min-h-[38px] flex items-center gap-1.5"
          >
            <svg v-if="isDeleting" class="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isDeleting ? "O'chirilmoqda..." : "Ha, o'chirilsin" }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

