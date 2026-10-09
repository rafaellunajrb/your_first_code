// Shared test helper: a stand-in for Chrome's SpeechRecognition that tests drive by hand.
// window.__say(text, isFinal) delivers a result the way Chrome does (the latest
// interim result is replaced until it becomes final). window.__fail(code) fires an error.
module.exports = `
  class FakeSR {
    constructor() { this.results = []; window.__rec = this; window.__starts = 0; }
    start() {
      window.__starts++;
      this.results = [];
      setTimeout(() => { this.onstart && this.onstart(); this.onaudiostart && this.onaudiostart(); }, 0);
    }
    abort() { setTimeout(() => this.onend && this.onend(), 0); }
    stop() { this.abort(); }
  }
  window.webkitSpeechRecognition = FakeSR;
  window.SpeechRecognition = FakeSR;
  window.__say = (text, isFinal) => {
    const r = window.__rec;
    const last = r.results[r.results.length - 1];
    const item = Object.assign([{ transcript: text }], { isFinal });
    if (last && !last.isFinal) r.results[r.results.length - 1] = item; else r.results.push(item);
    r.onresult({ results: r.results, resultIndex: 0 });
  };
  window.__fail = (error) => {
    const r = window.__rec;
    r.onerror({ error });
    setTimeout(() => r.onend && r.onend(), 0);
  };
`;
