// 5ab19bca41 — the script half: navigator.connection is gone
(() => {
  register({
    id: "netinfo-js",
    commit: "5ab19bca41",
    redGated: true,
    run() {
      return {ok: navigator.connection === undefined,
              detail: "navigator.connection=" + navigator.connection};
    },
  });
})();
