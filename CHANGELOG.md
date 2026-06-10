# Changelog

All notable changes to To Dust are recorded here. Versions follow
[Semantic Versioning](https://semver.org/) (pre-1.0: minor = features, patch = fixes).

Tag each release in git: `git tag -a vX.Y.Z -m "..." && git push origin vX.Y.Z`.

## [Unreleased]

### Added
- **Late-game danger pass — the difficulty curve now actually climbs (roadmap item 1).** Three layers,
  per the Vampire-Survivors lesson (pressure = density + mix-shift + breakpoints, not one smooth knob):
  - **Enemies finally hit harder as nights pass.** Audit finding: enemy *damage* never scaled at all —
    `wildThreatMult` only ever touched HP/speed, so night 12 goblins hit like night 1. A new
    `wildDmgMult` (+15%/night) applies at the `gDamagePlayer` chokepoint, so every source (melee,
    arrows, bombs, fireballs, the MP client mirror) scales identically with zero per-site wiring.
    Dungeons untouched (threat is 0 outside wilderness).
  - **Steeper, denser nights.** HP slope ×0.25→×0.35/night; opening horde +10→+13/night (cap 60→72);
    night stream +0.4→+0.6 enemies/sec/night; live cap +4→+5/threat (t12 night ≈ 128). Speed slope
    unchanged — mobility creep feels unfair; density and damage carry the pressure.
  - **The mix shifts — and flips.** Warriors arrive night 4 (was 5), shamans night 6 (was 7), elite
    weights ramp ~60% harder, and at night 8+ the goblin backbone thins 100→60 so late nights read
    elite-heavy instead of "more goblins."
- **The danger tell — glowing enemy eyes.** Every wilderness enemy carries a `threatTier` flag stamped
  at spawn (tier 1 at night 4+, tier 2 at night 8+) driving an additive eye-glow overlay: **yellow =
  dangerous, red = deadly**. Cheap two-dot + halo pass (no gradients — the night field runs 100+
  sprites). The flag is the contract; the rendered look is an engineer placeholder for the Artist to
  restyle (PM→Artist handoff now unblocked).

## [0.5.0] - 2026-06-10

### Added
- **Combat card pass — per-skill damage cards (roadmap item 0b).** The level-up draft gains its first
  *commit-to-one-skill* damage choices, so a build can go deep on a single attack instead of only taking
  the universal **Bloodlust** (+5% all damage). **Swing: Bite** (+8%/pick) buffs the normal swing only;
  **Heavy: Devastation** (+8%/pick) buffs the heavy attack only. Per the governing balance rule, a
  single-skill card out-%s the universal one (+8% vs +5%) so it's never strictly dominated. Both write
  per-player skillMods
  (`swingDmgPct`/`heavyDmgPct`), stack multiplicatively on the global %damage buff, are network-synced
  through the existing card-pick path, and flow into the char-screen damage readout so the displayed
  numbers match what you hit for.

### Changed
- **Heavy: Devastation → Heavy: Reach** (same `hv-rad` card). The heavy's only shape card now lengthens
  its forward **reach** (`heavyLen`, +8 px/pick) instead of widening its fan (`heavyWidth`) — the
  less-loved axis. The freed "Heavy: Devastation" name is reused by the new heavy %damage card above.
- **All level-up cards are now uncapped — pool-wide** (Josh's call, part of item 0b). Every pick cap is
  removed from the passive, skill, and Grit pools; the draft RNG is the only governor, so stacking one
  card into a monster run is the rare lucky payoff, not the norm. Safe without new code: the degenerate
  states were already guarded independently of caps — crit chance hard-clamps at 75%, global cooldown at
  99% (`wildDexCdMult`), per-skill cooldown/speed reductions floor in `SKILL_STAT_FLOOR` (incl. the
  `wwCooldown`/`leapCooldown` floors the roadmap flagged as a gap — audit found them already in place),
  and Grit's trigger streak floors at 2.
- **Wolves hit harder early (roadmap item 4).** A wolf camp is now a genuine risk-vs-reward gamble
  instead of free loot: direwolf 26→38 hp, bite 10→15; alpha wolf 72→105 hp, bite 17→25. The direwolf
  now sits between a goblin and a warrior; the alpha is clearly elite. Telegraphs, speeds, and contact
  chip are unchanged — the crouch-tell dodge window is what keeps the bigger bite fair.

### Fixed
- **Wolves no longer get stuck on their dens (roadmap item 3).** Wolves are native to the land: they
  now climb over rocks (a wolf-specific walk predicate, `gIsWalkWolf`, threaded through the shared
  `gRC` tile resolver — including the den's own rock arc, which steering-only wolves used to pin
  themselves against) and over destructibles, and forest tree-slow no longer applies to them. Hut
  walls, spike fences, and traps still block, so village defenses hold.

## [0.4.0] - 2026-06-10

### Added
- **Directional player walk cycles — all 8 facings.** The knight now plays a hand-drawn 4-frame walk
  animation in every direction while moving, driven by the existing `p.walkFrame` counter (network-synced,
  so remote players animate too) and gated by a data-driven `PLAYER_WALK_OCT` octant→dir map — each facing
  is one map entry plus its `char.playerwalk{1..4}.<dir>` art. The engine's 1px walk-bob is suppressed when
  a cycle plays since the frames carry their own bob. New tool `tools/slice-walk-cycle.py` slices a folder
  of single-pose frames into registered, background-removed sprites (color-distance keying, single common
  scale, body-height anchoring + body-centering so a held sword doesn't shrink or off-center the figure).

### Changed
- **Studio docs restructured for tiered, on-demand loading** — cuts agent startup context ~3–4× with no
  loss of information. The root `CLAUDE.md` (194→60) and its Codex twin `AGENTS.md` (132→59, also
  de-staled) are now lean **studio routers** that auto-load into every session; the engineer's full
  context moved to a new **`engineer/CLAUDE.md`** (symmetric with `product/` and `artist/`), so PM/Artist
  sessions no longer carry engineer architecture/gotchas. `SESSION_JOURNAL.md` trimmed to recent sessions +
  the reference tables (474→216; full snapshot archived at `docs/archive/session-journal-2026H1.md`). Role
  entrypoints now read the heavy docs **by section / on demand** (`ROADMAP` *Now* block, `TO_DUST_CTO_DOC`
  `§`-section grep, `Art_Designer_Agent.md` only when generating an asset). Docs/process only — no game change.
- **Agents restructured into self-contained, self-maintaining files.** Each role is now a single file
  under `agents/<role>/` (`engineer.md` / `product.md` / `artist.md`) that folds in its identity,
  operating model (the retired `docs/ENGINEERING_CHARTER.md` / `PRODUCT_MANIFESTO.md` / `ART_PIPELINE.md`),
  and habits, beside its own crystallized **`memory.md`** (was `docs/learnings/engineer.md` / the role
  `LEARNINGS.md` files) and an `archive/`. Each file carries YAML frontmatter (`memory`,
  `memory_compact_at`); `tools/session-brief.ps1` now reads it **data-driven** (new agents self-register)
  and surfaces a compaction nudge when a memory — or the shared `SESSION_JOURNAL.md` — runs over budget,
  backed by a new `tools/memory-size-check.ps1` Stop hook. Adds a "Find your section" router atop the
  Artist file. All inbound references repointed (routers, `/cto`·`/pm`·`/artist`, Codex agents, specs,
  and the pm-bot system prompt). Agents operate from the repo root → all paths root-relative. Docs/process
  + tooling only — no game change.

## [0.3.2] - 2026-06-09

### Fixed
- **Bow kills now drop an XP orb** like every melee path (was the lone weapon passing `{xpOrb:false}`).

### Changed
- **Wolf lunge-bite now reads.** The direwolf/alphawolf pounce pose lingered only ~0.2s and flashed past;
  it now holds ~0.4s via a display-only `_biteHold` timer, so the bite registers visually. The actual hit
  window and exposed-recovery timing are unchanged.
- **Skill tooltips show live (buffed) damage.** The character-screen skill details now apply the same
  `%damage` buff (obelisk + level-up cards) that combat uses, so the numbers match what you actually hit
  for. Crit is left out (probabilistic — these are the guaranteed-hit values).
- **Tooling:** `tools/slice-turnaround.py` is now path-native — it writes cutouts straight into
  `assets/char/` and emits a path-based `ART_MANIFEST` snippet instead of base64 (matches the
  externalized art pipeline).

### Removed
- **Removed the vestigial sword-charge state** (`charging`/`chargeTick` + the dead `_pendingCharge` input
  branch) left over from the retired hold-to-charge normal attack, including its two multiplayer wire keys.
  Forward/backward MP-compatible (read sites already defaulted), no behavior change.
- **Retired the dead STR/DEX/INT scaling shims.** The neutral stubs left over from the old stat system
  (`W_scalingMult`/`skillScalingMult`/`wildStr*`/`wildInt*`/`wildDex{Speed,Atk}Mult`) and the inert
  `wildDmgMult` (`_wdm`) hook are gone, along with their no-op `*1`/`+0` factors at every call-site. No
  behavior change — all character power already flowed through the per-run card buffs (`wildBuffs`). The
  live cooldown helper `wildDexCdMult()` (driven by `wildBuffs.cdPct`) is unaffected.

## [0.3.1] - 2026-06-09

### Fixed
- **Sound stayed dead after any sim/playtest run.** `gpfx` (every SFX) early-returns on
  `window._SIM.muted`, and `Sim.startRun` set it `true` for silent headless stepping but **nothing ever
  cleared it** — so after a `Sim.runFast`/`Sim.batch` (incl. the `await Sim.batch(3)` canary), all game
  audio was silenced until a page reload. `runFast` now owns the mute lifecycle: it remembers the
  caller's audio state, mutes only for the duration of its stepping, and restores it in a `finally`
  (mirroring `installClock`/`restoreClock`); `startRun` no longer leaves a sticky flag. Headless runs
  stay silent; normal play after one is audible again.

## [0.3.0] - 2026-06-09

### Changed
- **Art externalized — `index.html` slimmed from ~14 MB to ~650 KB.** All inline base64 image
  art (179 blobs: 172 `ART_MANIFEST` entries, the 5 `F*_SPR` fire sprites, and the 2 figure
  constants) plus the 4 shrine god-card `<img>`s now load as **files under `assets/`** instead of
  being inlined. Behaviour-preserving — `gInitArt` already did `im.src = value`, so a path works
  exactly like a data-URL; verified every reference resolves (183/183 reachable) and the town
  renders. The game now loads its art at runtime (still no build step; serve with `python dev.py`
  / GitHub Pages, or open `file://` with `assets/` alongside). Upside: the file greps/diffs/reads
  normally again, art changes no longer produce multi-MB diffs, sprites are HTTP-cached, and
  per-area lazy-loading is now *possible* (was impossible while inlined). Mislabeled god-card mimes
  (JPEG-as-`image/png`) corrected in passing. Tooling: `tools/externalize-art.py` (one-shot
  migration), `tools/census-base64.py` (audit for inline blobs creeping back).

### Added
- **Neutral Wolf Camps — jungle creep camps (spine).** 40 fixed, well-spaced crescent rock dens
  scattered across the wilderness, each a **neutral wolf pack guarding a chest** — the pack ignores
  you until attacked, hard-leashes to its den, and **respawns every 3 minutes**, turning camp-clearing
  into a farm route between sieges. The day-loop's "map of fixed objectives" and the marquee **Favor**
  income. Full design: `docs/specs/neutral-camps.md`.
  - **The pack — a fast-flanker identity (opposite the goblins).** Two new enemy types: **Direwolf**
    (`hp 26`, fast 0.34 base — the circling grunt, 2–4 per camp) and **Alpha Wolf** (`hp 72`, larger,
    harder bite — 1 per camp, guards the chest). Both run one new **`_aiWolf`**: circle-to-flank
    movement + a committed, telegraphed **lunge-bite** (crouch tell → pounce-dash → exposed recovery
    you can punish), per the weighty-combat pillar. Sprites + draw scales were pre-wired by the Artist
    (`char.direwolf.*` / `char.alphawolf.*`, `ENEMY_DRAW_SCALE`).
  - **Neutrality — the one genuinely new behavior.** Unlike goblin *ambient* camps (aggro on
    proximity), wolves are **`isNeutral`**: you can walk through a camp untouched. Hitting any member
    **wakes the whole pack** (`_wolfWakeCamp`, fired from the damage chokepoint so even a one-shot kill
    propagates). A **hard leash** (`WOLF_LEASH_R`, 17 tiles from the den) makes a strayed-too-far pack
    **disengage, full-heal, and walk home** — you fight a camp at its camp, or you leave it. That
    choice *is* the feature.
  - **World-gen + respawn.** A camp-placement pass beside the obelisks (rejection-sampling, min-sep 35,
    excluded from villages/shrine/spawn/obelisks) carves a C-shaped rock arc into the existing `rocks`
    layer (no new tile art) with a random open mouth and a cleared interior, then seeds the pack + a
    chest → `gWildCamps[]`. The 3-min respawn + chest-on-clear tick lives **inside `gSimUpdate`**
    (`gUpdateWolfCamps`, off the run clock — AI-native invariant, headless-safe), camps are exempt from
    the far-despawn, and camp dots show on the minimap (pale-blue up / dim cleared).
  - **The chest (Favor income).** Gated on clear: it unlocks only once the pack is dead, then auto-loots
    on proximity for **2–4 Favor** + an XP burst via the shared `gGrantFavor` chokepoint. It's a
    **one-time reward** — opening it fades the chest out + despawns it (`_chestDrawAlpha`, 2.2 s), and a
    pack respawn never re-arms it (an un-looted chest just re-locks behind the new pack). Direwolf drops
    goblin-tier Favor, Alpha warrior-tier.
  - Both types added to the map-editor palette and the goblin-AI exclusion list (no double-movement).

### Changed
- **Day-1 goblin density lifted.** The day ambient maintainer's standing-population floor rose from
  **12 → 20** goblins (`gWildAmbientTarget` base; slope unchanged, so Day 1 / threat-0 gains the most).
  The early day-farm zone no longer reads as sparse.
- **Village chests now fade out + despawn on open** too (same one-time `_chestDrawAlpha` path as the
  wolf-camp chests), instead of vanishing instantly.

### Fixed
- **Night siege stream was completely starved after the opening horde.** The stream's live-cap census
  (`gWildSpawnTick`) counted *every* living entity, so the ~160 persistent neutral wolves (40 camps)
  pinned `live ≥ cap` and left no room — horde dropped, then nothing followed. The census now counts
  only siege-relevant enemies (excludes `isHeld` guardians + `campId` wolf packs). Also narrowed
  nightfall's "activate everything" to **ambient day goblins only**, so distant villages stay held and
  wolf packs stay neutral instead of all waking and flooding the field.

## [0.2.0] - 2026-06-09

### Added
- **Favor — the world currency (spine).** A run-scoped gold-coin currency (`gFavor`) that drops
  rarely from enemies and from chests, and is spent on the level-up card screen. Full design:
  `docs/specs/favor.md`.
  - **Earning.** Per-`EntityDef` `favor:{chance,min,max}` drop table — grunts ~4% (Goblin) up to
    tougher types (Warrior 12%, Shaman 15% / 1–2), the Goblin King a guaranteed 8–12 windfall. Drops
    surface as a gold **coin pickup** (`gFavorOrbs`, a clone of the XP-orb system) auto-collected
    within pickup range (so the pickup-range card synergises), host-authoritative like XP. Village
    **chests** now pay **3–6 Favor** on open (replacing the `CHEST!` flavor pop) via a reusable
    `gGrantFavor()` chokepoint (ready for the upcoming Wolf-Camp chests to reuse). HUD gains a gold
    `✦` Favor counter beside the level/XP readout.
  - **Spending (two sinks, both on the card screen, gated behind committing to a patron at the Lv-5
    shrine).** **Reroll** is now Favor-priced — escalating **3 / 5 / 8** within a single level-up
    (resets each level); the old free `+1-charge-per-5-levels` economy is retired (the `rerolls`
    field is gone). **Rarity upgrade** is the new marquee spend: a per-card **▲ ✦cost** affordance
    bumps a shown card up one tier (→Rare **4** · →Epic **8** · →Legendary **16**), recomputing its
    magnitude via the existing `_cardValue` path; upgrades chain and are cleared by a reroll. Both
    controls lock with a hint until a patron is chosen. A **styled gold Favor plaque** (`✦ N Favor`)
    sits on the level-up screen itself — the HUD counter is hidden behind that overlay — and updates
    live after every spend, with a 🔒 hint while spending is still locked.
  - **AI-native.** `Sim.observe()` now reports `favor`, `favorOrbCount`, `rerollCost`, and per-option
    `upgradeCost`; new `Sim.reroll()` / `Sim.upgradeCard(i)` primitives (+ `reroll` / `upgradeCard`
    intents in `Sim.act`) and `gSimDraft.reroll/upgrade/rerollCost/upgradeCost` harness hooks. The
    draft's `gSimDraft.pick()` stall-guard is unchanged, so headless runs resolve as before.

## [0.1.0] - 2026-06-09

### Studio / Project
- **Renamed *Dungeon Forge* → *To Dust*** across the repo (display name only; the `DF1` seed prefix and
  `dungeon-forge:map:` save key are kept frozen for compatibility, so existing seeds/saved maps still
  load).
- **Established the From Dust studio layer** (`studio/`): `STUDIO.md` (studio manifest + agent roster +
  recursive-learning doctrine), `CREATIVE_MANIFESTO.md` (the Creative Director's living vision/feel
  doc), and the `creative-director/` role home.
- **Per-agent learnings stores + a session crystallization habit** — each role now records its
  highest-level lessons (`docs/learnings/engineer.md`, `product/LEARNINGS.md`, `artist/LEARNINGS.md`,
  `studio/creative-director/LEARNINGS.md`); the habit is wired into each role's operating context.

### Changed
- **Level-up "Choose a Blessing" screen redesign.** Rebuilt the wilderness level-up overlay to the
  reference layout, **themed by patron**: Cilia = warm fire, no-patron (warrior) = cool *Nameless
  Knight*. Left = a full-bleed portrait figure filling the panel inside a **CSS** ornate frame
  (metallic gradient border, inner hairline, corner studs, glow) + a CSS name plate — the figures
  are clean image cutouts, the frame/name/title/cards/buttons are all CSS. Right = the live skinned
  cards (rarity label → icon ring → name → effect), the **LEVEL UP / CHOOSE A BLESSING** header with
  flourishes, and **REROLL / CONFIRM** with subtitles. One `theme-cilia` class drives the whole
  recolor via CSS vars (`--lvl-accent / --lvl-glow / --lvl-frame`). Backdrop scrim `0.92 → 0.6` so
  the game stays vaguely visible behind. Card-draft logic (pick / reroll / confirm / caps) untouched.
- **Weightier heavy attack — doubled commitment window + true movement lock.** The smash's active
  swing carries the player forward in a punchier lunge (`heavyDur` 18→26, lunge coeff 0.09→0.11),
  then holds a **planted recovery** (`heavyRecover` 26) — so the full commitment window is **52
  frames (~2×)**: lunge + strike in the first 26, exposed-and-rooted in the last 26. The player
  **can't move for the entire window** — fixed the long-standing bug where the movement-lock gated
  on `p.smashing` (a flag that was never set) instead of `p.heavySwinging`, so you could run at full
  speed mid-smash. The hitbox is confined to the active swing (no lingering hits during recovery),
  so whiffing a heavy genuinely roots you, exposed. First application of the **weighty-combat**
  directive (committed actions cost mobility; `docs/PRODUCT_MANIFESTO.md` → Game-feel pillar).
  Also fixed the heavy **pose rendering undersized** — its turnaround sheet is drawn smaller than
  the idle sheet, so it's now drawn at `HEAVY_DRAW_MULT` (1.3×, the measured front-view helmet-width
  ratio), feet-anchored, to match the idle body.
- **Card Pool Expansion — Stage 3: crit system (completes the feature).** New second damage axis:
  **`wildBuffs.critChance`** (0–0.75 hard cap) and **`wildBuffs.critDamage`** (added to a base crit
  multiplier of ×1.5), both per-run. Two new passive cards — **Precision** (+4% crit chance) and
  **Savagery** (+20% crit damage). The roll (`gCritRoll`) happens once in the attacking caller on
  the four direct-hit sources (swing, whirlwind, leap impact, heavy) and the crit-multiplied damage
  flows through `gDealEnemyDamage`'s existing report, so MP stays single-roll (no host/client
  desync). **Direct hits only** — DoT/aura ticks (Cilia's fire burn/ring/cross/trail/pillar) never
  crit. Juice: crit damage numbers render **bigger + gold**. Character screen shows **CRIT** (chance)
  and **CRIT×** (multiplier) rows. *(Stage 3 of `docs/specs/card-pool-expansion.md` — feature complete.)*
- **Card Pool Expansion — Stage 2: swing/heavy/dash cards + sustain nerf.** The level-up draft now
  offers upgrade cards for the level-1 core kit (previously only whirlwind/leap could scale):
  **Swing: Reach** (+reach, via the swing arc's outer radius `smearOuter`), **Swing: Tempo**
  (+% attack speed), **Heavy: Quickdraw** (+% charge speed), **Heavy: Devastation** (+blast radius),
  **Dash: Recovery** (−cooldown) and **Dash: Momentum** (+distance). Swing cards are always offered
  (swing is always-on); heavy/dash gate on their unlock (`gIsSkillUnlocked`, now mapping
  `heavy`/`dash`). Attack-speed and charge-speed are **percent multipliers** (`base/(1+Σ%/100)` via
  a new `pSkillSpeed` helper, floored by `SKILL_STAT_FLOOR`) — never flat "frames" in card text —
  while reach/radius/distance/cooldown are flat per-player `skillMods`. **HP-regen nerf:** the
  Regeneration card drops `0.4→0.25` base, cap `8→5`. All behaviour-identical until a card is picked.
  *(Stage 2 of `docs/specs/card-pool-expansion.md`; crit is Stage 3.)*
- **Card Pool Expansion — Stage 1: per-player swing/heavy/dash stats (load-bearing migration).**
  Migrated the card-target swing (`swingArc`, `swingDur`), heavy (`heavyMaxWindup`, `heavyLen`,
  `heavyWidth`) and dash (`evasionRange`, `evasionCooldown`) reads from the global
  `WeaponRegistry.sword` (`W().stat`) to the per-player accessor `pSkillStat(player, key)` — the
  same Stage-1 pattern whirlwind/leap already use. Behavior-identical today (mods empty →
  `pSkillStat` returns the base), but it defuses the cross-run / co-op leak landmine so the coming
  swing/heavy/dash upgrade cards can write to per-player `skillMods`. Added `SKILL_STAT_FLOOR`
  entries (`swingDur`/`heavyMaxWindup`/`evasionCooldown`) so reduction/speed cards can't hit zero.
  *(Prerequisite for `docs/specs/card-pool-expansion.md`; cards + crit are the next stages.)*

### Added
- **Image-art attack/heavy/idle poses for the player and goblins.** New directional turnaround
  art is sliced (via `tools/slice-turnaround.py`) into the `ART_MANIFEST` and swapped in by state:
  - **Player** swaps body turnaround by action — normal swing → `char.playeratk.*`, heavy on RMB
    release (`heavySwinging`) → `char.playerheavy.*`, else idle; all sliced to the idle scale +
    foot baseline so only the pose changes, never the body size.
  - **Goblin** shows `char.goblinatk.*` during its new telegraphed attack windup/strike (below).
  - **Goblin archer** shows a bow-drawn pose (`char.archeratk.*`) while aiming (`shootWindup`).
  - **Goblin warrior** shows a swing pose (`char.warrioratk.*`) during `swing-windup`/`charging`.
  - **Goblin bomber & shaman** upgraded from procedural sprites to directional turnaround art
    (`char.bomber.*` / `char.shaman.*`) with movement-delta facing.
  - **Goblin king** shows a lunge/attack pose (`char.kingatk.*`) during any attack phase
    (swipe/jump/spin windups + spinning).
  - **Goblin shaman** shows a staff-cast pose (`char.shamanatk.*`) while casting a fireball or
    channelling the buff incantation.
  - **Goblin bomber** now telegraphs its throw: a new `throwWindup` plants it in a throw pose
    (`char.bomberatk.*`) facing the player, then releases the bomb when the windup elapses
    (was an instant throw).

### Fixed
- **Archer attack sprite cleanup** — cut the enclosed white pocket between the drawn bow and its
  string (the edge-seeded flood fill can't reach it, so it was keyed with a global white pass for
  that sheet), and removed the old procedural bow-arm + arrow overlay now that the sprite carries
  the drawn bow (the dashed shot-trajectory dodge telegraph stays).

### Changed
- **Goblin melee is now a telegraphed cone attack + contact chip.** An aggro'd goblin plants,
  fills a translucent red cone over `atkWindup` (~0.53s, fields on `EntityDefs.goblin`), then
  strikes — damage only lands if the player is still inside the cone (reach + half-arc), so it's
  dodgeable by sidestepping/backing out. Independent of that, body **contact** still chips
  (`contactDamage` on its own cooldown) so a swarm can't be walked through untouched.
- **Removed all post-hit invincibility frames.** `gDamagePlayer` no longer grants i-frames on
  damage, so repeated hits / a swarm can't be cheesed by a mercy window. Deliberate evasion
  i-frames (dash/leap/roll) are preserved; the fire-beam trap was converted to its own `_beamCd`
  throttle (it was the only continuous hazard relying on the i-frame grant). A visual-only
  `_hitFlash` keeps the red damage-flash (no invulnerability).
- **Smaller player walk bob** — replaced the experimental 2-step bounce + rock with a gentle
  goblin-sized up/down bob (`PLAYER_BOB`).
- **Goblin warrior idle art gap fix** — the warrior sheet's near-black background matched its dark
  armour, so the default slice threshold (40) flood-filled through the armour and fragmented the
  sprite. Re-sliced at threshold 24 (just above the true background) — figure is whole again.
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
- **Restored the fixed king milestones.** `_wildSpawnKings` + the 10/20/30-min triggers in
  `gWildTick` are back (1 king @10min, 3 @20min, 10 @30min, with announcement + shake, reset
  per run) — guaranteed Goblin-King boss waves on top of the day/night swarm. They were dropped
  in the Session-12 Nightfall overhaul; the new `_wildSwarmType` only seasoned in rare kings from
  night 6 (~28 min), so a normal run never saw one.
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
