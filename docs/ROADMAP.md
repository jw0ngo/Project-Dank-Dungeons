# To Dust — Product Roadmap

*The single source of truth for **what we're building next and why.** Plain-English at the top of each
item for a quick read; a collapsible **🔧 Build notes** block on each carries the technical detail
engineering needs. The Product Manager owns this doc ([`agents/product/product.md`](agents/product/product.md));
engineering builds **approved** items from *Now*, top-down ([`agents/engineer/engineer.md`](agents/engineer/engineer.md)).*

---

## 📍 Where we are (June 12, 2026)

**🎯 Vertical slice ~90% done (Josh, 2026-06-12).** The build-craft spine is complete and **now LIVE (deployed
2026-06-12)**: **all three Cilia God Skills** — Burning Body + **Trail of Embers** (reworked tree: Inferno
Wake/Firesteps + cone emitter) + **Pillars of Fire** (formerly Pyroclasm — mouse-aimed lane; **Riftmaw**, the
map-crossing chaos rift, the session standout) — plus the **card-pool consolidation** (item 10) and the
dragonfire/chaosfire FX set, all on `origin/main`. **Remaining 10% = a god-skill feel-tuning pass**
(intensity/variety per capstone — *not* uniform "epic"; some capstones stay modest by design) **+ the queued
ascension refinements + Dragon–Chaos synergy tune.**


**v0.5.0 is live; a large `[Unreleased]` block is staged** (fix it into the next tag). Both weak points
the first slice playtest surfaced now have their fixes in the build (item 1 difficulty curve **playtested
OK**; item 0b/0c level-up depth shipped).

**✅ Shipped 2026-06-12: item 7 (mana economy, all 3 phases) + the God-Skill Action Bar.** Mana is now a real
shared resource — class costs/CDs rebalanced (run dry early), God Skills drain mana/sec (cost scales with rank,
no cap → "grow into your power"), and toggleable auto-casts on keys 1–9 with a **WoW-style action bar** (god-coloured
border state tell, real-icon hook wired). The cost model + the **build-potential north star** (freeze the mechanic,
put build variety in the card pool — sustain *and* burst both viable) are locked in [`specs/mana-economy.md`](specs/mana-economy.md).
**Item 6 (heavy-charge lockout) also shipped.** So the active work is now **item 2's remaining God Skills.**

**🔀 Major direction change (Josh, 2026-06-10) — the god layer pivots to auto-firing God Skills.** The
action-combat system is a **reusable platform** and *To Dust* is **mode one** (MOBA/MMORPG are future modes;
Creative Manifesto Direction Log). **Classes** own the active manual kit (platform-layer, AQWorlds-style);
so gods can no longer imbue active skills. Instead each god grants **class-agnostic, auto-firing abilities
(Vampire-Survivors-style)** that play on intervals as you move — keeping the **binary-tree rank evolution**
(Form @5, two-age Ascension @10) but cutting the tie to any active skill. **No element skin on the class kit.**

**This supersedes the old "Imbue Paths" (active-skill) build.** New source of truth:
[`specs/god-skills.md`](specs/god-skills.md). Burning Body (the first God Skill) shipped; the remaining two
(**Trail of Embers · Pyroclasm**) are still approved — a **trigger swap** on already-tuned FX, cheaper than it looks.

**🔝 Priority re-rank (Josh, 2026-06-11): the mana rework (item 7) goes FIRST, ahead of the new skills.** And
**the new skills take direction from the mana rework** — Trail of Embers / Pyroclasm get designed + built *after*
item 7 lands, so they're authored with their per-second `mpCost` + toggle behaviour from the start (not retrofitted).
~~So the live build order is: item 7 (mana) → item 6 → item 2 Trail/Pyroclasm.~~ **DONE — items 6 & 7 shipped
2026-06-12.** Live build order is now: **item 2 — Trail of Embers → Pyroclasm** (both unblocked; authored with
their `mpCost` + toggle from the start, as planned) **+ the queued Burning Body enhancements** (Ascension
refinement: Eye of Chaos + Chaos Steps + Chaos Crown footprint fix; Dragon–Chaos synergy tune). Boreas (item 5)
stays parked — its unhold trigger ("once God Skills proves out in playtest") nears once item 2 completes + plays well.

**🆕 First mana-economy playtest landed 6 game-feel / readability / bug calls (Josh, 2026-06-12) → item 8, a
quick polish batch (all `approved`, developer-directed).** Pillar-1 work, so it interleaves with item 2: the
three cheap irritant-fixers (wolf leap whiffing, XP/Favor popups jumbling, fog-edge shimmer) are worth grabbing
*first* — tiny, and they clean up every subsequent playtest. Detail + anchors in the Engineer lane of [`TASKS.md`](TASKS.md).

## ⚡ At a glance

| # | What we're building | Status | Size | Why it matters |
|---|---|---|---|---|
| **0** | **Player animation pass** — directional walk, dash poses, heavy-attack windup | ✅ Shipped (2026-06-11 — playtested OK) | Ongoing | Game feel + the *weighty-combat* directive made visible |
| **0b** | **Combat card pass** — per-skill dmg cards (Swing/Heavy) + Heavy: Reach + **pool-wide cap removal** | ✅ Shipped (v0.5.0) | Quick | Build identity in the draft + lucky-run variance; RNG governs (caps removed) |
| **0c** | **Patron Cards** — patron-gated draft cards (Cilia burn set: explode / duration / tick dmg) | ✅ Shipped (Unreleased) | Session | Your god choice reshapes your draft; reusable per-god system serving god-identity |
| **1** | **Make late-game dangerous** — enemies scale harder + glow yellow→red as they get deadly | ✅ Shipped (Unreleased) — playtested OK | Multi-session | Fixes the flat difficulty curve (playtest weak point #1) |
| **2** | **God Skills** — Cilia's 3 best fire skills become **auto-firing (VS-style)** abilities, class-agnostic, keeping the 10-rank binary-tree evolution | 🔄 **All 3 LIVE** (Burning Body + Trail of Embers + Pillars of Fire — deployed 2026-06-12) — **remaining = feel-tuning + queued refinements** (ascension refinement, Dragon–Chaos synergy) | Large, phased | The build-craft spine, now portable across platform modes; fixes boring level-ups (#2) |
| **3** | **Wolves stop getting stuck** on their dens + ignore forest slow | ✅ Shipped (v0.5.0) | Quick | Bug fix — unblocks wolf playtesting |
| **4** | **Wolves hit harder early** | ✅ Shipped (v0.5.0) | Quick | Makes a wolf camp a real risk, not free loot |
| **5** | **Boreas** — a second god (ice/control) | ⏸️ Held | Multi-session | Parked — the playtest showed we don't need it yet |
| **6** | **Heavy charge locks out the normal swing** — committing to a heavy means committing | ✅ Shipped (2026-06-11) | Quick | Weighty-combat directive: a committed action must cost you other options |
| **7** | **Mana economy & skill management** — costs/cooldowns rework so you run dry early; God Skills drain mana/sec; toggle auto-casts to keys 1–9 + WoW-style action bar | ✅ Shipped (2026-06-12, all 3 phases + action bar) | Multi-session, phased | Makes mana a real resource + a live build-management decision (weighty combat + build depth) |
| **10** | **Card-pool consolidation** — collapse ~33 draft cards → ~23: per-skill sprawl folds into broad character stats (Strength = melee dmg, Ferocity = crit+critdmg, Dexterity = atk speed, Reach = swing+heavy reach) + one **Mastery** card per active skill (Whirlwind/Leap/Dash) + **Grit Mastery** (4 Grit cards → 1) | ✅ Shipped (deployed 2026-06-12) | Session | Build-craft + game feel — every draft pick becomes a real, legible build choice |
| **9** | **God Stat Identities** — each god's mechanics read the character stats that express its identity (Cilia ← crit; Ikras ← atk/move speed; Boreas ← mana-regen/pickup/CDR; Bhumi ← HP/regen), so generic stat cards become build-defining per patron | ◻️ Cilia slice approved; rest design-ahead | System (Cilia slice quick) | Build-craft depth + god identity — generic stats gain god-specific meaning, near-zero new content |
| **8** | **Playtest feel/readability/balance batch** — wolf-leap fix · XP/Favor colour split + aggregated XP counter · fog-edge smoothing · gradual night-vision · out-of-combat HP **&** mana regen · LOS tree-reveal · early-game difficulty scale-back · **Burning Body mana→dps rescale** | ◻️ Approved (2026-06-12) — 9 tasks in Engineer lane | Quick (batch ≈ 1 session) | Game feel + readability + early-game balance (pillar 1) — fixes the irritants the first mana playtest surfaced |

---

## Now — what engineering builds next (in this order)

### 0b. Combat card pass — per-skill damage cards + Heavy: Reach retarget

`✅ shipped` (v0.5.0, 2026-06-10 — incl. the pool-wide cap removal; PM may fold to changelog) · **Size:** quick · **Pillars:** build-craft depth, game feel · **Art:** none

**What:** Four changes to the level-up draft, all in the existing card pools:
1. **New "Swing: Bite"** — a +% damage card for the *normal swing only*.
2. **New "Heavy: Devastation"** — a +% damage card for the *heavy attack only* (reusing the freed name).
3. **Retarget "Heavy: Devastation" (the width card) → "Heavy: Reach"** — make the heavy hit reach
   *longer* (forward length) instead of *wider* (fan), per Josh's call. Rename + retarget the same card.
4. **Remove caps pool-wide** — every card becomes uncapped (Josh, 2026-06-10); the draft RNG is the
   only governor. One small safety pass first (the two unfloored cooldown cards — see build notes).

**Why:** Today the only damage card is **Bloodlust** (global +5%). There's no way to *commit to one
attack*. Per-skill damage cards add the first real "go-deep vs. go-wide" choice to the draft — build
identity, which is the thing the playtest said level-ups lack. (Pre-figures the Imbue Paths fork.)

**Balance — the governing principle (Josh, 2026-06-10):** a card that buffs **one** skill must give a
**greater %** than the universal card, or it's *strictly dominated* (Bloodlust covers swing + everything
else for the same number). The premium is what makes the specific card a real choice. Universal stays the
generalist's pick (covers the whole kit); specific is the specialist's higher ceiling.

| Card | Scope | Per-pick | Cap | Max |
|---|---|---|---|---|
| Bloodlust *(existing, unchanged)* | all damage | +5% | 8 | +40% |
| **Swing: Bite** *(new)* | swing only | **+8%** | **none** | uncapped |
| **Heavy: Devastation** *(new)* | heavy only | **+8%** | **none** | uncapped |
| **Heavy: Reach** *(retarget of old Devastation)* | heavy length | +8 px/pick | **none** | uncapped |

**Caps removed pool-wide (Josh, 2026-06-10):** *every* card is now **uncapped** — balanced by the *draft
RNG* (you're not reliably offered the card you want, so reliably stacking one is the rare, lucky-run
payoff, not the norm). Safe because the only degenerate states are guarded *independently of caps*: crit
chance is hard-clamped to 75%, global cooldown (`wildDexCdMult`, L12228) is clamped to 99%, and
swing-speed / heavy-charge / dash-cooldown are floored in `SKILL_STAT_FLOOR` (L2431). ~~The one gap —
`Whirlwind: Rhythm` / `Leap: Tempo` floors~~ **(eng audit 2026-06-10: not a gap — `SKILL_STAT_FLOOR`
already floors `wwCooldown: 30` and `leapCooldown: 45`, and Grit's trigger streak floors at 2 in
`gGritStreak`. No safety pass needed; caps removed pool-wide as-is.)**

<details>
<summary>🔧 Build notes (engineering)</summary>

- **Pool-wide cap removal** — strip the `cap` field from **all** `PASSIVE_CARDS` / `SKILL_CARDS` /
  `GRIT_CARDS` entries. `gCardAvailable` falls back to `c.cap||99`, so an omitted cap = the card stays in
  the pool every level-up; draft RNG is the only governor. (Mechanically the three new/retargeted cards
  below just never carry a `cap` to begin with.)
- **Safety pass — floor the two unfloored cooldown cards FIRST** (do this before/with the cap strip): add
  `wwCooldown` and `leapCooldown` entries to `SKILL_STAT_FLOOR` (L2431–2432) so uncapped `Whirlwind: Rhythm`
  / `Leap: Tempo` can't drive those cooldowns to ~0 (spam). Floor each so the ability bottoms out around
  **~0.5–0.75s (≈30–45 frames)** — engineer reads each base and picks the exact floor. Everything else is
  already guarded (crit 75% clamp, global `cdPct` 99% clamp, swing/heavy/dash floors), so no other floors needed.
- **Swing: Bite** — new `SKILL_CARDS` entry (`id:'sw-dmg'`, `cat:'skill'`, always-on like the other swing
  cards, `icon:'⚔'`, **no `cap`**), writes a new `swingDmgPct` skillMod. Apply in **`gDoSwingAt` (~L3392)**:
  multiply the computed `dmg` by `(1 + pSkillStat(p,'swingDmgPct')/100)`. Stacks on top of the global
  `damagePct` (`_dbuf`). Add `swingDmgPct:0` default wherever `pSkillStat` reads its base.
- **Heavy: Devastation** (new) — new `SKILL_CARDS` entry (`id:'hv-dmg'`, `req:()=>gIsSkillUnlocked('heavy')`,
  `icon:'🔨'`, **no `cap`**), writes `heavyDmgPct`. Apply in **`gDoHeavyAtk` (~L3824)**: multiply
  `chargedDmg` by `(1 + pSkillStat(p,'heavyDmgPct')/100)`. Stacks on `_dbuf`.
- **Heavy: Reach** — the existing `id:'hv-rad'` card (currently `name:'Heavy: Devastation'`, `apply` →
  `heavyWidth`, **L12308**): rename to `'Heavy: Reach'`, retarget `apply` → `heavyLen` (base **56**,
  `W()` ~L2387; already ×2 when charged), `base:8`, **remove its `cap:6`**, `fmt:v=>\`Heavy +${v} reach\``.
  Drop the `heavyWidth` mod entirely (no width card remains — fine, that was the less-loved axis).
- **Tooltip honesty:** the char-screen skill details (~L10850) already show live buffed damage — confirm the
  two new `%dmg` mods flow into that path so the displayed swing/heavy numbers match what you hit for.
- **Sim hook:** these are new `cardPicks` ids — they ride the existing `gDrawCards`/`_pickCard` plumbing, no
  new harness wiring beyond the new ids appearing in the pool.
- **No art, no MP-protocol change** — skillMods are already per-player and network-synced via the card-pick path.
</details>

---

### 0c. Patron Cards — patron-gated level-up cards (Cilia burn set first)

`✅ shipped` (Unreleased, 2026-06-10 — fold to changelog at next tag) · **Size:** session · **Pillars:** build-craft depth (the heart), game feel · **Art:** none (reuses fire particles; fire card-frame is stretch)

**What:** A **new card category that only appears when you've pledged to a patron**, buffing *that god's
signature mechanic*. It's a **reusable system**, not 3 one-off cards — every future god (Boreas freeze,
Ikras chain, Bhumi thorns) drops its own set into the same slot. **Cilia's set ships first (3 burn cards).**

**Why:** The cheapest, highest-identity way to make your *god choice reshape your draft*, not just your
skills — directly serves the god-identity north star. Sits as a light "elemental flavor" layer between the
generic stat cards and the heavyweight Imbue Paths tree (item 2).

**Player experience:** Imbue with Cilia and your drafts start occasionally offering glowing fire cards no
other build sees. Stack burn duration + tick damage + explode-chance and your DoT becomes a chain-reaction
engine — one ignited enemy detonates and re-ignites the pack.

**The Cilia set:**
| Card | Effect | Starting value (tune by playtest) |
|---|---|---|
| **Conflagration** | +% chance *per burn tick* for a burning enemy to explode (AoE that re-ignites) | +6%/pick · **chance clamps at 100%** |
| **Lingering Flame** | +burn duration | +0.5s (30f)/pick · uncapped |
| **Searing Heat** | +% burn tick damage | +20%/pick · uncapped |

**Resolved design calls (Josh, 2026-06-10):**
- **Explosion model:** AoE damage **scales off the enemy's current `_burnTickDmg`** (~4× a tick) and
  **re-ignites** enemies caught in the radius — so a full burn build chains pack-to-pack (Searing Heat feeds
  the explosion; the three cards interlock).
- **Appear rate:** **~25% chance per draft** that one of the 3 offered cards is a patron card (when the
  patron is active) — occasional/special, RNG-governed like the rest of the pool.

<details>
<summary>🔧 Build notes (engineering)</summary>

- **New `PATRON_CARDS` pool** (mirrors `SKILL_CARDS` shape) keyed by patron god. Each card carries its
  `patron:'cilia'`. **Gate:** available only when that patron is active — `gPlayer.imbues` (skillId→god,
  ~L3045) contains the patron, i.e. `Object.values(p.imbues||{}).includes('cilia')`. Add a
  `gActivePatron(p)` / `gIsPatronActive(p,'cilia')` helper if cleaner.
- **Draft injection:** in `gDrawCards` (L12350), after the normal guaranteed-mix draw, roll **~25%**; on
  success and if ≥1 patron card is available, replace one non-guaranteed slot with a rolled patron card
  (de-dupe by id, independent rarity like other cards). Keep the ≥1 passive / ≥1 skill guarantee intact.
- **Uncapped** (consistent with 0b pool-wide removal) — omit `cap`. **Conflagration's chance clamps at
  1.0** in apply (`Math.min(1, …)`), like Precision's crit clamp.
- **The three burn levers** — add player mods (e.g. `wildBuffs.burnExplodeChance` / `burnDurMult` /
  `burnTickMult`, defaulting 0 / 1 / 1):
  - **Lingering Flame** → scale `durFrames` at burn-apply (the `burnDur` passed into `gApplyEnemyBurn`,
    L5339 — or scale `_burnTimer` there by the local player's `burnDurMult`).
  - **Searing Heat** → scale `_burnTickDmg` (in `gApplyEnemyBurn` L5341, multiply `per`/`totalDmg` by
    `burnTickMult`).
  - **Conflagration** → in the tick loop `gUpdateEnemyBurn` (L5353), each tick `if(rand < burnExplodeChance)`
    spawn an explosion: AoE damage ≈ `4 × en._burnTickDmg` to enemies within a small radius, re-apply burn to
    those caught (chain), `spawnGP` fire particles + a flash. Host-authoritative (burn already is — L5348),
    so no MP-protocol change.
- **MP note:** burn + explosion resolve host-side; the burning visual already syncs via `s.bn` (L8987). The
  explosion FX on clients can ride the existing particle/flash path or a lightweight event — engineer's call.
- **No new art required.** Stretch: a fire-themed card-frame so patron cards *read* as special in the draft.
- **Boundary vs. item 2 (Imbue Paths):** Patron Cards buff the **element's signature DoT (burn)**; Imbue
  Paths restructure each **skill's shape**. Keep them distinct — don't let item 2 absorb or double-count
  burn scaling. (Noting here; will mirror into the item-2 spec.)
</details>

---

### 1. Make late-game dangerous — enemy scaling + a visible danger tell

`✅ shipped` (Unreleased, 2026-06-10 — **playtested OK**, Josh) · **Size:** multi-session · **Pillars:** game feel, mastery · **Art:** glowing eyes (no new sprites)

**What:** Enemies barely get tougher as the nights pass right now. We'll make the difficulty genuinely
ramp the way *Vampire Survivors* does — more enemies, deadlier mixes, and more damage as the run goes on —
and let players *see* danger coming: **enemy eyes glow yellow at medium difficulty and red at the
hardest.**

**Why:** This is the #1 playtest finding. A flat curve means the late game feels the same as the early
game instead of escalating into a real threat — so the whole "can the player out-scale the curve?" test is
unfalsifiable until the curve actually climbs.

**Player experience:** Night 1 is a readable trickle of goblins. Later nights are visibly denser and
mixed (tougher enemy types weighted in), hit harder, and the glowing eyes telegraph a dangerous night and
juiced-up elites — hard, but fair and readable.

<details>
<summary>🔧 Build notes (engineering)</summary>

- **The current slopes are too gentle:** HP/dmg `×(1 + threat·0.25)`, speed `×0.08`
  (`wildThreatMult`/`wildSpeedMult`, `~11977`); ambient count `20 + threat·1.5` (`gWildAmbientTarget`,
  `~12746`); horde `20 + 10/night` capped 60 (`_wildHordeSize`, `~12656`).
- **Core:** steeper, *breakpointed* scaling — HP/dmg/count slopes **plus a composition table** that shifts
  the spawn mix toward tougher types (warrior/shaman/bomber) at `wildThreatLevel` thresholds (the VS
  lesson: pressure comes from density + mix-shift + breakpoints, not a smooth multiplier). Add a per-enemy
  **threat-tier flag** driving a two-tier additive **eye-glow overlay** on the enemy render.
- **Touches:** `wildThreatMult`/`wildSpeedMult` (`~11977`), `_wildHordeSize` (`~12656`),
  `gWildAmbientTarget` (`~12746`), swarm-composition unlocks (`~12664`), `_wildScaleEnt` (`~2689`).
- **Stretch:** per-night modifier flavor (e.g. an all-bomber night); a screen/audio cue when eyes go red.
- **Art hand-off:** eye-glow is a tint pass, **no new sprites** — Artist owns the look once the
  threat-tier flag exists.
- **Balance — tune the slope, not the base:** hold the Cilia kit's numbers fixed; push the curve until the
  "felt wall" moves later and reads as fair. Levers: HP/dmg/count slopes · per-archetype threshold nights ·
  glow-tier cutoffs. Counts must ramp *within* the live spawn cap (perf) — mix-shift carries the rest.
</details>

---

### 2. God Skills — Cilia's fire skills become auto-firing abilities

`🔄 in-progress — Burning Body + action bar shipped; Trail/Pyroclasm + refinements remain` (Josh-directed pivot 2026-06-10; **supersedes old "Imbue Paths" active-skill model**) · **Size:** large, phased · **Pillars:** build-craft depth, game feel, mastery
**Source of truth:** [`specs/god-skills.md`](specs/god-skills.md). (Old active-skill design archived in [`specs/imbue-paths.md`](specs/imbue-paths.md).) **Build order:** ✅ **Burning Body** (slice 1, shipped) → **🔜 Trail of Embers** (movement-emit; Inferno Wake 🔥 = **Chaos Steps**) → **Pyroclasm** (interval + auto-target) → **queued refinements** (Burning Body Ascension: Eye of Chaos + Chaos Crown footprint fix; Dragon–Chaos synergy tune). **Item 7 has shipped — Trail/Pyroclasm are now UNBLOCKED and the live next build.**
> **✅ Unblocked (was: sequenced AFTER item 7, Josh 2026-06-11):** item 7 (mana) shipped 2026-06-12, so the remaining
> two skills are **cleared to build now** — authored with their per-second `mpCost` + toggle from the start, as planned. Each is
> authored with its `mpCost` + toggle from the start rather than retrofitted. Burning Body's mana cost is item 7 Phase 2.
> **Redirect (Josh, 2026-06-11):** skill 1 "Pyre Waltz" → **Burning Body** — refocused on fire's true identity
> (**AOE burst + burn → explosions**, *not* movement/pull). Base is an ignite-aura; Forms = **Firebloom** (rings)
> / **Cinderburst** (detonations). Detail in the spec.
> **Ascension refinement (Josh, playtest 2026-06-11):** Cataclysm → **Eye of Chaos** (a new slow ebbing chaosfire
> ring) and the two 🔥 chaos leaves **swap Forms** so Firebloom owns two rings, Cinderburst two detonations.
> Spec'd (rank-10 table) + filed to the engineer lane. Detail in the spec.

**What:** The god's power is no longer welded to your active skills — it's a set of **auto-firing abilities
(Vampire-Survivors-style)** that play on intervals as you move and fight, sitting on top of *whatever* class
kit you have. Cilia's launch loadout = three fire skills: **Burning Body** (an ignite-aura that bursts into
fire rings / detonations, around you), **Trail of Embers** (a burning trail you lay as you walk), **Pyroclasm**
(an auto-aimed line of fire pillars at range). Each keeps the **10-rank binary tree** — **Form fork @5** (how it plays) and the
**two-age Ascension @10** (🐉 Dragon *heal* vs 🔥 Chaos *self-burn* peak). 4 endpoints per skill.

**Why the pivot:** the combat system is a **reusable platform** (this roguelike is mode one; MOBA/MMORPG are
future modes — Creative Manifesto canon). **Classes** own the active manual kit, so the god layer must be
**class-agnostic** to port across modes — auto-firing skills achieve that. It's *also* the better-proven
roguelike build model (Hades boons / VS weapons): depth from **what auto-fires and how it stacks**, not from
transforming each class's actives. And the conversion is cheap — the FX systems already exist; the work is a
**trigger swap** (channel/dash/release → timer/movement/auto-target).

**Why it's cheaper than it looks:** `gFireRings` / `gFireTrails` / `gFirePillars` are built and tuned; the
two-age **dragonfire heal-ground / chaosfire self-burn ground are shipped** (Slice C) and reused as-is.
**Pyre Waltz already spawns a ring every 2s** — drop the whirlwind gate and it auto-fires. Build it first.

**Story hook (Creative Manifesto canon):** the gods are waning and channel "perceived higher powers" to
survive — *the turning of the age*. A skill pushed to its rank-10 peak routes *out of the current age*: reach
**back** to the Animal-Spirit old gods (🐉 the Dragon — fire that *heals* you) or **forward** to the half-born
Concepts (🔥 Chaos — massive AOE that *burns* you). What *"To Dust"* means, made playable in one choice.

<details>
<summary>🔧 Build notes (engineering)</summary>

- **The core work is a TRIGGER SWAP, not new FX** — see the table + per-skill conversions in
  [`specs/god-skills.md`](specs/god-skills.md). Decouple each fire FX from its active skill into an independent
  per-skill updater ticked from `gUpdatePlayer` (cooldown timer for Pyre Waltz/Pyroclasm; movement-distance
  accumulator for Trail). The active skills (whirlwind/dash/heavy) revert to **plain, un-imbued** behaviour.
- **Pyroclasm needs one new thing the others don't:** an **auto-target** pick (nearest enemy / densest cluster)
  to aim the pillar lane.
- **Standalone damage bases** — Pyre Waltz / Pyroclasm currently scale off `wwDamage` / `heavyDmg`; give each a
  standalone level+`damagePct`-scaled base.
- **Migration:** retire the active-skill imbues. **Dance of Fire (shipped Phase 1, the fire swing) reverts to a
  plain swing and its tree code parks** — **retire-and-park decided (Josh, 2026-06-11)**; no flag, no dormant
  live path (can return later as a 4th auto-fire Cilia skill). Sunfall (leap) was never built.
- **Acquire + rank-up via the existing draft**; ranks 5/10 are the 2-option evolution overlays; gated on the
  active patron (same gate as Patron Cards). Auto-fire needs **no** new Sim input hook (a harness *simplification*).
- **Don't duplicate the spec here — update [`specs/god-skills.md`](specs/god-skills.md).**
</details>

---

### 3. Wolves stop getting stuck

`✅ shipped` (v0.5.0, 2026-06-10) · **Size:** quick · **Pillar:** game feel · **Art:** none

**What:** Wolves are currently getting trapped on the rocky dens they spawn in. We'll let them climb over
obstacles to reach the player, and make them **unhindered by the forest** (no slowdown in trees) — they're
native to the land, so it should feel like nothing stops them.

**Why:** It's a visible bug, and the fix doubles as good feel — wolves that flow over terrain feel fast and
inevitable, exactly like the pack-flanker they're meant to be. Fixing this unblocks proper wolf playtesting.

<details>
<summary>🔧 Build notes (engineering)</summary>

- `_aiWolf` collision + the `gTreeSlow` call (`~4766`); add a wolf-specific obstacle exception (a hop/jump
  over rock & tree vs. `gRC`/`gRCDestructibles`) and skip tree-slow entirely for wolves.
</details>

---

### 4. Wolves hit harder early

`✅ shipped` (v0.5.0, 2026-06-10 — tuned dire 38hp/15 bite · alpha 105hp/25 bite) · **Size:** quick · **Pillar:** mastery · **Art:** none

**What:** Wolves are too soft at the start of a run, so a wolf camp is free loot instead of a real fight.
Bump their early-game health and bite damage so clearing a camp is a genuine **risk-vs-reward gamble.**

**Why:** Wolf camps are meant to be a meaningful choice — "do I risk this pack for the Favor?" That choice
doesn't exist if the wolves can't threaten you. Pairs naturally with item 1's glowing eyes (a tough Alpha
reads as red).

<details>
<summary>🔧 Build notes (engineering)</summary>

- Pure number tune: `EntityDefs.direwolf` / `.alphawolf` base HP + bite damage (`~2658` / `~2678`).
</details>

---

### 6. Heavy charge locks out the normal swing

`✅ shipped` (2026-06-11 — one guard at the `gDoSwingAt` chokepoint; covers charge→swing→recovery) · **Size:** quick · **Pillar:** game feel (weighty combat) · **Art:** none

**What:** While you're charging a heavy attack, you can still fire a normal swing. Stop that — charging a heavy
should **commit** you: no normal swing until the heavy resolves.

**Why:** The standing **weighty-combat directive** (Josh, 2026-06-08) — a committed action must compromise your
other options, so missing/committing has a real cost. Free-swinging mid-charge makes the heavy weightless.

<details>
<summary>🔧 Build notes (engineering)</summary>

- Gate the swing trigger on the heavy-charge flag: while `p.heavyWindingUp === true` (`index.html:3327`),
  suppress the LMB→`gDoSwingAt` dispatch (`~index.html:3517`). Engineer owns drop-vs-queue; product intent =
  no swing damage/animation while a heavy is winding up. Filed in the Engineer lane of `TASKS.md`.
</details>

---

### 7. Mana economy & skill management

`✅ shipped` (2026-06-12 — all 3 phases + the WoW-style God-Skill Action Bar; PM may fold to changelog at next tag) · **Size:** multi-session, phased · **Pillars:** game feel (weighty combat), build-craft depth · **Art:** 3 shared Cilia skill icons pending (Artist; emoji fallback live)
**Source of truth:** [`specs/mana-economy.md`](specs/mana-economy.md). **Cost model + the build-potential north star (freeze the mechanic, vary via the card pool — sustain & burst both viable) are locked in the spec.** Follow-on (own surface): the **mana-build card expansion** (regen/pool archetypes + a UNIQUE build-defining card class) — PM-lane proposal, sequenced after.

**What:** Mana is a non-issue today — skills cast over and over, and the auto-firing God Skills cost nothing
and run forever. Make mana a **real, shared resource** that funds both the class kit and the god layer:
1. **Rework class-skill costs + cooldowns** so the early pool empties (benchmark: **1 leap + ~3s whirlwind ≈
   empty**).
2. **God Skills drain mana per second** while active (Burning Body ≈ **5 mp/3s**, upgrades scale up).
3. **Toggle auto-casts to keys 1–9** (acquisition order) — the player chooses which to keep lit and manages
   mana against that choice.

**Why:** Serves the weighty-combat directive (you can't spam; every cast is a decision) **and** adds an active
**resource-management build axis** on top of the draft — "which skills do I keep running?" becomes live play.
It's a deliberate, intentional divergence from pure VS auto-fire (re-adds the agency auto-fire removed) and
**unifies** the class and god layers under one pool without breaking item 2's class-agnostic portability.

**Phasing:** **Phase 1** (class mana+CD rebalance — *quick, standalone, delivers the core "run dry" feel*) →
**Phase 2** (god-skill per-second drain, rank-scaled) → **Phase 3** (toggle/hotkey + HUD + Sim hooks). Detail,
starting numbers, and the engineering grounding are in the spec.

**Resolved (Josh, 2026-06-11):** mana-starved auto-casts go **dormant + auto-resume** (not hard-off), and
starve **lowest-key-first** (your core skills keep running, marginal ones cut out first). No open forks.

> **Note vs item 2:** Phases 2–3 layer onto the live God-Skill system (item 2); the toggle re-introduces an
> input hook that item 2's pure auto-fire had dropped — the spec updates the AI-native contract accordingly.

---

### 8. Playtest feel/readability batch (first mana-economy playtest)

`✅ approved` (Josh-directed, 2026-06-12) · **Size:** quick (batch ≈ 1 session) · **Pillar:** game feel (the
moment-to-moment + readability) · **Art:** none · **Detail + line-anchors:** Engineer lane of [`TASKS.md`](TASKS.md) (#8.1–#8.6)

**What:** Six fixes from the first playtest of the live mana economy — all small, all about the game *reading*
clearly and feeling fair:
1. **Wolf leap range fix** — wolves commit to the leap from too far and whiff; +30% range and only fire within
   70% of max range (mirrors the goblin-warrior charge AI). *(bug)*
2. **XP vs Favor readability** — XP text turns **white**, Favor stays **gold** (both are gold today, so multi-pickup
   popups jumble into noise); plus a **single aggregated `+N XP`** counter above the player that grows over a 5 s
   window then fades, instead of one floating number per orb.
3. **Out-of-combat HP regen** — **3 HP/s after 10 s without taking damage** (a base regen on top of the regen
   cards), with **green upward-drifting particles** around the player while it's active so the heal reads.
4. **LOS reveal** — an invisible sightline circle around the player fades any tree canopy hiding an enemy inside it,
   so threats can't lurk invisibly behind trunks.
5. **Fog-edge smoothing** — the shroud edge shimmers/shakes as you explore new ground; smooth it to a calm reveal.
6. **Gradual night-vision** — the night vision-shrink eases in/out as night nears/lifts instead of snapping.
7. **Early-game difficulty scale-back** — with the new tight mana you can't spam leap to clear a horde, so **night 1
   is too hard.** Push the difficulty curve later (lower the early bases, keep item 1's late-game ramp).
8. **Out-of-combat mana regen** — **10 mp/s after 10 s of no mana use and no damage** (mirrors the HP regen; also the
   relief valve that makes the scaled-back early game survivable — disengage to recharge, then re-engage).
9. **Burning Body mana→dps rescale** *(shipped — `3cf4bb9`)* — the old cost curve ran efficiency *backwards* (you
   paid ~4× more per rank for ~1.5× the damage). Rescaled to **two independent per-rank tables** — fixed cost and
   fixed damage per level, set separately — with a **step-change** at each evolution, and the **damage table climbing
   faster than the cost table** so going deep on one skill pays off (no cost→dps formula). Spec'd in
   [`specs/mana-economy.md`](specs/mana-economy.md).

**Why:** Pillar 1 is the top priority, and these are the irritants the live mana playtest surfaced — readability
(can't tell XP from Favor; popups jumble), fairness (wolves whiff; enemies hide behind trees), polish (fog shimmer;
vision snap), and an **early-game balance regression** (item 7's tighter mana × item 1's steeper curve made night 1
too punishing). All cheap, all developer-directed (numbers given). **Sequencing:** interleaves with item 2 — grab the
three cheapest (wolf leap · colour split · fog shake) first; do the **mana regen (8) before the difficulty cut (7)**
so we don't double-nerf the early game.

---

### 10. Card-pool consolidation — fewer, more focused draft cards

`✅ approved` (Josh 2026-06-12) · **Size:** session · **Pillars:** build-craft depth + game feel · **Art:** none
(reuses card icons) · **Source of truth:** [`specs/card-pool.md`](specs/card-pool.md)

**What:** The draft is bloated — ~33 cards, mostly per-skill noise (the same verb split across five skills). Cut to
~23: collapse the per-skill stat cards into **broad character stats** and give each active skill **one Mastery
card** that bundles its improvements. Merges: **Strength** (= melee attack damage, swing+heavy — *may become a
major character stat later*), **Ferocity** (crit chance + crit damage), **Dexterity** (attack speed), **Reach**
(swing + heavy reach); **Whirlwind / Leap / Dash Mastery** (each bundles that skill's dmg/radius/range/cd). Grit +
Cilia patron sets untouched.

**Why:** a 3-card draft should feel build-defining. The per-skill sprawl diluted it; consolidation makes **every
pick move the needle** and reads cleanly. **Design-ahead:** Mastery cards may get evolutions, and Strength/Dexterity
may graduate into major STR/DEX-style character stats. Folds the in-flight Attack-Speed card in as **Dexterity**.

---

### 9. God Stat Identities — each god synergizes with its own character stats

`✅ Cilia slice approved` · rest `proposed` (design-ahead) · Josh-directed 2026-06-12 · **Size:** system (Cilia
slice quick) · **Pillars:** build-craft depth (the heart) + god identity · **Art:** none · **Source of truth:**
[`specs/god-stat-identities.md`](specs/god-stat-identities.md)

**What:** Each patron god **owns a set of character stats**, and the god's signature mechanics *read / scale with*
those stats — so a generic stat card becomes a **build-defining choice under that patron**, with near-zero new
content. Cilia ← **Crit Chance + Crit Dmg**; Ikras ← **Attack + Move Speed**; Boreas ← **Mana Regen + Pickup
Range + CDR**; Bhumi ← **Health + HP Regen**.

**Why:** the cheapest high-identity build-craft lever — it makes the *whole shared stat pool deeper* (the same
stat means different things under different patrons) instead of adding bespoke content. It also gives the gods
**archetype flavour for the mana economy** (Boreas = the sustain/regen god, Cilia = burst) and makes generic
crit/regen/pickup cards matter per-build. Serves the god-identity north star directly.

**Cilia slice (approved, buildable now):** rewire the Conflagration burn-explosion to run on crit — **explosion
chance per burn tick ← crit chance, explosion damage ← crit damage**. Crit cards become Cilia's chain-detonation
engine. Small, host-side, reuses the live burn system. The `cil-conflag` patron card gets repurposed (PM rec:
"+explosion radius & chain"). Filed to the Engineer lane (#8.10... see TASKS).

**Ikras / Boreas / Bhumi (design-ahead, not engineer work yet):** their stat-synergy mechanics are PM-proposed in
the spec (e.g. Ikras chain-arc count ← move speed; Boreas frost-field size ← pickup range; Bhumi thorns ← max HP)
and land **with their gods** — authored into these identities from the start. Boreas (#5) is the next to benefit
when it unholds.

**Attack Speed → first-class character stat (Josh 2026-06-12, approved — buildable now):** promote attack speed
to a real `wildBuffs` stat + passive card that **speeds the normal attack (more swings) and the heavy charge**.
Works on the base sword kit immediately; **Ikras inherits it** as its identity stat. Resolves the gap above —
filed to the Engineer lane.

---

### 5. Boreas — a second god (held)

`⏸️ held` (Josh's call 2026-06-06, reaffirmed 2026-06-09) · **Size:** multi-session · **Pillars:** build-craft depth, game feel

**What (parked):** A second patron god — Boreas, ice/control — with a full four-skill kit built around
defense, freezing, and zoning, playing completely differently from Cilia's fire.

**Why it's parked:** The playtest proved the current problems are flat scaling + shallow leveling, **not a
missing god** — so we're fixing those in-system (items 1–4) instead. Boreas becomes a *build-variety and
co-op* play (a second god roughly doubles the build matrix and seeds the marquee co-op combo: one player
freezes, another shatters) to unhold once the curve and leveling feel right and we want more breadth. The
full design below is intact and ready to pick up.

**↑ Role upgraded (2026-06-10):** Boreas is no longer just "more breadth." It's now the **activator of two
deferred build systems** — **Elemental Fusion** (you can't fuse a 2nd element until one exists; *Next*) and
**co-op build synergy** (needs ≥2 gods). When the curve/leveling work lands, Boreas is the highest-leverage
unhold because it lights up fusion + co-op + its own Frost kit at once. Still held, but it's now the keystone
second god, not an optional one.

<details>
<summary>🔧 Design notes (full Frost kit — ready when unheld)</summary>

A four-skill Frost kit built on **defense / zoning / freeze**, mechanically distinct from fire (static
fields, walls that block pathing, self-armor — not expanding damage-over-time):

- **Swing — Rimebite:** hits apply **Chill** (slow); each hit forms an orbiting ice shard → a stacking
  **frost shield** on the player. Offense feeds defense.
- **Whirlwind — Frost Bulwark:** a **stationary** slowing field centered on the player that chills
  everything inside while channeling, and grants the player damage reduction.
- **Leap — Permafrost:** impact raises a **ring of ice pillars** that *blocks enemy pathing* and freezes
  enemies caught in the slam.
- **Dash — Frost Step:** a defensive disengage — a brief **absorb shield**, freezes the first enemy passed
  through, and leaves a **slick of ice** that slows pursuers.
- **Heavy — Glacial Spike:** charged burst that **freezes solid** all enemies in the zone (hard CC).
- **Shatter (the payoff):** frozen enemies take bonus damage and **shatter** when struck (esp. by Heavy) —
  Boreas earns burst through setup, not raw DPS. Also the co-op hook: any ally's hit shatters your freeze.

**Size:** multi-session (one imbue per skill). **New art:** frost FX — ice shards/shield, slow field,
ice-pillar wall, ice slick, shatter burst (new *shapes*, not recolors). **Balance:** Chill ~35–40% slow;
freeze ~3 stacks → ~0.75s solid; shatter ~1.5× a hit; lower raw DPS than Fire (trades damage for control +
survivability); cap freeze duration + diminishing returns so lockdown never feels unfair.
</details>

---

## Next — likely, once the slice plays well

### Elemental Fusion — second-imbue alternative to the Higher-Force peak

`proposed` (Josh-directed 2026-06-10; design locked in spec) · **Size:** session+ · **Pillars:** build-craft depth, game feel · **Blocked on:** a 2nd god (Boreas)

**What:** A second way to evolve an imbued skill. Once a skill is **level 5 + evolved once**, the player can
**spend Favor at the shrine to imbue it with a second element** — which **caps the first element at level 5**
and levels the second 1→5 (one evolution). The skill then runs **both once-evolved imbue effects, stacked**
(e.g. fire-wave-every-3-hits **+** ice's level-5 effect). It's the **mutually-exclusive alternative** to
pouring one element to its level-10 Higher Force: *purity → corruption peak* vs *fusion → two elements*.

**Why:** the cross-god synergy lever the build system has been missing, and it's **cheap** — it reuses each
element's existing per-skill imbue effect (no bespoke combo content), and it's a real **Favor sink** tying
the world currency to build-craft. Compounds with Patron Cards (a fused skill draws from both elements'
card pools → generalize the 0c gate to "element present," not "god selected").

**Blocked on Boreas** (nothing to fuse with until a 2nd element exists). Full design — the conserved 5+5
vs 1→10 budget, the build-time edges — is in [`specs/imbue-paths.md`](specs/imbue-paths.md) ("Elemental Fusion").

---

### Co-op build synergy pass

`proposed` · **Size:** multi-session · **Pillar:** co-op that amplifies

**What:** Make two different gods' powers *combine* on the same enemy — e.g. one player ignites, another
detonates — so co-op is more than two people playing the same game side by side.

**Why:** Multiplayer already works and stays in sync, but the payoff today is "two players, same game"
rather than "two builds, one combo." Boreas's freeze→shatter already seeds the marquee combo, so this gets
cheaper once Boreas ships. **Needs ≥2 gods with imbues** — unblocked once Boreas lands.

---

## Later — the idea pool (one big rock always visible)

- **🪨 BIG ROCK — the "Reclaim-the-Shrine" run loop.** The horizon the whole game is building toward (full
  design in [`WORLDBUILDING_CONCEPTS.md`](WORLDBUILDING_CONCEPTS.md)): a run is an incursion into a
  procedural area (first, the Goblin Forest) with one shrine the enemy has taken. Fight to it, reactivate
  it, and it becomes your home base — return by day to deepen your powers, survive sieges by night, with
  random map events keeping each trip fresh. Ties together the difficulty curve, the card draft, and the
  Favor economy. **Depends on:** the slice landing + a second god + Favor — so it's post-slice.
- **A fifth god, or a new mode** — a fifth patron grows the build matrix; an endless/horde mode opens a
  fresh loop. Secondary to the run loop as the anchor.
- **Meta-progression between runs** — a reason to come back: unlocks / light persistence that fits the
  single-file, no-backend constraint.
- **Day-lull content** — repopulating camps + a few random events so the daytime lull isn't dead air. The
  smallest first taste of the run loop; could come sooner than the rest.
- **Audio/juice pass** — a dedicated game-feel sweep once a content arc lands (screen shake, hit-stop,
  layered SFX).
- **A boss variant (parked)** — the fast-flanker idea is now realized as the wolves; what remains parked is
  a *boss-tier* variant (a dire-alpha world boss / a goblin elite). Revisit if the difficulty work wants
  more roster variety.
- **🛰️ MMO-scale server architecture spike** *(Pillar: the platform's MMORPG "future mode")* — the long-term
  goal of **hundreds of players on one map** is a **backend/netcode** re-architecture, **not** an engine swap
  (decision recorded in [`decisions/0001-engine-and-mmo-scaling.md`](decisions/0001-engine-and-mmo-scaling.md)).
  The walls are Firebase RTDB (O(N²) fan-out — breaks in the low *tens*), browser-host authority, and O(N²)
  sim loops; the fix is a dedicated **authoritative server + interest management + spatial sharding**, which the
  deterministic `gSimUpdate`/headless-`Sim` design is already well-positioned to grow into. **A sizable
  separate project — sequence it *after* the slice is fun;** the near-term ask is only *discipline* (keep net
  behind the `Net`/`MP` adapter, keep the sim step server-runnable) so the run-loop work doesn't lock in choices
  that are expensive to undo. A scoping spike comes first when this is greenlit.

---

## The four gods (design north star)

Each patron is a **distinct combat identity** — expressed through genuinely different mechanics, never a
recolor. Co-op synergy falls out of the contrast (Boreas freezes → Cilia shatters).

Each god also **owns a set of character stats** its mechanics synergize with (item 9 /
[`specs/god-stat-identities.md`](specs/god-stat-identities.md)) — so generic stat cards become build-defining per patron.

| God | Element | Identity | Owned stats (item 9) |
|-----|---------|----------|----------------------|
| **Cilia** *(live)* | Fire | Offense, area damage | Crit Chance + Crit Dmg |
| **Boreas** *(held)* | Ice | Defense, control, freezing, slowing | Mana Regen + Pickup Range + CDR |
| **Ikras** *(future)* | Wind | Mobility, chaining attacks & skills | Attack Speed + Move Speed |
| **Bhumi** *(future)* | Earth | Tanking, reflecting damage (thorns), healing | Health + HP Regen |

---

<details>
<summary>📎 Appendix — how this doc stays product-pure (process)</summary>

**This doc is PM-owned and product-pure.** It holds *what we're building and why*, priority, sizing, and the
two **product** lifecycle states the PM owns: `approved` (greenlit — engineer may build) and `shipped` (move
to changelog, delete here). The other lifecycle states are PM-only too: `proposed` (PM idea, not yet seen by
Josh) · `held` / `cut`.

**Execution to-dos and hand-offs live in the task tracker, not here.** The concrete work — feature sub-tasks
(`in-progress`/`done`), cross-role hand-offs, deferred cruft/bugs — is tracked in **[`TASKS.md`](TASKS.md)**, the
shared tracker all three roles write to (owner-lanes: PM / Engineer / Artist). This keeps the roadmap a clean
statement of *intent* that other roles read but don't edit. **One fact, one home:** a task references its
roadmap item by # / name and never re-states its *why*; the roadmap never tracks execution churn. (The git-lane
discipline, session-open ritual, and drift rules live in the tracker.)

**Source-of-truth rule (avoid drift):** for any item backed by a spec (`docs/specs/*.md`), the **spec is the
source of truth** and the roadmap item is a thin **summary + pointer** — plain-English what/why + a link. Keep
build detail (line-refs, balance, phasing internals) in the spec. Items with no spec (small fixes) keep their
detail inline in the 🔧 Build notes.

_PM upkeep: keep this current. Every item carries pillar + plain-English what/why + size. On approval, move to
**Now** and flip to `approved`; on ship, delete and let the changelog carry the record. Execution to-dos →
[`TASKS.md`](TASKS.md)._
</details>
