#!/usr/bin/env python3
"""Background-remove a SINGLE prop image (coin, chest, barrel — one object, not a sheet).

The turnaround slicer (slice-turnaround.py) wants a 3x3 grid and the variant slicer
(slice-variants.py) wants 9 occupied cells; neither fits a lone prop on a clean studio
background. This reuses the slicer's accumulated cutout logic (cut_cell — edge-seeded
flood fill that keeps interior shadows, plus the same --global/--erode/--sever/--thresh
flags) on the whole image as one cell, writes a transparent PNG into assets/<kind>/, and
drops a magenta QA render + a path-based ART_MANIFEST snippet next to it.

  python tools/cut-prop.py "art/world/treasure chest closed.png" chest-closed --bg white
  python tools/cut-prop.py "art/world/favor gold coin.png" favorcoin --bg white --size 192

--key controls the manifest keyspace (default world -> 'world.<id>', assets/world/).
QA every cutout against the magenta render: a leftover white/dark halo (try --erode) or an
enclosed background pocket (a gap under an open lid, inside a handle -> try --global) shows
up instantly against magenta. The bg-leak px count is printed but over-reports when the
prop's own highlights are near the bg colour (gold specular on white) — trust the render.
"""
import os, argparse, tempfile
from PIL import Image, ImageDraw

# Reuse the slicer's cutout + QA logic — single source of truth for every edge case.
import importlib.util
_spec = importlib.util.spec_from_file_location(
    'slice_turnaround', os.path.join(os.path.dirname(__file__), 'slice-turnaround.py'))
_st = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_st)
cut_cell, bg_leak_px = _st.cut_cell, _st.bg_leak_px


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('image')
    ap.add_argument('id')
    ap.add_argument('--bg', choices=['black', 'white'], default='white')
    ap.add_argument('--thresh', type=int, default=40)
    ap.add_argument('--feather', type=float, default=0.6)
    ap.add_argument('--size', type=int, default=256,
                    help='longest-side px of the output (aspect preserved); 0 = native, no resample')
    ap.add_argument('--global', dest='glob', action='store_true',
                    help='cut enclosed bg pockets too (gap under an open lid / inside a handle)')
    ap.add_argument('--erode', type=int, default=0, help='tighten the alpha N px to kill an edge halo')
    ap.add_argument('--sever', type=int, default=0, help='HARD case: prop detail shares the bg colour')
    ap.add_argument('--key', default='world', help="manifest keyspace + assets subdir (default 'world')")
    ap.add_argument('--assets-dir', default=None)
    ap.add_argument('--out', default=None, help='QA dir (default <tempdir>/cut_<id>)')
    args = ap.parse_args()

    img = Image.open(args.image).convert('RGB')
    fig = cut_cell(img, args.bg, args.thresh, args.feather, args.glob, args.erode, args.sever)
    if fig is None:
        raise SystemExit('no figure found — check --bg / --thresh')

    # Resample longest side to --size, aspect preserved (props aren't square like sprites).
    if args.size and max(fig.size) != args.size:
        s = args.size / max(fig.size)
        fig = fig.resize((max(1, round(fig.width * s)), max(1, round(fig.height * s))), Image.LANCZOS)

    assets_dir = args.assets_dir or os.path.join('assets', args.key)
    os.makedirs(assets_dir, exist_ok=True)
    png = os.path.join(assets_dir, f'{args.id}.png')
    fig.save(png, optimize=True)
    rel = assets_dir.replace('\\', '/').rstrip('/')
    kb = os.path.getsize(png) / 1024
    leak = bg_leak_px(fig, args.bg, args.thresh)

    outdir = args.out or os.path.join(tempfile.gettempdir(), f'cut_{args.id}')
    os.makedirs(outdir, exist_ok=True)
    pad = 16
    qa = Image.new('RGB', (fig.width + pad * 2, fig.height + pad * 2), (255, 0, 255))
    qa.paste(fig, (pad, pad), fig)
    ImageDraw.Draw(qa).text((pad, 2), f'{args.id}  {fig.size}  bg-leak {leak}px', fill=(255, 255, 0))
    qa_path = os.path.join(outdir, 'qa.png')
    qa.save(qa_path)
    snippet = os.path.join(outdir, 'manifest_snippet.txt')
    with open(snippet, 'w', encoding='utf-8') as f:
        f.write(f"'{args.key}.{args.id}':'{rel}/{args.id}.png',\n")

    print(f"  {args.id}: {fig.size}  bg-leak {leak}px  ({kb:.0f} KB)")
    print(f"asset:    {png}")
    print(f"QA:       {qa_path}  (eyeball against magenta)")
    print(f"snippet:  {snippet}  -> '{args.key}.{args.id}':'{rel}/{args.id}.png',")


if __name__ == '__main__':
    main()
