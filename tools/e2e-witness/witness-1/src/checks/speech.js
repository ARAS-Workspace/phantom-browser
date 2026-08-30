// ae2ee271d5 — neither the synthesis side nor the recognition side exists
(() => {
  const SPEECH_NAMES = [
    "speechSynthesis", "SpeechSynthesis", "SpeechSynthesisUtterance",
    "SpeechSynthesisVoice", "SpeechSynthesisEvent", "SpeechSynthesisErrorEvent",
    "SpeechRecognition", "SpeechGrammar", "SpeechGrammarList",
    "SpeechRecognitionPhrase", "webkitSpeechRecognition", "webkitSpeechGrammar",
    "webkitSpeechGrammarList", "webkitSpeechRecognitionEvent",
    "webkitSpeechRecognitionError",
  ];

  register({
    id: "speech",
    commit: "ae2ee271d5",
    redGated: true,
    run() {
      const left = present(SPEECH_NAMES);
      return {ok: left.length === 0,
              detail: left.length ? "still present: " + left.join(", ")
                                  : "all fifteen undefined"};
    },
  });
})();
