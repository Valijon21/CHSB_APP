<script setup lang="ts">
import { ref, watch } from 'vue';
import type { SchoolInput, SchoolType } from '../../../entities/organization/model';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'create', input: SchoolInput): void;
}>();

const DISTRICTS = [
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

const name = ref('');
const code = ref('');
const slug = ref('');
const districtId = ref('dist-urganch-shahar');
const type = ref<SchoolType>('general');
const directorName = ref('');
const contactPhone = ref('+998');
const email = ref('');
const errorMessage = ref<string | null>(null);

// Avtomatik slug generatsiyasi
watch(name, (newVal) => {
  if (!slug.value || slug.value.length === 0 || slug.value.startsWith('maktab-')) {
    slug.value = newVal
      .toLowerCase()
      .trim()
      .replace(/[ʻʼ'`‘’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

function handleSubmit() {
  errorMessage.value = null;

  if (name.value.trim().length < 3) {
    errorMessage.value = "Maktab nomi kamida 3 ta harfdan iborat bo'lishi shart!";
    return;
  }
  if (!code.value.trim()) {
    errorMessage.value = "Maktab kodi kiritilishi shart (masalan: URG-01)!";
    return;
  }
  if (!slug.value.trim() || !/^[a-z0-9-]+$/.test(slug.value)) {
    errorMessage.value = "Slug faqat kichik lotin harflari va defisdan iborat bo'lishi shart (masalan: xiva-1-maktab)!";
    return;
  }
  if (directorName.value.trim().length < 3) {
    errorMessage.value = "Direktor F.I.SH. kiritilishi shart!";
    return;
  }
  if (contactPhone.value.trim().length < 9) {
    errorMessage.value = "Telefon raqami to'liq kiritilishi shart!";
    return;
  }

  const selectedDist = DISTRICTS.find((d) => d.id === districtId.value);

  emit('create', {
    name: name.value.trim(),
    code: code.value.trim(),
    slug: slug.value.trim(),
    districtId: districtId.value,
    districtName: selectedDist?.name || 'Urganch shahri',
    type: type.value,
    directorName: directorName.value.trim(),
    contactPhone: contactPhone.value.trim(),
    email: email.value.trim() || undefined,
    status: 'active',
  });

  resetForm();
  emit('close');
}

function resetForm() {
  name.value = '';
  code.value = '';
  slug.value = '';
  directorName.value = '';
  contactPhone.value = '+998';
  email.value = '';
  errorMessage.value = null;
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
  >
    <div
      class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
    >
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Yangi Maktab (Tenant) Qo'shish
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tizimga yangi ta'lim muassasasini biriktirish
          </p>
        </div>

        <button
          type="button"
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="errorMessage" class="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3.5 text-xs">
        <!-- 1. Tuman va Maktab turi -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tuman / Shahar *</label>
            <select
              v-model="districtId"
              class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium"
            >
              <option v-for="d in DISTRICTS" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Muassasa Turi *</label>
            <select
              v-model="type"
              class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="general">Umumiy o'rta ta'lim</option>
              <option value="specialized">Ixtisoslashtirilgan maktab</option>
              <option value="lyceum">Akademik litsey</option>
              <option value="private">Xususiy maktab</option>
            </select>
          </div>
        </div>

        <!-- 2. Maktab nomi -->
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Maktabning To'liq Nomi *</label>
          <input
            v-model="name"
            type="text"
            placeholder="Masalan: 1-sonli ixtisoslashtirilgan davlat maktab-internati"
            class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium"
          />
        </div>

        <!-- 3. Kodi va Unikal Slug -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Maktab Kodi *</label>
            <input
              v-model="code"
              type="text"
              placeholder="Masalan: URG-01"
              class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">URL Slug (Unikal) *</label>
            <input
              v-model="slug"
              type="text"
              placeholder="urganch-1-maktab"
              class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-teal-600 dark:text-teal-400 font-bold"
            />
          </div>
        </div>

        <!-- 4. Rahbar F.I.SH va Aloqa -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Direktor F.I.SH. *</label>
            <input
              v-model="directorName"
              type="text"
              placeholder="Familiya Ism Sharif"
              class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Aloqa Telefoni *</label>
            <input
              v-model="contactPhone"
              type="text"
              placeholder="+998901234567"
              class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono"
            />
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email manzili (ixtiyoriy)</label>
          <input
            v-model="email"
            type="email"
            placeholder="maktab@xorazm.uz"
            class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            class="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            Maktabni Saqlash
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
