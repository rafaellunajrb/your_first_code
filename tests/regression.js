// Replays transcripts through the real page with a fake recognizer and checks where the
// highlight ends up. Stream ops in scenarios.json: "~" = grow an interim result word by
// word then finalise it, "i" = one interim result, "f" = one final result.
// Add a scenario here whenever a real session log shows the tracking going wrong.
const launch = require('./launch.js');
const path = require('path');
const fs = require('fs');
const FAKE = require('./fake-recognizer.js');

const APP = path.resolve(__dirname, '../speech-scroll-app.html');

(async () => {
  const scenarios = JSON.parse(fs.readFileSync(path.join(__dirname, 'scenarios.json'), 'utf8'));
  const browser = await launch();
  let failed = 0;
  for (const s of scenarios) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.addInitScript(FAKE);
    await page.addInitScript(`localStorage.setItem('speechScroll.v2', ${JSON.stringify(JSON.stringify({ text: s.script, pos: 0, seenMicHint: true }))})`);
    await page.goto('file://' + APP);
    await page.click('#micBtn');
    await page.waitForTimeout(30);
    const got = await page.evaluate((stream) => {
      for (const [op, text] of stream) {
        if (op === '~') {
          const ws = text.split(' ');
          for (let i = 1; i <= ws.length; i++) __say(ws.slice(0, i).join(' '), false);
          __say(text, true);
        } else {
          __say(text, op === 'f');
        }
      }
      const all = [...document.querySelectorAll('#text .w')];
      const cur = document.querySelector('.w.current');
      return {
        idx: cur ? all.indexOf(cur) : all.length,
        word: cur ? cur.textContent : '(end)',
        words: all.map((e) => e.textContent.replace(/[^\p{L}\p{N}']/gu, '').toLowerCase())
      };
    }, s.stream);
    // Expected: the word just after the last occurrence of expectAfter.
    const expected = got.words.lastIndexOf(s.expectAfter.toLowerCase()) + 1;
    const ok = Math.abs(got.idx - expected) <= s.tolerance;
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${s.name}  -> current "${got.word}" (word ${got.idx}, expected ~${expected})`);
    await ctx.close();
  }
  await browser.close();
  console.log(failed ? `${failed} failing` : 'all passed');
  process.exit(failed ? 1 : 0);
})();
