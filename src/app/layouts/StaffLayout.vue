<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, computed } from 'vue';
import { useTeacherStore } from '../../features/teacher/teacherStore';
import { useTenantStore } from '../../features/tenant-context/tenantStore';
import LanguageSwitcher from '../../shared/components/LanguageSwitcher.vue';
import ThemeToggle from '../../shared/components/ThemeToggle.vue';

const route = useRoute();
const teacherStore = useTeacherStore();
const tenantStore = useTenantStore();

const isMobileMenuOpen = ref(false);
const tenantSlug = computed(() => (route.params.tenantSlug as string) || 'al-xorazmiy');

const navigationItems = [
  { name: 'Dashboard', path: '/teacher/dashboard', icon: '📊' },
  { name: 'Sinflar', path: '/teacher/classes', icon: '🏫' },
  { name: "O'quvchilar", path: '/teacher/students', icon: '👥' },
  { name: 'Imtihonlar', path: '/teacher/assessments', icon: '📝' },
  { name: 'Natijalar', path: '/teacher/results', icon: '📈' },
  { name: 'Tahlillar', path: '/teacher/analytics', icon: '📉' },
  { name: 'Hisobotlar', path: '/teacher/reports', icon: '📑' },
  { name: 'Viloyat Boshqaruvi', path: '/teacher/regional-oversight', icon: '🏛️' },
  { name: 'Profil & Sozlamalar', path: '/teacher/profile', icon: '👤' },
  { name: 'Tenant Admin', path: '/admin', icon: '⚙️' },
];
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col lg:flex-row text-slate-800 dark:text-slate-100 font-sans transition-colors">
    <!-- Desktop Sidebar -->
    <aside class="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0">
      <!-- Brand Header -->
      <div class="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <span class="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
          CH
        </span>
        <div>
          <span class="font-bold text-sm tracking-wide text-white block">CHSB Platform</span>
          <span class="text-[11px] text-teal-400 font-medium tracking-wide">Teacher Workspace</span>
        </div>
      </div>

      <!-- Tenant Scope Card -->
      <div class="p-4 border-b border-slate-800 bg-slate-950/40">
        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span>Faol Muassasa:</span>
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
        <div class="text-xs font-semibold text-slate-200 truncate">
          {{ tenantStore.currentTenant?.displayName || (tenantSlug === 'temurbeklar-maktabi' ? 'Temurbeklar Maktabi' : 'Al-Xorazmiy IT Maktabi') }}
        </div>
        <div class="mt-2 flex flex-col gap-1 text-[11px]">
          <router-link
            to="/schools"
            class="text-teal-400 hover:text-teal-300 underline font-medium flex items-center gap-1"
          >
            <span>🏢</span>
            <span>Barcha maktablar katalogi ⇄</span>
          </router-link>
        </div>
      </div>

      <!-- Navigation links -->
      <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in navigationItems"
          :key="item.path"
          :to="`/t/${tenantSlug}${item.path}`"
          class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition group"
          :class="[
            route.path.includes(item.path)
              ? 'bg-teal-600 text-white font-semibold shadow-xs'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
          ]"
        >
          <span class="text-base">{{ item.icon }}</span>
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <!-- Teacher Footer Profile Card -->
      <div class="p-3 border-t border-slate-800 bg-slate-950/60">
        <div class="flex items-center gap-3 p-2 rounded-lg bg-slate-900 border border-slate-800">
          <span class="w-8 h-8 rounded-full bg-indigo-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
            DU
          </span>
          <div class="truncate text-left flex-1">
            <span class="text-xs font-semibold text-slate-200 block truncate">
              {{ teacherStore.profile?.fullName || 'Dilmurod Ustoz' }}
            </span>
            <span class="text-[10px] text-slate-400 block truncate">
              Informatika fani
            </span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Mobile Top Navigation Header -->
    <header class="lg:hidden bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
      <div class="px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-7 h-7 rounded bg-teal-600 flex items-center justify-center font-bold text-xs">
            CH
          </span>
          <span class="font-bold text-sm">CHSB O'qituvchi</span>
        </div>

        <button
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="px-3 py-2 min-h-[40px] rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs flex items-center gap-1.5 cursor-pointer touch-manipulation"
        >
          <span>{{ isMobileMenuOpen ? '✕ Yopish' : '☰ Menyu' }}</span>
        </button>
      </div>

      <!-- Mobile drawer menu -->
      <div v-if="isMobileMenuOpen" class="p-3 bg-slate-900 border-t border-slate-800 space-y-1">
        <router-link
          v-for="item in navigationItems"
          :key="item.path"
          :to="`/t/${tenantSlug}${item.path}`"
          @click="isMobileMenuOpen = false"
          class="flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium"
          :class="route.path.includes(item.path) ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'"
        >
          <span>{{ item.icon }}</span>
          <span>{{ item.name }}</span>
        </router-link>
      </div>
    </header>

    <!-- Main Workspace Content Area -->
    <div class="flex-1 flex flex-col min-w-0 overflow-y-auto">
      <!-- Workspace Top Bar -->
      <div class="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-10 shadow-xs">
        <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span class="font-medium text-slate-700 dark:text-slate-300">Muassasa:</span>
          <span class="font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
            {{ tenantSlug }}
          </span>
          <span class="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
          <span class="hidden sm:inline font-mono text-[11px] text-slate-400">CHSB Enterprise V2</span>
        </div>

        <div class="flex items-center gap-2.5">
          <LanguageSwitcher />
          <ThemeToggle />
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hidden sm:inline-flex">
            ✓ Tizim Faol
          </span>
          <router-link
            :to="`/t/${tenantSlug}/student`"
            class="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer border border-slate-200 dark:border-slate-600"
          >
            O'quvchi rejimi →
          </router-link>
        </div>
      </div>

      <!-- Page Content -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>
