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

## Session 10 — Art Pass: Tile & FX Sprites
*June 2026*

### Built
- Image-based **tile art** wired through `ART_MANIFEST` → `gArtReg` → `gTileArt`: stone
  dungeon floors (`tile.floor.*`) and dirt (`tile.dirt.*`), sliced from 2×2 source sheets
  and baked to device tile size (`gRebakeTiles`).
- **Fire-wave sprite** (`FW_SPR`) for Cilia's imbued normal attack — black-background flame
  crescent blitted additively (`'lighter'`), convex edge leading the travel direction,
  scaled to the arc's lateral spread.
- Whirlwind now draws the `fx.slash` crescent; fire-pillar sprite 2×, ≥50%-charge gate with
  a red armed-telegraph, pillars start at 50% of the heavy's range.
- `tools/dev-window.ps1` + a personal PostToolUse hook: reopen the live-reload dev window if
  it's closed when `index.html` is edited (detects via the livereload websocket on port 5500).

### Bugs Fixed This Session

**Art tiles spawned in a uniform diagonal pattern**
- *Symptom:* 4-variant stone/dirt floors tiled in an obvious repeating diagonal
  (`0 1 2 3 / 3 2 1 0 …`), while 9-variant grass looked random.
- *Root cause:* `gTileArt` picked the variant with `((imul(tx,P1))^(imul(ty,P2)))>>>0 % n`.
  A multiplicative hash's low bits stay linear in (tx,ty); `% n` for n=4 (a power of two)
  reads only those low bits → a periodic pattern. Grass escaped it only because `% 9` mixes
  high and low bits.
- *Fix:* Select the variant from the shared `gWallVar` random table (the same source the
  procedural tiles use): `gWallVar[(ty*120+tx)%len] % n`. Widened `gWallVar` from `*4` to
  `*256` so it distributes for any variant count (256 is a multiple of 4 → the procedural
  `% 4` consumer stays uniform).
- *Lesson:* `hash % (power of two)` exposes the hash's low bits. For small variant counts use
  a real random table (or an avalanche finalizer) — never the raw low bits of a
  multiplicative hash.

**Dungeon FPS tanked after adding floor art**
- *Symptom:* Significant slowdown in dungeons once `tile.floor.*` art existed; wilderness fine.
- *Root cause:* `gDrawTile` wrapped every art tile in `imageSmoothingEnabled=true; …=false;`
  — two canvas state changes per tile. A dungeon viewport is ~100% `TILE_FLOOR`, so this ran
  ~1000×/frame; those tiles were previously cheap `fillRect`s. Tiles bake to device size, so
  the blit is already 1:1 and needs no smoothing at all.
- *Fix:* Drop the per-tile toggle; set `imageSmoothingEnabled=false` once per frame before the
  tile loop (the previous frame's sprite draws leave it `true`).
- *Lesson:* Toggling canvas state per-primitive in the densest draw loop is a silent perf
  killer. Hoist state out of hot loops; if tiles bake 1:1, don't smooth.

**Cutting character sprites from a turnaround sheet (Goblin King)**
- *Symptom 1:* Keying out a **black** background by brightness also punched holes in the
  King's internal shadows (between arm and body) — they're the same near-black as the bg.
- *Symptom 2:* A fixed equal-thirds crop of the 3×3 grid pulled neighbour figures (rows
  above/below) into the left/right side cells.
- *Symptom 3:* A thin white halo remained when keying a white-bg sheet (anti-aliased edge
  pixels kept their white-blended colour).
- *Fixes / lessons:*
  - Background of the **same colour family** as interior detail can't be keyed by brightness
    alone. Use an **edge-seeded flood fill** (remove only border-connected bg), or supply a
    **white** background and key on `min(R,G,B)` (shadows are dark → opaque, white → cut).
  - Don't assume an even grid — isolate each pose with **connected-component labeling** and
    use that blob's own mask, so a neighbour inside the crop rectangle isn't included.
  - Kill edge halos by defining the body mask a touch tighter (`min(R,G,B)<212`) so edges
    are body-coloured, then feather with a small alpha blur — never leave white-blended pixels.
- *Scaling note:* `KING_SCALE` (draw) is independent of `EntityDefs.king.radius` (body hitbox)
  and the attack-zone radii (`swipeRange`/`jumpRadius`/`spinRadius`). Resize all together;
  keep the body hitbox just inside the visible sprite for playability. Re-slice source frames
  at higher resolution when drawing much larger, or they upscale blurry.

---

## Session 11 — Imbued Warrior Skills + Balance & Doc Health

### Built
- Completed **Cilia's Fire** imbues for all four sword skills: whirlwind → expanding **fire ring**, leap → **fire cross** (X), dash → **fire trail** of burning ground (swing → fire wave and heavy → fire pillars already existed). Each follows one shape: a `gFire*` array + spawn/update/draw, damage via `gDealEnemyDamage` (MP-safe), reset on map load, wired into the loop.
- **Remote-peer visual sync** for all three: ring/cross use a per-player monotonic cast seq (`fr`/`fc`) on the player packet → `gSpawnRemote*` replays a `_visual` patch; trail uses a `df` dash-fire flag → peers drop `_visual` patches in `mpInterpolateRemotes`. `_visual` effects never damage, so no double-hit.
- New reusable turnaround slicer `tools/slice-turnaround.py`; Goblin Warrior 8-dir art; enemy/HP-bar/player-hitbox sizing pass.
- Adopted the **Engineering Charter** (`docs/ENGINEERING_CHARTER.md`) as the standing operating model; doc health pass fixed stale sandbox paths in the CTO doc and a contradicted single-file "constraint".

### Lessons
- **The on-hit flash drew a red BOX, not a tinted sprite.** `gDrawSprite` applied the tint with `globalCompositeOperation='source-atop'` directly on the main canvas — but the opaque tile background inside the sprite's bounding box is also "destination", so the whole box tinted. Fix: tint a sprite-shaped offscreen copy (transparent elsewhere) and blit that. The same bug produced the white dash box. **Rule: to recolour only a sprite, composite in an offscreen buffer — never `source-atop` on the shared canvas.**
- **"Goblins render at 50% of the player" wasn't the art.** Both fill ~96% of their frame and draw in an equal box; the player has a separate `PLAYER_DRAW_SCALE = 2` multiplier. **Rule: when comparing on-screen sizes, look for per-entity draw multipliers, not just the sprite/box.**
- **Overlapping ground hazards multi-hit.** Fire-trail patches drop every 18px with 26px reach (~3 deep); each had its own per-patch hit-cooldown, so an enemy on the trail took ~3× damage. **Rule: a field of overlapping same-source AoE patches needs ONE shared per-enemy cooldown (keyed off `gFrame`), not per-patch.**
- **Burn refreshes, it doesn't stack.** `gApplyEnemyBurn` uses `Math.max` on duration and tick damage — re-applying every tick just tops it up. Effects can re-ignite freely without compounding DoT.
- **Floor decal vs. over-entity FX:** draw ground hazards (fire cross/trail) on the `gDrawBombFireZones` layer *before* the entity pass so characters stand on them; pure flame bursts (ring/wave/pillars) draw after entities.
- **Black-bg vs. charred sprites:** pure-flame sprites (ring/cross) blit additively (`lighter`, black drops out); the "burning ground" sprite has a dark charred base, so key its black to transparency and draw source-over — additive would erase the char and overlapping patches would blow out to white.

---

## Session 12 — Nightfall Sieges, Multi-Imbue, Auto-Unlocks & the Card-Draft Core
*June 2026 | ~12,600 lines | engineer + PM (Telegram bot) handoff*

### Built
- **Nightfall Sieges** — replaced the hidden 90s threat faucet with the **day/night cycle as the
  difficulty clock**. Each night builds a **fixed roster** from a tunable table (`_wildSiegeRoster(n)`:
  goblins `10+5n`, archers/bombers/warriors/shaman unlocking by night, kings `min(5,⌊n/2⌋)`) and a
  **budget spawner** (`gWildSpawnTick`) trickles it across the night window, throttled by the live
  cap; leftover drops at dawn ("held the line"). `wildThreatLevel` now = night number (stat scaling
  steps once per nightfall). Day = lull. Then a pacing tune: 3-min day / 2-min night, **aggro**
  daytime patrol bands, `NIGHT_GRUNT_SCALE` so the longer night stays busier than the day.
- **Multi-imbue + level-gated shrine** — imbues went from a single `imbuedSkill` to a `gPlayer.imbues`
  map (skillId→patron); shrine re-arms every 5 levels (glows) to imbue another skill; town meditation
  is ungated. All read-sites route through one null-safe `gIsImbued(p, skill[, patron])`.
- **Automatic skill unlocks** — retired the `skillPoints` currency; skills unlock at fixed levels
  (`gWildSyncUnlocks`: dash@2 / whirl@3 / leap@4 / Grit@5; swing+heavy from L1).
- **Card-draft Core** (3 staged increments): (1) per-player `skillMods` + `pSkillStat`; (2) deleted
  STR/DEX/INT, level-up is a rarity card draft → `wildBuffs`; (3) active-skill + Grit card pools,
  guaranteed mix, per-run caps, reroll. Removed the dead `WILD_ABILITIES` (the global-mutation code).
- XP retune: `wildXpToNext` → linear `50 × level` (VS-style; L2=5 goblins, L3=+10).

### Lessons
- **No Node here, and a pure-Python ES parser is the `node --check` substitute — but `esprima`-python
  predates ES2019+.** A whole-file parse fails on perfectly valid code. To use it, neutralize newer
  syntax in an in-memory copy before parsing: `catch {` → `catch (e) {` (optional catch binding),
  `??` → `||`, `?.` → `.` **only before an identifier** (NOT before a digit — `x?.3:0` is a *ternary*,
  not optional chaining), and strip BigInt suffixes (`0n`→`0`). Or just slice out the section you
  edited and parse that, dodging unrelated quirks elsewhere. **And scale rigor to the edit: a numeric
  or comment-only change in already-balanced code needs no parse at all — only structural edits
  (moved braces/parens/strings, added/removed functions) can break the parse.**
- **To delete a stat system woven through 50+ call-sites, neuter the helper functions to their
  neutral return values — don't edit every site.** STR/DEX/INT all started at 0, so every scaling
  helper (`weaponScalingMult`, `wildDexSpeedMult`, …) already returned 1/0 at baseline. Turning them
  into `return 1`/`return 0` shims made the deletion **behavior-identical at baseline** with ~10 edits
  instead of ~50 risky ones, and kept the one live term (`wildBuffs.cdPct` in `wildDexCdMult`).
- **The MP/cross-run "shared registry" landmine: never mutate a global like `WeaponRegistry.sword`
  for per-player upgrades** — in co-op one player's cards buff everyone, and it leaks across runs.
  Fix: a per-player modifier map (`skillMods`/`gritMods`) read at use-time via an accessor
  (`pSkillStat(p,key) = base + p.skillMods[key]`), with per-key floors so −cooldown/−MP can't hit 0.
- **Single-value → map refactors: route every read through one null-safe helper.** `gIsImbued` guards
  `p && p.imbues && p.imbues[id]`, so remote peers (who never get an `imbues` map) return false
  instead of throwing. Same shape for the card mods.
- **Design boundary that simplified a whole feature:** cards are **magnitude** (rarity = ×multiplier),
  the god **imbues** are **transformation**. Cutting "transformative cards" removed the spec's biggest
  design sink and made the card pools pure numbers.

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
| Tiles/variants form a repeating pattern | `hash % 2^k` reads low bits — use the `gWallVar` table |
| Sudden FPS drop after a draw change | Per-primitive canvas state toggle in a hot loop |
| On-hit flash shows a square box | `source-atop` fill on the shared canvas tints the opaque bg too — tint an offscreen sprite copy |
| Sprite looks wrong size vs. another | Per-entity draw multiplier (e.g. `PLAYER_DRAW_SCALE`), not the sprite/box |
| Overlapping AoE patches over-damage | Per-patch hit-cooldowns multi-hit — use one shared per-enemy cooldown |
| `node --check` unavailable / parser rejects valid code | No Node here; use esprima-python but neutralize ES2019+ first (`catch{}`, `??`, `?.`-before-ident, BigInt `0n`) — and skip the parse entirely for numeric/comment-only edits |
| Deleting a stat used in 50+ places | Neuter the helper to its neutral return (1/0); don't edit every call-site (works when the stat's baseline is 0) |
| MP: one player's upgrade buffs everyone | A shared registry (`WeaponRegistry`) was mutated for a per-player effect — use a per-player modifier map read at use-time |
| Map/field read throws on remote peers | Route single→map reads through one null-safe helper (`gIsImbued` guards `p && p.imbues`) |

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
| Art-tile variants via `gWallVar` table | Coordinate hash `% 4` showed a diagonal pattern; the table is structure-free | 10 |
| Tile art baked to device size, smoothing off | 1:1 blit; per-tile smoothing toggle killed dungeon FPS | 10 |
| FX sprites (fire pillar/wave) additive on black | Black bg drops out, flames glow over the scene | 10 |
| Imbued effects as `gFire*` arrays (ring/cross/trail) | One shape per effect: spawn/update/draw + `gDealEnemyDamage`; MP-synced via cast seq / dash flag | 11 |
| Shared per-enemy trail cooldown (`gTrailHits`) | Overlapping patches would otherwise multi-hit; keep DPS predictable | 11 |
| Engineering Charter as standing operating model | Codifies CTO authority, refactor cadence, and repo verification reality | 11 |
