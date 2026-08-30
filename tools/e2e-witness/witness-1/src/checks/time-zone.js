// c82843dc63 — the browser is launched in America/Los_Angeles, so agreeing with
// the host would be the failure here
(() => {
  const EXPECTED_ZONE = "Europe/Istanbul";

  register({
    id: "time-zone",
    commit: "c82843dc63",
    run() {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return {
        ok: zone === EXPECTED_ZONE,
        detail: "timeZone=" + zone + " offset=" + new Date().getTimezoneOffset() +
                " (browser launched in America/Los_Angeles)",
      };
    },
  });
})();
