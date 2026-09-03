// ed7e9bb3cd — the client hints agree with the frozen user agent instead of
// contradicting it, which would be a worse fingerprint than the real value
(() => {
  const EXPECTED = {platformVersion: "10.15.7", architecture: "x86"};
  const FROZEN_UA_FRAGMENT = "Intel Mac OS X 10_15_7";

  register({
    id: "ua-ch",
    commit: "ed7e9bb3cd",
    async run() {
      let hints;
      try {
        hints = await navigator.userAgentData.getHighEntropyValues(
            ["platformVersion", "architecture", "bitness"]);
      } catch (e) {
        return {ok: false, detail: String(e)};
      }
      const uaFrozen = navigator.userAgent.includes(FROZEN_UA_FRAGMENT);
      return {
        ok: hints.platformVersion === EXPECTED.platformVersion &&
            hints.architecture === EXPECTED.architecture && uaFrozen,
        detail: "platformVersion=" + hints.platformVersion +
                " architecture=" + hints.architecture +
                " bitness=" + hints.bitness + " uaFrozen=" + uaFrozen,
      };
    },
  });
})();
