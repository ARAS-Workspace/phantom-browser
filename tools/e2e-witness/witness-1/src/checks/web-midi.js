// 95dd27a3f2 — the last door onto attached hardware
(() => {
  const MIDI_NAMES = [
    "navigator.requestMIDIAccess", "MIDIAccess", "MIDIInput", "MIDIOutput",
    "MIDIPort", "MIDIInputMap", "MIDIOutputMap", "MIDIMessageEvent",
    "MIDIConnectionEvent",
  ];

  register({
    id: "web-midi",
    commit: "95dd27a3f2",
    redGated: true,
    run() {
      const left = present(MIDI_NAMES);
      return {ok: left.length === 0,
              detail: left.length
                  ? "still present: " + left.join(", ")
                  : "entry point and eight interfaces undefined"};
    },
  });
})();
