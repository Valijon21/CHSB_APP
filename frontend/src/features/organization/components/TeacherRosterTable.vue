<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TeacherRecord } from '../../../entities/organization/model';

const props = defineProps<{
  teachers: TeacherRecord[];
}>();

const emit = defineEmits<{
  (e: 'delete', id: string): void;
}>();

const searchQuery = ref('');

const filteredTeachers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return props.teachers;
  return props.teachers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.phone.toLowerCase().includes(q)
  );
});

function getQualBadge(qual: string) {
  switch (qual) {
    case 'oliy':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200';
    case 'birinchi':
      return 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200';
    case 'ikkinchi':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200';
  }
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden space-y-3">
    <!-- Yuqori qidiruv paneli -->
    <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="relative w-full sm:w-72">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="O'qituvchi yoki fani bo'yicha qidiruv..."
          class="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
        />
        <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <span class="text-xs text-slate-500 dark:text-slate-400">
        Jami: <strong class="text-slate-900 dark:text-white">{{ filteredTeachers.length }}</strong> nafar pedagog
      </span>
    </div>

    <!-- Jadval -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
        <thead class="bg-slate-50 dark:bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th class="py-3 px-3 w-12 text-center">№</th>
            <th class="py-3 px-3">O'qituvchi F.I.SH.</th>
            <th class="py-3 px-3">Mutaxassislik Fani</th>
            <th class="py-3 px-3 text-center">Toifasi</th>
            <th class="py-3 px-3">Biriktirilgan Sinflar</th>
            <th class="py-3 px-3">Telefon Raqami</th>
            <th class="py-3 px-3 text-center">Holati</th>
            <th class="py-3 px-3 text-right">Amal</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60 font-sans">
          <tr
            v-for="(teacher, idx) in filteredTeachers"
            :key="teacher.id"
            class="hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition-colors"
          >
            <td class="py-3 px-3 text-center font-mono text-slate-400">{{ idx + 1 }}</td>
            <td class="py-3 px-3 font-bold text-slate-900 dark:text-white">
              {{ teacher.fullName }}
            </td>
            <td class="py-3 px-3 text-teal-700 dark:text-teal-400 font-medium">
              {{ teacher.subject }}
            </td>
            <td class="py-3 px-3 text-center">
              <span
                :class="[
                  'px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize',
                  getQualBadge(teacher.qualification),
                ]"
              >
                {{ teacher.qualification }} toifa
              </span>
            </td>
            <td class="py-3 px-3">
              <div v-if="teacher.assignedClassNames.length > 0" class="flex flex-wrap gap-1">
                <span
                  v-for="cls in teacher.assignedClassNames"
                  :key="cls"
                  class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold font-mono"
                >
                  {{ cls }}
                </span>
              </div>
              <span v-else class="text-slate-400 italic text-[11px]">Biriktirilmagan</span>
            </td>
            <td class="py-3 px-3 font-mono text-[11px]">{{ teacher.phone }}</td>
            <td class="py-3 px-3 text-center">
              <span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Faol
              </span>
            </td>
            <td class="py-3 px-3 text-right">
              <button
                type="button"
                @click="emit('delete', teacher.id)"
                class="px-2.5 py-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-semibold transition cursor-pointer"
                title="O'chirish"
              >
                O'chirish
              </button>
            </td>
          </tr>

          <tr v-if="filteredTeachers.length === 0">
            <td colspan="8" class="py-8 text-center text-slate-400">
              Hech qanday o'qituvchi topilmadi.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

