# Speech Scroll: start here

This folder lets you keep developing Speech Scroll in an ordinary chat with Claude.
You don't need any developer tools. You do the testing yourself in Chrome, one small step at a time.

## What's in the package

| File | What it's for |
|---|---|
| `speech-scroll-app.html` | **The app itself.** Double-click it to open it in Chrome. |
| `PROJECT_BRIEF.md` | Everything a new chat needs to know about the app. **Attach it to every chat.** |
| `CHAT_PLAN.md` | The work, split into one task per chat, with prompts ready to paste. |
| `TEST_CHECKLIST.md` | A 10-minute check to run in Chrome after every change. |
| `SERMON_FORMAT.md` | The text format for your sermons, plus an instruction to paste into Sermon Bridge. |
| `sample-sermon.txt` | A short sermon in that format, for testing. |
| `CHANGELOG.md` | What has changed so far. Each chat adds a line. |
| `tests/` | Automated tests. You only need them if you ever use Claude Code again. A chat can't run them. |

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

## Where things stand

The app works, but **it has not yet been tested with a real voice**.
Chats 1–5 in `CHAT_PLAN.md` add the sermon features. **Step R** is a real read-through with the recording log on.
It can come at any point, and the sooner the better. **Chat 6** uses that log to tune the tracking for preaching.
