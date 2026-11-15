<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SubjectRecord } from '../../../entities/organization/model';

const props = defineProps<{
  subjects: SubjectRecord[];
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete', id: string): void;
}>();

const searchQuery = ref('');
const subjectToDelete = ref<SubjectRecord | null>(null);

const filteredSubjects = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return props.subjects;
  return props.subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q))
  );
});

function confirmDelete(subject: SubjectRecord) {
  subjectToDelete.value = subject;
}

function handleExecuteDelete() {
  if (subjectToDelete.value) {
    emit('delete', subjectToDelete.value.id);
    subjectToDelete.value = null;
  }
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden transition-colors">
    <!-- Table Toolbar -->
    <div class="p-4 border-b border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-bold text-slate-900 dark:text-white">Fanlar Ro'yxati</span>
        <span class="text-xs px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800">
          {{ subjects.length }} ta fan
        </span>
      </div>

      <!-- Search Input -->
      <div class="relative w-full sm:w-64">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Fan nomi yoki kodi bo'yicha qidirish..."
          class="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
        />
        <svg
          class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
      <div class="inline-block animate-spin w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full mb-2"></div>
      <div>Fanlar yuklanmoqda...</div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredSubjects.length === 0" class="p-10 text-center text-xs text-slate-500 dark:text-slate-400">
      <span class="text-3xl block mb-2">📖</span>
      <p class="font-medium">Hech qanday fan topilmadi</p>
      <p class="text-[11px] text-slate-400 mt-0.5">Qidiruv so'zini o'zgartiring yoki yangi fan qo'shing.</p>
    </div>

    <!-- Subjects Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
        <thead class="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-700/60">
          <tr>
            <th class="px-5 py-3">Fan Nomi</th>
            <th class="px-4 py-3">Kod</th>
            <th class="px-4 py-3">Sinflar</th>
            <th class="px-4 py-3">Tavsif</th>
            <th class="px-4 py-3">Holati</th>
            <th class="px-5 py-3 text-right">Amallar</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
          <tr
            v-for="sub in filteredSubjects"
            :key="sub.id"
            class="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition group"
          >
            <!-- Name -->
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2.5">
                <span class="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-200/60 dark:border-teal-800/60">
                  {{ sub.name.charAt(0) }}
                </span>
                <span class="font-bold text-slate-900 dark:text-white">
                  {{ sub.name }}
                </span>
              </div>
            </td>

            <!-- Code -->
            <td class="px-4 py-3.5">
              <span class="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                {{ sub.code }}
              </span>
            </td>

            <!-- Grade Levels -->
            <td class="px-4 py-3.5">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="g in sub.gradeLevels.split(',')"
                  :key="g"
                  class="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/60"
                >
                  {{ g }}
                </span>
              </div>
            </td>

            <!-- Description -->
            <td class="px-4 py-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate">
              {{ sub.description || '—' }}
            </td>

            <!-- Status -->
            <td class="px-4 py-3.5">
              <span
                class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                :class="
                  sub.isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                "
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="sub.isActive ? 'bg-emerald-500' : 'bg-slate-400'"></span>
                <span>{{ sub.isActive ? 'Faol' : 'Nofaol' }}</span>
              </span>
            </td>

            <!-- Actions -->
            <td class="px-5 py-3.5 text-right">
              <button
                type="button"
                @click="confirmDelete(sub)"
                title="Fanni o'chirish"
                class="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer opacity-80 group-hover:opacity-100"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="subjectToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="alertdialog"
      aria-modal="true"
    >
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full space-y-3 text-slate-800 dark:text-slate-100">
        <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>🗑️</span>
          <span>Fanni o'chirishni tasdiqlang</span>
        </h4>
        <p class="text-xs text-slate-600 dark:text-slate-300">
          Haqiqatan ham <strong class="text-rose-600 dark:text-rose-400">"{{ subjectToDelete.name }}"</strong> fanini o'chirmoqchimisiz?
        </p>
        <div class="pt-2 flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            @click="subjectToDelete = null"
            class="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            @click="handleExecuteDelete"
            class="px-3 py-1.5 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition cursor-pointer"
          >
            Ha, o'chirilsin
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
