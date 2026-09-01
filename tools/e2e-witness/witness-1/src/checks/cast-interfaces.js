// 4699da641c — nothing a page can ask about presenting to a screen, or about
// playing back on one, is defined any more.
(() => {
  const GLOBALS = [
    "Presentation", "PresentationAvailability", "PresentationConnection",
    "PresentationConnectionAvailableEvent", "PresentationConnectionCloseEvent",
    "PresentationConnectionList", "PresentationReceiver", "PresentationRequest",
    "RemotePlayback", "navigator.presentation",
  ];
  // Read as own properties rather than through `get`, because touching these
  // two on the prototype would run their getter with the wrong receiver.
  const MEDIA_ATTRS = ["remote", "disableRemotePlayback"];

  register({
    id: "cast-interfaces",
    commit: "4699da641c",
    redGated: true,
    run() {
      const left = present(GLOBALS);
      const proto = self.HTMLMediaElement && self.HTMLMediaElement.prototype;
      for (const attr of MEDIA_ATTRS) {
        if (proto && attr in proto) {
          left.push("HTMLMediaElement." + attr);
        }
      }
      return {ok: left.length === 0,
              detail: left.length ? "still present: " + left.join(", ")
                                  : "all twelve undefined"};
    },
  });
})();
