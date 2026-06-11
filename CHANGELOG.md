# Changelog

All notable changes to To Dust are recorded here. Versions follow
[Semantic Versioning](https://semver.org/) (pre-1.0: minor = features, patch = fixes).

Tag each release in git: `git tag -a vX.Y.Z -m "..." && git push origin vX.Y.Z`.

## [Unreleased]

### Changed
- **Mana is now a real, shared resource (item 7 — all three phases).** Previously you could cast forever and
  the auto-firing God Skills cost nothing; now mana funds both your class kit and the god layer, and you run
  dry — especially early.
  - **Phase 1 — class-skill costs & cooldowns rebalanced.** Dash `15→18` mp, Heavy `25→30` mp. **Leap** is now
    a rare, heavy nuke: `35→45` mp and a **15 s cooldown** (was 3.3 s) — CD-led. **Whirlwind** is now mana-led:
    its drain quadruples (`4.8/s → 18/s`) and its cooldown lengthens to **5 s** (was 2 s), so a full pool
    sustains only ~5.5 s of spin. To keep the rarer, costlier spin worth committing to, its **payoff rose with
    it** — damage per hit `22→30` and hit radius `36→44`. Net benchmark: **1 leap + ~3 s of whirlwind ≈ empties
    a fresh 100 pool.** (Swing stays free; dash/heavy cooldowns left as-is pending playtest.)
  - **Phase 2 — God-skill mana cost scales with rank, and you grow into your power.** Two hard-gated charges,
    **no cap**: a **base-aura chunk** charged every **3 s** that **gets bigger every level** (Burning Body
    `10 MP → +27/level → ~253 MP at rank 10`), **plus an additional flat chunk each time an evolved effect
    emits** (Cinderburst nova **+10**, Firebloom ring **+8**, Ascensions Dragonbreath +6 · Chaos Crown +14 ·
    Dragonheart +12 · Cataclysm +16). At rank 10 the skill **averages ~80–100 MP/s**. Because there's no cap,
    a maxed skill's base chunk **outgrows a starting 100-MP pool** — leveling it up can make it cost more than
    you can hold, so it **won't fire until you build Max-MP**. That's the intended arc: power up a skill, watch
    your pool stop covering it, then hunt for `+Max MP`. Both charges are gated: can't afford the base chunk →
    the **whole skill** goes **dormant** (no aura, no emit); can't afford an emit → that **burst is skipped**
    while the aura keeps running. **Passive regen is a tight 1 MP/s** (was ~9/s); `+MP regen` cards loosen it.
    A toggled god skill is **one evolving ability**: toggling it (or it going dormant) hides the **whole** skill,
    and the HUD chip shows the **current evolution** name/icon plus its base chunk cost — turning **red ⛔ when
    your Max-MP can't cover it** (Burning Body → Firebloom → Dragonbreath…).
  - **Phase 3 — toggle your auto-casts on hotkeys 1–9 (and 0)** (in the order you acquire them; default ON),
    shown on a **God-Skill Action Bar** — slotted icons (WoW-style) parked just to the right of the active
    skill toolbar; **only acquired skills get a slot** (the bar grows as you acquire), wrapping to a **second
    row of five** past five skills so it never runs off-screen. Each slot has its hotkey, skill icon, and live
    per-second cost. The slot's **border is the patron's signature colour** when the skill is
    **active**, dims/greys with a ⚠ when **dormant** (toggled on but starved — auto-resumes when regen catches
    up), greys with a ✕ when **toggled off**, and turns **red ⛔ when your Max-MP can't cover the cost** (your
    cue to go build mana). When mana can't cover everything, skills **starve lowest-key-last** — your core (key 1)
    keeps running while the marginal ones drop. (Slot icons use real shared art once it lands; emoji for now.)
  - **MP-investment cards (`+Max MP`, `+MP regen`) now matter twice** — they fund both your manual bursts and
    how many auras you can keep lit, becoming the deliberate early→late loosening of the economy.
  - *Multiplayer/AI-native:* mana is per-player and god-skill firing is host-authoritative, so toggle/dormant
    state is purely local — no protocol change. The `Sim` harness gained `Sim.toggleGodSkill(n)` and now exposes
    each owned skill's `{key, active, dormant, mpBaseChunk, mpEmitCost, mpCostPerSec}` (+ `mp`/`maxMp`) in
    `observe()`, so headless bots can manage mana, see when a skill outgrew the pool, and reflect the real economy.
  - *Dev tooling:* a new **Statforge** (sibling of the Skillforge) — a blue crystal pedestal in the Sanctum
    (walk up + `E`, or `J` anywhere) to **manually set character stats** (Max MP/HP, regen, damage%, crit, …),
    built to crank Max MP and test the rank-scaling god-skill costs. Dev builds only (localhost/file).

## [0.12.0] - 2026-06-12

### Changed
- **Forest trees now generate as formations of small + large trees (was an even scatter of large trees).**
  A new **smaller/bonsai tree set** (`world.treesmall.0..8`) joins the existing large trees, and the
  wilderness forest is now grown from three weighted **formations** instead of an independent per-tile roll:
  most common is a **cluster of small trees** (occasionally a lone small tree); second is a **single large
  tree ringed by a small-tree cluster**; rare is a **lone large tree**. Formation anchors are spaced
  (min-separation) so clusters read as distinct stands rather than a uniform wash. Large trees become
  occasional landmarks; the small understory carries the forest. Tuned for **dense-but-walkable woods** by a
  single physical rule: **any two trees keep a player-width gap between their trunks** (centre-distance ≥
  `rxOf(a) + rxOf(b) + TREE_WALK_GAP`, computed from each tree's real trunk radius). Thin small trunks pack
  close so the ~150px canopies **overlap into a lush continuous canopy**, fat large trunks push apart into
  spread landmarks, and — crucially — a small tree can no longer spawn jammed against a large tree's trunk
  (the cross-set case the old per-set spacing missed). The trunk hitbox was also thinned (`TREE_BASE_RX_FRAC`
  0.30→0.22) so the canopy can be dense while the floor stays weave-through walkable — no impassable walls of
  trees. Checks are O(1) via a spatial hash. Density varies across the map (thick groves + open clearings)
  because the larger clusters overlap in places and leave gaps in others. Spacing is a hard rule enforced with
  O(1) blocked-tile grids. Re-uses the occluding-prop system as-is
  (`gWildTrees`/`gDrawTree`/`gRCTrees` — canopy fade + size-coupled trunk collision unchanged); small trees
  render smaller via a smaller draw scale (both sets are cell-framed to fill their 256² canvas). Seeded, so
  MP-deterministic. Re-sliced large-tree set also wired (canopy top-clip fix); `TREE_FOOT` 0.93→0.94 to
  match the new uniform foot. Live knobs: formation rate/spacing, the three formation weights, cluster
  size/radius, and per-set draw scales.
- **Level-up no longer pauses the game — it's now a non-blocking sidebar (MP-seamless).** Gaining a level
  no longer freezes the world and throws up a full-screen modal. Instead a **level-up icon pulses in the
  bottom-left** (with a count badge if several are queued); **click it to open a left-docked "Choose a
  Blessing" sidebar** while the game keeps running on the right. You **keep full control** — move and
  attack normally with the panel open (clicks on the world still swing; clicks on the panel pick cards) —
  and you stay vulnerable, so leveling up mid-fight is a real choice of *when* to stop and pick. The 3
  cards are now stacked **card-rows** (icon · rarity · name · description · Favor chip). The Lv 5/10
  **Form / Ascension fork** shows its two options as rows **in the same sidebar** (replacing the 3 cards
  that level) — also no pause. Favor reroll / rarity-upgrade / rank-buy all carry over unchanged. Because
  nothing pauses, one player's level-up never freezes the shared world in multiplayer. While the sidebar
  is open the camera **eases over to keep your character centred in the visible (unblocked) area** to the
  right of the panel, then slides back when you close it. *(Art: functional
  CSS frame + existing Cilia portrait now; a painted frame / card icons pass is queued for the Artist.)*
- **Favor coins and treasure chests now use their painted art** (was procedural shapes). Dropped Favor
  surfaces as the gold-coin sprite (with a soft pickup glow + gentle hover); wolf-camp and village chests
  render as a real chest that swaps **closed → open** when looted, and a still-guarded camp chest reads
  dim/in-shadow until you clear the pack. Pure render swap — the Favor pickup and chest-loot logic are
  unchanged.
- **The Goblin Forest is now painted.** The old procedural pixel-canopy trees are replaced by 9 hand-painted
  tree variants (oaks, a willow, banyans) standing in the forest, **depth-sorted with characters** so you
  walk behind a canopy and in front of a trunk. The forest tiles themselves now render as shaded woodland
  floor beneath them (and still slow you, unchanged). Placement is seeded, so co-op players see the same
  forest. **You can't walk through tree trunks** (a player-sized hitbox at each trunk base), and a tree's
  **canopy turns translucent whenever it would hide you**, so standing behind one never obscures your hero.
- **Charging a heavy attack now commits you — no free normal swing mid-charge** (roadmap #6). While a heavy
  is winding up *or* swinging, the normal swing is locked out until the heavy fully resolves; a left-click
  during the heavy is dropped (if you keep LMB held, the swing resumes the moment the heavy ends). Committing
  to a heavy now costs you the poke — weighty-combat directive.

## [0.6.0] - 2026-06-11

### Added
- **God Skills — the god layer pivots to auto-firing abilities (roadmap item 2, slice 1: Burning Body).**
  Pledging to Cilia at the wilderness shrine no longer imbues an active skill — it unlocks her **auto-firing
  god skills** in the level-up draft (Vampire-Survivors-style), class-agnostic so the whole god layer ports to
  the platform's future modes. **Burning Body** ships its full tree: acquire it from a draft card and your body
  becomes an **ignite-aura** — enemies that come near catch fire and burn (no active skill needed); ranks 1–4
  grow the aura. **Form @5** forks it into two pure AOE-burst styles — **Firebloom** (an expanding fire ring
  every ~5s, rhythm + reach) or **Cinderburst** (the aura swells and *detonates* a fixed-radius nova every ~4s,
  burst + stand-your-ground). Ranks 6–9 deepen the Form; **Ascension @10** is the two-age capstone — 🐉
  **Dragonbreath** (a dragonfire ring that breathes in and out, healing on contact) / **Dragonheart**
  (detonations leave healing dragonfire at your feet), or 🔥 **Chaos Crown** (a chaosfire ring that settles into
  a burning ground-circle) / **Cataclysm** (colossal chaosfire blasts that burn enemies *and* you). The whole
  binary-tree draft/evolution machinery was **generalized** (keyed by god-skill id, registry-driven cards), so
  **Trail of Embers** and **Pyroclasm** are now near-pure additions next. The first god skill is guaranteed to
  appear in the draft after pledging, so the auto-fire layer is immediately visible (tuning knob).
- **Three-state fog of war (SC/Dota-style), wilderness.** Replaces the old flat overlay with proper fog:
  **unseen** ground is solid black (you can't tell what's there); **shroud** (ground you've visited but is
  outside your current sight) stays dimly visible so you keep your mental map — but **enemies and pickups in
  the shroud are hidden**; your **current vision circle** is fully bright with everything visible. The vision
  circle is **circular** (daytime spans the screen width; night is tighter) and its edges **fade in smoothly
  at sub-tile resolution** (a low-res fog mask bilinear-upscaled) instead of popping one blocky tile at a
  time. Enemies, enemy
  projectiles (arrows/bombs/fireballs), and pickups are culled outside the sight circle — so an aggroed pack
  can stalk you from the shroud, unseen, and emerge as it closes. The minimap draws a vision-radius ring at the
  player matching the real sight size. Composited on an offscreen layer — darkens only the fog overlay, never
  the game canvas; render-only, MP/Sim-safe.
- **Enemy aggro/leash range decoupled from player vision.** De-aggro is now a fixed range (`ENEMY_DEAGGRO_TILES`)
  instead of being derived from the (now smaller, screen-relative) vision radius — so shrinking what you can see
  doesn't make enemies give up chasing. Spawn distances are unchanged, so packs still appear from beyond sight.

### Fixed
- **Swing: Tempo now raises attack *rate*, not swing animation speed.** The card was shortening each swing's
  animation (`swingDur`) instead of cutting the cooldown between swings, so attacks looked twitchy without
  actually firing more often. It now reduces the post-swing cooldown (`swingCd`, floored at ~0.3s) while the
  swing always plays at its authored pace — the card delivers a genuine fire-rate increase.
- **Swing: Reach now visibly grows the swing.** Wiring was already correct (reach feeds both the hitbox and the
  slash visual), but at +4px/pick on a 52px base the growth was imperceptible; bumped to +8px/pick (~15%) so
  picking it reads as a bigger, longer-reaching swing.
- **The game fully freezes on the level-up screen.** The sim kept running behind the level-up/evolution/shrine
  modals, so bombs, burn, and enemy attacks still hit you while choosing a card. Now the whole sim freezes
  while a modal is open (single-player), and the player is untouchable while paused even in MP where the shared
  world can't freeze (`gDamagePlayer` gPaused guard + `gSimUpdate` freeze).
- **Chaosfire no longer instakills you.** Per-tick self-damage scaled down hard (`CHAOSFIRE_SELF_RATIO`
  0.35→0.07) now that Burning Body's emit damage is large, and **chaosfire is never laid under you** — the
  🔥 **Cataclysm** ascension lays its burning ground as a **ring around you** (`CATACLYSM_RING_TILES`, safe
  centre) like Chaos Crown, so the self-burn is an avoidable hazard you navigate, not death-on-pick.
- **Goblins path around rocks.** The nav grid now blocks each rock's **full collision footprint**, not just
  its centre tile, so a goblin no longer routes into an open tile a big rock's collision actually fills and
  grinds against it (`gBlockRockFootprint`).
- **Heavy attack no longer blows past enemies in its lunge path.** The hit zone is now anchored at the
  lunge's start and extends the full distance lunged + the charged stab reach, so a long/fast charged heavy
  hits everything in its corridor instead of skipping enemies it passed (playtest #1).
- **Normal-attack & heavy-attack sprites render on GitHub Pages.** The swing/heavy pose art could fall back to
  the procedural sprite on the live (case-sensitive, Linux) deploy. The char reclass below moves these to fresh
  paths (`assets/char/player/knight/knightatk-*`, `knightheavy-*`) with the staged tree verified case-exact, so
  the next deploy serves them clean — past any stale Pages/CDN-cached 404.

### Changed
- **`assets/char/` reorganized into per-type folders; the player's visual class is now `knight`.** Each
  character type owns a folder for its whole animation set (`char/<faction>/<type>/` — e.g.
  `goblins/goblin/`, `wolves/alphawolf/`, `player/knight/`) instead of being dumped flat into a faction
  bucket, so growing anim sets stay self-contained. The player's **art class** was renamed `player → knight`
  (manifest keys `char.player.* → char.knight.*`, draw selectors in `drawAnyPlayer`), kept **distinct from the
  game-logic hero identity** — the entity `kind:'player'` and the `SpriteRegistry('player')` pixel-art fallback
  are unchanged (the `player` entity *wears* a class). The player's swing/heavy **attack FX** moved from the
  mislabeled `fx/_shared` ("god-agnostic") to the class owner `fx/knight/` (`fx.knight.slash`/`fx.knight.thrust`).
  Migrated atomically (move + manifest path/key rewrite in one commit) via `tools/reclass-char.py`; no gameplay
  change. Adding a second class is now `char/player/<class>/` + `char.<class>.*`.
- **Playtest tuning (Josh, full-run 2026-06-11):**
  - **Burning Body cards appear far more often** once you've pledged — the patron keeps tempting you with her
    blessing (`GODSKILL_CARD_CHANCE` 0.6, prioritized over patron burn-card injection).
  - **Favor → rank up a god skill on the card.** A god-skill rank-up card shows a clear **⬆ RANK ✦cost**
    button: spend Favor to pour extra ranks into the skill right there, on top of taking the card. Cost now
    **scales with the skill's current rank and persists across level-ups** (`RANK_BUY_BASE`/`STEP`), so maxing
    a skill is a large escalating Favor investment — not two cheap level-ups. Rarity-upgrade tiers also steepened
    (`UPGRADE_COSTS` 4/8/16 → 8/20/44).
  - **Wolves ease up early + pause after lunging.** Direwolf bite 15→9, alpha 25→15; after a pounce the wolf
    now **plants fully for ~0.5s** (exposed, not circling) — a clear retaliation window (`WOLF_LUNGE_RECOVER`).
  - **Goblin King HP 500 → 3000 (+500%)** — an epic, long boss fight.
  - **Dragonbreath follows you.** The dragonfire breathing ring now emanates from the player and **tracks your
    movement** (re-centres each frame) instead of breathing from a fixed spawn point, on a near-continuous
    cadence (`follow` flag + `interval:130`) — a dragon's breath that moves with you.
  - **Wolf lunges are slower + more telegraphed.** Pounce impulse lowered (`WOLF_LEAP_MAX` 22→16, slower
    `lungeSpeed`), and the pre-lunge tell + post-lunge plant both lengthened (`biteWindup` +6, `WOLF_LUNGE_RECOVER`
    32→42) — more time to read and punish.
- **Attacks step you forward — weighty, committed melee (Josh).** A **normal swing now lunges the player
  forward** in the committed aim direction (Dark Souls-ish), and you **can no longer free-move during a
  swing** — the strike itself carries you, so attacking is a commitment, not a free action. The **heavy
  attack's forward lunge now scales with charge**: a tapped heavy steps a little, a full-charge heavy drives
  you far forward (it was a fixed distance before). Tunable knobs: `SWING_LUNGE_SPEED`/`SWING_LUNGE_FRAC`,
  `HEAVY_LUNGE_FACTOR`/`HEAVY_LUNGE_CHARGE_K`.
- **The active kit reverts to plain/class-neutral (god-skill pivot migration).** Whirlwind, dash, and heavy
  no longer spawn fire when Cilia is your patron — those FX systems now power the auto-firing god skills
  instead. The old per-skill imbue path (**Dance of Fire**, the fire swing) is **retired and parked** (kept in
  the code for a future return as a 4th Cilia god skill, but no longer reachable in play). The shrine pledge is
  now a single step (no skill-picking sub-menu).
- **Wolf camps stream their packs in/out (perf).** The 40 neutral wolf dens no longer spawn all their
  packs (~160 wolves) up front at run start — each pack now instantiates only when the player comes
  within ~45 tiles of the den and is shed once they roam past ~62 tiles, so just the handful of dens
  near the player ever run AI + separation. The den's rock crescent and chest still render at any range
  (a den you spot from afar still looks "loaded"); the pack appears as you approach. A struck or
  half-fought den keeps its state — only a pristine (un-engaged, intact) pack is shed, and it leashes
  home + de-aggros well before the despawn radius. Per-camp `cleared` / `respawnAt` / chest state lives
  on `gWildCamps` (not `gEnemies`), so the 3-minute clear→reward→respawn cycle survives unload/reload.
- **Wolf combat — bite lands on contact, real pounce, readable pause.** Four fixes to the lunge-bite:
  (1) the hit reach is re-anchored to the colliders (`e.r + target.r + snout`) so it lands on visible
  sprite contact, slightly inside the silhouettes — it was a 54/66px reach that bit from a sprite-width
  away; (2) the pounce is now a gap-scaled **leap** that actually closes the distance, so a standing
  target gets bitten (the hit was checked once at launch and always fell short); (3) wolves **plant
  fully in place for ~0.37s (direwolf) / ~0.47s (alpha) before pouncing** — a clear, dodgeable tell
  (the windup only damped velocity before, so momentum carried them through it); (4) the airborne lunge
  frame now shows only during the actual pounce or when hopping a rock, not during the windup crouch.
- **Playtest balance & enemy AI.**
  - **Fire waves fall off with distance** — near-full power point-blank, fading to ~35% damage / ~15%
    knockback at max range (knockback drops faster), so a maxed wave no longer launches everything at
    arm's length. Tunable: `FW_FAR_DMG` / `FW_FAR_KB`.
  - **The Goblin King barely flinches** — a data-driven per-enemy `kbMult` (king ≈ immovable) read by
    `_enemyKbMult` at every knockback source (melee + all `gDealEnemyDamage` callers).
  - **Wolf packs pace themselves** — they circle at flank distance and **attack one at a time** (a
    per-pack lunge token) with a slower approach, fixing the early-game charge-and-instakill; and they
    **chase 33% further** from their camp before leashing back (`WOLF_LEASH_R`).
  - **Village & shrine guardians hold their post at night** — the wilderness night infinite-aggro no
    longer drags held goblins out of their camp; a guardian now wakes only on real proximity or when
    attacked (`eAnyPlayerNear` gained an `ignoreNight` option used by the hold-position release).

### Added
- **Rocky outcrops are now collidable entities of varying sizes.** Rocks moved off the tile grid into
  free-placed entities (`gRocks`) with per-rock size/height: depth-sorted with characters so tall
  boulders occlude and small ones tuck behind, circle-collision (`gRCRocks`) the player and ground
  enemies weave through, generated as organic clusters (`_genRockOutcrop`) mixing small rubble with the
  occasional big boulder. The open wilderness gets 60–110 such outcrops (replacing the old uniform
  tile-rock blobs), and each wolf-camp den arc is dressed with boulder clumps. Outcrops reject onto open
  ground so they never block the shrine / villages / obelisks / camps; wolves keep their climber identity
  (skip rock collision); sizable rocks stamp the nav grid so enemies route around them. The painterly
  **rock-outcrop + wooden spike-fence tile cutouts** are also wired (transparent cutouts over a ground
  base via `gTileProp`) for the camp crescent walls and village fences.
- **Imbue Paths — Dance of Fire, a full 1→10 mastery tree (roadmap item 2, Phase 1).** The
  imbued-skill mastery system that fixes "leveling is repetitive." Imbuing the swing with Cilia now
  creates a *named Art*, **Dance of Fire**, that you rank up 1→10 through the level-up draft, with two
  branch points that reshape how it plays.
  - **Numeric ranks (1–4):** a rank-aware **"Dance of Fire"** card (in the existing `actives` pool,
    RNG-governed and rarity-scaled like any card) fattens the fire wave's damage, arc width, travel, and
    burn duration per rank.
  - **Form fork @5 (the identity moment):** a one-time **2-option chooser** (shown instead of the card
    draft that level-up) transforms the wave into one of two Forms — **Emberfan** (a fan of fireballs
    that flies far — ranged poke/kite) or **Cinder Ring** (a ring of flame erupting around you — close
    crowd punish). Ranks 6–9 then deepen the chosen Form (more fireballs + pierce / wider ring). The
    choice is permanent for the run, so two players' builds genuinely diverge.
  - Built on a **reusable, data-driven tree model** (`IMBUE_PATHS` registry + per-player `imbuePaths`
    state, parallel to `skillMods`; local-only, reset per run) so the remaining skills + the Chaos fork
    layer on without rework. Effective wave params flow through one clamped accessor (`gFireWaveParams`);
    **rank 0 is identical to the pre-item-2 wave**, so no regression. Emberfan rides a small MP form byte
    (`fwf`); Cinder Ring reuses the existing fire-ring sync channel.
  - **AI-native:** the fork is a pausing modal, so it ships with a `gSimEvolution` harness hook (mirrors
    `gSimDraft`) resolved in all bot/headless loops — `Sim.batch` never stalls on it. Per-skill rank +
    pending fork are exposed via `Sim.observe`.
  - **Card level track + readable wave shape (feel pass).** The "Dance of Fire" draft card now shows a
    **10-dot rank track** (the 5th/10th dots larger to mark the evolution levels; the next level flashes
    on hover). And the base fire wave starts **smaller** and grows the right way — leveling **widens the
    arc and extends the reach** rather than ballooning sideways — with the **hitbox matching the drawn
    arc** exactly (one source of truth), so what you see is what you hit. All shape values are on named,
    tunable knobs (`FW_HALF_ANGLE`/`FW_DRAW_FUDGE` + the registry `waveStep`).
  - **Ascension fork @10 — the turning of the age (the capstone).** A second one-time chooser at rank 10
    picks which way your power turns, and rewrites the LMB into a **3-hit escalating combo** whose 3rd hit
    is the climax:
    - 🐉 **Old-god / Dragon (sustain):** *Dragonfire* (Emberfan) blasts three forward fire jets, or
      *Dragondance* (Cinder Ring) scorches a solid ring-field — both lay **dragonfire that HEALS you** while
      you stand in it. Lower ceiling, bought survivability.
    - 🔥 **New-god / Chaos (power + cost):** *Flame of Chaos* (Emberfan) hurls a massive slow orb leaving a
      ball-wide chaosfire lane across 20 tiles, or *Helldance* (Cinder Ring) fills a solid disc — both lay
      **chaosfire that burns enemies AND you** if you stand in it. Massive AOE, real self-cost.
    - New FX systems (`gFireJets` beams, `gFireFields` discs, two-substance burning ground with owner
      heal/self-burn) reuse the burning-ground/pillar sprites as placeholders; the rank-10 chooser reuses
      the Slice-B evolution overlay + `gSimEvolution` hook (headless-safe). **Dance of Fire's tree is now
      complete through rank 10.**
- **Patron Cards — your god choice reshapes your draft (roadmap item 0c).** A new, reusable card
  category (`PATRON_CARDS`) that only appears when you've pledged to a patron, buffing *that god's
  signature mechanic*. Every future god drops its set into the same pool keyed by `patron`; **Cilia
  ships first with a 3-card burn set.** When a patron is active, ~25% of drafts swap one fill slot for
  a patron card (the ≥1 passive / ≥1 skill guarantee is preserved). Uncapped, like the rest of the pool.
  - **Conflagration** — +6%/pick chance *per burn tick* for a burning enemy to **detonate**: a small
    AoE that damages and **re-ignites** nearby enemies, so a full burn build chains pack-to-pack.
    Blast scales off the enemy's current burn tick (~4×). Chance clamps at 100%.
  - **Lingering Flame** — +0.5s burn duration/pick (more ticks at the same per-tick damage, so it
    doesn't dilute the explosion).
  - **Searing Heat** — +20%/pick burn tick damage (also feeds the Conflagration blast).
  - All host/SP-authoritative (burn already was) — burn + explosion resolve host-side and sync via the
    existing entity/`s.bn` streams, so **no MP-protocol change**. Known minor MP gap: the explosion
    *particle* burst draws host-side only; clients still see the damage, deaths, and burning sync.
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

### Fixed
- **Player walk-cycle halo + missing E/W shoe (art).** The 8-direction walk sprites showed a grey edge
  halo in motion and the east/west frames were missing part of the front shoe. Three stacked cutout
  defects: a grey colour fringe, a bright near-opaque rim a soft-band metric never measured, and a baked
  cast-floor-shadow. Fixed by `defringe-sprite.py` v2 (clamps + measures the full `α<245` edge ring) plus
  a boot-protected `--shadow-bg` re-cut of all six clip-derived directions (new `--shadow-lum`/
  `--shadow-band` knobs spare the dark boots the shadow seed was eating). All 8 facings clean, boots
  intact, registration unchanged — same filenames, no `index.html`/manifest change.

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

_Pre-rename history (Dungeon Forge, v0.9.0–v0.11.0) archived → [docs/archive/changelog-dungeon-forge.md](docs/archive/changelog-dungeon-forge.md)._
