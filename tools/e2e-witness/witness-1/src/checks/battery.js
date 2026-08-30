// 5c2ec8efe2 — the battery status api must not be reachable
(() => {
  register({
    id: "battery",
    commit: "5c2ec8efe2",
    redGated: true,
    run() {
      const left = present(["navigator.getBattery", "BatteryManager"]);
      return {ok: left.length === 0,
              detail: left.length ? "still present: " + left.join(", ")
                                  : "both undefined"};
    },
  });
})();
