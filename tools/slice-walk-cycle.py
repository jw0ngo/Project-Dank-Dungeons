#!/usr/bin/env python3
"""Slice a folder of single-pose walk-cycle frames into registered, background-removed
game sprites — the per-frame animation counterpart to slice-turnaround.py (which is for
3x3 turnaround sheets).

Each source frame is one full-body figure facing ONE direction, on a FLAT near-uniform
background (the From Dust frames use a dark ~#212121 canvas). Unlike the turnaround
slicer, these are separate files, so the job is: background-remove + register all frames
to a SINGLE common scale and a SHARED ground line so the body neither jitters in size nor
slides vertically as the cycle plays.

Key decisions baked in (learned the hard way — see SESSION_JOURNAL):
  * Background removal keys on COLOR DISTANCE to the flat bg color, NOT on brightness.
    The knight's dark steel/navy/leather overlap the bg in brightness, so a brightness
    threshold leaks the flood fill into the figure interior and ghosts it out. Color
    distance preserves dark-but-tinted figure pixels while still cutting the neutral bg.
  * ONE scale factor for the whole cycle (from the median frame height) so the body size
    is identical every frame. Per-frame bbox-height matching would pump the body size as
    the stride changes the silhouette height.
  * Bottom-align each frame's lowest pixel to a common baseline so the planted foot stays
    on the ground line; the head bob is then carried naturally by the art.

Output: assets/char/<id><N>-<dir>.png for N in 1..count (matches the flat ART_MANIFEST
char.<id><N>.<dir> convention), plus a magenta QA contact strip and a side-by-side
comparison against the idle sprite if one is given.
"""
import argparse, os, sys
from collections import deque
import numpy as np
from PIL import Image


def flood_bg(rgb, ref, tol):
    """Edge-seeded flood fill; a pixel is background if its color distance to `ref`
    is <= tol AND it is connected to the canvas border. Returns the FIGURE mask."""
    H, W, _ = rgb.shape
    dist = np.sqrt(((rgb.astype(np.int32) - np.array(ref)) ** 2).sum(axis=2))
    isbg = dist <= tol
    vis = np.zeros((H, W), bool)
    dq = deque()
    for x in range(W):
        for y in (0, H - 1):
            if isbg[y, x] and not vis[y, x]:
                vis[y, x] = True; dq.append((y, x))
    for y in range(H):
        for x in (0, W - 1):
            if isbg[y, x] and not vis[y, x]:
                vis[y, x] = True; dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and not vis[ny, nx] and isbg[ny, nx]:
                vis[ny, nx] = True; dq.append((ny, nx))
    return ~vis


def erode(fig, n):
    for _ in range(n):
        f = fig.copy()
        f[1:, :] &= fig[:-1, :]; f[:-1, :] &= fig[1:, :]
        f[:, 1:] &= fig[:, :-1]; f[:, :-1] &= fig[:, 1:]
        fig = f
    return fig


def bbox(mask):
    ys, xs = np.where(mask)
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def body_height(fig):
    """Helmet-to-foot height, ignoring a raised sword. The legs (no sword down there)
    fix the body's x-center; the helmet top is then the topmost figure pixel within a
    head-width window around that center, so a blade jutting off to the side or above
    doesn't inflate the measurement. Falls back to full bbox height for compact poses
    where the sword never rises above the helmet (the result is then identical)."""
    ys, xs = np.where(fig)
    top, foot = int(ys.min()), int(ys.max())
    full = foot - top + 1
    band = foot - int(full * 0.20)            # bottom ~20% = legs/feet
    _, lxs = np.where(fig[band:foot + 1])
    cx = int(lxs.mean())
    halfw = int(full * 0.16)                   # ~head half-width
    sub = fig[:, max(0, cx - halfw): cx + halfw]
    helmet_top = int(np.where(sub.any(axis=1))[0].min())
    return foot - helmet_top + 1               # helmet-to-foot


def leg_center_x(fig):
    """X of the body's planted base — the mean column of the bottom ~20% (legs/feet),
    where no sword is present. Used to horizontally center the BODY on the entity point
    so the feet sit on the shadow, regardless of where a held sword juts out."""
    ys, xs = np.where(fig)
    top, foot = int(ys.min()), int(ys.max())
    band = foot - int((foot - top + 1) * 0.20)
    _, lxs = np.where(fig[band:foot + 1])
    return int(lxs.mean())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src", help="folder of source frames (sorted by name = cycle order)")
    ap.add_argument("id", help="sprite id, e.g. playerwalk -> playerwalk1-s.png ...")
    ap.add_argument("--dir", default="s", help="facing direction tag (default s)")
    ap.add_argument("--bg", default="33,33,33", help="reference bg color R,G,B")
    ap.add_argument("--tol", type=float, default=24, help="bg color-distance tolerance")
    ap.add_argument("--erode", type=int, default=1, help="px to erode the figure edge (halo kill)")
    ap.add_argument("--canvas", type=int, default=192, help="output square canvas size")
    ap.add_argument("--target-h", type=int, default=178,
                    help="figure height in px the MEDIAN frame is scaled to")
    ap.add_argument("--anchor", choices=("bbox", "body"), default="body",
                    help="scale by full bbox height (bbox) or helmet-to-foot body height "
                         "(body, default) — use 'body' so a raised sword doesn't shrink "
                         "the figure")
    ap.add_argument("--baseline", type=int, default=None,
                    help="y of the ground line in the canvas (default canvas-1)")
    ap.add_argument("--assets-dir", default="assets/char")
    ap.add_argument("--compare", default=None, help="idle sprite png to QA against")
    args = ap.parse_args()

    ref = tuple(int(v) for v in args.bg.split(","))
    baseline = args.baseline if args.baseline is not None else args.canvas - 1
    files = sorted(f for f in os.listdir(args.src) if f.lower().endswith((".png", ".jpg", ".jpeg")))
    if not files:
        sys.exit("no source frames found in " + args.src)

    cut = []      # cropped RGBA figures
    measures = []  # per-frame scale reference height (full bbox or body), source px
    for f in files:
        rgb = np.array(Image.open(os.path.join(args.src, f)).convert("RGB"))
        fig = erode(flood_bg(rgb, ref, args.tol), args.erode)
        x0, y0, x1, y1 = bbox(fig)
        m = (y1 - y0 + 1) if args.anchor == "bbox" else body_height(fig)
        legcx = leg_center_x(fig) - x0          # leg center in crop-local coords
        rgba = np.dstack([rgb, (fig * 255).astype(np.uint8)])
        im = Image.fromarray(rgba, "RGBA").crop((x0, y0, x1 + 1, y1 + 1))
        cut.append((im, legcx))
        measures.append(m)
        print(f"  {f}: figpx={int(fig.sum())} bbox={x1-x0+1}x{y1-y0+1} {args.anchor}H={m}")

    ms = sorted(measures)
    median = (ms[(len(ms) - 1) // 2] + ms[len(ms) // 2]) / 2
    scale = args.target_h / median
    print(f"median {args.anchor} height={median:.0f} -> scale={scale:.4f} (target {args.target_h})")

    os.makedirs(args.assets_dir, exist_ok=True)
    finals = []
    for i, (im, legcx) in enumerate(cut, 1):
        nw, nh = max(1, round(im.width * scale)), max(1, round(im.height * scale))
        rim = im.resize((nw, nh), Image.LANCZOS)
        canvas = Image.new("RGBA", (args.canvas, args.canvas), (0, 0, 0, 0))
        px = round(args.canvas / 2 - legcx * scale)  # center the BODY (legs), not the bbox
        py = baseline - nh + 1                        # plant feet on the shared ground line
        canvas.alpha_composite(rim, (px, py))
        out = os.path.join(args.assets_dir, f"{args.id}{i}-{args.dir}.png")
        canvas.save(out, optimize=True)
        finals.append(canvas)
        print(f"  wrote {out}  ({nw}x{nh} @ y={py})")

    # QA: magenta contact strip
    qa_dir = "art/_walkqa"
    os.makedirs(qa_dir, exist_ok=True)
    n = len(finals)
    mag = Image.new("RGBA", (args.canvas * n, args.canvas), (255, 0, 255, 255))
    for i, c in enumerate(finals):
        mag.alpha_composite(c, (args.canvas * i, 0))
    mag.save(os.path.join(qa_dir, f"{args.id}-{args.dir}-magenta.png"))

    # QA: comparison against the idle sprite on neutral gray
    if args.compare and os.path.exists(args.compare):
        idle = Image.open(args.compare).convert("RGBA")
        cmp = Image.new("RGBA", (args.canvas * (n + 1), args.canvas), (90, 90, 100, 255))
        cmp.alpha_composite(idle, (0, 0))
        for i, c in enumerate(finals):
            cmp.alpha_composite(c, (args.canvas * (i + 1), 0))
        cmp.save(os.path.join(qa_dir, f"{args.id}-{args.dir}-vs-idle.png"))

    # Manifest snippet
    print("\nART_MANIFEST snippet:")
    for i in range(1, n + 1):
        print(f"  'char.{args.id}{i}.{args.dir}':'{args.assets_dir}/{args.id}{i}-{args.dir}.png',")


if __name__ == "__main__":
    main()
