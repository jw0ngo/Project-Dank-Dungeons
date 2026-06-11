#!/usr/bin/env python3
"""fx-ring-heatfill.py — clean a fire-RING source sheet and paint a diffuse heat-haze
into its hollow interior, producing a drop-in `assets/fx/fr.png` for Burning Body.

WHY this tool exists
--------------------
The shipped fire ring (`FR_SPR` = assets/fx/fr.png) is drawn ADDITIVELY (`'lighter'`)
and sized so its bright band lands at the ring's expanding `traveled` radius
(`FR_RING_FRAC`). A new hand-painted ring (`art/fx/burning body.png`) is a nicer, wispier
ring but (a) its background is a flat ~14/255 grey, not true black — under 'lighter' that
adds a square wash; and (b) its centre is hollow. Josh wants the interior filled with a
"less concentrated heat-wave" so the ring isn't a bare band.

What it does, in order:
  1. Resize the source to `--size` (square).
  2. FLOOR the background: subtract a pedestal so the ambient grey -> true black (clean
     'lighter' compositing) while the bright ring filaments survive.
  3. Build a radial ENVELOPE for the heat fill: warm in the interior, tapering to a calm
     eye at the dead centre and to zero just BEFORE the bright band (so the band stays crisp).
  4. Build multi-octave value-noise TURBULENCE (organic heat shimmer, isotropic — this is a
     top-down scorch glow, not directional flames).
  5. Colour-map heat (dark-red -> orange) and ADD it under the ring, capped well below the
     ring's bright cores so the fill reads as "less concentrated".
  6. Save assets/fx/fr.png + a full-res master + magenta/dark QA previews, and PRINT the
     measured bright-band radius fraction (the FR_RING_FRAC to hand the engineer).

Tunable knobs are the CLI flags — tuning is data, not code surgery.
"""
import argparse, os
import numpy as np
from PIL import Image, ImageFilter


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / max(1e-6, (e1 - e0)), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def value_noise(size, base, octaves, persistence, rng):
    """Smooth multi-octave value noise in [0,1] via upscaled random lattices."""
    acc = np.zeros((size, size), np.float32)
    amp, tot = 1.0, 0.0
    cells = base
    for _ in range(octaves):
        lattice = rng.random((cells, cells)).astype(np.float32)
        up = np.asarray(
            Image.fromarray((lattice * 255).astype(np.uint8)).resize(
                (size, size), Image.BICUBIC), np.float32) / 255.0
        acc += amp * up
        tot += amp
        amp *= persistence
        cells = max(2, cells * 2)
    acc /= tot
    acc -= acc.min()
    acc /= max(1e-6, acc.max())
    return acc


def radial_frac(size):
    c = (size - 1) / 2.0
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    return np.hypot(yy - c, xx - c) / (size / 2.0)


def measure_band(rgb):
    """Return the radius fraction (of half-width) of peak radial brightness."""
    lum = rgb.mean(axis=2)
    rf = radial_frac(lum.shape[0]).ravel()
    v = lum.ravel()
    bins = np.linspace(0, 1.1, 80)
    idx = np.digitize(rf, bins)
    means = np.array([v[idx == b].mean() if np.any(idx == b) else 0
                      for b in range(1, len(bins))])
    centers = (bins[:-1] + bins[1:]) / 2
    return float(centers[means.argmax()])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('-o', '--out', default='assets/fx/fr.png')
    ap.add_argument('--master', default='art/fx/burning-body-ring-heatfill.png')
    ap.add_argument('--size', type=int, default=512)
    ap.add_argument('--pedestal', type=float, default=20.0,
                    help='subtract this 0..255 from every channel to floor the ambient grey to black')
    # heat-fill envelope (fractions of half-width)
    ap.add_argument('--fill-peak', type=float, default=0.42, help='radius frac of strongest heat')
    ap.add_argument('--fill-inner', type=float, default=0.10, help='calm eye radius (fade toward centre)')
    ap.add_argument('--fill-outer', type=float, default=0.66, help='heat fades to 0 by here (gap before band)')
    ap.add_argument('--eye', type=float, default=0.34, help='heat level at dead centre, 0..1 of peak')
    ap.add_argument('--strength', type=float, default=0.62, help='overall heat brightness, 0..1')
    ap.add_argument('--contrast', type=float, default=1.7, help='turbulence gamma (higher = wispier)')
    ap.add_argument('--seed', type=int, default=7)
    ap.add_argument('--no-fill', action='store_true',
                    help='source ALREADY has the heat fill baked in (e.g. an image-gen render) — skip '
                         'synthetic fill; just floor the ambient grey, measure the band, resize, QA')
    args = ap.parse_args()

    rng = np.random.default_rng(args.seed)
    N = args.size

    src = Image.open(args.src).convert('RGB').resize((N, N), Image.LANCZOS)
    rgb = np.asarray(src, np.float32)

    # 1. floor the ambient grey -> true black (clean additive compositing)
    ring = np.clip(rgb - args.pedestal, 0, 255)

    band = measure_band(ring)

    if args.no_fill:
        out = ring.astype(np.uint8)
        out_band = band
        _save_and_report(out, args, N, band, out_band, synthetic=False)
        return

    # 2. radial heat envelope: calm eye -> peak -> 0 before the band
    rf = radial_frac(N)
    inner = args.eye + (1 - args.eye) * smoothstep(args.fill_inner, args.fill_peak, rf)
    outer = 1.0 - smoothstep(args.fill_peak, args.fill_outer, rf)
    env = np.clip(inner * outer, 0, 1)

    # 3. turbulence (isotropic heat shimmer) — slightly blurred to read as haze not static
    turb = value_noise(N, base=4, octaves=5, persistence=0.55, rng=rng)
    turb = np.asarray(Image.fromarray((turb * 255).astype(np.uint8))
                      .filter(ImageFilter.GaussianBlur(N / 220)), np.float32) / 255.0
    turb = np.power(turb, args.contrast)

    heat = np.clip(env * turb * args.strength, 0, 1)  # 0..1 intensity field

    # 4. warm colour ramp (dark red -> orange), capped below the ring's bright cores
    #    stops at intensity 0 / 0.5 / 1.0
    lo = np.array([70, 10, 0], np.float32)
    mid = np.array([210, 70, 12], np.float32)
    hi = np.array([255, 150, 45], np.float32)
    t = heat[..., None]
    ramp = np.where(t < 0.5, lo + (mid - lo) * (t / 0.5),
                    mid + (hi - mid) * ((t - 0.5) / 0.5))
    heat_rgb = ramp * heat[..., None]   # fade to black where intensity -> 0

    # 5. composite: ring filaments dominate; heat fills the interior
    out = np.clip(ring + heat_rgb, 0, 255).astype(np.uint8)
    out_band = measure_band(out.astype(np.float32))
    _save_and_report(out, args, N, band, out_band, synthetic=True)


def _save_and_report(out, args, N, band, out_band, synthetic):
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    os.makedirs(os.path.dirname(args.master), exist_ok=True)
    Image.fromarray(out).save(args.out, optimize=True)
    Image.fromarray(out).save(args.master, optimize=True)

    # QA previews: on magenta (halo/wash check) and on dark (in-game read)
    qa = os.path.join(os.path.dirname(args.out), '_heatfill_qa')
    os.makedirs(qa, exist_ok=True)
    for name, bg in (('on-magenta', (255, 0, 255)), ('on-dark', (16, 14, 20))):
        # emulate 'lighter': additive over the bg
        comp = np.clip(np.asarray(out, np.float32) + np.array(bg, np.float32), 0, 255).astype(np.uint8)
        Image.fromarray(comp).save(os.path.join(qa, f'{name}.png'))

    print(f'wrote {args.out}  ({N}x{N})  [{"baked-fill source, cleaned" if not synthetic else "synthetic heat fill"}]')
    print(f'  source bright-band frac  = {band:.3f}')
    print(f'  output bright-band frac  = {out_band:.3f}   <-- FR_RING_FRAC to hand the engineer')
    print(f'  QA previews -> {qa}/  (on-magenta = wash/halo check, on-dark = in-game read)')


if __name__ == '__main__':
    main()
