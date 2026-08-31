// The runtime every file under checks/ registers into. A check declares what it
// is a witness for and returns a verdict; it never formats or posts anything.

const CHECKS = [];

// A check file that fails to parse simply never registers, which would shrink
// the run without failing it. Watch for that before anything else loads.
const LOAD_ERRORS = [];
addEventListener("error", (event) => {
  if (event.target instanceof HTMLScriptElement) {
    LOAD_ERRORS.push("did not load: " + event.target.src);
  } else {
    LOAD_ERRORS.push(event.message || String(event.error));
  }
}, true);

function register(check) {
  CHECKS.push(check);
}

// Walks a dotted path from the global object. Names are written without a
// "self." prefix: "navigator.usb", "BatteryManager".
const get = (path) =>
    path.split(".").reduce((obj, key) => (obj == null ? obj : obj[key]), self);

// The names from `names` that are still reachable.
const present = (names) => names.filter((n) => get(n) !== undefined);

function gl(kind) {
  const canvas = document.createElement("canvas");
  return canvas.getContext(kind === 2 ? "webgl2" : "webgl");
}

async function runAll() {
  const files = self.CHECK_FILES || [];
  const results = [{
    id: "harness-integrity",
    commit: "-",
    red_gated: false,
    ok: LOAD_ERRORS.length === 0,
    detail: LOAD_ERRORS.length
        ? "script errors: " + LOAD_ERRORS.join(" | ")
        : CHECKS.length + " checks registered from " + files.length + " files",
  }];
  for (const check of CHECKS) {
    let verdict;
    try {
      verdict = await check.run();
    } catch (e) {
      // One check throwing must not take the other twenty with it.
      verdict = {ok: false, detail: "check threw: " + e};
    }
    results.push({
      id: check.id,
      commit: check.commit,
      red_gated: !!check.redGated,
      manual: !!check.manual,
      ok: !!verdict.ok,
      detail: String(verdict.detail),
    });
  }
  await fetch("/result", {method: "POST", body: JSON.stringify(results)});
  document.body.textContent = "done";
}
