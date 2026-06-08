# Changelog

All notable changes to Dungeon Forge are recorded here. Versions follow
[Semantic Versioning](https://semver.org/) (pre-1.0: minor = features, patch = fixes).

Tag each release in git: `git tag -a vX.Y.Z -m "..." && git push origin vX.Y.Z`.

## [Unreleased]

### Changed
- **Wilderness spawn overhaul — day farming zone + Vampire-Survivors night.** Replaced the
  day-patrol-bands / night-roster-budget-spawner with two distinct loops:
  - **Day = a populated MMO-style farming zone.** A maintainer (`gWildPatrolTick`) keeps a
    target density (`gWildAmbientTarget`, `~12 + threat·1.5`) of **stationary goblin camps**
    (clusters of 2–5) and lone stragglers around the player, spawned just beyond vision so you
    **roam to find them**. Camps hold at their spawn anchor (`homeWx/Wy`) until you walk within
    `AMBIENT_PULL_R` (~10 tiles), then aggro and chase — so you can **chain-pull several camps at
    once to mob/farm**; run them off-screen (`gAmbientDeaggroR`, vision+2 tiles) and they de-aggro
    and **leash back to camp**. Packs behind you cull via the existing 85-tile despawn; the
    maintainer respawns fresh camps around you as you move (living zone). New `e.isAmbient` flag
    gates a camp-hold/leash branch in `_aiGoblin`; dungeon goblins keep the original 300px gate.
  - **Night = a constant horde that chases (VS-style).** Nightfall drops one **compact opening
    horde from a single direction** (`_wildSpawnHorde`, `_wildHordeSize` = `20 + (n−1)·10`,
    night 1 = 20, capped 60) that advances as a group, then a **constant stream**
    (`_wildNightStreamRate` ≈ `1.5 + 0.4·n`/sec) refills the field from off-screen until dawn,
    throttled by `wildCurrentCap`. The day's camps all aggro at dusk and fold into the swarm.
  - **Threat-weighted swarm composition** (`_wildSwarmType`) for both horde and stream: goblins
    are the flat-100 backbone; archers (n≥2), bombers (n≥3), warriors (n≥5), shamans (n≥7) and
    the rare king (n≥6) unlock and grow their share with threat — goblin share runs 100% on
    night 1 → ~47% by night 12. Removed the old fixed-roster machinery (`_wildSiegeRoster`,
    `_wildBuildSiegeQueue`, `NIGHT_GRUNT_SCALE`, `_wildSpawnSiegePack`, the `siegeQueue`/`siegeTotal`
    queue state) and the day patrol-band code.
- **Faster wilderness leveling** — XP-to-next is now linear (`50 × level`, arithmetic growth à la
  Vampire Survivors) instead of `floor(100 · level^1.4)`. With a base goblin worth 10 XP this
  benchmarks to L2 = 5 goblins, L3 = +10, +5 goblins per level after. Master tuning lever for the
  card-draft pacing playtest.
- **Card draft — skill & Grit cards, guaranteed mix, reroll (Stage 3, Core complete)** — the
  level-up draft now mixes three pools: **passive** (→`wildBuffs`), **active-skill** (whirlwind &
  leap: +damage/radius/range, −cooldown — written to the per-player `skillMods`), and **Grit**
  (+shield/cap/duration, −streak — per-player `gritMods`; Grit constants are now run-modifiable
  accessors). Skill cards are gated on that skill's unlock; Grit cards on level 5. Each draw
  **guarantees ≥1 passive and ≥1 skill/Grit card** (when available), de-dupes, and excludes cards
  at their **per-run pick cap**. Added a **reroll** that re-draws all three — currently an
  **interim** free charge (1, +1 each 5-level milestone); the spec now prices reroll in **Favor**
  (`docs/specs/favor-imbue.md`), which lands when that system is built. `pSkillStat` now floors
  cooldown/MP stats so reduction cards can't zero them.
  Removed the dead `WILD_ABILITIES` (the old global-`WeaponRegistry` mutation — the landmine).
  *(Completes the `docs/specs/card-draft.md` Core; rarity-frame art and odds-by-night are stretch.)*
- **Card draft replaces STR/DEX/INT (Stage 2)** — level-up no longer offers a STR/INT/DEX
  point; it now deals a **3-card draft (pick one)**. Each card rolls a rarity
  (Common 64% ×1.0 / Rare 26% ×1.7 / Epic 8% ×2.6 / Legendary 2% ×4.0) that scales a numeric
  passive bonus — rarity is pure magnitude, never a behavior change. The passive pool (damage,
  move speed, cooldowns, max HP, HP/s, max MP, MP/s, XP, pickup) routes through the existing
  `wildBuffs` pipeline (same as Obelisks), so no new combat wiring. STR/DEX/INT and the Dark-Souls
  scaling-grade subsystem are retired — the scaling helpers (`weaponScalingMult`,
  `skillScalingMult`, `wildDex*`, etc.) are now neutral shims, so the ~50 combat call-sites are
  unchanged and baseline power is identical (those stats started at 0). Character screen drops the
  STR/INT/DEX panel and sources regen/speed from `wildBuffs`. *(Stage 2 of `docs/specs/card-draft.md`.
  Active-skill + Grit card pools, guaranteed-mix, reroll, rarity-frame styling, and the MP
  per-player draw are Stage 3.)*
- **Card-draft groundwork — per-player skill stats (MP-correctness landmine fixed)** — active
  skill stats (whirlwind/leap damage·radius·range·cooldown·MP) are now read through
  `pSkillStat(player, key)` = weapon base **+ that player's `skillMods`**, instead of the shared
  `WeaponRegistry.sword`. Card upgrades (coming) will write to the per-player, per-run `skillMods`
  map so one player's cards can't buff everyone in co-op and stats don't leak across runs. All 22
  combat/render/HUD/char-screen reads migrated; behavior-identical until cards write mods.
  *(Stage 1 of the card-draft spec — `docs/specs/card-draft.md`.)*
- **Automatic skill unlocks (skill-point currency retired)** — wilderness skills no longer cost
  a "skill point" spent by Ctrl+hotkey / clicking a locked slot. They now unlock at fixed player
  levels via `gWildSyncUnlocks`: **dash @2, whirlwind @3, leap @4, Grit (warrior passive) @5**;
  swing + heavy are the level-1 starting kit. Each level-up floats an "X UNLOCKED!" tag. The
  existing per-player `xLevel < 1` lock checks (firing gates + toolbar) are unchanged — unlock
  just sets the level to 1 — so multiplayer semantics are preserved. Grit's shield is gated to
  level 5 in the wilderness. Removes the `skillPoints` grant/spend/HUD and the `sk-spendable`
  styling. *(Resolves the card-draft spec's Open Call #1 — the unlock prerequisite for that
  system; STR/DEX/INT + the card draft itself are the remaining multi-session build.)*

### Added
- **Multi-imbue + level-gated shrine** — the wilderness shrine now re-arms **every 5 player
  levels**: it glows (pulsing aura + floating runes) and the patron/imbue flow opens (auto in
  the wilderness when you walk into range, or [E] in town) to imbue **another** skill. More than
  one skill can be imbued at once — imbues are now a `skillId → patron` map (`gPlayer.imbues`),
  replacing the old single `imbuedSkill`. The imbue menu shows already-imbued skills locked in
  (`✓ IMBUED`), dims out skills once your level allowance is spent, and is multi-pick (Esc to
  leave). Wilderness allowance = `⌊level/5⌋` capped by unlocked skills; **town meditation is
  ungated** (imbue any/all unlocked skills, persisting into dungeons via `gImbuedSkills`). All
  combat/render/UI/multiplayer read-sites route through a single null-safe `gIsImbued()` helper.

### Changed
- **Nightfall Sieges (spine)** — the wilderness difficulty clock is now the day/night cycle
  instead of a hidden 90s threat faucet. Each **night is a discrete siege**: at nightfall a
  **fixed roster** is built from a tunable table (goblins `10+5n`, archers `(n−1)·4` @n≥2,
  bombers `(n−2)·2` @n≥3, warriors `(n−4)·2` @n≥5, shaman `n−6` @n≥7, kings `min(5,⌊n/2⌋)`)
  and deployed across the fixed night window by a **budget spawner** (cadence =
  `roster/night_duration`, throttled by the live-enemy cap). Whatever isn't deployed when the
  fixed-timer night ends is **dropped at dawn** ("held the line"). Cycle is a **3-min day /
  2-min night**; grunt roster counts are scaled (`NIGHT_GRUNT_SCALE`) so the longer night
  stays clearly busier than the day. **Day is the lull** but no longer dead — patrol bands run a
  tighter cadence (~16s vs 30s gaps early) and now **aggro on spawn** (chasing waves, not a
  passive march). Enemy stat scaling (`wildThreatLevel`) now steps once per nightfall (= night
  number, capped) rather than every 90s. HUD shows `NIGHT n · siege: X left` / `DAY n · calm`.
  Removed the old run-minute King milestones (10/20/30 min) — kings come from the roster now.
  *(Implements ROADMAP "Now" item 1.)*

### Fixed
- **Release tooling** - `tools/release.ps1` read `CHANGELOG.md` without `-Encoding UTF8`, so
  Windows PowerShell 5.1 decoded it as cp1252 and rewrote em-dashes / `x` / fractions as
  mojibake on every release. Now reads UTF-8 explicitly; the v0.11.0 corruption was repaired.

## [0.11.0] - 2026-06-05

### Added
- **Goblin Warrior art** — static 8-directional sprite (`char.warrior.*`), cut from a
  black-background turnaround sheet (`art/enemy goblin warrior.png`) via edge-seeded
  flood fill (preserves internal shadows) + connected-component isolation per pose.
  Replaces the procedural pixel sprite; drawn upright like the goblin/archer/king,
  facing the target via the 8-way octant. New reusable slicer: `tools/slice-turnaround.py`.
- **Cilia's Fire — imbued Whirlwind** — channelling the whirlwind while fire-imbued emits
  an expanding ring of fire every 2 seconds. Each ring travels outward from the player and
  ignites every enemy its edge sweeps over (impact + 3s burn, once per enemy). Uses the new
  `art/fire ring.png` sprite (black-bg, blitted additively). Damage routes through
  `gDealEnemyDamage` (MP-safe), and the ring replays as a render-only visual on remote peers
  via a per-player `fr` cast signal (mirrors the fire wave's `fw`) — no double damage.
- **Cilia's Fire — imbued Leap** — a fire-imbued leap leaves a burning cross (X) of flames at
  the impact point (`art/fire X.png`, blitted additively as a floor decal beneath characters).
  It lingers ~2s and burns enemies standing on either diagonal arm, re-ticking every 0.5s with
  a refreshing 3s burn. Damage
  via `gDealEnemyDamage` (MP-safe); replays render-only on peers via a per-player `fc` signal.
- **Cilia's Fire — imbued Dash** — a fire-imbued dash leaves a trail of burning ground in its
  wake (`art/burning ground.png`, black keyed to transparent so it reads as a scorched floor
  decal under characters). Patches drop every ~18px along the dash, linger ~1.6s, and burn
  enemies on them (re-tick every 0.4s + 3s burn). Damage via `gDealEnemyDamage` (MP-safe);
  peers replay a damage-free trail under a remote fire-dasher via a per-player `df` flag.
  This completes the four imbued warrior sword skills (swing, whirlwind, leap, dash).

### Changed
- **Enemy sizes** — Goblin Warrior sprite drawn 2× larger; normal Goblin sprite ~1.33×
  (≈⅔ the player's height) and Goblin Archer ~1.2× (≈90% of the goblin). Each enemy's
  body hitbox (`radius`) and ground shadow scale with its sprite; HP bars are unchanged.
- **Thinner enemy health bars** — all in-world enemy HP bars reduced from 4px (King 6px)
  to 1.5px thick (≈⅓–¼) so they take up less screen space; bar widths unchanged.
- **Player hitbox** — collision radius 11→9 so it hugs the body silhouette just inside the
  2× player sprite (was overshooting the visible body).
- **Imbue balance pass** — fire-dash trail patches overlapped (~3 deep) and each ticked the
  same enemy independently, so standing on a trail dealt ~3× intended (~60 DPS on a cheap
  mobility skill). Trail damage now shares one per-enemy cooldown across all patches
  (predictable ~25 DPS regardless of overlap); per-tick base 8→10 to offset the change.

### Fixed
- **Hit-flash red box** — the on-hit red flash tinted the opaque tile background inside the
  sprite's bounding box (a flashing red square), because `gDrawSprite` filled `source-atop`
  directly on the main canvas. Now it tints a sprite-shaped offscreen copy and blits that, so
  only the sprite itself flashes red. Fixes the player and all enemies.
- **Dash white box** — dashing (evasion) drew a white rectangle overlay (`#aabbcc`,
  `lighter`) around the player. Removed; the dash now flashes the player **sprite** white
  for its i-frame window (and the dash's `iFrames=999` no longer triggers the red hit flash).

## [0.10.0] - 2026-06-05

### Added
- **Image-based tile art** — stone dungeon floors (`tile.floor.0–3`) and dirt patches
  (`tile.dirt.0–3`) render painterly art from `ART_MANIFEST` instead of procedural
  fills. Sliced from 2×2 source sheets (`art/tile stone.png`, `art/tile dirt.png`).
- **Fire-wave sprite** — Cilia's Fire imbued normal-attack wave uses a flame-crescent
  sprite (`FW_SPR`), blitted additively, replacing the procedural arc.
- **Goblin King art** — static 8-directional sprite (`char.king.*`), cut from a
  white-background turnaround sheet (whiteness-keyed on `min(R,G,B)` + connected-component
  isolation per pose); replaces the procedural pixel sprite. Drawn upright like the
  goblin/archer (no rotation), facing the target via the 8-way octant.
- **Local dev convenience** — `tools/dev-window.ps1` + a personal PostToolUse hook
  reopen the live-reload dev window (`localhost:5500`) if it's closed when `index.html`
  is edited; `tools/doc-drift-check.ps1` (Stop hook) nudges when `index.html` changed
  but the tracking docs didn't.

### Changed
- **Goblin King size** — sprite scaled to 5.36× player size (a giant boss); body and
  attack hitboxes scaled to match (`radius` 18→44, swipe/jump/spin zones proportional),
  the body hitbox kept just inside the visible sprite for playability.
- **Fire pillars (Cilia heavy)** — sprite 2× larger; pillars now require ≥50% charge
  (the hitbox telegraph flashes red when armed) and begin at 50% of the heavy's range.
- **Whirlwind** — spinning visual reuses the normal-attack slash sprite (`fx.slash`)
  instead of placeholder swords; fiery-red tint when imbued with Cilia's Fire.

### Fixed
- **Tile variants no longer form a diagonal pattern** — art-tile variant selection now
  uses the shared `gWallVar` random table (the procedural/grass source) instead of a
  multiplicative coordinate hash whose low bits are linear in (tx,ty) and showed
  through `% 4`.
- **Dungeon framerate regression from tile art** — removed a per-tile
  `imageSmoothingEnabled` toggle (a dungeon viewport is ~all floor); smoothing is now
  set once per frame.

## [0.9.0] - 2026-06-05

First formally versioned release. Consolidates the work from development
sessions 1–9 into a single source-controlled project.

### Project
- Promoted the git repository to the project root; the live game is now the
  tracked `index.html` (previously an untracked `latest build.html`).
- Replaced the old filename-suffix versioning (`_v1`, `_v2`, `_MP_Build`,
  `_refactored`, …) with git history + tags. Old snapshots remain recoverable
  in git history.
- Documentation consolidated under `docs/`, older snapshots under `docs/archive/`.

### Game (state at session 9)
- Wilderness survival mode (600×300 seeded map: villages, obelisks, shrines, fog of war).
- Enemy roster: goblin, archer, warrior, bomber, shaman, king (boss milestones).
- MOBA skill system: heavy attack, dash, whirlwind, leap — unlocked via skill points.
- Four patron-god shrines (Cilia/Ikras/Bhumi/Boreas).
- Firebase Realtime Database multiplayer (delta-compressed, ~8 Hz).
