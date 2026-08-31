// 99d4bb62b9 — every position resolves to the same fixed point
(() => {
  const FIXED = {latitude: 39.925, longitude: 32.836944};

  register({
    id: "geolocation",
    commit: "99d4bb62b9",
    // Chromium grants this only through a prompt or devtools, and neither the
    // seeded profile nor the policy pref reaches the decision, so the fixed
    // point is confirmed by hand and this row is reported, not counted.
    manual: true,
    async run() {
      const answer = await new Promise((resolve) => {
        if (!navigator.geolocation) {
          return resolve({err: "no geolocation object"});
        }
        navigator.geolocation.getCurrentPosition(
            (p) => resolve({lat: p.coords.latitude, lon: p.coords.longitude}),
            (e) => resolve({err: e.code === 1
                ? "PERMISSION_DENIED (preferences seeding failed)"
                : "error " + e.code + " " + e.message}),
            {timeout: 15000, maximumAge: 0});
      });
      return {
        ok: Math.abs(answer.lat - FIXED.latitude) < 1e-6 &&
            Math.abs(answer.lon - FIXED.longitude) < 1e-6,
        detail: answer.err ? answer.err
                           : "lat=" + answer.lat + " lon=" + answer.lon,
      };
    },
  });
})();
