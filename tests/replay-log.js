// Replays a real ?debug session log through the current app and compares where the highlight
// ends up with where it was during the real session. Use it after changing the tracking code:
// differences show exactly which moments of a real read-through the change affects.
//
//   node tests/replay-log.js path/to/speech-scroll-log.json [--trace]
//
// The log's own "pos" values come from the app version that recorded it (log.version).
const launch = require('./launch.js');
const path = require('path');
const fs = require('fs');
const FAKE = require('./fake-recognizer.js');

const APP = 'file://' + path.resolve(__dirname, '../speech-scroll-app.html') + '?debug';

async function replay(logFile, { trace = false, browser: shared } = {}) {
  const log = JSON.parse(fs.readFileSync(logFile, 'utf8'));
  const browser = shared || await launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.addInitScript(FAKE);
  await page.addInitScript(`localStorage.setItem('speechScroll.v2', ${JSON.stringify(JSON.stringify({
    schema: 2, text: log.text, pos: 0, seenMicHint: true, settings: { lang: log.lang || 'en-US' }
  }))})`);
  await page.goto(APP);
  await page.click('#micBtn');
  await page.waitForTimeout(30);

  const rows = await page.evaluate((events) => {
    const rec = window.__rec;
    const out = [];
    for (const ev of events) {
      if (ev.type === 'start') {
        rec.results = [];
        rec.onstart();
      } else if (ev.type === 'jump') {
        window.speechScroll.jumpTo(ev.pos);
      } else if (ev.type === 'result') {
        rec.results.length = ev.n;
        ev.r.forEach((r, k) => { rec.results[ev.ri + k] = Object.assign([{ transcript: r.t }], { isFinal: r.f }); });
        rec.onresult({ results: rec.results, resultIndex: ev.ri });
        const pos = window.speechScroll.pos;
        out.push({ t: ev.t, logged: ev.pos, replayed: pos, heard: ev.r.map((r) => r.t).join(' | '),
          here: pos !== ev.pos ? window.speechScroll.context(pos) : '', was: pos !== ev.pos ? window.speechScroll.context(ev.pos) : '' });
      }
    }
    return out;
  }, log.events);

  await ctx.close();
  if (!shared) await browser.close();

  const diffs = rows.filter((r) => r.logged !== r.replayed);
  const summary = {
    recordedWith: log.version || 'unknown',
    results: rows.length,
    differences: diffs.length,
    finalLogged: rows.length ? rows[rows.length - 1].logged : 0,
    finalReplayed: rows.length ? rows[rows.length - 1].replayed : 0,
    rows,
    diffs
  };
  if (trace || require.main === module) print(summary, trace);
  return summary;
}

function print(s, trace) {
  const mmss = (t) => `${Math.floor(t / 60000)}:${String(Math.floor(t / 1000) % 60).padStart(2, '0')}`;
  console.log(`Log recorded with v${s.recordedWith}; ${s.results} result events replayed.`);
  for (const r of trace ? s.rows : s.diffs.slice(0, 40)) {
    const mark = r.logged === r.replayed ? ' ' : '≠';
    console.log(`${mark} ${mmss(r.t)}  live ${r.logged}  now ${r.replayed}   heard: "${r.heard.slice(-70)}"`);
    if (r.here) console.log(`      now at: ${r.here}\n      live at: ${r.was}`);
  }
  if (!trace && s.diffs.length > 40) console.log(`… ${s.diffs.length - 40} more differences (use --trace for all events)`);
  console.log(`${s.differences} of ${s.results} events end somewhere different; final position live ${s.finalLogged}, now ${s.finalReplayed}.`);
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.log('Usage: node tests/replay-log.js <speech-scroll-log.json> [--trace]');
    process.exit(2);
  }
  replay(file, { trace: process.argv.includes('--trace') }).catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { replay };
