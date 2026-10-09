# Test checklist (about 15 minutes, in Chrome)

Run this after **every** change, as well as the task's own test steps. If anything fails, tell the chat which step,
what you expected and what you saw. Keep your previous working version until everything passes.

**Setup:** open the new `speech-scroll-app.html` in Chrome.
Press **Edit text → Load sample → Use this text**, then **Restart**.

## A. Basics
1. **The page opens with no error message.** The sample text shows, and the first word is highlighted.
2. **Settings:** move each slider (text size, column width, reading line). The text changes straight away.
   Switch the theme to Dark and back.
3. **Close and reopen the file.** Your text, settings and place are remembered.

## B. Voice tracking (needs your microphone)
4. **Press Start.** The first time, a microphone hint appears. Choose **Allow** in Chrome's prompt.
   The status changes from "Starting…" to **Listening**.
5. **Read the first two paragraphs aloud.** The highlight follows within a word or two, and the page scrolls to
   keep your line on the reading band.
6. **Skip one sentence.** After a few words the highlight catches up.
7. **Go back and re-read a sentence.** After about 4 words the highlight moves back to you.
8. **Say something not in the text** for ~10 seconds. The status turns amber: "Lost you…".
   Continue reading the text: it finds you and the amber goes away.
9. **Stay silent for ~12 seconds.** A message says it hasn't heard anything. Speak and it disappears.
10. **Press Pause** (or Space). The status shows "Not listening" and the "heard" strip disappears.

## C. Controls
11. **Click any word.** It becomes the current word.
12. **Arrow keys:** ← → move one word, ↑ ↓ and PgUp/PgDn move one line, Home goes to the start.
13. **Scroll the page with the mouse wheel.** "Back to my place" appears. Click it and the page returns.
14. **Press F** for full screen, then Esc. Press **+** and **−** to change the text size.
15. **Edit text:** fix a word in the middle and press **Use this text**. Your place is kept.
    Drag-select text in the editor and release the mouse outside the box: the editor stays open.
16. **Read the last sentence.** The status shows **Finished** with a message.
    Pressing Space does nothing, and **Restart** goes back to the top.

## C2. Sermon features
17. **Open `sample-sermon.txt`** (Edit text → Open .txt file → Use this text). The title is large, sections are headings,
    the scripture is an indented block, and `[notes]` are small and faded.
18. **Read past a note without saying it.** Tracking carries on as normal.
19. **Sections:** press **Sections** and pick one: the highlight jumps there. Press `]` and `[` to move between sections.
20. **Time:** the toolbar shows the elapsed time and "about N min left". The clock only runs while listening.
    **Restart** sets it back to 0:00. Hovering over it shows your pace after a minute or so of reading.
21. **Camera mode:** press **C** and Start.
    - The controls fade away and the current line sits high, near the webcam, with a small clock in the corner.
    - Moving the mouse brings the toolbar back for 3 seconds, but **PgDn does not**.
    - Pause brings the controls back, and **C** again returns to the normal layout.

## D. Debug log
22. **Open the file with `?debug` at the end of the address.** A "Download session log" button appears.
    Read a sentence, press it, and a `.json` file downloads. Hovering over the button shows how many events it has recorded.

## E. Whatever the task changed
23. **Do the chat's own numbered test steps.**
24. **Check the task's feature in both light and dark theme**, and in a narrow window (drag the window narrow).
