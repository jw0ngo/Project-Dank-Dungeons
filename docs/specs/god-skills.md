# God Skills — auto-firing, class-agnostic god abilities (VS-style)

**Status:** design (PM, 2026-06-10) — **supersedes [`imbue-paths.md`](imbue-paths.md)** (the active-skill-imbue
model). This is the live source of truth for *Now* item 2.

**Pillar:** build-craft depth (primary) · game feel · mastery. Serves the Creative Manifesto's *"builds are
identity, not arithmetic"* and *"the hero wields the gods' power."*

---

## The pivot (read first)

The combat system is a **reusable platform** — the roguelike (*To Dust*) is **mode one**; a MOBA and an
MMORPG are intended future modes (Creative Manifesto Direction Log, 2026-06-10). **Classes** own the
**active, manual kit** and live at the platform layer (discrete, swappable, AQWorlds-style, gated by maxing
prerequisite classes). Because the active kit belongs to the class — and varies per class — **the gods can
no longer live inside the active skills.**

So the god layer is redesigned to be **class-agnostic**:

- **God Skills auto-fire at regular intervals** (Vampire-Survivors-style) as the player moves and fights.
  They are **not** triggered by, and **not** tied to, any active skill. They ride on top of *whatever* class
  kit is underneath — which makes the entire god system **portable across all modes** untouched.
- **The active kit stays neutral** — **no element skin** on the class's attacks (Josh's call). The god is
  expressed *only* through its own auto-firing skills and their FX. The class is the class; the god is the fire.
- **The binary-tree rank evolution survives intact** — God Skills still rank up **1→10** with a **Form fork
  @5** and a **two-age Ascension @10**. We only cut the tie to an active skill.

**What this is NOT:** it is *not* "gods grant passive stat buffs." A God Skill is a full auto-firing ability
with visible FX and its own evolution tree — the depth lives in *what auto-fires and how it evolves*, not in
+%-damage lines. (The passive-modifier layer already exists separately: **Patron Cards**, item 0c — those
buff burn behaviour and stack *on top of* these skills. The two are complementary; see Boundaries.)

---

## How you get & grow God Skills

1. **Pledge to a patron** (at the god's shrine, as today) → that god's **God-Skill pool unlocks** in the
   level-up draft.
2. **The level-up draft** then offers, VS-style:
   - **Acquire** a God Skill you don't own yet (grants it at rank 1; it begins auto-firing immediately), and
   - **Rank up** a God Skill you own (ranks 1–4 and 6–9 are ordinary draft cards; **ranks 5 and 10 are the
     two evolution-choice events** — a 2-option overlay).
3. A run accumulates a *loadout* of auto-firing god skills + the Patron Cards + the class's manual kit. The
   build is the **combination** of what's firing and how each has evolved.

This reuses the existing draft plumbing wholesale (`gDrawCards` / `_pickCard` / rarity / Favor reroll). A God
Skill is just a new card family gated on the active patron — the same gate Patron Cards already use
(`Object.values(p.imbues||{}).includes('cilia')`).

### The binary tree (unchanged from the prior model)

| Ranks | What the card does |
|------|--------------------|
| **1–4** | **Numeric upgrades** to the base skill (damage · size/reach · cadence · duration). |
| **5 — FORM** | **Branch ①: choose 1 of 2 Forms** — a real transformation of the skill's *shape and playstyle* (e.g. concentrate vs. distribute). Irreversible for the run. |
| **6–9** | **Numeric upgrades** to your chosen Form. |
| **10 — ASCENSION** | **Branch ②: choose the age your power turns to** — the **🐉 Old-god (Animal Spirit)** *sustain* leaf or the **🔥 New-god (Concept)** *power+cost* leaf. The capstone. Irreversible. |

Binary tree → **4 endpoints per skill**; any run walks one path (`base → Form 1-of-2 → Ascension 1-of-2`).
Two players who both maxed the same skill play completely differently — that divergence **is** the payoff.

### The two-age peak (carried over — the grounds already shipped)

The rank-10 fork is the *turning of the age* myth made playable (Creative Manifesto canon). For Cilia:

- **🐉 Old-god leaf (the Dragon) → SUSTAIN.** Lays **dragonfire ground** that **heals you while you stand in
  it.** Lower damage than the Chaos leaf — sustain is what you bought. Tone: majestic, ancient.
- **🔥 New-god leaf (Chaos) → POWER + COST.** Massive AOE, but the **chaosfire ground burns you too** and
  spreads/re-triggers past your aim. The self-burn *is* the cost. Tone: dread, sinisterness.

> **🔥 Chaosfire identity & the footprint rule (Josh, 2026-06-12) — applies to EVERY chaos ascension, all gods:**
> Chaosfire's fantasy is **root yourself and devastate the area *around* you** — it rewards standing still /
> minimal movement, not kiting. So two hard rules on every 🔥 leaf:
> 1. **No chaosfire ground spawns directly under the player on activation.** The player always retains a **clear
>    safe footprint** at the instant the ascension fires — the field blooms *around* them (a donut / clear-center
>    bloom anchored on the player), never planted on their feet. Reuse the existing 38px bare-center safe zone,
>    anchored on the player's position.
> 2. **The self-burn cost is positional commitment, not a kite-check.** You're safe while you hold your spot;
>    the cost is paid when you must *relocate* — moving out of your pocket crosses your own chaosfire. "Avoidable
>    hazard you choose to enter (by moving), not instant death planted under you."
>
> This reframes the cost from "keep moving to dodge the hazard" → "you're committed to your ground; leaving it
> burns you."
>
> **Scope (resolved Josh, 2026-06-12 · updated 2026-06-12):** the footprint rule governs **settled-ground** chaos
> leaves — the ones that anchor a field *around* the player. For Cilia that is now **only Chaos Crown** (Burning
> Body); the rule stands as the standing principle for any *future* settled-field chaos leaf (other gods).
> **Everything else is movement/travel-shaped → EXEMPT:** **Eye of Chaos** (a travelling *band*, no ground),
> **all of Trail of Embers** (movement skill — "burn the path"), **Riftmaw** (an erratic run-long fissure), and
> **Hellfront** (reshaped to advancing chaos *walls* — its cost is movement-relative like Trail). See the per-leaf
> notes.

**Both grounds already exist and are tuned in the shipped build** (Slice C): dragonfire heals the owner
**0.18× the climax damage per tick**; chaosfire hurts the owner **0.35× per tick** (outside a 38px bare-center
safe zone) and burns enemies. There is **no generic lifesteal** — all healing routes through standing in your
own dragonfire ground, so every 🐉 leaf must lay a dragonfire patch the player can occupy. This is unchanged
by the pivot and **reused as-is.**

> **🐉×🔥 Dragon–Chaos synergy — the cross-age meta-build (big-picture design, Josh 2026-06-12).**
> Dragonfire and chaosfire are **opposite signs of the same owner-resource**: chaosfire ground *burns* the
> player, dragonfire ground *heals* the player. **They cancel.** A player who builds toward **both ages across
> their skills** — a 🔥 chaos ascension on one skill (the damage zone) + a 🐉 dragon ascension on another (the
> heal carpet) — can **overlay the grounds** to stand inside a **massive, high-damage chaosfire field taking no
> net self-damage**, because the dragonfire heal offsets the chaos self-burn tick-for-tick. Enemies in the zone
> still eat the full chaosfire damage (dragonfire heals only the *owner*); the player has bought their way back
> into their own devastation.
> - **Why this matters (product):** it promotes the rank-10 fork from a *per-skill* either/or sidegrade into a
>   **cross-skill build axis** — "go pure (all chaos = glass-cannon AOE, or all dragon = safe-but-lower-ceiling)
>   vs. **go hybrid** (chaos for the kill-zone, dragon to live in it)." That's real build-craft depth with zero
>   new content — it falls out of the two grounds already shipped. Serves **build-craft depth** (the heart).
> - **Marquee co-op combo (pillar 4):** the two grounds needn't come from one player. **One player runs a chaos
>   ascension, the ally runs a dragon ascension** → the dragon player's heal-carpet lets the chaos player live in
>   their own firestorm. Two builds, one combo neither could solo — exactly the co-op bar. (Works same-element in
>   co-op now; generalizes once a 2nd god/element lands.)
> - **Balance — the lever to make "cancel" true (FLAG, not yet tuned):** at the shipped numbers they do **not**
>   cancel — dragonfire heals **0.18×/tick**, chaosfire burns **0.35×/tick**, so a single dragon ground only
>   offsets ~half a single chaos ground. That's arguably *correct* (full negation should require **committing**
>   to the hybrid — stacking multiple dragon sources, or a dragon-heal rank investment, to fully fund the chaos
>   cost), but the exact target is a design call: should **one** dragon ground fully cancel **one** chaos ground
>   (raise dragon heal → ~0.35×, clean 1:1), or should negation **scale with investment** (keep heal < burn so
>   you must build deep into dragon to zero it out)? **PM recommendation: investment-scaled** (heal stays below
>   burn) — it keeps the hybrid a *real build commitment* with a cost, not a free default that strictly dominates
>   pure chaos. Needs Josh's call before the dragon-ground heal coefficient is tuned.
> - **Engineering note (likely near-free):** both grounds are independent substance-keyed fields that each tick
>   their owner-effect on whoever stands in them, so **overlapping fields should already sum** (heal tick + burn
>   tick both apply) — confirm both owner-effects fire simultaneously in an overlap (no "one field per tile"
>   short-circuit), then it's purely a **coefficient-tuning** job, not new systems. Interaction with the footprint
>   rule: the rule guarantees a *default* safe pocket for the solo-chaos player; this synergy is the *opt-in* way
>   to safely occupy the **whole** chaos field (not just the center) by funding it with dragonfire.

---

## The launch loadout — Cilia's three God Skills

Chosen from Cilia's five fire skills (Josh, 2026-06-10) for **clean auto-fire conversion + archetype spread**:
three different spatial relationships to the player — **around you / behind you / out at range**. Each keeps
its full binary tree from the prior design; only the **trigger** changes.

> **Cut from the launch set:** **Dance of Fire** (the swing imbue — its peak is a 3-hit *LMB combo*, intrinsically
> tied to active input → worst auto-fire fit despite being the only one fully built) and **Sunfall** (the leap
> cross — overlaps Pyroclasm's burst role, lowest uptime). Both designs are preserved in
> [`imbue-paths.md`](imbue-paths.md) and can return later as additional Cilia god skills. See **Migration**.

---

### 1. Burning Body — *AOE burst-fire around you* (SHIPPED — slice 1) ⟵ **redirect (Josh, 2026-06-11)**

> **Direction change (Josh, 2026-06-11):** *renamed from "Pyre Waltz"; refocused.* Fire's identity is **large
> AOE damage + burn (→ explosions)**, **not** movement/pulling. The old "Flame Vortex" pull Form is **cut**; the
> base is now an **ignite-aura**, and both Forms are pure AOE-burst-fire. This is built and verified (logic);
> tuning is live. Code: `gTickBurningBody` + the `IMBUE_PATHS.cilia.burningBody` registry entry; FX reuse the
> ring (`gSpawnFireRing`, now with `breathe`/`settle`/`healOwner`/`speed` modes) + the shipped substance grounds.

> **Ascension refinement (Josh, playtest 2026-06-11):** *Cataclysm → **Eye of Chaos**, and **swap** the two 🔥
> chaos leaves between the Forms* so each Form's ascensions are mechanically coherent (Firebloom = two
> player-centred **rings**; Cinderburst = two **detonation/ground** payoffs). Eye of Chaos is a **new ring mode**
> (`ebb`); Chaos Crown moves to Cinderburst and keeps its settle-into-ground payoff. See the rank-10 table below.

**Unlock (rank 1) — the ignite-AURA:** a fixed-radius aura (`AURA_RADIUS`) — enemies within it catch fire and
take burn DoT each `AURA_TICK`. Standalone damage (`AURA_DMG`/`FR_BASE_DMG`-scaled by `damagePct`), no `wwDamage`.

- **Ranks 1–4:** grow the aura — +radius (`auraRadius`) · +contact damage (`auraDmg`) · +burn duration
  (`auraBurn`) · seed the Form emit's damage (`emitDmg`).
- **Rank 5 — Form (two ways the body burns; both pure AOE burst, no pull):**
  - **A · Firebloom** *(rhythm · reach)* — releases an **expanding fire ring every ~5s** (`BB_RING_INTERVAL`);
    timed waves sweep outward and ignite all they cross.
  - **B · Cinderburst** *(burst · stand)* — the aura swells and **detonates a fast fixed-radius nova every ~4s**
    (`BB_BURST_INTERVAL`, `BB_NOVA_SPEED`) centred on you; wade in and cook the pack.
- **Ranks 6–9:** +emit damage / +radius / +burn (each Form's `formStep`).
- **Rank 10 — Ascension** (🐉 Dragon = sustain · 🔥 Chaos = power+cost). **The two 🔥 leaves were swapped
  + Cataclysm renamed to Eye of Chaos (Josh, 2026-06-11)** — each Form now owns two like-shaped ascensions:

  | Form | 🐉 sustain (old-god) | 🔥 power+cost (new-god) |
  |---|---|---|
  | **Firebloom** *(rings)* | **Dragonbreath** — `ringMode:'breathe'`: dragonfire ring expands then fully contracts (a dragon's-breath tempo), band-contact **heals** you (`healOwner`) | **Eye of Chaos** *(new — `ringMode:'ebb'`)*: a slow chaosfire ring **emanates from you, ebbing outward** (expands, contracts slightly, nets outward) → **pauses at max range** → **intensifies / thickens** → **dissipates**. No permanent ground-circle — the travelling band IS the chaosfire hazard. |
  | **Cinderburst** *(novas)* | **Dragonheart** — each detonation pools **dragonfire ground at your feet** that heals while you stand in it | **Chaos Crown** *(moved here from Firebloom)* — a colossal detonation that **settles into a great burning chaosfire ground-circle** (the "crown") via `_laySettleRing`; burns enemies AND you. (Inherits the old Cataclysm's `novaScale` colossal-blast trait + Chaos Crown's settle payoff.) **⟵ footprint rule (2026-06-12):** the crown settles as a ring **around** the player with a clear bare center on their footprint — never under their feet. This is the canonical "stand still, devastate around you" chaos leaf; it already fits (the ring/donut shape + the 38px safe center anchored on the player). |

  - **Eye of Chaos — the new `ebb` ring mode** (the only genuinely new FX behaviour in this change): distinct
    from `breathe` (expand→fully contract) and `settle` (expand→pause→lay ground-circle). Net-outward ebbing
    pulse → pause/hold at max range → band thickens & intensifies → fade out. Chaosfire substance, so contact
    burns; **self-burn cost (the 🔥 rule):** the ebb's contraction phases sweep the band back across the player,
    so the cost is real but **readable** — you ride the ebb and stay clear, same "avoidable hazard, not instant
    death" principle as Chaos Crown's ground-ring. Engineer owns the exact ebb curve + how thick "intensifies" reads.
    - **✅ RESOLVED (Josh, 2026-06-12) — option (b): keep the sweep-over-you cost.** The footprint rule governs
      *settled ground*; Eye of Chaos lays **none** (the travelling band IS the hazard), so it's a deliberate
      exception. The ebb's contraction sweeping back across the player stays as its self-burn cost — readable, you
      ride the ebb. No clear-inner-radius change.
  - **Chaos Crown under Cinderburst:** keep its settle-into-chaosfire-ground payoff (`_laySettleRing` /
    `gLayChaosfireRing`); the Cinderburst form emits a nova, so its ascension reshapes that detonation into the
    colossal-blast-then-settle "crown" (reuse `novaScale` + the settle). Engineer's call on the cleanest wiring —
    all three pieces (`novaScale`, `_laySettleRing`, the substance grounds) already exist.

---

### 2. Trail of Embers — *movement-as-weapon / zone* (the native VS verb)

> **Evolution rework (Josh, 2026-06-12):** the rank-5 Forms + rank-10 ascensions were redefined. **Form A · Inferno
> Wake** now lays a **wide cone** of fire behind you (was a hotter single lane); **Form B** swaps from the cut
> **Ember Shroud** aura to **Firesteps**, a **single high-damage line**. Ascensions: **Wyrmwake** (dragonfire cone,
> heals) · **Chaoswake** (new — chaosfire cone, never under the player) · **Dragonfeet** (new — line → dragonflame
> pillars @2s, heals) · **Chaos Steps** (unchanged, relocated from Inferno Wake). **Phoenix Mantle / Immolation
> cut.** Full tree below. The contrast is now clean **wide-area (Wake) vs narrow-concentrated (Firesteps)**.

**Base today:** `gFireTrails` (~L3707, params `FT_*`). Patches **every 18px while you dash**, radius 26, 1.6s
(96f) life, ticks every 0.4s (24f) at base 10 (buff-scaled), 3s burn. **Does NOT hurt the caster.**

**Auto-fire conversion (the key change):**
- **Emit on any movement, not just dash.** Lay a patch every `FT_INTERVAL` of *distance travelled* (≈18–24px)
  whenever the player is moving. The system is already distance-based — just remove the `dash-active` gate.
  Add a cadence cap so standing still doesn't spam. Movement becomes the weapon — peak VS, rewards kiting.
- Caster-safety stays as today (the base trail doesn't hurt you); only the 🔥 Ascension turns it on you.

- **Ranks 1–4:** +trail damage (`FT_DMG_BASE`) · +trail width (`FT_REACH`) · +patch duration (`FT_LIFE`) ·
  +burn duration (`FT_BURN_FRAMES`).
- **Rank 5 — Form** *(the contrast is **wide-area vs narrow-concentrated** — Josh 2026-06-12):*
  - **A · Inferno Wake** *(wide / area-denial)* — widens the trail into a **cone of fire laid behind you** as you
    move: a **widening wake** — apex at your feet, fanning wider the further back it trails (a comet/boat wake,
    Josh's call). Broad floor coverage, **lower damage per patch** — paint a whole lane through a pack. *(New cone
    emitter; replaces the old "hotter/longer single lane" framing.)*
  - **B · Firesteps** *(narrow / concentrated)* — keeps the base trail's **single line** but it does **extra
    damage** — a focused, higher-damage strip. **Fewer targets, more each** — the *concentrate* to Wake's
    *distribute*. *(Replaces the cut "Ember Shroud" defensive aura — see Cut, below.)*
- **Ranks 6–9:** Wake → +cone width / +damage / +length · Firesteps → +line damage / +width / +patch duration.
- **Rank 10 — Ascension** *(each Form's two leaves keep its **shape**; only substance + payoff differ):*

  | Form | 🐉 sustain (old-god) | 🔥 power+cost (new-god) |
  |---|---|---|
  | **Inferno Wake** *(cone)* | **Wyrmwake** — the cone becomes **dragonfire**; weave back through your own wake to **heal** (band-contact heal — the dragon canon: heal only by standing in your dragonfire). Lower damage; sustain is what you bought. | **Chaoswake** *(new)* — the cone becomes **chaosfire**: it **spawns behind you and NEVER on the player's tile** (Josh — a hard build rule). Burns enemies caught in your wake; reverse/back into your own cone and *you* burn. Movement-keyed self-burn (don't walk back into your fire). |
  | **Firesteps** *(single line)* | **Dragonfeet** *(new)* — the single trail **erupts into pillars of dragonflame 2s after each patch is laid** (delayed burst). The pillars are **dragonfire → stand in them to heal** (sustain pole confirmed, Josh 2026-06-12). Reuses `gFirePillars` FX, dragonfire substance. | **Chaos Steps** *(unchanged — relocated here from Inferno Wake)* — **every 2s drop a fused patch of burnt chaos ground that detonates ~1s later.** Keep moving → bombs bloom *behind* you (a chasing trail of explosions); linger on a patch → you eat your own detonation. The 1s fuse is the telegraph + the self-burn cost. Reuses the chaosfire explosion FX. |

  - **✅ Footprint rule — Trail stays EXEMPT (Josh, 2026-06-12).** Trail of Embers is the **movement-as-weapon**
    skill, so chaosfire here = "burn the path," not "anchor and devastate." Both 🔥 leaves are **movement-keyed**:
    **Chaoswake** never spawns on the player's tile (cost = don't reverse into your own wake); **Chaos Steps**
    detonates 1s after a patch is dropped (cost = don't linger). The stand-still footprint rule stays confined to
    the *area/burst* chaos leaves (Burning Body's Chaos Crown, Pyroclasm's Hellfront); Trail + Eye of Chaos are the
    exceptions.
  - **The cone emitter (the one genuinely new behaviour)** — Inferno Wake / Wyrmwake / Chaoswake lay patches across
    a **widening arc behind the movement vector** (apex at the player, fanning out the further back), substance
    swapping per ascension (plain fire → dragonfire → chaosfire). Cone half-angle + length are tunable knobs; floor
    the emit cadence (spam/perf). Chaoswake's "never under the player" is **by construction** (every patch is offset
    *behind* the apex, so none lands on the player's tile).
  - **Dragonfeet's delayed pillars** — single-line patches that, **2s after each is laid**, erupt into a dragonflame
    **pillar** (reuse `gFirePillars` FX, dragonfire substance → the pillar is heal-ground). A per-patch fuse timer,
    same shape as Chaos Steps' 1s fuse but dragon-substance + longer + no self-burn.
  - **Cut from the launch tree (Josh, 2026-06-12):** **Ember Shroud** (defensive moving aura) + its ascensions
    **Phoenix Mantle** / **Immolation** are removed. Nothing was built → no parking needed; the "moving burning
    aura" concept is logged as **deferred design** (could return as a later Cilia god skill — see Deferred).

**Mana cost (item 7 — author from the start, NOT retrofitted).** Trail uses the **#8.9 cost+damage model**
([`mana-economy.md`](mana-economy.md) "Burning Body cost curve — RESCALED"), authored from rank 1 rather than
shipped flat-and-rescaled-later (the lesson Burning Body paid for): **two independent per-rank tables — a fixed
cost per rank and a fixed damage per rank** — with a low rank-1 anchor and a **step-change in both at each
evolution** (rank 5 Form, rank 10 Ascension). Author the **damage table to climb faster than the cost table** so
dps-per-mana rises with investment (specialization rewarded), tuned by feel. **NO formula coupling damage to
cost** (⚠ an earlier draft said "dps ∝ cost^1.5 as a mechanic" — wrong; reverted. The relationship is a property
of the chosen numbers, not code). **NOT** the flat `base + inc·(rank−1)` ramp the original Phase-2 grounding implied.

> **✅ RESOLVED (Josh, 2026-06-12) — a movement skill charges only upon movement: cost follows emission shape.**
> With the evolution rework cutting Ember Shroud, **the entire Trail tree is now emission-keyed — there is no
> continuous-aura Form left, so no per-second cost anywhere in Trail.** That's the cleanest possible fit for the
> movement-as-weapon identity: you **never pay mana standing still.** Cost is **per-emit, keyed to how each part
> emits:**
>
> | Part of the tree | Emits | Cost model |
> |---|---|---|
> | Base / **Inferno Wake** / **Wyrmwake** / **Chaoswake** | a line or a **cone** of patches per distance moved | **per-emit-tick** — **one** charge per emit-tick as you move, *not* per individual patch (a cone-tick lays several patches for one charge, so a wide cone ≠ runaway cost). Author the per-rank cost so the wide cone reads as pricier-but-not-punishing vs the line. |
> | **Firesteps** | one patch per distance moved | **per-emit** (= per patch) — the concentrated line |
> | **Dragonfeet** (asc.) | a patch per distance moved → erupts to a pillar @2s | **per-emit** — pay when the patch is laid; the delayed pillar is free follow-through |
> | **Chaos Steps** (asc.) | a fused patch every 2 s | **per-emit** — pay per patch dropped |
>
> So **every Trail Form charges per-emit as you move** — movement is the weapon *and* the cost (on-identity, on the
> weighty-combat directive). The #8.9 per-rank cost+damage tables apply: a per-emit cost and a per-emit damage, each
> authored per rank with the evolution steps, **damage climbing faster than cost.** **HUD note:** the action bar
> shows `mpCostPerSec`; for these per-emit Forms display an honest **effective mp/s while moving**
> (cost-per-emit × emit-rate at normal move speed) — engineer's representation call.

---

### 3. Pyroclasm — *ranged / heavy-hitter burst* (auto-aimed)

**Base today:** `gFirePillars` (~L3930, params `FP_*`). **On heavy release (≥50% charge)** a travelling line
of **3–8 pillars** (count by charge), spacing 0.85 tiles, `heavyDmg ×0.55`, 3s burn, 9f telegraph → 22f
eruption, 22px radius.

**Auto-fire conversion (the key change):**
- **Fire the pillar lane on an interval, auto-aimed at the nearest enemy / densest cluster** — replacing
  "on heavy release, aimed by facing." Interval is the slow heavy-hitter rhythm (`FP_INTERVAL` ~3s).
- **Pillar count is now fixed** (ranked via `FP_MIN`/`FP_MAX`), not charge-derived. Standalone base damage
  (was `heavyDmg ×0.55`).
- **New work this skill needs that the other two don't:** a simple **auto-target pick** (nearest enemy, or
  nearest enemy in the densest local cluster) to aim the lane. Reuse any existing nearest-enemy helper; the
  telegraph→eruption FX is otherwise untouched.

- **Ranks 1–4:** +pillar damage (`FP_DMG_RATIO`) · +pillar count (`FP_MIN`/`FP_MAX`) · +burn duration
  (`FP_BURN_FRAMES`) · +pillar radius (`FP_RADIUS`).
- **Rank 5 — Form:**
  - **A · Eruption** *(skillshot nuke)* — the lane's **final pillar is 5× bigger and hits far harder**, landing
    on the auto-targeted cluster. Big-boom rhythm.
  - **B · Firewall** *(advancing AOE)* — **5 lines of pillars erupt in succession** travelling toward the target
    — a sweeping wall that clears a corridor.
- **Ranks 6–9:** Eruption → +finale size/damage / +lane range / +mid-pillar count · Firewall → +wall count /
  +wall length / +travel distance.
- **Rank 10 — Ascension** *(the pillars become a sustained volcanic terrain event):*
  - **Eruption →** 🐉 **Wyrmspine** (finale pillar **re-erupts 3× at intervals** + standing in it heals you —
    *already an interval-based, VS-perfect peak*) · 🔥 **Riftmaw** (a run-long chaosfire fissure erupting
    erratically past your aim, burning you when near). **⟵ INTENTIONALLY diverges from Eruption's concentrated
    shape (Josh, 2026-06-12):** chaos here = *uncontrolled sprawl* past where you aimed — the one deliberate
    exception to the "both of a Form's ascensions keep its shape" principle (its 🐉 sibling Wyrmspine keeps the
    concentrated re-erupting pillar; Riftmaw is meant to feel like the power slipping its leash). **Footprint rule:
    EXEMPT** — like Eye of Chaos / Trail, the fissure is a *travelling/erratic* hazard, not settled ground planted
    under you; the self-burn cost is lingering near the erupting cracks, not a kite-check.
  - **Firewall →** 🐉 **Dragonmarch** (walls turn to dragonfire and lay a healing carpet in their wake) ·
    🔥 **Hellfront** *(reshaped Josh 2026-06-12 — keeps Firewall's wall shape)* — the walls **multiply and march
    outward relentlessly as chaosfire walls**: an advancing firewall that doesn't stop, and **caught ahead of or
    between the walls, you burn.** The cost is **movement/position-relative** (outrun or thread the walls — the
    same "movement is the cost" logic as Trail), **not** a settled field-around-you. **Footprint rule: EXEMPT** —
    it lays no settled ground under you; the walls advance *away*. *(Was an omnidirectional field-around-you under
    the footprint rule; reshaped to walls to keep its Form's shape — so it leaves the footprint scope.)*

**Mana cost (item 7 — author from the start, NOT retrofitted).** Pyroclasm fires in **discrete bursts on an
interval** (a pillar lane every ~`FP_INTERVAL`), so — like Trail's emitted patches, unlike Burning Body's
continuous aura — its drain is **per-emit: one charge each time the interval fires a lane**, not a per-second
tax (nothing ticks between volleys → like Trail, Pyroclasm has **no per-second cost anywhere**). Use the **#8.9
two-table model** ([`mana-economy.md`](mana-economy.md)): two independent per-rank tables — a fixed **cost per
lane** and a fixed **damage per lane** — low rank-1 anchor, a **step-change in both at each evolution** (rank 5
Form, rank 10 Ascension), the **damage table authored to climb faster than the cost table** so specialization
pays off. **No formula coupling damage to cost** (the reverted #8.9 lesson). Follow-through eruptions (Wyrmspine's
3× re-erupt; any delayed re-detonation) are **free** — you pay once when the lane fires, not per re-erupt. Floor
`FP_INTERVAL` (cadence floor — perf/spam, per Balance). **HUD:** the action bar's `mpCostPerSec` shows the honest
effective mp/s (cost-per-lane ÷ interval-seconds).

---

## Engineering grounding (source of truth; not prescriptive on *how*)

**The core work is a trigger swap, not new FX.** All three FX systems (`gFireRings` / `gFireTrails` /
`gFirePillars`) already exist, are tuned, and render well. The pivot replaces their *trigger*:

| Skill | Old trigger | New trigger |
|-------|-------------|-------------|
| Pyre Waltz | `gFireRings` spawns while whirlwind channelled | per-skill **interval timer** on the player |
| Trail of Embers | `gFireTrails` emits during dash | emit on **any movement** (distance-based, already is) |
| Pyroclasm | `gFirePillars` on heavy release, facing-aimed | **interval timer** + **auto-target** nearest cluster |

- **Decouple the FX from the active skills.** Today fire rings/trail/pillars are spawned inside the
  whirlwind/dash/heavy code paths. Lift each spawn into an **independent per-skill updater** ticked from
  `gUpdatePlayer`, driven by a per-skill cooldown counter (Pyre Waltz, Pyroclasm) or movement-distance
  accumulator (Trail). The active skills (whirlwind/dash/heavy) revert to their **plain, un-imbued**
  behaviour — they belong to the class now.
- **Per-player state.** A per-player **god-skill map**: `{ skillId: {rank, form, ascension} }`, plus each
  skill's own cooldown/emit timer. Parallel to the existing `skillMods` / `gritMods` (~L2425). Numeric ranks
  write magnitudes the spawn sites read (`FR_*` / `FT_*` / `FP_*`).
- **Standalone damage bases.** Pyre Waltz and Pyroclasm currently scale off `wwDamage` / `heavyDmg`. Give each a
  standalone base (level + `damagePct`-scaled), since the active skills are no longer the source.
- **Draft integration.** Acquire-cards + rank-up cards (1–4, 6–9) are ordinary draft cards (reuse `_cardValue`
  rarity/Favor). **Ranks 5 and 10 are evolution-choice events** — a 2-option overlay (model on the existing
  `#g-imbue-overlay` or a flagged draft-card pair). Gated on the active patron.
- **The two shipped grounds are reused as-is** — dragonfire heal-ground (0.18×/tick) and chaosfire self-burn
  ground (0.35×/tick, 38px safe center). Every 🐉 leaf lays a dragonfire patch the player can occupy; every 🔥
  leaf reuses the chaosfire ground turned on the caster.
- **MP:** these resolve host/SP-authoritative like the current fire FX + burn; the auto-fire timers tick on the
  owning player and sync via the existing particle/burn paths. No new protocol — confirm the per-skill timer
  state doesn't need to sync (each client ticks its own owned skills).
- **AI-native.** The two evolution events are game-pausing choices → each needs a `gSim*` hook (mirror
  `gSimDraft.pick`) or headless runs stall. `Sim.observe()` gains per-skill rank + pending evolution choice.
  Auto-firing skills need **no** new input hook (they fire themselves) — a net *simplification* for the harness.
  **⚠ Superseded by item 7** ([`mana-economy.md`](mana-economy.md)): the toggle/hotkey system **re-introduces** an
  input hook (`Sim.toggleGodSkill`) + per-skill toggle/mana state in `Sim.observe()`. The auto-fire itself still
  needs none; managing *which auto-casts are active* does.

## Migration — retiring the active-skill imbues

The pivot removes the *active-skill* fire imbues from the live build. Engineer owns timing/how; the product call:

- **Whirlwind / dash / heavy revert to neutral** (their plain class behaviour) — they stop spawning fire.
  Their FX systems are repurposed as the three auto-fire god skills above.
- **Dance of Fire (the fire swing, shipped Phase 1) is RETIRED AND PARKED** (Josh, 2026-06-11). The swing
  belongs to the class and carries no element skin: **revert the swing to plain**, and **park** the
  Dance-of-Fire tree code — keep it (don't delete) so it can return later as a 4th Cilia god skill, reworked
  for auto-fire (its 3-hit-LMB-combo peak becomes "every Nth auto-sweep fires the empowered climax"). This is
  the decided model — no flag, no dormant live path; the build stays honest to the new god-skill model.
- **Sunfall (leap cross)** was never built — no migration, just deferred design in `imbue-paths.md`.
- **Near-term shippable state:** one implicit "class" (the current sword kit, neutral) **+ Cilia's three
  auto-firing god skills** with full trees. That *is* a complete, playable roguelike loadout — no class system
  needed yet for this to ship.

## Balance

- **Forms are sidegrades, not upgrades** — a *playstyle* choice (concentrate vs. distribute), tuned to
  comparable power so neither is a trap pick.
- **The two-age fork is sustain-vs-burst, not a power tier.** 🐉 Dragon (heal) deals **lower** damage than 🔥
  Chaos — you trade ceiling for survivability; never "heals AND hits hardest." 🔥 Chaos (self-burn) is power +
  cost — the self-burn **must be a genuine threat**, or the cost is fake and it's strictly better than Dragon.
  **Third path — the 🐉×🔥 hybrid** (mix ages across skills to cancel chaos self-burn with dragonfire heal): a
  *real build commitment*, not a free default — tune so funding the chaos cost via dragonfire costs you the
  investment (see the **Dragon–Chaos synergy** block under *The two-age peak*). Pure-chaos and pure-dragon must
  stay viable against it.
- **Floor/cap every numeric rank** (cadence floors especially — an uncapped `FR_INTERVAL`/`FP_INTERVAL` →0 is a
  perf/spam hazard). Mirror `SKILL_STAT_FLOOR`.
- **Auto-fire cadence is the master DPS lever** — with no active-input gating, tune intervals so three
  skills + Patron Cards reads as a busy-but-readable screen, not a fire soup. This is the new tuning surface the
  prior model didn't have.
- Forks **irreversible per run** (non-persistent run → next run re-chooses).

## Boundaries

- **God Skills (this spec) = the auto-firing abilities.** **Patron Cards (item 0c) = passive modifiers** to the
  element's burn (duration / tick damage / explode-chain). They stack: Searing Heat etc. buff the burn these
  skills apply. Keep them distinct — don't let one absorb the other.
- **The active kit = the class's** (currently the sword/bow). Neutral, no element skin. Platform-layer; out of
  scope for this spec beyond "the god skills assume nothing about what's underneath."

## Deferred (designed, not built)

- **Other gods' skill pools** — Boreas (ice/control), Ikras (wind/chaining), Bhumi (earth/thorns). Same
  auto-fire model; each god's old-pole (Animal Spirit, sustain) + new-pole (Concept, power+cost) Ascension shape
  per [`imbue-paths.md`](imbue-paths.md). Built when each god lands.
- **Elemental Fusion** — combine two gods' skills; reuses each element's effects, gated by Favor. Parks behind a
  second god. Full design in [`imbue-paths.md`](imbue-paths.md) ("Elemental Fusion") — adapt to the god-skill
  frame when built.
- **Dance of Fire / Sunfall** as later Cilia god skills (see Migration).
- **Ember Shroud (the moving burning aura)** — cut from the Trail tree in the 2026-06-12 evolution rework (Trail
  is now all ground-trails: cone + line). The "persistent burning bubble that wraps the player" idea is sound and
  could return as its own later Cilia god skill (a defensive *around-you* aura distinct from Burning Body's burst),
  with 🐉 Phoenix Mantle (continuous dragonfire heal-aura) / 🔥 Immolation (self-draining AOE aura) as its
  ascensions. Not built — pure deferred design.
