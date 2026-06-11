#!/usr/bin/env python3
"""fold-assets.py — migrate a flat `assets/<domain>/` dir into family subfolders,
moving the files (`git mv`) AND rewriting the matching `ART_MANIFEST` path strings
in `index.html` as ONE atomic operation.

WHY this is one tool, not two steps
-----------------------------------
`assets/char/` is ~248 flat files referenced as ~200 explicit manifest paths
(`'char.archer.nw':'assets/char/archer-nw.png'`). The file move and the manifest
rewrite are **inseparable** — if the files move before the paths are rewritten,
every character sprite 404s on `main` and silently falls back to the blocky
procedural sprite (which `node --check` will NOT catch). So both halves must land
in a single commit. This tool does that.

OWNERSHIP: the tool is Artist-authored (tooling), but `--apply` edits `index.html`,
so the **engineer** runs `--apply` and commits the result (sole editor of the game
file). The Artist runs the default **dry-run** to verify the plan before handoff.

USAGE
-----
  python tools/fold-assets.py --domain char            # dry-run: print the plan + checks
  python tools/fold-assets.py --domain char --apply    # git mv + rewrite manifest (engineer)

The map below is the single source of truth for which entity goes in which family
folder. Extend FAMILIES to add a domain (e.g. tile) or a new entity/faction.
"""
import argparse, os, subprocess, sys

# domain -> { family_folder: [entity-name prefixes] }.
# A file assets/<domain>/<name>.png routes to the family whose LONGEST matching
# prefix `<name>` starts with. Every file must match exactly one family or we abort.
FAMILIES = {
    'char': {
        'player':  ['player'],                                              # player + all player anim sets
        'goblins': ['goblin', 'archer', 'warrior', 'shaman', 'bomber', 'king'],  # the goblinoid faction
        'wolves':  ['alphawolf', 'direwolf', 'wolfmother'],                 # the beast faction
    },
    # 'tile': { 'floor':['floor'], 'dirt':['dirt'], 'grass':['grass'], 'cobble':['cobble'], 'rock':['rock'], 'spike':['spike'] },
}


def family_for(domain, fname):
    name = fname[:-4] if fname.lower().endswith('.png') else fname
    best = None  # (family, matched-prefix-length)
    for fam, prefixes in FAMILIES[domain].items():
        for p in prefixes:
            if name.startswith(p) and (best is None or len(p) > best[1]):
                best = (fam, len(p))
    return best[0] if best else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--domain', required=True, choices=list(FAMILIES))
    ap.add_argument('--index', default='index.html')
    ap.add_argument('--apply', action='store_true', help='actually git mv + edit index.html (ENGINEER runs this)')
    args = ap.parse_args()

    root = f'assets/{args.domain}'
    if not os.path.isdir(root):
        print(f'no such dir: {root}'); sys.exit(1)
    flat = sorted(f for f in os.listdir(root)
                  if f.lower().endswith('.png') and os.path.isfile(os.path.join(root, f)))
    if not flat:
        print(f'no flat .png in {root}/ — already foldered?'); return

    # 1. route every file; abort if any is unmapped (forces FAMILIES to stay complete)
    moves, unmapped = [], []
    for f in flat:
        fam = family_for(args.domain, f)
        (moves.append((f'{root}/{f}', f'{root}/{fam}/{f}')) if fam else unmapped.append(f))
    if unmapped:
        print('ABORT — these files match no family (extend FAMILIES):')
        for u in unmapped: print('   ', u)
        sys.exit(1)

    # 2. plan manifest rewrites (only files actually referenced get a rewrite)
    idx = open(args.index, encoding='utf-8').read()
    rewrites = [(o, n) for (o, n) in moves if f"'{o}'" in idx]
    no_ref   = [o for (o, _) in moves if f"'{o}'" not in idx]

    fams = sorted({n.split('/')[2] for (_, n) in moves})
    print(f'== fold {root}/  ->  {", ".join(fams)} ==')
    print(f'  files to move:            {len(moves)}')
    print(f'  manifest paths to rewrite:{len(rewrites):>4}')
    print(f'  moved files w/ NO manifest ref (unwired / other loader): {len(no_ref)}')
    for n in no_ref[:10]: print('      -', n)
    if len(no_ref) > 10: print(f'      ... +{len(no_ref)-10} more')

    if not args.apply:
        print('\n  sample moves:')
        for o, n in moves[:5]: print(f'    {o}  ->  {n}')
        print('\n  DRY-RUN — no changes. Engineer: rerun with --apply to git mv + rewrite the manifest in one commit.')
        return

    # 3. APPLY — create folders, git mv, rewrite manifest (quoted exact-string → no partial hits)
    for fam in fams: os.makedirs(f'{root}/{fam}', exist_ok=True)
    for o, n in moves:
        subprocess.run(['git', 'mv', o, n], check=True)
    for o, n in rewrites:
        idx = idx.replace(f"'{o}'", f"'{n}'")
    open(args.index, 'w', encoding='utf-8', newline='').write(idx)

    # 4. self-verify: every assets/<domain>/ path in index.html must resolve; no bare top-level refs
    bad = []
    for line in idx.splitlines():
        i = 0
        while (i := line.find(f'assets/{args.domain}/', i)) != -1:
            j = line.find('.png', i)
            if j != -1:
                p = line[i:j+4]
                if not os.path.isfile(p): bad.append(p)
            i = j + 4 if j != -1 else i + 1
    print(f'\nAPPLIED: moved {len(moves)} files, rewrote {len(rewrites)} manifest paths.')
    if bad:
        print(f'  [WARN] {len(bad)} manifest path(s) DO NOT resolve to a file:')
        for b in sorted(set(bad))[:20]: print('     ', b)
        sys.exit(2)
    print('  [OK] every assets/' + args.domain + '/ path in index.html resolves to a real file.')
    print('  Next: node --check the extracted <script>, then python dev.py → confirm sprites render.')


if __name__ == '__main__':
    main()
