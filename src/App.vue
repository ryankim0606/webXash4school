<template>
  <XashSettings v-if="showXashSettingUI" />
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { initializeXash } from "@/game/initializeXash";
import XashSettings from "@/components/XashSettings.vue";
import { useXashStore } from "@/stores/store";

import { storeToRefs } from "pinia";
const store = useXashStore();
const { showXashSettingUI } = storeToRefs(store);

const start = () => {
  initializeXash();
};

onMounted(() => {
  initializeXash();
});
</script>

<style scoped lang="scss">
.start {
  position: absolute;
  bottom: 10px;
  right: 10px;
}
</style>
