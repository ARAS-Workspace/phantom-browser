// 3c6e7f2072 — the Protected Audience API is not exposed to pages; --red
// turns AdInterestGroupAPI and Fledge back on
(() => {
  register({
    id: "protected-audience",
    commit: "3c6e7f2072",
    redGated: true,
    run() {
      const join = "joinAdInterestGroup" in navigator;
      const auction = "runAdAuction" in navigator;
      return {
        ok: !join && !auction,
        detail: "joinAdInterestGroup: " + (join ? "PRESENT" : "absent") +
                ", runAdAuction: " + (auction ? "PRESENT" : "absent"),
      };
    },
  });
})();
