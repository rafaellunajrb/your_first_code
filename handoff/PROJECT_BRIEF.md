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
- **The file is opened locally** (`file://`), not from a website.

## 2. Hard constraints

- **One self-contained HTML file** (HTML + CSS + JS inline). No build step, no frameworks, no libraries, no CDNs.
- **Target is desktop Google Chrome only.** It uses the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).
- **Chrome's default (cloud) recognition sends audio to Google** and needs internet. The UI says so.
- **Keep it working when opened as a local file.**
- **Plain, friendly wording in the UI.** The owner is not technical.

## 3. How it works (architecture map)

The script is one IIFE in `'use strict'`, organised by banner comments (`// ---- Section ----`).
Search for these names; line numbers drift.

| Section | Key items |
|---|---|
| Config & storage | `STORE_KEY = 'speechScroll.v2'` (localStorage: `{text, settings, pos, seenMicHint}`), `LOOKAHEAD`, `RELOCATE_RANGE`, `REREAD_RANGE`, `FOLLOW_PAUSE`, `DEFAULTS`, `SAMPLE`, `cleanSettings()` (validates saved settings), `browserLang()`, `saveSoon()` |
| Debug session log | `DEBUG` (true when URL has `?debug`), `logEvent(type, data)`, `downloadLog()`. Caps at 5,000 events. Records each `onresult` from `resultIndex` onward, plus start/audiostart/end/error/jump/lost/quiet |
| Word normalisation | `normWords(s)`: lowercase, strip accents and apostrophes, `1,000→1000`, split on non-letters/digits, map number words to digits (`NUMBERS`) and a few homophones (`SAME_SOUND`). `similar(a,b)`: exact match, or a prefix/Levenshtein match for words of 4+ letters |
| Rendering | `render()`: `# ` lines become `<h2>` headings, blank lines separate `<p>` paragraphs. Every visible token is a `<span class="w">`. `spans[s] = {el, first}`, where `first` is the index into `words` or -1. `words[i] = {n, span}` holds the normalised words used for matching |
| Position tracking | `pos` = index of the next expected word. `setPos(i, manual)` updates classes (`.read`, `.current`), scrolls, saves, and on a manual jump resets context. `hearWord(w)` is the matcher. `contextScore(j)`, `relocate()` (phrase search: 3 words forward up to 400, 4 words backward up to 200), `setLost()`, `finish()` |
| Scrolling | Custom rAF easing in `scrollToCurrent()`/`stepScroll()`, which keeps the current word on the reading line. A wheel, touch or scrollbar drag pauses following for `FOLLOW_PAUSE` (3 s) and shows "Back to my place" (`checkPlaceVisible()`, `backToPlace()`). `layout()` places `#marker` (the reading band) |
| Speech recognition | `createRecognizer()`: `continuous`, `interimResults`. `onresult` keeps `sessionFinal`, `finalUpTo` and `consumed`, and feeds only **new** words (by count) of the session transcript into `hearWord`. Network errors retry with backoff (`MAX_NET_RETRIES = 4`). Routine session ends restart after 30 ms, with a loop guard (more than 5 restarts in 10 s stops). `QUIET_WARN` (10 s with no result) shows a microphone hint. Screen wake lock while listening |
| Status & banner | `setStatus(kind)`: off, starting, listening, lost, reconnecting, done, error, unsupported. "Listening" is shown only after `onaudiostart`. `showBanner(msg, info, kind)`: `kind` lets temporary hints ('quiet', 'mic-hint') clear themselves |
| Settings | Font size, column width (ch), reading-line position (%), language, theme, "show what the mic hears" strip |
| Editing | Dialog with textarea. Open .txt, Load sample. Unapplied drafts are kept. `placeAfterEdit()` keeps your place after an edit |
| Navigation | Click a word to set your place. ←/→ word, ↑/↓ and PgUp/PgDn line, Home start, +/- text size, F full screen, E edit, S settings, Space/B/"." start or pause |

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
- **Never jump backwards on a single word.** Only a 4-word phrase match (re-reading), a click or a key moves the highlight back.

## 5. What has NOT been verified

- **Everything so far was tested with a simulated recognizer, not a real voice.**
  How real Chrome splits and revises its results, formats numbers, and ends sessions is the main open question.
  The `?debug` log exists to answer it.
- **Preaching-specific risks:**
  - **A repeated line could pull the highlight backwards.** Preachers repeat lines for emphasis, and the 4-word backward relocate could treat that as re-reading.
  - **Names and Bible references will be misheard.** Biblical names, Korean names and references like "John 3:16".
  - **Long ad-libbed stretches** are normal in preaching. The "Lost you" state handles them, but the amber band may be distracting on camera.

## 6. Roadmap (do in this order; details and prompts in CHAT_PLAN.md)

1. **Camera mode:** a one-click preset. Hide the toolbar while reading, put the reading line high (about 12–15%) and the column narrow (about 26ch), centred under the webcam.
2. **Sermon text format** (see SERMON_FORMAT.md): `#` title and `##` sections, `> ` scripture blocks, and `[notes]` that are shown but excluded from matching.
3. **Section list:** jump to any `##` section, for recording in takes.
4. **Time display:** elapsed time, words per minute, and estimated time remaining from the reader's own pace.
5. **Debug log long enough for a full sermon:** raise or compact the 5,000-event cap.
6. **Tune from real logs**, including protection against repeated lines.
7. *Optional, if logs show the need:*
   - **Better matching for spoken numbers and Bible references.**
   - **An on-device recognition mode with vocabulary biasing.** Chrome's `processLocally` mode, plus `recognition.phrases` to bias it toward words from the script. Per research in October 2026, both are shipped in desktop Chrome, but biasing works only on-device. Check current Chrome docs before relying on this.
   - **A microphone level meter.**
   - **"Commit + replay" interim handling.** Restore the state saved at the last final result, then replay the current interim words on every event. That way, revised interim guesses can't leave stale jumps. It helped in simulation, but needs real logs to justify it.

## 7. Working rules for the assistant

1. **Make one task per chat.** Make the smallest change that does the task well, and don't refactor or restyle unrelated code.
2. **Keep the single-file constraint**, the existing code style (2-space indent, small named functions, short "why" comments)
   and the CSS colour tokens on `:root`. Every new colour needs both light and dark values.
3. **Don't change the matcher constants or rules** unless the task is about tracking.
4. **Return the result as the complete updated file**, as a downloadable file if you can.
   If you can't produce a file, give replacement blocks instead: each one a whole function or CSS rule, with its exact name so the owner can find it.
   Use a short "insert after this exact line" note for new code. Never give partial diffs or `...` placeholders.
5. **Bump the version** in the comment at the top of the HTML file (e.g. `v1.1`), and give a **one-line changelog entry**.
6. **Give numbered test steps** the owner can do in Chrome in a few minutes, including what they should see.
7. **If a decision in section 4 must change**, say so plainly and why, and update this brief. Give the updated
   section text so the owner can paste it in.
8. **Write for a non-programmer:** short sentences, no jargon in UI text, and explain any choice they need to make.
