// a107586c4d — nothing that enumerates attached hardware
(() => {
  register({
    id: "device-apis",
    commit: "a107586c4d",
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
