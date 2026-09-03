// 03d3f2d1b9 — no page may ask for the list of installed typefaces
(() => {
  register({
    id: "local-font-access",
    commit: "03d3f2d1b9",
    redGated: true,
    run() {
      const left = present(["queryLocalFonts", "FontData"]);
      return {ok: left.length === 0,
              detail: left.length ? "still present: " + left.join(", ")
                                  : "both undefined"};
    },
  });
})();
