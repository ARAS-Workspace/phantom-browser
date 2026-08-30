// 9ec6c28a0f — a fixed us layout, never the one the system has installed
(() => {
  const EXPECTED_ENTRIES = 47;
  const SPOT_CHECKS = {KeyQ: "q", KeyA: "a", Digit1: "1", Slash: "/"};

  register({
    id: "keyboard-layout",
    commit: "9ec6c28a0f",
    async run() {
      let map;
      try {
        map = await navigator.keyboard.getLayoutMap();
      } catch (e) {
        return {ok: false, detail: String(e)};
      }
      const wrong = Object.entries(SPOT_CHECKS)
          .filter(([code, key]) => map.get(code) !== key)
          .map(([code, key]) => code + " should be " + key);
      return {
        ok: map.size === EXPECTED_ENTRIES && wrong.length === 0,
        detail: "size=" + map.size + " KeyQ=" + map.get("KeyQ") +
                " Semicolon=" + map.get("Semicolon") +
                (wrong.length ? " mismatched: " + wrong.join(", ") : ""),
      };
    },
  });
})();
