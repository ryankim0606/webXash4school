<template>
  <div class="window" name="Games">
    <div class="box inset">
      <p
        v-for="game in gameList"
        class="menu-item"
        :key="game.name"
        @click="startXash(game.packageName)"
      >
        {{ game.name }}
      </p>
    </div>
  </div>
</template>

<script setup>
import gameList from "@/config/games";
import { useXashStore } from "@/stores/store";

const store = useXashStore();

const { startXash } = store;
</script>

<style scoped lang="scss"></style>
