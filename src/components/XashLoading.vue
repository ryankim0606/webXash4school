<template>
  <div class="half window xash-loading" name="Loading">
    <progress :value="loadingProgress" max="100" />
  </div>
</template>

<script setup>
import { useXashStore } from "@/stores/store";
import { storeToRefs } from "pinia";
const store = useXashStore();
const { loadingProgress } = storeToRefs(store);
</script>

<style scoped lang="scss"></style>
