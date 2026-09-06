// 796c7da1a5 — every WebRTC host candidate names a .local mDNS name, never a
// local IP address
(() => {
  const PRIVATE_V4 = /\b(10|127|172\.(1[6-9]|2\d|3[01])|192\.168)\.\d+\.\d+\b/;

  register({
    id: "webrtc-mdns",
    commit: "796c7da1a5",
    async run() {
      const pc = new RTCPeerConnection({iceServers: []});
      const hosts = [];
      const done = new Promise((resolve) => {
        pc.onicecandidate = (event) => {
          if (!event.candidate) {
            resolve();
            return;
          }
          if (event.candidate.type === "host") {
            hosts.push(event.candidate);
          }
        };
        setTimeout(resolve, 4000);
      });
      pc.createDataChannel("witness");
      await pc.setLocalDescription(await pc.createOffer());
      await done;
      pc.close();
      const leaked = hosts.filter((c) => !/\.local$/.test(c.address || "") ||
                                         PRIVATE_V4.test(c.candidate));
      return {
        ok: hosts.length > 0 && leaked.length === 0,
        detail: "host candidates=" + hosts.length +
                (leaked.length ? " leaking: " +
                    leaked.map((c) => c.address).join(", ")
                               : " all .local"),
      };
    },
  });
})();
