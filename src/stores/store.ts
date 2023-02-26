import { ref } from "vue";
import { defineStore } from "pinia";
import getZip from "@/utils/getZip";
import {
  FINAL_PROGRESS_STR,
  getInitialLoadingProgress,
} from "@/utils/getInitialLoadingProgress";
// @ts-ignore
import { start } from "../../hl-engine-js/lib/hl-engine";

const EXIT_STR = "exit(0)";
const DEFAULT_ARGS = [
  `-height`,
  `${window.innerHeight}`,
  `-width`,
  `${window.innerWidth}`,
  `+hud_scale`,
  `2.5`,
];

export const useXashStore = defineStore("xash", () => {
  const memory = ref(150);
  const selectedGame = ref("");
  const loading = ref(true);
  const loadingProgress = ref(50);
  const showXashSettingUI = ref(true);
  const launchOptions = ref("");

  const downloadZip = async (): Promise<ArrayBuffer | undefined> => {
    if (!selectedGame.value) return;
    loadingProgress.value = 0;
    loading.value = true;
    return await getZip(
      selectedGame.value,
      (progress: number) => (loadingProgress.value = progress)
    );
  };

  const setStatus = (text: string) => {
    loadingProgress.value = getInitialLoadingProgress(text);
    if (text === FINAL_PROGRESS_STR) {
      loading.value = false;
    }
    if (text === EXIT_STR) {
      window.location.reload();
      console.log("exiting!!!!");
    }
    console.info(text);
  };

  console.log(DEFAULT_ARGS);

  const startXash = async (zip: ArrayBuffer) => {
    const params = {
      mod: selectedGame.value?.split?.(".")?.[0],
      map: null,
      filesystem: "RAM",
      fullscreen: false,
      zip,
      args: [...DEFAULT_ARGS, ...launchOptions.value.split(" ")],
      // zipValve: '',
      // zipMod: '',
    };
    start(params);
    loading.value = false;
    showXashSettingUI.value = false;
  };

  return {
    memory,
    selectedGame,
    loading,
    loadingProgress,
    showXashSettingUI,
    launchOptions,
    downloadZip,
    setStatus,
    startXash,
  };
});
