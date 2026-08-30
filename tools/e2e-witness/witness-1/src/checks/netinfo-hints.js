// 29df60052d — the header half: a fixed fast connection, the same for every host
(() => {
  const EXPECTED_HINTS = {rtt: "50", downlink: "10", ect: "4g"};

  register({
    id: "netinfo-hints",
    commit: "29df60052d",
    async run() {
      let seen;
      try {
        seen = await (await fetch("/hints", {cache: "no-store"})).json();
      } catch (e) {
        return {ok: false, detail: String(e)};
      }
      const ok = Object.entries(EXPECTED_HINTS)
          .every(([name, value]) => seen[name] === value);
      return {
        ok,
        detail: "rtt=" + seen.rtt + " downlink=" + seen.downlink +
                " ect=" + seen.ect + " device-memory=" + seen["device-memory"],
      };
    },
  });
})();
