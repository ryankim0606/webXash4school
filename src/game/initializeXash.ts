interface XashOptions {
  memory: number;
  gamePackage: string;
  useLocalGame: boolean;
}

// Unused BrowserFS vars
// let mounted = false;
// let mfs;
// let zipSize;

const GAME_DIR = "valve";
const DEFAULT_MEM = 150;
let myerrorbuf = "";
let myerrordate = new Date();
let moduleCount = 0;
let savedRun;
let canvas = document.getElementById("canvas") || null;

let Module = {
  TOTAL_MEMORY: DEFAULT_MEM * 1024 * 1024,
  preRun: [],
  postRun: [],
  print: (text) => console.log(text),
  printErr: function (text) {
    if (arguments.length > 1)
      text = Array.prototype.slice.call(arguments).join(" ");
    if (0) {
      // XXX disabled for safety typeof dump == 'function') {
      window.dump(text + "\n"); // fast, straight to the real console
    } else {
      if (myerrorbuf.length > 2048)
        myerrorbuf = "some lines skipped\n" + myerrorbuf.substring(512);
      myerrorbuf += text + "\n";
      if (new Date() - myerrordate > 3000) {
        myerrordate = new Date();
        Module.print();
      }
    }
  },
  canvas: (function () {
    console.log(canvas);
    // As a default initial behavior, pop up an alert when webgl context is lost. To make your
    // application robust, you may want to override this behavior before shipping!
    // See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
    // TODO: add this
    canvas.addEventListener(
      "webglcontextlost",
      function (e) {
        alert("WebGL context lost. You will need to reload the page.");
        e.preventDefault();
      },
      false
    );

    return canvas;
  })(),
  setStatus: function (text) {
    if (!Module.setStatus.last)
      Module.setStatus.last = { time: Date.now(), text: "" };
    if (text === Module.setStatus.text) return;
    if (new Date() - myerrordate > 3000) {
      myerrordate = new Date();
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
    console.warn("finished adding scripts");
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

const initializeXash = (options: XashOptions) => {
  if (!canvas) throw new Error("Canvas not found!");

  Module.setStatus("Downloading...");

  function startXash() {
    setupFS();
    Module.arguments = [
      `-height ${window.innerHeight}`,
      `-width ${window.innerWidth}`,
    ];
    Module.run = window.run = savedRun;
    // TODO: Get newer browserFS working with this.
    // fetchZIP(options.gamePackage, savedRun);

    let script = document.createElement("script");
    // script.onload = savedRun;
    script.onload = () => {
      console.log("finishedDownloadingScript, starting");
      savedRun();
    };
    document.body.appendChild(script);
    script.src = options.gamePackage;

    window.addEventListener("beforeunload", function (e) {
      const confirmationMessage = "Leave the game?";

      (e || window.event).returnValue = confirmationMessage; //Gecko + IE
      return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
    });
  }

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
  //       console.log(loaded + "/" + total);
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

  function setupFS() {
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
  }
  function skipRun() {
    savedRun = run;
    Module.run = haltRun;
    run = haltRun;

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
  }

  Module.preInit = [skipRun];
  Module.websocket = [];
  Module.websocket.url = "wsproxy://the-swank.pp.ua:3000/";
  window.Module = Module;
  window.ENV = [];

  let memoryInitializer = "xash.html.mem";
  if (typeof Module["locateFile"] === "function") {
    memoryInitializer = Module["locateFile"](memoryInitializer);
  } else if (Module["memoryInitializerPrefixURL"]) {
    memoryInitializer =
      Module["memoryInitializerPrefixURL"] + memoryInitializer;
  }
  let xhr = (Module["memoryInitializerRequest"] = new XMLHttpRequest());
  xhr.open("GET", memoryInitializer, true);
  xhr.responseType = "arraybuffer";
  xhr.send(null);

  let script = document.createElement("script");
  script.src = "xash.js";
  document.body.appendChild(script);
  window.startXash = startXash;

  // Resize Canvas size when resizing window
  window.addEventListener("resize", () => {
    if (!canvas) return;
    canvas.setAttribute("height", window.innerHeight.toString());
    canvas.setAttribute("height", window.innerWidth.toString());
    window.Module["_Emscripten_HandleCanvasResize"]?.();
  });
};
export default initializeXash;
