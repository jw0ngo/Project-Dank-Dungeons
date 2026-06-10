#!/usr/bin/env python3
"""Compose sliced FX particle PNGs into animated skill-effect GIFs.

Phase-2 prototyping tool for the FX particle workflow: takes the transparent
cutouts produced by slice-variants.py (--keyspace fx) and animates them —
scale / rotate / translate / fade / spawn-many over a timeline — into a looping
GIF that previews an in-game skill effect.

Rendering matches the in-game FX path: particles are composited ADDITIVELY over
BLACK (ImageChops.lighter), the same as the engine's globalCompositeOperation=
'lighter' that drops black and makes FX glow. So a black-bg GIF here is what the
effect looks like over the dark dungeon — and GIF's 1-bit alpha is a non-issue
because nothing relies on soft transparency; the black just composites out.

An effect is a list of LAYERS; each layer is one particle animated by keyframes.
A keyframe is (t, dict) with t in [0,1] over the effect's duration; between
keyframes every channel (x, y, scale, rot, op) lerps. `n`/`spread` on a layer
fan it into N copies (a burst). Channels:
  x,y    px offset from canvas centre (y+ = down)
  scale  multiply particle's native size
  rot    degrees (clockwise)
  op     0..1 opacity (multiplies the particle alpha)

Run:  python tools/fx-gif-compose.py            # render all demo effects
      python tools/fx-gif-compose.py fire_nova  # render one by name
Out:  art/fx/_particles/_gifs/<name>.gif
"""
import os, sys, math
from PIL import Image, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDIR = os.path.join(ROOT, 'art', 'fx', '_particles')
OUT = os.path.join(PDIR, '_gifs')

_cache = {}
def particle(setname, n):
    key = (setname, n)
    if key not in _cache:
        p = os.path.join(PDIR, setname, f'{setname}-{n}.png')
        _cache[key] = Image.open(p).convert('RGBA')
    return _cache[key]


def _lerp(a, b, u):
    return a + (b - a) * u


def _sample(keys, t):
    """Linear-interpolate every channel of a keyframe list at time t in [0,1]."""
    if t <= keys[0][0]:
        return dict(keys[0][1])
    if t >= keys[-1][0]:
        return dict(keys[-1][1])
    for i in range(len(keys) - 1):
        t0, k0 = keys[i]
        t1, k1 = keys[i + 1]
        if t0 <= t <= t1:
            u = 0 if t1 == t0 else (t - t0) / (t1 - t0)
            return {ch: _lerp(k0.get(ch, k1.get(ch, 0)),
                              k1.get(ch, k0.get(ch, 0)), u)
                    for ch in set(k0) | set(k1)}
    return dict(keys[-1][1])


def _place(canvas, part, x, y, scale, rot, op):
    if scale <= 0 or op <= 0:
        return canvas
    w = max(1, int(part.width * scale))
    h = max(1, int(part.height * scale))
    spr = part.resize((w, h), Image.LANCZOS)
    if rot:
        spr = spr.rotate(-rot, expand=True, resample=Image.BICUBIC)
    if op < 1:
        a = spr.split()[3].point(lambda v: int(v * op))
        spr.putalpha(a)
    # additive over black: flatten the layer on black, then lighter-blend
    layer = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    cx = int(canvas.width / 2 + x - spr.width / 2)
    cy = int(canvas.height / 2 + y - spr.height / 2)
    layer.alpha_composite(spr, (cx, cy))
    flat = Image.new('RGB', canvas.size, (0, 0, 0))
    flat.paste(layer, (0, 0), layer)
    return ImageChops.lighter(canvas, flat.convert('RGBA'))


def render(effect, size=256, frames=24, fps=20, name='effect'):
    os.makedirs(OUT, exist_ok=True)
    imgs = []
    for f in range(frames):
        t = f / (frames - 1) if frames > 1 else 0
        canvas = Image.new('RGBA', (size, size), (0, 0, 0, 255))
        for layer in effect:
            setname, idx = layer['p']
            part = particle(setname, idx)
            copies = layer.get('n', 1)
            for c in range(copies):
                s = _sample(layer['keys'], t)
                ang = layer.get('spread', 0) * (c / max(1, copies - 1) - 0.5) if copies > 1 else 0
                # 'fan' spreads copies by rotating their (x,y) offset around centre
                if copies > 1 and layer.get('fan'):
                    base = math.radians(ang) + math.radians(s.get('rot', 0))
                    r = math.hypot(s.get('x', 0), s.get('y', 0))
                    px = math.sin(base) * r
                    py = -math.cos(base) * r
                else:
                    px, py = s.get('x', 0), s.get('y', 0)
                canvas = _place(canvas, part, px, py, s.get('scale', 1),
                                s.get('rot', 0) + (ang if not layer.get('fan') else 0),
                                s.get('op', 1))
        imgs.append(canvas.convert('RGB'))
    dur = int(1000 / fps)
    path = os.path.join(OUT, f'{name}.gif')
    imgs[0].save(path, save_all=True, append_images=imgs[1:], duration=dur,
                 loop=0, disposal=2, optimize=True)
    kb = os.path.getsize(path) / 1024
    print(f'  {name:16s} {frames}f @ {fps}fps  {size}px  {kb:.0f}KB  -> {path}')


# ---- demo effects ---------------------------------------------------------
# Each shows a different compositing technique on a different particle set.

EFFECTS = {
    # FIRE NOVA — single spiky burst pops in big, flashes, fades. Classic AOE blast.
    'fire_nova': [
        {'p': ('explosion', 1), 'keys': [
            (0.0, {'scale': 0.25, 'op': 0.0, 'rot': -20}),
            (0.18, {'scale': 1.15, 'op': 1.0, 'rot': 0}),
            (0.45, {'scale': 1.3, 'op': 1.0, 'rot': 8}),
            (1.0, {'scale': 1.45, 'op': 0.0, 'rot': 16})]},
        # inner hot core (round cloud) lagging slightly for depth
        {'p': ('explosion', 0), 'keys': [
            (0.0, {'scale': 0.15, 'op': 0.0}),
            (0.22, {'scale': 0.7, 'op': 0.9}),
            (1.0, {'scale': 1.0, 'op': 0.0})]},
    ],

    # FROST ERUPTION — ice spikes burst upward out of the ground and settle/fade.
    'frost_eruption': [
        {'p': ('frost', 0), 'keys': [
            (0.0, {'scale': 0.4, 'y': 40, 'op': 0.0}),
            (0.2, {'scale': 1.05, 'y': 0, 'op': 1.0}),
            (0.6, {'scale': 1.05, 'y': 0, 'op': 1.0}),
            (1.0, {'scale': 1.1, 'y': -6, 'op': 0.0})]},
        # a quick crystal flash (frost-5) at the base
        {'p': ('frost', 5), 'keys': [
            (0.0, {'scale': 0.3, 'y': 30, 'op': 0.0}),
            (0.15, {'scale': 0.85, 'y': 24, 'op': 0.8}),
            (0.5, {'scale': 0.9, 'y': 24, 'op': 0.0})]},
    ],

    # CHAOS VORTEX — dark-red spiral spins continuously (seamless loop) + pulses. Channeled.
    'chaos_vortex': [
        {'p': ('chaosfire', 8), 'keys': [
            (0.0, {'scale': 1.0, 'rot': 0, 'op': 0.95}),
            (0.5, {'scale': 1.12, 'rot': 180, 'op': 1.0}),
            (1.0, {'scale': 1.0, 'rot': 360, 'op': 0.95})]},
    ],

    # DRAGON SPIRAL — rainbow spiral winds up, spins, blows out. Flashy ultimate.
    'dragon_spiral': [
        {'p': ('dragonfire', 2), 'keys': [
            (0.0, {'scale': 0.2, 'rot': -60, 'op': 0.0}),
            (0.25, {'scale': 1.0, 'rot': 60, 'op': 1.0}),
            (0.7, {'scale': 1.25, 'rot': 220, 'op': 1.0}),
            (1.0, {'scale': 1.7, 'rot': 340, 'op': 0.0})]},
    ],

    # FIRE FAN — five flame jets fanned outward in a cone burst (spawn-many demo).
    'fire_fan': [
        {'p': ('explosion', 8), 'n': 5, 'fan': True, 'spread': 90,
         'keys': [
            (0.0, {'scale': 0.3, 'x': 0, 'y': -10, 'op': 0.0}),
            (0.25, {'scale': 0.85, 'x': 0, 'y': -70, 'op': 1.0}),
            (1.0, {'scale': 1.0, 'x': 0, 'y': -95, 'op': 0.0})]},
    ],
}


def main():
    want = sys.argv[1:] or list(EFFECTS)
    for name in want:
        if name not in EFFECTS:
            print(f'  ?? unknown effect {name!r} (have: {", ".join(EFFECTS)})')
            continue
        render(EFFECTS[name], name=name)


if __name__ == '__main__':
    main()
