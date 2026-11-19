<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, computed } from 'vue';
import { useTeacherStore } from '../../features/teacher/teacherStore';
import { useTenantStore } from '../../features/tenant-context/tenantStore';
import { useAuthStore } from '../../features/auth/store/authStore';
import LanguageSwitcher from '../../shared/components/LanguageSwitcher.vue';
import ThemeToggle from '../../shared/components/ThemeToggle.vue';

const router = useRouter();
const route = useRoute();
const teacherStore = useTeacherStore();
const tenantStore = useTenantStore();
const authStore = useAuthStore();

const isMobileMenuOpen = ref(false);
const tenantSlug = computed(() => (route.params.tenantSlug as string) || 'al-xorazmiy');

const currentUser = computed(() => authStore.currentUser);

const userRoleBadge = computed(() => {
  const role = authStore.currentRole;
  if (role === 'SUPER_ADMIN') return 'Viloyat Boshqarmasi';
  if (role === 'SCHOOL_ADMIN') return 'Maktab Admini';
  if (role === 'TEACHER') return "O'qituvchi";
  return 'Xodim';
});

const userInitials = computed(() => {
  const name = currentUser.value?.fullName || 'Foydalanuvchi';
  const parts = name.trim().split(' ');
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
});

const navigationItems = computed(() => {
  const items = [
    { name: 'Dashboard', path: '/teacher/dashboard', icon: '📊' },
    { name: 'Sinflar', path: '/teacher/classes', icon: '🏫' },
    { name: "O'quvchilar", path: '/teacher/students', icon: '👥' },
    { name: 'Imtihonlar', path: '/teacher/assessments', icon: '📝' },
    { name: 'Natijalar', path: '/teacher/results', icon: '📈' },
    { name: 'Tahlillar', path: '/teacher/analytics', icon: '📉' },
    { name: 'Hisobotlar', path: '/teacher/reports', icon: '📑' },
  ];

  if (authStore.hasRole(['SUPER_ADMIN'])) {
    items.push({ name: 'Viloyat Boshqaruvi', path: '/teacher/regional-oversight', icon: '🏛️' });
  }

  items.push({ name: 'Profil & Sozlamalar', path: '/teacher/profile', icon: '👤' });

  if (authStore.hasRole(['SCHOOL_ADMIN', 'SUPER_ADMIN'])) {
    const adminLabel = authStore.currentRole === 'SCHOOL_ADMIN' ? 'Maktab Boshqaruvi' : 'Tenant Admin';
    items.push({ name: adminLabel, path: '/admin', icon: '⚙️' });
  }

  return items;
});

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <div class="h-screen overflow-hidden bg-slate-100 dark:bg-slate-900 flex flex-col lg:flex-row text-slate-800 dark:text-slate-100 font-sans transition-colors">
    <!-- Desktop Sidebar (Pinned & Sticky) -->
    <aside class="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0 z-20">
      <!-- Brand Header -->
      <div class="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <span class="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
          CH
        </span>
        <div>
          <span class="font-bold text-sm tracking-wide text-white block">CHSB Platform</span>
          <span class="text-[11px] text-teal-400 font-medium tracking-wide">Workspace</span>
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
        <!-- Only SUPER_ADMIN can browse the global multi-school catalog -->
        <div v-if="authStore.hasRole(['SUPER_ADMIN'])" class="mt-2 flex flex-col gap-1 text-[11px]">
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

      <!-- User Footer Profile Card & Logout -->
      <div class="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
        <div class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900 border border-slate-800">
          <span class="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {{ userInitials }}
          </span>
          <div class="truncate text-left flex-1 min-w-0">
            <span class="text-xs font-semibold text-slate-200 block truncate">
              {{ currentUser?.fullName || teacherStore.profile?.fullName || 'Foydalanuvchi' }}
            </span>
            <span class="text-[10px] text-teal-400 font-medium block truncate">
              {{ userRoleBadge }}
            </span>
          </div>
        </div>

        <button
          type="button"
          @click="handleLogout"
          aria-label="Tizimdan chiqish"
          class="w-full py-2 px-3 rounded-xl text-rose-400 hover:text-white hover:bg-rose-900/40 border border-rose-900/40 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Tizimdan Chiqish</span>
        </button>
      </div>
    </aside>

    <!-- Mobile Top Navigation Header (Sticky) -->
    <header class="lg:hidden bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shrink-0">
      <div class="px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-7 h-7 rounded bg-teal-600 flex items-center justify-center font-bold text-xs">
            CH
          </span>
          <span class="font-bold text-sm">CHSB Workspace</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="handleLogout"
            aria-label="Tizimdan chiqish"
            class="px-2.5 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold min-h-[40px] flex items-center gap-1 cursor-pointer"
          >
            <span>Chiqish</span>
          </button>

          <button
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            aria-label="Menyuni ochish yoki yopish"
            class="px-3 py-2 min-h-[40px] rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs flex items-center gap-1.5 cursor-pointer touch-manipulation"
          >
            <span>{{ isMobileMenuOpen ? '✕ Yopish' : '☰ Menyu' }}</span>
          </button>
        </div>
      </div>

      <!-- Mobile drawer menu -->
      <div v-if="isMobileMenuOpen" class="p-3 bg-slate-900 border-t border-slate-800 space-y-1">
        <div class="p-2 mb-2 bg-slate-950 rounded-lg text-xs text-slate-300 flex items-center justify-between">
          <span class="truncate font-semibold">{{ currentUser?.fullName || 'Foydalanuvchi' }}</span>
          <span class="text-[10px] text-teal-400 font-bold px-1.5 py-0.5 rounded bg-teal-950 border border-teal-800">
            {{ userRoleBadge }}
          </span>
        </div>

        <router-link
          v-for="item in navigationItems"
          :key="item.path"
          :to="`/t/${tenantSlug}${item.path}`"
          @click="isMobileMenuOpen = false"
          class="flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium"
          :class="route.path.includes(item.path) ? 'bg-teal-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'"
        >
          <span>{{ item.icon }}</span>
          <span>{{ item.name }}</span>
        </router-link>
      </div>
    </header>

    <!-- Main Workspace Content Area (Independent Scroll Container) -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <!-- Workspace Top Bar (Pinned & Sticky Header) -->
      <header class="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 sticky top-0 z-10 shadow-xs">
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
          
          <!-- User info pill in topbar -->
          <div class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-600">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="font-semibold truncate max-w-[140px]">{{ currentUser?.fullName || 'Foydalanuvchi' }}</span>
          </div>

          <button
            type="button"
            @click="handleLogout"
            aria-label="Tizimdan chiqish"
            class="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-xs font-bold transition cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Chiqish</span>
          </button>

          <router-link
            :to="`/t/${tenantSlug}/student`"
            class="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer border border-slate-200 dark:border-slate-600"
          >
            O'quvchi rejimi →
          </router-link>
        </div>
      </header>

      <!-- Scrollable Page Content -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>
