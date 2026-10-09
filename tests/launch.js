// Starts the browser for the tests. Locally this is Playwright's bundled Chromium; on GitHub
// (PW_CHANNEL=chrome) it's the Google Chrome already installed on the runner, so nothing
// has to be downloaded or installed there. A fake microphone and auto-accepted permission
// prompts let the microphone check run without a person.
const { chromium } = require('playwright');

module.exports = () => chromium.launch({
  ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required']
});
