# To Dust — CTO Technical Document
**Session 9 | June 2026**
**Active file:** `index.html` at repo root (single self-contained HTML file)
**Companion docs:** `agents/engineer/engineer.md` (read first) · `SESSION_JOURNAL.md` · `WORKING_AGREEMENT.md`

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
- §12 Wilderness XP, levelling, Nightfall Sieges, card draft
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

### Spawning — Nightfall Sieges (the difficulty clock)
The day/night cycle (3-min day / 2-min night, `WILD_DAY_DURATION`/`WILD_NIGHT_DURATION`) **is** the
difficulty curve — there is no 90s threat timer anymore. `wildThreatLevel` = `wildNight` (capped), so
enemy stat scaling steps once per nightfall.
- **Night = a fixed roster:** `_wildSiegeRoster(n)` (goblins `10+5n`, archers/bombers/warriors/shaman
  unlock by night, kings `min(5,⌊n/2⌋)`); `_wildBuildSiegeQueue` flattens+shuffles (×`NIGHT_GRUNT_SCALE`,
  kings last). `gWildSpawnTick` is a **budget spawner**: deploys the queue at `roster/night_duration`
  per second, throttled by `wildCurrentCap()`. Unspawned remainder is dropped at dawn.
- **Day = lull:** no horde spawning; only `gWildPatrolTick` bands (now aggro-on-spawn), ~16s cadence.
- **Despawn:** 85-tile radius, excludes `isPatrol` and `isHeld` enemies.
- Spawn ring: player-centred, `visRadius+3` to `+20` tiles, `activated=true`.

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

## Skills & Progression

### Skill Unlock Order — automatic (no skill-point currency)
Skills auto-unlock at fixed levels via `gWildSyncUnlocks` (`SKILL_UNLOCK_LEVEL`). It just sets the
skill's level field to 1 at the threshold; the existing per-player `xLevel < 1` firing/`isLocked`
checks are untouched (so MP semantics hold). The old `skillPoints` currency / CTRL-unlock is retired.

| Skill | Key | Unlocks at | Level field |
|-------|-----|------------|-------------|
| Attack | LMB | L1 (always) | — |
| Heavy | RMB | L1 (start kit) | `heavyLevel` |
| Dash | SPC | L2 | `dashLevel` |
| Whirlwind | Q | L3 | `wwLevel` |
| Leap | E | L4 | `leapLevel` |
| Grit (passive) | — | L5 | gated in `gGritGain` (`GRIT_UNLOCK_LEVEL`) |

### Level-Up Screen — Card Draft (replaces STR/DEX/INT)
- `gWildShowStatPick` deals **3 rarity-rolled cards, pick one** (Common/Rare/Epic/Legendary =
  ×1.0/1.7/2.6/4.0 magnitude; `CARD_RARITIES`). Rarity is pure magnitude — no transformative cards.
- Three pools: **passive** (`PASSIVE_CARDS` → `wildBuffs`), **active-skill** (`SKILL_CARDS`, ww/leap →
  per-player `gPlayer.skillMods`, read via `pSkillStat`), **Grit** (`GRIT_CARDS` → `gPlayer.gritMods`,
  read via `gGritShield/Duration/CapPct/Streak`). `gDrawCards` guarantees ≥1 passive + ≥1 skill/Grit
  (when available), de-dupes, and excludes cards at their per-run `cap` (`gPlayer.cardPicks`).
- **Reroll** (`gWildReroll`): interim free charge (1 +1/5-levels); spec retargets it to **Favor**
  pricing (`docs/specs/favor-imbue.md`) once that system lands.
- **STR/DEX/INT removed** — the scaling helpers (`weaponScalingMult`/`wildDex*`/…) are neutral shims.
- Left panel: patron god portrait, src pulled from the shrine card img tag.

### God Skills (item 2 pivot — auto-firing patron abilities) — spec `docs/specs/god-skills.md`
The god layer no longer imbues active skills; it grants **class-agnostic auto-firing god skills** (VS-style).
- **Pledge:** the wilderness shrine sets `gPlayer.patron` (e.g. `'cilia'`) — one step, no skill-picking.
  `gActivePatron(p)` returns `p.patron` (falling back to the legacy `imbues` values). The pledge unlocks that
  god's pool (`IMBUE_PATHS[patron]`) in the level-up draft. `gShrineHasUnclaimed()` now means "un-pledged."
- **State:** reuses the imbue-path mastery shape `p.imbuePaths[skillId] = {rank,form,chaos,mods}` but **keyed by
  the god-skill's own id** (`'burningBody'`), not an active skill. `rank>=1` = owned & auto-firing. Helpers:
  `gGodPool`/`gGodSkillTree`/`gOwnsGodSkill`/`gOwnedGodSkills`/`gGodFireParam` (base+mods, floored/capped).
- **Registry:** each `IMBUE_PATHS[patron][id]` entry carries the tree (`waveStep`/`forms`/`formStep`/`ascensions`,
  Form @5 / Ascension @10) **plus** a `fire` block (the auto-fire contract: `kind`, `timerKey`, `base`/`floors`/`caps`).
- **Draft:** `gGodSkillCards(p)` generates acquire + rank-up cards from the pool (replaces the static `IMBUE_CARDS`);
  ranks 5/10 fork through the existing `#g-evolution-overlay` (`gPendingEvolution`/`_evolutionOptions`/
  `_chooseEvolution`, now generalized to any god-skill id). First-acquire is guaranteed in the draft for discoverability.
- **Auto-fire:** `gUpdateGodSkills(p,dt)` ticks the local player's owned skills from `gUpdatePlayer` (after move).
  **Burning Body** (`gTickBurningBody`): a base **ignite-aura** every `AURA_TICK` + a Form emit — Firebloom rings
  / Cinderburst novas (`gSpawnFireRing`, `p._bbTimer`). Ascension modes on the ring: `breathe` (Dragonbreath,
  `healOwner`), `settle` (Chaos Crown, `_laySettleRing` chaosfire circle), and at-feet `gSpawnFireTrail` substance
  grounds (Dragonheart heal / Cataclysm self-burn). All standalone-damage (`FR_BASE_DMG`), reusing shipped FX.
- **MP:** per-skill timers are local-only (each client ticks its own); only FX/damage outcomes sync (the existing
  `_frSeq` bump in `gSpawnFireRing`). **Sim:** `Sim.observe().godSkills` + `.pendingEvolution`; forks resolve via
  `gSimEvolution`/`Sim.pickEvolution`.
- **Parked:** **Dance of Fire** (the swing imbue tree, `IMBUE_PATHS.cilia.swing` + `gFireWaveParams` + wave FX) and
  the skill-imbue overlay (`gOpenImbueMenu`/`gImbueSelectSkill`/`#g-imbue-overlay`) are kept but **unreachable** in
  play — nothing writes `imbues['swing']`, so all `gIsImbued(p,'swing'/'ww'/'evasion'/'heavy',…)` reads are now
  always-false (the actives are plain).
- **Skillforge (dev):** re-pointed to god skills — opened by an in-world **forge prop** in the Sanctum
  (walk up + `E`, `initForgeProp`/`gForgeInteract`/`drawForgeProp`, dev-only, replaces the old corner
  button) or the `K` key. Rows are derived from the registry (`gForgeGodSkills`, filtered by `gIsGodSkill`),
  with **Acquire / Rank +1 / Max (10) / Reset** per skill; it auto-pledges the patron and reuses the real
  apply paths (`gGodSkillCards`, `_chooseEvolution`), so a forged skill auto-fires immediately (e.g. on the
  town training dummy). New god skills appear here automatically.

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
All paths are relative to the repo root (`Project-Dank-Dungeons/`).
| Path | Description |
|------|-------------|
| `index.html` | Active game — one self-contained HTML file (CSS + JS + base64 art inlined) |
| `agents/engineer/engineer.md` | Engineering operating model & standing authority (read first) |
| `docs/TO_DUST_CTO_DOC.md` | This document — system-by-system architecture |
| `docs/SESSION_JOURNAL.md` | Debugging lessons + session log |
| `docs/WORKING_AGREEMENT.md` | Collaboration mechanics |
| `docs/archive/` | Frozen historical CTO-doc snapshots |
| `CHANGELOG.md` | Release notes; `[Unreleased]` promoted by `tools/release.ps1` |
| `art/` | Source PNGs (patron gods, tile sheets, FX/character sprites) sliced + base64-encoded into `index.html` |
| `tools/` | `release.ps1`, `slice-turnaround.py`, `dev-window.ps1`, `doc-drift-check.ps1` |
| `dev.py` | Local live-reload server (`python dev.py` → `localhost:5500`) |
| `dungeon-forge-project/` | Dormant Vite ES-module port (reference for a future modular split; not the live game) |
