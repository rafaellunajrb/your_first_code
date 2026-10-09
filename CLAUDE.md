# Speech Scroll

A voice-following teleprompter in a single file: `speech-scroll-app.html`. The owner is a pastor, not a programmer,
who records English translations of Korean sermons on a laptop webcam for YouTube.
**Read `handoff/PROJECT_BRIEF.md` before changing anything.** It covers purpose, constraints, architecture, the decisions not to undo, what's unverified, and the roadmap.

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
