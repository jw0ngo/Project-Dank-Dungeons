# Dungeon Forge — CTO Technical Document
**Session 9 | June 2026**
**Active file:** `/mnt/user-data/outputs/dungeon_forge.html` (~11,521 lines, single-file architecture)

---

## Project Overview

Dungeon Forge is a browser-based 2D MMORPG built as a single HTML file. It features dungeon crawling, a wilderness survival mode, a town hub (The Sanctum), multiplayer via Firebase, a map editor, and a roguelike progression system.

**Engine:** Vanilla JS + Canvas API. No frameworks. Single `<canvas id="gc">` for game rendering. CSS overlays for UI panels.

---

## Architecture Summary

### Game Modes
| Flag | Description |
|------|-------------|
| `inTown` | The Sanctum hub world |
| `inWilderness` | Wilderness survival run |
| neither | Dungeon instance |

### Key Globals
```js
let gPlayer, gEnemies=[], gArrows=[], gPlayerArrows=[]
let gDestructibles=[], gTorches=[], gTraps=[], gPotions=[], gBombs[]
let gXPOrbs=[], gObelisks=[], gVillages=[], gShrine=null
let gShamanFireballs=[]
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

### Section Index (§)
- §1 Sprites & SpriteRegistry
- §2 Entity factories (makeGoblinEnt, makeArcherEnt, makeWarriorEnt, makeBomberEnt, makeShamanEnt, makeKingEnt)
- §3 Hub & Navigation
- §4 Map Editor
- §5 Collision & Pathfinding (gRC, gRCDestructibles, gRCEnemies, gRCTraps, gRebuildNav, gAstar)
- §6 Sword & Whirlwind system
- §6b Bow system
- §7 Player update (gUpdatePlayer)
- §8 Enemy AI (EnemyRegistry, _aiGoblin, _aiArcher, _aiWarrior, _aiBomber, _aiShaman, _aiKing)
- §9 Enemy damage / gCheckEnemyDamage
- §10 Init & gameLoad
- §11 Render (gRender, gDrawTile, gDrawPlayer, gDrawEnemy, gDrawShaman, gDrawArcher, gDrawWarrior, gDrawBomber, gDrawKing)
- §12 Wilderness XP, levelling, threat
- §12b Obelisk system
- §13 Fog of War
- §14 Goblin Village system
- §15 Shrine system

---

## Wilderness Mode — Complete System

### Map Generator (`generateWildernessMap`)
- **Size:** 600×300 tiles (19,200×9,600px at T=32)
- **Seeded PRNG:** Mulberry32
- **Tileset:** `TILE_GRASS=6`, `TILE_DIRT=7`, `TILE_TREE=8` (slows 25%), `TILE_ROCK=9` (solid), `TILE_SPIKE=10` (solid), `TILE_HUT=11` (solid)
- **Generation order:**
  1. Border walls
  2. Forest clusters (140–200)
  3. Rocky outcrops (40–75)
  4. Spawn clear zone (5-tile radius at map centre)
  5. Cellular automata smoothing (2 passes)
  6. Torches (60)
  7. Villages (3–4)
  8. Obelisks (20–30, 40-tile separation)
  9. Shrine (1, within 20–100 tiles of spawn)
  10. Row string output (R/T/H/S/W/F/D/G)

### Entities loaded via `gameLoad`
- `player` → gPlayer spawn
- `torch` → gTorches
- `obelisk` → gObelisks `{wx,wy,used,channelTimer}`
- `village` → gVillages `{id,cx,cy,radius,cleared,alerted,campfires,chests,enemySpawns,_enemies,hutMap,spikeMap,interiorMap}`
- `shrine` → gShrine `{wx,wy,tx,ty,activated,patron,promptRange}`

---

## Enemy System

### EnemyRegistry
```js
const EnemyRegistry = {
  goblin:  { ai: _aiGoblin,  flagProp: null        },
  archer:  { ai: _aiArcher,  flagProp: 'isArcher'  },
  warrior: { ai: _aiWarrior, flagProp: 'isWarrior' },
  bomber:  { ai: _aiBomber,  flagProp: 'isBomber'  },
  shaman:  { ai: _aiShaman,  flagProp: 'isShaman'  },
  king:    { ai: _aiKing,    flagProp: 'isKing'    },
};
```

**Critical:** The goblin AI dispatch exclusion list must include all non-goblin types:
```js
if(reg.flagProp ? !e[reg.flagProp] : (e.isArcher||e.isWarrior||e.isBomber||e.isKing||e.isShaman)) continue;
```

### EntityDefs (key stats)
| Enemy | HP | Speed | Threat unlock |
|-------|-----|-------|---------------|
| Goblin | 30 | 0.193 | 0 |
| Archer | 22 | 0.15 | 2 |
| Bomber | 15 | 0.18 | 4 |
| Warrior | 60 | 0.22 | 6 |
| Shaman | 40 | 0.16 | 8 |
| King | 500 | 0.13 | milestone |

### Village Enemies
- Spawn at map generation via `enemySpawns[]` array
- Instantiated in `goWilderness()` after `gameLoad()`
- `e.isVillage=true` → exempt from 85-tile despawn radius
- `e.activated=false` → no AI auto-activation until `_villageAlert(vill)` called
- Alert triggers: player enters village radius OR player damages any village enemy
- `isVillage` cleared on alert → enemies join normal despawn pool

### Goblin Shaman (§ new)
- **Fireball:** speed 0.72px/f, homing 3°/frame, lifetime 420f, range 220px (= archer range)
- **Burn DoT:** 5 damage over 3 seconds (1 dmg per 36 frames) on fireball hit
- **Buff incantation:** 150f channel (2.5s), buffs all allies within 5 tiles: +50% maxHP, +30% damage, 30s duration, no stack
- **Behaviour:** stands still in range, only approaches if player leaves range (like archer), angled retreat at 80px, freezes during cast and channel
- **`gShamanFireballs[]`** — separate array, updated via `gUpdateShamanFireballs(dt)`
- **`gUpdateShamanBuffs(dt)`** — ticks buff timer, expires on all gEnemies
- **`gUpdateBurn(dt)`** — ticks player burn DoT

### Goblin Warrior (redesigned)
- Primary attack: charge (10 tiles, 7.5px/f, 55f windup)
- Stops at 5 tiles (160px) from player to line up charge
- Charge angle locked at windup start; arrow indicator anchored at windup origin
- Reactive melee swing only if player steps to 58px range
- Charge arrow disappears behind warrior as it charges (startOffset = chargeTraveled)
- 60f recovery stun after charge

### Goblin Bomber
- `preferredDist: 190px` — stops just inside archer range (220px)
- Lobs from preferred distance, no longer charges to melee

---

## Spawning System

### Horde Spawning (`gWildSpawnTick`)
- Player-centred ring: `visRadius+3` to `visRadius+20` tiles
- Interval: 20–90 frames (decreases with threat)
- All horde enemies: `activated=true` immediately (VS-style)
- 85-tile despawn radius for non-village, non-patrol enemies

### Patrol Bands (`gWildPatrolTick`)
- Interval: 12–30 seconds
- Spawns anywhere outside vision radius in the ring
- 75% chance to prefer road tiles (if `gRoadMap` exists — currently removed)
- Shared `patrolVx/patrolVy` — no drift, cohesive formation
- Activate on player contact → join normal AI

### Boss Milestones
- 10 min → 1 Goblin King (`_wildSpawnKings(1, ...)`)
- 20 min → 3 Goblin Kings
- 30 min → 10 Goblin Kings
- Spawn within 60–90% of aggro range (192–288px) of player

### Map-Edge & Distance Despawn
```js
// In gUpdateEnemies:
if(e.wx < -edgeMargin || e.wx > maxX || ...) gEnemies.splice(i,1);
if(!e.isPatrol && !e.isVillage) {
  if(dx*dx+dy*dy > despawnR2) gEnemies.splice(i,1);
}
```

---

## Fog of War (§13)

- `gFogMap`: `Uint8Array(gMapW*gMapH)`, 0=unseen, 1=revealed (permanent)
- Vision radius: 30 tiles day / 12 tiles night
- `gFogReveal()`: stamps circle every 4 frames
- `gDrawFog()`: tile-by-tile black rects (unrevealed) + evenodd arc (vision edge softening)
- **Minimap canvas** (`#minimap-canvas`): 120×120px circular, 80-tile radius player-centred
- **Full map overlay** (`#minimap-full`): 600×300px, shown while TAB held
- Both show fog, terrain colours, obelisk dots, player dot

### Minimap Tile Colours
| Tile | Circular | Full map |
|------|----------|----------|
| GRASS | (60,120,45) | (60,120,45) |
| DIRT | (130,90,45) | (130,90,45) |
| TREE | (25,70,25) | (25,70,25) |
| ROCK | (110,110,120) | (110,110,120) |
| FLOOR | (50,45,70) | (50,45,70) |
| WALL | (80,70,100) | (80,70,100) |
| SPIKE | — | (90,55,20) |
| HUT | — | (60,30,10) |

---

## Roguelike Progression

### XP & Levelling
- `gXPOrbs[]` — dropped on kill, auto-collected by proximity
- `wildXpToNext(level)` = `floor(100 × level^1.4)`
- Level-up shows stat pick screen (`gWildShowStatPick`)
- `WILD_XP_TABLE`: goblin:10, archer:15, warrior:25, bomber:20, king:100

### Stat System
- STR: +20 maxHP/pt, +0.5 HP/s regen/pt, weapon B-scaling
- INT: +15 maxMP/pt, +0.3 MP/s regen/pt
- DEX: +5% speed/pt, -5% cooldowns/pt, +5% atk speed/pt
- Dark Souls weapon scaling: S/A/B/C/D grades on str/dex/int

### Level-Up Screen
- Two-column: stat cards (STR/INT/DEX) + ability cards (Whirlwind/Leap)
- One selection required from each; CONFIRM button activates when both chosen
- **God portrait panel** (left, 150px): shows patron god image if shrine has been visited
- Skills locked at level 0 in wilderness (`isLocked` check in skill bar)

### Obelisk System (§12b)
- 20–30 per map, 40-tile separation
- Channel for 600 frames (10s) inside 3-tile radius ring
- 3-card buff selection from 10 possible buffs
- All buffs additive (not multiplicative):
  - hpBonus, mpBonus (flat), hpRegenAdd (HP/s), mpRegenAdd (MP/s)
  - speedPct, damagePct, cdPct, spawnPct, xpPct (percentage points)
  - pickupRange (px)

---

## Goblin Village System (§14)

- 3–4 villages per map, 100-tile minimum separation
- Each village: circular clearing (10–14 tile radius), 85% dirt interior
- Spike fence perimeter: broken groups of 1–4 tiles, gaps of 1–3 tiles, entrance toward spawn
- Huts: 3–5 solid 2×2 footprints, 2-tile clearance between
- Campfires: 2–4, animated flicker (three-layer ellipse, `Date.now()` pulse)
- Chests: 1–3 near village centre, auto-loot → XP orb burst (4% level per orb)
- Enemies: 8–16, density gradient (warriors/archers inner, goblins outer)
- `gUpdateVillages(dt)`: aggro check, cleared check, chest loot
- `gDrawVillages()`: campfires + chests
- Village cleared when all `_enemies` are dead → campfires go dark

---

## Shrine System (§15)

### Placement
- **Wilderness:** 1 shrine per run, 20–100 tiles from spawn
- **Sanctum:** shrine at tile (7, 5) in HUB_MAP
- Diamond of `TILE_FLOOR` tiles (radius 5 solid) with scatter fringe (5-ring, probability 80%→0%)
- Hash: `((tx*2999)^(ty*6571)) >>> 0` for stable scatter pattern

### Shrine Object
```js
gShrine = { wx, wy, tx, ty, activated, patron, promptRange:3*T }
```

### Interaction
- E key near shrine → `gShrineInteract()` → `gOpenShrineMenu()`
- Menu: 4 god cards with embedded base64 portraits
- Selecting a god: stores `gShrine.patron`, sets `gShrine.activated=true`
- ESC closes without selecting

### Gods
| God | Element | Colour |
|-----|---------|--------|
| Cilia | Fire | #ff4400 |
| Ikras | Wind | #cc99ff |
| Bhumi | Earth | #44cc44 |
| Boreas | Ice | #44aaff |

### Level-Up Integration
- If `gShrine.patron` is set, god portrait appears on left side of level-up screen
- Portrait pulled from shrine card img src (no double-embedding)

---

## Combat Systems

### Player Attack (Sword)
- **LMB click/hold:** `gDoSwing()` immediately, repeats while `lmbHeld && swingCooldown<=0`
- **swingDur:** 24f, **swingCd:** 60f (halved attack rate vs original)
- No charge system — removed
- **RMB:** Heavy attack (smash), 2-stage windup
- **Q:** Whirlwind toggle (locked until `wwLevel>=1`)
- **E:** Leap (locked until `leapLevel>=1`), or shrine interaction if nearby
- **SPC:** Evasion dash (15MP)

### Player Collision
- Chain: `gRC → gRCDestructibles → gRCTraps → gRCEnemies`
- `gRCEnemies`: 70% player push, 30% enemy nudge, cheap squared-distance reject
- Village enemies still collide normally

### iFrames
- Standard hit: 12 frames (0.2s at 60fps)
- Evasion/leap: 999f

---

## Day/Night Cycle

- **Day:** 240s (4 min), vision 30 tiles
- **Night:** 60s (1 min), vision 12 tiles
- Timers use `Date.now()` delta (wall-clock seconds) — not `dt/60` (prevents framerate distortion)
- Night: spawn interval ×0.45, wave size ×2+1, all enemies `activated=true`
- Progress bar at top of screen: 320px wide, skull markers at 10/20/30 min

---

## Performance Optimisations

- **Dead enemy purge:** every 10 frames
- **gRebuildNav:** every 300 frames in wilderness, every frame in dungeons
- **Enemy separation:** spatial grid O(n), cell size 26px
- **Particle cap:** 400 max (`MAX_PARTICLES`)
- **Particle draw:** colour-batched, viewport-culled, `Math.pow(.88,dt)` pre-computed
- **gDmgNums cap:** 20 entries
- **AI cull:** removed — all live enemies run AI (AI registry exclusion handles shamans/etc.)
- **Fog reveal:** throttled every 4 frames
- **Minimap:** redraws every 6 frames

---

## Audio

- `gPlayStep()`: tile-aware footsteps
  - GRASS/DIRT: lowpass 180–240Hz, gain 0.05 (quiet muffled thud)
  - TREE: bandpass 1200–1800Hz (leaf crunch)
  - STONE/FLOOR: lowpass 220–300Hz (dungeon thud)
- `gPlaySwish()`, `gPlayTwang()`: sword/bow SFX
- All via Web Audio API through `gpfx(ac => {...})`

---

## UI Panels

### Skill Bar
- Slots: LMB (Attack), RMB (Heavy), SPC (Evasion), Q (Whirlwind), E (Leap)
- `.sk-locked` class: 45% opacity, lock icon drawn on cooldown canvas
- Skills locked in wilderness until levelled via ability upgrade cards

### Character Menu (C key)
- Three columns: Preview canvas | Stats (14 rows incl. obelisk buffs) | Skills
- Stats shown: LEVEL, STR, INT, DEX, HP, HP/s, MP, MP/s, SPEED, DMG, CD-RED, SPAWN, EXP, PULL

### Death Screen
- Stats captured before `gWildEnd()` resets
- "YOU HAVE FALLEN" + survival stats

### Shrine Menu
- Full-screen overlay, 4 god portrait cards
- Animated rotating rune background canvas
- Selecting a god → 350ms flash → store patron → close

### Level-Up Screen
- Left panel: god portrait (150px) if patron chosen
- Right panel: stat cards + ability cards + CONFIRM button
- Cards: 120px wide, compact spacing to fit in viewport

---

## Map System

### HUB_MAP (The Sanctum)
- 40×24 tiles, hardcoded
- Entities: player (19,14), shrine (7,5), torches, barrels, crates
- Portal to dungeon at (19,22), wilderness portal at (19,2)

### Wilderness Map
- 600×300 tiles, procedurally generated per seed
- `gIsWalk`: FLOOR/EXIT/GRASS/DIRT/TREE are walkable; WALL/ROCK/SPIKE/HUT are solid
- `gTreeSlow`: returns 0.75 inside tree tiles

---

## Firebase / Multiplayer

- `MP.active`, `MP.isHost` flags
- Hit sync via `Net.sendHits([{idx, dmg}])`
- Hub presence via Firebase Realtime Database
- `LOCAL_ID` persistent per browser session

---

## Known Architecture Debt

- Priority 3 (weapon registration pattern) — not done
- Priority 4 (state machine for Hub vs Dungeon) — not done
- Patron god buffs not yet implemented (shrine menu is UI-only for now)
- Equipment/loot system not yet designed
- Cave system designed but not built

---

## File Locations

| Path | Description |
|------|-------------|
| `/mnt/user-data/outputs/dungeon_forge.html` | Active game file (~11,521 lines) |
| `/mnt/user-data/uploads/Cilia_Fire_Goddess.png` | Cilia portrait (embedded as base64) |
| `/mnt/user-data/uploads/Ikras_Wind_God.png` | Ikras portrait (embedded as base64) |
| `/mnt/user-data/uploads/Bhumi_Earth_Goddess.png` | Bhumi portrait (embedded as base64) |
| `/mnt/user-data/uploads/Boreas_Ice_God.png` | Boreas portrait (embedded as base64) |
| `/mnt/transcripts/journal.txt` | Session transcript index |

---

## Next Priorities (Suggested)

1. **Patron god buffs** — implement actual gameplay effects for each god selection
2. **Equipment/loot system** — chests currently give only XP; design item drops
3. **Cave POIs** — designed but not built; short dungeon instances in wilderness
4. **Shrine level-gating** — shrine only available every 5 levels (UI ready, logic not wired)
5. **Additional wilderness POIs** — camps, ruins, merchant NPC
6. **God-specific enemy variants** — shamans could align to a god element
7. **Dungeon difficulty scaling** — caves scale to player level at entry
