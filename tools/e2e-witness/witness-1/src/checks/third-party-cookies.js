// 753860a02b — a third-party origin cannot store a cookie; the same server
// reached first-party over 127.0.0.1 still can, which is the control
(() => {
  register({
    id: "third-party-cookies",
    commit: "753860a02b",
    async run() {
      const thirdParty = self.THIRD_PARTY_ORIGIN;
      const firstParty = self.SECOND_ORIGIN;
      if (!thirdParty || !firstParty) {
        return {ok: false, detail: "the two origins were not served"};
      }
      const roundTrip = async (origin, name) => {
        await fetch(origin + "/set?name=" + name,
                    {credentials: "include", cache: "no-store"});
        const seen = await (await fetch(origin + "/echo",
                                        {credentials: "include",
                                         cache: "no-store"})).json();
        return (seen.cookie || "").includes(name);
      };
      let stored, control;
      try {
        control = await roundTrip(firstParty, "phantom_1p");
        stored = await roundTrip(thirdParty, "phantom_3p");
      } catch (e) {
        return {ok: false, detail: String(e)};
      }
      return {
        // The control has to hold, or this check is measuring a broken setup
        // rather than the cookie setting.
        ok: !stored && control,
        detail: "third-party cookie: " + (stored ? "STORED" : "blocked") +
                " ; first-party control: " + (control ? "stored" : "NOT STORED"),
      };
    },
  });
})();
