// 2214ea3f1f — the interface objects follow the disabled list off the global
(() => {
  register({
    id: "gamepad-interfaces",
    commit: "2214ea3f1f",
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
