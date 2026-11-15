<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/authStore';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const rememberMe = ref(false);
const showPassword = ref(false);
const formError = ref<string | null>(null);

function selectDemoAccount(demoUsername: string, demoPass: string) {
  username.value = demoUsername;
  password.value = demoPass;
  formError.value = null;
}

async function handleLogin() {
  formError.value = null;

  if (username.value.trim().length < 3) {
    formError.value = "Foydalanuvchi nomi kamida 3 ta belgidan iborat bo'lishi kerak.";
    return;
  }
  if (password.value.length < 4) {
    formError.value = "Parol kamida 4 ta belgidan iborat bo'lishi kerak.";
    return;
  }

  try {
    const user = await authStore.login({
      username: username.value.trim(),
      password: password.value,
      rememberMe: rememberMe.value,
    });

    // Qayta yo'naltirish (Redirect)
    const redirectPath = route.query.redirect as string;
    if (redirectPath) {
      router.push(redirectPath);
      return;
    }

    // Role bo'yicha standart sahifaga yo'naltirish
    if (user.role === 'SUPER_ADMIN') {
      router.push('/regional/oversight');
    } else if (user.role === 'SCHOOL_ADMIN') {
      router.push(`/t/${user.tenantSlug || 'al-xorazmiy'}/admin`);
    } else {
      router.push(`/t/${user.tenantSlug || 'al-xorazmiy'}/teacher/dashboard`);
    }
  } catch (err) {
    formError.value = err instanceof Error ? err.message : "Tizimga kirishda xatolik yuz berdi.";
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
      <!-- Brand Logo -->
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white font-black text-2xl shadow-lg shadow-teal-600/20 mb-4">
        CH
      </div>
      <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
        CHSB Platform
      </h1>
      <p class="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        O'qituvchilar va Maktab Ma'muriyati Xavfsiz Kirish Portali
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
      <div class="bg-white dark:bg-slate-800 py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl border border-slate-200/80 dark:border-slate-700/80 space-y-6">
        
        <!-- Error Alert -->
        <div
          v-if="formError || authStore.errorMessage"
          class="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5"
          role="alert"
        >
          <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ formError || authStore.errorMessage }}</span>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Username / Email Input -->
          <div>
            <label for="auth-username" class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Login (Email yoki Foydalanuvchi nomi) *
            </label>
            <div class="relative">
              <input
                id="auth-username"
                v-model="username"
                type="text"
                autocomplete="username"
                required
                aria-label="Email yoki foydalanuvchi nomi"
                placeholder="masalan: teacher@xorazm.uz"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden transition"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div>
            <label for="auth-password" class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Maxfiy Parol *
            </label>
            <div class="relative">
              <input
                id="auth-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                aria-label="Maxfiy parol"
                placeholder="••••••••"
                class="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden transition"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-hidden"
                :aria-label="showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'"
              >
                <!-- Eye Open -->
                <svg v-if="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <!-- Eye Closed -->
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Remember Me Checkbox -->
          <div class="flex items-center justify-between pt-1">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="rememberMe"
                type="checkbox"
                aria-label="Meni eslab qol"
                class="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700"
              />
              <span class="text-xs text-slate-600 dark:text-slate-400 font-medium">Meni eslab qol</span>
            </label>
            <span class="text-xs text-slate-400">Xavfsiz sessiya</span>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full mt-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-teal-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg
              v-if="authStore.isLoading"
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></svg>
            <span>{{ authStore.isLoading ? 'Tekshirilmoqda...' : 'Tizimga Kirish' }}</span>
          </button>
        </form>

        <!-- Demo Accounts Section -->
        <div class="pt-4 border-t border-slate-100 dark:border-slate-700/60">
          <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
            Tezkor Demo hisoblar (1-bosish bilan):
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <!-- Demo Teacher -->
            <button
              type="button"
              @click="selectDemoAccount('teacher@xorazm.uz', 'teacher123')"
              class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 bg-slate-50 dark:bg-slate-700/50 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 text-left transition text-xs cursor-pointer group"
            >
              <span class="block font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                👨‍🏫 O'qituvchi
              </span>
              <span class="block text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                teacher@xorazm.uz
              </span>
            </button>

            <!-- Demo Admin -->
            <button
              type="button"
              @click="selectDemoAccount('admin@xorazm.uz', 'admin123')"
              class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 bg-slate-50 dark:bg-slate-700/50 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 text-left transition text-xs cursor-pointer group"
            >
              <span class="block font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                🏫 Maktab Admini
              </span>
              <span class="block text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                admin@xorazm.uz
              </span>
            </button>

            <!-- Demo Regional -->
            <button
              type="button"
              @click="selectDemoAccount('regional@xorazm.uz', 'regional123')"
              class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 bg-slate-50 dark:bg-slate-700/50 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 text-left transition text-xs cursor-pointer group"
            >
              <span class="block font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                🏛️ Viloyat Boshqarmasi
              </span>
              <span class="block text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                regional@xorazm.uz
              </span>
            </button>
          </div>
        </div>

        <!-- Student Link Note -->
        <div class="text-center pt-2">
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Imtihon topshiruvchi o'quvchimisiz?
            <router-link
              to="/t/al-xorazmiy/student"
              class="font-bold text-teal-600 dark:text-teal-400 hover:underline ml-1"
            >
              Roster kod orqali kiring →
            </router-link>
          </p>
        </div>

      </div>
    </div>
  </div>
</template>

