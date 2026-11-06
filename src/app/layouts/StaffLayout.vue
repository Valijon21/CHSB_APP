<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();
const tenantSlug = computed(() => (route.params.tenantSlug as string) || 'al-xorazmiy');
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-800">
    <!-- Staff Top Header -->
    <header class="border-b border-slate-200 bg-white sticky top-0 z-20">
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="w-9 h-9 rounded-lg bg-indigo-900 flex items-center justify-center text-white font-bold text-base shadow-xs">
              T
            </span>
            <div>
              <span class="text-sm font-bold text-slate-900 block leading-tight">CHSB Staff Portal</span>
              <span class="text-xs text-indigo-700 font-medium">O'qituvchi & Admin</span>
            </div>
          </div>

          <!-- Tenant Context Badge -->
          <div class="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-xs text-indigo-950 font-medium">
            <span>Tenant:</span>
            <span class="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">{{ tenantSlug }}</span>
          </div>
        </div>

        <!-- Navigation Bar -->
        <nav class="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
          <router-link
            :to="`/t/${tenantSlug}/teacher`"
            exact-active-class="text-indigo-900 bg-slate-100"
            class="px-3 py-1.5 rounded-md hover:text-slate-900 hover:bg-slate-50 transition"
          >
            Boshqaruv
          </router-link>
          <router-link
            :to="`/t/${tenantSlug}/teacher/classes`"
            active-class="text-indigo-900 bg-slate-100"
            class="px-3 py-1.5 rounded-md hover:text-slate-900 hover:bg-slate-50 transition"
          >
            Sinflar & Roster
          </router-link>
          <router-link
            :to="`/t/${tenantSlug}/teacher/assessments`"
            active-class="text-indigo-900 bg-slate-100"
            class="px-3 py-1.5 rounded-md hover:text-slate-900 hover:bg-slate-50 transition"
          >
            Baholashlar
          </router-link>
          <router-link
            :to="`/t/${tenantSlug}/teacher/results`"
            active-class="text-indigo-900 bg-slate-100"
            class="px-3 py-1.5 rounded-md hover:text-slate-900 hover:bg-slate-50 transition"
          >
            Natijalar
          </router-link>
          <router-link
            :to="`/t/${tenantSlug}/admin`"
            active-class="text-indigo-900 bg-slate-100"
            class="px-3 py-1.5 rounded-md hover:text-slate-900 hover:bg-slate-50 transition"
          >
            Admin
          </router-link>
        </nav>

        <!-- Demo Mode Indicator -->
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Demo Prototip
          </span>
          <router-link
            :to="`/t/${tenantSlug}/student`"
            class="text-xs text-slate-500 hover:text-slate-800 underline ml-2"
          >
            O'quvchi rejimiga o'tish
          </router-link>
        </div>
      </div>

      <!-- Mobile Navigation sub-bar -->
      <div class="md:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-between text-xs overflow-x-auto gap-2">
        <router-link :to="`/t/${tenantSlug}/teacher`" class="whitespace-nowrap px-2 py-1">Boshqaruv</router-link>
        <router-link :to="`/t/${tenantSlug}/teacher/classes`" class="whitespace-nowrap px-2 py-1">Sinflar</router-link>
        <router-link :to="`/t/${tenantSlug}/teacher/assessments`" class="whitespace-nowrap px-2 py-1">Baholashlar</router-link>
        <router-link :to="`/t/${tenantSlug}/teacher/results`" class="whitespace-nowrap px-2 py-1">Natijalar</router-link>
        <router-link :to="`/t/${tenantSlug}/admin`" class="whitespace-nowrap px-2 py-1">Admin</router-link>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      <slot>
        <router-view />
      </slot>
    </main>

    <!-- Staff Footer -->
    <footer class="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>CHSB Teacher & Tenant Admin Portal &copy; {{ new Date().getFullYear() }}</span>
        <span class="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          Ko'rsatilayotgan barcha ma'lumotlar sintetik test ma'lumotlaridir
        </span>
      </div>
    </footer>
  </div>
</template>
