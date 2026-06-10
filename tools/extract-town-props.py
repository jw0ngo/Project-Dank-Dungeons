#!/usr/bin/env python3
"""Extract the Sanctum/town set-piece props from the Todust starting-town reference.

The reference (art/reference images/Todust starting town.png) is a COMPOSED SCENE,
not an asset sheet: props sit on busy cobblestone with no flat background, and the
props' dark stone/wood often shares the ground's colours. So the separator is
hand-seeded GrabCut (colour models + spatial coherence — the slice-walk-video.py
lesson), not the flood-fill slicers: each prop carries a declarative seed spec
(crop box + definite-fg seed shapes + a probable-fg envelope) below, which makes
every cut reproducible and tweakable.

Cutouts land in assets/world/<name>.png (RGBA, native res, tight-cropped) with a
magenta QA contact sheet + a 'world.<name>' ART_MANIFEST snippet in the QA dir.
Run with no args to extract everything; pass prop names to re-cut just those.

  python tools/extract-town-props.py            # all props
  python tools/extract-town-props.py well torch-post

Cobble ground tiles are sampled separately by --tiles (plain RGB squares from
evenly-lit plaza patches -> assets/tile/cobble-<n>.png, tile.cobble.N keyspace).
"""
import os, sys, argparse, tempfile
import numpy as np
import cv2
from PIL import Image, ImageDraw

REF = os.path.join('art', 'reference images', 'Todust starting town.png')

# Per-prop spec, coords in NATIVE reference pixels.
#   box:    crop region (x0,y0,x1,y1)
#   env:    figure envelope, crop-relative. Outside = definite bg. The envelope's outer
#           `inset` px (default 8) stay PROBABLE-bg and only the inner core is probable-fg —
#           that PR_BGD margin ring is what lets GrabCut's colour model reclaim the ground
#           apron around a prop; without it, spatial smoothness glues the apron to the figure.
#   inset:  width of that probable-bg margin ring (default 8)
#   fg:     definite-figure seeds, crop-relative: ('rect',x0,y0,x1,y1) | ('ellipse',cx,cy,a,b)
#   bg:     optional definite-BACKGROUND seeds (same shapes) for stubborn ground/neighbours
#   bright: optional ('rect+lum', x0,y0,x1,y1, lum) — pixels in rect with mean
#           luminance > lum become probable-fg (lit statue / flame over dark ground)
PROPS = {
    'fountain': dict(
        box=(530, 310, 955, 675),                # 10px wider than the plaza so a definite-bg ring survives
        env=(10, 10, 415, 355),
        fg=[('ellipse', 213, 202, 190, 126)],
        bright=('rect+lum', 130, 10, 310, 140, 60),
    ),
    'dungeon-gate': dict(
        box=(713, 60, 972, 278),
        env=(4, 4, 255, 214),
        fg=[('rect', 30, 30, 230, 170),          # wall body + arch
            ('rect', 12, 55, 35, 150),           # left tower edge
            ('rect', 225, 55, 252, 150)],        # right tower edge
    ),
    'well': dict(
        box=(1030, 695, 1225, 885),
        env=(25, 5, 175, 185),
        fg=[('rect', 45, 15, 155, 70),           # roof
            ('rect', 52, 70, 68, 125),           # left post
            ('rect', 138, 70, 152, 125),         # right post
            ('ellipse', 100, 138, 52, 30)],      # stone ring
        bg=[('rect', 25, 5, 42, 60),             # cobble corners the apron clings to
            ('rect', 158, 5, 175, 60),
            ('rect', 25, 130, 46, 185),
            ('rect', 154, 130, 175, 185)],
    ),
    'todust-sign': dict(
        box=(885, 790, 1140, 990),
        env=(10, 10, 245, 190),
        fg=[('rect', 40, 45, 215, 150)],         # board face
    ),
    'training-dummy': dict(
        box=(438, 605, 500, 716),                # cut ABOVE the baked ground label text
        env=(8, 4, 54, 106),
        inset=6,
        fg=[('rect', 20, 10, 42, 30),            # skull head
            ('rect', 26, 32, 38, 100),           # post
            ('rect', 10, 38, 54, 50)],           # crossarm
        bg=[('rect', 2, 0, 19, 42),              # fountain-plaza ring stones behind the skull
            ('rect', 2, 0, 52, 9),
            ('rect', 44, 0, 52, 16)],
    ),
    'weapon-rack': dict(
        box=(440, 758, 535, 850),                # box reaches above the spear tips
        env=(3, 6, 92, 89),
        fg=[('rect', 12, 52, 85, 77)],           # rack frame
        bright=('rect+lum', 5, 8, 90, 55, 55),   # pale metal spearheads/shafts
    ),
    'target-stand': dict(
        box=(560, 762, 655, 845),
        env=(4, 3, 92, 80),
        fg=[('rect', 22, 12, 75, 60)],           # angled target face
    ),
    'banner-large': dict(
        box=(615, 818, 700, 952),
        env=(4, 4, 82, 131),
        fg=[('rect', 17, 37, 72, 122),           # cloth
            ('rect', 40, 9, 55, 24),             # pole knob
            ('rect', 7, 27, 80, 34)],            # crossbar
        bg=[('rect', 4, 4, 37, 26),              # training-fence junk behind the crossbar
            ('rect', 58, 4, 80, 24),
            ('rect', 4, 40, 13, 127),
            ('rect', 77, 40, 81, 127)],
    ),
    'banner-small': dict(
        box=(860, 728, 945, 880),
        env=(4, 4, 82, 148),
        fg=[('rect', 20, 42, 70, 122),           # cloth
            ('rect', 35, 5, 52, 27),             # pole knob
            ('rect', 7, 27, 82, 37)],            # crossbar
        bg=[('rect', 4, 4, 24, 22),
            ('rect', 64, 4, 81, 20)],
    ),
    'torch-post': dict(
        box=(1078, 545, 1138, 680),
        env=(3, 3, 57, 132),
        fg=[('rect', 22, 55, 36, 128),           # pole
            ('rect', 12, 18, 46, 55)],           # flame bowl
        bright=('rect+lum', 5, 0, 55, 60, 70),   # flame + glow core
    ),
    'barrel': dict(
        box=(352, 805, 403, 858),                # freestanding training-camp barrel
        env=(3, 3, 48, 50),
        inset=5,
        fg=[('rect', 12, 12, 42, 44)],
    ),
    'market-stall': dict(
        box=(108, 305, 295, 435),
        env=(4, 4, 170, 126),
        fg=[('rect', 25, 15, 160, 60),           # awning
            ('rect', 30, 60, 45, 115),           # left post
            ('rect', 140, 60, 155, 115)],        # right post
        bg=[('rect', 168, 8, 186, 45),           # orange basket by the neighbouring building
            ('rect', 4, 4, 24, 32)],             # neighbouring rooftop corner
    ),
}
# Dropped from extraction (dark wood on dark ground at ~40px — too blended to cut clean;
# they go on the regeneration list instead): crate, fence-rail, inn-side barrel stack.

# Evenly-lit open cobble patches (avoid glow pools, baked text, props). 128px native.
# Patches are brightness-normalized to the group mean per channel — the scene's baked
# lighting (torch pools / vignette) otherwise makes the variants blotch when tiled.
COBBLE_PATCHES = [
    (430, 430, 558, 558),    # west of fountain
    (350, 360, 478, 488),    # north-west, between market stall and plaza
    (700, 690, 828, 818),    # south of plaza
    (900, 620, 1028, 748),   # south-east, clear of torch glow / well / plaza ring
]


def shapes_to_mask(shape_list, w, h):
    m = np.zeros((h, w), bool)
    yy, xx = np.mgrid[0:h, 0:w]
    for s in shape_list:
        if s[0] == 'rect':
            _, x0, y0, x1, y1 = s
            m[max(0, y0):min(h, y1), max(0, x0):min(w, x1)] = True
        elif s[0] == 'ellipse':
            _, cx, cy, a, b = s
            m |= ((xx - cx) / float(a)) ** 2 + ((yy - cy) / float(b)) ** 2 <= 1.0
    return m


def extract(a, name, spec, outdir, assets_dir):
    x0, y0, x1, y1 = spec['box']
    crop = a[y0:y1, x0:x1].copy()
    h, w = crop.shape[:2]
    gmask = np.full((h, w), cv2.GC_BGD, np.uint8)
    ex0, ey0, ex1, ey1 = spec['env']
    ins = spec.get('inset', 8)
    env = np.zeros((h, w), bool)
    env[ey0:ey1, ex0:ex1] = True
    gmask[env] = cv2.GC_PR_BGD                  # envelope margin: probably background...
    core = np.zeros((h, w), bool)
    core[ey0 + ins:ey1 - ins, ex0 + ins:ex1 - ins] = True
    gmask[core] = cv2.GC_PR_FGD                 # ...inner core: probably figure
    fg = shapes_to_mask(spec['fg'], w, h)
    gmask[fg] = cv2.GC_FGD                      # seeds: definitely figure
    if 'bg' in spec:
        gmask[shapes_to_mask(spec['bg'], w, h)] = cv2.GC_BGD
    if 'bright' in spec:
        _, bx0, by0, bx1, by1, lum = spec['bright']
        lumm = crop.mean(axis=2)
        br = np.zeros((h, w), bool)
        br[by0:by1, bx0:bx1] = True
        gmask[br & (lumm > lum)] = cv2.GC_PR_FGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(crop, cv2.COLOR_RGB2BGR), gmask, None, bgd, fgd, 8,
                cv2.GC_INIT_WITH_MASK)
    alpha = np.where((gmask == cv2.GC_FGD) | (gmask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    # keep the biggest component + any component touching a definite-fg seed
    nlab, lab = cv2.connectedComponents((alpha > 0).astype(np.uint8), 8)
    if nlab > 2:
        keep = set(np.unique(lab[fg & (alpha > 0)])) - {0}
        sizes = [(lab == l).sum() for l in range(1, nlab)]
        if sizes:
            keep.add(1 + int(np.argmax(sizes)))
        alpha[~np.isin(lab, list(keep))] = 0
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0.6)
    ys, xs = np.where(alpha > 8)
    if len(xs) == 0:
        print(f'  WARN: {name} produced no figure')
        return None
    bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    out = np.dstack([crop, alpha])[by0:by1, bx0:bx1]
    img = Image.fromarray(out)
    png = os.path.join(assets_dir, f'{name}.png')
    img.save(png, optimize=True)
    kb = os.path.getsize(png) / 1024
    print(f'  {name}: {img.size[0]}x{img.size[1]}  {kb:.0f} KB')
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('props', nargs='*', help='prop names to (re)extract; default = all')
    ap.add_argument('--tiles', action='store_true', help='also sample the cobble ground tiles')
    ap.add_argument('--assets-dir', default=os.path.join('assets', 'world'))
    ap.add_argument('--out', default=None)
    args = ap.parse_args()

    a = np.array(Image.open(REF).convert('RGB'))
    outdir = args.out or os.path.join(tempfile.gettempdir(), 'town_props')
    os.makedirs(outdir, exist_ok=True)
    os.makedirs(args.assets_dir, exist_ok=True)

    todo = args.props or list(PROPS)
    unknown = [p for p in todo if p not in PROPS]
    if unknown:
        sys.exit(f'unknown props: {unknown}; known: {list(PROPS)}')

    cuts = {}
    for name in todo:
        img = extract(a, name, PROPS[name], outdir, args.assets_dir)
        if img is not None:
            cuts[name] = img

    # magenta QA contact (variable cell size — props differ wildly in size)
    if cuts:
        cell = 240; pad = 22; cols = 4
        rows = (len(cuts) + cols - 1) // cols
        contact = Image.new('RGB', (cell * cols, (cell + pad) * rows), (255, 0, 255))
        dr = ImageDraw.Draw(contact)
        for i, (name, img) in enumerate(cuts.items()):
            t = img.copy()
            t.thumbnail((cell - 8, cell - 8))
            x, y = (i % cols) * cell, (i // cols) * (cell + pad)
            contact.paste(t, (x + 4, y + 4), t)
            dr.text((x + 6, y + cell + 4), name, fill=(255, 255, 0))
        cpath = os.path.join(outdir, 'contact.png')
        contact.save(cpath)
        print(f'contact:  {cpath}')

    rel = args.assets_dir.replace('\\', '/').rstrip('/')
    snippet = os.path.join(outdir, 'manifest_snippet.txt')
    with open(snippet, 'w', encoding='utf-8') as f:
        for name in sorted(cuts):
            f.write(f"'world.{name}':'{rel}/{name}.png',\n")
    print(f'snippet:  {snippet}')

    if args.tiles:
        tdir = os.path.join('assets', 'tile')
        os.makedirs(tdir, exist_ok=True)
        patches = [a[py0:py1, px0:px1].astype(np.float64) for px0, py0, px1, py1 in COBBLE_PATCHES]
        group_mean = np.mean([p.mean(axis=(0, 1)) for p in patches], axis=0)
        for n, p in enumerate(patches):
            p = np.clip(p * (group_mean / p.mean(axis=(0, 1))), 0, 255).astype(np.uint8)
            png = os.path.join(tdir, f'cobble-{n}.png')
            Image.fromarray(p).save(png, optimize=True)
            print(f'  cobble-{n}: 128x128  {os.path.getsize(png)/1024:.0f} KB')
        with open(snippet, 'a', encoding='utf-8') as f:
            for n in range(len(COBBLE_PATCHES)):
                f.write(f"'tile.cobble.{n}':'assets/tile/cobble-{n}.png',\n")


if __name__ == '__main__':
    main()
