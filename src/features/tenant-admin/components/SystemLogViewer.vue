<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { logger } from '../../../shared/services/logger/LoggerService';
import type { LogEntry, LogLevel, LogCategory, LogStats } from '../../../shared/services/logger/types';

const logs = ref<LogEntry[]>([]);
const stats = ref<LogStats>({
  total: 0,
  errorCount: 0,
  warnCount: 0,
  infoCount: 0,
});
const isLoading = ref(false);
const selectedLevel = ref<LogLevel | 'ALL'>('ALL');
const selectedCategory = ref<LogCategory | 'ALL'>('ALL');
const searchQuery = ref('');
const expandedLogId = ref<string | null>(null);
const copySuccess = ref(false);

const filteredLogs = computed(() => {
  return logs.value.filter((log) => {
    if (selectedLevel.value !== 'ALL' && log.level !== selectedLevel.value) {
      return false;
    }
    if (selectedCategory.value !== 'ALL' && log.category !== selectedCategory.value) {
      return false;
    }
    if (searchQuery.value.trim() !== '') {
      const q = searchQuery.value.toLowerCase();
      const matchMsg = log.message.toLowerCase().includes(q);
      const matchRoute = log.route?.toLowerCase().includes(q);
      const matchStack = log.stackTrace?.toLowerCase().includes(q);
      if (!matchMsg && !matchRoute && !matchStack) {
        return false;
      }
    }
    return true;
  });
});

async function loadData() {
  isLoading.value = true;
  try {
    logs.value = await logger.getLogs({ limit: 1000 });
    stats.value = await logger.getStats();
  } finally {
    isLoading.value = false;
  }
}

function toggleExpand(id: string) {
  expandedLogId.value = expandedLogId.value === id ? null : id;
}

async function handleCopyLogs() {
  const jsonStr = await logger.exportLogsAsJson();
  if (navigator?.clipboard) {
    await navigator.clipboard.writeText(jsonStr);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2500);
  }
}

async function handleDownloadJson() {
  const jsonStr = await logger.exportLogsAsJson();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chsb-system-logs-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function handleClearLogs() {
  if (confirm("Haqiqatan ham barcha loglarni tozalashni xohlaysizmi?")) {
    await logger.clearLogs();
    await loadData();
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
    <!-- Header & Statistics -->
    <div class="p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-base">📋</span>
          <h3 class="text-sm font-bold text-slate-900">Tizim Loglari & Xatolar Konsoli (Telemetry)</h3>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono font-semibold">
            IndexedDB 10,000 Ring-Buffer
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-1">
          Frontenddagi barcha hodisalar, tarmoq xatolari va 404 navigatsiyalar qaydnomasi
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          @click="loadData"
          class="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition flex items-center gap-1 cursor-pointer"
        >
          🔄 Yangilash
        </button>
        <button
          type="button"
          @click="handleCopyLogs"
          class="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition flex items-center gap-1 cursor-pointer"
        >
          <span>{{ copySuccess ? '✅ Nusxalandi!' : '📋 Nusxalash (JSON)' }}</span>
        </button>
        <button
          type="button"
          @click="handleDownloadJson"
          class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1 cursor-pointer"
        >
          💾 JSON Yuklab olish
        </button>
        <button
          type="button"
          @click="handleClearLogs"
          class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer"
        >
          🗑️ Tozalash
        </button>
      </div>
    </div>

    <!-- Quick Stats Bar -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white border-b border-slate-100 text-xs">
      <div class="p-3 rounded-lg bg-slate-50 border border-slate-100">
        <span class="text-slate-500 block text-[11px]">Jami Loglar</span>
        <span class="text-base font-bold text-slate-800 font-mono">{{ stats.total }}</span>
      </div>
      <div class="p-3 rounded-lg bg-rose-50 border border-rose-100">
        <span class="text-rose-600 block text-[11px]">Xatoliklar (ERROR/FATAL)</span>
        <span class="text-base font-bold text-rose-700 font-mono">{{ stats.errorCount }}</span>
      </div>
      <div class="p-3 rounded-lg bg-amber-50 border border-amber-100">
        <span class="text-amber-600 block text-[11px]">Ogohlantirishlar (WARN)</span>
        <span class="text-base font-bold text-amber-700 font-mono">{{ stats.warnCount }}</span>
      </div>
      <div class="p-3 rounded-lg bg-teal-50 border border-teal-100">
        <span class="text-teal-600 block text-[11px]">Axborot (INFO)</span>
        <span class="text-base font-bold text-teal-700 font-mono">{{ stats.infoCount }}</span>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="p-4 bg-slate-50/60 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
      <!-- Search Input -->
      <div class="relative flex-1 max-w-md">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Xatolik matni, URL yoki stack trace bo'yicha qidirish..."
          class="w-full px-3 py-1.5 pl-8 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-700 bg-white text-slate-800 placeholder-slate-400"
        />
        <span class="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
      </div>

      <!-- Level & Category Selectors -->
      <div class="flex items-center gap-2 flex-wrap">
        <div class="flex items-center gap-1">
          <span class="text-slate-500 text-[11px]">Daraja:</span>
          <select
            v-model="selectedLevel"
            class="px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden text-xs"
          >
            <option value="ALL">Barchasi (ALL)</option>
            <option value="ERROR">Faqat Xatolar (ERROR)</option>
            <option value="WARN">Ogohlantirishlar (WARN)</option>
            <option value="INFO">Axborot (INFO)</option>
            <option value="FATAL">Kritik (FATAL)</option>
            <option value="DEBUG">Debug</option>
          </select>
        </div>

        <div class="flex items-center gap-1">
          <span class="text-slate-500 text-[11px]">Kategoriya:</span>
          <select
            v-model="selectedCategory"
            class="px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden text-xs"
          >
            <option value="ALL">Barchasi</option>
            <option value="UI">UI / Komponent</option>
            <option value="ROUTER">Router / 404</option>
            <option value="NETWORK">Tarmoq / Async</option>
            <option value="STATE">State / Store</option>
            <option value="SYSTEM">Tizim</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Logs List Table / Cards -->
    <div class="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
      <div
        v-if="filteredLogs.length === 0"
        class="py-12 text-center text-slate-400 text-xs"
      >
        <span class="text-2xl block mb-2">🛡️</span>
        Hozircha hech qanday log topilmadi yoki filtr bo'yicha ma'lumot yo'q.
      </div>

      <div
        v-for="log in filteredLogs"
        :key="log.id"
        class="p-3.5 hover:bg-slate-50 transition text-xs space-y-2 cursor-pointer"
        @click="toggleExpand(log.id)"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-2 flex-wrap">
            <!-- Level Badge -->
            <span
              v-if="log.level === 'FATAL'"
              class="px-2 py-0.5 rounded font-bold font-mono text-[10px] bg-red-600 text-white"
            >
              FATAL
            </span>
            <span
              v-else-if="log.level === 'ERROR'"
              class="px-2 py-0.5 rounded font-bold font-mono text-[10px] bg-rose-100 text-rose-700"
            >
              ERROR
            </span>
            <span
              v-else-if="log.level === 'WARN'"
              class="px-2 py-0.5 rounded font-bold font-mono text-[10px] bg-amber-100 text-amber-800"
            >
              WARN
            </span>
            <span
              v-else-if="log.level === 'INFO'"
              class="px-2 py-0.5 rounded font-bold font-mono text-[10px] bg-teal-100 text-teal-800"
            >
              INFO
            </span>
            <span
              v-else
              class="px-2 py-0.5 rounded font-bold font-mono text-[10px] bg-slate-100 text-slate-600"
            >
              {{ log.level }}
            </span>

            <!-- Category Badge -->
            <span class="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
              {{ log.category }}
            </span>

            <!-- Route Badge -->
            <span
              v-if="log.route"
              class="text-indigo-600 font-mono text-[11px] truncate max-w-[200px]"
            >
              {{ log.route }}
            </span>
          </div>

          <!-- Timestamp -->
          <div class="text-[11px] text-slate-400 font-mono">
            {{ new Date(log.timestamp).toLocaleTimeString() }} ({{ log.timestamp.slice(0, 10) }})
          </div>
        </div>

        <!-- Log Message -->
        <div class="text-slate-800 font-medium text-xs break-words">
          {{ log.message }}
        </div>

        <!-- Accordion Details (Stack Trace & Context) -->
        <div
          v-if="expandedLogId === log.id"
          class="mt-2 p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] space-y-2 overflow-x-auto"
          @click.stop
        >
          <div v-if="log.stackTrace">
            <span class="text-rose-400 font-bold block mb-1">Stack Trace:</span>
            <pre class="whitespace-pre-wrap text-[10px] text-rose-200 font-mono">{{ log.stackTrace }}</pre>
          </div>

          <div v-if="log.context && Object.keys(log.context).length > 0">
            <span class="text-teal-400 font-bold block mb-1">Context / Metadata:</span>
            <pre class="text-[10px] text-teal-200 font-mono">{{ JSON.stringify(log.context, null, 2) }}</pre>
          </div>

          <div class="pt-1 text-[10px] text-slate-400 flex justify-between border-t border-slate-800">
            <span>Log ID: {{ log.id }}</span>
            <span>Tenant: {{ log.tenantSlug || 'global' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

