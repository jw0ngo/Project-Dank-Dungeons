# Art handoff → Engineer: player heavy-attack WIND-UP pose sheet

**From:** Artist  **Date:** 2026-06-10
**Status:** 8 cutouts in `assets/char/`, awaiting wiring.

The **charge/anticipation pose** the player holds while winding up a heavy attack — sword drawn back,
body coiled — shown *before* the existing heavy swing (`playerheavy`) releases. The engine already has
the phase boolean `p.heavyWindingUp` (set ~line 3800, cleared when it transitions to `p.heavySwinging`
~line 3816). This is a **visual body swap only** during that phase — no new logic, no hitbox/timer change.

Sliced from `art/player/warrior-heavy-windup.png` (3×3 turnaround, white bg) via
`tools/slice-turnaround.py … --bg white --erode 2 --size 192` — the **exact same flags** as the shipped
dash and (the heavy) attack sheets. All 8 facings QA'd clean against magenta
(`art/player/_windupqa/contact.png`). Facing convention verified: **n = back / no-visor**, **s = front /
visor** — identical to dash/atk/heavy, so it wires identically.

> Note on QA: the slicer printed `bg-leak 660–1030px` per facing and a `CHECK` verdict. That is the
> known **bright-armor over-report** (the knight's silver highlights register as near-white = bg-coloured
> *interior* pixels, not halos). The shipped dash sheet, same flags, printed the same 620–855px and
> shipped CLEAN. The magenta contact is the source of truth and it is clean — no edge halo, no enclosed
> bg pocket.

## 1. Assets (in `assets/char/`, 192×192 RGBA, ~25–32 KB each, ~221 KB total)
```
playerheavywindup-{n,ne,e,se,s,sw,w,nw}.png
```

## 2. `ART_MANIFEST` — paste-ready
```js
'char.playerheavywindup.n':'assets/char/playerheavywindup-n.png',
'char.playerheavywindup.ne':'assets/char/playerheavywindup-ne.png',
'char.playerheavywindup.e':'assets/char/playerheavywindup-e.png',
'char.playerheavywindup.se':'assets/char/playerheavywindup-se.png',
'char.playerheavywindup.s':'assets/char/playerheavywindup-s.png',
'char.playerheavywindup.sw':'assets/char/playerheavywindup-sw.png',
'char.playerheavywindup.w':'assets/char/playerheavywindup-w.png',
'char.playerheavywindup.nw':'assets/char/playerheavywindup-nw.png',
```

## 3. Wiring intent — swap the body during the wind-up phase
In the `_bodyId` ternary (~line 7171), add `playerheavywindup` for `p.heavyWindingUp`, **ahead of**
`heavySwinging`/`swinging` so the charge pose shows during the wind-up and hands off to `playerheavy`
the instant the swing fires:
```js
const _bodyId = _isBow ? 'player'
              : p.heavyWindingUp ? 'playerheavywindup'   // <-- add: coiled charge pose during the wind-up
              : p.heavySwinging  ? 'playerheavy'
              : p.swinging       ? 'playeratk'
              : 'player';
```
`gDirBody('playerheavywindup', _poct, …)` resolves the per-facing key automatically. Because
`heavyWindingUp` already blocks movement (`csm=0` ~line 4020) and the walk-cycle swap only fires when
`_bodyId==='player'` (~line 7183), the charge pose correctly overrides walk/idle with no extra guard.

## 4. Scale / size-coupling — ~~reuse `HEAVY_DRAW_MULT = 1.3`~~ **CORRECTED: `WINDUP_DRAW_MULT = 1.07`**

> **2026-06-10 correction (engineer):** the 1.3 below was WRONG — it made the pose render ~30% too big
> (Josh flagged the pop). It was derived from *bbox/body-fill* parity with the swing, which is the wrong
> metric for a different-silhouette pose. Measured by head/shoulder width (`tools/check-pose-scale.py
> playerheavywindup`, the mean of head+shoulder ratios), the coiled wind-up is already idle-sized in-cell
> → **mult 1.07**, feet-plant **0.14·PSCALE**. Wired as `WINDUP_DRAW_MULT`/`WINDUP_PLANT`. The original
> analysis below is kept for the record but is superseded by the tool. **Do not size poses by body-fill.**


Measured body-fill (`bodyH/canvas`) per facing, against the heavy SWING (which ships at `HEAVY_DRAW_MULT
= 1.3`) and idle:

| facing | windup bodyH/canvas | heavy-SWING bodyH/canvas | idle |
|---|---|---|---|
| n  | 0.750 | 0.812 | 0.958 |
| ne | 0.745 | 0.760 | 0.958 |
| e  | 0.688 | 0.651 | 0.958 |
| se | 0.734 | 0.734 | 0.958 |
| s  | 0.812 | 0.755 | 0.958 |
| sw | 0.734 | 0.734 | 0.958 |
| w  | 0.682 | 0.651 | 0.958 |
| nw | 0.745 | 0.760 | 0.958 |
| **avg** | **0.736** | **0.732** | 0.958 |

**Recommendation: reuse the same `HEAVY_DRAW_MULT = 1.3`.** The wind-up body-fill (avg **0.736**) is
within ~0.5% of the heavy-swing's (avg **0.732**) — they were drawn at the same in-cell body scale. The
swing uses 1.3 to bring its 0.732 fill up to idle-apparent size, so the wind-up needs the **same 1.3** to
(a) match idle, and (b) — the important one — make the **wind-up → swing transition have zero size pop**.
A different value would make the body jump the instant the swing fires. So treat `playerheavywindup` like
`playerheavy` for `_hvMul`:
```js
const _hvMul = (_bodyId==='playerheavy' || _bodyId==='playerheavywindup') ? HEAVY_DRAW_MULT : 1;
```

**One coupling caveat — feet plant height.** The swing sheet is bottom-anchored (feet at feetY≈**0.990**,
canvas bottom); the wind-up's feet sit higher in-cell (feetY avg≈**0.866**, range 0.84–0.91). The current
`_hvYoff = -PSCALE*(mul-1)*0.5` only compensates the upward growth and assumes feet-at-canvas-bottom, so
if the wind-up reuses that path **as-is** its feet float ~24px (of the 192 cell) above ground, then
*drop* the moment the swing's bottom-anchored pose takes over — a small downward pop.

To co-plant them, give the wind-up an extra **downward** nudge of ~`PSCALE * 0.16` on top of `_hvYoff`
(derivation: avg feetY gap 0.123 of the 192 canvas × the 1.3 mult ≈ 0.16·PSCALE). E.g.:
```js
const _wuPlant = (_bodyId==='playerheavywindup') ? PSCALE * 0.16 : 0;  // wind-up feet sit higher in-cell; plant to swing level
gDrawSprite(_spr, p.wx, p.wy - leapH + _hvYoff + _wuPlant, _hvScale, ...);
```
Tune `0.16` on screen — the goal is the **feet don't visibly jump** at the wind-up→swing handoff. (If a
couple px of float reads fine for the brief charge, this nudge is optional; the **1.3 mult is not**.)

- **No hitbox / attack-zone / timer change.** Visual pose swap only — the heavy hitbox, wind-up timer,
  charge ratio, and movement lock are existing `p.heavyWindingUp` logic, untouched by the sprite.

## 5. Verify (engineer)
`node --check` → grep the 8 `char.playerheavywindup.*` keys + confirm the files exist at their paths →
`python dev.py`: hold RMB to charge in several directions — the coiled charge pose shows for the wind-up
duration, faces the aim octant, is the **same body size** as idle and as the swing that follows (no size
pop at release), feet don't jump at the wind-up→swing handoff (apply/tune `_wuPlant` if they do), and it
reverts cleanly afterward.
