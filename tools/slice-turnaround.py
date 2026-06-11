#!/usr/bin/env python3
"""Slice a 3x3 character turnaround sheet into 8 directional cutouts.

The 3x3 grid is read in reading order, skipping the empty centre cell, and
mapped to the engine's 8-way octant names:

    r0c0=nw  r0c1=n   r0c2=ne
    r1c0=w   (empty)  r1c2=e
    r2c0=sw  r2c1=s   r2c2=se

This is the same mapping the shipped Goblin King slices use (verified by
silhouette IoU against char.king.* in index.html).

Background removal is **edge-seeded flood fill**: only background-coloured
pixels connected to the cell border are cut, so the figure's internal shadows
survive (see SESSION_JOURNAL "Cutting character sprites from a turnaround
sheet"). For a black sheet a pixel is background if max(R,G,B) <= --thresh;
for a white sheet if min(R,G,B) >= 255 - --thresh.

Outputs (post-externalization + per-type-folder pipeline — paths, not base64): 8
PNG cutouts **auto-routed into assets/char/<group>/<type>/** (e.g.
assets/char/goblins/goblin/goblinatk-<dir>.png), plus a magenta QA contact sheet
and a path-based ART_MANIFEST snippet into a QA dir (default: <tempdir>/slice_<id>).
The group/type folder + the player->knight class rename are driven by
reclass-char.py's TYPE_GROUP/TYPE_RENAME (one source of truth), so slicing `player`
emits 'char.knight.<dir>' under player/knight/. An id matching no known type warns
and falls back to flat assets/char/. Pass --assets-dir to override the destination
verbatim (manual mode, no routing/rename). Paste the snippet into ART_MANIFEST as-is.

Usage:
  python tools/slice-turnaround.py "art/enemies/goblin-warrior.png" warrior --bg black
"""
import os, argparse, tempfile, importlib.util
from collections import deque
from PIL import Image, ImageFilter

DIRS = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']
CELLS = [(0, 0), (0, 1), (0, 2), (1, 0), (1, 2), (2, 0), (2, 1), (2, 2)]  # (row,col), centre skipped

# ── Per-type folder routing (single source of truth: reclass-char.py) ────────────────────────
# The char tree is reclassed into assets/char/<group>/<type>/ (e.g. goblins/goblin/, player/knight/);
# the player's VISUAL CLASS is renamed player->knight (path AND manifest key). Rather than duplicate
# the type->folder maps here (which would drift the moment a new enemy is added — the "migrate the
# tool when you migrate the pipeline" tax), import reclass-char.py's classify()/TYPE_GROUP/TYPE_RENAME
# by path (same importlib idiom slice-variants.py uses to load THIS file). Side-effect-free: its
# main() is __main__-guarded. If it ever can't load, _classify stays None and we fall back to flat.
_classify = _TYPE_GROUP = _TYPE_RENAME = None
try:
    _rc_spec = importlib.util.spec_from_file_location(
        'reclass_char', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'reclass-char.py'))
    _rc = importlib.util.module_from_spec(_rc_spec)
    _rc_spec.loader.exec_module(_rc)
    _classify, _TYPE_GROUP, _TYPE_RENAME = _rc.classify, _rc.TYPE_GROUP, _rc.TYPE_RENAME
except Exception as _e:                                  # missing/unloadable -> flat-write fallback
    print(f"  [routing] reclass-char.py not loaded ({_e}); slicing flat to assets/char/")

# already-renamed type values -> group (e.g. {'knight': 'player'}), so an id passed as the post-rename
# class name ('knight'/'knightatk') routes correctly without double-renaming.
_RENAMED = ({v: _TYPE_GROUP[k] for k, v in _TYPE_RENAME.items()} if _TYPE_RENAME and _TYPE_GROUP else {})
_RENAMED_LONGEST = sorted(_RENAMED, key=len, reverse=True)


def route(cid):
    """Map a slice id -> (group, type_dir, out_stem) for assets/char/<group>/<type_dir>/<out_stem>-*.png,
    or None if the id matches no known type. out_stem carries the player->knight rename (and the pose
    suffix); for every enemy out_stem == cid. Driven by reclass-char.py's TYPE_GROUP/TYPE_RENAME."""
    if _classify is not None:
        c = _classify(cid)                              # (group, new_stem, type_dir) or None
        if c:
            group, new_stem, type_dir = c
            return group, type_dir, new_stem
    for t in _RENAMED_LONGEST:                           # id already given as the renamed class name
        if cid == t or cid.startswith(t):
            return _RENAMED[t], t, cid
    return None


def is_bg(px, x, y, bg, thresh):
    r, g, b = px[x, y][:3]
    if bg == 'black':
        return max(r, g, b) <= thresh
    return min(r, g, b) >= 255 - thresh


def _cut_severed(cell, px, w, h, bg, thresh, sever, feather, crop=True):
    """Morphological cut for figures whose detail shares the bg colour (see cut_cell sever>0)."""
    mask = Image.new('L', (w, h), 0); mp = mask.load()
    for y in range(h):
        for x in range(w):
            if is_bg(px, x, y, bg, thresh):
                mp[x, y] = 255
    for _ in range(sever):                       # shrink bg -> sever thin channels into the figure
        mask = mask.filter(ImageFilter.MinFilter(3))
    ep = mask.load()
    reached = bytearray(w * h); dq = deque()
    for x in range(w):
        for yy in (0, h - 1):
            if ep[x, yy] and not reached[yy * w + x]: reached[yy * w + x] = 1; dq.append((x, yy))
    for y in range(h):
        for xx in (0, w - 1):
            if ep[xx, y] and not reached[y * w + xx]: reached[y * w + xx] = 1; dq.append((xx, y))
    while dq:
        x, y = dq.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                i = ny * w + nx
                if ep[nx, ny] and not reached[i]: reached[i] = 1; dq.append((nx, ny))
    alpha = Image.new('L', (w, h), 0); ap = alpha.load()
    for y in range(h):
        for x in range(w):
            if not reached[y * w + x]: ap[x, y] = 255
    for _ in range(sever + 1):                   # undo the bg-erode bulge + 1px halo trim
        alpha = alpha.filter(ImageFilter.MinFilter(3))
    if feather > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(feather))
    out = cell.convert('RGBA'); out.putalpha(alpha)
    bb = alpha.getbbox()
    if not bb: return None
    return out.crop(bb) if crop else out          # crop=False keeps the native cell frame (registration)


def cut_cell(cell, bg, thresh, feather, glob=False, erode=0, sever=0, crop=True):
    """Return RGBA image of the isolated figure, tight-cropped, or None.

    glob=True  -> cut EVERY background-coloured pixel, including enclosed pockets not reachable
                  from the border (the gap inside a drawn bow, between shrine pillars, etc.).
                  Use for shapes that enclose background; unsafe if interior detail shares the
                  bg colour. glob=False keeps the edge-seeded flood fill (interior detail survives).
    erode>0    -> tighten the alpha mask N px to kill the white/dark anti-aliased edge halo.
    sever>0    -> HARD case: the figure's own detail is the SAME colour as the bg (dark steel armour
                  on a near-black sheet), so no brightness/colour key can separate them. Erode the
                  background mask `sever` px to cut the thin channels that connect interior recesses
                  to the exterior, flood from the border through what's left (only the WIDE exterior
                  + wide gaps like between legs survive), and keep everything else as figure. Detail
                  recesses stay filled. Takes precedence over glob/erode.
    """
    cell = cell.convert('RGB')
    w, h = cell.size
    px = cell.load()
    if sever > 0:
        return _cut_severed(cell, px, w, h, bg, thresh, sever, feather, crop)
    isbg = bytearray(w * h)            # 1 = background

    if glob:
        for y in range(h):
            for x in range(w):
                if is_bg(px, x, y, bg, thresh):
                    isbg[y * w + x] = 1
    else:
        # Edge-seeded flood fill: only background connected to the cell border is cut.
        dq = deque()

        def seed(x, y):
            i = y * w + x
            if not isbg[i] and is_bg(px, x, y, bg, thresh):
                isbg[i] = 1
                dq.append((x, y))

        for x in range(w):
            seed(x, 0); seed(x, h - 1)
        for y in range(h):
            seed(0, y); seed(w - 1, y)
        while dq:
            x, y = dq.popleft()
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h:
                    i = ny * w + nx
                    if not isbg[i] and is_bg(px, nx, ny, bg, thresh):
                        isbg[i] = 1
                        dq.append((nx, ny))

    # Foreground = everything not flagged background. Label components, keep the
    # large ones (body + held weapon), drop edge slivers / specks.
    comp = [0] * (w * h)               # 0 = unvisited foreground, else label
    sizes = {0: 0}
    label = 0
    for sy in range(h):
        for sx in range(w):
            i = sy * w + sx
            if isbg[i] or comp[i]:
                continue
            label += 1
            cnt = 0
            st = [(sx, sy)]
            comp[i] = label
            while st:
                x, y = st.pop()
                cnt += 1
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        if not isbg[j] and not comp[j]:
                            comp[j] = label
                            st.append((nx, ny))
            sizes[label] = cnt
    if label == 0:
        return None
    biggest = max(sizes.values())
    keep = {l for l, c in sizes.items() if l and c >= max(800, biggest * 0.05)}

    alpha = Image.new('L', (w, h), 0)
    ap = alpha.load()
    for y in range(h):
        for x in range(w):
            if comp[y * w + x] in keep:
                ap[x, y] = 255
    for _ in range(erode):
        alpha = alpha.filter(ImageFilter.MinFilter(3))   # ~1px/pass tighter -> kills the edge halo
    if feather > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(feather))
    out = cell.convert('RGBA')
    out.putalpha(alpha)
    bb = alpha.getbbox()
    if not bb: return None
    return out.crop(bb) if crop else out          # crop=False keeps the native cell frame (registration)


def keep_owner(rgba, cell_box):
    """For --bleed: the cut ran on a window expanded past the cell, so neighbouring
    figures that overflow INTO this window (or whose own overflow we reached) can be
    present. Keep only the opaque connected component that 'owns' this cell — the one
    with the most pixels inside cell_box=(x0,y0,x1,y1) (the cell's true rect in window
    coords) — and zero the rest. Figures never touch (clean bg gaps between cells), so
    the owner is unambiguous. Returns (tight-cropped RGBA or None, n_components)."""
    w, h = rgba.size
    a = rgba.split()[3].load()
    comp = [0] * (w * h)
    incell = {}
    cx0, cy0, cx1, cy1 = cell_box
    label = 0
    for sy in range(h):
        base = sy * w
        for sx in range(w):
            i = base + sx
            if a[sx, sy] <= 40 or comp[i]:
                continue
            label += 1
            cnt_in = 0
            st = [(sx, sy)]
            comp[i] = label
            while st:
                x, y = st.pop()
                if cx0 <= x < cx1 and cy0 <= y < cy1:
                    cnt_in += 1
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        if a[nx, ny] > 40 and not comp[j]:
                            comp[j] = label
                            st.append((nx, ny))
            incell[label] = cnt_in
    if label == 0:
        return None, 0
    owner = max(incell, key=lambda l: (incell[l], l))
    px = rgba.load()
    for y in range(h):
        base = y * w
        for x in range(w):
            if comp[base + x] != owner:
                r, g, b, _ = px[x, y]
                px[x, y] = (r, g, b, 0)
    bb = rgba.split()[3].getbbox()
    return (rgba.crop(bb) if bb else None), label


def bg_leak_px(fig, bg, thresh):
    """QA metric: count OPAQUE pixels in the cutout whose colour is still background-coloured.
    These are exactly the recurring sprite bugs — an edge halo (bg-blended boundary pixels left
    opaque) or an enclosed bg pocket (closed-shape gap the flood fill couldn't reach). A high
    count means: try --erode (halo) and/or --global (pocket), or adjust --thresh."""
    px = fig.load(); w, h = fig.size; n = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 40 and (max(r, g, b) <= thresh if bg == 'black' else min(r, g, b) >= 255 - thresh):
                n += 1
    return n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('sheet')
    ap.add_argument('id')
    ap.add_argument('--bg', choices=['black', 'white'], default='black')
    ap.add_argument('--thresh', type=int, default=40)
    ap.add_argument('--feather', type=float, default=0.6)
    ap.add_argument('--size', type=int, default=256,
                    help='output square px; 0 = native resolution (no resample) for animation source')
    ap.add_argument('--frame', choices=['square', 'cell'], default='square',
                    help="'square' = uniform bbox-centered square (game sprites). "
                         "'cell' = keep each pose on its native cell canvas -> exact in-sheet "
                         "registration, one shared canvas across sheets (best for animation).")
    ap.add_argument('--global', dest='glob', action='store_true',
                    help='cut ALL bg-coloured pixels incl. enclosed pockets (closed shapes: bows, pillars)')
    ap.add_argument('--erode', type=int, default=0,
                    help='tighten the alpha mask N px to kill the edge halo')
    ap.add_argument('--sever', type=int, default=0,
                    help='HARD case (figure detail same colour as bg, e.g. dark armour on a black '
                         'sheet): erode the bg mask N px to sever channels so detail recesses stay filled')
    ap.add_argument('--bleed', type=int, default=0,
                    help='figures drawn LARGER than their 3x3 cell (wide lunge/attack poses) overflow '
                         'into the empty centre and get sliced flat at the cell border. Cut on a window '
                         'expanded N px past each cell, then keep only the component that owns the cell '
                         '(neighbours pulled in are discarded). Set N a bit above the worst overflow.')
    ap.add_argument('--assets-dir', default=None,
                    help='override the cutout destination VERBATIM (manual mode: no per-type routing, '
                         'no player->knight rename — id is used as-is). Default = auto-route into '
                         'assets/char/<group>/<type>/ via reclass-char.py. The dir is git-tracked, so '
                         'a bad slice is recoverable via git checkout.')
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
    for d, (r, c) in zip(DIRS, CELLS):
        if args.bleed > 0:
            # Cut on a window expanded past the cell so an overflowing figure stays whole,
            # then keep only the component owning this cell (drops neighbours pulled in).
            x0, y0 = max(0, c * cw - args.bleed), max(0, r * ch - args.bleed)
            x1, y1 = min(W, (c + 1) * cw + args.bleed), min(H, (r + 1) * ch + args.bleed)
            cell = sheet.crop((x0, y0, x1, y1))
            win = cut_cell(cell, args.bg, args.thresh, args.feather, args.glob, args.erode, args.sever,
                           crop=False)
            fig, ncomp = (None, 0) if win is None else keep_owner(
                win, (c * cw - x0, r * ch - y0, (c + 1) * cw - x0, (r + 1) * ch - y0))
        else:
            cell = sheet.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
            fig = cut_cell(cell, args.bg, args.thresh, args.feather, args.glob, args.erode, args.sever,
                           crop=(args.frame == 'square'))
            ncomp = 1
        if fig is None:
            print(f"  WARN: {d} (r{r}c{c}) produced no figure")
            continue
        figs[d] = fig
        # QA: flag bg-coloured opaque pixels (edge halo / enclosed pocket leak). In --sever mode the
        # figure's detail IS bg-coloured on purpose, so the metric over-reports — trust the contact.
        leak = bg_leak_px(fig, args.bg, args.thresh)
        worst_leak = max(worst_leak, leak)
        flag = '' if args.sever else ('  <-- WARN bg leak (try --erode / --global / --thresh / --sever)' if leak > max(60, fig.width * fig.height * 0.003) else '')
        comp_note = f'  comps={ncomp}' if args.bleed > 0 else ''
        print(f"  {d}: r{r}c{c} bbox {fig.size}  bg-leak {leak}px{comp_note}{flag}")

    # Frame each figure. 'cell' keeps the native cell canvas (figs are already cw x ch, registered);
    # 'square' centers each tight-cropped figure in a uniform square. --size 0 => native res (no resample).
    if args.frame == 'cell':
        side = cw
    else:
        side = int(max(max(f.size) for f in figs.values()) * 1.04)
    S = side if args.size == 0 else args.size
    # Resolve destination + output stem. --assets-dir = manual override (verbatim path, id as-is).
    # Otherwise auto-route into assets/char/<group>/<type>/ and apply the player->knight rename;
    # an unknown id warns and falls back to flat assets/char/.
    if args.assets_dir is not None:
        assets_dir, out_stem = args.assets_dir, args.id
    else:
        r = route(args.id)
        if r:
            group, type_dir, out_stem = r
            assets_dir = os.path.join('assets', 'char', group, type_dir)
            if out_stem != args.id:
                print(f"  [routing] id '{args.id}' -> class '{out_stem}' (renamed); keys become char.{out_stem}.*")
        else:
            assets_dir, out_stem = os.path.join('assets', 'char'), args.id
            print(f"  WARN: id '{args.id}' matches no type in reclass-char.py TYPE_GROUP — writing FLAT to "
                  f"assets/char/. Add it to TYPE_GROUP to route it, or pass --assets-dir to place it.")
    os.makedirs(assets_dir, exist_ok=True)
    rel = assets_dir.replace('\\', '/').rstrip('/')    # forward-slash path for the JS manifest (web/relative)
    framed = {}                                        # in-memory cutouts -> contact sheet (no re-open)
    paths = {}                                         # manifest value per direction
    sizes_kb = {}
    for d, fig in figs.items():
        if args.frame == 'cell':
            sq = fig                                   # already cell-sized + registered
        else:
            sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
            sq.alpha_composite(fig, ((side - fig.width) // 2, (side - fig.height) // 2))
        if sq.size != (S, S):
            sq = sq.resize((S, S), Image.LANCZOS)
        framed[d] = sq
        png = os.path.join(assets_dir, f'{out_stem}-{d}.png')   # hyphen name = ART_MANIFEST convention (goblin-n.png)
        sq.save(png, optimize=True)
        sizes_kb[d] = os.path.getsize(png) / 1024
        paths[d] = f'{rel}/{out_stem}-{d}.png'

    # QA contact sheet over MAGENTA — any leftover white/dark halo or enclosed bg pocket shows
    # up instantly against magenta. Eyeball this every time a new sprite is added.
    cs = 220; pad = 22
    contact = Image.new('RGB', (cs * 4, (cs + pad) * 2), (255, 0, 255))
    from PIL import ImageDraw
    dr = ImageDraw.Draw(contact)
    for i, d in enumerate(DIRS):
        if d not in figs:
            continue
        col, row = i % 4, i // 4
        x, y = col * cs, row * (cs + pad)
        thumb = framed[d].resize((cs, cs))
        contact.paste(thumb, (x, y), thumb)
        dr.text((x + 6, y + cs + 4), d, fill=(255, 255, 0))
    contact_path = os.path.join(outdir, 'contact.png')
    contact.save(contact_path)

    # Path-based ART_MANIFEST snippet, ready to paste (values point at the assets/char files above).
    snippet = os.path.join(outdir, 'manifest_snippet.txt')
    with open(snippet, 'w', encoding='utf-8') as f:
        for d in DIRS:
            if d in paths:
                f.write(f"'char.{out_stem}.{d}':'{paths[d]}',\n")

    total = sum(sizes_kb.values())
    print(f"\nassets:   {os.path.join(assets_dir, out_stem + '-<dir>.png')}  ({len(paths)} files, ~{total:.0f} KB total)")
    print(f"contact:  {contact_path}")
    print(f"snippet:  {snippet}  (path-based ART_MANIFEST entries - paste as-is)")
    if args.sever:
        verdict = 'sever mode - the bg-leak metric does not apply (detail is bg-coloured); judge by the magenta contact'
    else:
        verdict = 'CLEAN' if worst_leak <= 60 else f'CHECK (worst bg-leak {worst_leak}px - view the magenta contact)'
    print(f"QA: {verdict}")


if __name__ == '__main__':
    main()
