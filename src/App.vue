<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="p-4 mb-4">
    <nav class="navbar px-4 border rounded border-neutral">
      <RouterLink class="btn btn-ghost text-xl" to="/">Home</RouterLink>
      <RouterLink class="btn btn-ghost text-xl" to="/about">About</RouterLink>
    </nav>
  </header>

  <RouterView class="p-4" />
</template>

<style scoped></style>
