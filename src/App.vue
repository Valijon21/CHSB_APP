<script setup lang="ts">
import ToastContainer from './shared/components/ToastContainer.vue';
// CHSB Assessment Platform Root Component
</script>

<template>
  <div id="chsb-app" class="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
    <router-view />
    <ToastContainer />
  </div>
</template>

