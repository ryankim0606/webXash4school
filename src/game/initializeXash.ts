import BrowserFS, {
  BFSRequire,
  FileSystem,
  EmscriptenFS,
  install,
  configure,
} from "browserfs";
import ZipFS from "browserfs/src/backend/ZipFS";

interface XashOptions {
  memory: number;
  gamePackage: string;
  useLocalGame: boolean;
}

const initializeXash = (options: XashOptions) => {
  const canvas = document.getElementById("canvas");

  window.addEventListener("resize", () => {
    console.log("resize");
    canvas.setAttribute("height", window.innerHeight.toString());
    canvas.setAttribute("height", window.innerWidth.toString());
    window.Module["_Emscripten_HandleCanvasResize"]?.();
  });

  var statusElement = document.getElementById("status");
  var progressElement = document.getElementById("progress");
  var asyncDialog = document.getElementById("asyncDialog");
  var myerrorbuf = "";
  var myerrordate = new Date();
  var mounted = false;
  var gamedir = "valve";
  var moduleCount = 0;
  var mem = 150;
  var mfs;
  var zipSize;

  const zipMods = [
    ["hldm.zip", "HLDM (64M)", 64654514],
    ["uplink.zip", "Uplink (30M)", 30578171],
    ["hc.zip", "Hazard Course (23M)", 23391374],
    ["dayone.zip", "Day One (78M)", 78804629],
  ];

  const aczMods = [
    ["hldm-cache.html", "HLDM (64M)", 64654514],
    ["hldm-cache-split.html", "HLDM Split (64M)", 64654514],
    ["uplink-cache.html", "Uplink (30M)", 30578171],
    ["hc-cache.html", "Hazard Course (23M)", 23391374],
  ];

  const pkgMods = [
    ["hldm.js", "HLDM (85M)"],
    ["uplink.js", "Uplink (45M)"],
    ["hc.js", "Hazard Course (33M)"],
  ];

  var Module = {
    TOTAL_MEMORY: mem * 1024 * 1024,
    preRun: [],
    postRun: [],
    print: (function () {
      var element = document.getElementById("output");
      if (element) element.value = ""; // clear browser cache
      return function (text) {
        if (arguments.length > 1)
          text = Array.prototype.slice.call(arguments).join(" ");

        console.log(text);
        if (text) myerrorbuf += text + "\n";
        if (element) {
          if (element.value.length > 65536)
            element.value = element.value.substring(512) + myerrorbuf;
          else element.value += myerrorbuf;
          element.scrollTop = element.scrollHeight; // focus on bottom
        }
        myerrorbuf = "";
      };
    })(),
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

      // statusElement.innerHTML = text;
      console.log(text);
      if (progressElement) {
        var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);

        if (m) {
          var progress = Math.round((parseInt(m[2]) * 100) / parseInt(m[4]));
          progressElement.style.color = progress > 5 ? "#303030" : "#aaa000";
          progressElement.style.width = progressElement.innerHTML =
            "" + progress + "%";
        }
      }
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

  function loadModule(name) {
    var script = document.createElement("script");
    script.onload = function () {
      moduleCount++;
      if (moduleCount == 3) {
        Module.setStatus("Scripts downloaded!");
      }
    };
    document.body.appendChild(script);
    script.src = name + ".js";
  }

  window.onerror = function (event) {
    if (mounted)
      window.FS.syncfs(false, function (err) {
        Module.print("Saving IDBFS: " + err);
      });
    if (("" + event).indexOf("SimulateInfiniteLoop") > 0) return;
    var text = "Exception thrown: " + event;
    text = text.replace(/&/g, "&amp;");
    text = text.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");
    text = text.replace("\n", "<br>", "g");
    Module.setStatus(text);
    Module.print("Exception thrown: " + event);
  };

  function haltRun() {}

  var savedRun;

  function radioChecked(id) {
    var r = document.getElementById("r" + id);
    if (r) return r.checked;
    return false;
  }
  function showElement(id, show) {
    var e = document.getElementById(id);
    if (!e) return;
    e.style.display = show ? "block" : "none";
  }

  window.showElement = showElement;

  Module.setStatus("Downloading...");

  function startXash() {
    setupFS();
    Module.arguments = [
      `-height ${window.innerHeight}`,
      `-width ${window.innerWidth}`,
    ]; //document.getElementById("iArgs").value.split(" ");
    Module.run = window.run = savedRun;
    // if (radioChecked("Zip"))
    // fetchZIP(options.gamePackage, savedRun);
    // else if ((!zipMods.length && !pkgMods.length) || radioChecked("LocalZip")) {
    //   var reader = new FileReader();
    //   reader.onload = function () {
    //     mountZIP(reader.result);
    //     Module.print("Loaded zip data");
    //     savedRun();
    //   };
    //   reader.readAsArrayBuffer(document.getElementById("iZipFile").files[0]);
    //   // TODO: make this default properly

    var script = document.createElement("script");
    script.onload = savedRun;
    document.body.appendChild(script);
    script.src = options.gamePackage;

    // showElement("canvas", true);

    window.addEventListener("beforeunload", function (e) {
      var confirmationMessage = "Leave the game?";

      (e || window.event).returnValue = confirmationMessage; //Gecko + IE
      return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
    });
  }

  function mountZIP(data) {
    var Buffer = BFSRequire("buffer").Buffer;
    install(window);
    // mfs.mount("/zip", new FileSystem.ZipFS(Buffer.from(data)));
    configure(
      {
        fs: "MountableFileSystem",
        options: {
          "/zip": {
            fs: "ZipFS",
            options: {
              // Wrap as Buffer object.
              zipData: Buffer.from(data),
            },
          },
        },
      },
      function (e) {
        if (e) {
          // An error occurred.
          throw e;
        }
        // Otherwise, BrowserFS is ready to use!
      }
    );
    window.FS.mount(new EmscriptenFS(), { root: "/zip" }, "/rodir");
  }

  function fetchZIP(packageName, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", packageName, true);
    xhr.responseType = "arraybuffer";

    xhr.onprogress = function (event) {
      var url = packageName;
      var size;
      if (event.total) size = event.total;
      else
        size = zipMods[document.getElementById("selectZip").selectedIndex][2];
      if (event.loaded) {
        var total = size;
        var loaded = event.loaded;
        var num = 0;
        console.log(loaded + "/" + total);
      } else if (!Module.dataFileDownloads) {
        if (Module["setStatus"]) Module["setStatus"]("Downloading data...");
      }
    };
    xhr.onerror = function (event) {
      throw new Error("NetworkError");
    };
    xhr.onload = function (event) {
      if (
        xhr.status == 200 ||
        xhr.status == 304 ||
        xhr.status == 206 ||
        (xhr.status == 0 && xhr.response)
      ) {
        // file URLs can return 0
        mountZIP(xhr.response);
        cb();
      } else {
        throw new Error(xhr.statusText + " : " + xhr.responseURL);
      }
    };
    xhr.send(null);
  }

  function setupFS() {
    window.FS.mkdir("/rodir");
    window.FS.mkdir("/xash");
    try {
      // mfs = new FileSystem.MountableFileSystem();
      // BrowserFS.initialize(mfs);
    } catch (e) {
      mfs = undefined;
      Module.print("Failed to initialize BrowserFS: " + e);
    }

    if (radioChecked("IndexedDB")) {
      window.FS.mount(window.IDBFS, {}, "/xash");
      window.FS.syncfs(true, function (err) {
        if (err) Module.print("Loading IDBFS: " + err);
      });
      mounted = true;
    }

    if (radioChecked("LocalStorage") && mfs) {
      mfs.mount("/ls", new BrowserFS.FileSystem.LocalStorage());
      window.FS.mount(new BrowserFS.EmscriptenFS(), { root: "/ls" }, "/xash");
      Module.print("LocalStorage mounted");
    }

    window.FS.chdir("/xash/");
  }
  function skipRun() {
    savedRun = run;
    Module.run = haltRun;
    run = haltRun;

    Module.setStatus("Engine downloaded!");
    // showElement("loader1", false);
    // showElement("optionsTitle", true);

    if (
      window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB
    ) {
      window.ENV.XASH3D_GAMEDIR = gamedir;
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

  (function () {
    var memoryInitializer = "xash.html.mem";
    if (typeof Module["locateFile"] === "function") {
      memoryInitializer = Module["locateFile"](memoryInitializer);
    } else if (Module["memoryInitializerPrefixURL"]) {
      memoryInitializer =
        Module["memoryInitializerPrefixURL"] + memoryInitializer;
    }
    var xhr = (Module["memoryInitializerRequest"] = new XMLHttpRequest());
    xhr.open("GET", memoryInitializer, true);
    xhr.responseType = "arraybuffer";
    xhr.send(null);
  })();

  var script = document.createElement("script");
  script.src = "xash.js";
  document.body.appendChild(script);
  window.startXash = startXash;
};
export default initializeXash;
