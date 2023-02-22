<template>
  <div class="xash-settings">
    <XashGames />
    <XashStart />
  </div>
</template>

<script setup>
import XashGames from "@/components/XashGames.vue";
import XashStart from "@/components/XashStart.vue";
</script>

<style scoped lang="scss">
.xash-settings {
  display: flex;
  flex-wrap: wrap;
  overflow: auto;
  margin: 10px;
  flex-direction: column;
}
</style>
