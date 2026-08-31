// 43573e45f5 — the shape detection api handed any image a page chose to the
// system vision framework; none of its three detectors may exist
(() => {
  const DETECTORS = ["BarcodeDetector", "FaceDetector", "TextDetector"];

  register({
    id: "shape-detection",
    commit: "43573e45f5",
    redGated: true,
    run() {
      const left = present(DETECTORS);
      return {ok: left.length === 0,
              detail: left.length ? "still present: " + left.join(", ")
                                  : "all three detectors undefined"};
    },
  });
})();
