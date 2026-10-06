# Tests

Automated checks for `speech-scroll-app.html`. They run the real page in headless Chromium with a
stand-in for Chrome's speech recognizer (`fake-recognizer.js`), so no microphone is needed.

```sh
npm install -g playwright      # once
export NODE_PATH=$(npm root -g)
node tests/regression.js       # where the highlight ends up for recorded/realistic transcripts
node tests/features.js         # lost state, network retry, editor, keys, debug log, ...
```

`scenarios.json` holds the transcript replays. When a real session goes wrong, open the app with
`?debug`, download the session log, and turn the problem stretch into a new scenario.
