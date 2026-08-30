// 1e2bd73662 — a page can neither be offered for installation nor ask which of
// its related applications are already installed
(() => {
  register({
    id: "pwa-install",
    commit: "1e2bd73662",
    redGated: true,
    run() {
      const left = present(["BeforeInstallPromptEvent",
                            "navigator.getInstalledRelatedApps"]);
      // Event handler slots answer to `in`, not to a property read.
      for (const handler of ["onbeforeinstallprompt", "onappinstalled"]) {
        if (handler in window) {
          left.push(handler);
        }
      }
      return {ok: left.length === 0,
              detail: left.length ? "still present: " + left.join(", ")
                                  : "all four absent"};
    },
  });
})();
