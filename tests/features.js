// Feature checks for the app in headless Chromium with a fake recognizer.
// Run: NODE_PATH=$(npm root -g) node tests/features.js
const launch = require('./launch.js');
const path = require('path');
const fs = require('fs');
const FAKE = require('./fake-recognizer.js');
const { replay } = require('./replay-log.js');

const APP = 'file://' + path.resolve(__dirname, '../speech-scroll-app.html');
let failed = 0;
function check(name, ok, detail = '') {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
}

async function open(browser, { text, query = '', locale, store } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 }, locale, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(FAKE);
  const saved = store !== undefined ? store : (text ? { text, pos: 0, seenMicHint: true } : null);
  if (saved) await page.addInitScript(`localStorage.setItem('speechScroll.v2', ${JSON.stringify(JSON.stringify(saved))})`);
  await page.goto(APP + query);
  page.errors = errors;
  return page;
}
const current = (page) => page.evaluate(() => document.querySelector('.w.current')?.textContent || '(end)');
const status = (page) => page.textContent('#statusText');
const say = (page, t, final = true) => page.evaluate(([t, f]) => __say(t, f), [t, final]);
async function start(page) {
  await page.click('#micBtn');
  await page.waitForTimeout(30);
}

(async () => {
  const browser = await launch();

  // --- Tracking -------------------------------------------------------------
  {
    const page = await open(browser, { text: 'Please tell us about you and then come with us to the hall for dinner.' });
    await start(page);
    await say(page, 'please tell us to', false); // phantom short word from an interim guess
    check('stray short word does not jump ahead', (await current(page)) === 'about', await current(page));
  }
  {
    const page = await open(browser, { text: 'Press the Start button, allow microphone access, and read this text out loud. The highlighted word shows where you are.' });
    await start(page);
    await say(page, 'press the start button allow microphone access and read this text out loud the highlighted word');
    await say(page, 'press the start button allow microphone');
    check('re-reading jumps back', (await current(page)) === 'access,', await current(page));
  }

  // --- Scrolling by hand ----------------------------------------------------
  {
    const page = await open(browser);
    await start(page);
    await say(page, 'welcome to speech scroll press the start button');
    await page.waitForTimeout(800);
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(300);
    const scrolled = await page.evaluate(() => reader.scrollTop);
    check('"Back to my place" appears after scrolling away', await page.isVisible('#backBtn'));
    await say(page, 'allow microphone access');
    await page.waitForTimeout(600);
    check('page stays put for a moment after a hand scroll', scrolled === await page.evaluate(() => reader.scrollTop));
    await page.click('#backBtn');
    await page.waitForTimeout(1200);
    check('"Back to my place" returns to the current word', await page.isHidden('#backBtn'));
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(3200);
    await say(page, 'and read this text');
    await page.waitForTimeout(1200);
    check('following resumes after 3 seconds', await page.isHidden('#backBtn'));
  }

  // --- Lost state -----------------------------------------------------------
  {
    const page = await open(browser, { text: 'Our revenue grew strongly this quarter across every region. Customer retention also improved compared with last year.' });
    await start(page);
    check('status says Listening once the mic opens', (await status(page)) === 'Listening');
    await say(page, 'our revenue grew strongly');
    await say(page, 'and honestly i have to say the weather outside today is completely lovely for march');
    const lostStatus = await status(page);
    check('off-script reading shows "Lost you"', lostStatus.startsWith('Lost you'), lostStatus);
    check('reading line turns amber when lost', await page.evaluate(() => document.getElementById('marker').classList.contains('lost')));
    await say(page, 'this quarter across every region');
    check('lost state clears when reading resumes', (await status(page)) === 'Listening' && (await current(page)) === 'Customer', await current(page));
  }

  // --- Heard strip ----------------------------------------------------------
  {
    const page = await open(browser, { text: 'The app listens for the words on the page so it keeps up when you read faster and waits when you stop.' });
    await start(page);
    await say(page, 'the app listens for the words');
    await say(page, 'on the page so', false);
    const order = await page.evaluate(() => {
      const box = (el) => el.getBoundingClientRect();
      const line = document.querySelector('#heard > span');
      const interim = document.querySelector('#heard .interim');
      const range = document.createRange();
      range.setStart(line.firstChild, 0);
      range.setEnd(line.firstChild, 3);
      return { finalLeft: range.getBoundingClientRect().left, interimLeft: box(interim).left };
    });
    check('newest heard words appear on the right', order.interimLeft > order.finalLeft, JSON.stringify(order));
    await page.keyboard.press('Space');
    check('heard strip hides on pause', await page.isHidden('#heard'));
  }

  // --- Network errors ---------------------------------------------------------
  {
    const page = await open(browser, { text: 'One two three four five six seven eight nine ten.' });
    await start(page);
    await page.evaluate(() => __fail('network'));
    check('one network error shows Reconnecting', (await status(page)) === 'Reconnecting…', await status(page));
    await page.waitForFunction(() => window.__starts === 2, null, { timeout: 3000 });
    await say(page, 'one two three');
    check('recovers after a network blip', (await status(page)) === 'Listening');
    for (let k = 0; k < 5; k++) {
      const starts = await page.evaluate(() => window.__starts);
      await page.evaluate(() => __fail('network'));
      if (k < 4) await page.waitForFunction((n) => window.__starts === n + 1, starts, { timeout: 6000 });
    }
    await page.waitForTimeout(50);
    check('gives up after repeated network errors', (await status(page)) === 'Stopped' && await page.isVisible('#banner'), await status(page));
  }

  // --- Quiet warning ------------------------------------------------------------
  {
    const page = await open(browser, { text: 'Nothing to see here, just testing the microphone warning.' });
    await start(page);
    await page.waitForTimeout(10500);
    check('warns when nothing is heard', (await page.textContent('#bannerText')).startsWith("I haven't heard anything"));
    await say(page, 'nothing to see', false);
    check('warning clears when speech arrives', await page.isHidden('#banner'));
  }

  // --- End of script --------------------------------------------------------------
  {
    const page = await open(browser, { text: 'A short line to finish.' });
    await start(page);
    await say(page, 'a short line to finish', false);
    check('an interim guess at the last word does not finish', (await status(page)) === 'Listening');
    await say(page, 'a short line to finish', true);
    check('the final result finishes', (await status(page)) === 'Finished');
    await page.keyboard.press('Space');
    check('Space at the end does not silently rewind', (await current(page)) === '(end)' && (await status(page)) === 'Finished');
  }

  // --- Debug log ----------------------------------------------------------------
  {
    const page = await open(browser, { text: 'Testing the debug session log with a few words.', query: '?debug' });
    check('debug button only in debug mode', await page.isVisible('#debugBtn'));
    await start(page);
    await say(page, 'testing the', false);
    await say(page, 'testing the debug session', true);
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#debugBtn')]);
    const log = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    const results = log.events.filter((e) => e.type === 'result');
    check('debug log records results and text', results.length === 2 && results[1].r[0].f === true && log.text.startsWith('Testing'), `${results.length} results`);
    const normal = await open(browser, { text: 'x' });
    check('no debug button normally', await normal.isHidden('#debugBtn'));
  }

  // --- Editor -------------------------------------------------------------------
  {
    const text = 'The first paragraph has some words.\n\nThe second paragraph has a tpyo in it and more words after.';
    const page = await open(browser, { text });
    await page.click('.w >> text=more');
    await page.keyboard.press('e');
    await page.fill('#editor', text + ' Pasted extra.');
    // A selection drag that ends outside the dialog must not close it.
    const box = await page.locator('#editor').boundingBox();
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(5, 5);
    await page.mouse.up();
    check('drag ending outside the editor keeps it open', await page.isVisible('#editDlg'));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(50); // the dialog finishes closing just after the key event
    await page.keyboard.press('e');
    check('closing without Cancel keeps the draft', (await page.inputValue('#editor')).endsWith('Pasted extra.'));
    await page.fill('#editor', text.replace('tpyo', 'typo'));
    await page.click('#applyBtn');
    check('fixing a typo keeps your place', (await current(page)) === 'more', await current(page));
    await page.keyboard.press('e');
    await page.fill('#editor', '# A heading\nBody text right under it.');
    await page.click('#applyBtn');
    const blocks = await page.evaluate(() => [...document.querySelectorAll('#text > *')].map((el) => el.tagName + ':' + el.textContent));
    check('heading line followed by text renders as heading + paragraph', blocks.join('|') === 'H1:A heading|P:Body text right under it.', blocks.join('|'));
  }

  // --- Keys ---------------------------------------------------------------------
  {
    const page = await open(browser, { text: 'Line one of the text is here and it is long enough to wrap onto another line in the reader at this size. And then it goes on for a while longer still.' });
    const before = await current(page);
    await page.keyboard.press('PageDown');
    const after = await current(page);
    check('PageDown moves to the next line', before === 'Line' && after !== 'Line', after);
    await page.keyboard.press('PageUp');
    check('PageUp moves back a line', (await current(page)) === 'Line');
    await page.keyboard.press('b');
    await page.waitForTimeout(30);
    check('"b" toggles listening (clicker blank button)', (await status(page)) === 'Listening');
    await page.keyboard.press('b');
    await page.focus('#restartBtn');
    await page.keyboard.press('Space');
    check('Space on a focused button presses the button, not the mic', (await status(page)) === 'Not listening');
  }

  // --- Sermon text format ---------------------------------------------------------
  {
    const sermon = fs.readFileSync(path.join(__dirname, '../handoff/sample-sermon.txt'), 'utf8');
    const page = await open(browser, { text: sermon });
    const shape = await page.evaluate(() => ({
      h1: document.querySelectorAll('#text h1').length,
      h2: document.querySelectorAll('#text h2').length,
      quotes: document.querySelectorAll('#text blockquote').length,
      quoteLines: document.querySelector('#text blockquote').querySelectorAll('br').length,
      notes: [...document.querySelectorAll('#text .note')].map((n) => n.textContent),
      noteWords: document.querySelectorAll('#text .note .w').length
    }));
    check('title, sections and scripture render', shape.h1 === 1 && shape.h2 === 4 && shape.quotes === 1 && shape.quoteLines === 1, JSON.stringify(shape));
    check('[notes] render as notes, not trackable words', shape.notes.includes('[Pause. Look up at the camera.]') && shape.notes.includes('[JEH-won]') && shape.noteWords === 0, shape.notes.join(' | '));
    await start(page);
    await say(page, 'good morning church it is good to be together again today we are looking at a promise that has carried believers through every generation through good seasons and hard ones');
    await say(page, 'before we begin let me ask you a question');
    check('reading straight past a [note] keeps tracking', (await current(page)) === 'When', await current(page));
    await say(page, 'pastor kim jae won once told me a story about this verse');
    check('a note inside a sentence is skipped', (await current(page)) === 'When', await current(page));
  }
  {
    const page = await open(browser, { text: 'Before [an unclosed note that runs on\nand on] after.\n\nNext paragraph [never closed\n\nThird paragraph is normal.' });
    const words = await page.evaluate(() => [...document.querySelectorAll('#text .w')].map((w) => w.textContent).join(' '));
    check('notes can span lines; an unclosed [ stops at the paragraph end', words === 'Before after. Next paragraph Third paragraph is normal.', words);
  }

  // --- Sections -----------------------------------------------------------------------
  {
    const sermon = fs.readFileSync(path.join(__dirname, '../handoff/sample-sermon.txt'), 'utf8');
    const page = await open(browser, { text: sermon });
    check('Sections button shows for sectioned text', await page.isVisible('#sectionsBtn'));
    await page.click('#sectionsBtn');
    const items = await page.$$eval('#sectionsMenu button', (bs) => bs.map((b) => b.textContent));
    check('menu lists the title and sections', items.join('|') === 'The Faithfulness of God|Introduction|The promise|The promise is for you|Closing prayer', items.join('|'));
    await page.click('#sectionsMenu button:has-text("The promise is for you")');
    check('choosing a section jumps to its first word', (await current(page)) === 'The' && await page.isHidden('#sectionsMenu'));
    await page.keyboard.press(']');
    check('] goes to the next section', (await current(page)) === 'Closing', await current(page));
    await page.keyboard.press('[');
    check('[ goes back a section', (await current(page)) === 'The', await current(page));
    await page.click('#sectionsBtn');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    check('Escape closes the menu and returns focus', await page.isHidden('#sectionsMenu') && await page.evaluate(() => document.activeElement.id === 'sectionsBtn'));
    const plain = await open(browser, { text: 'Just one paragraph, no sections.' });
    check('no Sections button without sections', await plain.isHidden('#sectionsBtn'));
  }

  // --- Time & pace ----------------------------------------------------------------------
  {
    const page = await open(browser, { text: Array.from({ length: 130 * 3 }, (_, i) => 'word' + i).join(' ') });
    check('estimate before reading uses 130 wpm', (await page.textContent('#clockLeft')).includes('about 3 min left'), await page.textContent('#clockLeft'));
    await start(page);
    await page.waitForTimeout(1200);
    const elapsed1 = await page.textContent('#clockElapsed');
    await page.keyboard.press('Space');
    await page.waitForTimeout(1200);
    check('clock runs only while listening', elapsed1 === '0:01' && (await page.textContent('#clockElapsed')) === '0:01', elapsed1);
    // Simulate 1 minute of listening at 65 words/min to check the measured pace.
    const measured = await page.evaluate(async () => {
      const realNow = performance.now.bind(performance);
      let offset = 0;
      performance.now = () => realNow() + offset;
      document.getElementById('micBtn').click();
      await new Promise((r) => setTimeout(r, 30));
      for (let i = 0; i < 65; i++) { offset += 60000 / 65; __say('word' + i, true); }
      return { left: document.getElementById('clockLeft').textContent, title: document.getElementById('clock').title };
    });
    // ~65 wpm: the second of listening before reading also counts, so allow a little lower.
    const wpm = Number((/(\d+) words\/min/.exec(measured.title) || [])[1]);
    check('pace is measured from reading', wpm >= 60 && wpm <= 65 && measured.left.includes('about 5 min left'), JSON.stringify(measured));
    await page.keyboard.press('Home');
    check('Home resets the clock', (await page.textContent('#clockElapsed')) === '0:00');
  }

  // --- Camera mode ------------------------------------------------------------------------
  {
    const page = await open(browser);
    const normal = await page.evaluate(() => ({ line: document.getElementById('linePos').value, width: getComputedStyle(document.documentElement).getPropertyValue('--measure') }));
    await page.keyboard.press('c');
    const cam = await page.evaluate(() => ({ line: document.getElementById('linePos').value, width: getComputedStyle(document.documentElement).getPropertyValue('--measure') }));
    check('C turns on camera mode with its own high, narrow layout', normal.line === '33' && cam.line === '14' && cam.width === '26ch', JSON.stringify({ normal, cam }));
    await start(page);
    await page.waitForTimeout(400);
    const hidden = await page.evaluate(() => ({
      toolbar: getComputedStyle(document.querySelector('.toolbar')).opacity,
      readerTop: document.getElementById('reader').getBoundingClientRect().top,
      corner: !document.getElementById('cornerClock').hidden
    }));
    check('while reading, controls hide and text uses the full height', hidden.toolbar === '0' && hidden.readerTop === 0 && hidden.corner, JSON.stringify(hidden));
    await say(page, 'welcome to speech scroll reading press the start button');
    const lineY = await page.evaluate(() => {
      const r = document.querySelector('.w.current').getBoundingClientRect();
      return Math.round((r.top + r.height / 2) / innerHeight * 100);
    });
    await page.waitForTimeout(900);
    const lineY2 = await page.evaluate(() => {
      const r = document.querySelector('.w.current').getBoundingClientRect();
      return Math.round((r.top + r.height / 2) / innerHeight * 100);
    });
    check('current line sits high, near the webcam', lineY2 >= 10 && lineY2 <= 18, `${lineY}% -> ${lineY2}%`);
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(100);
    check('clicker keys do not bring the toolbar back', (await page.evaluate(() => getComputedStyle(document.querySelector('.toolbar')).opacity)) === '0');
    await page.mouse.move(300, 300);
    await page.mouse.move(320, 310);
    await page.waitForTimeout(350);
    check('moving the mouse shows the toolbar', (await page.evaluate(() => getComputedStyle(document.querySelector('.toolbar')).opacity)) === '1');
    await page.waitForTimeout(3300);
    check('toolbar hides again after 3 seconds', (await page.evaluate(() => getComputedStyle(document.querySelector('.toolbar')).opacity)) === '0');
    await page.evaluate(() => document.getElementById('micBtn').click());
    await page.waitForTimeout(400);
    check('pausing shows the toolbar again', (await page.evaluate(() => getComputedStyle(document.querySelector('.toolbar')).opacity)) === '1');
    await page.keyboard.press('c');
    check('turning camera mode off restores normal layout', (await page.evaluate(() => document.getElementById('linePos').value)) === '33');
  }

  // --- Long debug log -----------------------------------------------------------------------
  {
    const page = await open(browser, { text: 'Testing a long log with repeated identical events.', query: '?debug' });
    await start(page);
    const count = await page.evaluate(() => {
      for (let i = 0; i < 3; i++) __say('testing a', false); // identical events: logged once
      __say('testing a long', false);
      return document.getElementById('debugBtn').title;
    });
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#debugBtn')]);
    const log = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    const results = log.events.filter((e) => e.type === 'result');
    check('identical events are logged once, with version and settings', results.length === 2 && log.version && log.settings && log.settings.lang, `${results.length} results, v${log.version}`);
    check('logged position is the one after the event', results[0].pos === 2 && results[1].pos === 3, results.map((r) => r.pos).join(','));
    check('button tooltip shows the event count', /\(\d+ events\)/.test(count), count);
  }

  // --- Replaying a recorded log ------------------------------------------------------------
  {
    const sermon = fs.readFileSync(path.join(__dirname, '../handoff/sample-sermon.txt'), 'utf8');
    const page = await open(browser, { text: sermon, query: '?debug' });
    await start(page);
    await page.evaluate(() => {
      __say('the faithfulness of god introduction good morning', false);
      __say('the faithfulness of god introduction good morning church it is good to be', true);
      __say('together again today we are looking at a', false);
      __say('together again today we are looking at a promise', true);
    });
    await page.click('.w >> text=Notice');
    await page.evaluate(() => __say('notice the first word of the promise it does not begin with us', true));
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#debugBtn')]);
    const file = await download.path();
    const result = await replay(file, { browser });
    check('replaying a recorded log reproduces the session exactly', result.results === 5 && result.differences === 0 && result.finalReplayed === result.finalLogged, `${result.differences} differences of ${result.results}`);
  }

  // --- Settings & startup ---------------------------------------------------------
  {
    const page = await open(browser, { store: { text: 'Hello there.', settings: null, pos: -3 } });
    check('null saved settings still render', (await page.evaluate(() => document.querySelectorAll('.w').length)) === 2);
    const page2 = await open(browser, { store: { text: 'Hello there.', settings: { fontSize: 'huge', linePos: 999, lang: 'xx-YY', theme: 'neon' } } });
    const vals = await page2.evaluate(() => [getComputedStyle(document.documentElement).getPropertyValue('--fs'), document.getElementById('linePos').value]);
    check('bad saved settings fall back to sane values', vals[0] === '40px' && vals[1] === '60', vals.join(','));
    const uk = await open(browser, { locale: 'en-GB' });
    check('default language follows the browser (en-GB)', (await uk.inputValue('#lang')) === 'en-GB');
    await start(uk);
    check('first Start shows the microphone hint', (await uk.textContent('#bannerText')).startsWith('Chrome will ask'));
    for (const p of [page, page2, uk]) if (p.errors.length) check('no page errors', false, p.errors.join('; '));
  }

  // --- Unsupported browser ------------------------------------------------------------
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.addInitScript('delete window.SpeechRecognition; delete window.webkitSpeechRecognition;');
    await page.goto(APP);
    check('unsupported browser disables the mic', (await status(page)) === 'Not supported' && await page.isDisabled('#micBtn'));
  }

  await browser.close();
  console.log(failed ? `${failed} failing` : 'all passed');
  process.exit(failed ? 1 : 0);
})();
