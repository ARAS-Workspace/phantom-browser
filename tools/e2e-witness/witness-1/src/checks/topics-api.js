// 3c6e7f2072 — the Topics API is not exposed to pages; --red turns
// BrowsingTopics back on
(() => {
  register({
    id: "topics-api",
    commit: "3c6e7f2072",
    redGated: true,
    run() {
      const present = "browsingTopics" in document;
      return {
        ok: !present,
        detail: "document.browsingTopics: " + (present ? "PRESENT" : "absent"),
      };
    },
  });
})();
