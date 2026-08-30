// Not witnesses: if either of these fails the run is measuring nothing, because
// most of the surfaces we closed are SecureContext gated and would read as
// absent on an insecure origin whatever we did.
(() => {
  register({
    id: "secure-context",
    commit: "-",
    run() {
      return {ok: self.isSecureContext === true,
              detail: "isSecureContext=" + self.isSecureContext};
    },
  });

  register({
    id: "positive-control",
    commit: "-",
    run() {
      return {
        ok: crypto.subtle !== undefined && navigator.credentials !== undefined,
        detail: "crypto.subtle and navigator.credentials must still exist",
      };
    },
  });
})();
