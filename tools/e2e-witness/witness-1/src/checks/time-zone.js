// 96508b24f5 — the browser is launched in America/Los_Angeles, so agreeing with
// the host would be the failure here
(() => {
  const EXPECTED_ZONE = "UTC";

  register({
    id: "time-zone",
    commit: "96508b24f5",
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
