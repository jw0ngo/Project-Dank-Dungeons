#!/usr/bin/env python3
"""Slice a 3x3 VARIANT sheet (all 9 cells occupied) into tile-variant cutouts.

Sibling to slice-turnaround.py, which expects an 8-cell character turnaround
with an empty centre. A variant sheet instead holds 9 interchangeable variants
of ONE prop/tile — 9 rocks, 9 fence sections — the same shape as the shipped
9-variant grass set. Cells are numbered 0-8 in reading order:

    r0c0=0  r0c1=1  r0c2=2
    r1c0=3  r1c1=4  r1c2=5
    r2c0=6  r2c1=7  r2c2=8

Cutouts land in assets/<keyspace>/ as <id>-<n>.png and the snippet emits
'<keyspace>.<id>.<n>' keys. --keyspace tile (default) is the auto-wiring
keyspace (gInitArt counts tile.* into gTileVarCount; gTileArt picks the
variant from the gWallVar random table) — for a NEW tile type the engineer
adds one TILE_* -> '<id>' mapping line in gTileArt. --keyspace fx is for
effect-sprite variant sets (explosions etc.); the engineer adds the draw
hook. FX sheets usually also want --keep-specks (detached embers/debris are
art, not noise) and --frame square (FX draw centred at a point, not as a
tile cell). --keyspace world is for a world-prop variant set (trees, bushes)
— a tall transparent cutout placed/scattered & feet-anchored OVER ground (not
a ground tile); files land in assets/world, keys 'world.<id>.<n>', and the
engineer draws it via the world-prop/overlay path, not gTileArt.

Background removal + the bg-leak QA metric are imported from
slice-turnaround.py — that file stays the single source of truth for every
cutout edge case (--global pockets, --erode halos, --sever same-colour detail).

--bleed N handles a variant drawn LARGER than its cell (a tall tree canopy
overflowing UP into the cell above), which the rigid per-cell crop otherwise
slices flat at the border: it cuts on a window expanded N px past each cell and
keeps only the component owning the cell (keep_owner, also imported), dropping
the neighbour pulled into the window. It implies a bottom-anchored square frame
(--anchor bottom) so every recovered variant shares one foot baseline at
fraction (1 - --foot-pad) — required for a feet-anchored world prop (tree/bush)
whose engine draw uses a single foot fraction across all variants.

Usage:
  python tools/slice-variants.py "art/tiles/rocks.png" rock --bg white
"""
import os, argparse, tempfile, importlib.util
from PIL import Image, ImageDraw, ImageFilter

_spec = importlib.util.spec_from_file_location(
    'slice_turnaround', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'slice-turnaround.py'))
_st = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_st)
cut_cell, bg_leak_px, is_bg, keep_owner = _st.cut_cell, _st.bg_leak_px, _st.is_bg, _st.keep_owner

# Import the asset-fold routing so new slices land in (and emit) the FOLDERED path for an
# already-foldered keyspace — otherwise every new slice silently re-introduces a flat file
# under assets/<keyspace>/ that the next fold has to sweep up again ("migrate the tool with
# the pipeline"). family_for(domain, id) -> family subfolder, or None if the keyspace isn't
# foldered / the id is unmapped.
_fspec = importlib.util.spec_from_file_location(
    'fold_assets', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fold-assets.py'))
_fa = importlib.util.module_from_spec(_fspec)
_fspec.loader.exec_module(_fa)


def route_family(keyspace, ident):
    """Family subfolder for this id under assets/<keyspace>/, or None (flat)."""
    if keyspace not in _fa.FAMILIES:
        return None
    return _fa.family_for(keyspace, ident)

CELLS = [(r, c) for r in range(3) for c in range(3)]   # all 9, reading order


def recover_specks(cell, fig, bg, thresh, feather, min_core=40):
    """Re-add small detached components that cut_cell's speck filter dropped.

    cut_cell keeps only components >= max(800, biggest*5%) px — right for character
    sheets (drops sheet noise), wrong for FX sheets where detached flying embers /
    debris flecks ARE the art. This pass finds non-bg pixels the cut left transparent,
    labels them into components, and re-adds every component with at least `min_core`
    pixels of *clearly* non-bg colour (2x the bg threshold) — so real embers come back
    while bg-blended fringe slivers stay dropped. `fig` must be cell-framed (crop=False).
    Returns (merged RGBA, number of components recovered)."""
    from PIL import ImageChops
    w, h = cell.size
    px = cell.load()
    alpha = fig.split()[3]
    a = alpha.load()
    drop = bytearray(w * h)              # 1 = non-bg pixel the cut left transparent
    for y in range(h):
        for x in range(w):
            if a[x, y] <= 10 and not is_bg(px, x, y, bg, thresh):
                drop[y * w + x] = 1

    def is_core(x, y):
        r, g, b = px[x, y][:3]
        lim = 2 * thresh
        return (r + g + b) / 3 >= lim if bg == 'black' else min(r, g, b) <= 255 - lim

    speck = Image.new('L', (w, h), 0)
    sp = speck.load()
    seen = bytearray(w * h)
    kept = 0
    for sy in range(h):
        for sx in range(w):
            i = sy * w + sx
            if not drop[i] or seen[i]:
                continue
            comp, core = [], 0
            st = [(sx, sy)]
            seen[i] = 1
            while st:
                x, y = st.pop()
                comp.append((x, y))
                if is_core(x, y):
                    core += 1
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        if drop[j] and not seen[j]:
                            seen[j] = 1
                            st.append((nx, ny))
            if core >= min_core:
                kept += 1
                for x, y in comp:
                    sp[x, y] = 255
    if kept:
        if feather > 0:
            speck = speck.filter(ImageFilter.GaussianBlur(feather))
        merged = ImageChops.lighter(alpha, speck)
        out = cell.convert('RGBA')
        out.putalpha(merged)
        return out, kept
    return fig, 0


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
    ap.add_argument('--keyspace', choices=['tile', 'fx', 'world'], default='tile',
                    help="manifest keyspace + default assets dir: 'tile' -> 'tile.<id>.<n>' in "
                         "assets/tile (auto-wired via gTileArt); 'fx' -> 'fx.<id>.<n>' in assets/fx "
                         "(effect sprites — the engineer adds the draw hook); 'world' -> "
                         "'world.<id>.<n>' in assets/world (a world-prop VARIANT set — trees, bushes; "
                         'a tall transparent cutout placed/scattered & feet-anchored over ground, NOT a '
                         'ground tile, so the engineer draws it via the world-prop/overlay path, not gTileArt)')
    ap.add_argument('--keep-specks', action='store_true',
                    help="re-add small detached components cut_cell's speck filter dropped (>=40 px of "
                         'clearly non-bg core). FX sheets need this: detached flying embers/debris ARE '
                         'the art, not sheet noise.')
    ap.add_argument('--bleed', type=int, default=0,
                    help='variant drawn LARGER than its cell (a tall tree canopy overflowing UP into '
                         'the cell above) gets sliced flat at the cell border. Cut on a window expanded '
                         'N px past each cell, then keep only the component that owns the cell (neighbours '
                         'pulled in are discarded). Set N a bit above the worst overflow. Forces a '
                         'bottom-anchored square frame (see --anchor) so every recovered variant shares '
                         'one foot baseline. Figures must not touch (clean bg gap) for owner-selection.')
    ap.add_argument('--anchor', choices=['center', 'bottom'], default='center',
                    help="how 'square'/bleed framing places each variant in the shared canvas: 'center' "
                         '(default) for free-floating props; "bottom" puts every variant on a common foot '
                         'baseline a fixed pad above the canvas bottom — required for a feet-anchored world '
                         'prop (tree/bush) so the engine\'s foot fraction is identical across all variants. '
                         '--bleed implies bottom.')
    ap.add_argument('--foot-pad', type=float, default=0.07,
                    help='for bottom-anchored framing: transparent margin below the feet as a fraction of '
                         'the canvas side. The foot then sits at fraction (1 - foot_pad) of the canvas '
                         '(0.07 -> 0.93, matching the trees\' TREE_FOOT). Report this to the engineer.')
    ap.add_argument('--assets-dir', default=None,
                    help='where the cutout PNGs are written (default assets/<keyspace>; git-tracked, '
                         'so a bad slice is recoverable via git checkout)')
    ap.add_argument('--out', default=None,
                    help='QA dir for the contact sheet + manifest snippet (default <tempdir>/slice_<id>)')
    args = ap.parse_args()
    if args.assets_dir is None:
        fam = route_family(args.keyspace, args.id)
        if fam:
            args.assets_dir = os.path.join('assets', args.keyspace, fam)
            print(f"[fold] {args.keyspace}.{args.id} -> assets/{args.keyspace}/{fam}/  (foldered keyspace)")
        else:
            args.assets_dir = os.path.join('assets', args.keyspace)
            if args.keyspace in _fa.FAMILIES:
                print(f"[fold] WARN: id '{args.id}' matches no family in assets/{args.keyspace}/ — "
                      f"writing FLAT. Add it to fold-assets.py FAMILIES['{args.keyspace}'] so it folds.")

    sheet = Image.open(args.sheet).convert('RGB')
    W, H = sheet.size
    cw, ch = W // 3, H // 3
    outdir = args.out or os.path.join(tempfile.gettempdir(), f'slice_{args.id}')
    os.makedirs(outdir, exist_ok=True)

    figs = {}
    worst_leak = 0
    for n, (r, c) in enumerate(CELLS):
        if args.bleed > 0:
            # Variant overflows its cell (tall tree canopy reaching up into the cell above): cut on a
            # window expanded past the cell so the figure stays whole, then keep only the component that
            # owns this cell — the upper tree's base pulled into the window is discarded by keep_owner.
            x0, y0 = max(0, c * cw - args.bleed), max(0, r * ch - args.bleed)
            x1, y1 = min(W, (c + 1) * cw + args.bleed), min(H, (r + 1) * ch + args.bleed)
            cell = sheet.crop((x0, y0, x1, y1))
            win = cut_cell(cell, args.bg, args.thresh, args.feather, args.glob, args.erode, args.sever,
                           crop=False)
            fig, ncomp = (None, 0) if win is None else keep_owner(
                win, (c * cw - x0, r * ch - y0, (c + 1) * cw - x0, (r + 1) * ch - y0))
        else:
            cell = sheet.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
            # --keep-specks needs cell-aligned coordinates, so cut uncropped and tight-crop after.
            fig = cut_cell(cell, args.bg, args.thresh, args.feather, args.glob, args.erode, args.sever,
                           crop=(args.frame == 'square' and not args.keep_specks))
            ncomp = 1
        if fig is None:
            print(f"  WARN: variant {n} (r{r}c{c}) produced no figure")
            continue
        specks = 0
        if args.keep_specks and args.bleed == 0:
            fig, specks = recover_specks(cell.convert('RGB'), fig, args.bg, args.thresh, args.feather)
            if args.frame == 'square':
                bb = fig.split()[3].getbbox()
                if bb: fig = fig.crop(bb)
        figs[n] = fig
        leak = bg_leak_px(fig, args.bg, args.thresh)
        worst_leak = max(worst_leak, leak)
        flag = '' if args.sever else ('  <-- WARN bg leak (try --erode / --global / --thresh / --sever)'
                                      if leak > max(60, fig.width * fig.height * 0.003) else '')
        speck_note = f'  specks+{specks}' if (args.keep_specks and args.bleed == 0) else ''
        comp_note = f'  comps={ncomp}' if args.bleed > 0 else ''
        print(f"  {n}: r{r}c{c} bbox {fig.size}  bg-leak {leak}px{speck_note}{comp_note}{flag}")

    # Frame. 'cell' keeps the native cell canvas (placement + relative scale preserved);
    # 'square'/bleed centres (or bottom-anchors) tight crops in a shared square sized to the largest
    # variant. --bleed returns tight-cropped owner components of varying size, so it always frames like
    # 'square'; --anchor bottom (implied by --bleed) puts every variant's feet on one baseline a fixed
    # pad above the canvas bottom, so a feet-anchored world prop shares one foot fraction (1 - foot_pad).
    bottom = args.bleed > 0 or args.anchor == 'bottom'
    square_frame = args.frame == 'square' or args.bleed > 0
    if not square_frame and not bottom:
        side = cw
    else:
        side = int(max(max(f.size) for f in figs.values()) * 1.06)
    pad = int(round(side * args.foot_pad)) if bottom else 0
    S = side if args.size == 0 else args.size
    os.makedirs(args.assets_dir, exist_ok=True)
    rel = args.assets_dir.replace('\\', '/').rstrip('/')   # forward-slash path for the JS manifest
    framed = {}
    paths = {}
    sizes_kb = {}
    for n, fig in figs.items():
        if not square_frame and not bottom:
            sq = fig
        else:
            sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
            ox = (side - fig.width) // 2
            oy = max(0, side - fig.height - pad) if bottom else (side - fig.height) // 2
            sq.alpha_composite(fig, (ox, oy))
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
            f.write(f"'{args.keyspace}.{args.id}.{n}':'{paths[n]}',\n")

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
