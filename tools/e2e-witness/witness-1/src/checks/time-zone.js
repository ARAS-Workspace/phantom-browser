// ee66774f4f — the browser is launched in America/Los_Angeles, so agreeing with
// the host would be the failure here
(() => {
  const EXPECTED_ZONE = "UTC";

  register({
    id: "time-zone",
    commit: "ee66774f4f",
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
