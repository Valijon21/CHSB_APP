<script setup lang="ts">
import type {
  StudentMatchPair,
  AssessmentCandidate,
  MatchStatus,
  AbsenceReason,
} from '../../../entities/emaktab/model';

defineProps<{
  pairs: StudentMatchPair[];
  allCandidates: AssessmentCandidate[];
  activeFilter: 'all' | MatchStatus;
}>();

const emit = defineEmits<{
  (e: 'change-filter', filter: 'all' | MatchStatus): void;
  (e: 'manual-match', payload: { emaktabId: string; candidateId: string | null }): void;
  (e: 'set-absence', payload: { matchId: string; reason: AbsenceReason }): void;
}>();

function getStatusBadge(status: MatchStatus) {
  switch (status) {
    case 'exact':
      return {
        text: '100% Aniq Mos',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      };
    case 'fuzzy':
      return {
        text: "O'xshash Moslik",
        bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      };
    case 'unmatched_emaktab':
      return {
        text: 'Topshirmagan / Yo‘q',
        bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
      };
    case 'unmatched_chsb':
      return {
        text: 'eMaktabda topilmadi',
        bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
      };
    default:
      return {
        text: 'Noma\'lum',
        bg: 'bg-slate-50 text-slate-700 border-slate-200',
      };
  }
}

function getGradeBadge(grade: number | null) {
  if (grade === 5) return 'bg-emerald-600 text-white';
  if (grade === 4) return 'bg-teal-600 text-white';
  if (grade === 3) return 'bg-amber-500 text-white';
  if (grade === 2) return 'bg-rose-500 text-white';
  return 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400';
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
    <!-- Filter Pills Bar -->
    <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg border transition-all cursor-pointer',
            activeFilter === 'all'
              ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
              : 'bg-slate-50 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100',
          ]"
          @click="emit('change-filter', 'all')"
        >
          Barchasi ({{ pairs.length }})
        </button>

        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg border transition-all cursor-pointer',
            activeFilter === 'exact'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
              : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50',
          ]"
          @click="emit('change-filter', 'exact')"
        >
          100% Aniq Mos
        </button>

        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg border transition-all cursor-pointer',
            activeFilter === 'fuzzy'
              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
              : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100/50',
          ]"
          @click="emit('change-filter', 'fuzzy')"
        >
          O'xshash Moslik
        </button>

        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg border transition-all cursor-pointer',
            activeFilter === 'unmatched_emaktab'
              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
              : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-100/50',
          ]"
          @click="emit('change-filter', 'unmatched_emaktab')"
        >
          Topshirmaganlar
        </button>

        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg border transition-all cursor-pointer',
            activeFilter === 'unmatched_chsb'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
              : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100/50',
          ]"
          @click="emit('change-filter', 'unmatched_chsb')"
        >
          eMaktabda yo'qlar
        </button>
      </div>

      <span class="text-xs text-slate-500 dark:text-slate-400">
        Ko'rsatilmoqda: <strong class="text-slate-900 dark:text-white">{{ pairs.length }}</strong> ta yozuv
      </span>
    </div>

    <!-- Jadval -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
        <thead class="bg-slate-50 dark:bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th class="py-3 px-3 w-12 text-center">T/r</th>
            <th class="py-3 px-3">eMaktab O'quvchisi</th>
            <th class="py-3 px-3 text-center">Moslik Holati</th>
            <th class="py-3 px-3">CHSB Nomzodi</th>
            <th class="py-3 px-3 text-center">Ball / Foiz</th>
            <th class="py-3 px-3 text-center">eMaktab Bahosi</th>
            <th class="py-3 px-3 text-center">Qatnashmaganlik</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60 font-sans">
          <tr
            v-for="pair in pairs"
            :key="pair.matchId"
            class="hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition-colors"
          >
            <!-- 1. Tartib raqami -->
            <td class="py-3 px-3 text-center font-mono text-slate-400 font-medium">
              {{ pair.emaktabStudent?.orderIndex ?? '-' }}
            </td>

            <!-- 2. eMaktab O'quvchisi -->
            <td class="py-3 px-3">
              <div v-if="pair.emaktabStudent" class="space-y-0.5">
                <span class="font-bold text-slate-900 dark:text-white block">
                  {{ pair.emaktabStudent.fullName }}
                </span>
                <span class="text-[10px] font-mono text-slate-400">
                  ID: {{ pair.emaktabStudent.emaktabId }}
                </span>
              </div>
              <span v-else class="text-slate-400 italic text-[11px]">
                eMaktabda ro'yxatdan o'tmagan
              </span>
            </td>

            <!-- 3. Moslik holati & Koeffitsient -->
            <td class="py-3 px-3 text-center">
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border',
                  getStatusBadge(pair.status).bg,
                ]"
              >
                {{ getStatusBadge(pair.status).text }}
                <span v-if="pair.confidenceScore > 0" class="font-mono">
                  ({{ Math.round(pair.confidenceScore * 100) }}%)
                </span>
              </span>
            </td>

            <!-- 4. CHSB Nomzodi (Qo'lda almashtirish selektori) -->
            <td class="py-3 px-3">
              <div v-if="pair.emaktabStudent" class="flex items-center gap-2">
                <select
                  :value="pair.chsbCandidate?.candidateId ?? ''"
                  @change="(e) => {
                    const val = (e.target as HTMLSelectElement).value;
                    emit('manual-match', {
                      emaktabId: pair.emaktabStudent!.emaktabId,
                      candidateId: val ? val : null,
                    });
                  }"
                  class="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-teal-500 max-w-xs"
                >
                  <option value="">-- Qatnashmagan (Topilmadi) --</option>
                  <option
                    v-for="cand in allCandidates"
                    :key="cand.candidateId"
                    :value="cand.candidateId"
                  >
                    {{ cand.fullName }} ({{ cand.percentage }}%)
                  </option>
                </select>
                <span
                  v-if="pair.manualOverride"
                  class="text-[9px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800"
                  title="O'qituvchi tomonidan qo'lda belgilangan"
                >
                  Qo'lda
                </span>
              </div>
              <div v-else-if="pair.chsbCandidate">
                <span class="font-bold text-indigo-700 dark:text-indigo-400">
                  {{ pair.chsbCandidate.fullName }}
                </span>
              </div>
            </td>

            <!-- 5. Ball / Foiz -->
            <td class="py-3 px-3 text-center font-mono">
              <div v-if="pair.chsbCandidate && pair.chsbCandidate.status === 'submitted'">
                <span class="font-bold text-slate-900 dark:text-white">
                  {{ pair.chsbCandidate.percentage }}%
                </span>
                <span class="block text-[10px] text-slate-400">
                  {{ pair.chsbCandidate.score }}/{{ pair.chsbCandidate.maxScore }}
                </span>
              </div>
              <span v-else class="text-slate-300 dark:text-slate-600">-</span>
            </td>

            <!-- 6. eMaktab Bahosi (5, 4, 3, 2) -->
            <td class="py-3 px-3 text-center">
              <span
                v-if="pair.finalGrade5 !== null"
                :class="[
                  'inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-sm shadow-2xs font-mono',
                  getGradeBadge(pair.finalGrade5),
                ]"
              >
                {{ pair.finalGrade5 }}
              </span>
              <span v-else class="text-xs text-slate-400 font-medium italic">
                Bahosiz
              </span>
            </td>

            <!-- 7. Qatnashmaganlik sababi -->
            <td class="py-3 px-3 text-center">
              <div v-if="pair.finalGrade5 === null && pair.emaktabStudent">
                <select
                  :value="pair.absenceReason ?? 'sababsiz'"
                  @change="(e) => {
                    const reason = (e.target as HTMLSelectElement).value as AbsenceReason;
                    emit('set-absence', { matchId: pair.matchId, reason });
                  }"
                  class="text-[11px] p-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  <option value="sababli">Sababli</option>
                  <option value="sababsiz">Sababsiz</option>
                </select>
              </div>
              <span v-else class="text-slate-300 dark:text-slate-600">-</span>
            </td>
          </tr>

          <!-- Bo'sh holat -->
          <tr v-if="pairs.length === 0">
            <td colspan="7" class="py-8 text-center text-slate-400">
              Hech qanday o'quvchi ma'lumoti topilmadi. Yuqoridan ro'yxatni yuklang.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

