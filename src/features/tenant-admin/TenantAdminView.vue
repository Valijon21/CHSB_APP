<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../tenant-context/tenantStore';
import { useTeacherStore } from '../teacher/teacherStore';
import { useOrganizationStore } from '../organization/store/organizationStore';
import CreateTeacherModal from '../organization/components/CreateTeacherModal.vue';
import CreateClassModal from '../organization/components/CreateClassModal.vue';
import TeacherRosterTable from '../organization/components/TeacherRosterTable.vue';
import ConfirmPurgeModal from '../organization/components/ConfirmPurgeModal.vue';
import SystemLogViewer from './components/SystemLogViewer.vue';
import type { TeacherInput, ClassGroupInput, ClassGroupRecord } from '../../entities/organization/model';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();
const orgStore = useOrganizationStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const isCreateTeacherModalOpen = ref(false);
const isCreateClassModalOpen = ref(false);
const activeTab = ref<'teachers' | 'classes' | 'logs'>(
  route.query.tab === 'logs' ? 'logs' : route.query.tab === 'classes' ? 'classes' : 'teachers'
);

// Admin Sinflar va O'quvchilarni Tozalash (Purge / Delete) Holatlari
const isConfirmModalOpen = ref(false);
const confirmModalAction = ref<'delete' | 'purge'>('delete');
const selectedClassForAction = ref<ClassGroupRecord | null>(null);
const isPurgeLoading = ref(false);
const actionNotification = ref<{ type: 'success' | 'error'; message: string } | null>(null);
const classSearchQuery = ref('');

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
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
  await orgStore.createClassGroup(input);
}

const filteredClasses = computed(() => {
  const query = classSearchQuery.value.toLowerCase().trim();
  const list = orgStore.classGroups.length > 0 ? orgStore.classGroups : teacherStore.classes.map((c) => ({
    id: c.id,
    schoolId: c.schoolId,
    tenantSlug,
    name: c.name,
    gradeLevel: c.grade,
    shift: 1 as const,
    academicYear: c.academicYear,
    headTeacherId: c.teacherId,
    headTeacherName: c.teacherName,
    studentCount: c.studentCount,
    createdAt: new Date().toISOString(),
  }));

  if (!query) return list;
  return list.filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      (c.headTeacherName && c.headTeacherName.toLowerCase().includes(query)) ||
      c.academicYear.toLowerCase().includes(query)
  );
});

function openPurgeModal(cls: ClassGroupRecord) {
  selectedClassForAction.value = cls;
  confirmModalAction.value = 'purge';
  isConfirmModalOpen.value = true;
}

function openDeleteModal(cls: ClassGroupRecord) {
  selectedClassForAction.value = cls;
  confirmModalAction.value = 'delete';
  isConfirmModalOpen.value = true;
}

async function handleConfirmAction() {
  if (!selectedClassForAction.value) return;
  const cls = selectedClassForAction.value;
  isPurgeLoading.value = true;

  try {
    if (confirmModalAction.value === 'delete') {
      const ok = await orgStore.deleteClassGroup(cls.id);
      if (ok) {
        actionNotification.value = {
          type: 'success',
          message: `'${cls.name}' sinfi va unga tegishli barcha o'quvchilar muvaffaqiyatli o'chirildi.`,
        };
      } else {
        actionNotification.value = {
          type: 'error',
          message: `'${cls.name}' sinfini o'chirishda xatolik yuz berdi.`,
        };
      }
    } else {
      const res = await orgStore.purgeClassStudents(cls.id);
      if (res.success) {
        actionNotification.value = {
          type: 'success',
          message: `'${cls.name}' sinfidagi barcha ${res.purgedCount} nafar o'quvchi muvaffaqiyatli tozalandi.`,
        };
      } else {
        actionNotification.value = {
          type: 'error',
          message: `'${cls.name}' sinfi o'quvchilarini tozalashda xatolik yuz berdi.`,
        };
      }
    }

    isConfirmModalOpen.value = false;
    selectedClassForAction.value = null;

    setTimeout(() => {
      actionNotification.value = null;
    }, 6000);
  } catch (err) {
    actionNotification.value = {
      type: 'error',
      message: err instanceof Error ? err.message : "Amalni bajarishda xatolik yuz berdi.",
    };
  } finally {
    isPurgeLoading.value = false;
  }
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
                class="text-[11px] px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/80 border border-teal-200 dark:border-teal-800 font-semibold transition cursor-pointer min-h-[30px] inline-flex items-center gap-1"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Sinf qo'shish</span>
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

    <!-- Action Notification Toast / Banner -->
    <div
      v-if="actionNotification"
      class="p-4 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-sm transition-all"
      :class="
        actionNotification.type === 'success'
          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
          : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
      "
    >
      <div class="flex items-center gap-2">
        <svg v-if="actionNotification.type === 'success'" class="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <svg v-else class="w-5 h-5 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="font-semibold">{{ actionNotification.message }}</span>
      </div>
      <button
        type="button"
        @click="actionNotification = null"
        class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
      >
        ✕
      </button>
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
        @click="activeTab = 'classes'"
        aria-label="Sinflar va O'quvchilarni Boshqarish varag'i"
        class="pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer min-h-[38px]"
        :class="activeTab === 'classes' ? 'border-teal-700 dark:border-teal-400 text-teal-800 dark:text-teal-300' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'"
      >
        <span>🏫</span>
        <span>Sinflar & O'quvchilarni Tozalash (Admin)</span>
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

    <!-- 1. O'qituvchilar Boshqaruvi Bo'limi -->
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
          <span>Yangi O'qituvchi Qo'shish</span>
        </button>
      </div>

      <TeacherRosterTable
        :teachers="orgStore.teachers"
        @delete="handleDeleteTeacher"
      />
    </div>

    <!-- 2. Sinflar & O'quvchilarni Boshqarish (Purge & Delete - Faqat Admin) -->
    <div v-else-if="activeTab === 'classes'" class="space-y-4 pt-1">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-base font-bold text-slate-900 dark:text-white">Sinflar & O'quvchilarni Tozalash</h3>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              🛡️ Faqat Admin Huquqi
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Admin sifatida xohlagan sinfni bazadan butunlay o'chirish yoki sinfni saqlagan holda uning barcha o'quvchilar ro'yxatini tozalash (reset qilish)
          </p>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <input
            v-model="classSearchQuery"
            type="text"
            placeholder="Sinf yoki o'qituvchi qidirish..."
            class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 w-full sm:w-56"
          />
          <button
            type="button"
            @click="isCreateClassModalOpen = true"
            aria-label="Yangi sinf ochish"
            class="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 min-h-[38px]"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Yangi Sinf Qo'shish</span>
          </button>
        </div>
      </div>

      <!-- Sinflar Jadvali -->
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div v-if="filteredClasses.length === 0" class="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
          Birorta ham sinf topilmadi.
        </div>
        <table v-else class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="p-3 w-12 text-center">№</th>
              <th class="p-3">Sinf Nomi</th>
              <th class="p-3">Sinf Rahbari (O'qituvchi)</th>
              <th class="p-3 text-center">Smena / O'quv yili</th>
              <th class="p-3 text-center">O'quvchilar Soni</th>
              <th class="p-3 text-right">Amallar (Faqat Admin)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
            <tr
              v-for="(cls, idx) in filteredClasses"
              :key="cls.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
            >
              <td class="p-3 text-center font-mono text-slate-400">{{ idx + 1 }}</td>
              <td class="p-3 font-bold text-slate-900 dark:text-white">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-mono font-bold">
                  🏫 {{ cls.name }}
                </span>
              </td>
              <td class="p-3 text-slate-700 dark:text-slate-300">
                <span v-if="cls.headTeacherName" class="font-medium flex items-center gap-1">
                  <span>👨‍🏫</span> {{ cls.headTeacherName }}
                </span>
                <span v-else class="text-slate-400 italic">Biriktirilmagan</span>
              </td>
              <td class="p-3 text-center text-slate-600 dark:text-slate-400">
                <span class="font-mono">{{ cls.shift }}-smena</span>
                <span class="text-slate-400 mx-1">|</span>
                <span class="font-mono">{{ cls.academicYear }}</span>
              </td>
              <td class="p-3 text-center font-bold">
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-mono"
                  :class="
                    cls.studentCount > 0
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                  "
                >
                  {{ cls.studentCount }} ta o'quvchi
                </span>
              </td>
              <td class="p-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <!-- O'quvchilarni tozalash (Purge) -->
                  <button
                    type="button"
                    :disabled="cls.studentCount === 0"
                    @click="openPurgeModal(cls)"
                    title="Sinfni saqlab barcha o'quvchilarni tozalash"
                    class="px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    :class="
                      cls.studentCount > 0
                        ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400'
                    "
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>O'quvchilarni tozalash</span>
                  </button>

                  <!-- Sinfni Butunlay O'chirish (Delete) -->
                  <button
                    type="button"
                    @click="openDeleteModal(cls)"
                    title="Sinf va barcha o'quvchilarni butunlay o'chirish"
                    class="px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Sinfni o'chirish</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 3. Tizim Loglari & Audit Bo'limi -->
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

    <!-- Xavfsiz Tasdiqlash Modali (Confirm Purge / Delete Modal) -->
    <ConfirmPurgeModal
      :is-open="isConfirmModalOpen"
      :title="confirmModalAction === 'delete' ? 'Sinfni Butunlay O\'chirish' : 'O\'quvchilar Ro\'yxatini Tozalash'"
      :description="
        confirmModalAction === 'delete'
          ? `Haqiqatan ham '${selectedClassForAction?.name}' sinfini o'chirmoqchimisiz? Ushbu sinf va unga tegishli barcha o'quvchilar, test urinishlari va natijalar bazadan kaskadli o'chiriladi.`
          : `Haqiqatan ham '${selectedClassForAction?.name}' sinfidagi barcha o'quvchilar ro'yxatini tozalamoqchimisiz? Sinf saqlanadi, lekin uning ichidagi o'quvchilar soni 0 ga tushiriladi.`
      "
      :target-name="selectedClassForAction?.name"
      :confirm-button-text="confirmModalAction === 'delete' ? 'Ha, Sinfni O\'chirish' : 'Ha, O\'quvchilarni Tozalash'"
      :danger="confirmModalAction === 'delete'"
      :is-loading="isPurgeLoading"
      @close="isConfirmModalOpen = false"
      @confirm="handleConfirmAction"
    />
  </div>
</template>
