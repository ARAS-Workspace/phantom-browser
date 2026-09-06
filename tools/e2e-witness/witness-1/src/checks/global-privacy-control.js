// 796c7da1a5 — Global Privacy Control is on for everyone: the navigator flag is
// true and every request carries Sec-GPC: 1
(() => {
  register({
    id: "global-privacy-control",
    commit: "796c7da1a5",
    async run() {
      const flag = navigator.globalPrivacyControl;
      let seen;
      try {
        seen = await (await fetch("/gpc", {cache: "no-store"})).json();
      } catch (e) {
        return {ok: false, detail: String(e)};
      }
      return {
        ok: flag === true && seen["sec-gpc"] === "1",
        detail: "navigator.globalPrivacyControl=" + flag +
                " Sec-GPC=" + seen["sec-gpc"],
      };
    },
  });
})();
