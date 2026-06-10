#!/usr/bin/env python3
"""Scale-aware particle FX mapped to To Dust's implemented skills (Cilia's Fire).

Each skill is a particle EMITTER built from the sliced FX cutouts (art/fx/_particles/).
The big effect is emergent from a swarm of small sprite instances — and crucially it
is SCALE-AWARE: an emitter takes `scale`, and a bigger cast spawns MORE particles
(count grows with area) at roughly constant individual size, instead of bitmap-
upscaling a fixed image (which goes fat + sparse). That keeps density and crispness
constant as a skill's reach/area grows with rank.

Geometry is path-based: every particle lerps from a start offset to an end offset
(eased) about the cast origin, so cone / ring / line / cross / ball all fall out of
the same core. Rendering matches the in-game FX path: additive over BLACK
(ImageChops.lighter == globalCompositeOperation='lighter'), so the black-bg GIF is
the over-dungeon look and GIF's 1-bit alpha is a non-issue.

Run:  python tools/fx-skill-fx.py                  # all skills @ base scale + scaling demos
      python tools/fx-skill-fx.py fire_wave         # one skill, base scale
      python tools/fx-skill-fx.py fire_ring 1.6     # one skill at a given scale
Out:  art/fx/_particles/_gifs/skill_<name>[_s<scale>].gif
"""
import os, sys, math, random
from PIL import Image, ImageChops, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDIR = os.path.join(ROOT, 'art', 'fx', '_particles')
OUT = os.path.join(PDIR, '_gifs')

_src, _xf = {}, {}
def src(setname, n):
    k = (setname, n)
    if k not in _src:
        _src[k] = Image.open(os.path.join(PDIR, setname, f'{setname}-{n}.png')).convert('RGBA')
    return _src[k]

def xform(setname, n, px, deg, op):
    qpx = max(4, int(round(px / 2) * 2)); qdeg = int(round(deg / 15) * 15) % 360; qop = round(op, 2)
    k = (setname, n, qpx, qdeg, qop)
    s = _xf.get(k)
    if s is None:
        s = src(setname, n).resize((qpx, qpx), Image.LANCZOS)
        if qdeg: s = s.rotate(-qdeg, expand=True, resample=Image.BICUBIC)
        if qop < 1:
            s = s.copy(); s.putalpha(s.split()[3].point(lambda v: int(v * qop)))
        _xf[k] = s
    return s

def ease_out(u): return 1 - (1 - u) ** 2


class P:
    __slots__ = ('set', 'n', 'birth', 'life', 'sx', 'sy', 'ex', 'ey', 'bow',
                 'sz0', 'sz1', 'rot', 'rotr', 'fin', 'lick', 'omax')
    def __init__(s, **k):
        for a in s.__slots__: setattr(s, a, k.get(a, 0))


def render(parts, frames, W, H, ox, oy, fps, name, saturate=1.0, bright=1.0):
    os.makedirs(OUT, exist_ok=True)
    imgs = []
    for f in range(frames):
        acc = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        for p in parts:
            age = f - p.birth
            if age < 0 or age > p.life: continue
            u = age / p.life
            fin = p.fin or 0.12
            op = min(1.0, u / fin) * (1 - u) ** 0.85 * (p.omax or 1.0)
            if op <= 0.02: continue
            e = ease_out(u)
            x = p.sx + (p.ex - p.sx) * e
            y = p.sy + (p.ey - p.sy) * e
            if p.bow:                                   # perpendicular bow for arcing paths
                dx, dy = p.ex - p.sx, p.ey - p.sy
                L = math.hypot(dx, dy) or 1
                x += -dy / L * p.bow * math.sin(math.pi * u)
                y += dx / L * p.bow * math.sin(math.pi * u)
            if p.lick:                                  # flames licking upward in place
                y -= p.lick * (0.5 + 0.5 * math.sin(u * 9 + p.sx))
            sz = p.sz0 + (p.sz1 - p.sz0) * u
            spr = xform(p.set, p.n, sz, p.rot + p.rotr * u, op)
            acc.alpha_composite(spr, (int(ox + x - spr.width / 2), int(oy + y - spr.height / 2)))
        flat = Image.new('RGB', (W, H), (0, 0, 0))
        flat.paste(acc, (0, 0), acc)
        if bright != 1.0:                       # lift dim colored wisps out of black (black stays black)
            flat = ImageEnhance.Brightness(flat).enhance(bright)
        if saturate != 1.0:
            flat = ImageEnhance.Color(flat).enhance(saturate)
        imgs.append(flat)
    dur = int(1000 / fps)
    path = os.path.join(OUT, f'{name}.gif')
    imgs[0].save(path, save_all=True, append_images=imgs[1:], duration=dur, loop=0, disposal=2, optimize=True)
    print(f'  {name:26s} {len(parts):4d}p  {frames}f@{fps}  {W}x{H}px  {os.path.getsize(path)/1024:.0f}KB')


# ── helpers ────────────────────────────────────────────────────────────────
def area_count(base, scale, p=1.7):
    """particle count grows with area (scale^~1.7) so density stays constant."""
    return max(8, int(base * scale ** p))

def psize(base, scale):
    """individual particle size grows gently (scale^0.4) — mostly we add count, not size."""
    return base * scale ** 0.4

# Cilia's Fire = orange explosion set. Cell roles (from the sliced contact sheet):
#   vertical flames (tip 'up' -> align +90 to a direction): 2 column, 6 upward jet, 8 tall mound
#   round/radial bursts (free rotation): 0 cloud, 1 star, 4 cloud, 7 wide
#   5 = spiral vortex (turbulence)
FIRE = 'explosion'

def pick(rnd, mix):
    """Weighted-choose a cell from a MIX of (cell, weight, align_deg|None).
    align None -> free rotation; else the sprite is rotated to ride the shape's local direction."""
    cells = [m[0] for m in mix]; wts = [m[1] for m in mix]
    c = rnd.choices(cells, weights=wts, k=1)[0]
    return c, {m[0]: m[2] for m in mix}[c]

# Directional fire mix (flames aligned to a local direction, bursts free) — for ring / wave / cross / pillars.
FIRE_DIR = [(6, 2.6, 90), (8, 2.4, 90), (2, 1.5, 90),
            (1, 1.7, None), (7, 1.5, None), (0, 1.1, None), (4, 1.1, None), (5, 0.8, None)]
# Ground/omni fire mix (no strong direction) — for the dash lane.
FIRE_GND = [(7, 2.4, None), (0, 2.0, None), (4, 1.8, None), (1, 1.6, None),
            (6, 1.2, 90), (8, 1.0, 90), (5, 0.8, None)]


# ── SKILL EMITTERS ───────────────────────────────────────────────────────────
# Each returns (parts, W, H, originX, originY, frames, fps).

def fire_wave(scale=1.0):
    """LMB crescent: a dense leading ARC of fire sweeps outward, tapering behind it.
    Concentration lives on the front arc (the crescent edge) so the shape reads."""
    rnd = random.Random(11)
    R = 150 * scale; half = 0.62 + 0.10 * (scale - 1)      # wide shallow arc = a crescent, not a fountain
    aim = -math.pi / 2                                     # point "up" on canvas
    N = area_count(150, scale, p=1.2)
    parts = []
    for i in range(N):
        a = aim + rnd.uniform(-half, half)
        front = rnd.random() < 0.80                        # most particles ride the leading arc
        if front:
            r1 = R * (1 - 0.16 * rnd.random() ** 1.4); om = 1.0
            sz = psize(rnd.uniform(28, 44), scale)
        else:
            r1 = R * rnd.uniform(0.42, 0.80); om = 0.55     # sparse trailing fill behind the crescent
            sz = psize(rnd.uniform(22, 34), scale)
        cell, al = pick(rnd, FIRE_DIR)
        base = math.degrees(a)                              # flames point radially outward
        rot = (base + al + rnd.uniform(-12, 12)) if al is not None else rnd.uniform(0, 360)
        r0 = rnd.uniform(8, 24) * scale ** 0.4
        parts.append(P(set=FIRE, n=cell, birth=rnd.uniform(0, 6), life=rnd.uniform(15, 22),
                       sx=math.cos(a) * r0, sy=math.sin(a) * r0,
                       ex=math.cos(a) * r1, ey=math.sin(a) * r1,
                       sz0=sz * 0.7, sz1=sz, rot=rot, rotr=rnd.uniform(-25, 25) if al is None else 0,
                       omax=om, fin=0.14))
    M = int(R + 60 * scale ** 0.4)
    return parts, 2 * M, M + 55, M, M + 30, 30, 24, 1.3

def fire_ring(scale=1.0):
    """Whirlwind: a solid, thin expanding 360° ring of fire — flames aligned radially outward."""
    rnd = random.Random(13)
    R = 150 * scale
    N = area_count(180, scale, p=1.05)                     # density ∝ circumference, packed for a solid band
    parts = []
    for i in range(N):
        a = (i / N) * 2 * math.pi + rnd.uniform(-0.045, 0.045)
        r1 = R * rnd.uniform(0.95, 1.02)                   # tight band -> the ring reads as a crisp line
        cell, al = pick(rnd, FIRE_DIR)
        base = math.degrees(a)
        rot = (base + al + rnd.uniform(-12, 12)) if al is not None else rnd.uniform(0, 360)
        sz = psize(rnd.uniform(28, 42), scale)
        parts.append(P(set=FIRE, n=cell, birth=rnd.uniform(0, 5), life=rnd.uniform(18, 24),
                       sx=math.cos(a) * 8, sy=math.sin(a) * 8,
                       ex=math.cos(a) * r1, ey=math.sin(a) * r1,
                       sz0=sz * 0.6, sz1=sz, rot=rot, rotr=rnd.uniform(-15, 15) if al is None else 0))
    M = int(R + 50 * scale ** 0.4)
    return parts, 2 * M, 2 * M, M, M, 30, 24, 1.3

def fire_cross(scale=1.0):
    """Leap: a crisp burning X — thin dense arms + a bright impact hub, flames riding each diagonal."""
    rnd = random.Random(17)
    reach = 110 * scale; armw = 10 * scale ** 0.5          # thin arms so the X stays sharp
    N = area_count(150, scale, p=1.25)
    parts = []
    # bright impact hub at the crossing point
    for _ in range(int(N * 0.18)):
        aa = rnd.uniform(0, 2 * math.pi); rr = rnd.uniform(0, 24) * scale ** 0.4
        cell, al = pick(rnd, FIRE_DIR)
        rot = (math.degrees(aa) + al + rnd.uniform(-15, 15)) if al is not None else rnd.uniform(0, 360)
        sz = psize(rnd.uniform(30, 46), scale)
        parts.append(P(set=FIRE, n=cell, birth=rnd.uniform(0, 6), life=rnd.uniform(22, 32),
                       sx=math.cos(aa) * rr * 0.3, sy=math.sin(aa) * rr * 0.3,
                       ex=math.cos(aa) * rr, ey=math.sin(aa) * rr,
                       sz0=sz * 0.5, sz1=sz, rot=rot, lick=rnd.uniform(3, 8), fin=0.16))
    # the two diagonal arms
    for _ in range(N):
        diag = rnd.choice([1, -1])
        ax, ay = 0.7071 * diag, 0.7071                     # arm unit
        t = rnd.uniform(-1, 1); perp = rnd.uniform(-armw, armw)
        px = ax * t * reach - ay * perp
        py = ay * t * reach + ax * perp
        cell, al = pick(rnd, FIRE_DIR)
        base = math.degrees(math.atan2(ay, ax))            # flames point along the arm
        rot = (base + al + rnd.uniform(-12, 12)) if al is not None else rnd.uniform(0, 360)
        sz = psize(rnd.uniform(24, 38), scale)
        parts.append(P(set=FIRE, n=cell, birth=rnd.uniform(0, 10), life=rnd.uniform(24, 36),
                       sx=px * 0.4, sy=py * 0.4, ex=px, ey=py,
                       sz0=sz * 0.5, sz1=sz, rot=rot, lick=rnd.uniform(3, 9) * scale ** 0.3, fin=0.18))
    M = int(reach + 60 * scale ** 0.4)
    return parts, 2 * M, 2 * M, M, M, 34, 24, 1.3

def fire_trail(scale=1.0):
    """Dash: a solid lane of burning ground — flames packed on the centerline, tapering at the edges."""
    rnd = random.Random(19)
    length = 230 * scale; halfw = 22 * scale ** 0.5
    N = area_count(150, scale, p=1.2)
    parts = []
    for i in range(N):
        t = rnd.random()
        x = (t - 0.5) * length
        yr = rnd.uniform(-1, 1); y = yr * abs(yr) * halfw   # quadratic bias -> dense centerline
        cell, al = pick(rnd, FIRE_GND)
        rot = (-90 + al + rnd.uniform(-20, 20)) if al is not None else rnd.uniform(0, 360)  # flames up
        sz = psize(rnd.uniform(26, 42), scale)
        parts.append(P(set=FIRE, n=cell, birth=t * 12 + rnd.uniform(0, 4), life=rnd.uniform(20, 30),
                       sx=x, sy=y + 6, ex=x, ey=y,
                       sz0=sz * 0.7, sz1=sz * 0.95, rot=rot,
                       omax=1.0 - 0.3 * abs(y) / halfw, lick=rnd.uniform(3, 9), fin=0.2))
    M = int(length / 2 + 50 * scale ** 0.4)
    return parts, 2 * M, int(130 * scale ** 0.5), M, int(65 * scale ** 0.5), 34, 24, 1.3

def fire_pillars(scale=1.0):
    """Heavy: a row of crisp, dense, tall fire pillars erupting in sequence and marching forward."""
    rnd = random.Random(23)
    length = 240 * scale; npil = max(4, int(6 * scale ** 0.6))
    perpil = area_count(26, scale, p=0.9)
    PMIX = [(6, 3.0, 90), (8, 2.8, 90), (2, 1.6, 90), (1, 1.2, None), (7, 1.0, None), (5, 0.6, None)]
    parts = []
    for k in range(npil):
        cx = (k / max(1, npil - 1) - 0.5) * length
        t0 = k * 3                                          # pillars erupt in sequence (marching)
        for _ in range(perpil):
            cell, al = pick(rnd, PMIX)
            h = rnd.random()                                # height fraction up the column
            jx = rnd.uniform(-8, 8) * scale ** 0.4          # narrow column = crisp pillar
            rise = (18 + h * 64) * scale ** 0.4
            sz = psize((38 - 16 * h) * rnd.uniform(0.85, 1.1), scale)   # fat base, tapering top
            rot = (-90 + al + rnd.uniform(-14, 14)) if al is not None else rnd.uniform(0, 360)  # up
            parts.append(P(set=FIRE, n=cell, birth=t0 + rnd.uniform(0, 5), life=rnd.uniform(16, 24),
                           sx=cx + jx, sy=8, ex=cx + jx * 0.5, ey=-rise,
                           sz0=sz * 0.5, sz1=sz, rot=rot,
                           omax=1.0 - 0.35 * h, lick=rnd.uniform(2, 6), fin=0.16))
    M = int(length / 2 + 50 * scale ** 0.4)
    return parts, 2 * M, int(200 * scale ** 0.5), M, int(150 * scale ** 0.5), 32, 24, 1.3

def flame_of_chaos(scale=1.0):
    """Ascension: ONE massive slow chaosfire ball traveling in a single direction (rightward),
    dense solid core + a burning wake shed behind it. (slow & lumbering per the spec.)"""
    rnd = random.Random(29)
    R = 70 * scale; travel = 220 * scale
    frames = 40
    CORE = [(0, 2.2, None), (1, 2.0, None), (2, 1.6, None), (6, 1.4, None), (8, 1.4, None), (7, 1.0, None)]
    WAKE = [(4, 2.0, None), (5, 2.0, None), (7, 1.6, None), (3, 1.2, None), (1, 1.0, None)]
    def cx_at(tt):                                          # ball centre x at global time tt in [0,1]
        return -travel / 2 + travel * tt
    parts = []
    # solid core — every core particle TRACKS the ball over its life, so the orb stays coherent & moves
    # right. Packed dense (high count + centre-biased radius + full opacity) so it reads as a HEAVY orb.
    ncore = area_count(340, scale)
    for _ in range(ncore):
        b = rnd.uniform(0, frames * 0.84); l = rnd.uniform(14, 22)
        tt0 = b / frames; tt1 = min(1.0, (b + l) / frames)
        a = rnd.uniform(0, 2 * math.pi); rr = R * (rnd.random() ** 1.0)   # strong centre bias = solid middle
        ox_, oy_ = math.cos(a) * rr, math.sin(a) * rr
        cell, _ = pick(rnd, CORE)
        sz = psize(rnd.uniform(30, 50) * (1.25 - 0.45 * rr / R), scale)   # fat, overlapping core sprites
        parts.append(P(set='chaosfire', n=cell, birth=b, life=l,
                       sx=cx_at(tt0) + ox_, sy=oy_, ex=cx_at(tt1) + ox_, ey=oy_,
                       sz0=sz * 0.9, sz1=sz, rot=rnd.uniform(0, 360), rotr=rnd.uniform(-30, 30),
                       omax=1.0 - 0.12 * rr / R, lick=rnd.uniform(0, 4)))
    # wake — shed at the ball's position and left BEHIND as it advances (a trail to the left)
    nwake = area_count(70, scale)
    for _ in range(nwake):
        b = rnd.uniform(0, frames * 0.85); l = rnd.uniform(14, 24)
        cstart = cx_at(b / frames)
        a = rnd.uniform(0, 2 * math.pi); rr = R * 0.7 * math.sqrt(rnd.random())
        ox_, oy_ = math.cos(a) * rr, math.sin(a) * rr
        cell, _ = pick(rnd, WAKE)
        sz = psize(rnd.uniform(20, 34), scale)
        parts.append(P(set='chaosfire', n=cell, birth=b, life=l,
                       sx=cstart + ox_, sy=oy_, ex=cstart + ox_ + rnd.uniform(-6, 6), ey=oy_ + rnd.uniform(-4, 4),
                       sz0=sz, sz1=sz * 0.5, rot=rnd.uniform(0, 360), rotr=rnd.uniform(-40, 40),
                       omax=0.55, lick=rnd.uniform(0, 4)))
    M = int(travel / 2 + R + 40 * scale ** 0.4)
    return parts, 2 * M, int(2 * R + 90 * scale ** 0.4), M, int(R + 45 * scale ** 0.4), frames, 24, 1.4


def dragonfire_jets(scale=1.0):
    """Ascension 3rd-hit: three horizontal dragonfire jets blast out in a forward cone,
    base at the player, burst + hold ~0.5s + fade. Built from a MIX of all the dragonfire
    cells — comets as the directional streaks, flames as body, swirl as turbulence — so the
    beam never reads as one tiled sprite."""
    rnd = random.Random(31)
    L = 380 * scale; spread = 0.34; width = 20 * scale ** 0.5   # thin lances so the 3 read separately
    # weighted mix across the 9 dragonfire cells. (cell, weight, +deg-to-align-with-jet)
    #   comets 3/5/7 = directional streaks (carry the beam), flames 0/1/4/8 = body (native 'up' -> +90),
    #   swirl 2 = turbulence, ring 6 dropped (a hole doesn't belong in a jet).
    MIX = [(3, 2.6, 0), (5, 1.4, 25), (7, 1.4, -20),
           (0, 1.4, 90), (1, 1.4, 90), (4, 1.2, 90), (8, 1.2, 90), (2, 1.8, None)]
    cells = [m[0] for m in MIX]; wts = [m[1] for m in MIX]
    align = {m[0]: m[2] for m in MIX}
    parts = []
    for ji, ja in enumerate((-spread, 0.0, spread)):
        ax, ay = math.cos(ja), math.sin(ja)           # jet axis (aim = +x, right)
        px, py = -math.sin(ja), math.cos(ja)          # perpendicular (beam thickness)
        jdeg = math.degrees(ja)
        center = (ji == 1)
        Lj = L * (1.0 if center else 0.82)            # centre jet reaches furthest
        n = area_count(130 if center else 90, scale, p=1.4)
        for _ in range(n):
            cell = rnd.choices(cells, weights=wts, k=1)[0]
            frac = rnd.random() ** 2.1                  # bias HARD toward the base -> solid pillar, wispy tip
            d = Lj * frac
            wob = rnd.uniform(-width, width) * (0.4 + 0.6 * frac)     # tight near base, opens toward tip
            base_sz = rnd.uniform(28, 42) if cell in (3, 5, 7) else rnd.uniform(26, 38)
            sz = psize(base_sz * (1.35 - 0.55 * frac), scale)         # big at base, small at tip
            a = align[cell]
            rot = (jdeg + a + rnd.uniform(-10, 10)) if a is not None else rnd.uniform(0, 360)
            parts.append(P(set='dragonfire', n=cell,
                           birth=frac * 8 + rnd.uniform(0, 14),       # launches from base outward, holds
                           life=rnd.uniform(11, 18),
                           sx=ax * (6 + rnd.uniform(0, 14)) + px * wob * 0.2,
                           sy=ay * (6 + rnd.uniform(0, 14)) + py * wob * 0.2,
                           ex=ax * d + px * wob, ey=ay * d + py * wob,
                           sz0=sz * 0.7, sz1=sz, rot=rot, rotr=rnd.uniform(-12, 12) if a is None else 0,
                           omax=0.98 - 0.42 * frac,                   # solid base, translucent tip (hues blend)
                           fin=0.12))
    maxY = int(math.sin(spread) * L + width + 30 * scale ** 0.4)
    return parts, int(L + 80), 2 * maxY, 50, maxY, 34, 24, 2.1, 1.18   # saturation, brightness (rainbow pop)


SKILLS = {
    'fire_wave': fire_wave, 'fire_ring': fire_ring, 'fire_cross': fire_cross,
    'fire_trail': fire_trail, 'fire_pillars': fire_pillars, 'flame_of_chaos': flame_of_chaos,
    'dragonfire_jets': dragonfire_jets,
}


def run(name, scale, tag=None):
    res = SKILLS[name](scale)
    parts, W, H, ox, oy, frames, fps = res[:7]
    sat = res[7] if len(res) > 7 else 1.0
    brt = res[8] if len(res) > 8 else 1.0
    suffix = '' if tag is None else f'_{tag}'
    render(parts, frames, W, H, ox, oy, fps, f'skill_{name}{suffix}', saturate=sat, bright=brt)


def main():
    args = sys.argv[1:]
    if args and args[0] in SKILLS:
        scale = float(args[1]) if len(args) > 1 else 1.0
        run(args[0], scale, None if scale == 1.0 else f's{scale:g}')
        return
    # default: every skill at base scale, plus a scaling demo on wave + ring
    for nm in SKILLS:
        run(nm, 1.0)
    print('  -- scaling demo (same emitter, density preserved) --')
    for nm in ('fire_wave', 'fire_ring'):
        for sc in (0.6, 1.0, 1.7):
            run(nm, sc, f's{sc:g}')


if __name__ == '__main__':
    main()
