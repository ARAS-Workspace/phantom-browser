// e1a38e77ff — the battery status api must not be reachable
(() => {
  register({
    id: "battery",
    commit: "e1a38e77ff",
    redGated: true,
    run() {
      const left = present(["navigator.getBattery", "BatteryManager"]);
      return {ok: left.length === 0,
              detail: left.length ? "still present: " + left.join(", ")
                                  : "both undefined"};
    },
  });
})();
