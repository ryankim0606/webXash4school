import { ref } from "vue";
import { defineStore } from "pinia";
import initializeXash from "@/game/initializeXash";

export const useXashStore = defineStore("xash", () => {
  const memory = ref(150);
  const startXash = (gamePackage: string) => {
    const options = {
      memory: memory.value,
      gamePackage,
    };
    initializeXash(options);
  };

  return { memory, startXash };
});
