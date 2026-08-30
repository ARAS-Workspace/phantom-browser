// a2b457f072 — nothing that enumerates attached hardware
(() => {
  register({
    id: "device-apis",
    commit: "a2b457f072",
    redGated: true,
    run() {
      const left = present(["navigator.usb", "navigator.hid", "navigator.bluetooth",
                            "navigator.serial", "navigator.getGamepads"]);
      return {ok: left.length === 0,
              detail: left.length ? "still present: " + left.join(", ")
                                  : "all five undefined"};
    },
  });
})();
