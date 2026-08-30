// 0b722323b7 — the one to four hardware class must not be readable
(() => {
  register({
    id: "cpu-performance",
    commit: "0b722323b7",
    redGated: true,
    run() {
      return {ok: navigator.cpuPerformance === undefined,
              detail: "navigator.cpuPerformance=" + navigator.cpuPerformance};
    },
  });
})();
