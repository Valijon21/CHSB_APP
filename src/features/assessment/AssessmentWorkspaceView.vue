<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';

const currentQuestionIndex = ref(0);
const totalQuestions = 15;
const selectedAnswers = ref<Record<number, string>>({});

function selectOption(option: string) {
  selectedAnswers.value[currentQuestionIndex.value] = option;
}

function nextQuestion() {
  if (currentQuestionIndex.value < totalQuestions - 1) {
    currentQuestionIndex.value++;
  }
}

function prevQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
  }
}

function submitAttempt() {
  // Navigate to receipt
  router.push(`/t/${tenantSlug}/attempts/demo-attempt-001/receipt`);
}
</script>

<template>
  <div class="space-y-4">
    <!-- Top Progress and Timer Bar -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Javob berildi:</span>
        <span class="px-2.5 py-1 rounded-md bg-teal-50 text-teal-900 font-bold text-sm border border-teal-200">
          {{ Object.keys(selectedAnswers).length }} / {{ totalQuestions }}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-500 font-medium">Qolgan vaqt:</span>
        <div class="px-3 py-1 rounded-md bg-slate-900 text-white font-mono font-bold text-sm tracking-wider">
          39:50
        </div>
        <span class="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">Demo</span>
      </div>
    </div>

    <!-- Main Question Box + Navigator Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <!-- Question Content (Col 1-3) -->
      <div class="lg:col-span-3 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[420px]">
        <div>
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <span class="font-bold text-teal-800 text-base">
              {{ currentQuestionIndex + 1 }}-savol
            </span>
            <span class="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
              (B) 2.5 ball
            </span>
          </div>

          <!-- Question prompt -->
          <div class="text-base text-slate-800 leading-relaxed mb-6 font-medium">
            Tasavvur qiling: radioeshittirishda musiqa qo'yildi. Musiqaning tinglovchiga yoqimli eshitilishi qaysi effekt(lar)ga bog'liq?
          </div>

          <!-- Options -->
          <div class="space-y-3">
            <button
              v-for="opt in ['Fade in, Cut', 'Fade in, Fade out', 'Fade out, Trim', 'Trim, Cut']"
              :key="opt"
              @click="selectOption(opt)"
              :class="[
                'w-full text-left p-3.5 rounded-lg border text-sm transition flex items-center gap-3 cursor-pointer',
                selectedAnswers[currentQuestionIndex] === opt
                  ? 'border-teal-700 bg-teal-50/70 text-teal-950 font-semibold ring-2 ring-teal-700'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              ]"
            >
              <span
                :class="[
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  selectedAnswers[currentQuestionIndex] === opt
                    ? 'bg-teal-800 text-white'
                    : 'bg-slate-100 text-slate-600'
                ]"
              >
                {{ ['A', 'B', 'C', 'D'][['Fade in, Cut', 'Fade in, Fade out', 'Fade out, Trim', 'Trim, Cut'].indexOf(opt)] }}
              </span>
              <span>{{ opt }}</span>
            </button>
          </div>
        </div>

        <!-- Pagination buttons -->
        <div class="pt-6 border-t border-slate-100 flex items-center justify-between mt-8">
          <button
            @click="prevQuestion"
            :disabled="currentQuestionIndex === 0"
            class="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Oldingi savol
          </button>

          <button
            v-if="currentQuestionIndex < totalQuestions - 1"
            @click="nextQuestion"
            class="px-4 py-2 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-sm font-medium transition cursor-pointer"
          >
            Keyingi savol
          </button>
          <button
            v-else
            @click="submitAttempt"
            class="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition cursor-pointer shadow-xs"
          >
            Testni yakunlash va topshirish
          </button>
        </div>
      </div>

      <!-- Question Grid Navigator (Col 4) -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Savollar navigatsiyasi
        </h3>
        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="i in totalQuestions"
            :key="i"
            @click="currentQuestionIndex = i - 1"
            :class="[
              'h-9 rounded-md text-xs font-bold transition flex items-center justify-center cursor-pointer border',
              currentQuestionIndex === i - 1
                ? 'border-teal-700 ring-2 ring-teal-700 text-teal-900 bg-teal-50'
                : selectedAnswers[i - 1]
                  ? 'bg-teal-800 text-white border-teal-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            ]"
          >
            {{ i }}
          </button>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded bg-teal-800"></span>
            <span>Javob berilgan</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded bg-slate-50 border border-slate-200"></span>
            <span>Javob berilmagan</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded bg-teal-50 border-2 border-teal-700"></span>
            <span>Hozirgi savol</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
