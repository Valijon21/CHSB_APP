<script setup lang="ts">
import type { DistrictSummary } from '../../../entities/regional/model';

defineProps<{
  districts: DistrictSummary[];
  selectedDistrictId: string;
  sortBy: 'score' | 'participation' | 'quality';
  sortOrder: 'asc' | 'desc';
}>();

const emit = defineEmits<{
  (e: 'selectDistrict', districtId: string): void;
  (e: 'sort', by: 'score' | 'participation' | 'quality'): void;
}>();

function getScoreBadge(score: number) {
  if (score >= 34.5) {
    return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-bold';
  }
  if (score >= 33.0) {
    return 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800 font-semibold';
  }
  return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-medium';
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
    <!-- Header -->
    <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 class="text-sm font-bold text-slate-900 dark:text-white">
          Tuman va Shaharlar Kesimida Qiyosiy Matritsa
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Xorazm viloyatidagi barcha 13 ta hudud ko'rsatkichlari reytingi
        </p>
      </div>

      <button
        v-if="selectedDistrictId !== 'all'"
        type="button"
        @click="emit('selectDistrict', 'all')"
        class="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded text-xs font-semibold transition cursor-pointer"
      >
        Filtrni tozalash (Barcha hududlar) ✕
      </button>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-slate-600 dark:text-slate-300">
        <thead class="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th class="py-3 px-4">#</th>
            <th class="py-3 px-4">Tuman / Shahar</th>
            <th class="py-3 px-4 text-center">Maktablar</th>
            <th class="py-3 px-4 text-center">O'quvchilar</th>
            <th
              class="py-3 px-4 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
              @click="emit('sort', 'participation')"
            >
              Qamrov % {{ sortBy === 'participation' ? (sortOrder === 'desc' ? '▼' : '▲') : '' }}
            </th>
            <th
              class="py-3 px-4 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
              @click="emit('sort', 'score')"
            >
              O'rtacha Ball (40) {{ sortBy === 'score' ? (sortOrder === 'desc' ? '▼' : '▲') : '' }}
            </th>
            <th
              class="py-3 px-4 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
              @click="emit('sort', 'quality')"
            >
              Sifat % {{ sortBy === 'quality' ? (sortOrder === 'desc' ? '▼' : '▲') : '' }}
            </th>
            <th class="py-3 px-4 text-center">Anomaliya</th>
            <th class="py-3 px-4 text-right">Amal</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
          <tr
            v-for="(dist, idx) in districts"
            :key="dist.id"
            :class="[
              'hover:bg-slate-50 dark:hover:bg-slate-700/50 transition',
              selectedDistrictId === dist.id ? 'bg-teal-50/70 dark:bg-teal-950/40 font-semibold' : ''
            ]"
          >
            <td class="py-3 px-4 font-mono text-slate-400 text-center w-8">
              {{ idx + 1 }}
            </td>

            <td class="py-3 px-4 font-bold text-slate-900 dark:text-white">
              {{ dist.name }}
            </td>

            <td class="py-3 px-4 text-center font-mono">
              {{ dist.totalSchools }} ta
            </td>

            <td class="py-3 px-4 text-center font-mono">
              {{ dist.participatedStudents.toLocaleString() }} / {{ dist.totalStudents.toLocaleString() }}
            </td>

            <td class="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
              {{ dist.participationRate }}%
            </td>

            <td class="py-3 px-4 text-center">
              <span :class="['px-2.5 py-0.5 rounded-full font-mono text-xs border', getScoreBadge(dist.averageScore)]">
                {{ dist.averageScore }}
              </span>
            </td>

            <td class="py-3 px-4 text-center font-mono font-semibold text-indigo-700 dark:text-indigo-400">
              {{ dist.qualityPercentage }}%
            </td>

            <td class="py-3 px-4 text-center">
              <span
                v-if="dist.flaggedAnomaliesCount > 0"
                class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
              >
                {{ dist.flaggedAnomaliesCount }} ta
              </span>
              <span v-else class="text-emerald-600 dark:text-emerald-400 text-xs">
                ✓ Xavfsiz
              </span>
            </td>

            <td class="py-3 px-4 text-right">
              <button
                type="button"
                @click="emit('selectDistrict', dist.id)"
                class="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded transition cursor-pointer"
              >
                Tahlil →
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
