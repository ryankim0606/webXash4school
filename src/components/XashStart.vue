<template>
  <div class="window" name="Games">
    <div class="box">
      <button class="start-button" @click="start">Start</button>
    </div>
  </div>
</template>

<script setup>
import { useXashStore } from "@/stores/store";

const store = useXashStore();

const start = () => {
  window.startXash();
};
</script>

<style scoped lang="scss">
.start-button {
  text-align: center;
  width: 100%;
}
</style>
