// 84816e57a9 — only typefaces shipped inside the system font directory resolve.
//
// document.fonts.check() answers true for a family that does not exist at all,
// so the only honest probe is the width comparison an attacker uses.
(() => {
  const SYSTEM_FONTS = ["Helvetica", "Menlo", "Arial", "Times New Roman", "Georgia"];
  const USER_FONT = "IBM Plex Mono";

  function fontResolves(name) {
    const ctx = document.createElement("canvas").getContext("2d");
    const probe = "mmmmmmmmmmlliWWWW0123456789";
    return ["monospace", "sans-serif", "serif"].some((generic) => {
      ctx.font = "72px " + generic;
      const base = ctx.measureText(probe).width;
      ctx.font = "72px '" + name + "', " + generic;
      return ctx.measureText(probe).width !== base;
    });
  }

  // The probe must tell a real family from an invented one, or the check below is
  // decoration. Apple Color Emoji cannot be probed this way at all: emoji fall
  // back to it whatever family is asked for, so both sides measure the same glyphs.
  register({
    id: "font-probe-control",
    commit: "84816e57a9",
    async run() {
      await document.fonts.ready;
      return {
        ok: fontResolves("Helvetica") && !fontResolves("ZzNoSuchFamilyZz"),
        detail: "probe must see Helvetica and must not see an invented family",
      };
    },
  });

  register({
    id: "font-filter",
    commit: "84816e57a9",
    async run() {
      await document.fonts.ready;
      const probeWorks =
          fontResolves("Helvetica") && !fontResolves("ZzNoSuchFamilyZz");
      const user = fontResolves(USER_FONT);
      // Two from /System/Library/Fonts and three from its Supplemental folder, so
      // both halves of the directory rule are exercised.
      const absent = SYSTEM_FONTS.filter((n) => !fontResolves(n));
      return {
        ok: probeWorks && user === false && absent.length === 0,
        detail: "user font '" + USER_FONT + "' resolves=" + user +
                (absent.length
                    ? " ; system fonts NOT resolving: " + absent.join(", ")
                    : " ; five system fonts from both allowed folders resolve"),
      };
    },
  });
})();
