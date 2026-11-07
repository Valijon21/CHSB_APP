<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { LiveStudentSession, ProctorActionType } from '../../../../entities/proctor/model';

const props = defineProps<{
  isOpen: boolean;
  actionType: ProctorActionType | null;
  student: LiveStudentSession | null;
}>();

const emit = defineEmits<{
  (
    e: 'confirm',
    payload: { extraSeconds?: number; warningMessage?: string; reason: string }
  ): void;
  (e: 'close'): void;
}>();

const selectedMinutes = ref(5);
const warningText = ref('Iltimos, imtihon oynasidan chiqmang!');
const reasonText = ref('');

watch(
  () => props.actionType,
  (newType) => {
    if (newType === 'grant_time') {
      selectedMinutes.value = 5;
      reasonText.value = 'Texnik uzilish tufayli vaqt berildi';
    } else if (newType === 'send_warning') {
      warningText.value = 'Iltimos, imtihon oynasidan chiqmang!';
      reasonText.value = 'Qoidabuzarlik uchun ogohlantirish';
    } else if (newType === 'force_submit') {
      reasonText.value = 'Qoidabuzarlik chegarasi oshganligi sababli';
    }
  },
  { immediate: true }
);

const modalTitle = computed(() => {
  switch (props.actionType) {
    case 'grant_time':
      return "Qo'shimcha Vaqt Berish";
    case 'send_warning':
      return "Shaxsiy Ogohlantirish Yuborish";
    case 'force_submit':
      return "Imtihondan Majburiy Chetlatish";
    default:
      return "O'qituvchi Amali";
  }
});

function handleConfirm() {
  if (props.actionType === 'grant_time') {
    emit('confirm', {
      extraSeconds: selectedMinutes.value * 60,
      reason: reasonText.value || "O'qituvchi tomonidan vaqt uzaytirildi",
    });
  } else if (props.actionType === 'send_warning') {
    emit('confirm', {
      warningMessage: warningText.value,
      reason: reasonText.value || 'Ogohlantirish',
    });
  } else if (props.actionType === 'force_submit') {
    emit('confirm', {
      reason: reasonText.value || 'Majburiy yakunlash',
    });
  }
}
</script>

<template>
  <div
    v-if="isOpen && student"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in"
    role="dialog"
    aria-modal="true"
  >
    <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
        <div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white">
            {{ modalTitle }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            O'quvchi: <strong class="text-slate-800 dark:text-slate-200">{{ student.studentName }}</strong> ({{ student.className }})
          </p>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-1"
          title="Yopish"
        >
          ✕
        </button>
      </div>

      <!-- Action-specific form inputs -->
      <div class="space-y-4 text-xs">
        <!-- 1. Grant Time Fields -->
        <div v-if="actionType === 'grant_time'" class="space-y-3">
          <label class="block font-semibold text-slate-700 dark:text-slate-300">
            Qo'shimcha daqiqa miqdori:
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              v-for="min in [5, 10, 15]"
              :key="min"
              @click="selectedMinutes = min"
              :class="[
                'py-2 rounded-lg border text-xs font-bold transition cursor-pointer',
                selectedMinutes === min
                  ? 'border-teal-700 bg-teal-50 dark:bg-teal-950 text-teal-900 dark:text-teal-200 ring-2 ring-teal-700'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              ]"
            >
              +{{ min }} daqiqa
            </button>
          </div>
        </div>

        <!-- 2. Send Warning Fields -->
        <div v-if="actionType === 'send_warning'" class="space-y-3">
          <label class="block font-semibold text-slate-700 dark:text-slate-300">
            O'quvchi ekraniga chiqadigan xabar:
          </label>
          <input
            v-model="warningText"
            type="text"
            class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-teal-700 outline-none"
            placeholder="Ogohlantirish matni..."
          />
        </div>

        <!-- 3. Force Submit Danger Alert -->
        <div v-if="actionType === 'force_submit'" class="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200">
          <p class="font-bold">Diqqat!</p>
          <p class="mt-0.5 text-[11px] leading-relaxed">
            Ushbu amal o'quvchining imtihonini darhol to'xtatadi va mavjud javoblarini majburiy tarzda topshirilgan deb belgilaydi.
          </p>
        </div>

        <!-- Common Reason Field -->
        <div class="space-y-1.5 pt-2">
          <label class="block font-medium text-slate-600 dark:text-slate-400">
            Amal asosi / Sababi:
          </label>
          <input
            v-model="reasonText"
            type="text"
            class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-teal-700 outline-none"
            placeholder="Sababni kiriting..."
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
        >
          Bekor qilish
        </button>

        <button
          type="button"
          @click="handleConfirm"
          :class="[
            'px-4 py-2 rounded-lg text-xs font-bold text-white transition cursor-pointer shadow-xs',
            actionType === 'force_submit'
              ? 'bg-rose-700 hover:bg-rose-800'
              : 'bg-teal-800 hover:bg-teal-900'
          ]"
        >
          Tasdiqlash
        </button>
      </div>
    </div>
  </div>
</template>
