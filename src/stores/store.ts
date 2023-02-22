import { ref } from "vue";
import { defineStore } from "pinia";

export const useXashStore = defineStore("xash", () => {
  const memory = ref(150);
  const selectedGame = ref(null);
  const loading = ref(false);
  const loadingProgress = ref(0);
  const showXashSettingUI = ref(true);
  const launchOptions = ref("");

  return {
    memory,
    selectedGame,
    loading,
    loadingProgress,
    showXashSettingUI,
    launchOptions,
  };
});
