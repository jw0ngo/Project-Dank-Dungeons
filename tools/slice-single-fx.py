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
from PIL import Image


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
    ap.add_argument('--global', dest='glob', action='store_true',
                    help='also cut enclosed bg pockets (UNSAFE for a white-hot core — leave off for fire)')
    ap.add_argument('--no-specks', action='store_true',
                    help='drop detached embers/debris (default KEEPS them — FX rule)')
    ap.add_argument('--size', type=int, default=256, help='output square px (0 = native)')
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
    bb = fig.split()[3].getbbox()
    if bb:
        fig = fig.crop(bb)

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

    print(f"asset:   {png}  ({S}x{S}, ~{kb:.0f} KB)  specks+{specks}  bg-leak {leak}px")
    print(f"contact: {contact_path}  (magenta — eyeball this, leak px over-reports on fire)")
    print(f"snippet: {snip.strip()}")


if __name__ == '__main__':
    main()
