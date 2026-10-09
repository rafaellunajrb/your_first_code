# Speech Scroll: start here

This folder lets you keep developing Speech Scroll in an ordinary chat with Claude.
You don't need any developer tools. You do the testing yourself in Chrome, one small step at a time.

## What's in the package

| File | What it's for |
|---|---|
| `speech-scroll-app.html` | **The app itself.** Double-click it to open it in Chrome, or use the web version (below). |
| `manifest.webmanifest`, `icons/`, `index.html`, `.nojekyll` | Let Chrome install the web version as an app. They rarely change. |
| `PROJECT_BRIEF.md` | Everything a new chat needs to know about the app. **Attach it to every chat.** |
| `CHAT_PLAN.md` | The work, split into one task per chat, with prompts ready to paste. |
| `TEST_CHECKLIST.md` | A 10-minute check to run in Chrome after every change. |
| `SERMON_FORMAT.md` | The text format for your sermons, plus an instruction to paste into Sermon Bridge. |
| `sample-sermon.txt` | A short sermon in that format, for testing. |
| `CHANGELOG.md` | What has changed so far. Each chat adds a line. |
| `tests/`, `tools/`, `package.json`, `CLAUDE.md` | Automated tests and helper tools for Claude Code sessions. A chat can't run them, but GitHub runs the tests by itself (below). |

## How each chat works

1. **Start a new chat** for each task in `CHAT_PLAN.md`. Do them in order, and use one chat per task.
2. **Attach two files:** `speech-scroll-app.html` and `PROJECT_BRIEF.md`.
   Some tasks name an extra file to attach.
3. **Paste that task's prompt** from `CHAT_PLAN.md`.
4. **Get the updated file back.** Ask for the complete updated `speech-scroll-app.html` as a downloadable file.
   - If the chat can't make files, it will give you replacement blocks instead. Each block replaces a whole named function.
     Open the file in a plain text editor (Notepad, TextEdit in plain-text mode, or VS Code). Use Find to locate the function and paste over all of it.
5. **Save it as a new version** so you can always go back,
   e.g. `speech-scroll-app-v1.1.html`. Keep the previous version.
6. **Test it** with `TEST_CHECKLIST.md` plus the task's own test steps.
   If something is wrong, tell the same chat exactly what you saw.
7. **Start the next task in a fresh chat** once it works. Attach the **new** file and the brief.
   Also paste the chat's changelog line into `CHANGELOG.md`. If the chat says the brief needs updating, update `PROJECT_BRIEF.md` too.

Why a new chat per task: long chats get slow and start forgetting details. The brief carries everything the next chat needs.

## Tips

- **If the chat's answer stops halfway** (a long file can get cut off), say "continue from exactly where you stopped".
  Then join the parts carefully. Better still, ask for the changed functions only.
- **If a change breaks the app**, go back to your previous saved version and start that task again in a new chat.
  Describe what went wrong.
- **Keep the file name ending in `.html`.** Opening the file directly from your computer is fine.
- **Chrome may ask for microphone permission** each time you open the file. Choose **Allow**.

## Use it as an app (recommended)

The app can live at a web address and be installed from Chrome, so it gets its own window and icon.
Chrome also remembers the microphone permission. Your sermons and settings stay on your laptop.
Only the app's code is on the web.

**One-time setup (2 minutes, on github.com):**
1. **Open the repository settings:** go to <https://github.com/rafaellunajrb/speech-scroll/settings/pages>.
2. **Choose the source:** under **Build and deployment → Source**, choose **Deploy from a branch**.
3. **Choose the branch:** under **Branch**, pick `master` and the folder **/ (root)**, then press **Save**.
   If you set it up earlier with the long `claude/…` branch, switch it to `master` the same way.
4. **Wait for it to go live:** after a minute or two the page shows "Your site is live at https://rafaellunajrb.github.io/speech-scroll/".

**Install it (on the laptop you record with):**
1. **Open the app's address:** go to <https://rafaellunajrb.github.io/speech-scroll/> in Chrome. It opens Speech Scroll.
2. **Install it:** press the **Install app** button in the toolbar, or use the install icon at the right of Chrome's address bar.
   You can also use Chrome's menu → **Cast, save and share → Install page as app**.
3. **Open it like any program:** Speech Scroll now opens from your desktop, Start menu or Dock in its own window.
4. **Load your text again:** the web version has its own saved text and settings, separate from the local file.
   Add your sermons once with **Sermons → Add from .txt file**.

**Publish a new version after a chat:**
1. **Open the repository on GitHub:** go to <https://github.com/rafaellunajrb/speech-scroll>.
2. **Upload the new file:** choose **Add file → Upload files**, drop in the new `speech-scroll-app.html`, keep the same name,
   and choose **Commit directly to the `master` branch**.
3. **Reload the app:** after 1–2 minutes, reload the installed app with Ctrl+R (Cmd+R on a Mac).
   It can take up to 10 minutes for the change to appear.

**Automatic check:** after each upload, GitHub runs the app's automated tests by itself (about 3 minutes).
On the repository page, a green ✓ next to your upload means they passed. A red ✗ means something broke: open it,
copy the lines that say FAIL, and give them to the chat that made the change.

If a new version breaks something, upload your previous saved version the same way.

## Where things stand

Version 1.2.0 has camera mode, the sermon text format, sections, the time display, full-length debug logs,
a **sermon library**, a **microphone check** (M) and a **countdown** before reading in camera mode.
**It has not yet been tested with a real voice.** **Step R** in `CHAT_PLAN.md` is a real read-through with the recording log on,
and **Chat 1** uses that log to tune the tracking for preaching.
