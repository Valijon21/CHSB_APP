<script setup lang="ts">
import type { ClassGroupRecord } from '../../../../entities/organization/model';
import type { ClassGroup } from '../../../../entities/class-group/model';

// Can accept either ClassGroupRecord or ClassGroup
type DisplayClass = (ClassGroupRecord | ClassGroup) & {
  shift?: 1 | 2;
  headTeacherName?: string;
  gradeLevel?: number;
};

const props = defineProps<{
  classItem: DisplayClass;
  tenantSlug: string;
}>();

const gradeDisplay = props.classItem.gradeLevel ?? (props.classItem as ClassGroup).grade ?? 9;
</script>

<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between p-5">
    <div>
      <!-- Card Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/80">
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-800 dark:text-teal-300 font-bold text-sm">
            🏫
          </span>
          <span class="text-base font-bold text-slate-900 dark:text-white">{{ classItem.name }}</span>
        </div>

        <div class="flex items-center gap-1.5">
          <span class="px-2.5 py-0.5 rounded text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            {{ gradeDisplay }}-sinf
          </span>
          <span
            v-if="classItem.shift"
            class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
          >
            {{ classItem.shift }}-smena
          </span>
        </div>
      </div>

      <!-- Card Metadata -->
      <div class="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
        <div class="flex justify-between">
          <span class="text-slate-500 dark:text-slate-400">O'quvchilar soni:</span>
          <span class="font-bold text-slate-900 dark:text-white font-mono">{{ classItem.studentCount }} nafar</span>
        </div>

        <div v-if="classItem.headTeacherName || (classItem as any).teacherName" class="flex justify-between">
          <span class="text-slate-500 dark:text-slate-400">Sinf rahbari:</span>
          <span class="font-medium text-indigo-700 dark:text-indigo-400 truncate max-w-[160px]">{{ classItem.headTeacherName || (classItem as any).teacherName }}</span>
        </div>

        <div class="flex justify-between">
          <span class="text-slate-500 dark:text-slate-400">O'quv yili:</span>
          <span class="font-medium text-slate-700 dark:text-slate-300">{{ classItem.academicYear || '2026-2027' }}</span>
        </div>
      </div>
    </div>

    <!-- Card Action Footer -->
    <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
      <span class="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Faol guruh
      </span>
      <router-link
        :to="`/t/${tenantSlug}/teacher/classes/${classItem.id}`"
        :aria-label="`${classItem.name} sinfini ko'rish`"
        class="px-3.5 py-2 min-h-[40px] inline-flex items-center bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
      >
        Sinfni ko'rish →
      </router-link>
    </div>
  </div>
</template>

