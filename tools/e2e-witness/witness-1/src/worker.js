const undef = (p) => { try { return eval(p) === undefined; } catch (e) { return true; } };
const leftover = [];
for (const n of ["navigator.usb", "navigator.hid", "navigator.serial",
                 "navigator.connection", "navigator.deviceMemory"]) {
  if (!undef(n)) leftover.push(n);
}
if (navigator.hardwareConcurrency !== 8) {
  leftover.push("hardwareConcurrency=" + navigator.hardwareConcurrency);
}
try {
  const c = new OffscreenCanvas(16, 16);
  const ctx = c.getContext("webgl");
  if (ctx) {
    for (const n of ["EXT_disjoint_timer_query", "EXT_disjoint_timer_query_webgl2"]) {
      if ((ctx.getSupportedExtensions() || []).includes(n)) leftover.push("worker gl " + n);
    }
  }
} catch (e) { leftover.push("offscreen: " + e); }
postMessage({leftover});
