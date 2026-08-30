// 66dd8125a5 — the interface objects follow the disabled list off the global
(() => {
  register({
    id: "gamepad-interfaces",
    commit: "66dd8125a5",
    redGated: true,
    run() {
      const left = present(["Gamepad", "GamepadButton", "GamepadEvent",
                            "GamepadHapticActuator"]);
      return {ok: left.length === 0,
              detail: left.length ? "still present: " + left.join(", ")
                                  : "all four undefined"};
    },
  });
})();
