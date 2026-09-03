// 0b6c6c7148 — the memory tier is not exposed and the core count is fixed
(() => {
  register({
    id: "device-memory",
    commit: "0b6c6c7148",
    run() {
      return {
        ok: navigator.deviceMemory === undefined &&
            navigator.hardwareConcurrency === 8,
        detail: "deviceMemory=" + navigator.deviceMemory +
                " hardwareConcurrency=" + navigator.hardwareConcurrency,
      };
    },
  });
})();
