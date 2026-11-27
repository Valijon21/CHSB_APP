<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';
import ChangePasswordForm from '../../auth/components/ChangePasswordForm.vue';
import {
  saveStoredGeminiApiKey,
  getCustomApiKey,
  hasCustomApiKey,
} from '../../../shared/utils/groundedAiExtractor';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';

const notifyOnSubmit = ref(true);
const notifyLowAttendance = ref(true);
const defaultLanguage = ref('uz');
const rowsPerPage = ref('25');
const savedMessage = ref(false);

const customApiKeyInput = ref(getCustomApiKey());
const isCustomKeyActive = ref(hasCustomApiKey());

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  await teacherStore.loadTeacherData(tenantId);
});

function clearCustomKey() {
  customApiKeyInput.value = '';
  saveStoredGeminiApiKey('');
  isCustomKeyActive.value = false;
  savedMessage.value = true;
  setTimeout(() => {
    savedMessage.value = false;
  }, 2500);
}

function handleSave() {
  if (customApiKeyInput.value.trim()) {
    saveStoredGeminiApiKey(customApiKeyInput.value.trim());
    isCustomKeyActive.value = true;
  } else {
    saveStoredGeminiApiKey('');
    isCustomKeyActive.value = false;
  }
  savedMessage.value = true;
  setTimeout(() => {
    savedMessage.value = false;
  }, 2500);
}
</script>

<template>
  <div class="space-y-6 max-w-4xl font-sans">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          O'qituvchi Profili va Sozlamalari
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Pedagogik rekvizitlar, biriktirilgan ta'lim muassasasi va bildirishnoma parametrlari.
        </p>
      </div>

      <div v-if="savedMessage" class="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
        <span>✓</span> Sozlamalar saqlandi
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Profil yuklanmoqda...</p>
    </div>

    <div v-else-if="teacherStore.profile" class="space-y-6">
      <!-- Profile Card -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-6 transition-colors">
        <div class="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-700/80">
          <div class="w-16 h-16 rounded-2xl bg-teal-700 dark:bg-teal-600 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
            DU
          </div>
          <div>
            <h2 class="text-xl font-bold text-slate-900 dark:text-white">{{ teacherStore.profile.fullName }}</h2>
            <p class="text-xs text-teal-700 dark:text-teal-400 font-bold mt-0.5">{{ teacherStore.profile.title }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Muassasa: {{ teacherStore.profile.assignedSchoolName }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700">
            <span class="text-slate-500 dark:text-slate-400 block font-medium">Elektron pochta:</span>
            <span class="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono">{{ teacherStore.profile.email }}</span>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700">
            <span class="text-slate-500 dark:text-slate-400 block font-medium">Telefon raqam:</span>
            <span class="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono">{{ teacherStore.profile.phone }}</span>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700">
            <span class="text-slate-500 dark:text-slate-400 block font-medium mb-1">Biriktirilgan fanlar:</span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="sub in teacherStore.profile.subjects"
                :key="sub"
                class="px-2.5 py-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px]"
              >
                {{ sub }}
              </span>
            </div>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700">
            <span class="text-slate-500 dark:text-slate-400 block font-medium mb-1">Biriktirilgan sinflar:</span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="cls in teacherStore.classes"
                :key="cls.id"
                class="px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold text-[11px]"
              >
                {{ cls.name }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sun'iy Intellekt (AI) Sozlamalari -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4 transition-colors">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/80 flex-wrap gap-2">
          <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <span>🤖</span>
            <span>Sun'iy Intellekt (AI) Sozlamalari</span>
          </h3>
          <span
            :class="[
              'px-2.5 py-0.5 rounded-md text-[10px] font-bold',
              isCustomKeyActive
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                : 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
            ]"
          >
            {{ isCustomKeyActive ? "✓ Shaxsiy API kalit faol" : "Standart loyiha kaliti faol" }}
          </span>
        </div>

        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          PDF fayllardan topshiriqlarni avtomatik ajratib olish uchun shaxsiy Google Gemini API kalitingizni kiritishingiz mumkin. Agar bo'sh qoldirsangiz, loyihaning o'zida o'rnatilgan standart kalitdan foydalaniladi.
        </p>

        <div class="space-y-2">
          <label for="ai-custom-api-key" class="block font-bold text-slate-700 dark:text-slate-300 text-xs">
            Shaxsiy Gemini API Kaliti (Ixtiyoriy):
          </label>
          <div class="flex gap-2 flex-wrap sm:flex-nowrap">
            <input
              id="ai-custom-api-key"
              v-model="customApiKeyInput"
              type="password"
              placeholder="AQ.Ab8... yoki AIzaSy... (bo'sh qoldirilsa standart kalit ishlaydi)"
              class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-700"
            />
            <button
              v-if="isCustomKeyActive"
              type="button"
              @click="clearCustomKey"
              class="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
            >
              Standartga qaytarish
            </button>
          </div>
          <p class="text-[11px] text-slate-400 dark:text-slate-500">
            🔒 Kalit faqat sizning brauzeringizda xavfsiz saqlanadi va begonalarga ko'rinmaydi.
          </p>
        </div>
      </div>

      <!-- Settings & Preferences -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-5 transition-colors">
        <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-700/80">
          Kabinet Sozlamalari
        </h3>

        <div class="space-y-4 text-xs">
          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700">
            <div>
              <span class="font-bold text-slate-800 dark:text-slate-200 block">O'quvchi test topshirganda xabarnoma</span>
              <span class="text-slate-500 dark:text-slate-400 text-[11px]">Har bir o'quvchi imtihonni topshirishi bilanoq yangilanish ko'rinadi.</span>
            </div>
            <input
              v-model="notifyOnSubmit"
              type="checkbox"
              aria-label="O'quvchi test topshirganda xabarnoma olish"
              class="w-4 h-4 text-teal-700 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 focus:ring-teal-700 cursor-pointer"
            />
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700">
            <div>
              <span class="font-bold text-slate-800 dark:text-slate-200 block">Past ishtirok ogohlantirishi</span>
              <span class="text-slate-500 dark:text-slate-400 text-[11px]">Sinfda ishtirok 80% dan kam bo'lsa panelda ogohlantirish ko'rsatiladi.</span>
            </div>
            <input
              v-model="notifyLowAttendance"
              type="checkbox"
              aria-label="Past ishtirok ogohlantirishi olish"
              class="w-4 h-4 text-teal-700 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 focus:ring-teal-700 cursor-pointer"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label for="profile-default-lang" class="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tizim Tili:
              </label>
              <select
                id="profile-default-lang"
                v-model="defaultLanguage"
                aria-label="Tizim tili tanlash"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-700"
              >
                <option value="uz">O'zbek tili (Lotin)</option>
                <option value="ru">Русский язык</option>
              </select>
            </div>

            <div>
              <label for="profile-rows-per-page" class="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Jadvallardagi qatorlar soni:
              </label>
              <select
                id="profile-rows-per-page"
                v-model="rowsPerPage"
                aria-label="Jadvallardagi qatorlar soni tanlash"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-700"
              >
                <option value="15">15 ta qator</option>
                <option value="25">25 ta qator</option>
                <option value="50">50 ta qator</option>
              </select>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 dark:border-slate-700/80 flex justify-end">
          <button
            @click="handleSave"
            aria-label="Sozlamalarni saqlash"
            class="w-full sm:w-auto px-6 py-2.5 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold rounded-xl text-xs transition cursor-pointer min-h-[40px] shadow-xs"
          >
            Sozlamalarni saqlash
          </button>
        </div>
      </div>
    </div>

    <ChangePasswordForm />
  </div>
</template>
