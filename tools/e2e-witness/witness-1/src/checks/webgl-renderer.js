// 513405f6da — the debug renderer info extension stays, but it answers two
// fixed safari strings instead of the metal device name
(() => {
  const EXPECTED = {renderer: "Apple GPU", vendor: "Apple Inc."};

  register({
    id: "webgl-renderer",
    commit: "513405f6da",
    run() {
      const ctx = gl(1);
      if (!ctx) {
        return {ok: false, detail: "no webgl context"};
      }
      const debugInfo = ctx.getExtension("WEBGL_debug_renderer_info");
      if (!debugInfo) {
        return {ok: false, detail: "WEBGL_debug_renderer_info absent"};
      }
      const renderer = ctx.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const vendor = ctx.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      return {
        ok: renderer === EXPECTED.renderer && vendor === EXPECTED.vendor,
        detail: "renderer=" + renderer + " vendor=" + vendor,
      };
    },
  });
})();
