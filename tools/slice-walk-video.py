#!/usr/bin/env python3
"""
slice-walk-video.py — turn a studio walk-cycle .mp4 (or a dir of extracted frames)
into N registered, background-removed walk sprites for To Dust.

WHY THIS EXISTS (the accumulated edge cases — see agents/artist/memory.md):
  A walk clip from an AI/3D generator (e.g. Grok) is NOT a clean turnaround sheet:
   - The figure SHARES the bg's colour. The knight's steel is the same neutral grey as
     the studio backdrop, and the navy tabard's deep shadows are as dark as the bg.
     => Neither a brightness threshold (eats the tabard) nor a tolerance flood (leaks
        THROUGH the steel) separates them. GrabCut (colour models + spatial coherence)
        is the tool that works. Background-subtraction also fails: the figure stays
        centred, so it ghosts into a per-pixel median plate.
   - The clip DRIFTS in scale (the knight walks toward/away from camera, ~10-25% over
     the clip) and TRANSLATES. => pick all N frames from ONE gait cycle (small drift),
     scale-normalise by BODY height (excluding the thin sword, which changes the bbox),
     and register feet-anchored + torso-centred so the sprite doesn't jitter/slide.
   - Some clips TURN at the very start (front->back over the first ~8 frames) before
     settling. => choose frames from the settled window, never spanning the turn-in.

USAGE
  python tools/slice-walk-video.py <video.mp4 | frames_dir> <id> <dir> --frames 30,36,42,46
  # examples
  python tools/slice-walk-video.py "art/player/Animator Dump/northeast walk.mp4" player ne --frames 30,36,42,46
  python tools/slice-walk-video.py "art/.../_frames_se" player se --frames 7,19,26,33 --mirror sw

OUTPUT (into --qa-dir, default art/player/_walkqa/<id>-<dir>/):
  <id>walk1-<dir>.png .. <id>walkN-<dir>.png   (registered, transparent, --size square)
  _magenta-contact.png                          (QA: eyeball for halo/bleed against magenta)
  _preview.gif / _preview_2x.gif                (motion read at game speed)
  _fullres_fNNN.png                             (native-res cutouts for detail QA)
  manifest-snippet.txt                          (paste-ready ART_MANIFEST entries for the engineer)
With --mirror <dir2>, also writes the horizontally-flipped set as <id>walkK-<dir2>.png
(valid for this knight — the only asymmetry that flips, the sword shoulder, reads correct;
 verified against the true-rotated idle sheet. QA the mirror set too.)

This tool writes ONLY to the QA dir. Placing finals in assets/char/ + the manifest wiring
is the engineer's step (Artist hands off the spec). Pass --assets to also copy into assets/char/.
"""
import argparse, os, sys, shutil

def _lazy_imports():
    global np, Image, ImageDraw, ndi, cv2
    import numpy as np
    from PIL import Image, ImageDraw
    import scipy.ndimage as ndi
    import cv2
    return np, Image, ImageDraw, ndi, cv2


def load_frame(src, idx):
    """Return a PIL RGBA frame `idx` from a frames-dir or an mp4."""
    if os.path.isdir(src):
        return Image.open(os.path.join(src, f"f{idx:03d}.png")).convert("RGBA")
    # mp4: cache-extract on first use
    cache = getattr(load_frame, "_cache", None)
    if cache is None or cache[0] != src:
        import imageio.v2 as iio
        rd = iio.get_reader(src, "ffmpeg")
        frames = [Image.fromarray(f).convert("RGBA") for f in rd]
        load_frame._cache = (src, frames)
        cache = load_frame._cache
    return cache[1][idx]


def grabcut_cut(rgba, iters=8, pad=14, erode=1, shadow_bg=False, shadow_lum=16, shadow_band=0.80):
    """GrabCut foreground extraction. Returns (cut_rgba, fig_bool_mask).

    shadow_bg=True also seeds the figure's CAST FLOOR SHADOW as definite background:
    rect-init GrabCut keeps the shadow (it differs from the modelled backdrop — on the
    east clip the floor is lum ~26 and the shadow ~3-13, so it reads as 'figure'), and
    it ships as an OPAQUE dark smudge trailing the feet. Seed = neutral (channel spread
    <=14), clearly darker than the border-median backdrop, and in the bottom band of the
    figure rect.

    BOOT PROTECTION (2026-06-10): v1 seeded the whole bottom QUARTER and keyed only on
    `lum < bg_med-10` (~lum<16 on the east clip) — but the knight's dark leather/steel
    BOOTS dip below that, so GrabCut ate the front shoe (Josh's report). Fix: an ABSOLUTE
    darkness ceiling `shadow_lum` (default 16; the cast shadow is lum 3-13, boots are
    brighter) AND a narrower bottom band `shadow_band` (default 0.80 → only the bottom
    20%, where the floor shadow lives, not the boot uppers). Both are CLI-tunable
    (`--shadow-lum` / `--shadow-band`) so a clip whose boots are darker can raise the
    ceiling / lower the band without a code edit. Interior recesses survive via
    fill_holes; QA the boots on the magenta contact sheet every time."""
    arr = np.asarray(rgba)
    rgb = arr[:, :, :3]
    img = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    H, W = img.shape[:2]
    a = rgb.astype(int)
    spread = a.max(2) - a.min(2)
    lum = a.max(2)
    # seed rect from a generous "definitely not flat-neutral-bg" bbox
    notbg = ndi.binary_opening((lum > 45) | (spread > 12), iterations=2)
    ys, xs = np.where(notbg)
    if len(xs) == 0:
        raise RuntimeError("empty frame — no figure found")
    x0, y0 = max(0, xs.min() - pad), max(0, ys.min() - pad)
    rect = (x0, y0, min(W, xs.max() + pad) - x0, min(H, ys.max() + pad) - y0)
    mask = np.zeros((H, W), np.uint8)
    bgm = np.zeros((1, 65), np.float64)
    fgm = np.zeros((1, 65), np.float64)
    if shadow_bg:
        lum_mean = a.mean(2)
        border = np.concatenate([lum_mean[0], lum_mean[-1], lum_mean[:, 0], lum_mean[:, -1]])
        bg_med = float(np.median(border))
        yy = np.arange(H)[:, None]
        # neutral + clearly-darker-than-bg + below an ABSOLUTE ceiling (protects boots) + bottom band
        shadow = ((spread <= 14) & (lum_mean < bg_med - 10) & (lum_mean < shadow_lum)
                  & (yy > rect[1] + shadow_band * rect[3]))
        mask[:] = cv2.GC_PR_BGD
        mask[rect[1]:rect[1] + rect[3], rect[0]:rect[0] + rect[2]] = cv2.GC_PR_FGD
        mask[shadow] = cv2.GC_BGD
        cv2.grabCut(img, mask, None, bgm, fgm, iters, cv2.GC_INIT_WITH_MASK)
    else:
        cv2.grabCut(img, mask, rect, bgm, fgm, iters, cv2.GC_INIT_WITH_RECT)
    fig = ndi.binary_fill_holes((mask == 1) | (mask == 3))
    lab, n = ndi.label(fig)
    if n > 1:  # keep the largest component (drop stray bg-coloured islands)
        sizes = ndi.sum(np.ones_like(lab), lab, range(1, n + 1))
        fig = lab == (int(np.argmax(sizes)) + 1)
    if erode:
        fig = ndi.binary_erosion(fig, iterations=erode)
    out = arr.copy()
    out[:, :, 3] = np.where(fig, 255, 0).astype("uint8")
    return Image.fromarray(out), fig


def body_metrics(fig):
    """cx (torso-centred x), feet_y (bottom), body_top (excl. thin sword), body_h."""
    rows = fig.sum(1)
    maxw = rows.max()
    body_rows = np.where(rows > 0.15 * maxw)[0]   # rows wide enough to be body, not the thin blade
    bot = int(np.where(rows > 0)[0].max())
    body_top = int(body_rows.min())
    h = bot - body_top
    ys, xs = np.where(fig)
    band = (ys > body_top + 0.30 * h) & (ys < body_top + 0.62 * h)  # stable torso band
    cx = int(xs[band].mean()) if band.any() else int(xs.mean())
    return cx, bot, body_top, (bot - body_top)


def register(cut, met, scale, size, feet_y):
    cx, bot, _, _ = met
    bb = cut.getbbox()
    crop = cut.crop(bb)
    ax = (cx - bb[0]) * scale
    afeet = (bot - bb[1]) * scale
    crop = crop.resize((max(1, int(crop.width * scale)), max(1, int(crop.height * scale))), Image.LANCZOS)
    cv = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cv.alpha_composite(crop, (int(size // 2 - ax), int(feet_y - afeet)))
    return cv


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src", help="mp4 path OR a directory of extracted fNNN.png frames")
    ap.add_argument("id", help="sprite id, e.g. 'player'")
    ap.add_argument("dir", help="octant: n s e w ne nw se sw")
    ap.add_argument("--frames", required=True, help="comma list of frame indices, all within ONE gait cycle")
    ap.add_argument("--size", type=int, default=192, help="output square px (south set is 192)")
    ap.add_argument("--feet", type=int, default=None, help="feet ground-line y in the canvas (default size-1, i.e. the very bottom — matches the idle/south-walk sheets)")
    ap.add_argument("--match-bodyh", type=int, default=None,
                    help="match the on-screen body to the IDLE sheet: scale all frames uniformly so the TALLEST "
                         "frame's body (helmet->feet, excl. sword) equals this px height, then feet-anchor. "
                         "Use the idle player-<dir>.png bodyH (~180 for the 192 sheets) so idle<->walk doesn't pop. "
                         "Omit for a standalone walk not matched to an idle sheet.")
    ap.add_argument("--mirror", default=None, help="also emit horizontally-flipped set for this opposite octant")
    ap.add_argument("--shadow-bg", action="store_true",
                    help="seed the cast floor shadow as definite bg (clips where the shadow is "
                         "darker than the backdrop and ships as an opaque smudge at the feet)")
    ap.add_argument("--shadow-lum", type=int, default=16,
                    help="absolute lum ceiling for the shadow seed (default 16; raise if boots get "
                         "eaten, lower if the shadow survives). Boots brighter than this are protected.")
    ap.add_argument("--shadow-band", type=float, default=0.80,
                    help="only seed shadow below this fraction of the figure rect (default 0.80 = "
                         "bottom 20%%; raise toward 0.9 to spare the boot uppers)")
    ap.add_argument("--qa-dir", default=None)
    ap.add_argument("--assets", action="store_true", help="also copy finals into assets/char/")
    args = ap.parse_args()

    _lazy_imports()
    sel = [int(x) for x in args.frames.split(",")]
    feet_y = args.feet if args.feet is not None else args.size - 1
    qa = args.qa_dir or os.path.join("art", "player", "_walkqa", f"{args.id}-{args.dir}")
    if os.path.isdir(qa):
        shutil.rmtree(qa)
    os.makedirs(qa, exist_ok=True)

    cuts, mets = [], []
    for i in sel:
        cut, fig = grabcut_cut(load_frame(args.src, i), shadow_bg=args.shadow_bg,
                               shadow_lum=args.shadow_lum, shadow_band=args.shadow_band)
        cuts.append(cut)
        mets.append(body_metrics(fig))
        cut.crop(cut.getbbox()).save(os.path.join(qa, f"_fullres_f{i}.png"))

    # ONE uniform scale, feet-anchored — preserves the natural gait bob (contact pose taller than
    # passing pose), exactly like the shipped south-walk set. Per-frame normalisation would flatten it.
    ref_h = max(m[3] for m in mets)         # tallest frame ~= standing/idle stance
    target = args.match_bodyh if args.match_bodyh else (feet_y - int(args.size * 0.07))
    scale = target / ref_h
    outs = [register(c, m, scale, args.size, feet_y) for c, m in zip(cuts, mets)]

    def write_set(frames, dirn):
        paths = []
        for k, fr in enumerate(frames, 1):
            p = os.path.join(qa, f"{args.id}walk{k}-{dirn}.png")
            fr.save(p)
            paths.append(p)
        return paths

    paths = write_set(outs, args.dir)
    mir_paths = []
    if args.mirror:
        from PIL import ImageOps
        mir_paths = write_set([ImageOps.mirror(o) for o in outs], args.mirror)

    # magenta QA contact sheet
    S = args.size
    mag = Image.new("RGB", (S * len(outs), S + 22), (255, 0, 255))
    d = ImageDraw.Draw(mag)
    for k, fr in enumerate(outs):
        cell = Image.new("RGB", (S, S), (255, 0, 255))
        cell.paste(fr, (0, 0), fr)
        mag.paste(cell, (k * S, 22))
        d.text((k * S + 4, 5), f"{args.dir} {k+1}", fill=(0, 0, 0))
    mag.save(os.path.join(qa, "_magenta-contact.png"))

    # preview gifs (dark bg) at 8fps (1x) and 10fps (2x nearest)
    def gif(path, fps, sc):
        fs = []
        for o in outs:
            bg = Image.new("RGB", (S, S), (34, 34, 38))
            bg.paste(o, (0, 0), o)
            if sc != 1:
                bg = bg.resize((S * sc, S * sc), Image.NEAREST)
            fs.append(bg)
        fs[0].save(path, save_all=True, append_images=fs[1:], duration=int(1000 / fps), loop=0, disposal=2)
    gif(os.path.join(qa, "_preview.gif"), 8, 1)
    gif(os.path.join(qa, "_preview_2x.gif"), 10, 2)

    # paste-ready manifest snippet (engineer wires; matches existing playerwalk<n>-<dir> naming)
    with open(os.path.join(qa, "manifest-snippet.txt"), "w") as f:
        # key convention matches the shipped set: char.<id>walk<N>.<dir> -> assets/char/<id>walk<N>-<dir>.png
        f.write(f"// {args.id} walk — {args.dir} (frames {sel})\n")
        for k in range(1, len(outs) + 1):
            f.write(f"'char.{args.id}walk{k}.{args.dir}':'assets/char/{args.id}walk{k}-{args.dir}.png',\n")
        if args.mirror:
            f.write(f"// mirrored -> {args.mirror}\n")
            for k in range(1, len(outs) + 1):
                f.write(f"'char.{args.id}walk{k}.{args.mirror}':'assets/char/{args.id}walk{k}-{args.mirror}.png',\n")

    if args.assets:
        os.makedirs(os.path.join("assets", "char"), exist_ok=True)
        for p in paths + mir_paths:
            shutil.copy(p, os.path.join("assets", "char", os.path.basename(p)))

    print(f"OK  {args.dir}: {len(outs)} frames -> {qa}")
    if mir_paths:
        print(f"    mirror {args.mirror}: {len(mir_paths)} frames")
    print(f"    QA: _magenta-contact.png  _preview_2x.gif")


if __name__ == "__main__":
    main()
