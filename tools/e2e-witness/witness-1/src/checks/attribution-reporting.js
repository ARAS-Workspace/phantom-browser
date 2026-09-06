// 3c6e7f2072 — the Attribution Reporting API is not exposed to pages; --red
// turns ConversionMeasurement back on
(() => {
  register({
    id: "attribution-reporting",
    commit: "3c6e7f2072",
    redGated: true,
    run() {
      const anchor = "attributionSrc" in HTMLAnchorElement.prototype;
      const xhr = "setAttributionReporting" in XMLHttpRequest.prototype;
      return {
        ok: !anchor && !xhr,
        detail: "a.attributionSrc: " + (anchor ? "PRESENT" : "absent") +
                ", xhr.setAttributionReporting: " +
                (xhr ? "PRESENT" : "absent"),
      };
    },
  });
})();
