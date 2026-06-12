#!/usr/bin/env python3
"""Slice ONE FX sprite (a single explosion / burst on a plain bg) into a single
transparent cutout + a 'fx.<id>' manifest snippet.

slice-variants.py is 3x3-only; a lone FX sprite (the fx.thrust / fx.slash shape — a
single manifest key, not a numbered variant set) needs the SAME cutout pipeline applied
to one cell:
  - edge-seeded flood fill (cut_cell) eats the border-connected bg while KEEPING the
    interior white-hot core (it is not border-connected, so the flood never reaches it);
  - --keep-specks (ON by default for FX) re-adds detached embers / debris the speck
    filter drops — on an explosion those flecks ARE the art (same rule as
    slice-variants --keyspace fx --keep-specks).
Frames square (FX sprites composite centred via 'lighter'), resizes to --size (256 to
match the shipped FX sets).

fx folds by OWNER (cilia/, _shared/), which isn't derivable from the id, so pass the
owner dir explicitly: --out-dir assets/fx/cilia.

  python tools/slice-single-fx.py "art/fx/cilia/fire-explosion.png" fireexplosion \
      --bg white --erode 1 --out-dir assets/fx/cilia
-> assets/fx/cilia/fireexplosion.png + a magenta QA contact + 'fx.fireexplosion' snippet.

QA: eyeball the magenta contact. The bg-leak px count OVER-reports on fire (white-hot
cores are bg-coloured on purpose), so the contact is the verdict, not the number.
"""
import os, argparse, tempfile, importlib.util
import numpy as np
from PIL import Image


def dewhite(fig, sat_gate=0.33, strength=1.0):
    """Kill the pale NEUTRAL halo left when fire/smoke art was painted on a near-white
    bg: the antialiased edge is figure-colour blended with white, so it reads as a
    bright grey ring once cut. Unlike defringe-sprite.py (which clamps edges to a DARK
    outline tone — right for character silhouettes, wrong for fire: it would blacken the
    glow), this makes the halo fade to TRANSPARENT.

    Per pixel, estimate true coverage from distance-from-white aw=(255-min)/255 (a white
    halo pixel -> ~0, a dark/saturated figure pixel -> ~1) and pull alpha down toward
    a*aw — but ONLY where the pixel is NEUTRAL (low saturation). Saturated flame wisps
    (coloured, low min) are untouched, so only the grey bg-ramp loses alpha. Leaves a
    white-hot CORE alone too if it's interior (this runs on the figure, cores are opaque
    & saturated-enough or simply not on the cut edge)."""
    arr = np.array(fig).astype(np.float64)
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
    mn = np.minimum(np.minimum(r, g), b)
    mx = np.maximum(np.maximum(r, g), b)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0.0)
    neutral = np.clip(1.0 - sat / sat_gate, 0.0, 1.0)   # 1 = grey, 0 = saturated
    aw = (255.0 - mn) / 255.0                            # 0 = white, ->1 = dark/coloured
    factor = 1.0 - strength * neutral * (1.0 - aw)       # neutral-white -> aw; saturated -> 1
    arr[..., 3] = np.clip(a * factor, 0, 255)
    return Image.fromarray(arr.astype(np.uint8))


def _load(name, fn):
    d = os.path.dirname(os.path.abspath(__file__))
    spec = importlib.util.spec_from_file_location(name, os.path.join(d, fn))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


_st = _load('slice_turnaround', 'slice-turnaround.py')
_sv = _load('slice_variants', 'slice-variants.py')
cut_cell, bg_leak_px = _st.cut_cell, _st.bg_leak_px
recover_specks = _sv.recover_specks


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('image')
    ap.add_argument('id', help="-> 'fx.<id>' key + <id>.png file")
    ap.add_argument('--bg', choices=['black', 'white'], default='white')
    ap.add_argument('--thresh', type=int, default=40)
    ap.add_argument('--feather', type=float, default=0.6)
    ap.add_argument('--erode', type=int, default=0,
                    help='tighten the alpha mask N px to kill the bg edge halo')
    ap.add_argument('--dewhite', type=float, default=0.0, metavar='STRENGTH',
                    help='fade the pale NEUTRAL white-bg halo to transparent (0=off, 1=full); '
                         'neutral-gated so coloured flame wisps are untouched. For fire/smoke '
                         'art painted on a near-white field where --erode alone leaves a grey ring.')
    ap.add_argument('--global', dest='glob', action='store_true',
                    help='also cut enclosed bg pockets (UNSAFE for a white-hot core — leave off for fire)')
    ap.add_argument('--no-specks', action='store_true',
                    help='drop detached embers/debris (default KEEPS them — FX rule)')
    ap.add_argument('--size', type=int, default=256, help='output px (0 = native); square frame -> S x S, tight frame -> HEIGHT = S')
    ap.add_argument('--frame', choices=['square', 'tight'], default='square',
                    help="square = padded square canvas (bursts/grounds, composited centred); "
                         "tight = keep the bbox aspect ratio (tall pillars/jets the engine draws at a fixed AR)")
    ap.add_argument('--keyspace', default='fx')
    ap.add_argument('--out-dir', default='assets/fx',
                    help='where the cutout lands; fx folds by OWNER — pass assets/fx/cilia etc.')
    ap.add_argument('--qa', default=None, help='QA dir (default a temp dir)')
    args = ap.parse_args()

    cell = Image.open(args.image).convert('RGB')
    # crop=False so recover_specks gets a cell-aligned alpha; tight-crop after.
    fig = cut_cell(cell, args.bg, args.thresh, args.feather, args.glob, args.erode, 0, crop=False)
    if fig is None:
        print('no figure produced — check --bg / --thresh'); return
    specks = 0
    if not args.no_specks:
        fig, specks = recover_specks(cell, fig, args.bg, args.thresh, args.feather)
    if args.dewhite > 0 and args.bg == 'white':
        fig = dewhite(fig, strength=args.dewhite)
    bb = fig.split()[3].getbbox()
    if bb:
        fig = fig.crop(bb)

    if args.frame == 'tight':
        # Keep the figure's native aspect (tall pillars/jets); scale so HEIGHT = --size.
        if args.size and fig.height != args.size:
            w = max(1, round(fig.width * args.size / fig.height))
            fig = fig.resize((w, args.size), Image.LANCZOS)
        sq = fig
    else:
        side = int(max(fig.size) * 1.06)
        sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
        sq.alpha_composite(fig, ((side - fig.width) // 2, (side - fig.height) // 2))
        S = side if args.size == 0 else args.size
        if sq.size != (S, S):
            sq = sq.resize((S, S), Image.LANCZOS)

    os.makedirs(args.out_dir, exist_ok=True)
    rel = args.out_dir.replace('\\', '/').rstrip('/')
    png = os.path.join(args.out_dir, f'{args.id}.png')
    sq.save(png, optimize=True)
    kb = os.path.getsize(png) / 1024
    leak = bg_leak_px(sq, args.bg, args.thresh)

    qa = args.qa or os.path.join(tempfile.gettempdir(), f'slice_{args.id}')
    os.makedirs(qa, exist_ok=True)
    cs = 360
    thumb = sq.resize((cs, cs))
    contact = Image.new('RGB', (cs, cs), (255, 0, 255))
    contact.paste(thumb, (0, 0), thumb)
    contact_path = os.path.join(qa, 'contact.png')
    contact.save(contact_path)
    snip = f"'{args.keyspace}.{args.id}':'{rel}/{args.id}.png',\n"
    with open(os.path.join(qa, 'manifest_snippet.txt'), 'w', encoding='utf-8') as f:
        f.write(snip)

    print(f"asset:   {png}  ({sq.width}x{sq.height}, ~{kb:.0f} KB)  specks+{specks}  bg-leak {leak}px")
    print(f"contact: {contact_path}  (magenta — eyeball this, leak px over-reports on fire)")
    print(f"snippet: {snip.strip()}")


if __name__ == '__main__':
    main()
