<script setup lang="ts">
import { computed } from 'vue';
import { generateQrSvg } from '../utils/qrGenerator';

const props = withDefaults(
  defineProps<{
    value: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
    margin?: number;
  }>(),
  {
    size: 140,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    margin: 2,
  }
);

const svgContent = computed(() => {
  if (!props.value) return '';
  return generateQrSvg(props.value, {
    size: props.size,
    color: props.color,
    backgroundColor: props.backgroundColor,
    margin: props.margin,
  });
});
</script>

<template>
  <div class="inline-block" v-html="svgContent" :title="`QR Code: ${value}`"></div>
</template>
