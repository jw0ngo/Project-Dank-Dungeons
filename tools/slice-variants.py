#!/usr/bin/env python3
"""Slice a 3x3 VARIANT sheet (all 9 cells occupied) into tile-variant cutouts.

Sibling to slice-turnaround.py, which expects an 8-cell character turnaround
with an empty centre. A variant sheet instead holds 9 interchangeable variants
of ONE prop/tile — 9 rocks, 9 fence sections — the same shape as the shipped
9-variant grass set. Cells are numbered 0-8 in reading order:

    r0c0=0  r0c1=1  r0c2=2
    r1c0=3  r1c1=4  r1c2=5
    r2c0=6  r2c1=7  r2c2=8

Cutouts land in assets/tile/ as <id>-<n>.png and the snippet emits
'tile.<id>.<n>' keys — the auto-wiring keyspace (gInitArt counts tile.* into
gTileVarCount; gTileArt picks the variant from the gWallVar random table).
For a NEW tile type the engineer adds one TILE_* → '<id>' mapping line in
gTileArt; existing types need only the manifest entries.

Background removal + the bg-leak QA metric are imported from
slice-turnaround.py — that file stays the single source of truth for every
cutout edge case (--global pockets, --erode halos, --sever same-colour detail).

Usage:
  python tools/slice-variants.py "art/tiles/rocks.png" rock --bg white
"""
import os, argparse, tempfile, importlib.util
from PIL import Image, ImageDraw

_spec = importlib.util.spec_from_file_location(
    'slice_turnaround', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'slice-turnaround.py'))
_st = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_st)
cut_cell, bg_leak_px = _st.cut_cell, _st.bg_leak_px

CELLS = [(r, c) for r in range(3) for c in range(3)]   # all 9, reading order


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('sheet')
    ap.add_argument('id', help="tile name -> 'tile.<id>.<n>' keys, <id>-<n>.png files")
    ap.add_argument('--bg', choices=['black', 'white'], default='white')
    ap.add_argument('--thresh', type=int, default=40)
    ap.add_argument('--feather', type=float, default=0.6)
    ap.add_argument('--size', type=int, default=256,
                    help='output square px; 0 = native cell resolution (no resample)')
    ap.add_argument('--frame', choices=['cell', 'square'], default='cell',
                    help="'cell' (default) keeps each variant on its native cell canvas — preserves the "
                         "artist's in-cell placement AND relative scale across all 9 variants (a tile is "
                         "blitted full-cell, so the cell IS the tile frame). 'square' = tight-crop each "
                         "variant and centre it in a shared square sized to the largest.")
    ap.add_argument('--global', dest='glob', action='store_true',
                    help='cut ALL bg-coloured pixels incl. enclosed pockets (gaps between crossed planks)')
    ap.add_argument('--erode', type=int, default=0,
                    help='tighten the alpha mask N px to kill the edge halo')
    ap.add_argument('--sever', type=int, default=0,
                    help='HARD case: variant detail is the same colour as the bg (see slice-turnaround.py)')
    ap.add_argument('--assets-dir', default=os.path.join('assets', 'tile'),
                    help='where the cutout PNGs are written (default assets/tile; git-tracked, '
                         'so a bad slice is recoverable via git checkout)')
    ap.add_argument('--out', default=None,
                    help='QA dir for the contact sheet + manifest snippet (default <tempdir>/slice_<id>)')
    args = ap.parse_args()

    sheet = Image.open(args.sheet).convert('RGB')
    W, H = sheet.size
    cw, ch = W // 3, H // 3
    outdir = args.out or os.path.join(tempfile.gettempdir(), f'slice_{args.id}')
    os.makedirs(outdir, exist_ok=True)

    figs = {}
    worst_leak = 0
    for n, (r, c) in enumerate(CELLS):
        cell = sheet.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
        fig = cut_cell(cell, args.bg, args.thresh, args.feather, args.glob, args.erode, args.sever,
                       crop=(args.frame == 'square'))
        if fig is None:
            print(f"  WARN: variant {n} (r{r}c{c}) produced no figure")
            continue
        figs[n] = fig
        leak = bg_leak_px(fig, args.bg, args.thresh)
        worst_leak = max(worst_leak, leak)
        flag = '' if args.sever else ('  <-- WARN bg leak (try --erode / --global / --thresh / --sever)'
                                      if leak > max(60, fig.width * fig.height * 0.003) else '')
        print(f"  {n}: r{r}c{c} bbox {fig.size}  bg-leak {leak}px{flag}")

    # Frame. 'cell' keeps the native cell canvas (placement + relative scale preserved);
    # 'square' centres tight crops in a shared square sized to the largest variant.
    if args.frame == 'cell':
        side = cw
    else:
        side = int(max(max(f.size) for f in figs.values()) * 1.04)
    S = side if args.size == 0 else args.size
    os.makedirs(args.assets_dir, exist_ok=True)
    rel = args.assets_dir.replace('\\', '/').rstrip('/')   # forward-slash path for the JS manifest
    framed = {}
    paths = {}
    sizes_kb = {}
    for n, fig in figs.items():
        if args.frame == 'cell':
            sq = fig
        else:
            sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
            sq.alpha_composite(fig, ((side - fig.width) // 2, (side - fig.height) // 2))
        if sq.size != (S, S):
            sq = sq.resize((S, S), Image.LANCZOS)
        framed[n] = sq
        png = os.path.join(args.assets_dir, f'{args.id}-{n}.png')   # grass-0.png naming convention
        sq.save(png, optimize=True)
        sizes_kb[n] = os.path.getsize(png) / 1024
        paths[n] = f'{rel}/{args.id}-{n}.png'

    # QA contact sheet over MAGENTA — halos / enclosed bg pockets scream against magenta.
    cs = 220; pad = 22
    nrows = (len(CELLS) + 3) // 4
    contact = Image.new('RGB', (cs * 4, (cs + pad) * nrows), (255, 0, 255))
    dr = ImageDraw.Draw(contact)
    for i in range(len(CELLS)):
        if i not in figs:
            continue
        col, row = i % 4, i // 4
        x, y = col * cs, row * (cs + pad)
        thumb = framed[i].resize((cs, cs))
        contact.paste(thumb, (x, y), thumb)
        dr.text((x + 6, y + cs + 4), str(i), fill=(255, 255, 0))
    contact_path = os.path.join(outdir, 'contact.png')
    contact.save(contact_path)

    # Path-based ART_MANIFEST snippet, ready to paste.
    snippet = os.path.join(outdir, 'manifest_snippet.txt')
    with open(snippet, 'w', encoding='utf-8') as f:
        for n in sorted(paths):
            f.write(f"'tile.{args.id}.{n}':'{paths[n]}',\n")

    total = sum(sizes_kb.values())
    print(f"\nassets:   {os.path.join(args.assets_dir, args.id + '-<n>.png')}  ({len(paths)} files, ~{total:.0f} KB total)")
    print(f"contact:  {contact_path}")
    print(f"snippet:  {snippet}  (path-based ART_MANIFEST entries - paste as-is)")
    if args.sever:
        verdict = 'sever mode - judge by the magenta contact'
    else:
        verdict = 'CLEAN' if worst_leak <= 60 else f'CHECK (worst bg-leak {worst_leak}px - view the magenta contact)'
    print(f"QA: {verdict}")


if __name__ == '__main__':
    main()
