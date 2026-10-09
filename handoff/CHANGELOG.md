# Changelog

Add one line per change, newest at the bottom: `vX.Y (date): what changed`.

- **v0.1:** first prototype. It scrolled at a fixed speed while you were talking.
- **v0.2:** rewrite. It follows the reader word by word. Added paste or open your own text, a full-screen reader, settings, keyboard shortcuts, click to set your place, saved text and settings, and error messages.
- **v0.3:** keeps the screen awake while listening, follows you when you re-read, and adds a "Back to my place" button after a manual scroll.
- **v1.0 (Oct 2026):** tracking reliability and feedback, from a reviewed audit:
  - **Tracking:** stricter jump-ahead rules, and only a final result finishes the script.
  - **Feedback:** a "Lost you" state, a warning when nothing is heard, and an honest "Listening" status. The "heard" strip is fixed.
  - **Reliability:** retries after network errors and restarts faster.
  - **Editor:** keeps drafts and your place after an edit, and headings render correctly.
  - **Other:** clicker keys (PgUp/PgDn/B), a `?debug` session log, the browser's own language by default, a microphone and privacy hint, and automated tests (`tests/`).
- **v1.0.1 (Oct 2026):** can be installed as an app from its GitHub Pages address. Adds an app manifest and icons, an "Install app" button, and a root page that redirects to the app. The local file works as before.
- **v1.1.0 (Oct 2026):** sermon features and groundwork for future updates:
  - **Camera mode (C):** controls hide while reading, and the text sits high and narrow under the webcam.
  - **Sermon text format:** `#` title, `##` sections, `>` scripture and `[notes]` that aren't read aloud.
  - **Sections menu**, plus `[` and `]` to move between sections.
  - **Time display:** elapsed time and time left, from your own pace.
  - **Debug log** long enough for a full sermon.
  - **Groundwork:** a version shown in Settings, all tracking settings in one place, versioned saved data, `npm test`, automatic tests on GitHub, and a replay tool for real logs.
- **v1.2.0 (Oct 2026):**
  - **Sermon library (O):** keep many sermons, each remembering your place. Add from .txt files (several at once) or by pasting, open, delete. Older saved text moves in automatically.
  - **Microphone check (M):** a level meter, which microphone is in use, what Chrome heard, and a clear verdict.
  - **Countdown:** in camera mode, a 3-2-1 countdown (configurable) before listening starts.
  - **Tidier toolbar:** icon-only buttons on narrower screens.
  - **Housekeeping:** the app now lives on `master` in the `speech-scroll` repository.
