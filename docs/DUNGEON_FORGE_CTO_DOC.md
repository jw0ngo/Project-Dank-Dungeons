# Dungeon Forge — CTO Technical Document
**Session 9 | June 2026**
**Active file:** `/mnt/user-data/outputs/dungeon_forge.html` (~11,752 lines, single-file architecture)
**Companion docs:** `SESSION_JOURNAL.md` · `WORKING_AGREEMENT.md`

---

## Quick Orient (read this first)

Single HTML file. No build step. Vanilla JS + Canvas API. One `<canvas id="gc">` for all game rendering. CSS overlays for UI. Three game modes: `inTown` (The Sanctum hub), `inWilderness` (survival run), or dungeon instance (neither flag set).

To pick up a session: read this doc, skim the last journal entry, then grep the file for the function you need.

---

## Architecture Summary

### Key Globals
```js
let gPlayer, gEnemies=[], gArrows=[], gPlayerArrows=[]
let gDestructibles=[], gTorches=[], gTraps=[], gPotions=[], gBombs=[]
let gXPOrbs=[], gObelisks=[], gVillages=[], gShrine=null
let gShamanFireballs=[], gBombFireZones=[]
let gTiles, gMapW, gMapH, gBlocked
let camX, camY, VW=700, VH=420
let gFrame=0, gLastDt=1, gPaused=false
let inWilderness=false, inTown=false
```

### Tile Constants
```js
TILE_VOID=0, TILE_FLOOR=1, TILE_WALL=2, TILE_EXIT=5
TILE_GRASS=6, TILE_DIRT=7, TILE_TREE=8, TILE_ROCK=9
TILE_SPIKE=10, TILE_HUT=11
```
`gIsWalk`: FLOOR/EXIT/GRASS/DIRT/TREE walkable. WALL/ROCK/SPIKE/HUT solid.
`gTreeSlow`: returns 0.75 inside tree tiles.

### Section Index (§)
- §1 Sprites & SpriteRegistry
- §2 Entity factories
- §3 Hub & Navigation
- §4 Map Editor
- §5 Collision & Pathfinding
- §6 Sword & Whirlwind system
- §6b Bow system
- §7 Player update (gUpdatePlayer)
- §8 Enemy AI (EnemyRegistry dispatch)
- §9 Enemy damage / gCheckEnemyDamage
- §10 Init & gameLoad
- §11 Render pipeline
- §12 Wilderness XP, levelling, threat
- §12b Obelisk system
- §13 Fog of War
- §14 Goblin Village system
- §15 Shrine system

---

## Enemy System

### EnemyRegistry — CRITICAL
```js
const EnemyRegistry = {
  goblin:  { ai: _aiGoblin,  flagProp: null        },
  archer:  { ai: _aiArcher,  flagProp: 'isArcher'  },
  warrior: { ai: _aiWarrior, flagProp: 'isWarrior' },
  bomber:  { ai: _aiBomber,  flagProp: 'isBomber'  },
  shaman:  { ai: _aiShaman,  flagProp: 'isShaman'  },
  king:    { ai: _aiKing,    flagProp: 'isKing'     },
};
```

**The goblin exclusion list** — any enemy type missing from this list runs BOTH goblin AI and its own AI:
```js
if(reg.flagProp ? !e[reg.flagProp] : (e.isArcher||e.isWarrior||e.isBomber||e.isKing||e.isShaman)) continue;
```
**When adding a new enemy: add it here.**

### EntityDefs — all must have `hp` field
| Enemy | HP | Speed | Threat |
|-------|-----|-------|--------|
| Goblin | 30 | 0.193 | 0 |
| Archer | 22 | 0.15 | 2 |
| Bomber | 15 | 0.18 | 4 |
| Warrior | 60 | 0.22 | 6 |
| Shaman | 40 | 0.16 | 8 |
| King | 500 | 0.13 | milestone |

**Missing `hp` = unkillable enemy** (`undefined <= 0` is `false` in JS).

### Hold-Position AI (`isHeld`)
```js
e.isHeld = true;   // hold position, exempt from despawn
e.guardWx = e.wx;  // anchor point (optional — drifts back if set)
e.guardWy = e.wy;
```
- Activates when player enters 7-tile radius OR when hit
- On activation: `isHeld=false` → normal chase AI
- Used by: village enemies, shrine guardians
- **Exempt from 85-tile despawn radius**

---

## Wilderness Mode

### Map Generator (`generateWildernessMap`)
600×300 tiles. Seeded PRNG (Mulberry32). Generation order:
1. Border walls
2. Forest clusters (140–200) + rocky outcrops (40–75)
3. Spawn clear zone
4. Cellular automata smoothing
5. Torches (60)
6. Villages (3–4)
7. Obelisks (20–30)
8. Shrine (1, within 20–100 tiles of spawn)
9. Row string output (R/T/H/S/W/F/D/G chars)

Row chars: `R`=rock, `T`=tree, `H`=hut, `S`=spike, `W`=wall (shrine border), `F`=floor (shrine), `D`=dirt, `G`=grass

### Entities in mapData
| kind | loaded as |
|------|-----------|
| player | gPlayer spawn |
| torch | gTorches[] |
| obelisk | gObelisks[] |
| village | gVillages[] (data object) |
| shrine | gShrine {wx,wy,tx,ty,activated,patron,promptRange} |

### Spawning
- **Horde:** player-centred ring, `visRadius+3` to `+20` tiles, `activated=true` immediately
- **Patrol bands:** 12–30s interval, outside vision, shared velocity, activate on contact
- **Boss milestones:** 10min→1 king, 20min→3 kings, 30min→10 kings
- **Despawn:** 85-tile radius, excludes `isPatrol` and `isHeld` enemies

---

## Goblin Village System (§14)

- 3–4 per map, 100-tile min separation, 40+ tiles from spawn
- Spike fence: broken groups 1–4 tiles, gaps 1–3 tiles (deduplicated perimeter)
- Interior: 85% dirt, 3–5 huts, 2–4 campfires, 1–3 chests
- Enemies: 8–16, `isHeld=true` until player enters 7-tile radius
- `_villageAlert(vill)`: activates all enemies, clears `isHeld`
- `_villageCheckDamageAlert(e)`: called at all hit sites
- Village cleared when all `_enemies` dead → campfires go dark
- Chests auto-loot on 1.5-tile proximity → XP orb burst

---

## Shrine System (§15)

### Placement
- **Wilderness:** 1 per run, 20–100 tiles from spawn. Avoids village overlap.
- **Sanctum:** tile (7, 5) in HUB_MAP
- Diamond of TILE_FLOOR (radius 5 solid) + scatter fringe (prob 80%→0% outward)
- Hash: `((tx*2999)^(ty*6571)) >>> 0` (never use Date.now() in bitwise ops)

### Shrine Object
```js
gShrine = { wx, wy, tx, ty, activated, patron, promptRange: 3*T }
```

### Patron Gods
| God | Element | Colour |
|-----|---------|--------|
| Cilia | Fire | #ff4400 |
| Ikras | Wind | #cc99ff |
| Bhumi | Earth | #44cc44 |
| Boreas | Ice | #44aaff |

God portraits embedded as base64 in shrine overlay HTML. Portrait pulled from shrine card for level-up screen — no double-embedding.

### Shrine Guardians
3 goblins spawned in triangle around shrine. `isHeld=true`, `guardWx/guardWy` set. Aggro within 7 tiles.

### Minimap
- Circular minimap: always visible (not fog-gated), pulsing purple dot
- Full map: purple dot + glow halo + ✦ glyph above

---

## Goblin Shaman

- **Fireball:** 0.72px/f, homing 3°/frame, lifetime 420f, range 220px, 8px radius
- **Burn DoT:** 5 dmg over 3s on fireball hit (`p._burnTimer`, `p._burnDmg`)
- **Buff channel:** 150f (2.5s), +50% maxHP +30% dmg to all allies within 5 tiles
- **Buff duration:** 30s, no stack, stores `_shamanBaseMaxHp` for exact restore
- **Behaviour:** stands still in range, approaches only if player leaves range
- **Frozen during:** fireball cast (`_casting=true`, 20f) and buff channel
- **`gShamanFireballs[]`** — cleared in `gWildEnd()`
- **`gUpdateShamanBuffs(dt)`** — must be unconditional (not gated to `inWilderness`)

---

## Bomb Fire Zones

```js
gBombFireZones = []; // {wx, wy, radius, life, maxLife}
```
- Spawned by `_bombExplodeFeedback(b)` on every explosion
- Lifetime: 300 frames (5 seconds)
- DoT: 5 damage per 30 frames (0.5s), **non-stacking** — shared `p._fireDmgAccum`
- Visual: 3-layer flickering circles + dashed perimeter + ember particles
- `gPlayFireTick()` audio cue on each damage tick (gain 0.027)

---

## MOBA Skill System

### Skill Unlock Order
All skills start **locked** in wilderness. Player starts with only Normal Attack.

| Skill | Key | CTRL unlock | Level field |
|-------|-----|-------------|-------------|
| Attack | LMB | — (always unlocked) | — |
| Heavy | RMB | CTRL+R | `heavyLevel` |
| Dash | SPC | CTRL+SPACE | `dashLevel` |
| Whirlwind | Q | CTRL+Q | `wwLevel` |
| Leap | E | CTRL+E | `leapLevel` |

### Skill Points
- 1 point granted per level-up (stored on `gPlayer.skillPoints`)
- Spend by: clicking a pulsing (sk-spendable) slot OR CTRL+hotkey
- `sk-spendable` CSS: blue pulse animation, `pointer-events:all`
- `sk-slot` default: `pointer-events:none` (doesn't interfere with game)
- `#skill-bar` container: `pointer-events:auto` (must NOT be none)

### Level-Up Screen
- Shows only stat cards (STR/INT/DEX) — no ability cards
- One stat pick → CONFIRM
- Left panel: patron god portrait (150→82% height, `object-fit:cover`)
- God image src pulled from shrine card img tag

---

## Minimap System

### Tile Colours (both circular and full map)
| Tile | RGB |
|------|-----|
| GRASS | (60,120,45) |
| DIRT | (130,90,45) |
| TREE | (25,70,25) |
| ROCK | (110,110,120) |
| FLOOR | (50,45,70) |
| WALL | (80,70,100) |
| SPIKE | (90,55,20) |
| HUT | (60,30,10) |

### Minimap Dots
- Obelisks: cyan when unused, dark green when used
- Shrine: always visible (no fog gate), pulsing purple, ✦ glyph on full map
- Villages: removed (intentional — stealth discovery)
- Player: white dot at centre

---

## Hub Map (The Sanctum)
40×24 tiles, hardcoded `HUB_MAP`. Key entities:
- Player spawn: (19, 14)
- Shrine: (7, 5)
- Wilderness portal: (19, 2)
- Dungeon portal: (19, 22)
- Training dummy, barrels, crates

`leaveTown()` clears `gShrine=null` — shrine patron does NOT carry into dungeon.

---

## Audio Functions
| Function | Sound | Gain |
|----------|-------|------|
| gPlaySwish | Sword swing | 0.2 |
| gPlayHit | Enemy hit | 0.4 |
| gPlayGrunt | Player hit / explosion | variable |
| gPlayWhirlwind | WW dash | 0.35 |
| gPlayWoodBreak | Destructible break | — |
| gPlayWoodHit | Destructible hit | 0.45 |
| gPlayFireTick | Fire DoT tick | 0.027 |
| gPlayTwang | Bow shoot | — |
| gPlayStep | Footsteps (tile-aware) | 0.05–0.45 |

---

## Browser Safety
```js
// CTRL+W intercept (capture phase)
document.addEventListener('keydown', e=>{
  if(e.ctrlKey && (e.key==='w'||e.key==='W')) e.preventDefault();
}, true);

// beforeunload — must be UNCONDITIONAL to be respected by browsers
window.addEventListener('beforeunload', e=>{
  e.preventDefault();
  e.returnValue = 'Your wilderness run will be lost.';
  return e.returnValue;
});
```

---

## Known Pending Work

| Priority | Item | Status |
|----------|------|--------|
| 1 | Patron god gameplay buffs | UI only — no mechanics |
| 2 | Equipment/loot system | Not designed |
| 3 | Cave POIs in wilderness | Designed, not built |
| 4 | Shrine level-gating (every 5 levels) | Partially wired |
| 5 | Weapon registration pattern refactor | Not done |
| 6 | Hub vs Dungeon state machine | Not done |

---

## File Locations
| Path | Description |
|------|-------------|
| `/mnt/user-data/outputs/dungeon_forge.html` | Active game (~11,752 lines) |
| `/mnt/user-data/outputs/DUNGEON_FORGE_CTO_DOC.md` | This document |
| `/mnt/user-data/outputs/SESSION_JOURNAL.md` | Debugging lessons + session log |
| `/mnt/user-data/outputs/WORKING_AGREEMENT.md` | Collaboration patterns |
| `/mnt/transcripts/journal.txt` | Transcript index (sessions 1–9) |
| `/mnt/user-data/uploads/Cilia_Fire_Goddess.png` | Embedded in game as base64 |
| `/mnt/user-data/uploads/Ikras_Wind_God.png` | Embedded in game as base64 |
| `/mnt/user-data/uploads/Bhumi_Earth_Goddess.png` | Embedded in game as base64 |
| `/mnt/user-data/uploads/Boreas_Ice_God.png` | Embedded in game as base64 |
