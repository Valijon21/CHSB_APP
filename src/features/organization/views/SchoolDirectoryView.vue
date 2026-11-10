<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useOrganizationStore } from '../store/organizationStore';
import SchoolCard from '../components/SchoolCard.vue';
import CreateSchoolModal from '../components/CreateSchoolModal.vue';
import type { SchoolInput } from '../../../entities/organization/model';

const store = useOrganizationStore();
const isCreateModalOpen = ref<boolean>(false);

const DISTRICTS = [
  { id: 'all', name: 'Barcha tumanlar' },
  { id: 'dist-urganch-shahar', name: 'Urganch shahri' },
  { id: 'dist-xiva-shahar', name: 'Xiva shahri' },
  { id: 'dist-urganch-tuman', name: 'Urganch tumani' },
  { id: 'dist-xiva-tuman', name: 'Xiva tumani' },
  { id: 'dist-bogot-tuman', name: "Bog'ot tumani" },
  { id: 'dist-shovot-tuman', name: 'Shovot tumani' },
  { id: 'dist-xonqa-tuman', name: 'Xonqa tumani' },
  { id: 'dist-yangibozor-tuman', name: 'Yangibozor tumani' },
  { id: 'dist-hazorasp-tuman', name: 'Hazorasp tumani' },
  { id: 'dist-gurlan-tuman', name: 'Gurlan tumani' },
  { id: 'dist-qoshkopir-tuman', name: "Qo'shko'pir tumani" },
  { id: 'dist-tuproqqala-tuman', name: "Tuproqqal'a tumani" },
  { id: 'dist-yangiariq-tuman', name: 'Yangiariq tumani' },
];

onMounted(async () => {
  await store.loadSchools();
});

async function handleCreateSchool(input: SchoolInput) {
  await store.createSchool(input);
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
    <!-- 1. Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <router-link
            to="/regional/oversight"
            class="text-xs text-slate-500 hover:text-teal-700 transition"
          >
            ← Viloyat Boshqaruv Paneliga qaytish
          </router-link>
        </div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Maktablar Boshqaruv Markazi (Multi-School SaaS)
          </h1>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
            Multi-Tenant
          </span>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Viloyat va respublika bo'yicha barcha maktablar, litseylar va muassasalar tarmog'i
        </p>
      </div>

      <button
        type="button"
        @click="isCreateModalOpen = true"
        class="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        + Yangi Maktab Qo'shish
      </button>
    </div>

    <!-- 2. Statistika Kartochkalari -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      <!-- Jami Maktablar -->
      <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
          Jami Muassasalar
        </span>
        <span class="text-2xl font-black text-slate-900 dark:text-white font-mono">
          {{ store.overallStats.totalSchools }}
        </span>
        <span class="block text-[10px] text-teal-600 font-medium mt-0.5">Faol maktablar</span>
      </div>

      <!-- Jami O'quvchilar -->
      <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
          Jami O'quvchilar
        </span>
        <span class="text-2xl font-black text-slate-900 dark:text-white font-mono">
          {{ store.overallStats.totalStudents.toLocaleString() }}
        </span>
        <span class="block text-[10px] text-slate-400 font-medium mt-0.5">Ro'yxatdan o'tgan</span>
      </div>

      <!-- Jami O'qituvchilar -->
      <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
          Jami O'qituvchilar
        </span>
        <span class="text-2xl font-black text-slate-900 dark:text-white font-mono">
          {{ store.overallStats.totalTeachers.toLocaleString() }}
        </span>
        <span class="block text-[10px] text-emerald-600 font-medium mt-0.5">Pedagogik tarkib</span>
      </div>

      <!-- Ixtisoslashtirilgan -->
      <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
          Ixtisoslashtirilgan / Litsey
        </span>
        <span class="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
          {{ store.overallStats.specializedCount }}
        </span>
        <span class="block text-[10px] text-indigo-600/70 font-medium mt-0.5">Maxsus maktablar</span>
      </div>
    </div>

    <!-- 3. Filterlar va Qidiruv qatori -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1">
        <!-- Qidiruv Inputi -->
        <div class="relative flex-1 min-w-[240px]">
          <input
            v-model="store.searchQuery"
            type="text"
            placeholder="Maktab nomi, kodi yoki direktori bo'yicha qidiruv..."
            class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <!-- Tuman Tanlash -->
        <select
          v-model="store.selectedDistrictId"
          class="p-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
        >
          <option v-for="d in DISTRICTS" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
      </div>

      <div class="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
        Ko'rsatilmoqda: <strong class="text-slate-900 dark:text-white">{{ store.filteredSchools.length }}</strong> ta muassasa
      </div>
    </div>

    <!-- 4. Maktablar Grid Ro'yxati -->
    <div v-if="store.filteredSchools.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <SchoolCard
        v-for="school in store.filteredSchools"
        :key="school.id"
        :school="school"
      />
    </div>

    <div v-else class="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
      <svg class="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <h3 class="text-sm font-bold text-slate-700 dark:text-slate-300">Hech qanday maktab topilmadi</h3>
      <p class="text-xs text-slate-400 mt-1">Qidiruv parametrlarini o'zgartiring yoki yangi maktab qo'shing</p>
    </div>

    <!-- 5. Yangi Maktab Qo'shish Modali -->
    <CreateSchoolModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @create="handleCreateSchool"
    />
  </div>
</template>

