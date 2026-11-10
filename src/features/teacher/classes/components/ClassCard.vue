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
  <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition flex flex-col justify-between">
    <div>
      <!-- Card Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-sm">
            🏫
          </span>
          <span class="text-base font-bold text-slate-900">{{ classItem.name }}</span>
        </div>

        <div class="flex items-center gap-1.5">
          <span class="px-2.5 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            {{ gradeDisplay }}-sinf
          </span>
          <span
            v-if="classItem.shift"
            class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700"
          >
            {{ classItem.shift }}-smena
          </span>
        </div>
      </div>

      <!-- Card Metadata -->
      <div class="mt-4 space-y-2 text-xs text-slate-600">
        <div class="flex justify-between">
          <span class="text-slate-500">O'quvchilar soni:</span>
          <span class="font-bold text-slate-900 font-mono">{{ classItem.studentCount }} nafar</span>
        </div>

        <div v-if="classItem.headTeacherName" class="flex justify-between">
          <span class="text-slate-500">Sinf rahbari:</span>
          <span class="font-medium text-indigo-900 truncate max-w-[160px]">{{ classItem.headTeacherName }}</span>
        </div>

        <div class="flex justify-between">
          <span class="text-slate-500">O'quv yili:</span>
          <span class="font-medium text-slate-700">{{ classItem.academicYear || '2026-2027' }}</span>
        </div>
      </div>
    </div>

    <!-- Card Action Footer -->
    <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
      <span class="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Faol guruh
      </span>
      <router-link
        :to="`/t/${tenantSlug}/teacher/classes/${classItem.id}`"
        class="px-3.5 py-2 min-h-[38px] inline-flex items-center bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
      >
        Sinfni ko'rish →
      </router-link>
    </div>
  </div>
</template>

