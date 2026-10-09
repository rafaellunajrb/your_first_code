# Chat plan

**Already done (v1.1.0):** camera mode, the sermon text format, the section list, the time display, and a debug log for full sermons.

Do the rest in order, with **one new chat per task**. For every chat:
- **Attach** the latest `speech-scroll-app.html` and `PROJECT_BRIEF.md`, plus any extra file the task lists.
- **Paste** the prompt for that chat.
- **When it's done:**
  - Save the new file as a new version.
  - Run `TEST_CHECKLIST.md` and the task's own test steps.
  - Paste the changelog line into `CHANGELOG.md`.
  - Publish the new version (see START_HERE.md).

| # | Task | Needs |
|---|---|---|
| R | **Real read-through with `?debug`** (no chat, you do this) | — |
| 1 | Tune tracking from your real log | the log file from R |
| 2+ | Optional extras | only if R or real use shows the need |

---

## Step R: the real read-through (you, no chat)

1. **Open the app with `?debug` at the end of the address.** In Chrome's address bar, add it after `.html`,
   e.g. `file:///C:/Users/you/Documents/speech-scroll-app.html?debug`, then press Enter.
2. **Load your test text:** open `sample-sermon.txt` or a real sermon through **Edit text → Open .txt file**.
3. **Set up as you will for recording:** webcam, camera mode (press C), your normal distance and voice.
4. **Press Start and read for 5–10 minutes.** (A full sermon also fits in the log.) Please include:
   - normal reading at your preaching pace, with pauses
   - one sentence you **skip**, and one sentence you **read twice**
   - **a repeated line for emphasis** that isn't written twice ("God is faithful... God is faithful!")
   - a short **ad-lib** of a few sentences, then back to the text
   - Bible references, names and numbers
5. **Write down what went wrong while you read**, roughly where and what (e.g. "jumped back during the repeated line in section 2").
6. **Press "Download session log"** and keep the file with your notes.

---

## Chat 1: Tune tracking from the real log

**Attach:** `speech-scroll-app.html`, `PROJECT_BRIEF.md`, the **log file**, the **text you read** (if it isn't the sample)

```
Please read PROJECT_BRIEF.md first, then speech-scroll-app.html, then the attached debug log (JSON: it contains the text I read and every recognition event with the tracked position "pos").

Here is what I noticed while reading: <PASTE YOUR NOTES>

Task:
1. Analyse the log: replay what Chrome sent (interim vs final, how results were split and revised, session restarts, how numbers/names were written) and find where the tracked position went wrong (jumped ahead, fell behind, jumped back, got stuck). Summarise the top problems with evidence (event times and transcripts).
2. In particular check whether my repeated-for-emphasis line caused a backward jump through relocate(), and whether "commit + replay" interim handling (brief section 6) would have helped.
3. Propose the smallest changes that fix the real problems, explain the trade-offs in plain words, then implement them. Don't loosen the jump-ahead rules unless the log clearly justifies it.
4. Update section 5 of the brief with what we now know about real Chrome behaviour.
Version bump, changelog line, numbered test steps.
```

*If the log is too big for the chat, use a shorter session (5 minutes). A full-sermon log is better analysed in Claude Code, which can replay it with `npm run replay`.*

---

## Optional chats (only if the real test shows the need)

**Spoken numbers and Bible references**
```
Read PROJECT_BRIEF.md, then the app. My log/test shows Bible references and numbers don't track well (details: <PASTE>). Improve normWords()/matching so "John chapter 3, verse 16", "John 3:16", "three sixteen", "twenty-five percent"/"25%", "$50"/"fifty dollars" match each other, without letting "one"/"won", "to"/"two", "for"/"four" cause false jumps. Smallest change, version bump, changelog, test steps.
```

**On-device recognition and vocabulary biasing**
```
Read PROJECT_BRIEF.md, then the app. Add an optional "Process speech on this computer" setting using Chrome's on-device recognition (SpeechRecognition.available()/install() and processLocally), with clear messages if it's unavailable or needs a download. When on-device, bias recognition toward the rare words in my script (names, places) using recognition.phrases, if supported. Feature-detect everything; default (cloud) mode must stay unchanged. First tell me what current Chrome actually supports. Version bump, changelog, test steps.
```

**Microphone level meter**
```
Read PROJECT_BRIEF.md, then the app. Add a small live microphone level indicator next to the status while listening, so I can tell a dead/wrong microphone from mishearing. Keep it working across Chrome's automatic recognition restarts and release the microphone when paused. Version bump, changelog, test steps.
```

---

## Templates for anything else

**Bug report**
```
Read PROJECT_BRIEF.md, then the app. Bug: <what I did>, <what I expected>, <what happened instead>. It happens <always / sometimes>. Find the cause, fix it with the smallest change, version bump, changelog line, test steps.
```

**New idea**
```
Read PROJECT_BRIEF.md, then the app. Idea: <describe>. Before writing code, tell me in plain words how you'd do it, what it would change for me, and anything it might break. Wait for my OK.
```
