# Speech Scroll: project brief

> **To the assistant reading this:** this brief and `speech-scroll-app.html` are your full context.
> The app was built over several sessions in Claude Code with automated browser tests.
> You are now working in a chat with no tools, so the owner tests every change by hand in Chrome.
> Read the whole brief before changing code, and follow the **Working rules** at the end.

## 1. Purpose and owner

- **Owner:** a pastor who is not a programmer. They translate Korean sermons into English
  (with their own app, "Sermon Bridge"), then **preach them in English on camera for YouTube**.
- **Speech Scroll** is a voice-following teleprompter. The owner reads aloud and the page scrolls to keep the current word
  on a fixed "reading line". The highlight follows their voice, not a timer.
- **Setup:**
  - Laptop in **Google Chrome (desktop)**, with the **laptop webcam** as the camera.
  - The text is on the same screen, just below the webcam.
  - The microphone is the webcam's or laptop's built-in one.
- **Sermons last 45–90 minutes**, about 6,000–13,000 words.
- **Two ways to run it:** opened locally (`file://`), or from GitHub Pages at <https://rafaellunajrb.github.io/your_first_code/> (branch `claude/speech-scroll-app-011CULQHxHxv7szv6fpvyDoF`, root folder),
  installed from Chrome as an app with its own window.

## 2. Hard constraints

- **One self-contained HTML file** (HTML + CSS + JS inline). No build step, no frameworks, no libraries, no CDNs.
- **Target is desktop Google Chrome only.** It uses the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).
- **Chrome's default (cloud) recognition sends audio to Google** and needs internet. The UI says so.
- **Keep it working when opened as a local file** as well as from the web address.
- **Web-only support files** (rarely change): `manifest.webmanifest`, `icons/`, `index.html` (redirects to the app) and `.nojekyll`.
  The app links the manifest only when served over http(s), and shows an **Install app** button when Chrome offers installation.
  The app itself stays one self-contained file. Never make it depend on other files to work.
- **Plain, friendly wording in the UI.** The owner is not technical.

## 3. How it works (architecture map)

The script is one IIFE in `'use strict'`, organised by banner comments (`// ---- Section ----`).
Search for these names; line numbers drift.

| Section | Key items |
|---|---|
| Config & storage | `APP_VERSION` (shown in Settings and in logs). `TUNING`: every tracking and timing knob in one object (lookahead, relocate ranges, `LOST_AFTER`, `FOLLOW_PAUSE`, `QUIET_WARN`, `MAX_NET_RETRIES`, `DEFAULT_WPM`, `PACE_WINDOW`, `PEEK_TIME`). `STORE_KEY = 'speechScroll.v2'`, which holds `{schema, text, settings, pos, seenMicHint}`. `SCHEMA` + `migrate()` upgrade older saved data. `DEFAULTS` + `RANGES` + `cleanSettings()` validate settings. `browserLang()`, `SAMPLE`, `saveSoon()` |
| Debug session log | `DEBUG` (URL has `?debug`), `logEvent(type, data)`, `downloadLog()`. Holds up to 60,000 events, enough for a 90-minute sermon. Identical repeated results are skipped. Each `result` event stores Chrome's results from `resultIndex` onward and the position **after** processing. Also start/audiostart/end/error/jump/lost/quiet. The file includes the version, settings and text. In debug mode, `window.speechScroll` gives tools read-only access (`pos`, `jumpTo`, `context`) |
| Word normalisation | `normWords(s)`: lowercase, strip accents and apostrophes, `1,000→1000`, split on non-letters/digits, map number words to digits (`NUMBERS`) and a few homophones (`SAME_SOUND`). `similar(a,b)`: exact match, or a prefix/Levenshtein match for words of 4+ letters |
| Rendering | `parseBlocks()` reads the sermon format: `# ` = `<h1>` title, `## `+ = `<h2>` section, consecutive `> ` lines = `<blockquote>`, blank line = new `<p>`. `render()` builds spans, `appendLine()` splits `[notes]` out (a note can continue across lines but stops at the end of its block), and notes become `<span class="note">`, never words. `spans[s] = {el, first}` (`first` = index into `words`, or -1). `words[i] = {n, span}` holds normalised words for matching. `sections[] = {title, level, span}` |
| Position tracking | `pos` = index of the next expected word. `setPos(i, manual)` updates classes (`.read`, `.current`), scrolls, records pace, saves, and on a manual jump resets context. `hearWord(w)` is the matcher. `contextScore(j)`, `relocate()` (phrase search: 3 words forward up to 400, 4 words backward up to 200), `setLost()`, `finish()` |
| Scrolling | Custom rAF easing in `scrollToCurrent()`/`stepScroll()` keeps the current word on the reading line (`readingLine()`). A wheel, touch or scrollbar drag pauses following for `FOLLOW_PAUSE` and shows "Back to my place". `layout()` places `#marker` and the padding |
| Camera mode | `settings.cameraMode` with its own `cameraWidth`/`cameraLinePos` (`columnWidth()`, `readingLine()`). `syncCamera()` toggles `body.camera` and re-lays out. While listening, CSS on `body.camera.listening:not(.peek)` hides the toolbar, progress, heard strip, info banners and cursor, and the reader takes the full height. `peek()` shows the toolbar for `PEEK_TIME` on a real mouse move, touch, Tab or Escape (not clicker keys). The "Lost you" signal is subtler. There's a corner clock |
| Speech recognition | `createRecognizer()`: `continuous`, `interimResults`. `onresult` keeps `sessionFinal`, `finalUpTo` and `consumed`, and feeds only **new** words (by count) into `hearWord`. Network errors retry with backoff. Routine session ends restart after 30 ms, with a loop guard. `QUIET_WARN` shows a microphone hint. Screen wake lock while listening |
| Time & pace | Elapsed time counts only while listening (`startClock`/`stopClock`/`resetClock`, which Restart and Home reset). `notePace()` samples `{t, pos}` on voice advances, and a manual jump restarts measuring. `pace()` = words per minute over the last `PACE_WINDOW`, falling back to `DEFAULT_WPM`. `tickClock()` updates the toolbar clock ("12:34 · about 31 min left", with the pace in its tooltip) and the camera-mode corner clock |
| Status & banner | `setStatus(kind)`: off, starting, listening, lost, reconnecting, done, error, unsupported. `showBanner(msg, info, kind)` |
| Settings | Camera mode (and its corner clock), font size, column width, reading line (these two edit the camera-mode values while it's on), language, theme, heard strip, and the version number |
| Sections menu | `#sectionsBtn` (hidden without `##` sections) opens `#sectionsMenu`: title plus sections, the current one marked, arrow keys, Escape. `stepSection(±1)` for `[` / `]` |
| Editing | Dialog with textarea. Open .txt, Load sample. Unapplied drafts are kept. `placeAfterEdit()` keeps your place after an edit |
| Navigation | Click a word. ←/→ word, ↑/↓ and PgUp/PgDn line, `[`/`]` section, Home restart (resets the clock), C camera mode, +/- text size, F full screen, E edit, S settings, Space/B/"." start or pause |

### Tools and tests (only usable with Claude Code or Node.js, not in a chat)

- `npm test` runs `tests/regression.js` (transcript replays in `tests/scenarios.json`) and `tests/features.js` (65 checks).
  Both use a fake recognizer in headless Chromium. GitHub runs them automatically on every push (`.github/workflows/tests.yml`).
- `npm run replay -- log.json` (`tests/replay-log.js`) replays a real `?debug` log through the current code and lists every
  moment where the position now differs from the live session. Use it before and after any tracking change.
- `npm run package` rebuilds `handoff/speech-scroll-handoff.zip`.

### How the matcher works (the delicate part)

For each spoken word `w`, the matcher looks at text words `pos … pos+LOOKAHEAD`:
- A match within 2 words is accepted outright.
- Further ahead, it needs supporting context. Either the previous two spoken words line up, in order, right before it (`ctx >= 2`), or one previous word of 4+ letters does, or `w` is 6+ letters and within 6 words.
- Among the candidates, the score favours more context and less distance.

After 2 misses, `relocate()` looks for the last 3 spoken words as a phrase ahead (the reader skipped ahead), or the last 4 behind (the reader is re-reading).
After `LOST_AFTER = 8` misses in a row, the "Lost you" state shows: amber dot and amber reading line.

## 4. Decisions already made (don't undo these without a reason)

- **Jumping ahead is worse than lagging.** The context rules above were tightened on purpose. In simulation they cut large wrong jumps
  (8+ words ahead) by between about a third and nearly all, depending on how noisy the speech was. Don't loosen them.
- **Only a final result finishes the script.** An interim guess at the last word doesn't end it early.
- **One network error only shows "Reconnecting…".** Only repeated failures stop listening.
- **Applying an edit keeps the microphone on and keeps your place.** "Load sample" and "Open file" start from the top.
- **In camera mode, clicker keys never bring the controls back.** Only a mouse move, touch, Tab or Escape does, so nothing flashes on screen while recording.
- **`[notes]` are never trackable words.** Reading past them, or not reading them, mustn't affect tracking.
- **Never jump backwards on a single word.** Only a 4-word phrase match (re-reading), a click or a key moves the highlight back.

## 5. What has NOT been verified

- **Everything so far was tested with a simulated recognizer, not a real voice.**
  How real Chrome splits and revises its results, formats numbers, and ends sessions is the main open question.
  The `?debug` log exists to answer it.
- **Preaching-specific risks:**
  - **A repeated line could pull the highlight backwards.** Preachers repeat lines for emphasis, and the 4-word backward relocate could treat that as re-reading.
  - **Names and Bible references will be misheard.** Biblical names, Korean names and references like "John 3:16".
  - **Long ad-libbed stretches** are normal in preaching. The "Lost you" state handles them, but the amber band may be distracting on camera.

## 6. Roadmap (details and prompts in CHAT_PLAN.md)

**Done in v1.1.0:** camera mode, the sermon text format, the section list, the time display, and a debug log long enough for a full sermon.

1. **Real read-through with `?debug`** (Step R in CHAT_PLAN.md), then **tune from the real logs**,
   including protection against repeated lines.
2. *Optional, if logs or use show the need:*
   - **Better matching for spoken numbers and Bible references.**
   - **An on-device recognition mode with vocabulary biasing.** Chrome's `processLocally` mode, plus `recognition.phrases` to bias it toward words from the script. Per research in October 2026, both are shipped in desktop Chrome, but biasing works only on-device. Check current Chrome docs before relying on this.
   - **A microphone level meter.**
   - **"Commit + replay" interim handling.** Restore the state saved at the last final result, then replay the current interim words on every event. That way, revised interim guesses can't leave stale jumps. It helped in simulation, but needs real logs to justify it.
   - **Ideas for later:** a countdown before listening starts, a target-length warning, multiple saved sermons, and a mirror mode (only for teleprompter glass).

## 7. Working rules for the assistant

1. **Make one task per chat.** Make the smallest change that does the task well, and don't refactor or restyle unrelated code.
2. **Keep the single-file constraint**, the existing code style (2-space indent, small named functions, short "why" comments)
   and the CSS colour tokens on `:root`. Every new colour needs both light and dark values.
3. **Don't change the matcher constants or rules** unless the task is about tracking.
4. **Return the result as the complete updated file**, as a downloadable file if you can.
   If you can't produce a file, give replacement blocks instead: each one a whole function or CSS rule, with its exact name so the owner can find it.
   Use a short "insert after this exact line" note for new code. Never give partial diffs or `...` placeholders.
5. **Bump the version** in `APP_VERSION` and in the comment at the top of the HTML file (e.g. `1.2.0`), and give a **one-line changelog entry**.
   If saved settings change shape, bump `SCHEMA` and add a step to `migrate()`. New tracking or timing numbers go in `TUNING`.
6. **Give numbered test steps** the owner can do in Chrome in a few minutes, including what they should see.
7. **If a decision in section 4 must change**, say so plainly and why, and update this brief. Give the updated
   section text so the owner can paste it in.
8. **Write for a non-programmer:** short sentences, no jargon in UI text, and explain any choice they need to make.
