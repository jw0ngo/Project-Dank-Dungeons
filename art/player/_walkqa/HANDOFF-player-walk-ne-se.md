# Art handoff → Engineer: player walk cycles, NE + SE

**From:** Artist  **Date:** 2026-06-10
**Status:** assets placed in `assets/char/`, awaiting wiring + in-game review.

Adds back-facing **NE** and front-facing **SE** 4-frame walk cycles to the player. This plugs
into the **existing** walk system (`PLAYER_WALK_OCT` + `char.playerwalk<N>.<dir>` + `p.walkFrame`)
— it is *not* a new system. N/S/E already ship; this fills two more of the eight facings.

## 1. Assets (already in `assets/char/`, ~30–33 KB each, ~250 KB total)
```
playerwalk1-ne.png  playerwalk2-ne.png  playerwalk3-ne.png  playerwalk4-ne.png
playerwalk1-se.png  playerwalk2-se.png  playerwalk3-se.png  playerwalk4-se.png
```
192×192 RGBA, transparent, GrabCut-cut from `art/player/Animator Dump/{northeast,southeast} walk.mp4`.
Sliced **to the idle scale + feet baseline** (bodyH ≈180, feet ≈ y191) so idle↔walk does **not** pop.
Frame order is one gait cycle: 1=contact (foot A fwd) · 2=passing · 3=contact (foot B fwd) · 4=passing.

## 2. `ART_MANIFEST` — paste-ready (note the key form: `char.playerwalk<N>.<dir>`)
```js
'char.playerwalk1.ne':'assets/char/playerwalk1-ne.png',
'char.playerwalk2.ne':'assets/char/playerwalk2-ne.png',
'char.playerwalk3.ne':'assets/char/playerwalk3-ne.png',
'char.playerwalk4.ne':'assets/char/playerwalk4-ne.png',
'char.playerwalk1.se':'assets/char/playerwalk1-se.png',
'char.playerwalk2.se':'assets/char/playerwalk2-se.png',
'char.playerwalk3.se':'assets/char/playerwalk3-se.png',
'char.playerwalk4.se':'assets/char/playerwalk4-se.png',
```

## 3. The one code change — extend the walk-octant allowlist
The walk swap is gated by `PLAYER_WALK_OCT` (line ~6971). Without this edit the new art loads but
never draws. `_DIR8 = ['e','se','s','sw','w','nw','n','ne']` → **se = oct 1, ne = oct 7**.
```js
// before
const PLAYER_WALK_OCT = {0:'e', 2:'s', 6:'n'};
// after
const PLAYER_WALK_OCT = {0:'e', 1:'se', 2:'s', 6:'n', 7:'ne'};
```
Nothing else needed: `gDirBody`/the draw path already build `char.playerwalk<frame+1>.<dir>` for any
octant, and the walk branch already passes `by=0` (line ~7180) so the idle bob stays suppressed.

## 4. Scale / hitbox coupling — none
Drawn at `PSCALE` like idle (no `HEAVY_DRAW_MULT`-style multiplier). Because the frames are matched
to the idle body size + feet line, **no scale constant, hitbox `radius`, or attack-radius change is
required.** (No HP-bar impact either.)

## 5. Verify (engineer)
1. `node --check` the extracted `<script>` (a stray quote in a manifest path entry breaks the file).
2. grep the 8 new keys are present **and** each file exists at its path (a typo'd path 404s → silent
   fallback to the procedural/idle sprite, which `node --check` won't catch).
3. `python dev.py`, walk **NE** and **SE**: all 4 frames cycle, body does **not** pop in size or lift
   off the ground vs idle, sword stays shouldered, facing reads correct (NE = back/no-visor,
   SE = front/visor).

## 6. NW + SW mirrors (added after NE/SE approved in-game)
NE/SE looked good in-game, so the opposite facings are now shipped too — **horizontal flips of the
approved NE/SE frames** (NW = mirror of NE, SW = mirror of SE), so they're idle-matched/registered by
construction. Mirroring is valid for this knight (sword shoulder reads correct; ground-truthed in
`art/player/_mirror-QA/`).

Assets in `assets/char/`: `playerwalk{1..4}-nw.png`, `playerwalk{1..4}-sw.png`.

Add to `ART_MANIFEST`:
```js
'char.playerwalk1.nw':'assets/char/playerwalk1-nw.png',
'char.playerwalk2.nw':'assets/char/playerwalk2-nw.png',
'char.playerwalk3.nw':'assets/char/playerwalk3-nw.png',
'char.playerwalk4.nw':'assets/char/playerwalk4-nw.png',
'char.playerwalk1.sw':'assets/char/playerwalk1-sw.png',
'char.playerwalk2.sw':'assets/char/playerwalk2-sw.png',
'char.playerwalk3.sw':'assets/char/playerwalk3-sw.png',
'char.playerwalk4.sw':'assets/char/playerwalk4-sw.png',
```
And extend the gate (**sw = oct 3, nw = oct 5**). With NE/SE + these, the full map is:
```js
const PLAYER_WALK_OCT = {0:'e', 1:'se', 2:'s', 3:'sw', 5:'nw', 6:'n', 7:'ne'};  // all but w(4)
```
Same verification as §5, for NW and SW.

## Remaining
**E/W** profile walks are the only facings left ungenerated (the procedural/idle sprite covers W=oct4
until then). QA artifacts: `art/player/_walkqa/player-{ne,se,nw,sw}/`.
