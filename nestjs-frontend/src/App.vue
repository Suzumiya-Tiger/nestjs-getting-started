<script lang="ts">
import "@/styles/root.scss";
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'App',
  setup() {
    console.log('App component mounted');
  }
});
</script>

<template>
  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
</template>

<style scoped>
</style>
