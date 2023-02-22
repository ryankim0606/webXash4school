<template>
  <div class="window" name="Games">
    <div class="box">
      <button class="start-button" @click="start" :disabled="!selectedGame">
        Start
      </button>
    </div>
  </div>
</template>

<script setup>
import { startXash } from "@/game/initializeXash";
import { useXashStore } from "@/stores/store";
import { storeToRefs } from "pinia";
const store = useXashStore();
const { selectedGame } = storeToRefs(store);

const start = () => {
  startXash();
};
</script>

<style scoped lang="scss">
.start-button {
  text-align: center;
  width: 100%;
}
</style>
