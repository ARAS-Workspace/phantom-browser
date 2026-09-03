// 0f3396ffdd — the translator and language detector interfaces gave a page a
// scripted path to a service that fetches a translation library and language
// packs from the component updater; neither may exist
(() => {
  const INTERFACES = ["Translator", "LanguageDetector"];

  register({
    id: "on-device-translation",
    commit: "0f3396ffdd",
    redGated: true,
    run() {
      const left = present(INTERFACES);
      return {ok: left.length === 0,
              detail: left.length ? "still present: " + left.join(", ")
                                  : "neither interface is defined"};
    },
  });
})();
