# Art handoff → Engineer: player dash pose sheet

**From:** Artist  **Date:** 2026-06-10
**Status:** 8 cutouts in `assets/char/`, awaiting wiring.

A directional **dash pose** for the player — a crouched, sword-ready lunge, one per facing. Wires like
the existing action-pose sheets (`playeratk`/`playerheavy`): a `playerdash` body swapped in while the
player is dashing. Sliced from `art/player/warrior dash.png` (3×3 turnaround, white bg) via
`tools/slice-turnaround.py … --bg white --erode 2 --size 192`. All 8 facings QA'd clean against magenta
(`art/player/_dashqa/_magenta-contact.png`); facing convention verified (n = back/no-visor, s = front/visor).

## 1. Assets (in `assets/char/`, 192×192 RGBA, ~40 KB each, ~326 KB total)
```
playerdash-{n,ne,e,se,s,sw,w,nw}.png
```

## 2. `ART_MANIFEST` — paste-ready
```js
'char.playerdash.n':'assets/char/playerdash-n.png',
'char.playerdash.ne':'assets/char/playerdash-ne.png',
'char.playerdash.e':'assets/char/playerdash-e.png',
'char.playerdash.se':'assets/char/playerdash-se.png',
'char.playerdash.s':'assets/char/playerdash-s.png',
'char.playerdash.sw':'assets/char/playerdash-sw.png',
'char.playerdash.w':'assets/char/playerdash-w.png',
'char.playerdash.nw':'assets/char/playerdash-nw.png',
```

## 3. Wiring intent — swap the body during the dash
Same pattern as `playeratk`/`playerheavy` in the `_bodyId` selection (~line 7151). The dash = the
**evasion/dodge** move (`p.evasionActive`, set in the evasion handler ~line 3591). Suggested:
```js
const _bodyId = _isBow ? 'player'
              : p.evasionActive ? 'playerdash'   // <-- add: crouched dash pose during the dodge
              : p.heavySwinging ? 'playerheavy'
              : p.swinging      ? 'playeratk'
              : 'player';
```
`gDirBody('playerdash', _poct, …)` resolves the per-facing key automatically. Putting `playerdash`
ahead of the walk-cycle swap (the walk branch at ~7163 only fires when `_bodyId==='player'`) means it
correctly overrides the walk while dashing.
- **`p.leapActive`** (the leap, a separate mechanic) is **your call** — the crouched dash pose may suit
  the leap launch too, or the leap may want its own feel. I'd start with evasion only and see.

## 4. Scale / size-coupling — pose swap only, follows the `playeratk` precedent
Draw at `PSCALE` like `playeratk` (square-centred cut). Measured body-fill (bodyH/canvas) is
**0.85–0.92** across facings — between `playeratk` (0.84, shipped with **no** draw-mult) and idle
(0.93). So **no mult is likely needed**; if it reads a touch small next to idle, a
`PLAYERDASH_DRAW_MULT ≈ 1.05` (+ a small upward Y-offset like `_hvYoff` to keep feet planted) matches
idle apparent size — confirm in-game, that's the visual call. Feet sit at 93–96% of canvas (vs idle 99%),
so a few px of Y-offset may help them plant; tune on screen.
- **No hitbox/i-frame/dash-distance change.** This is a *visual pose swap only* — the dash movement,
  i-frames, and cooldown are existing `p.evasionActive` logic, untouched by the sprite.

## 5. Verify (engineer)
`node --check` → grep the 8 keys + confirm files exist → `python dev.py`, dash in several directions:
the crouched pose shows for the dash duration, faces the dash direction, doesn't pop in size/float vs
idle (apply the optional mult/Y-offset if it does), and reverts cleanly to idle/walk after.
