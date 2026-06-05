# Dungeon Forge — CTO Context Document
### Complete technical briefing for any LLM agent continuing development
### Last updated: April 2026 — Sessions 1–5

---

## HOW TO USE THIS DOCUMENT

Read this first at the start of every session. It tells you:
- What the project is and where files live
- Every major system and how it works
- All architectural decisions and why they were made
- Known bugs and their patterns
- What's in progress and what's planned

After reading, ask the developer what they want to work on. Do not assume.

---

## 1. Project Identity

**Name:** Dungeon Forge
**Genre:** Browser-based 2D top-down MMORPG (Pre-Alpha)
**Live URL:** `https://jw0ngo.github.io/Project-Dank-Dungeons/`
**Repo:** `https://github.com/jw0ngo/Project-Dank-Dungeons`

**Developer profile:** Solo developer, non-technical background, learning as the project grows. Decisions favour simplicity and zero-friction workflow over engineering sophistication. Explain reasoning clearly. Never push for architectural changes unless the pain is demonstrably real.

---

## 2. Current File Structure

### 2.1 Working file (for game development)

Active development still happens against a single HTML file:

```
dungeon_forge.html          ← working file (~5,892 lines)
```

This is what gets uploaded to Claude for changes, downloaded after changes, and deployed to GitHub Pages as `index.html`.

### 2.2 Split project (Phase 1 migration — in progress)

A Vite project structure has been created and is a work in progress:

```
dungeon-forge/
├── index.html              ← HTML shell + CSS only (677 lines)
├── package.json            ← vite dev dependency
├── vite.config.js          ← base: '/dungeon-forge/'
├── src/
│   ├── config.js           ← §1  localStorage helpers, LOCAL_ID, SESSION_ID
│   ├── maps/
│   │   ├── maps.js         ← §2  DEMO_MAP, HUB_MAP, tile constants
│   │   └── seed.js         ← §9  seed encode/decode, SEED_ENTITY_KINDS
│   ├── hub/
│   │   ├── navigation.js   ← §3  showScreen, goHub, refreshHub, map cards
│   │   └── town.js         ← town + portal system
│   ├── editor/
│   │   └── editor.js       ← §4  full map editor (466 lines)
│   ├── engine/
│   │   ├── registries.js   ← §5  sprites, WeaponRegistry, EntityDefs
│   │   └── engine.js       ← §6  dungeon engine (1,809 lines — next to split)
│   ├── multiplayer/
│   │   └── multiplayer.js  ← §7  Firebase Net adapter + MP session
│   └── ui/
│       ├── characterCreator.js ← §8  pixel art editor
│       └── inventory.js    ← inventory system
└── _init.js                ← §10 bootstrap
```

**Status:** Files are split and content is correct. NOT YET converted to ES modules (`import`/`export`). Scripts still loaded via `<script src="...">` tags in dependency order. Game not yet verified running from this structure (requires Node.js + `npm run dev`).

**Next steps for Phase 1:**
1. Test that split project runs (`npm install && npm run dev`)
2. Fix any load-order bugs
3. Convert to ES modules (`import`/`export`)
4. Extract sprite pixel arrays to real PNG files
5. Set up GitHub Actions for auto-deploy

### 2.3 Code section structure (§1–§10)

All sections use banner format:
```js
// ═══════════════════════════════════════════════════════════════
// §N  SECTION TITLE
// ═══════════════════════════════════════════════════════════════
```

| § | Section | Lines | Contents |
|---|---|---|---|
| 1 | CONFIG & STORAGE | 662–704 | localStorage helpers, Firebase init, LOCAL_ID |
| 2 | DEMO MAP & CONSTANTS | 706–832 | DEMO_MAP, HUB_MAP, tile IDs, T=24 |
| 3 | HUB & NAVIGATION | 834–992 | showScreen, goHub, map cards, loadDemo |
| 4 | MAP EDITOR | 993–1458 | Palette, canvas, undo, zoom/pan |
| 5 | REGISTRIES | 1459–1838 | Sprites, WeaponRegistry, EntityDefs, factories |
| 6 | DUNGEON ENGINE | 1839–3647 | Player, combat, enemies, traps, renderer, game loop |
| 7 | MULTIPLAYER | 3648–4413 | Net adapter, session management |
| 8 | CHARACTER CREATOR | 4414–4838 | Pixel editor, PNG import, MP sprite sync |
| 9 | MAP SEED SYSTEM | 4839–5341 | Base62 codec, encode/decode |
| – | INVENTORY | 5341–5618 | Drag/drop slots, item icons |
| – | TOWN + PORTAL | 5618–5867 | goTown, leaveTown, presence, portal system |
| 10 | INIT | 5868–5877 | buildEdPalette, refreshHub, goTown |

---

## 3. Architecture Overview

### 3.1 Rendering

- Canvas 2D, no WebGL
- Tile size: `T = 24px`
- Viewport: `VW=700, VH=420` (fixed, not window-sized)
- Camera tracks local player with shake support (`gShakeX/Y`)
- Z-sorting: entities sorted by `wy` before drawing (painter's algorithm)
- Game loop: `requestAnimationFrame`, `gFrame` increments every tick
- `gLoopGen` counter: each `startGameLoop()` call increments `gLoopGen`. Each loop closure captures `myGen` and returns early if `myGen !== gLoopGen`. This kills stale loops reliably without relying on `cancelAnimationFrame` alone.

### 3.2 Delta-time system

Added in Session 4. All movement and timer decrements are multiplied by `dt`:

```js
const dt = gLastTS === 0 ? 1 : Math.min(Math.max((now - gLastTS) / (1000/60), 1), 2.5);
gLastTS = now;
gLastDt = dt; // module-level, used by systems outside the loop closure
```

- `dt = 1.0` at 60fps (baseline, identical to original frame-count behaviour)
- `dt = 2.0` at 30fps (timers expire in same real time)
- Clamped to minimum 1.0 — ensures 60fps+ displays don't slow the game
- Clamped to maximum 2.5 — prevents spiral of death after tab was backgrounded
- `gLastDt` is used by standalone functions (`mpCheckEnemyAttacks`, particle system, camera shake) that are not inside the loop closure

**Critical:** All `===0` comparisons on float timers must be `<=0`. Timer decrements must use `dt` or `gLastDt`. Functions called from outside the loop closure must use `gLastDt`, not `dt`.

### 3.3 Performance fixes (Session 4)

- **Tab hidden:** `if(document.visibilityState==='hidden') return early` — no CPU when backgrounded
- **Firebase delta checks:** `sendInput` and `townSendPresence` skip writes when state unchanged since last send
- **gFrame replaces Date.now():** All animation pulses in render path use `gFrame * constant` — no system calls per frame

---

## 4. Core Game Systems

### 4.1 Tile system

```js
TILE_VOID  = 0  // black, impassable
TILE_FLOOR = 1  // walkable
TILE_WALL  = 2  // impassable
TILE_EXIT  = 5  // walkable, triggers dungeon complete
```

`gIsWalk(tx, ty)` returns true for FLOOR and EXIT only.
`gRebuildNav()` builds `gBlocked` (Uint8Array) — marks walls, destructibles, fire traps as impassable. Call whenever nav graph changes.

### 4.2 Player state

```js
{
  wx, wy,           // world position (pixels)
  r: 11,            // collision radius
  hp, maxHp: 100,
  iFrames,          // invincibility frames (float, decremented by dt)
  dead,
  angle,            // aim angle (radians, toward mouse)
  charging, chargeTick,
  swinging, swingTimer, swingCooldown, swingDir,
  _pendingSwing,    // input buffer: queued normal swing
  _pendingCharge,   // input buffer: queued charge
  _pendingAngle,    // aim angle captured at click time
  wwActive, wwCooldown, wwTargeting,
  bowChargeTick, bowCooldown, rollActive, rollTick, rollCooldown,
  equipment,        // { weapon, helmet, chest, gloves, boots }
  kills,
}
```

### 4.3 Input buffering (sword)

Added Session 5. Clicking during swing/cooldown queues the action:

- **Quick click during busy:** `_pendingSwing=true`, `_pendingAngle` captures aim at click time
- **Hold LMB during busy:** `_pendingCharge=true`
- **Consumed in `gUpdatePlayer`:** The instant `swingCooldown<=0`, pending action fires
- `gDoSwingAt(angle)` — fires swing at a specific captured angle (direction preserved from click time)
- Charge accumulates during cooldown (not just when cooldown=0) — charge begins building immediately

### 4.4 Weapons

**Active weapon:** `gActiveWeapon` ('sword' | 'bow'). `W()` returns `WeaponRegistry[gActiveWeapon]`.

**Sword:**
```js
swingDur: 24, swingCd: 30, chargeMax: 50,
baseDamage: 18, maxDamage: 36,
wwRange: 180, wwSpeed: 7, wwRadius: 36, wwDamage: 22, wwCooldown: 120
```

**Bow:**
```js
spreadAngle: 0.524, arrowDamage: 15, arrowDamageMax: 28,
arrowSpeed: 5.5, arrowLife: 110, chargeMax: 55, shotCooldown: 22,
rollSpeed: 7.5, rollDuration: 16, rollIFrames: 16, rollCooldown: 80
BOW_FULL_RATIO = 0.85  // charge ratio for power shot
```

Bow arrows: hold LMB to charge. Below BOW_FULL_RATIO: 3-arrow spread (converges with charge). At BOW_FULL_RATIO+: single power shot (gold, higher damage, 100% pierce).

`gPlayerArrows[]` — player arrows only, never interact with `gArrows[]` (enemy arrows).
`MP_FRIENDLY_FIRE = false` — player arrows tagged `fromPlayer:true`/`fp:1`.

### 4.5 Combat

- **Sword swing:** `gDoSwing()` / `gDoSwingAt(angle)` — arc hit via `pInArc()`
- **Charge swing:** Hold LMB, `gReleaseCharge()` — scaled damage by charge ratio
- **Whirlwind:** SPACE → `gStartWhirlwind()` → `gUpdateWhirlwind(p, dt)` — dash with hit radius
- **Bow:** `bowStartCharge()` / `bowRelease()` / `bowUpdate(p, dt)`

Hit detection for MP:
- Local player damage applied immediately (client-side responsiveness)
- Enemy damage: `Net.sendHits([{idx, dmg}])` → host applies
- Destructible breaks: `Net.sendHits([{destructIdx}])` → host applies + syncs

### 4.6 Collision pipeline

**Every entity movement must apply all three, in order:**
```js
let [x,y] = gRC(wx, wy, r);
[x,y] = gRCDestructibles(x, y, r);
[x,y] = gRCTraps(x, y, r);
```
Missing any step causes phasing. Applies to: player (normal), player (whirlwind), goblin, archer, warrior.

### 4.7 Fire trap system

Timing now uses `performance.now()` (wall clock) — same on all peers, no drift:

```js
FIRE_PERIOD = 4000  // ms — 4s full cycle
FIRE_HALF   = 1000  // ms — 1s on, 3s off
trap.on = ((performance.now() + trap.phaseOffset) % FIRE_PERIOD) < FIRE_HALF;
phaseOffset = phase * FIRE_PERIOD  // ms offset (phase: 0, 0.25, 0.5, 0.75)
```

`FIRE_IFRAMES = 60` (frame units, decremented by dt) — 1 hit per second max.
`FIRE_DMG_VAL = goblin.meleeDamage * 3`
`FIRE_RANGE = 7` tiles beam travels.

Traps are solid — included in `gRebuildNav()` and `gRCTraps()`.

### 4.8 Enemies

**Goblin Grunt:**
```js
hp:30, radius:10, speedMin:0.385, speedRange:0.14,
meleeDamage:8, meleeCooldown:80, activationRange:300
```

**Goblin Archer:**
```js
hp:22, radius:10, arrowDamage:12, arrowSpeed:4.8, arrowLife:90,
attackCdMin:110, attackCdRange:40, preferredDist:150, retreatDist:90
```

**Goblin Warrior (added Session 5):**
```js
hp:80, radius:11, speedMin:0.30, speedRange:0.08,
swingDamage:16, swingWindup:30, swingArc:1.6, swingRange:52,
chargeDamage:24, chargeWindup:48, chargeRange:6*24, chargeSpeed:6.5,
chargeDist:3*24,  // min distance to trigger charge vs swing
recoverTime:48, attackCdMin:90, attackCdRange:40, activationRange:320
```

**Warrior AI state machine:**
```
idle → swing-windup (0.5s) → executes → idle
idle → charge-windup (0.8s) → charging → recovering (0.8s) → idle
```

Attack selection: swing if dist ≤ 3 tiles, charge if dist > 3 tiles.
Charge uses direct position stepping (no vx/vy) to avoid wall escape bugs.
`isWarrior: true` — goblin loop must skip with `if(e.dead||e.isArcher||e.isWarrior)continue`.

**Common enemy loop guards:**
```js
// Goblin loop:  if(e.dead||e.isArcher||e.isWarrior)continue;
// Archer loop:  if(e.dead||!e.isArcher)continue;
// Warrior loop: if(e.dead||!e.isWarrior)continue;
// mpCheck:      if(e.dead||e.isArcher||e.isWarrior)continue;
```

**Targeting:**
- `eNearestTarget(e, idx)` — caches for 12–19 frames, staggered by index
- `eAnyPlayerNear(ex, ey, range)` — checks ALL players, bypasses cache (used for activation)
- `mpNearestTarget(ex, ey)` — finds closest player (local + remote)

**Pathfinding:** A* (`gAstar`), recalculated every `PATH_INT=50` frames or when target changes.

### 4.9 Separation pass

At end of `gUpdateEnemies()`:
```js
// Enemy vs player
for(const e of gEnemies) { gSep(e, gPlayer) → push apart }
// Enemy vs enemy
for(i,j pairs) { gSep(ei, ej) → push apart symmetrically }
```

### 4.10 Destructibles / potions

- Barrels, crates: hp:1, break on any hit
- 10% chance to drop potion on break (`gMaybeDropPotion`)
- Potion heals 50% maxHp instantly
- `mpSyncDestructibles()` / `mpSyncPotions()` — event-driven, called at every break/pickup site

### 4.11 Inventory system

- Overlay (I key): left panel = character preview + 5 equipment slots, right panel = 3×3 grid
- Drag-and-drop between slots
- Q quick-swaps weapons
- `gEquipment` object tracks equipped items
- `gActiveWeapon` updated when weapon slot changes

---

## 5. Hub World (The Sanctum)

### 5.1 Overview

The Sanctum is the persistent hub world players enter on page load. It runs on the same `game` screen and game loop as dungeons, gated by the `inTown` boolean.

```js
let inTown = false;  // true when in Sanctum, false when in dungeon
```

### 5.2 Key functions

- `goTown()` — sets `inTown=true`, loads HUB_MAP, calls `showScreen('game')`, starts presence
- `leaveTown()` — sets `inTown=false`, resets portal/presence state, cancels loop
- `townSendPresence()` — writes position to `hub/players/{LOCAL_ID}` every 3 frames (delta-checked)
- `townDrawHubPlayers()` — renders remote hub players from `hubPlayers{}` object
- `townDrawPortal()` — renders portal arch glow at `(19.5*T, 5*T)`

### 5.3 Portal system

- `portalCheckProximity()` — checks distance from player to portal centre (PORTAL_RADIUS = 3 tiles)
- `portalDrawPrompt()` — "[E] ENTER DUNGEON" prompt when near
- `portalOpenOverlay()` — opens dungeon selection UI (E key when nearby)
- `portalEnterDungeon(m)` — loads selected map; if MP host, calls `mpStartGame()`; if solo, loads directly

ESC key priority in Sanctum: portal overlay → hub overlay → inventory → open hub menu (never pause screen).

### 5.4 inTown guards

These systems check `inTown` and behave differently:
- `gRender()` — skips fog/vignette when `inTown=true`, draws portal/hub players
- `mousedown` handler — blocks attacks when `inTown`
- Spacebar handler — blocks dodge/WW when `inTown`
- `inTown=false` must be set before `gameLoad()` for dungeon maps — otherwise enemies won't update

---

## 6. Multiplayer Architecture

### 6.1 Transport

Firebase Realtime Database. All network I/O goes through `Net` object — swapping to WebSocket requires zero changes to game logic.

```
Phase 1 (current):  Firebase Realtime DB, host-authoritative
Phase 2 (planned):  WebSocket server, server-authoritative
```

### 6.2 Identity

```js
LOCAL_ID   // persistent localStorage UUID — hub presence, character data
SESSION_ID // random per tab (page load) — MP room player key
```

SESSION_ID prevents two tabs on the same machine (sharing localStorage) from being treated as the same player. `pid === MP.localId` correctly skips self because each tab has a unique SESSION_ID.

### 6.3 MP room flow

**Host:**
1. `mpHost()` → `Net.host(code, HUB_MAP)` → `_mpSanctumLaunch()` → enters Sanctum
2. Host approaches portal → `portalEnterDungeon()` → `mpStartGame(mapData)`
3. `Net.start()` writes `{started:true, map, startFrame}` atomically via `.update()`
4. `_mpLaunch(mapData)` loads dungeon on host

**Client:**
1. `mpJoin()` → `Net.join(code)` → `_mpClientStart(room)`
2. If `room.started=false`: `_mpSanctumLaunch()` + `Net.onStart()` listener → waits
3. If `room.started=true`: `_mpLaunch(mapData)` directly
4. `Net.onStart()` watches full room doc (not just `started` field) — guarantees map is present in same snapshot (atomic write)

**Critical:** `Net.onStart` must watch `rooms/{id}` (full room), not `rooms/{id}/started`. The full room snapshot guarantees `map` and `started` arrive together. Separate field writes can race.

### 6.4 Data paths

```
rooms/{id}/
  world/
    enemies           ← 8hz, host writes Net.sendEnemies()
    arrows            ← 8hz, host writes (enemy arrows only)
    player-arrows     ← 8hz, host writes (player arrows only)
    destructibles     ← event-driven, mpSyncDestructibles()
    potions           ← event-driven, mpSyncPotions()
  players/{SESSION_ID} ← 20hz, each player writes own input (delta-checked)
  hits/               ← push() per hit report
  sprites/{SESSION_ID} ← once on join
  startFrame          ← gFrame at game start
  started             ← written atomically with map via .update()
  map                 ← JSON map data
hub/players/{LOCAL_ID} ← 20hz when inTown (delta-checked)
```

### 6.5 Game loop integration

`mpTick()` called every frame when `MP.active`:
- `Net.sendInput()` — 20hz, delta-checked (skips if position/state unchanged)
- `Net.sendEnemies()` — 8hz, host only
- `Net.sendArrows()` — 8hz, host only

### 6.6 gLoopGen (loop generation counter)

```js
let gLoopGen = 0;
function startGameLoop() {
  const myGen = ++gLoopGen;
  function loop(now) {
    if(myGen !== gLoopGen) return; // stale loop — self-terminates
    ...
  }
}
```

Prevents duplicate loops from racing. `leaveTown()` + `showScreen('game')` each cancel the previous loop — `gLoopGen` ensures stale closures die even if their rAF frame was already queued.

---

## 7. Map System

### 7.1 Map data format

```js
{
  id: string,           // unique, used as localStorage key
  name: string,
  width: number,
  height: number,
  rows: string[],       // 'W'=wall, 'F'=floor, 'E'=exit
  entities: [{kind, tx, ty, ...}],
  createdAt: number,
  updatedAt: number,
}
```

### 7.2 Seed format

```
DF1:<base62 payload>
```

Binary payload: `[width, height, tile RLE pairs..., entity records (3 bytes each)]`

`SEED_ENTITY_KINDS` — append-only array. Never reorder. New kinds go at end:
```
0:player  1:goblin  2:archer  3:barrel  4:crate  5:torch
6-9: fire N/S/E/W phase 0%    10-13: phase 25%
14-17: phase 50%               18-21: phase 75%
22: warrior
```

### 7.3 testPlay (editor)

`testPlay()` auto-saves to localStorage before loading — ensures hub Play button reflects current editor state. Call from editor toolbar, not from hub portal (portal reads from localStorage).

---

## 8. Map Editor

- `editorLoad(mapData)` — loads data only, does NOT touch canvas
- `edCentreView()` — must be called AFTER `showScreen('editor')` (canvas needs real dimensions)
- `edApply(tx, ty, erase)` — places/erases at tile coords, sets TILE_FLOOR under entities
- `saveMap()` — persists to localStorage
- `mapDataFromEditor()` — serialises editor state

Fire trap editing: left-click cycles direction, shift+click cycles phase.

Editor entity palette: `ENTITY_PAL` array + `iconFns` object — warrior was added to both (previous bug: warrior in `iconFns` but missing from `ENTITY_PAL`).

---

## 9. Sprites & Registries

### 9.1 Sprite system

```js
SpriteRegistry.register(id, canvas, scale)
SpriteRegistry.get(id)  // returns {canvas, scale}
```

Sprites built from 16×16 pixel arrays using `bsc(px)` (build sprite canvas).

Current sprites: `player`, `goblin`, `archer`, `warrior`

Warrior sprite uses colour palette `Wc` — dark green armour, red eyes, grey sword.

### 9.2 WeaponRegistry

`W()` returns `WeaponRegistry[gActiveWeapon]`. All timing values in frame-units (decremented by dt).

### 9.3 EntityDefs

All enemy stats. Pattern for adding new enemy:
1. Add to `EntityDefs`
2. Add factory function `makeXEnt(tx, ty)`
3. Add AI block in `gUpdateEnemies()` with correct `isX` guard
4. Add draw function `gDrawX(e)` and wire into drawables dispatch
5. Add to `ENTITY_PAL` and `iconFns`
6. Add to `gameLoad()` entity loop
7. Add to `SEED_ENTITY_KINDS` (append only)
8. Skip in `mpCheckEnemyAttacks` if host-authoritative

---

## 10. Character Creator

16×16 pixel editor. Features:
- Paint/fill/erase/flip tools
- 28 colour presets + custom hex + PNG import
- Named character library in `localStorage('df_characters')`
- `ccPixelsToCanvas()` — converts pixel array to canvas
- Player sprite synced to all peers on join via `rooms/{id}/sprites/{SESSION_ID}`

Custom enemy sprite editing: **not yet implemented.** The CC currently only edits the player sprite. Extension plan: dropdown to select Player/Goblin/Archer/Warrior, load/save wired to appropriate sprite registration.

---

## 11. Architecture Roadmap

### Phase 0 — Current (complete)
Single HTML file. Firebase multiplayer. 1–4 players.

### Phase 1 — Vite + file split (in progress)
- ✅ Project structure created, files split into 12 source files
- ✅ `package.json` + `vite.config.js` set up
- ❌ Not yet tested running from split files
- ❌ ES modules (`import`/`export`) not yet added
- ❌ Sprite PNG pipeline not yet added
- ❌ GitHub Actions CI/CD not yet set up

### Phase 2 — Dedicated game server (1–4 player co-op, launchable)
```
Browser ──WebSocket──► Node.js Game Server (authoritative loop)
                              │
                         PostgreSQL (accounts, maps, progress)
```
- Replace Firebase with WebSockets
- Server runs game loop (headless — no rendering)
- Player accounts (JWT auth)
- Map storage in database
- Host: ~$10–20/month (Fly.io / Railway)
- **This is the launchable milestone**

### Phase 3 — Content + polish
- Real sprite editor (external tool → PNG → upload)
- Map sharing by URL
- Basic progression (XP, levels)
- Workshop: share custom dungeons publicly

### Phase 4 — Open world (100–500 players)
```
Browser ──WebSocket──► Load Balancer
                    Zone servers (each ~100 CCU)
                    Redis pub/sub (inter-zone)
                    PostgreSQL (persistence)
```
- Spatial partitioning by zone
- Interest management (only nearby entities sent)
- Seamless zone handoff
- Host: ~$100–500/month depending on CCU

---

## 12. Known Bug Patterns

### 12.1 Stale game loops
**Symptom:** Game runs at half speed or double speed, two loops fighting.
**Cause:** `startGameLoop()` called twice (e.g. `showScreen('game')` + explicit call).
**Fix:** `showScreen('game')` always calls `startGameLoop()` internally. Never call it separately. `_doRespawn` is the only exception — it explicitly cancels first.
**Detection:** `gLoopGen` counter — each loop checks `myGen !== gLoopGen` and self-terminates.

### 12.2 Warrior spawning outside map
**Cause:** Placed on wall tile in editor. Editor sets TILE_FLOOR under entity, but `gRC` pushes warriors into adjacent void if surrounded by walls.
**Fix:** Always place warriors on floor tiles with open adjacent tiles.

### 12.3 Warrior processed by goblin loop
**Cause:** Goblin loop guard was `if(e.dead||e.isArcher)continue` — warriors passed through.
**Fix:** `if(e.dead||e.isArcher||e.isWarrior)continue` in goblin loop.

### 12.4 dt not defined in standalone functions
**Cause:** `dt` is a local variable inside the `loop(now)` closure. Functions called from outside (e.g. `mpCheckEnemyAttacks`) can't access it.
**Fix:** Use `gLastDt` (module-level, updated every frame) in standalone functions.

### 12.5 Net.onStart race condition
**Cause:** Three separate Firebase writes (startFrame, started, map) could arrive in any order. Client reads started=true but map field still has old value.
**Fix:** `Net.start()` uses `.update({startFrame, map, started})` — atomic write. `Net.onStart()` watches full room doc, not just `started` field.

### 12.6 MP players invisible to each other
**Cause:** Both tabs share localStorage on same machine → same `LOCAL_ID` → `pid === MP.localId` filters out the other player.
**Fix:** `SESSION_ID` generated fresh with `Math.random()` per tab — used as MP room player key. `LOCAL_ID` kept for hub presence only.

### 12.7 Joining player stuck in Sanctum
**Cause:** Two loops running simultaneously due to `startGameLoop()` called twice in `_mpSanctumLaunch()`. `leaveTown()` cancelled the newer loop's ID, but older loop's rAF was already queued and rescheduled itself.
**Fix:** Removed duplicate `startGameLoop()` call. `showScreen('game')` handles it.

### 12.8 Hit reports overwritten
**Cause:** `.set()` on `rooms/{id}/hits/{localId}` — multiple hits overwrite each other.
**Fix:** `.push()` generates unique key per report, `child_added` fires every time.

### 12.9 MP players not visible (general)
**Debug checklist:**
- Check `MP.players` — is the remote player's key present?
- Check `_onPlayerAdded` fires — does `pid !== MP.localId` pass?
- Check `p.wx != null` — is position data arriving?
- Viewport cull in `drawAnyPlayer`: `if(sx<-60||sx>VW+60||sy<-60||sy>VH+60)return`

---

## 13. Code Modification Protocol

### Step 1 — Read before touching
```bash
grep -n "functionName\|CONSTANT" dungeon_forge.html | head -20
sed -n 'START,ENDp' dungeon_forge.html
```

### Step 2 — Targeted changes
Use `str_replace` for surgical edits. Make the minimum change needed.

### Step 3 — Verify syntax after every change
```js
node --input-type=module << 'EOF'
import { readFileSync } from 'fs';
const h = readFileSync('/mnt/user-data/outputs/dungeon_forge.html','utf8');
const s = [...h.matchAll(/<script(?! src)(?![^>]*type="module")>([\s\S]*?)<\/script>/g)];
try { new Function(s[1][1]); console.log('JS OK'); }
catch(e) { const ln=e.lineNumber||0; console.log('ERROR:', e.message);
  const lines=s[1][1].split('\n'); console.log(lines.slice(Math.max(0,ln-2),ln+2).join('\n')); }
EOF
```

### Step 4 — Invariant checklist

**New enemy type:**
- [ ] `EntityDefs` entry with all stats
- [ ] Factory `makeXEnt(tx, ty)` with `speed` field
- [ ] AI block in `gUpdateEnemies` with `isX` flag guard on all three loops
- [ ] `gDrawX(e)` wired into drawables dispatch (`e.isX?gDrawX(e):...`)
- [ ] `ENTITY_PAL` entry
- [ ] `iconFns.x` entry
- [ ] `gameLoad()` entity loop: `if(e.kind==='x') gEnemies.push(makeXEnt(e.tx,e.ty))`
- [ ] `SEED_ENTITY_KINDS` append (never insert)
- [ ] `mpCheckEnemyAttacks` skip: `if(e.isX)continue`

**New multiplayer system:**
- [ ] Own Firebase path under `rooms/{id}/world/x`
- [ ] `mpSyncX()` called at every state-change site
- [ ] `Net._onXUpdate(snap)` handler
- [ ] Listener registered in `Net.join()` with `Net._on(...)`
- [ ] `_prevXState` declared and reset in both launch sites

**Collision change:**
- [ ] All movement sites updated: player, whirlwind, goblin, archer, warrior
- [ ] Full chain called: `gRC → gRCDestructibles → gRCTraps`

---

## 14. Key Constants

```js
// Map
T = 24                  // tile size px

// Player
maxHp = 100
iFrames = 50            // after melee hit (frame units, decremented by dt)

// Sword (WeaponRegistry.sword)
swingDur: 24, swingCd: 30, chargeMax: 50
baseDamage: 18, maxDamage: 36
wwRange: 180, wwSpeed: 7, wwRadius: 36, wwDamage: 22, wwCooldown: 120

// Bow (WeaponRegistry.bow)
spreadAngle: 0.524, arrowDamage: 15, arrowDamageMax: 28
arrowSpeed: 5.5, arrowLife: 110, chargeMax: 55, shotCooldown: 22
rollSpeed: 7.5, rollDuration: 16, rollIFrames: 16, rollCooldown: 80
BOW_FULL_RATIO = 0.85

// Fire traps
FIRE_PERIOD = 4000      // ms
FIRE_HALF   = 1000      // ms
FIRE_RANGE  = 7         // tiles
FIRE_IFRAMES = 60       // frame units

// Potions
POTION_DROP = 0.10, POTION_HEAL = 0.5, POTION_RADIUS = 10

// Multiplayer
MP_INPUT_HZ = 20, MP_ENEMY_HZ = 8
MP_LERP_SPEED = 0.18, MP_MAX_PLAYERS = 4
MP_FRIENDLY_FIRE = false

// Identity
LOCAL_ID   // persistent localStorage UUID (hub presence)
SESSION_ID // random per tab page load (MP room player key)
```

---

## 15. Design Principles

1. **Event-driven over polling** — discrete state changes (destructibles, potions) sync on event, not timer
2. **Wall-clock timing for sync** — `performance.now()` for fire traps (same on all peers, no drift)
3. **Host-authoritative, client-responsive** — clients apply visuals immediately, host owns truth
4. **Append-only registries** — `SEED_ENTITY_KINDS` never reordered, new entries at end
5. **One system, one Firebase path** — never bundle unrelated data into the same write
6. **Read before writing** — always grep and view exact current code before replacing
7. **Verify after every change** — JS syntax check after every modification
8. **Minimum viable change** — smallest change that fixes the problem
9. **SESSION_ID for MP, LOCAL_ID for identity** — never swap these
10. **showScreen('game') owns startGameLoop()** — never call startGameLoop() separately unless explicitly cancelling first

---

## 16. Planned / Not Yet Implemented

- Enemy sprite editor in Character Creator
- Custom sprite upload pipeline (PNG → localStorage → SpriteRegistry)
- Goblin Warrior sprite polish (placeholder pixel art currently)
- Host migration on disconnect
- Additional enemy types (Skeleton, Troll, Shaman)
- Loot drops beyond health potions (chests, weapons, armour)
- Doors, switches, environmental puzzles
- Player progression (XP, levels, unlocks)
- Party/guild system
- Phase 2: WebSocket server, player accounts, PostgreSQL
- Phase 4: Zone-based open world, 100–500 CCU

---

*Sessions 1–5 — April 2026*
*Active working file: `dungeon_forge.html` (~5,892 lines)*
*Split project: `dungeon-forge/` (Vite, 12 source files — Phase 1 in progress)*
