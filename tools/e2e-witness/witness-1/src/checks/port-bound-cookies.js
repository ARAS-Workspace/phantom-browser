// 77d44480e5 — a cookie set on this origin's port is not sent to the same host on
// another port; --red turns EnablePortBoundCookies back off
(() => {
  register({
    id: "port-bound-cookies",
    commit: "77d44480e5",
    redGated: true,
    async run() {
      const other = self.SECOND_ORIGIN;
      if (!other) {
        return {ok: false, detail: "no second origin was served"};
      }
      document.cookie = "phantom_pbc=1; path=/";
      let seen;
      try {
        seen = await (await fetch(other + "/echo",
                                  {credentials: "include", cache: "no-store"}))
            .json();
      } catch (e) {
        return {ok: false, detail: String(e)};
      }
      const sent = (seen.cookie || "").includes("phantom_pbc");
      return {
        ok: !sent,
        detail: "cookie on other port: " + (sent ? "SENT" : "withheld") +
                " (" + other + ")",
      };
    },
  });
})();
