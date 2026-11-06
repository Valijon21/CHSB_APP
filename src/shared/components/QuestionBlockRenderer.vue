<script setup lang="ts">
import type { QuestionBlock } from '../../entities/assessment/model';

defineProps<{
  block: QuestionBlock;
}>();
</script>

<template>
  <div class="my-2 text-slate-800">
    <!-- Paragraph Block -->
    <div
      v-if="block.type === 'paragraph'"
      class="text-sm sm:text-base leading-relaxed break-words font-normal"
      v-html="block.text"
    ></div>

    <!-- Image Block -->
    <div v-else-if="block.type === 'image'" class="my-3 text-center">
      <img
        :src="block.assetId"
        :alt="block.alt"
        class="max-w-full h-auto mx-auto rounded-lg border border-slate-200 shadow-xs max-h-80 object-contain"
        loading="lazy"
      />
      <span v-if="block.caption" class="block text-xs text-slate-500 mt-1 italic">
        {{ block.caption }}
      </span>
    </div>

    <!-- Table Block -->
    <div v-else-if="block.type === 'table'" class="my-4 overflow-x-auto rounded-lg border border-slate-200 shadow-xs">
      <table class="w-full text-left text-xs sm:text-sm border-collapse bg-white">
        <thead v-if="block.columns.length > 0" class="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
          <tr>
            <th
              v-for="(col, cIdx) in block.columns"
              :key="cIdx"
              class="p-2.5 sm:p-3 border-r border-slate-200 last:border-r-0"
            >
              {{ col }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="(row, rIdx) in block.rows"
            :key="rIdx"
            class="hover:bg-slate-50/50"
          >
            <td
              v-for="(cell, cellIdx) in row"
              :key="cellIdx"
              class="p-2.5 sm:p-3 border-r border-slate-100 last:border-r-0 text-slate-800 align-top"
            >
              {{ cell }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Code Block -->
    <div v-else-if="block.type === 'code'" class="my-3 p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm overflow-x-auto">
      <pre><code>{{ block.code }}</code></pre>
    </div>
  </div>
</template>
