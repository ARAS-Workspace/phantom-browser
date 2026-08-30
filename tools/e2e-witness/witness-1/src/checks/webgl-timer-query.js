// faa8d29943 — the one primitive that separates otherwise identical machines
(() => {
  const TIMER_EXTENSIONS =
      ["EXT_disjoint_timer_query", "EXT_disjoint_timer_query_webgl2"];

  register({
    id: "webgl-timer-query",
    commit: "faa8d29943",
    run() {
      const found = [];
      for (const version of [1, 2]) {
        const ctx = gl(version);
        if (!ctx) {
          found.push("webgl" + version + ":no-context");
          continue;
        }
        const supported = ctx.getSupportedExtensions() || [];
        for (const name of TIMER_EXTENSIONS) {
          if (supported.includes(name)) {
            found.push("webgl" + version + " lists " + name);
          }
          if (ctx.getExtension(name)) {
            found.push("webgl" + version + " getExtension " + name);
          }
        }
      }
      return {ok: found.length === 0,
              detail: found.length ? found.join(", ")
                                   : "absent from webgl1 and webgl2"};
    },
  });
})();
