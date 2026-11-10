<script setup lang="ts">
import type { SchoolRecord } from '../../../entities/organization/model';

defineProps<{
  school: SchoolRecord;
}>();

function getTypeLabel(type: string) {
  switch (type) {
    case 'specialized':
      return { text: 'Ixtisoslashtirilgan', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200' };
    case 'lyceum':
      return { text: 'Akademik Litsey', color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200' };
    case 'private':
      return { text: 'Xususiy', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200' };
    default:
      return { text: 'Umumta\'lim', color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200' };
  }
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
    <!-- Yuqori qism: Nom va Badgelar -->
    <div class="space-y-2">
      <div class="flex items-start justify-between gap-2">
        <span class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
          {{ school.code }}
        </span>

        <span
          :class="[
            'text-[10px] font-bold px-2 py-0.5 rounded-full border',
            getTypeLabel(school.type).color,
          ]"
        >
          {{ getTypeLabel(school.type).text }}
        </span>
      </div>

      <h3 class="text-base font-bold text-slate-900 dark:text-white leading-snug">
        {{ school.name }}
      </h3>

      <div class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{{ school.districtName }}</span>
      </div>
    </div>

    <!-- O'rtacha ma'lumotlar -->
    <div class="py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
      <div>
        <span class="text-[10px] text-slate-400 block font-medium">O'quvchilar:</span>
        <span class="font-black text-slate-800 dark:text-slate-200 font-mono text-sm">
          {{ school.studentCount }}
        </span>
      </div>

      <div>
        <span class="text-[10px] text-slate-400 block font-medium">O'qituvchilar:</span>
        <span class="font-black text-slate-800 dark:text-slate-200 font-mono text-sm">
          {{ school.teacherCount }}
        </span>
      </div>
    </div>

    <!-- Rahbariyat -->
    <div class="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 border-t border-slate-100 dark:border-slate-700 pt-2.5">
      <div>Direktor: <strong class="text-slate-800 dark:text-slate-200 font-medium">{{ school.directorName }}</strong></div>
      <div>Aloqa: <span class="font-mono">{{ school.contactPhone }}</span></div>
    </div>

    <!-- Amallar: Maktabga Kirish va Admin -->
    <div class="flex items-center gap-2 pt-2">
      <router-link
        :to="`/t/${school.slug}/teacher/assessments`"
        class="flex-1 py-2 px-3 text-center bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
      >
        Maktabga Kirish →
      </router-link>

      <router-link
        :to="`/t/${school.slug}/tenant-admin`"
        class="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-xl transition-colors"
        title="Maktab ma'muri sozlamalari"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </router-link>
    </div>
  </div>
</template>

