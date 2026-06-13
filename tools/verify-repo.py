#!/usr/bin/env python3
"""verify-repo.py — the canonical From Dust repo lint (Infra-3).

One idempotent command that turns three recurring hard-won lesson classes into checks:

  1. ASSETS   every `assets/...` string referenced in index.html resolves to a file that is
              TRACKED IN THE GIT INDEX, case-sensitively (`git ls-tree -r HEAD`) — the disk is
              case-insensitive and lies; Pages serves the index. Also reports (warning-level)
              orphan tracked assets/ files with zero index.html references (the unwired-art
              audit, made free).
  2. JS       every inline <script> body in index.html passes `node --check`.
  3. MD LINKS every relative markdown link target under root/docs/agents/studio resolves to a
              real file or directory.

Exit 0 = clean (warnings allowed) · exit 1 = any error. Run it before any handoff / session end:

    python tools/verify-repo.py [--quiet]
"""
import re
import subprocess
import sys
import tempfile
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
QUIET = '--quiet' in sys.argv
errors = []
warnings = []


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, cwd=ROOT, **kw)


def section(title):
    if not QUIET:
        print(f"\n== {title}")


# ---------------------------------------------------------------- 1. assets
section('assets: index.html references vs the git index (case-sensitive)')
index_html = (ROOT / 'index.html').read_text(encoding='utf-8')
referenced = sorted(set(re.findall(r"['\"](assets/[^'\"]+?\.(?:png|jpg|jpeg|gif|webp|svg|mp3|ogg|wav))['\"]", index_html)))

ls = run(['git', 'ls-tree', '-r', 'HEAD', '--name-only'])
tracked = set(ls.stdout.splitlines())
tracked_assets = {p for p in tracked if p.startswith('assets/')}
tracked_lower = {p.lower(): p for p in tracked}

for path in referenced:
    if path in tracked:
        continue
    if path.lower() in tracked_lower:
        errors.append(f"assets: CASE MISMATCH — index.html says '{path}', git tree has '{tracked_lower[path.lower()]}' (404s on Pages)")
    elif (ROOT / path).exists():
        errors.append(f"assets: '{path}' referenced but UNTRACKED (works locally, 404s on Pages — commit it)")
    else:
        errors.append(f"assets: '{path}' referenced but MISSING (silent procedural fallback)")

orphans = sorted(p for p in tracked_assets if p not in referenced)
if orphans:
    warnings.append(f"assets: {len(orphans)} tracked assets/ files have zero index.html references (unwired art):")
    warnings.extend(f"  - {p}" for p in orphans)
if not QUIET:
    print(f"   {len(referenced)} referenced paths checked against {len(tracked_assets)} tracked assets")

# ---------------------------------------------------------------- 2. js syntax
section('js: inline <script> bodies -> node --check')
scripts = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', index_html, re.S)
for i, body in enumerate(scripts):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
        f.write(body)
        tmp = f.name
    r = run(['node', '--check', tmp])
    Path(tmp).unlink(missing_ok=True)
    if r.returncode != 0:
        errors.append(f"js: <script> #{i + 1} fails node --check:\n{r.stderr.strip()}")
if not QUIET:
    print(f"   {len(scripts)} inline script block(s) checked")

# ---------------------------------------------------------------- 3. md links
section('md: relative link targets resolve')
md_files = [p for p in ROOT.glob('*.md')]
for d in ('docs', 'agents', 'studio'):
    md_files += (ROOT / d).rglob('*.md')
LINK = re.compile(r'\]\(([^)\s]+)\)')
checked = 0
for md in md_files:
    text = md.read_text(encoding='utf-8', errors='replace')
    for target in LINK.findall(text):
        if target.startswith(('http://', 'https://', 'mailto:', '#', '/')):
            continue
        rel = urllib.parse.unquote(target.split('#', 1)[0].split('?', 1)[0])
        if not rel:
            continue
        checked += 1
        if not (md.parent / rel).exists():
            errors.append(f"md: {md.relative_to(ROOT)} -> broken link '{target}'")
if not QUIET:
    print(f"   {checked} relative links checked across {len(md_files)} markdown files")

# ---------------------------------------------------------------- report
print()
for w in warnings:
    print(f"WARN  {w}")
for e in errors:
    print(f"ERROR {e}")
print(f"\nverify-repo: {len(errors)} error(s), {len(warnings) and sum(1 for w in warnings if not w.startswith('  '))} warning group(s)"
      f" -> {'FAIL' if errors else 'OK'}")
sys.exit(1 if errors else 0)
