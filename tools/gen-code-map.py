#!/usr/bin/env python3
"""gen-code-map.py — regenerate docs/CODE_MAP.md from index.html's § banners (Infra-4).

The map lists every `// §N  TITLE` section in FILE ORDER with its line range, function
declarations, and UPPER_CASE consts (the live tuning knobs) — so an agent greps a symbol's
section instead of guessing, and line refs in task docs can rot harmlessly (the map is
regenerable, never hand-edited).

    python tools/gen-code-map.py          # rewrites docs/CODE_MAP.md
    python tools/gen-code-map.py --check  # exit 1 if the committed map is stale
"""
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'index.html'
OUT = ROOT / 'docs' / 'CODE_MAP.md'

BANNER = re.compile(r'^// (§\S+)\s+(.+?)\s*$')
FUNC = re.compile(r'^\s{0,2}(?:async\s+)?function\s+(\w+)\s*\(')
KNOB = re.compile(r'^\s{0,2}(?:const|let)\s+([A-Z][A-Z0-9_]{2,})\s*=')

lines = SRC.read_text(encoding='utf-8').splitlines()
sections = []  # {tag, title, start, end, funcs, knobs}
cur = {'tag': '(pre-§1)', 'title': 'HTML / CSS / boot script before the first banner', 'start': 1, 'funcs': [], 'knobs': []}
for i, line in enumerate(lines, 1):
    m = BANNER.match(line)
    if m:
        cur['end'] = i - 1
        sections.append(cur)
        cur = {'tag': m.group(1), 'title': m.group(2), 'start': i, 'funcs': [], 'knobs': []}
        continue
    f = FUNC.match(line)
    if f:
        cur['funcs'].append(f.group(1))
    k = KNOB.match(line)
    if k:
        cur['knobs'].append(k.group(1))
cur['end'] = len(lines)
sections.append(cur)

body = []
body.append('# To Dust — Code Map (GENERATED — DO NOT EDIT)')
body.append('')
body.append(f'*Regenerated from `index.html`\'s `// §` banners by `tools/gen-code-map.py` '
            f'({date.today().isoformat()}, {len(lines)} lines). Re-run the tool after adding/moving a '
            f'section or a notable system; **edit the banners, not this file.** Sections appear in FILE '
            f'ORDER (the § numbers are stable names, not positions — e.g. §10 INIT lives near the end).*')
body.append('')
for s in sections:
    n_f, n_k = len(s['funcs']), len(s['knobs'])
    body.append(f"## {s['tag']}  {s['title']}")
    body.append(f"*lines {s['start']}–{s['end']}* · {n_f} function(s) · {n_k} knob(s)")
    if s['funcs']:
        body.append('')
        body.append('**Functions:** ' + ' · '.join(f'`{x}`' for x in s['funcs']))
    if s['knobs']:
        body.append('')
        body.append('**Knobs (UPPER consts):** ' + ' · '.join(f'`{x}`' for x in s['knobs']))
    body.append('')
text = '\n'.join(body)

if '--check' in sys.argv:
    stale = (not OUT.exists()) or OUT.read_text(encoding='utf-8') != text
    print('CODE_MAP.md is ' + ('STALE — run python tools/gen-code-map.py' if stale else 'current'))
    sys.exit(1 if stale else 0)

OUT.write_text(text, encoding='utf-8', newline='\n')
print(f'wrote {OUT.relative_to(ROOT)}: {len(sections)} sections, '
      f'{sum(len(s["funcs"]) for s in sections)} functions, {sum(len(s["knobs"]) for s in sections)} knobs')
