#!/usr/bin/env python3
"""Particle-system FX: spawn HUNDREDS of small sliced sprites whose swarm motion
forms a larger skill effect, render the timeline to a looping GIF.

This is the real particle approach (vs fx-gif-compose.py, which animates one big
sprite per layer). Here each sliced FX cutout is a tiny INSTANCE; an emitter
spawns many of them, each with its own birth time, angle, radial/spin velocity,
scale, lifetime and opacity curve. The big effect (an expanding fire spiral, a
nova, a vortex) is emergent from the swarm — exactly like an engine particle FX.

Rendering matches the in-game FX path: every instance is composited ADDITIVELY
over BLACK (ImageChops.lighter == the engine's globalCompositeOperation='lighter'
that drops black and makes FX glow), so the black-bg GIF is what the swarm looks
like over the dark dungeon.

Run:  python tools/fx-particle-sim.py                 # all emitters
      python tools/fx-particle-sim.py dragon_spiral   # one
Out:  art/fx/_particles/_gifs/<name>.gif
"""
import os, sys, math, random
from PIL import Image, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDIR = os.path.join(ROOT, 'art', 'fx', '_particles')
OUT = os.path.join(PDIR, '_gifs')

_src = {}
def src(setname, n):
    k = (setname, n)
    if k not in _src:
        _src[k] = Image.open(os.path.join(PDIR, setname, f'{setname}-{n}.png')).convert('RGBA')
    return _src[k]

# cache scaled+rotated instances — hundreds of particles x dozens of frames would
# otherwise re-resize the same sprite thousands of times. Quantise size & angle.
_xf = {}
def xform(setname, n, px, deg, op):
    qpx = max(4, int(round(px / 2) * 2))           # nearest 2px
    qdeg = int(round(deg / 12) * 12) % 360          # nearest 12 deg
    qop = round(op, 2)
    k = (setname, n, qpx, qdeg, qop)
    s = _xf.get(k)
    if s is None:
        base = src(setname, n)
        s = base.resize((qpx, qpx), Image.LANCZOS)
        if qdeg:
            s = s.rotate(-qdeg, expand=True, resample=Image.BICUBIC)
        if qop < 1:
            a = s.split()[3].point(lambda v: int(v * qop))
            s = s.copy(); s.putalpha(a)
        _xf[k] = s
    return s


def ease_out(u):                 # decelerating expansion
    return 1 - (1 - u) ** 2


class P:
    """One particle instance."""
    __slots__ = ('set', 'n', 'birth', 'life', 'a0', 'spin', 'r0', 'rmax',
                 'sz0', 'sz1', 'wob', 'wobf')


def render(particles, frames, size, fps, name, bg=(0, 0, 0)):
    os.makedirs(OUT, exist_ok=True)
    cx = cy = size / 2
    imgs = []
    for f in range(frames):
        canvas = Image.new('RGBA', (size, size), bg + (255,))
        acc = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        for p in particles:
            age = f - p.birth
            if age < 0 or age > p.life:
                continue
            u = age / p.life                       # 0..1 over this particle's life
            # opacity: quick fade-in, long fade-out
            op = min(1.0, u / 0.12) * (1 - u) ** 0.8
            if op <= 0.02:
                continue
            r = p.r0 + (p.rmax - p.r0) * ease_out(u)
            ang = p.a0 + p.spin * u
            # small per-particle wobble across the arm for organic spread
            ang += p.wob * math.sin(u * p.wobf)
            ar = math.radians(ang)
            x = cx + math.cos(ar) * r
            y = cy + math.sin(ar) * r
            sz = p.sz0 + (p.sz1 - p.sz0) * u
            spr = xform(p.set, p.n, sz, ang * 0.7 + u * 180, op)  # sprite also spins
            acc.alpha_composite(spr, (int(x - spr.width / 2), int(y - spr.height / 2)))
        flat = Image.new('RGB', (size, size), (0, 0, 0))
        flat.paste(acc, (0, 0), acc)
        canvas = ImageChops.lighter(canvas, flat.convert('RGBA'))
        imgs.append(canvas.convert('RGB'))
    dur = int(1000 / fps)
    path = os.path.join(OUT, f'{name}.gif')
    imgs[0].save(path, save_all=True, append_images=imgs[1:], duration=dur,
                 loop=0, disposal=2, optimize=True)
    kb = os.path.getsize(path) / 1024
    print(f'  {name:18s} {len(particles)} particles  {frames}f@{fps}  {size}px  {kb:.0f}KB  -> {path}')


def dragon_spiral(size=340, frames=44, fps=24):
    """~220 dragonfire sprites — mostly the swirl, a smattering of others —
    emanate from the player in an expanding, rotating spiral."""
    rnd = random.Random(7)
    SWIRL = 2                                # dragonfire-2 = rainbow spiral
    OTHERS = [0, 1, 3, 4, 5, 7, 8]           # flames / comets / mound
    ARMS = 2
    EMIT_FRAMES = 34                         # emit continuously, then let the arms fly out
    PER_FRAME = 9                            # ~300 particles total
    EMITTER_SPIN = 26.0                      # deg the birth angle advances per frame -> the spiral wind
    parts = []
    for bf in range(EMIT_FRAMES):
        for _ in range(PER_FRAME):
            p = P()
            swirl = rnd.random() < 0.74
            p.set = 'dragonfire'
            p.n = SWIRL if swirl else rnd.choice(OTHERS)
            arm = rnd.randrange(ARMS)
            p.birth = bf
            p.life = rnd.uniform(22, 27)                            # tight life -> coherent arm
            p.a0 = bf * EMITTER_SPIN + arm * (360 / ARMS) + rnd.uniform(-4, 4)
            p.spin = rnd.uniform(22, 40)                            # one direction -> arm winds, not blurs
            p.r0 = rnd.uniform(3, 9)
            p.rmax = rnd.uniform(138, 152)                          # tight radius -> sharp arm edge
            base = rnd.uniform(26, 44) if swirl else rnd.uniform(18, 32)
            p.sz0 = base
            p.sz1 = base * rnd.uniform(0.5, 0.8)                    # shrink as it dies
            p.wob = rnd.uniform(0, 3)
            p.wobf = rnd.uniform(2, 5)
            parts.append(p)
    render(parts, frames, size, fps, 'dragon_spiral')


EMITTERS = {'dragon_spiral': dragon_spiral}


def main():
    want = sys.argv[1:] or list(EMITTERS)
    for nm in want:
        if nm in EMITTERS:
            EMITTERS[nm]()
        else:
            print(f'  ?? unknown emitter {nm!r} (have: {", ".join(EMITTERS)})')


if __name__ == '__main__':
    main()
