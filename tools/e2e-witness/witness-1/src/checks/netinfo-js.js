// 29df60052d — the script half: navigator.connection is gone
(() => {
  register({
    id: "netinfo-js",
    commit: "29df60052d",
    redGated: true,
    run() {
      return {ok: navigator.connection === undefined,
              detail: "navigator.connection=" + navigator.connection};
    },
  });
})();
