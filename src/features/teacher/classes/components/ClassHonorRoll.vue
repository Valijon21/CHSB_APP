<script setup lang="ts">
export interface TopPerformer {
  rank: 1 | 2 | 3;
  studentId: string;
  name: string;
  rosterCode: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: '5';
}

export interface NeedsSupportStudent {
  studentId: string;
  name: string;
  rosterCode: string;
  score?: number;
  percentage?: number;
  reason: string;
}

defineProps<{
  topPerformers: TopPerformer[];
  needsSupportList: NeedsSupportStudent[];
  tenantSlug: string;
}>();
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- Top 3 Honor Roll Podium -->
    <div
      role="region"
      aria-label="Sinf a'lochilari shohsupasi"
      class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-3.5 transition-colors"
    >
      <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <span>🏆</span>
          <span>Sinf Shohsupasi (Top-3 A'lochi)</span>
        </h3>
        <span class="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
          CHSB Liderlari
        </span>
      </div>

      <div v-if="topPerformers.length === 0" class="text-center py-6 text-xs text-slate-400">
        Hozircha natijalar mavjud emas.
      </div>

      <div v-else class="space-y-2.5">
        <div
          v-for="performer in topPerformers"
          :key="performer.studentId"
          :class="[
            'p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors',
            performer.rank === 1
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80'
              : performer.rank === 2
                ? 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-700'
                : 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/60'
          ]"
        >
          <div class="flex items-center gap-3">
            <span
              class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shadow-2xs"
              :class="[
                performer.rank === 1
                  ? 'bg-amber-400 text-amber-950'
                  : performer.rank === 2
                    ? 'bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100'
                    : 'bg-amber-600 text-white'
              ]"
            >
              {{ performer.rank === 1 ? '🥇' : performer.rank === 2 ? '🥈' : '🥉' }}
            </span>
            <div>
              <p class="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                {{ performer.name }}
              </p>
              <p class="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {{ performer.rosterCode }}
              </p>
            </div>
          </div>

          <div class="text-right">
            <span class="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono block">
              {{ performer.score }} / {{ performer.maxScore }}
            </span>
            <span class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {{ performer.percentage }}% (A'lo)
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Pedagogical Attention & Support -->
    <div
      role="region"
      aria-label="Pedagogik e'tibor va yordam guruhi"
      class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-3.5 transition-colors"
    >
      <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <span>🎯</span>
          <span>Pedagogik E'tibor Guruhi</span>
        </h3>
        <span class="text-[10px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
          Qo'llab-quvvatlash
        </span>
      </div>

      <div v-if="needsSupportList.length === 0" class="text-center py-6 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
        🎉 Barcha o'quvchilar sinovni yuqori darajada topshirdi! Qo'shimcha aralashuv talab etilmaydi.
      </div>

      <div v-else class="space-y-2.5">
        <div
          v-for="item in needsSupportList"
          :key="item.studentId"
          class="p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between gap-3 text-xs"
        >
          <div>
            <p class="font-bold text-slate-800 dark:text-slate-200">
              {{ item.name }}
            </p>
            <p class="text-[11px] text-rose-700 dark:text-rose-400">
              {{ item.reason }}
            </p>
          </div>
          <div class="text-right flex-shrink-0">
            <span
              v-if="item.score !== undefined"
              class="font-mono font-bold text-rose-700 dark:text-rose-400 block"
            >
              {{ item.score }} ball
            </span>
            <router-link
              :to="`/t/${tenantSlug}/teacher/students/${item.studentId}`"
              class="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline"
            >
              Profil →
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
