# Dungeon Forge — Gamedev CTO Context Document
### A complete technical briefing for any LLM agent continuing development

---

## 1. Project Identity

**Name:** Dungeon Forge  
**Genre:** Browser-based 2D top-down MMORPG (Pre-Alpha)  
**Stack:** Single self-contained HTML file (~4,000 lines). No build tools, no framework, no server. Runs in any browser. Deployed via GitHub Pages.  
**Live URL:** `https://jw0ngo.github.io/Project-Dank-Dungeons/`  
**Repo:** `https://github.com/jw0ngo/Project-Dank-Dungeons`  
**Active file:** `index.html` at repo root (previously `dungeon_forge.html` in development)  

**Developer profile:** Solo developer, learning Git and terminal tooling as the project grows. Decisions should favour simplicity, clarity, and zero-friction deployment over engineering sophistication for its own sake.

---

## 2. Architecture Overview

### 2.1 Single-File Constraint

The entire game — HTML structure, CSS, and JavaScript — lives in one `index.html`. This is intentional for the current phase. It enables:
- Drag-and-drop deployment to GitHub Pages
- Local testing by opening the file directly (no server needed)
- Easy sharing and distribution

A Phase 2 migration to Vite (modular source → bundled single file) is planned but not yet implemented. Do not push for it until the file exceeds ~6,000 lines or the developer explicitly requests it.

### 2.2 Code Section Structure (§1–§10)

The script is divided into 10 labelled sections using the banner format:

```
// ═══════════════════════════════════════════════════════════════
// §N  SECTION TITLE
//     One-line description
// ═══════════════════════════════════════════════════════════════
```

Sub-sections use:
```
// ── §N.M  Sub-section name ──────────────────────────────────────
```

| § | Section | Contents |
|---|---|---|
| 1 | CONFIG & STORAGE | localStorage helpers, Firebase init |
| 2 | DEMO MAP & CONSTANTS | `DEMO_MAP`, tile IDs, game constants |
| 3 | HUB & NAVIGATION | `showScreen`, `goHub`, map list, `loadDemo` |
| 4 | MAP EDITOR | Palette, canvas, undo, zoom/pan, `edCentreView` |
| 5 | REGISTRIES | Sprites, weapons, entity defs & factories |
| 6 | DUNGEON ENGINE | Player · Combat · Enemies · Traps · Rendering · Game loop |
| 7 | MULTIPLAYER | Net adapter · Session management |
| 8 | CHARACTER CREATOR | Pixel editor · named saves · MP sprite sync |
| 9 | MAP SEED SYSTEM | Base62 codec · encode/decode · modal UI |
| 10 | INIT | `buildEdPalette()`, `refreshHub()` |

### 2.3 Rendering

- Canvas-based, no WebGL
- Tile size: `T = 24px` (constant)
- Viewport: fills browser window
- Camera tracks the local player with shake support
- Z-sorting: entities sorted by `wy` before drawing (painter's algorithm)
- Game loop: `requestAnimationFrame`, `gFrame` counter increments every tick

---

## 3. Core Game Systems

### 3.1 Tile System

Three walkable states encoded in map rows as characters:

```js
TILE_VOID  = 0  // 'V' — black, never rendered
TILE_FLOOR = 1  // 'F'
TILE_WALL  = 2  // 'W'
TILE_EXIT  = 5  // 'E'
```

`gIsWalk(tx, ty)` returns true for FLOOR and EXIT only.  
`gRebuildNav()` builds `gBlocked` (Uint8Array) — marks walls, intact destructibles, and fire traps as impassable. Called whenever the nav graph changes (destructible breaks, game load).

### 3.2 Entity System

Entities are plain JS objects. Factories produce them:

```js
makeGoblinEnt(tx, ty)  → melee enemy
makeArcherEnt(tx, ty)  → ranged enemy
```

Entity arrays:
- `gEnemies[]` — all live enemies (goblins + archers, differentiated by `e.isArcher`)
- `gDestructibles[]` — barrels and crates `{type, wx, wy, hp, maxHp, broken, breakAnim, r}`
- `gTorches[]` — static light sources `{tx, ty}`
- `gTraps[]` — fire traps `{wx, wy, tx, ty, dx, dy, dir, phase, phaseOffset, on, activated, beams[]}`
- `gPotions[]` — health potions `{wx, wy, pulse}`
- `gArrows[]` — active projectiles
- `gPlayer` — local player state

### 3.3 Player State

```js
{
  wx, wy,          // world position (pixels)
  r: 11,           // collision radius
  hp, maxHp: 100,
  iFrames,         // invincibility frames after hit
  dead,
  charging, chargeTick,
  swinging, swingTimer, swingDir,
  wwActive,        // whirlwind active
  kills,           // for end screen
  // ... movement, animation state
}
```

### 3.4 Combat

Three attack modes:
- **Sword swing** — `gDoSwing()`, arc-based hit detection via `pInArc()`
- **Charge** — hold SPACE, release to dash with sword
- **Whirlwind** — full charge releases a spinning dash that hits everything in path

Hit detection for multiplayer:
- Local player damage is applied immediately (client-side for responsiveness)
- Remote enemy damage is sent as `Net.sendHits([{idx, dmg}])` → host applies authoritatively
- Remote destructible breaks: `Net.sendHits([{destructIdx}])` → host applies and syncs

### 3.5 Physics & Collision

Collision pipeline (applied in order every movement frame):

```js
let [x, y] = gRC(wx, wy, r);           // wall tiles
[x, y] = gRCDestructibles(x, y, r);    // intact barrels/crates
[x, y] = gRCTraps(x, y, r);            // fire trap bases
```

All three must be called for every entity (player, goblin, archer). Missing any one causes phasing bugs.

`gSep(ax, ay, ar, bx, by, br)` — circular separation between two entities.

### 3.6 Fire Trap System

**Key constants:**
```js
FIRE_PERIOD = 240   // 4s full cycle at 60fps
FIRE_HALF   = 60    // 1s firing, 3s resting
FIRE_RANGE  = 7     // max tiles beam travels
FIRE_DMG_VAL = goblin.meleeDamage * 3
FIRE_IFRAMES = 60   // 1 hit/second max
```

**Timing — global clock approach:**  
Traps do NOT use per-trap timers. State is derived from `gFrame`:
```js
trap.on = ((gFrame + trap.phaseOffset) % FIRE_PERIOD) < FIRE_HALF;
```
This guarantees same-phase traps are always perfectly synchronised regardless of when they activated or how many there are.

**Phase offsets:** 0, 0.25, 0.5, 0.75 → `phaseOffset = Math.round(phase * FIRE_PERIOD)`

**Activation:** Traps only activate when a player comes within 8 tiles. Uses `mpNearestTarget()` to check all players.

**Traps are solid blocks:** Included in `gRebuildNav()` and `gRCTraps()` — enemies pathfind around them, no entity can pass through them.

**Multiplayer:** Trap state is derived locally from `gFrame` on each peer — no network sync needed for on/off state. `gFrame` is synced from host to client at game start via `rooms/{id}/startFrame`.

### 3.7 Destructibles

- Barrels and crates: `hp:1, maxHp:1` — one hit to break from any source
- Break triggers: sword swing, whirlwind, fire trap, arrow
- 10% chance to drop a health potion on break (`gMaybeDropPotion`)
- After breaking, `mpSyncDestructibles()` is called immediately (event-driven, not polled)

### 3.8 Health Potions

- Red flask visual with pulsing glow
- Spawns at barrel/crate break position (10% chance)
- Pickup radius: 10px + player radius
- Heals: `Math.round(maxHp * 0.5)` instantly
- Displays green `+N` floating number on pickup
- MP: host-authoritative, synced via `world/potions` channel

### 3.9 Enemy AI

**Activation:** `eAnyPlayerNear(ex, ey, range)` — checks ALL players (local + remote), bypasses target cache. Critical for MP where joining players would otherwise not activate enemies.

**Targeting:** `eNearestTarget(e, idx)` — caches result for 12–19 frames (staggered by index to spread CPU load). Cache invalidates early if any remote player is 2+ tiles closer than cached target.

**Pathfinding:** A* (`gAstar`), recalculated every `PATH_INT` frames or when target changes.

**Goblins:** Melee, chase player, attack when within melee range.  
**Archers:** Ranged, retreat when player too close, fire when LOS is clear.

---

## 4. Multiplayer Architecture

### 4.1 Transport

Firebase Realtime Database. The game never calls Firebase directly — all network I/O goes through the `Net` object (NetAdapter pattern). Swapping `Net` internals to WebSocket would require zero changes to game logic.

```
Phase 1 (current):  Firebase Realtime DB, host-authoritative
Phase 2 (planned):  WebSocket server, server-authoritative
```

### 4.2 Data Paths

```
rooms/{id}/
  world/
    enemies       ← 8hz stream, host writes via Net.sendEnemies()
    arrows        ← 8hz stream, host writes via Net.sendArrows()
    destructibles ← event-driven, mpSyncDestructibles() on break
    potions       ← event-driven, mpSyncPotions() on spawn/pickup
  players/{id}    ← 20hz, each player writes own input state
  hits/           ← push() per hit report, host processes
  signal/         ← respawn etc
  sprites/{id}    ← once on join
  startFrame      ← gFrame value at game start for trap sync
  started         ← boolean, triggers game start on clients
  map             ← JSON serialised map data
```

### 4.3 Per-System Independence (Critical Architecture Rule)

**Each system owns its own Firebase path, send rate, and receive handler.**

- Stream systems (change every frame): polled at fixed rate with delta compression
- Event systems (change discretely): write exactly once when state changes

**Why this matters:** Bundling systems into a single `sendWorld()` call with a shared delta guard causes silent data loss. If enemies haven't moved, the guard short-circuits and destructible breaks never reach clients. This was a real bug that broke barrel/crate sync for remote players.

**Pattern for adding new systems:**
1. Write a `mpSyncX()` function that writes to `rooms/{id}/world/x`
2. Write a `_onXUpdate(snap)` handler
3. Register the listener in `Net.join()` with `Net._on(db.ref(...world/x), 'value', Net._onXUpdate)`
4. Call `mpSyncX()` at every state-change site (not on a timer)
5. Touch zero existing code

### 4.4 Hit Reporting

`Net.sendHits(hits)` uses `.push()` — **never `.set()`**.

`.set()` on the same key path fires `child_added` only the first time the key is created. Subsequent calls fire `child_changed`, which has no listener. Using `.push()` generates a unique key per report, guaranteeing `child_added` fires for every hit. The host listener calls `snap.ref.remove()` after processing to clean up.

### 4.5 Host Authority

- The host runs `gUpdateEnemies()` and enemy pathfinding
- All peers run `gUpdateTraps()` (state derived from gFrame, deterministic)
- All peers run `gUpdatePotions()` (damage applied locally, potion removal synced)
- Client sends `Net.sendInput()` at 20hz with position, actions
- Host sends enemy/arrow state at 8hz with delta compression
- Enemy interpolation: lerp toward host-authoritative positions (`g._tx, g._ty`)

### 4.6 gFrame Sync

`gFrame` starts at 0 when the page loads and never resets. Host and client load pages at different times, so their `gFrame` values would diverge. Fix: host writes `gFrame` to `rooms/{id}/startFrame` when starting the game, client sets `gFrame = room.startFrame` before launching. After this, both peers increment at the same rate (60fps rAF), staying in sync indefinitely.

---

## 5. Map Seed System

### 5.1 Format

```
DF1:<base62 payload>
```

`DF1:` is the version prefix. If the schema changes, bump to `DF2:` and keep the old decoder.

### 5.2 Payload Structure (binary, then base62 encoded)

```
Byte 0:   width  (1–255)
Byte 1:   height (1–255)
Bytes 2…: tile RLE pairs [tile_byte, run_length_byte]
          tile_byte: 0=wall, 1=floor, 2=exit
          run_length_byte: 1–255 (split longer runs)
After tiles: entity records, 3 bytes each [kind_idx, tx, ty]
```

### 5.3 SEED_ENTITY_KINDS (append-only, never reorder)

```
0:  player       6:  fire-n (phase 0%)    10: fire-n-1 (phase 25%)
1:  goblin       7:  fire-s (phase 0%)    11: fire-s-1 (phase 25%)
2:  archer       8:  fire-e (phase 0%)    12: fire-e-1 (phase 25%)
3:  barrel       9:  fire-w (phase 0%)    13: fire-w-1 (phase 25%)
4:  crate        14–17: phase 50%         18–21: phase 75%
5:  torch
```

Fire traps encode direction + phase as a single kind index. The in-game entity is always `{kind:'fire-trap', dir, phase}` — the seed indices are just a storage format.

### 5.4 Base62 Alphabet

`0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`

URL-safe, no padding, no special characters. Leading zero bytes preserved as leading `'0'` characters.

---

## 6. Map Editor

### 6.1 Key Functions

- `editorLoad(mapData)` — loads tile/entity data only, does NOT touch canvas
- `edCentreView()` — resizes canvas, fits map, centres pan. Must be called AFTER `showScreen('editor')` so canvas has real dimensions
- `buildEdPalette()` — populates terrain and entity palette tiles
- `edApply(tx, ty, erase)` — places or erases at tile coords
- `saveMap()` — persists to localStorage via `storeSet()`
- `mapDataFromEditor()` — serialises current editor state to mapData object

### 6.2 Fire Trap Editing

Single "Fire Trap" palette entry. After placing:
- **Left-click** existing trap → cycles direction N→E→S→W→N
- **Shift+click** existing trap → cycles phase 0%→25%→50%→75%→0%
- Phase badge (`25%`, `50%`, `75%`) drawn in tile corner when non-zero
- Hover label shows `fire-trap → 50%` with direction arrow

### 6.3 Common Editor Bug Pattern

**Symptom:** Map appears blank or off-screen when opening editor.  
**Cause:** `edResizeCanvas()` called while screen is `display:none` → canvas has zero dimensions → pan centring formula produces garbage.  
**Fix:** Always call `edCentreView()` after `showScreen('editor')`, never before.

---

## 7. Character Creator

16×16 pixel sprite editor. Features:
- 256×256 canvas (16× zoom), paint/fill/erase/flip
- 28 colour presets + custom hex + PNG upload
- Named character library in `localStorage('df_characters')`
- `ccPixelsToCanvas()` for converting pixel array to canvas (used for MP sprite sync)
- Player sprite is synced to all peers on join via `rooms/{id}/sprites/{id}`

---

## 8. Known Bug Patterns & Their Fixes

### 8.1 MP Systems Silently Dropped

**Root cause:** Single `sendWorld()` with shared delta guard. If guard fires early (no enemies/arrows changed), all other systems skip.  
**Fix:** Independent per-system channels. Each system writes to its own path and has its own delta check.

### 8.2 Hit Reports Overwritten

**Root cause:** `sendHits()` used `.set()` on `rooms/{id}/hits/{localId}`. Multiple hits in quick succession overwrote each other. `child_added` only fires on key creation.  
**Fix:** Use `.push()` for unique keys per report.

### 8.3 gFrame Drift Between Peers

**Root cause:** `gFrame` initialises to 0 at page load, not at game start. Host and client load pages at different times.  
**Fix:** Host writes `gFrame` to `startFrame` on game start. Client reads and sets its own `gFrame` before launch.

### 8.4 Enemy Activation Ignores Joining Player

**Root cause:** `e.activated` gated on `d<300` where `d` is distance to cached target (often the host). Joining player standing nearby doesn't trigger activation.  
**Fix:** `eAnyPlayerNear(ex, ey, range)` checks ALL players directly, bypasses cache.

### 8.5 Target Cache Stale for Remote Players

**Root cause:** `eNearestTarget` cache only invalidates on timer expiry or target death. Joining player could be closer but ignored.  
**Fix:** Early cache invalidation when any remote player is 2+ tiles closer than cached target.

### 8.6 Editor Map Off-Screen on Open

**Root cause:** `editorLoad()` called `edResizeCanvas()` while screen was hidden.  
**Fix:** `edCentreView()` called after `showScreen('editor')`.

### 8.7 Phasing Through Destructibles/Traps

**Root cause:** Missing collision chain calls. Full chain must be: `gRC → gRCDestructibles → gRCTraps`. Any missing step causes phasing.  
**Entities requiring full chain:** player (normal move), player (whirlwind), goblin, archer.

### 8.8 Copy Selecting All Page Text

**Root cause:** `document.execCommand('selectAll')` selects entire document, not just target element.  
**Fix:** `document.createRange()` + `selectNodeContents(el)` scopes selection to element.

---

## 9. Deployment Workflow

```bash
# Always pull first
git pull

# Copy new dungeon_forge.html to repo folder, rename to index.html
# (Windows: drag in, click Yes to replace when prompted)

git add index.html
git commit -m "describe what changed"
git push
```

Wait ~60 seconds, then verify at the GitHub Pages URL in an incognito window.

**GitHub Pages config:** Deploy from branch `main`, folder `/ (root)`. The file served must be named `index.html` at the root — no redirects.

---

## 10. Code Modification Protocol

When making changes to this codebase, always follow this sequence:

### Step 1 — Read before touching
```bash
grep -n "functionName\|CONSTANT_NAME" dungeon_forge.html | head -20
sed -n 'START,ENDp' dungeon_forge.html
```
Always read the exact current text before replacing. Matching failures leave the codebase in a partial state.

### Step 2 — Make targeted changes
Use `str_replace` for surgical edits — never rewrite sections wholesale unless refactoring is explicitly requested. Each replacement should be the minimum change needed.

### Step 3 — Verify syntax after every change
```bash
node --input-type=module << 'EOF'
import { readFileSync } from 'fs';
const h = readFileSync('/mnt/user-data/outputs/dungeon_forge.html','utf8');
const s = [...h.matchAll(/<script(?! src)(?![^>]*type="module")>([\s\S]*?)<\/script>/g)];
try { new Function(s[1][1]); console.log('JS OK'); }
catch(e) { console.log('ERROR:', e.message); }
EOF
```

### Step 4 — Check invariants
For any multiplayer change, verify:
- New system has its own Firebase path
- Listener registered in `Net.join()`
- State-change sites (not timer) call the sync function
- `_prevState` variables declared and reset in both launch sites

For any collision change, verify:
- All 4 movement sites updated: player move, player whirlwind, goblin, archer
- All 3 collision functions called in order: `gRC → gRCDestructibles → gRCTraps`

For any entity addition, verify:
- Entity array declared alongside others, reset in `gameLoad()`
- Spawned in `gameLoad()` entity loop
- Drawn in `gRender()` in correct z-order
- If host-authoritative: sync function + listener added

---

## 11. Key Constants Reference

```js
// Tile
T = 24              // tile size in pixels

// Player
maxHp = 100
iFrames = 50        // after melee hit
CHARGE_MAX          // frames to full charge

// Fire traps
FIRE_PERIOD = 240   // 4s at 60fps
FIRE_HALF = 60      // 1s on, 3s off
FIRE_RANGE = 7      // tiles
FIRE_DMG_VAL = goblin.meleeDamage * 3
FIRE_IFRAMES = 60   // 1 hit/second max

// Potions
POTION_DROP = 0.10  // 10% drop chance
POTION_HEAL = 0.5   // 50% maxHp
POTION_RADIUS = 10  // pickup radius px

// Multiplayer
MP_INPUT_HZ = 20    // player input send rate
MP_ENEMY_HZ = 8     // enemy/arrow send rate
MP_LERP_SPEED = 0.18
MP_ENEMY_DELTA = 2  // delta threshold for enemy position change
MP_MAX_PLAYERS = 4
```

---

## 12. Design Principles

These are the explicit decisions made during development. Preserve them.

1. **Event-driven over polling** — systems that change discretely (destructibles, potions, doors) should sync on change events, not on a timer. Polling wastes bandwidth and creates timing-dependent bugs.

2. **Global clock over per-entity timers** — systems needing synchronisation across peers (fire traps) derive their state from `gFrame`, not from timers that started at different times.

3. **Host-authoritative, client-responsive** — clients apply visuals immediately for responsiveness, but authoritative state lives on the host. Clients don't trust their own numbers for things that affect other players.

4. **Append-only registries** — `SEED_ENTITY_KINDS` must never be reordered or have entries removed. Old seeds must always decode correctly. New entries go at the end.

5. **Separate concerns by Firebase path** — one system, one path, one handler. Never bundle unrelated data into the same write.

6. **Read before writing** — always grep and view the exact current code before making replacements. Never assume content based on previous context.

7. **Verify after every change** — run the JS syntax check after every modification. Broken syntax silently corrupts all subsequent work.

8. **Minimum viable change** — make the smallest change that fixes the problem. Avoid refactoring adjacent code unless it's directly causing the issue.

9. **Phase 1 first** — the codebase is intentionally monolithic during prototyping. Propose modularisation only when pain is demonstrably real (not theoretical), and only when the developer is ready to absorb the workflow change.

---

## 13. Planned / Not Yet Implemented

- WebSocket server replacing Firebase (Phase 2)
- Host migration on disconnect
- Loot drops beyond health potions (chests, weapons)
- Additional enemy types (skeleton, troll)
- Town/base screen (was removed, not yet restored)
- Doors, switches, environmental puzzles
- Proper inventory system
- Level progression beyond single dungeon
- Vite build pipeline for modular source (Phase 2)

---

## 14. File Structure at Time of Writing

The repo contains:
```
index.html                      ← the game (this is everything)
dungeon_forge_MP_Build.html     ← legacy, can be deleted
dungeon_forge_MP_v1.html        ← legacy, can be deleted
```

Local development uses `dungeon_forge.html` as the working filename, then copies/renames to `index.html` for deployment.

---

*Document generated from active development session — April 2026.*  
*Covers Sessions 1 and 2 of the Dungeon Forge MMORPG development.*
