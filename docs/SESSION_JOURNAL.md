# Dungeon Forge — Session Journal
**Append-only log of sessions, decisions, and hard-won debugging lessons**

Each entry captures: what was built, what broke badly, and what the root cause taught us. The debugging lessons are the most portable value — they represent understanding that cannot be derived from the code alone.

---

## Sessions 1–8 (Pre-Journal)
*Reconstructed from transcript index*

Built: sword combat, dungeon editor, enemy AI (goblin/archer/warrior/bomber/king), multiplayer via Firebase, hub world (The Sanctum), bow weapon, mana system, whirlwind/leap/dash/heavy abilities, skill hotbar, delta-time refactor, wilderness mode foundation (map generation, fog of war, minimap, XP/levelling, day/night, threat scaling, horde/patrol spawning, obelisk POIs).

**Lesson:** The EnemyRegistry dispatch uses `flagProp: null` for goblin with an exclusion list. Any new enemy type not added to that list will run both its own AI and goblin AI simultaneously. This has caused double-movement bugs on multiple new enemy types.

**Lesson:** `_wildScaleEnt` returns early if `!inWilderness`. Enemy stats set by this function are only scaled in wilderness — dungeon enemies use raw EntityDefs values. If `hp` is missing from EntityDefs, `undefined <= 0` is `false` in JS, making the enemy unkillable.

---

## Session 9 — Wilderness Expansion
*June 2026 | ~11,521 lines*

### Built
- Goblin Village system (3–4 per map, spike fences, huts, campfires, chests, aggro radius)
- Goblin Shaman enemy (fireball w/ homing + burn DoT, buff incantation with channel animation)
- TILE_SPIKE and TILE_HUT tile types with custom draw routines
- Fog of war (Uint8Array, 30-tile day / 12-tile night), circular minimap (120px), TAB full-map overlay
- Shrine system: diamond floor tiles with scatter fringe, patron god selection menu (4 gods w/ base64 portraits), god portrait on level-up screen
- MOBA-style skill unlock system (skill points, click or CTRL+hotkey to unlock)
- Bomb fire zones (lingering AoE after explosion, non-stacking DoT)
- Performance pass: spatial grid separation, dead enemy purge every 10 frames, particle batching
- Universal `isHeld` hold-position AI (replaces both `isVillage` and `isShrineGuard`)
- Shrine guardian goblins (3 per shrine, hold position, aggro within 7 tiles)
- Progress bar timeline with skull markers at 10/20/30 min

### Bugs Fixed This Session

**Goblin bomber unkillable (final root cause)**
- *Symptom:* Bomber spawns with empty health bar, takes hits but never dies
- *Red herrings:* Shaman buff rounding drift, hitFlash iFrames, MP.active state
- *Root cause:* `hp` field missing from `EntityDefs.bomber`. `makeGoblinEnt` sets `hp: d.hp` → `undefined`. `undefined <= 0` is `false` in JS, so the death condition never triggers regardless of damage dealt.
- *Lesson:* When an enemy is unkillable from spawn with an empty health bar, check EntityDefs before anything else.

**Duplicate `gDoSwing` function declaration**
- *Symptom:* Damage scaling (STR bonuses, obelisk buffs) never applied to sword damage
- *Root cause:* Two `function gDoSwing()` declarations in the file. JS function declarations hoist and the second silently overwrites the first. The first (correct) version calculated `_chargeDmg` with all multipliers. The second stub just called `gDoSwingAt()` without setting `_chargeDmg`.
- *Lesson:* When a scaling system appears wired but has no effect, check for duplicate function declarations. `node --check` passes with duplicates — they are not a syntax error.

**Shaman buff making enemies unkillable**
- *Symptom:* Buffed enemies could not be killed even after HP appeared at zero
- *Root cause:* `Math.round(round(x * 1.5) / 1.5) ≠ x` for small integers. Bomber base HP 15 → `round(15 * 1.5) = 23` → `round(23 / 1.5) = 15`... usually fine. But the real bug: buff expiry ran on the same frame as a new buff application (timer hits 0, `_shamanBuff=false`, then `_shamanCastBuff` checks `if(ally._shamanBuff) continue` — false — and re-applies). `maxHp *= 1.5` twice.
- *Fix:* Store `_shamanBaseMaxHp` at buff application, restore exactly on expiry. Kill enemy if `hp <= 0` after expiry.
- *Lesson:* Buff systems that modify maxHp must store original values, not divide back. Division of rounded integers is lossy.

**Village enemies despawning before player arrives**
- *Symptom:* Villages always empty when discovered
- *Root cause:* 85-tile despawn radius ran on all non-patrol enemies. Villages can spawn up to 200+ tiles from player spawn. All village enemies were silently deleted on the first frames of the run.
- *Fix:* `isHeld=true` exempts enemies from despawn. Cleared on alert.
- *Lesson:* The despawn system is invisible — always check it when enemies disappear unexpectedly.

**Goblin AI double-running on shaman**
- *Symptom:* Shaman moves toward player despite `_aiShaman` telling it to stand still
- *Root cause:* `isShaman` missing from goblin AI exclusion list in EnemyRegistry dispatch. Both `_aiGoblin` and `_aiShaman` ran every frame. Goblin AI won.
- *Lesson:* Every new enemy type must be added to the goblin exclusion list: `(e.isArcher||e.isWarrior||e.isBomber||e.isKing||e.isShaman||...)`.

**Spike fence appearing as solid wall**
- *Symptom:* Circular fence instead of broken groups
- *Root cause:* The 360-degree loop generated 360 positions but only ~75 unique perimeter tiles. Each tile was visited 4–5 times. The run/gap counter advanced on duplicate visits, making the pattern incoherent.
- *Fix:* Deduplicate perimeter tiles first using a `Set`, then apply run/gap pattern to unique list.
- *Lesson:* When generating patterns on circular perimeters, always deduplicate tile positions before applying sequence logic.

**Shrine not spawning (maxDist bug)**
- *Symptom:* No shrine visible in full-map overlay after multiple runs
- *Root cause:* `maxDist = min(470, min(spawnX, W-1-spawnX, spawnY, H-1-spawnY) - SHRINE_MARGIN - 10)`. With spawn at (300,150) on a 600×300 map, min edge distance is 149 tiles. After margins: `maxDist = min(470, 149-20) = 129`. Shrine was capped to 30–129 tiles from spawn, often landing inside village exclusion zones. After 400 attempts all failed silently.
- *Fix:* Remove `maxDist` clamping entirely. Use cx/cy clamping after position calculation instead — any distance works since we clamp to map bounds anyway.
- *Lesson:* When a generator uses both distance-based candidate selection AND post-generation clamping, the distance cap is redundant and often causes silent failure. Trust the clamp.

**`pointer-events:none` blocking skill bar clicks**
- *Symptom:* Clicking skill slots had no effect even with correct JS click handlers
- *Root cause:* The `#skill-bar` container had `pointer-events:none` in its inline style, blocking all mouse events to children despite child slots having `pointer-events:all`.
- *Lesson:* When click handlers are attached and verified but don't fire, check parent container `pointer-events` before debugging the handler.

**`villageEntities` reference before initialization**
- *Symptom:* `ReferenceError: villageEntities is not defined` on wilderness entry
- *Root cause:* Row-building code (step 7 in map generator) iterated `villageEntities` before the `const villageEntities = []` declaration in step 8.5. `const` does not hoist.
- *Lesson:* In large procedural generator functions, declaration order matters. When steps reference data from later steps, move the declaration to before the earliest reference.

**`beforeunload` not triggering on CTRL+W**
- *Symptom:* Browser closed immediately without confirmation dialog
- *Root cause:* Conditional `if(inWilderness)` guard caused the browser to treat the handler as non-blocking. Browsers require `beforeunload` to **always** set `e.returnValue` to register it as a blocking handler.
- *Fix:* Make `beforeunload` unconditional — always set `e.preventDefault()` and `e.returnValue`.
- *Lesson:* `beforeunload` must be unconditional to be respected. A conditional guard that sometimes does nothing causes the browser to pre-classify the handler as non-blocking.

**Scatter fringe not appearing on shrine**
- *Symptom:* Sharp-edged diamond, no feathered fringe
- *Root cause:* Hash used `seed*7` where seed is `Date.now()` (~1.78 trillion). Bitwise `& 0xffff` truncates to 32-bit integer, causing overflow and near-constant hash values.
- *Fix:* `((tx*2999)^(ty*6571)) >>> 0` — XOR of large prime multiples of tile coords, no seed dependency.
- *Lesson:* Never use `Date.now()` in bitwise operations. It overflows 32-bit integer precision. Use tile coordinate hashes instead.

---

## Debugging Heuristics Reference

| Symptom | First thing to check |
|---------|---------------------|
| Enemy unkillable from spawn | Missing `hp` in EntityDefs |
| Enemy has wrong AI / double movement | `isXxx` missing from goblin exclusion list |
| Scaling/buff has no effect | Duplicate function declaration |
| Enemies missing when area discovered | Despawn radius + `isHeld` flag |
| Click handler fires but nothing happens | Parent `pointer-events:none` |
| Generator produces wrong pattern on circles | Duplicate tile positions before sequence logic |
| `const` variable undefined at runtime | Declaration order — `const` does not hoist |
| `beforeunload` not showing dialog | Handler must be unconditional |
| Bitwise hash gives constant values | `Date.now()` overflows 32-bit |
| Buff system makes enemies unkillable | maxHp division of rounded integers; store original |

---

## Architecture Decisions Log

| Decision | Rationale | Session |
|----------|-----------|---------|
| Single HTML file | Portability, no build step, easy Claude.ai deployment | 1 |
| EnemyRegistry pattern | Decouples AI dispatch from entity creation, easy to add types | 7 |
| `isHeld` universal hold-position | Replaces `isVillage` + `isShrineGuard` redundancy | 9 |
| `gBombFireZones` separate array | Bombs and fire are separate lifecycles; don't mix | 9 |
| Skill points on player object | Persists across level-up screen close, accessible anywhere | 9 |
| `_shamanBaseMaxHp` stored on entity | Avoids rounding drift on buff expiry | 9 |
| Shrine always visible on minimap | Player needs to locate it; fog-gating would make it unfindable | 9 |
| `beforeunload` unconditional | Conditional guards are pre-classified as non-blocking by browsers | 9 |
