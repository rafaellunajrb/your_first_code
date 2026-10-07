# Chat plan

Do these in order, with **one new chat per task**. For every chat:
- **Attach** the latest `speech-scroll-app.html` and `PROJECT_BRIEF.md`, plus any extra file the task lists.
- **Paste** the prompt for that chat.
- **When it's done:**
  - Save the new file as a new version.
  - Run `TEST_CHECKLIST.md` and the task's own test steps.
  - Paste the changelog line into `CHANGELOG.md`.

| # | Task | Size | Needs |
|---|---|---|---|
| 1 | Camera mode | Medium | — |
| 2 | Sermon text format (`##`, `>`, `[notes]`) | Medium | `SERMON_FORMAT.md` |
| 3 | Section list | Small | Chat 2 done |
| 4 | Time display | Small | Chat 2 done |
| 5 | Debug log long enough for a full sermon | Small | — |
| R | **Real read-through with `?debug`** (no chat, you do this) | — | ideally after 1 and 5 |
| 6 | Tune tracking from your real log | Medium | log file from R |
| 7+ | Optional extras | — | only if R shows the need |

---

## Chat 1: Camera mode

**Attach:** `speech-scroll-app.html`, `PROJECT_BRIEF.md`

```
Please read PROJECT_BRIEF.md first, then speech-scroll-app.html.

Task: add a "Camera mode" for recording myself with the laptop webcam while reading.

Requirements:
1. A toggle in Settings ("Camera mode") and a keyboard shortcut C. Remember it in saved settings.
2. In camera mode, use separate saved values for the reading line (default 14%) and column width (default 26ch), adjustable with the existing sliders while camera mode is on. Turning camera mode off restores my normal values.
3. While listening in camera mode, hide the toolbar, progress bar, "heard" strip and any info banners, and let the text area use the full window height (recompute layout() so the reading line stays where it should). Error banners (microphone blocked, connection lost) must still show.
4. Moving the mouse or pressing any key shows the toolbar again for 3 seconds; pausing shows it permanently.
5. In camera mode, make the "Lost you" signal subtle: keep the amber left edge of the reading line but not the amber band across the text.
6. Hide the mouse cursor over the text while listening in camera mode.
Keep everything else unchanged. Follow the working rules in the brief (version bump to v1.1, changelog line, numbered test steps).
```

---

## Chat 2: Sermon text format

**Attach:** `speech-scroll-app.html`, `PROJECT_BRIEF.md`, `SERMON_FORMAT.md`

```
Please read PROJECT_BRIEF.md and SERMON_FORMAT.md first, then speech-scroll-app.html.

Task: support the sermon text format in render(), exactly as SERMON_FORMAT.md describes.

Requirements:
1. "# " line = sermon title (render as <h1>, larger). "## " (or deeper) line = section heading (<h2>, with a data attribute marking it as a section, for a later section menu). Headings are still read aloud and followed.
2. Consecutive lines starting with "> " form one scripture block (<blockquote>, indented, slightly different style in light and dark themes; keep line breaks). Words in it are followed by voice as normal.
3. Text inside [square brackets] is a note: shown smaller, italic and faded, NOT added to words[] (its spans get first = -1), so tracking, arrow keys and progress skip it. Brackets can enclose several words, may span a line break inside a paragraph, and a paragraph can be entirely a note. An unmatched "[" must not swallow the rest of the sermon: end the note at the end of the paragraph.
4. Update the editor hint text and the built-in SAMPLE to show the format briefly.
5. Keep placeAfterEdit(), stepLine(), stepWord() and click-to-set-position working with the new elements.
Version bump to v1.2, changelog line, numbered test steps (use sample-sermon.txt from the format doc as test text).
```

---

## Chat 3: Section list

**Attach:** `speech-scroll-app.html`, `PROJECT_BRIEF.md`

```
Please read PROJECT_BRIEF.md first, then speech-scroll-app.html.

Task: add a section list so I can jump to any "## " section (useful when recording a long sermon in several takes).

Requirements:
1. A "Sections" toolbar button opening a small list of section titles (and the sermon title at the top). Clicking one moves my place to the section's first word (as a manual jump) and closes the list. The current section is marked.
2. Keyboard: ] = next section, [ = previous section. Add them to the shortcuts table.
3. Hide the button when the text has no sections. Works in camera mode (the toolbar reappears on mouse move).
4. Accessible: the list is keyboard-navigable and closes with Escape.
Version bump, changelog line, numbered test steps.
```

---

## Chat 4: Time display

**Attach:** `speech-scroll-app.html`, `PROJECT_BRIEF.md`

```
Please read PROJECT_BRIEF.md first, then speech-scroll-app.html.

Task: show elapsed time and an estimate of time remaining, so I can pace a 45–90 minute sermon.

Requirements:
1. Elapsed time counts only while listening (pausing stops the clock). Reset it with Restart/Home, but not with other jumps.
2. My pace (words per minute) = spoken words advanced during the last ~3 minutes of listening; until there is enough data, assume 130 wpm. Don't count notes (spans with first = -1) or manual jumps.
3. Remaining time = words left / pace. Show "12:34 elapsed · about 31 min left" in the toolbar (compact on narrow screens). In camera mode while listening, show it only as a small, faint label in a bottom corner, and add a setting to turn that off.
4. Hovering over the time shows the pace, e.g. "Your pace: 138 words/min".
Version bump, changelog line, numbered test steps.
```

---

## Chat 5: Debug log long enough for a full sermon

**Attach:** `speech-scroll-app.html`, `PROJECT_BRIEF.md`

```
Please read PROJECT_BRIEF.md first, then speech-scroll-app.html.

Task: make the ?debug session log practical for a 90-minute sermon.

Requirements:
1. Raise the 5,000-event cap so a 90-minute session fits (estimate the events per minute from the onresult logging and size it with margin), and skip logging a result event when its transcripts are identical to the previous event.
2. If the cap is still reached, keep recording "lost", "jump", "error" and "end" events and note in the log that results were truncated.
3. Include the settings and the app version in the downloaded file, and show the number of logged events in the button's tooltip.
4. Ask before leaving the page (beforeunload) in debug mode if events were logged but never downloaded.
Version bump, changelog line, numbered test steps.
```

---

## Step R: the real read-through (you, no chat)

1. **Open the app with `?debug` at the end of the address.** In Chrome's address bar, add it after `.html`,
   e.g. `file:///C:/Users/you/Documents/speech-scroll-app.html?debug`, then press Enter.
2. **Load your test text:** open `sample-sermon.txt` or a real sermon through **Edit text → Open .txt file**.
3. **Set up as you will for recording:** webcam, camera mode if done, your normal distance and voice.
4. **Press Start and read for 5–10 minutes.** Please include:
   - normal reading at your preaching pace, with pauses
   - one sentence you **skip**, and one sentence you **read twice**
   - **a repeated line for emphasis** that isn't written twice ("God is faithful... God is faithful!")
   - a short **ad-lib** of a few sentences, then back to the text
   - Bible references, names and numbers
5. **Write down what went wrong while you read**, roughly where and what (e.g. "jumped back during the repeated line in section 2").
6. **Press "Download session log"** and keep the file with your notes.

---

## Chat 6: Tune tracking from the real log

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

*If the log is too big for the chat, use a shorter session (5 minutes) or split the file.*

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
