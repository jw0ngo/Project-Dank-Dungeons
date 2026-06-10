#!/usr/bin/env python3
"""Defringe sprite PNGs: rewrite the RGB of semi-transparent edge pixels from the
nearest SOLID pixel, killing baked background-colour halos without touching alpha.

THE DEFECT THIS FIXES (player walk halo, 2026-06-10): a cutout's edge pixels are a
LANCZOS blend of figure colour and the source background — if the bg was mid-grey,
the semi-transparent fringe is grey. Composited in-game (upscaled, smoothing on,
dark ground) that grey spreads into a visible halo. The idle sheets read clean not
because their fringe is thinner but because it is DARK (avg edge lum 13–16 vs the
bad walk frames' 53–133): the house style wraps every figure in a confident dark
outline, so a correct cutout's outermost blend IS that outline.

So the fix darkens, it does NOT bleed: each fringe pixel's RGB is luminance-clamped
down to the idle outline tone (hue preserved). REJECTED ALTERNATIVE (tried, made it
worse — 21→61): bleeding RGB from the nearest solid pixel. The knight's nearest
solid pixels are bright silver armour, not the outline — nearest-solid bleed pulls
highlights outward and brightens the halo. Clamping is also a no-op on already-dark
fringes, so clean sheets pass through unchanged (idempotent, safe on shipped art).

THE RIM-BAND FALSE-PASS (fixed 2026-06-10, same-day follow-up): v1 trusted every α≥200 pixel as "figure"
and clamped only the 8<α<200 band — but the most VISIBLE part of the antialiased
silhouette is the near-opaque rim (α 200–239), and on the bad walk frames that rim
was bright grey (lum ~113) while the idle's was dark (~48). v1 left it alone AND its
--check metric only looked at α<200, so the halo measured "clean" (lum ~11) yet the
eye still saw it. Fix: the edge band the clamp+metric cover now runs to FRINGE_HI=245
(the whole antialiased ramp, not just the soft half), so the rim is darkened too and
the metric can't false-pass. A separate SOLID_A=200 still defines the "solid figure
body" for --trim's distance field (that behaviour is unchanged). VERIFY against the
idle's FULL-ring lum (8≤α<245 = 18–22), not the old soft-band number.

Alpha, geometry, frame size, and registration are untouched — same filenames, no
re-wiring.

Prints the QA metric per file (avg lum + px count of the 8<α<245 edge band,
before → after). Target for the knight sheets: avg <= 20 (the idle's full ring).

  python tools/defringe-sprite.py assets/char/playerwalk*-n.png
  python tools/defringe-sprite.py --check assets/char/player-s.png   # measure only
"""
import argparse, glob
import numpy as np
from PIL import Image
import scipy.ndimage as ndi

SOLID_A = 200    # α at/above this = "solid figure body" — used ONLY by --trim's distance field
FRINGE_HI = 245  # clamp+metric cover the whole antialiased ramp up to here (incl. the near-opaque rim)
BAND_LO = 8      # the QA fringe band: 8 < α < FRINGE_HI (the full visible silhouette edge)


def fringe_metric(arr):
    a = arr[..., 3]
    band = (a > BAND_LO) & (a < FRINGE_HI)
    if not band.any():
        return 0, 0.0
    lum = arr[..., :3].astype(np.float64).mean(axis=2)
    return int(band.sum()), float(lum[band].mean())


TARGET_LUM = 18.0   # the idle outline tone (idle sheets measure 13-16)


def trim_smudge(arr, dist=2.5):
    """Kill semi-transparent pixels farther than `dist` px from the solid figure.

    Genuine edge anti-aliasing hugs the silhouette (a 1-2px ramp). Baked GROUND-SHADOW
    smudges and wide soft halos extend much farther (the east-walk clip's contact shadow
    trailed 5-30px behind the legs at low alpha) — the fringe *brightness* metric barely
    sees them, but on screen they read as a dark blob chasing the figure. Distance from
    the solid (α≥200) mask separates the two cleanly."""
    a = arr[..., 3]
    solid = a >= SOLID_A
    if not solid.any():
        return arr, 0
    d = ndi.distance_transform_edt(~solid)
    kill = (a > 0) & (a < SOLID_A) & (d > dist)
    out = arr.copy()
    out[..., 3][kill] = 0
    return out, int(kill.sum())


def defringe(arr):
    a = arr[..., 3]
    band = (a > 0) & (a < FRINGE_HI)
    if not band.any():
        return arr
    rgb = arr[..., :3].astype(np.float64)
    lum = rgb.mean(axis=2)
    # luminance-clamp the fringe down to the outline tone, preserving hue;
    # already-dark fringe pixels (scale >= 1) are untouched
    scale = np.ones_like(lum)
    bright = band & (lum > TARGET_LUM)
    scale[bright] = TARGET_LUM / lum[bright]
    out = arr.copy()
    out[..., :3] = np.clip(rgb * scale[..., None], 0, 255).astype(np.uint8)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('files', nargs='+', help='sprite PNGs (globs ok)')
    ap.add_argument('--check', action='store_true', help='measure only, do not rewrite')
    ap.add_argument('--trim', type=float, default=None, metavar='DIST',
                    help='also kill semi-transparent pixels farther than DIST px from the '
                         'solid figure (ground-shadow smudges / wide soft halos; try 2.5)')
    args = ap.parse_args()

    paths = []
    for f in args.files:
        paths.extend(sorted(glob.glob(f)) or [f])

    worst = 0.0
    for p in paths:
        img = Image.open(p).convert('RGBA')
        arr = np.array(img)
        n0, l0 = fringe_metric(arr)
        if args.check:
            print(f'  {p}: fringe {n0}px  lum {l0:.1f}')
            worst = max(worst, l0)
            continue
        out = defringe(arr)
        cut = 0
        if args.trim is not None:
            out, cut = trim_smudge(out, args.trim)
        n1, l1 = fringe_metric(out)
        Image.fromarray(out).save(p, optimize=True)
        note = f'  trimmed {cut}px' if args.trim is not None else ''
        print(f'  {p}: fringe {n0}px lum {l0:.1f}  ->  {n1}px lum {l1:.1f}{note}')
        worst = max(worst, l1)
    print(f'\nworst fringe lum: {worst:.1f}  (full-ring 8<a<245; target <= ~22, the idle 18-22)')


if __name__ == '__main__':
    main()
