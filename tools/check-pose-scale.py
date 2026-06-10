#!/usr/bin/env python3
"""check-pose-scale.py - verify a new player/enemy POSE sheet renders at the same
*apparent body size* as the idle reference, and report the draw-mult + feet-plant the
engineer should wire.

WHY THIS EXISTS (the recurring "character pops bigger" bug):
    When a new pose/animation sheet is sliced, the body must match the idle body's
    on-screen size or it visibly pops. The intuitive metric -- bbox height / canvas, or
    "body fill" -- IS WRONG. A pose with a different silhouette (a coiled wind-up, a
    crouched dash, a raised-sword swing) has a different bbox height for the SAME actual
    body. Sizing by bbox over- or under-scales it. The heavy WIND-UP shipped at 1.3
    (copied from the swing, justified by a 0.736-vs-0.732 bbox-fill match) and rendered
    ~30% too big -- because the coiled pose is short in bbox but normal-sized in body.

    The stable feature is the ARMOUR MASS, measured two ways:
      * helmet / head width  (top band of the body)
      * shoulder width       (upper-body widest run)
    Neither alone is reliable: a coiled/crouched pose shrinks the head's bbox share while
    widening the shoulders (and a reaching pose does the reverse), so head-mult and
    shoulder-mult swing in OPPOSITE directions. Their AVERAGE cancels that distortion.
    Validation: the dash pose looks correct in-game at mult 1.0 -- its head-mult is 1.12
    and shoulder-mult 0.88, and (1.12 + 0.88) / 2 = 1.00. So the tool recommends the
    per-facing mean of head-mult and shoulder-mult, then the median across facings.

USAGE:
    python tools/check-pose-scale.py <pose-prefix> [--idle player] [--dir assets/char]
                                     [--mult 1.07] [--plant 0.15]

    <pose-prefix>   e.g. playerheavywindup  (reads <prefix>-{n,ne,e,se,s,sw,w,nw}.png)
    --idle          idle reference prefix (default: player)
    --mult/--plant  the values you wired in index.html; if given, the tool PASSES/FAILS
                    them against the measured recommendation (use as a gate before commit).

LIMITATION -- weapon-extended / lunging poses (the heavy SWING): when a pose extends a
    sword/bow sideways it inflates the shoulder-band width, and a forward-pitched head
    corrupts the head band, so the per-facing ratios scatter wildly (the swing ranges
    0.77..1.94) and the median is NOT trustworthy. For such a pose, anchor it to a STABLE
    neighbouring pose instead of idle: e.g. the swing should match the wind-up's apparent
    body (consecutive frames of one motion), so swing_mult = windup_mult * windup_cell /
    swing_cell, then eyeball. Trust this tool's idle-ratio only for stable stances
    (idle-like, crouch, coil) -- it nails those (dash 1.00, wind-up 1.07).

EXIT CODE: 0 if (no --mult given) OR (wired mult within tolerance of recommendation);
           1 if the wired mult/plant is off, or files are missing.
"""
import sys, argparse, statistics as st
try:
    from PIL import Image
    import numpy as np
except ImportError:
    sys.exit("needs Pillow + numpy:  python -m pip install --user pillow numpy")

DIRS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
ALPHA = 40            # opaque threshold
HEAD_BAND = 0.22      # top fraction of body = helmet region
SHLDR_BAND = 0.45     # top fraction = head+shoulders
MULT_TOL = 0.06       # wired mult must be within this of recommendation
PLANT_TOL = 0.04      # wired plant within this (units of PSCALE)


def measure(path):
    a = (np.asarray(Image.open(path).convert('RGBA'))[:, :, 3] > ALPHA)
    ys, xs = np.where(a)
    if len(ys) == 0:
        return None
    top, bot, cell = ys.min(), ys.max(), a.shape[0]
    H = bot - top + 1
    head = a[top:top + max(1, int(H * HEAD_BAND)), :].sum(axis=1).max()
    shldr = a[top:top + max(1, int(H * SHLDR_BAND)), :].sum(axis=1).max()
    # Widths are normalised by CELL size: gDrawSprite maps the whole NxN canvas to PSCALE*mult
    # screen px, so a feature's APPARENT size is (px / cell). Normalising makes the mult correct
    # even when a pose sheet has a different canvas size than idle (e.g. heavy is 208, idle 192).
    return dict(headW=head / cell, shldrW=shldr / cell, feetY=(bot + 1) / cell, cell=cell)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pose')
    ap.add_argument('--idle', default='player')
    ap.add_argument('--dir', default='assets/char')
    ap.add_argument('--mult', type=float, default=None)
    ap.add_argument('--plant', type=float, default=None)
    a = ap.parse_args()

    head_r, shldr_r, comb_r, feet_gap = [], [], [], []
    missing = []
    cells = set()
    print(f"  facing | idle h/s (of cell) | {a.pose} h/s | feetY  | head-m shldr-m  MEAN")
    print("  " + "-" * 80)
    for d in DIRS:
        ip = f"{a.dir}/{a.idle}-{d}.png"
        pp = f"{a.dir}/{a.pose}-{d}.png"
        try:
            im, pm = measure(ip), measure(pp)
        except FileNotFoundError as e:
            missing.append(getattr(e, 'filename', d))
            continue
        cells.add(im['cell']); cells.add(pm['cell'])
        hr, sr = im['headW'] / pm['headW'], im['shldrW'] / pm['shldrW']
        cr = (hr + sr) / 2     # head & shoulder errors are anti-correlated across silhouettes; mean cancels them
        head_r.append(hr); shldr_r.append(sr); comb_r.append(cr)
        feet_gap.append(im['feetY'] - pm['feetY'])
        print(f"  {d:>5}  | {im['headW']:.3f}/{im['shldrW']:.3f}      | "
              f"{pm['headW']:.3f}/{pm['shldrW']:.3f}  | {pm['feetY']:.3f} | "
              f"{hr:>6.3f} {sr:>6.3f}  {cr:>5.3f}")

    if missing:
        print("\n  MISSING FILES:", ", ".join(str(m) for m in missing))
        sys.exit(1)
    if len(cells) > 1:
        print(f"  (mixed canvas sizes {sorted(cells)} — widths normalised by cell, mult is canvas-correct)")

    rec_mult = round(st.median(comb_r), 2)        # the recommendation: median of per-facing means
    rec_plant = round(st.median(feet_gap), 2)     # feetY gap, units of cell ~ PSCALE

    print("  " + "-" * 80)
    print(f"  median head-mult {st.median(head_r):.3f}   median shoulder-mult {st.median(shldr_r):.3f}"
          f"   median COMBINED {st.median(comb_r):.3f}")
    print(f"\n  RECOMMEND  draw-mult  ~ {rec_mult:.2f}   (median of per-facing head/shoulder means)")
    print(f"  RECOMMEND  feet-plant ~ {rec_plant:.2f} x PSCALE  (idle feetY - pose feetY)")

    ok = True
    if a.mult is not None:
        d = abs(a.mult - rec_mult)
        if d > MULT_TOL:
            ok = False
        print(f"\n  wired --mult {a.mult}  vs rec {rec_mult:.2f}  -> "
              f"{'OK' if d <= MULT_TOL else 'OFF'} (d {d:.2f}, tol {MULT_TOL})")
    if a.plant is not None:
        d = abs(a.plant - rec_plant)
        if d > PLANT_TOL:
            ok = False
        print(f"  wired --plant {a.plant} vs rec {rec_plant:.2f} -> "
              f"{'OK' if d <= PLANT_TOL else 'OFF'} (d {d:.2f}, tol {PLANT_TOL})")

    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
