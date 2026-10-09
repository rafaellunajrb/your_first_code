# Speech Scroll

A voice-following teleprompter in a single file: `speech-scroll-app.html`. The owner is a pastor, not a programmer,
who records English translations of Korean sermons on a laptop webcam for YouTube.
**Read `handoff/PROJECT_BRIEF.md` before changing anything.** It covers purpose, constraints, architecture, the decisions not to undo, what's unverified, and the roadmap.

## Status (October 2026): read this first
- **v1.2.0 is live** at https://rafaellunajrb.github.io/speech-scroll/ (GitHub Pages from `master`, root). The owner confirmed it works
  and may have installed it as a Chrome app. The repository was renamed from `your_first_code` to `speech-scroll`, and `master` is the main branch.
- **Built so far:**
  - **Tracking:** word-by-word voice tracking with a "Lost you" state and network retry.
  - **Recording:** camera mode, a countdown, and a microphone check.
  - **Sermons:** the sermon text format, sections, a time and pace display, and the sermon library.
  - **Tools:** a `?debug` session log and a replay tool. The history is in `handoff/CHANGELOG.md`.
- **Still not tested with a real voice.** Every tracking number so far comes from simulated recognizer output.
  The owner was asked to do a real read-through with `?debug` and camera mode, and bring the downloaded log plus notes.

## What to do next (agreed with the owner, in this order)
1. **If the owner brings a `?debug` log:** analyse it first.
   - **Replay it:** `npm run replay -- log.json` before and after any change.
   - **Find out:** where tracking jumped ahead, fell behind or jumped back. In particular, check whether a line repeated for emphasis triggered a backward `relocate()`, how Chrome wrote Bible references, names and numbers, and whether session restarts lost words.
   - **Fix only what the log shows,** with the smallest change. Add the problem stretch to `tests/scenarios.json`, then update brief section 5 with what real Chrome does.
2. **Library export and import (backup).** The sermon library lives only in this browser's localStorage, so a browser reset or a new laptop loses it.
   Add "Export library" (one JSON file: index plus texts) and "Import library" (merge, skipping identical texts) in the Sermons dialog, plus an occasional gentle backup reminder.
   The owner was told this is the next feature to build if no log is ready.
3. **Then, one at a time and only if the owner wants them:**
   - **A summary after each reading:** duration, pace, where it lost you, and fast or slow sections.
   - **A target length** with a quiet ahead/behind indicator.
   - **Vocabulary biasing:** on-device recognition (`processLocally`) plus `recognition.phrases` from the script's rare words. Only if logs show names being misheard.
4. **Don't:** build a desktop app (Electron and similar can't use Chrome's speech service), rewrite the matcher without log evidence,
   or add on-screen elements that show while recording in camera mode.

## Working with the owner
- **Not a programmer.** Explain in short, plain sentences, with no jargon in UI text or answers.
  Give numbered steps for anything they must do on GitHub or in Chrome.
- **They usually ask for ranked recommendations,** then say "proceed with all of your recommendations".
  Rank by real benefit per effort, and be honest about what's unverified (e.g. "tested with simulated speech only").
- **They also continue work in an ordinary chat** (another provider) using `handoff/`, so keep it current: after every release,
  update the brief, changelog and checklist, then run `npm run package`.
- **"Sermon Bridge" is their separate app** that translates Korean sermons to English. It should export sermons in
  `handoff/SERMON_FORMAT.md` format, and the instruction to paste into it is in that file. Its code isn't in this repository.
- **Repository settings and merges are visible, outward actions.** Ask before merging to `master` or changing settings, unless the owner already said to.
  Releases go by pull request into `master` after CI passes.

## Environment notes (Claude Code cloud sessions)
- **Playwright is installed globally** in the sandbox: `NODE_PATH=$(npm root -g) npm test`.
- **`github.io` is blocked** by the sandbox network, so the live site can't be checked from here. Ask the owner what they see.
- **The GitHub API can't change repository settings or Pages from this sandbox** (403 from the proxy). Give the owner numbered steps for **Settings** instead.
- **GitHub Actions uses the runner's preinstalled Chrome** (`PW_CHANNEL=chrome`). `npx playwright install --with-deps` hung on the runner before, so don't reintroduce it.

## Rules
- Keep the app one self-contained HTML file. No libraries, no CDNs, no build step. Desktop Chrome only.
  It must work both as a local file (`file://`) and from GitHub Pages. The web-only files (`manifest.webmanifest`, `icons/`, `index.html`, `.nojekyll`) are optional extras.
- Tracking changes (anything in `hearWord`, `contextScore`, `relocate`, `normWords`, `onresult`, or `TUNING`) need evidence:
  replay real `?debug` logs with `npm run replay -- <log.json>` before and after, and add a scenario to `tests/scenarios.json`.
- UI text is for a non-technical user: short, plain, friendly. New colours need light and dark values as `:root` tokens.
- Saved data shape changes: bump `SCHEMA` and add a step to `migrate()`.

## Commands
- `npm install` (once), then `npm test`: replay scenarios plus 90 feature checks in headless Chromium (under a minute).
  In the Claude Code cloud sandbox, Playwright is global: `NODE_PATH=$(npm root -g) npm test`.
  `PW_CHANNEL=chrome npm test` uses an installed Google Chrome instead of Playwright's Chromium (GitHub does this).
- `npm run replay -- path/to/log.json [--trace]`: compares a real session against the current code.
- `npm run package`: rebuilds `handoff/speech-scroll-handoff.zip` for chat-based work.

## Releasing a change
1. Bump `APP_VERSION` (and the version in the top HTML comment and `package.json`).
2. Add a line to `handoff/CHANGELOG.md`, and update `handoff/PROJECT_BRIEF.md` (architecture, decisions or roadmap) if they changed.
   Update `handoff/TEST_CHECKLIST.md` for new user-visible features.
3. Run `npm test`, then `npm run package`.
4. Work lands on `master` (by pull request). GitHub Pages serves `master` at https://rafaellunajrb.github.io/speech-scroll/.
   The owner also uploads chat-made versions straight to `master` through GitHub's website.
