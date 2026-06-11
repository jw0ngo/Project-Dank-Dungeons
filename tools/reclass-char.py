#!/usr/bin/env python3
"""reclass-char.py — reorganize `assets/char/` into **per-type** subfolders, moving the
files (`git mv`) AND rewriting the matching `ART_MANIFEST` strings in `index.html` as ONE
atomic operation.

TARGET LAYOUT  (group / type / sprites)
---------------------------------------
    assets/char/<group>/<type>/<stem>-<dir>.png
    e.g.  assets/char/goblins/goblin/goblinatk-ne.png
          assets/char/wolves/alphawolf/alphawolf-n.png
          assets/char/player/knight/knightatk-s.png   (player class RENAMED -> knight)

Each character TYPE owns a folder so its whole animation set (idle + atk + hurt + future
walk/anim sheets) stays together, instead of being dumped flat into a faction bucket.

WHY ONE TOOL, NOT TWO STEPS  (same reason as fold-assets.py)
-----------------------------------------------------------
Every wired char sprite is referenced by an explicit manifest path
(`'char.goblinatk.ne':'assets/char/goblins/goblinatk-ne.png'`). If the files move before
the paths are rewritten, every sprite 404s on `main` and silently falls back to the blocky
procedural sprite (which `node --check` does NOT catch). Both halves must land in one commit.

TWO MIGRATION CLASSES, DIFFERENT RISK
-------------------------------------
  * goblins + wolves  — PATH-ONLY. Manifest KEYS stay (`char.goblinatk.ne` unchanged); only
    the path string moves. Zero engine-logic change. Low risk.
  * player -> knight  — PATH **and KEY** rename (`char.player.* -> char.knight.*`,
    `fx.slash -> fx.knight.slash`). This is the player's VISUAL CLASS, kept separate from the
    game-logic hero identity. The entity `kind:'player'`, `SpriteRegistry('player')` (the
    pixel-art fallback), and the map editor STAY `player` — the `player` entity *wears* a
    `knight` class. So the draw-code string literals that select the class art
    (`_bodyId='player'`, `'char.playerwalk'+...`, `_bodyId==='playerheavy'`,
    `gArtReg['fx.slash']`) must flip to `knight`, but a blind 'player'->'knight' replace would
    wrongly hit the game-logic identity. This tool does NOT touch those — it PRINTS the exact
    engineer edit-list to apply in the SAME commit (see DRAW_CODE_EDITS).

OWNERSHIP: Artist-authored tooling; `--apply` edits `index.html`, so the **engineer** runs
`--apply` and commits (sole editor of the game file). The Artist runs the default dry-run to
verify the plan before handoff.

USAGE
-----
  python tools/reclass-char.py                    # dry-run: print the full plan + checks
  python tools/reclass-char.py --only goblins,wolves   # filter to a subset (stage the risk)
  python tools/reclass-char.py --apply            # git mv + rewrite manifest (ENGINEER)
"""
import argparse, os, re, subprocess, sys

CHAR_ROOT = 'assets/char'
OCTS = {'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'}

# type -> group folder. A filename stem is matched against these type names (longest first);
# the remainder is the pose suffix (''/'atk'/'hurt'/'heavy'/'walk1'/...). No type name is a
# prefix of another, so the match is unambiguous. Adding a new enemy = one entry here.
TYPE_GROUP = {
    'goblin': 'goblins', 'archer': 'goblins', 'warrior': 'goblins',
    'shaman': 'goblins', 'bomber': 'goblins', 'king': 'goblins',
    'direwolf': 'wolves', 'alphawolf': 'wolves', 'wolfmother': 'wolves',
    'player': 'player',
}
# type -> on-disk/key rename (player's visual class is "knight"). Others map to themselves.
TYPE_RENAME = {'player': 'knight'}

# Player attack FX: reclassified from the mislabeled "god-agnostic" _shared/ to the knight
# owner (mirrors the fx/<god>/ owner scheme). key old -> (key new, new path).
FX_MOVES = {
    'fx.slash':  ('fx.knight.slash',  'assets/fx/knight/slash.png'),
    'fx.thrust': ('fx.knight.thrust', 'assets/fx/knight/thrust.png'),
}

# The non-manifest draw-code edits the engineer must apply in the SAME commit as --apply.
# (Printed, not auto-applied — see header.) Kept here as the single source of truth.
DRAW_CODE_EDITS = [
    "_bodyId default + pose strings (~index.html:8103-8108): 'player'->'knight',",
    "   'playerdash'->'knightdash', 'playerheavywindup'->'knightheavywindup',",
    "   'playerheavy'->'knightheavy', 'playeratk'->'knightatk'.",
    "Walk gate + key (~8117, 8120): _bodyId==='player' -> 'knight';",
    "   'char.playerwalk'+... -> 'char.knightwalk'+...",
    "Pose-mult compares (~8134-8141): _bodyId==='playerheavy'->'knightheavy',",
    "   _bodyId==='playerheavywindup'->'knightheavywindup'.",
    "FX lookups: gArtReg['fx.slash'] (x3: _slashTintCanvas ~7542, whirlwind ~8203) and",
    "   gArtReg['fx.thrust'] (~7466) -> 'fx.knight.slash' / 'fx.knight.thrust'.",
    "LEAVE AS 'player' (game-logic identity, NOT art): entity kind:'player',",
    "   SpriteRegistry.register/get('player') fallback (~2105/8109), the map editor,",
    "   gEntsRaw 'player' lookups, PSCALE/PLAYER_WALK_OCT const names (cosmetic, optional).",
]

_TYPES_LONGEST = sorted(TYPE_GROUP, key=len, reverse=True)


def parse(fname):
    """'goblinatk-ne.png' -> (stem='goblinatk', dir='ne'); None if not a <stem>-<dir>.png."""
    if not fname.lower().endswith('.png'):
        return None
    base = fname[:-4]
    if '-' not in base:
        return None
    stem, d = base.rsplit('-', 1)
    return (stem, d) if d in OCTS else None


def classify(stem):
    """stem -> (group, new_stem, type_dir) or None if no known type prefixes it.
    type_dir is the renamed type-folder name (player->knight); new_stem carries the rename
    plus the original pose suffix (''/'atk'/'hurt'/'walk1'/...)."""
    for t in _TYPES_LONGEST:
        if stem == t or stem.startswith(t):
            new_type = TYPE_RENAME.get(t, t)
            return TYPE_GROUP[t], new_type + stem[len(t):], new_type
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--index', default='index.html')
    ap.add_argument('--only', default='', help='comma list of groups to migrate (default: all)')
    ap.add_argument('--apply', action='store_true', help='git mv + edit index.html (ENGINEER runs this)')
    args = ap.parse_args()
    only = {g.strip() for g in args.only.split(',') if g.strip()}

    # 1. walk every char sprite (recursive — some are already in faction folders) and plan moves.
    moves, unmapped = [], []
    for dirpath, _, files in os.walk(CHAR_ROOT):
        for f in files:
            pd = parse(f)
            if not pd:
                if f.lower().endswith('.png'):
                    unmapped.append(os.path.join(dirpath, f))
                continue
            stem, d = pd
            c = classify(stem)
            if not c:
                unmapped.append(os.path.join(dirpath, f)); continue
            group, new_stem, type_dir = c
            if only and group not in only:
                continue
            old = os.path.join(dirpath, f).replace('\\', '/')
            new = f'{CHAR_ROOT}/{group}/{type_dir}/{new_stem}-{d}.png'
            if old != new:
                moves.append((old, new))

    if unmapped:
        print('ABORT — these char .png match no known type (extend TYPE_GROUP):')
        for u in unmapped:
            print('   ', u)
        sys.exit(1)

    # 2. plan manifest rewrites. Path move for every wired file; KEY rewrite only where the
    #    stem was renamed (player -> knight). Driven by exact quoted strings (no partial hits).
    idx = open(args.index, encoding='utf-8').read()
    path_rw, key_rw = [], []
    for old, new in moves:
        if f"'{old}'" in idx:
            path_rw.append((old, new))
    # key rewrites: char.player<pose>.<dir> -> char.knight<pose>.<dir>
    if not only or 'player' in only:
        for m in re.finditer(r"'char\.(player[a-z0-9]*)\.(n|ne|e|se|s|sw|w|nw)'", idx):
            old_key = f"'char.{m.group(1)}.{m.group(2)}'"
            new_key = f"'char.{'knight' + m.group(1)[len('player'):]}.{m.group(2)}'"
            key_rw.append((old_key, new_key))
    # FX moves (player class FX -> fx/knight/)
    fx_plan = []
    if not only or 'player' in only:
        for old_key, (new_key, new_path) in FX_MOVES.items():
            m = re.search(rf"'{re.escape(old_key)}'\s*:\s*'([^']+)'", idx)
            if m:
                fx_plan.append((old_key, new_key, m.group(1), new_path))

    # ── report ──
    print(f'== reclass {CHAR_ROOT}/  ->  per-type folders' + (f'  (only: {", ".join(sorted(only))})' if only else '') + ' ==')
    print(f'  files to move:             {len(moves)}')
    print(f'  manifest paths to rewrite: {len(path_rw)}')
    print(f'  manifest KEYS to rewrite:  {len(key_rw)}  (player -> knight)')
    print(f'  FX moves (slash/thrust):   {len(fx_plan)}')
    moved_no_ref = [n for (o, n) in moves if (o, n) not in path_rw]
    if moved_no_ref:
        print(f'  moved files w/ NO manifest ref (unwired - e.g. hurt poses): {len(moved_no_ref)}')
        for n in moved_no_ref[:6]:
            print('      -', n)
        if len(moved_no_ref) > 6:
            print(f'      ... +{len(moved_no_ref) - 6} more')
    print('\n  sample moves:')
    for o, n in moves[:6]:
        print(f'    {o}  ->  {n}')
    for old_key, new_key, op, np_ in fx_plan:
        print(f'    [fx] {op}  ->  {np_}   ({old_key} -> {new_key})')

    if not args.apply:
        print('\n  DRAW-CODE EDITS the engineer applies in the SAME commit (NOT auto-applied):')
        for e in DRAW_CODE_EDITS:
            print('    -', e)
        print('\n  DRY-RUN - no changes. Engineer: rerun with --apply to git mv + rewrite the manifest,')
        print('  then apply the draw-code edits above, then node --check + python dev.py, all in one commit.')
        return

    # 3. APPLY — mkdir, git mv (incl. fx), rewrite manifest paths + keys (exact quoted strings).
    for _, new in moves:
        os.makedirs(os.path.dirname(new), exist_ok=True)
    for o, n in moves:
        subprocess.run(['git', 'mv', o, n], check=True)
    for old_key, new_key, op, np_ in fx_plan:
        os.makedirs(os.path.dirname(np_), exist_ok=True)
        subprocess.run(['git', 'mv', op, np_], check=True)
    for o, n in path_rw:
        idx = idx.replace(f"'{o}'", f"'{n}'")
    for ok, nk in key_rw:
        idx = idx.replace(ok, nk)
    for old_key, new_key, op, np_ in fx_plan:
        idx = idx.replace(f"'{old_key}':'{op}'", f"'{new_key}':'{np_}'")
    open(args.index, 'w', encoding='utf-8', newline='').write(idx)

    # 4. self-verify: every assets/char|fx/ manifest path resolves on disk.
    bad = []
    for m in re.finditer(r"'(assets/(?:char|fx)/[^']+\.png)'", idx):
        if not os.path.isfile(m.group(1)):
            bad.append(m.group(1))
    print(f'\nAPPLIED: moved {len(moves)} char + {len(fx_plan)} fx files; '
          f'rewrote {len(path_rw)} paths + {len(key_rw)} keys.')
    if bad:
        print(f'  [WARN] {len(set(bad))} manifest path(s) DO NOT resolve:')
        for b in sorted(set(bad))[:20]:
            print('     ', b)
        sys.exit(2)
    print('  [OK] every assets/char|fx path in index.html resolves to a real file.')
    print('  Next: apply the DRAW-CODE EDITS (rerun dry-run to reprint), then node --check the')
    print('  extracted <script> + python dev.py -> confirm player(knight) + every enemy renders.')


if __name__ == '__main__':
    main()
