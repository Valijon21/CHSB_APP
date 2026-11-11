<script setup lang="ts">
import type { QuestionBlock } from '../../entities/assessment/model';

defineProps<{
  block: QuestionBlock;
}>();
</script>

<template>
  <div class="my-2 text-slate-800 dark:text-slate-100">
    <!-- Paragraph Block -->
    <div
      v-if="block.type === 'paragraph'"
      class="text-sm sm:text-base leading-relaxed break-words font-normal text-slate-800 dark:text-slate-100"
      v-html="block.text"
    ></div>

    <!-- Image Block -->
    <div v-else-if="block.type === 'image'" class="my-3 text-center">
      <img
        :src="block.assetId"
        :alt="block.alt"
        class="max-w-full h-auto mx-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs max-h-80 object-contain"
        loading="lazy"
      />
      <span v-if="block.caption" class="block text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
        {{ block.caption }}
      </span>
    </div>

    <!-- Table Block -->
    <div v-else-if="block.type === 'table'" class="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
      <table class="w-full text-left text-xs sm:text-sm border-collapse bg-white dark:bg-slate-800">
        <thead v-if="block.columns.length > 0" class="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th
              v-for="(col, cIdx) in block.columns"
              :key="cIdx"
              class="p-2.5 sm:p-3 border-r border-slate-200 dark:border-slate-700 last:border-r-0"
            >
              {{ col }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-700/80">
          <tr
            v-for="(row, rIdx) in block.rows"
            :key="rIdx"
            class="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
          >
            <td
              v-for="(cell, cellIdx) in row"
              :key="cellIdx"
              class="p-2.5 sm:p-3 border-r border-slate-100 dark:border-slate-700/60 last:border-r-0 text-slate-800 dark:text-slate-200 align-top"
            >
              {{ cell }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Code Block -->
    <div v-else-if="block.type === 'code'" class="my-3 p-3.5 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-100 font-mono text-xs sm:text-sm overflow-x-auto border border-slate-800">
      <pre><code>{{ block.code }}</code></pre>
    </div>
  </div>
</template>

