# Sermon text format for Speech Scroll

Sermon Bridge should export each English sermon as a **plain text file** (`.txt`, UTF-8) in this format.
Open it in Speech Scroll with **Edit text → Open .txt file**.

## The format

```
# The Faithfulness of God

## Introduction

Good morning, church. Today we're looking at a promise that has carried
believers through every generation.

> For God so loved the world, that he gave his only begotten Son,
> that whosoever believeth in him should not perish, but have everlasting life.
> John chapter 3, verse 16

[Pause. Let it land.]

Pastor Kim Jae-won once told me a story about this verse.

## The promise is for you

...
```

| Write this | Meaning | How Speech Scroll shows it |
|---|---|---|
| `# Title` | The sermon title (first line, once) | Large heading |
| `## Section` | A section of the sermon | Section heading, listed in the section menu |
| *(blank line)* | New paragraph | Paragraph break |
| `> text` | Scripture you read aloud | Indented and styled differently, still followed by voice |
| `[text]` | A note to yourself that you **don't** say aloud | Small and faded, skipped by the voice tracking |

**Note:** `>` and `[ ]` are planned in **Chat 2** of the plan. Until then, Speech Scroll shows them as ordinary text.
Headings already work.

## Writing rules

1. **Write it the way you will say it.** If you say "John chapter three, verse sixteen", write
   `John chapter 3, verse 16`, not `John 3:16`. Digits are fine because Speech Scroll treats "three" and "3" as the same.
   Do the same for dates, money, and anything abbreviated ("Doctor Lee", not "Dr. Lee").
2. **Write Korean names in the romanization you'll actually pronounce.** Use English text only, with no Korean characters in the spoken text.
   A pronunciation hint can go in a note: `Kim Jae-won [JEH-won]`.
3. **Keep paragraphs short**, 2–5 sentences. They're easier to find your place in.
4. **Keep it plain:** no footnotes, tables, bold, italics, bullet lists or numbered lists.
5. **Use one sermon per file**, named like `2026-10-12 The Faithfulness of God.txt`.

## Instruction to paste into the Sermon Bridge session

> I'm adding a "Teleprompter export" to Sermon Bridge. For each finished English sermon, produce a
> plain-text file (UTF-8, `.txt`) for my teleprompter app, Speech Scroll, using exactly this format:
>
> - Line 1: `# ` followed by the sermon title.
> - Each major section starts with a line `## ` followed by the section title, with blank lines around it.
> - Paragraphs are separated by one blank line. Keep paragraphs short (2–5 sentences). No line breaks inside a paragraph unless they're intended.
> - Scripture that is read aloud goes on lines starting with `> `. Put the reference on the last `> ` line, written as it's spoken,
>   e.g. `> John chapter 3, verse 16`.
> - Anything I should NOT say aloud (stage directions, reminders, pronunciation hints, slide cues) goes in square
>   brackets, e.g. `[Pause]` or `[Show slide 4]`.
> - Write everything as it will be spoken: Bible references as "Book chapter X, verse Y", "Doctor" not "Dr.",
>   numbers as I'd say them (digits are fine), Korean names in the English romanization I'll pronounce.
> - English only in the spoken text. No Korean characters, footnotes, tables, Markdown emphasis or lists.
> - File name: `YYYY-MM-DD Title.txt`.
>
> Please add this as an export option alongside the existing outputs, with a short example in the docs.
