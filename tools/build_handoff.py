"""Rebuild handoff/speech-scroll-handoff.zip: the app, its web files, the handoff docs and tests,
in one folder, for continuing work in a chat. Run from anywhere: python3 tools/build_handoff.py"""
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'handoff', 'speech-scroll-handoff.zip')
FOLDER = 'speech-scroll-handoff'

# (path in repo, path inside the zip folder)
FILES = [('speech-scroll-app.html', ''), ('index.html', ''), ('manifest.webmanifest', ''),
         ('.nojekyll', ''), ('package.json', ''), ('CLAUDE.md', '')]
DIRS = [('icons', 'icons'), ('tests', 'tests'), ('tools', 'tools'), ('handoff', '')]


def entries():
    for name, dest in FILES:
        yield os.path.join(ROOT, name), os.path.join(FOLDER, dest, name)
    for src, dest in DIRS:
        for dirpath, _, files in os.walk(os.path.join(ROOT, src)):
            for f in sorted(files):
                full = os.path.join(dirpath, f)
                if full == OUT or f.endswith('.zip') or '__pycache__' in full:
                    continue
                rel = os.path.relpath(full, os.path.join(ROOT, src))
                yield full, os.path.join(FOLDER, dest, rel)


if __name__ == '__main__':
    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
        count = 0
        for src, arc in entries():
            z.write(src, os.path.normpath(arc))
            count += 1
    print(f'Wrote {os.path.relpath(OUT, ROOT)} ({count} files)')
