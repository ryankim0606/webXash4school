import { useXashStore } from "@/stores/store";

// Unused BrowserFS vars
// let mounted = false;
// let mfs;
// let zipSize;

interface XashModule {
  [key: string]: any;
}

const GAME_DIR = "valve";
const XASH_MAIN_SCRIPT = "xash.js";
const DEFAULT_MEM = 150;
const DEFAULT_LAUNCH_PARAMS = [
  "-height",
  `${window.innerHeight}`,
  "-width",
  `${window.innerWidth}`,
  "+hud_scale",
  "2.5",
];
let MEMORY_INITIALIZER = "xash.html.mem";
const canvas = document.getElementById("canvas") || null;
let lastErrorDate = new Date();
let moduleCount = 0;
let savedRun!: () => any;

const setLoadingClass = () => {
  if (canvas) canvas.className += " " + "loading";
};

let Module: XashModule = {
  TOTAL_MEMORY: DEFAULT_MEM * 1024 * 1024,
  preRun: [],
  postRun: [],
  print: (text: any) => {
    if (text === "exit(0)") window.location.reload();
    console.info(text);
  },
  printErr: (text: any) => console.error(text?.toString?.()),
  canvas: (() => {
    // As a default initial behavior, pop up an alert when webgl context is lost. To make your
    // application robust, you may want to override this behavior before shipping!
    // See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
    canvas?.addEventListener(
      "webglcontextlost",
      function (e) {
        alert("WebGL context lost. You will need to reload the page.");
        e.preventDefault();
      },
      false
    );

    return canvas;
  })(),
  setStatus: (text: string) => {
    if (!Module.setStatus.last)
      Module.setStatus.last = { time: Date.now(), text: "" };
    if (text === Module.setStatus.text) return;
    if (new Date() - lastErrorDate > 3000) {
      lastErrorDate = new Date();
      Module.print();
    }
    console.info(text);
  },
  totalDependencies: 0,
  monitorRunDependencies: function (left) {
    this.totalDependencies = Math.max(this.totalDependencies, left);
    if (left)
      Module.setStatus(
        "Preparing... (" +
          (this.totalDependencies - left) +
          "/" +
          this.totalDependencies +
          ")"
      );
  },
};

const loadModule = (name) => {
  let script = document.createElement("script");
  script.onload = function () {
    moduleCount++;
    if (moduleCount == 3) {
      Module.setStatus("Scripts downloaded!");
    }
  };
  document.body.appendChild(script);
  script.src = name + ".js";
};

function haltRun() {}

function showElement() {
  return null;
}
// Must expose showElement to window as xash.js requires it.
window.showElement = showElement;

const setupFS = () => {
  window.FS.mkdir("/rodir");
  window.FS.mkdir("/xash");

  // TODO: Get newer browserFS working with this.
  // try {
  //   mfs = new FileSystem.MountableFileSystem();
  //   BrowserFS.initialize(mfs);
  // } catch (e) {
  //   mfs = undefined;
  //   Module.print("Failed to initialize BrowserFS: " + e);
  // }

  // if (radioChecked("IndexedDB")) {
  //   window.FS.mount(window.IDBFS, {}, "/xash");
  //   window.FS.syncfs(true, function (err) {
  //     if (err) Module.print("Loading IDBFS: " + err);
  //   });
  //   mounted = true;
  // }

  window.FS.chdir("/xash/");
};

// TODO: Get newer browserFS working with this.
// function mountZIP(data) {
//   let Buffer = BFSRequire("buffer").Buffer;
//   install(window);
//   // mfs.mount("/zip", new FileSystem.ZipFS(Buffer.from(data)));
//   configure(
//     {
//       fs: "MountableFileSystem",
//       options: {
//         "/zip": {
//           fs: "ZipFS",
//           options: {
//             // Wrap as Buffer object.
//             zipData: Buffer.from(data),
//           },
//         },
//       },
//     },
//     function (e) {
//       if (e) {
//         // An error occurred.
//         throw e;
//       }
//       // Otherwise, BrowserFS is ready to use!
//     }
//   );
//   window.FS.mount(new EmscriptenFS(), { root: "/zip" }, "/rodir");
// }

// TODO: Get newer browserFS working with this.
// function fetchZIP(packageName, cb) {
//   let xhr = new XMLHttpRequest();
//   xhr.open("GET", packageName, true);
//   xhr.responseType = "arraybuffer";
//
//   xhr.onprogress = function (event) {
//     let url = packageName;
//     let size;
//     if (event.total) size = event.total;
//     else
//       size = zipMods[document.getElementById("selectZip").selectedIndex][2];
//     if (event.loaded) {
//       let total = size;
//       let loaded = event.loaded;
//       let num = 0;
//     } else if (!Module.dataFileDownloads) {
//       if (Module["setStatus"]) Module["setStatus"]("Downloading data...");
//     }
//   };
//   xhr.onerror = function (event) {
//     throw new Error("NetworkError");
//   };
//   xhr.onload = function (event) {
//     if (
//       xhr.status == 200 ||
//       xhr.status == 304 ||
//       xhr.status == 206 ||
//       (xhr.status == 0 && xhr.response)
//     ) {
//       // file URLs can return 0
//       mountZIP(xhr.response);
//       cb();
//     } else {
//       throw new Error(xhr.statusText + " : " + xhr.responseURL);
//     }
//   };
//   xhr.send(null);
// }

const getScript = (scriptName: string, callback: () => any) => {
  const xashStore = useXashStore();
  const req = new XMLHttpRequest();

  // report progress events
  req.onprogress = (event) => {
    if (event.lengthComputable) {
      xashStore.loadingProgress = (event.loaded / event.total) * 100;
      // ...
    } else {
      // Unable to compute progress information since the total size is unknown
    }
  };

  // load responseText into a new script element
  req.onload = () => {
    const script = document.createElement("script");
    script.onload = () => {
      callback();
    };
    document.body.appendChild(script);
    script.src = scriptName;
  };

  req.open("GET", scriptName);
  req.send();
};

const startXash = () => {
  setLoadingClass();
  const xashStore = useXashStore();
  const launchArguments = xashStore.launchOptions?.split(" ");
  setupFS();
  Module.arguments = [...DEFAULT_LAUNCH_PARAMS, ...launchArguments];
  Module.run = window.run = savedRun;

  // TODO: Get newer browserFS working with this.
  // fetchZIP(options.gamePackage, savedRun);

  xashStore.loading = true;
  if (!xashStore.selectedGame) throw "No game selected!";
  getScript(xashStore.selectedGame, () => {
    xashStore.showXashSettingUI = false;
    savedRun();
  });

  window.addEventListener("beforeunload", function (event: BeforeUnloadEvent) {
    const confirmationMessage = "Leave the game?";
    event.returnValue = confirmationMessage; //Gecko + IE
    return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
  });
};

// By default, xash wants to run immediately as xash.js is loaded,
// so we overwrite window.run in order to prevent it from starting
// automatically, then reapply it later on the window, very hacky!
const skipRun = () => {
  savedRun = window.run;
  window.run = haltRun;

  Module.setStatus("Engine downloaded!");

  if (
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB
  ) {
    window.ENV.XASH3D_GAME_DIR = GAME_DIR;
    window.ENV.XASH3D_RODIR = "/rodir";
  }

  loadModule("server");
  loadModule("client");
  loadModule("menu");
};

const initializeXash = () => {
  const xashStore = useXashStore();
  xashStore.loading = true;
  if (!canvas) throw new Error("Canvas not found!");

  Module.setStatus("Downloading...");
  Module.preInit = [skipRun];
  Module.websocket = [];
  Module.websocket.url = "";
  window.Module = Module;
  window.ENV = [];

  if (typeof Module["locateFile"] === "function") {
    MEMORY_INITIALIZER = Module["locateFile"](MEMORY_INITIALIZER);
  } else if (Module["memoryInitializerPrefixURL"]) {
    MEMORY_INITIALIZER =
      Module["memoryInitializerPrefixURL"] + MEMORY_INITIALIZER;
  }

  const xhr = (Module["memoryInitializerRequest"] = new XMLHttpRequest());
  xhr.open("GET", MEMORY_INITIALIZER, true);
  xhr.responseType = "arraybuffer";
  xhr.send(null);

  getScript(XASH_MAIN_SCRIPT, () => {
    xashStore.loading = false;
  });

  // Resize Canvas size when resizing window
  window.addEventListener("resize", () => {
    if (!canvas) return;
    canvas.setAttribute("height", window.innerHeight.toString());
    canvas.setAttribute("height", window.innerWidth.toString());
    Module["_Emscripten_HandleCanvasResize"]?.();
  });
};
export { initializeXash, startXash };
