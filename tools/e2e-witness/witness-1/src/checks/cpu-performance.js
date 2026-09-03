// 4a56795206 — the one to four hardware class must not be readable
(() => {
  register({
    id: "cpu-performance",
    commit: "4a56795206",
    redGated: true,
    run() {
      return {ok: navigator.cpuPerformance === undefined,
              detail: "navigator.cpuPerformance=" + navigator.cpuPerformance};
    },
  });
})();
