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

Outputs: 8 PNG cutouts + a QA contact sheet + a data-URL text file, all into
an output dir (default: <tempdir>/slice_<id>).

Usage:
  python tools/slice-turnaround.py "art/enemies/goblin-warrior.png" warrior --bg black
"""
import sys, os, io, base64, argparse, tempfile
from collections import deque
from PIL import Image, ImageFilter

DIRS = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']
CELLS = [(0, 0), (0, 1), (0, 2), (1, 0), (1, 2), (2, 0), (2, 1), (2, 2)]  # (row,col), centre skipped


def is_bg(px, x, y, bg, thresh):
    r, g, b = px[x, y][:3]
    if bg == 'black':
        return max(r, g, b) <= thresh
    return min(r, g, b) >= 255 - thresh


def _cut_severed(cell, px, w, h, bg, thresh, sever, feather):
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
    return out.crop(bb) if bb else None


def cut_cell(cell, bg, thresh, feather, glob=False, erode=0, sever=0):
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
        return _cut_severed(cell, px, w, h, bg, thresh, sever, feather)
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
    return out.crop(bb) if bb else None


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
    ap.add_argument('--size', type=int, default=256)
    ap.add_argument('--global', dest='glob', action='store_true',
                    help='cut ALL bg-coloured pixels incl. enclosed pockets (closed shapes: bows, pillars)')
    ap.add_argument('--erode', type=int, default=0,
                    help='tighten the alpha mask N px to kill the edge halo')
    ap.add_argument('--sever', type=int, default=0,
                    help='HARD case (figure detail same colour as bg, e.g. dark armour on a black '
                         'sheet): erode the bg mask N px to sever channels so detail recesses stay filled')
    ap.add_argument('--out', default=None)
    args = ap.parse_args()

    sheet = Image.open(args.sheet).convert('RGB')
    W, H = sheet.size
    cw, ch = W // 3, H // 3
    outdir = args.out or os.path.join(tempfile.gettempdir(), f'slice_{args.id}')
    os.makedirs(outdir, exist_ok=True)

    figs = {}
    worst_leak = 0
    for d, (r, c) in zip(DIRS, CELLS):
        cell = sheet.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
        fig = cut_cell(cell, args.bg, args.thresh, args.feather, args.glob, args.erode, args.sever)
        if fig is None:
            print(f"  WARN: {d} (r{r}c{c}) produced no figure")
            continue
        figs[d] = fig
        # QA: flag bg-coloured opaque pixels (edge halo / enclosed pocket leak). In --sever mode the
        # figure's detail IS bg-coloured on purpose, so the metric over-reports — trust the contact.
        leak = bg_leak_px(fig, args.bg, args.thresh)
        worst_leak = max(worst_leak, leak)
        flag = '' if args.sever else ('  <-- WARN bg leak (try --erode / --global / --thresh / --sever)' if leak > max(60, fig.width * fig.height * 0.003) else '')
        print(f"  {d}: r{r}c{c} bbox {fig.size}  bg-leak {leak}px{flag}")

    # Uniform square so every direction renders at the same on-screen scale.
    side = int(max(max(f.size) for f in figs.values()) * 1.04)
    S = args.size
    urls = {}
    for d, fig in figs.items():
        sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
        sq.alpha_composite(fig, ((side - fig.width) // 2, (side - fig.height) // 2))
        sq = sq.resize((S, S), Image.LANCZOS)
        png = os.path.join(outdir, f'{args.id}_{d}.png')
        sq.save(png)
        buf = io.BytesIO(); sq.save(buf, 'PNG', optimize=True)
        urls[d] = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

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
        thumb = Image.open(os.path.join(outdir, f'{args.id}_{d}.png')).resize((cs, cs))
        contact.paste(thumb, (x, y), thumb)
        dr.text((x + 6, y + cs + 4), d, fill=(255, 255, 0))
    contact_path = os.path.join(outdir, 'contact.png')
    contact.save(contact_path)

    # Data URLs as a JS-manifest snippet, ready to paste.
    snippet = os.path.join(outdir, 'manifest_snippet.txt')
    with open(snippet, 'w', encoding='utf-8') as f:
        for d in DIRS:
            if d in urls:
                f.write(f"'char.{args.id}.{d}':'{urls[d]}',\n")

    total = sum(len(u) for u in urls.values())
    print(f"\ncontact:  {contact_path}")
    print(f"snippet:  {snippet}")
    print(f"base64 total ~{total/1024:.0f} KB across {len(urls)} dirs")
    if args.sever:
        verdict = 'sever mode - the bg-leak metric does not apply (detail is bg-coloured); judge by the magenta contact'
    else:
        verdict = 'CLEAN' if worst_leak <= 60 else f'CHECK (worst bg-leak {worst_leak}px - view the magenta contact)'
    print(f"QA: {verdict}")


if __name__ == '__main__':
    main()
