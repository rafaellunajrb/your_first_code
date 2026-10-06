// Feature checks for the app in headless Chromium with a fake recognizer.
// Run: NODE_PATH=$(npm root -g) node tests/features.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const FAKE = require('./fake-recognizer.js');

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
  const browser = await chromium.launch();

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
    check('heading line followed by text renders as heading + paragraph', blocks.join('|') === 'H2:A heading|P:Body text right under it.', blocks.join('|'));
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
