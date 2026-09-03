// 71aedafa6b — v8 sizes its heap limit from physical memory, so the number a
// page reads must be the same everywhere. One machine can only record it.
(() => {
  register({
    id: "js-heap-limit",
    commit: "71aedafa6b",
    run() {
      const value =
          performance.memory ? performance.memory.jsHeapSizeLimit : undefined;
      return {ok: value !== undefined,
              detail: "jsHeapSizeLimit=" + value +
                      "  (weak on one machine: record and compare)"};
    },
  });
})();
