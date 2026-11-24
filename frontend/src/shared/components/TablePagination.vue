<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  currentPage?: number;
  pageSize?: number;
  totalItems: number;
  pageSizeOptions?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  currentPage: 1,
  pageSize: 10,
  pageSizeOptions: () => [10, 20, 30, 50],
});

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void;
  (e: 'update:pageSize', size: number): void;
}>();

const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.pageSize) || 1;
});

const startItem = computed(() => {
  if (props.totalItems === 0) return 0;
  return (props.currentPage - 1) * props.pageSize + 1;
});

const endItem = computed(() => {
  return Math.min(props.currentPage * props.pageSize, props.totalItems);
});

function setPage(page: number) {
  if (page < 1 || page > totalPages.value || page === props.currentPage) return;
  emit('update:currentPage', page);
}

function setPageSize(size: number) {
  if (size === props.pageSize) return;
  emit('update:pageSize', size);
  emit('update:currentPage', 1);
}

// Generate smart page list: [1, '...', 4, 5, 6, '...', 10]
const visiblePages = computed<(number | string)[]>(() => {
  const pages: (number | string)[] = [];
  const total = totalPages.value;
  const current = props.currentPage;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) {
      pages.push('...');
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push('...');
    }
    pages.push(total);
  }

  return pages;
});
</script>

<template>
  <div
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 transition-colors"
  >
    <!-- Left: Row count and summary -->
    <div class="flex items-center gap-3">
      <span class="text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
        Ko'rsatilmoqda:
        <strong class="text-slate-900 dark:text-white font-mono">{{ startItem }}-{{ endItem }}</strong>
        / jami
        <strong class="text-slate-900 dark:text-white font-mono">{{ totalItems }}</strong> ta
      </span>

      <!-- Page Size Selector (10, 20, 30, 50) -->
      <div class="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
        <span class="text-slate-400 text-[11px] hidden md:inline">Sahifada:</span>
        <div class="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-700/70">
          <button
            v-for="opt in pageSizeOptions"
            :key="opt"
            type="button"
            :data-testid="`page-size-${opt}`"
            @click="setPageSize(opt)"
            :class="[
              'px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer min-h-[26px] min-w-[28px] text-center',
              pageSize === opt
                ? 'bg-teal-800 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            {{ opt }}
          </button>
        </div>
      </div>
    </div>

    <!-- Right: Page numbers and Prev/Next Navigation -->
    <div class="flex items-center gap-1 justify-between sm:justify-end">
      <!-- Previous Button -->
      <button
        type="button"
        data-testid="prev-page-btn"
        @click="setPage(currentPage - 1)"
        :disabled="currentPage <= 1"
        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 dark:text-slate-200 transition flex items-center gap-1 cursor-pointer min-h-[32px]"
      >
        <span>←</span>
        <span class="hidden sm:inline">Oldingi</span>
      </button>

      <!-- Page Buttons -->
      <div class="flex items-center gap-1">
        <template v-for="(p, i) in visiblePages" :key="i">
          <span
            v-if="typeof p === 'string'"
            class="px-1 text-slate-400 font-mono select-none"
          >
            ...
          </span>
          <button
            v-else
            type="button"
            :data-testid="`page-btn-${p}`"
            @click="setPage(p)"
            :class="[
              'w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer min-h-[32px] min-w-[32px]',
              currentPage === p
                ? 'bg-teal-800 text-white shadow-2xs font-mono'
                : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono'
            ]"
          >
            {{ p }}
          </button>
        </template>
      </div>

      <!-- Next Button -->
      <button
        type="button"
        data-testid="next-page-btn"
        @click="setPage(currentPage + 1)"
        :disabled="currentPage >= totalPages"
        class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 dark:text-slate-200 transition flex items-center gap-1 cursor-pointer min-h-[32px]"
      >
        <span class="hidden sm:inline">Keyingi</span>
        <span>→</span>
      </button>
    </div>
  </div>
</template>
