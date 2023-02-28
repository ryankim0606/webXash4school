<template>
  <div class="window" name="Start">
    <div class="box">
      <button class="start-button" @click="start" :disabled="!selectedGame">
        Start
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import gs useXashStore } from "@/stores/store";
import { storeToRefs } from "pinia";
import setCanvasLoading from "@/utils/setCanvasLoading";
const store = useXashStore();
const { selectedGame } = storeToRefs(store);
const { downloadZip, startXash } = store;

const start = async () => {
  setCanvasLoading();
  const zip = await downloadZip(selectedGame);
  await startXash(zip);
};
</script>

<style scoped lang="scss">
.start-button {
  text-align: center;
  width: 100%;
}
</style>
