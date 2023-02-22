<template>
  <XashSettings />
  <button class="start" @click="start">start</button>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from "vue";
import BrowserFS from "browserfs";
import initializeXash from "@/game/initializeXash";
import XashSettings from "@/components/XashSettings.vue";

const start = () => {
  initializeXash();
};

// TODO: Resize window, maybe try these?
// Module["_SDL_OnWindowResized"]
// Module["_Emscripten_HandleCanvasResize"]
// Browser.resizeCanvas
// Module["_SDL_OnWindowResized"]
//

// onBeforeMount(() => {
//
// });
</script>

<style scoped lang="scss">
.start {
  position: absolute;
  bottom: 10px;
  right: 10px;
}
</style>
