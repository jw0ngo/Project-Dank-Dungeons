# Imbue Paths — the imbued-skill mastery system

> **⚠️ SUPERSEDED (2026-06-10) by [`god-skills.md`](god-skills.md).** The model pivoted: gods no longer imbue
> *active* skills — their power is now a **class-agnostic, auto-firing (VS-style) god-skill layer** so it ports
> to the platform's future MOBA/MMORPG modes (Creative Manifesto Direction Log, 2026-06-10). **This file is
> retained as the detailed design archive** — the binary-tree structure, the two-age peak rule, the full
> per-skill trees (incl. the cut Dance of Fire / Sunfall), Elemental Fusion, and the other gods' poles all
> carry forward and are referenced by `god-skills.md`. Read `god-skills.md` for the live design; read this for
> the FX/line-ref detail behind any skill.

**Status:** ARCHIVE / reference (was: design, PM 2026-06-09–10). The live source of truth is
[`god-skills.md`](god-skills.md). Below is the original active-skill-imbue design, preserved intact.

**Pillar:** build-craft depth (primary) · game feel · mastery. Serves the Creative Manifesto's *"builds
are identity, not arithmetic"* and *"the hero wields the gods' power"*.

> **Canon (CD beat, Josh 2026-06-09 — logged in `studio/CREATIVE_MANIFESTO.md` Direction Log):** *the
> gods are waning in power and resort to other means of "perceived higher power" to preserve themselves —
> chaos and order, light and dark. If called upon enough, these concepts become the new gods of the next
> age.* The game is set in **the turning of the age**: the old gods are passing, the new are being born.
>
> **Canon extension (CD beat, Josh 2026-06-10 — ⚑ NOT YET in the manifesto; needs a Direction Log
> entry):** there are **three ages**, and the current elemental gods sit between two others:
>
> | Age | Gods | Cilia's pole |
> |-----|------|--------------|
> | **Previous** | **Animal Spirit gods** (the primal old powers) | **the Dragon** (dragonfire) |
> | **Current** | **Elemental gods** (Cilia/fire, Boreas/ice, Ikras/wind, Bhumi/earth) | **Cilia** |
> | **Coming** | **Concept gods** (Chaos · Order · Light · Dark) | **Chaos** |
>
> Channeling a blessing to its **peak (rank 10)** routes the power *out of the current age* — and the
> player **chooses which way the age turns** for that skill: reach **back** to the Animal-Spirit old gods
> (for Cilia, the **Dragon** — flame that *heals* as it burns; sustain, life, the primal age's mercy) or
> **forward** to the half-born Concept gods (for Cilia, **Chaos** — devastating AOE whose flames *burn the
> caster*; power with corruption, the new age's price). This is what *To Dust* means (old gods crumbling to
> dust, new powers born from it). The level-10 fork is that whole myth made playable in one choice.

---

## The structure — a 10-rank mastery tree per imbued skill

Each imbued skill is a **named Art** that ranks up **10 times** over a run, via the level-up card draft.
The tree is two numeric stretches bracketing two branch points:

| Ranks | What the card does |
|------|--------------------|
| **1–4** | **Numeric upgrades** to the base imbue (damage · size/reach · duration · count). Ordinary draft cards, now framed as *ranking up a named ability* — this alone fixes "leveling is boring stat bumps." |
| **5 — FORM** | **Branch ①: choose 1 of 2 Forms.** A real transformation that changes the *shape and playstyle* of the skill (e.g. ranged vs. close-surround). Irreversible for the run. |
| **6–9** | **Numeric upgrades** to your chosen Form. |
| **10 — ASCENSION** | **Branch ②: choose the age your power turns to** — 1 of 2 ascensions of your Form: the **Old-god (Animal Spirit)** leaf (sustain — for Cilia, **Dragonfire that heals you**) or the **New-god (Concept)** leaf (power + cost — for Cilia, **Chaos AOE that burns you**). The capstone. Irreversible. |

So each skill is a **binary tree → 4 possible endpoints**, but any one run walks a single path:
`base → Form (1 of 2) → Chaos (1 of 2)`. Two players who both maxed Dance of Fire can play completely
differently. That divergence **is** the build-craft payoff.

**Why two numeric stretches between forks:** the forks are the *identity* moments; the numeric ranks are
the *commitment* you pour into the identity you chose. A fork with no investment on either side feels
weightless.

## The level-10 peak — the turning of the age (old gods vs new gods)

The level-10 evolution routes the skill **out of the current age** — and the player **picks which way the
age turns** (CD canon, Josh 2026-06-10 — *the three-age structure + this fork to be logged in
`studio/CREATIVE_MANIFESTO.md`*). Every god has **two poles** at the peak: its **Animal-Spirit predecessor**
(the old age — *sustain*) and its **Concept-god successor** (the coming age — *power + cost*):

| God | Element | ← Old pole (Animal Spirit) · *sustain* | New pole (Concept god) → · *power + cost* |
|-----|---------|----------------------------------------|-------------------------------------------|
| **Cilia** | Fire | **the Dragon** — dragonfire that **heals** the caster as it burns enemies | **Chaos** — devastating AOE whose flames **burn the caster**; spreads / splits past your aim |
| **Boreas** | Ice | *(frost-beast spirit — define when built)* · sustain-flavored | **Order** — rigid/binding control that constrains the caster too *(define when built)* |
| **Bhumi** | Earth | *(great-beast spirit — define when built)* · sustain-flavored | **Light** — overexposing/revealing power that blinds or burns out *(define when built)* |
| **Ikras** | Wind | *(storm-bird spirit — define when built)* · sustain-flavored | **Darkness** — draining/obscuring chaining that consumes or hides *(define when built)* |

(The new poles form oppositional pairs — Chaos↔Order, Light↔Darkness — a latent future axis. The old poles
are each god's primal Animal-Spirit ancestor; Cilia's is the Dragon, the rest are the CD's to name.)

### The two-age rule (Cilia's instance — the template for the others)

A peak leaf is **not** "the same thing but bigger." Each pole carries a **signature, on-theme identity** —
and the two poles are **mechanical opposites**, so the choice is a real sustain-vs-burst fork:

- **Old-god leaf (Animal Spirit · for Cilia, the Dragon) → SUSTAIN.** The flames **heal you** while they
  damage enemies (lifesteal-from-your-own-fire — a new mechanic). Reaching back to the old age is *mercy*:
  you can wade in, stay in, outlast. The primal power nurtures even as it burns. Tone: **majestic, ancient,
  reverent** — no self-hazard. Damage is **lower** than the Chaos leaf — sustain is what you bought.
- **New-god leaf (Concept · for Cilia, Chaos) → POWER + COST.** **Massive AOE**, but you pay for it: the
  flames **burn the caster** and **spread / split / re-trigger past your aim** (reuses the existing
  `burning-ground` / `gFireTrails` hazard, now turned on *you*). The half-born god's grip slips. Tone:
  **dread, chaos, sinisterness.**

This is weighty-combat at the build layer: the peak is a genuine identity fork, not a power tier. It also
seeds co-op (the Chaos leaf's fire is a hazard your ally must read; the Dragon leaf's sustain lets you
anchor a frontline). **Each other god's two poles obey the same shape** — an old Animal-Spirit *sustain*
leaf and a new Concept *power+cost* leaf, expressed through that god's element.

---

## Elemental Fusion — the second-imbue path (breadth instead of the peak)

The level-10 Higher Force is the payoff for **purity** — pouring one element all the way down. **Fusion**
is the alternative for players who'd rather **combine two gods** than ascend one. It is **mutually
exclusive** with the Higher Force: you trade the corruption peak for a second element.

**How it works:**
- Once an imbued skill reaches **level 5 and has evolved once** (its Form chosen), the player may, **at the
  shrine, spend Favor** to **imbue that same skill with a second element**.
- Doing so **caps the first element at level 5** (its once-evolved state — no further level-up cards or the
  level-10 peak for element A). Thereafter the skill's level-up cards are **element B's**; B levels **1→5**
  and **evolves once at 5** (1 of 2 Forms), then caps.
- The skill now runs **both once-evolved imbue effects, stacked** — e.g. a fire normal-attack (fire wave
  every 3 hits, Form-evolved) **plus** ice's once-evolved normal-attack effect. **No bespoke combo content:
  fusion simply stops suppressing element A's effect when B's is layered on.**

**The conserved budget (the symmetry that makes it a real fork):**

| Build | Element A | Element B | Endpoint |
|-------|-----------|-----------|----------|
| **Pure** | 1→10, Form @5 + Higher Force @10 | — | one element, **ascended to its god's higher force** (Chaos for Cilia) |
| **Fusion** | 1→5, Form @5, then **capped** | 1→5, Form @5, then capped | **two once-evolved element effects stacked** |

**Why it's good (and cheap):** reuses each element's existing per-skill imbue effect (no reaction matrix —
the combinatorial-explosion trap avoided); a genuine **Favor sink** tying the world currency to
build-craft; gated behind investment (level 5 + evolved), so fusion is a commitment, not a turn-1 trick;
and it **compounds with Patron Cards** — a fused fire+ice skill draws from *both* burn and chill card pools
(→ generalize the [`item 0c`] patron-card gate from "god selected" to **"element present on you"** when god
#2 lands).

**Dependency:** fusion needs a **second god to exist** to fuse with — so it parks behind **Boreas**, which
this promotes from "optional breadth" to **the activator of the fusion half of the build system.** The
near-term Cilia-only work (the pure 1→10→Chaos tree, Phase 1) is unaffected and ships first. Spec the hook
now; build fusion when a second element exists.

**Open edge (resolve at build):** the fuse choice is naturally offered **the moment A hits level 5 and
evolves** — continue A toward 10 (pure) *or* fuse B (caps A at 5). Whether fusion remains available if A
has already leveled *past* 5 (and if so, whether A snaps back to 5) is a build-time call; the cleanest
reading is "decide at 5, committing past 5 = pure."

## Naming

Each imbued skill gets an evocative **Art name**, each Form a name, each Chaos leaf a name — names carry
the fantasy. Josh named the first (**Dance of Fire**). Names below for the other four are **PM proposals
— Creative Director's to override.**

---

## Worked example — DANCE OF FIRE (imbued normal attack)

*Base imbue today: a fire wave/arc cast on swing (`gFireWaves`).*

- **Ranks 1–4 (numeric):** +wave damage · +arc width · +travel distance · +burn duration.
- **Rank 5 — Form:**
  - **Form A · Emberfan** *(long range)* — the wave becomes a **volley of fireballs loosed in an arc**
    that travel a long distance. Playstyle: poke, spacing, kiting from safety. *(Renamed from "Emberlance,"
    Josh 2026-06-10 — a fan of embers, not a lance.)*
  - **Form B · Cinder Ring** *(close / surrounded)* — the wave becomes a **ring of flame that erupts
    around you**. Playstyle: wade in, get surrounded, punish the crowd. *(Josh's "flame strike circle.")*
- **Ranks 6–9 (numeric):** Emberfan → +fireball count / +pierce; Cinder Ring → +ring radius / +pulse damage.
- **Rank 10 — Ascension (choose your age: 1 Old-god + 1 New-god leaf per Form).** *Common motif (Josh
  2026-06-10): **every Dance-of-Fire peak leaf evolves the LMB into a 3-hit combo** — each hit in the chain
  escalates, and the 3rd hit is the climax that lays down the leaf's signature burning ground (🐉 dragonfire
  = heals you if you stand in it · 🔥 chaosfire = hurts enemies **and** you).* All four names below are
  **Josh-canon (2026-06-10).**
  - From **Emberfan →**
    - 🐉 **Dragonfire** *(Old · Dragon · sustain)* — LMB becomes a **3-hit combo**: the first two swings emit
      **small waves of fire**; the third **blasts jets of dragonfire in the swing direction**, scorching the
      ground with **dragonfire that heals you while you stand in it.** *Visual: dragonfire carries a
      rainbow-like sheen in its flames (art note).*
    - 🔥 **Flame of Chaos** *(New · Chaos · power+cost)* — LMB becomes a **3-hit combo**: the first two swings
      emit **small waves of fire**; the third **launches a massive, slow-moving ball of chaos fire** that
      devastates enemies in its path and leaves a **wake of chaosfire-burned ground** (damages enemies and you).
  - From **Cinder Ring →**
    - 🐉 **Dragondance** *(Old · Dragon · sustain)* — LMB becomes a **3-hit combo**: each hit emits a
      **circular wave of fire that burns the ground in a ring around you**, escalating in size (2nd > 1st,
      3rd largest). The **3rd wave is dragonfire**, scorching the ground with **dragonfire that heals you
      while you stand in it.**
    - 🔥 **Helldance** *(New · Chaos · power+cost)* — LMB becomes a **3-hit combo**: each hit emits a
      **larger cone of chaos fire** than the last, scorching the ground with **chaosfire that hurts enemies
      and you.**

*(Binary tree confirmed Josh 2026-06-09; the **two-age fork** + all four leaf names + the **3-hit-combo
motif** are Josh-canon 2026-06-10. **Two fire substances:** *dragonfire* (old age — heals the caster who
stands in it; rainbow-tinged) vs *chaosfire* (new age — damages enemies **and** the caster). **Naming —
two tones:** Dragon leaves evoke the **primal, majestic** old powers; Chaos leaves evoke **dread /
sinisterness.** Retired earlier proposals: Sunwyrm's Breath, Hearth of the Wyrm, Wake of Ruin, Unending
Maelstrom, Cinderplague, Halo of Damnation.)*

---

## The other four imbued skills (Phases 2–5 — fully designed, Josh-approved 2026-06-10)

Same 10-rank shape as Dance of Fire. Each is fleshed to build depth below: ranks 1–4 numeric levers, the
Form fork @5 (two playstyles on a consistent **concentrate-vs-distribute** axis across the kit), ranks 6–9
per-Form levers, and the rank-10 Ascension (one 🐉 Dragon *sustain* leaf + one 🔥 Chaos *power+cost* leaf
per Form, per the two-age rule). **No new core mechanics** — every 🐉 leaf paints the existing **dragonfire
heal-ground**, every 🔥 leaf the **chaosfire self+enemy-burn ground** (both shipped in Slice C; heal
0.18× / self-burn 0.35× per tick, see the Slice-C grounding below). The work per skill is **4 numeric
levers + 2 Form FX shapes + 1 peak transform** — "a session+ each."

> **Note:** the **3-hit-combo LMB transform** is specific to **Dance of Fire** (it *is* the normal attack).
> Each of these four skills' peak leaves transform *that skill* (whirlwind/leap/dash/heavy), not the LMB —
> but they keep the same 🐉 heal-ground / 🔥 self+enemy-burn-ground principle. The transform per skill is
> named in each `@10` block ("the transform").

> **Names:** all Art / Form / leaf names below are **Josh-approved (2026-06-10)** unless tagged
> *(PM-proposed)*. Dragon leaves evoke the **primal / majestic** old age; Chaos leaves evoke **dread /
> sinisterness** (Decision #2).

### Phase 2 — Whirlwind → **Pyre Waltz**

*Base imbue today: an expanding fire ring spawns every **2s (120f)** while whirlwind is channelled, expands
to **6 tiles**, deals `wwDamage ×1.5`, applies 3s burn, knocks back 6 outward (`gFireRings`, ~L3603;
params `FR_*`).*

- **Ranks 1–4 (numeric):** +ring damage (`FR_DMG_MULT`) · +ring range (`FR_RANGE_TILES`) · faster cadence
  (`FR_INTERVAL` ↓, **floored**) · +burn duration (`FR_BURN_FRAMES`).
- **Rank 5 — Form:**
  - **Form A · Wildfire Bloom** *(zone denial)* — rings expand **slow, huge, persistent**, leaving a charred
    burning-ground arc as they pass. Stand and hold ground.
  - **Form B · Flame Vortex** *(melee setup)* — rings **collapse inward**, dragging + burning enemies *toward*
    you (invert ring direction → inward pull instead of outward knockback), bunching the pack for a punish.
- **Ranks 6–9 (numeric):** Bloom → +max radius / +linger duration / +concurrent rings · Vortex → +pull
  strength / +cadence / +bunched-target damage.
- **Rank 10 — Ascension** *(the transform: the rings stop being timed pulses and become a **sustained
  field** while channelling):*
  - **Wildfire Bloom →** 🐉 **Solar Mandala** *(Dragon · heal)* — a breathing mandala of **dragonfire** rings
    around you; the ground-band heals you per tick you anchor in it. · 🔥 **Cinderstorm** *(Chaos · self-burn)*
    — the rings implode into an uncontrolled **chaosfire nova** covering where you stand.
  - **Flame Vortex →** 🐉 **Sun's Embrace** *(Dragon · heal)* — the inward pull is dragonfire; heals you per
    enemy dragged & burned. · 🔥 **Devouring Pyre** *(Chaos · self-burn)* — the vortex implodes into a
    self-consuming chaosfire well at your feet.

### Phase 3 — Leap → **Sunfall**

*Base imbue today: a burning **X-cross** at the impact point — arms **70px**, re-ticks every **0.5s (30f)**
at `leapDmg ×0.4`, 3s burn, **2s (120f)** life (`gFireCrosses`, ~L3863; params `FC_*`).*

- **Ranks 1–4 (numeric):** +impact damage (`FC_DMG_RATIO`) · +cross reach (`FC_REACH`) · +burn duration
  (`FC_BURN_FRAMES`) · +cross lifetime (`FC_LIFE`).
- **Rank 5 — Form:**
  - **Form A · Meteor** *(gap-close nuke)* — the X collapses into **one fat crater burst**: concentrated
    single-cluster nuke + heavy knockback where you land.
  - **Form B · Starfall** *(zone)* — impact **scatters 3–5 satellite flares** around the landing for wide
    crowd coverage (lower per-burst, broad footprint).
- **Ranks 6–9 (numeric):** Meteor → +crater radius / +center damage / +knockback · Starfall → +flare count /
  +scatter radius / +flare burn.
- **Rank 10 — Ascension** *(the transform: the single impact becomes a **celestial event**):*
  - **Meteor →** 🐉 **Phoenix Descent** *(Dragon · heal)* — the crater blooms **dragonfire** that heals you
    while you stand in it (dive in and sustain). · 🔥 **Cataclysm** *(Chaos · self-burn)* — a massive chaos
    comet **plus an uncontrolled delayed 2nd impact**; chaosfire craters burn you.
  - **Starfall →** 🐉 **Empyrean Bloom** *(Dragon · heal)* — each flare is dragonfire, healing you per enemy
    struck across the field. · 🔥 **Ruinfall** *(Chaos · self-burn)* — a relentless **chaosfire rain** across
    a huge zone, craters under you too.

### Phase 4 — Dash → **Trail of Embers**

*Base imbue today: a flame trail — patches every **18px**, radius **26**, **1.6s (96f)** life, ticks every
**0.4s (24f)** at base 10 (scaled by buffs), 3s burn. **Does NOT hurt the caster** today (`gFireTrails`,
~L3707; params `FT_*`).*

- **Ranks 1–4 (numeric):** +trail damage (`FT_DMG_BASE`) · +trail width (`FT_REACH`) · +patch duration
  (`FT_LIFE`) · +burn duration (`FT_BURN_FRAMES`).
- **Rank 5 — Form:**
  - **Form A · Inferno Wake** *(aggressive hit-and-run)* — trail runs **hotter / wider / longer**; carve
    burning lanes through packs.
  - **Form B · Ember Shroud** *(defensive peel)* — on dash-end a **brief burning aura wraps you**, burning
    adjacent chasers — a disengage tool (a short-lived aura tied to the player, vs. ground patches).
- **Ranks 6–9 (numeric):** Wake → +length / +damage / +width · Shroud → +aura duration / +radius / +damage.
- **Rank 10 — Ascension** *(the transform: the fire **outlives the dash** and ties to you):*
  - **Inferno Wake →** 🐉 **Wyrmwake** *(Dragon · heal)* — the trail is **dragonfire**; weaving back through
    your own lanes heals you (sustain-on-the-move). · 🔥 **Scorched Earth** *(Chaos · self-burn)* — the trail
    spreads sideways as uncontrolled **chaosfire walls** that catch you if you backtrack.
  - **Ember Shroud →** 🐉 **Phoenix Mantle** *(Dragon · heal)* — a **persistent dragonfire aura** heals you
    continuously while it burns nearby enemies. · 🔥 **Immolation** *(Chaos · self-burn)* — a permanent
    **self-immolation aura**: huge constant AOE that drains your own HP.

### Phase 5 — Heavy → **Pyroclasm** *(renamed from "Eruption" — frees the name for Form A)*

*Base imbue today: on heavy release (≥50% charge) a travelling **line of 3–8 fire pillars** (count by
charge), spacing 0.85 tiles, `heavyDmg ×0.55`, 3s burn, 9f telegraph → 22f eruption, 22px radius
(`gFirePillars`, ~L3930; params `FP_*`). The weighty-combat showcase.*

- **Ranks 1–4 (numeric):** +pillar damage (`FP_DMG_RATIO`) · +pillar count (`FP_MIN`/`FP_MAX`) · +burn
  duration (`FP_BURN_FRAMES`) · +pillar radius (`FP_RADIUS`).
- **Rank 5 — Form:**
  - **Form A · Eruption** *(skillshot nuke)* — the lane's **final pillar is 5× bigger and hits far harder**;
    you aim the lane to land the giant finale on a target/cluster. Skillshot payoff. *(The mid-lane pillars
    are the travel; the nth is the climax.)*
  - **Form B · Firewall** *(advancing AOE)* — **5 lines of pillars erupt in succession, travelling in the
    attack direction** — a sweeping wall that clears a corridor.
- **Ranks 6–9 (numeric):** Eruption → +finale size/damage / +lane range (where the big one lands) /
  +mid-pillar count · Firewall → +wall count (5→more) / +wall length (pillars per line) / +travel distance.
- **Rank 10 — Ascension** *(the transform: the pillars become a **sustained volcanic terrain event**):*
  - **Eruption →** 🐉 **Wyrmspine** *(Dragon · heal)* — the finale pillar **re-erupts 3 more times at regular
    intervals**, and **standing in the pillar heals you** (dragonfire) — plant on the blast and sustain off
    it. · 🔥 **Riftmaw** *(Chaos · self-burn)* — tears a **run-long chaosfire fissure** erupting erratically
    past your aim, burning you when you're near it.
  - **Firewall →** 🐉 **Dragonmarch** *(Dragon · heal)* — the advancing walls turn to **dragonfire and lay a
    dragonfire carpet in their wake**; you march forward behind your wall, healing as you push the frontline
    (sustain-on-the-advance). · 🔥 **Hellfront** *(Chaos · self-burn)* — the disciplined forward sweep
    **breaks loose: walls erupt outward in every direction** past your aim, blanketing a massive chaosfire
    field including the ground under you — you can't outrun your own front. *(Alt dread names if needed:
    Worldfire / Razewall.)*

> **Build order (highest-feedback first, Josh-approved 2026-06-10):** **Phase 2 Heavy (Pyroclasm) → Phase 3
> Whirlwind (Pyre Waltz) → Phase 4 Leap (Sunfall) → Phase 5 Dash (Trail of Embers).** Heavy is the
> weighty-combat showcase and its pillars already telegraph hard; Whirlwind's channelled rings are the most
> *visible* sustained FX; Leap and Dash are punchier but lower-uptime. *(Phase numbers above are slot order,
> not skill priority — build in this sequence.)*

> **Slice-C grounding the four phases reuse (no new mechanics):** the substance system is live — **dragonfire
> ground heals the owner 0.18× the climax damage per tick**; **chaosfire ground hurts the owner 0.35× per
> tick** (outside a 38px bare-center safe zone) and also burns enemies. There is **no generic lifesteal** —
> all healing routes through standing in *your own dragonfire ground*, so every 🐉 leaf above must lay a
> dragonfire patch the player can occupy (note where each does: anchor-in-zone, crater, aura, pillar,
> carpet). Every 🔥 leaf reuses the chaosfire ground turned on the caster — the self-burn *is* the cost.

---

## Build / UI grounding (for the engineer, not prescriptive)

- **Heavy FX reuse.** Burning ground already exists (`gFireTrails` / `burning-ground` FX) — the **Chaos
  (new-god) leaves** lean on it hard. Form transforms reshape existing systems (`gFireWaves` → projectiles
  or a ring; `gFireRings` collapse direction; etc.). Fireball projectiles may borrow the arrow/projectile path.
- **Slice C — Dance of Fire rank-10 specifics (Slices A/B don't touch any of this):**
  - **The 3-hit-combo LMB transform.** Every peak leaf converts the normal attack (LMB / `gDoSwingAt`,
    ~L3392) into a **3-hit chain** where each hit escalates and the **3rd hit is the climax** (lays the
    signature ground / launches the big projectile). Needs a per-player combo-step counter + timing window
    (a swing that chains 1→2→3 then resets), each step spawning a bigger FX than the last. This is a *swing*
    rewrite, not a param tweak — the meatiest part of Slice C. (MP: the combo step rides the existing
    swing-sync path; confirm the step index syncs so clients render the right escalation.)
  - **Two fire-substance grounds** (both are burning-ground variants — reuse `gFireTrails` /
    `burning-ground`, ~L5708):
    - 🐉 **dragonfire ground — HEALS the owner.** A new friendly hazard: while the casting player stands in
      *their* dragonfire, they heal (per-tick). No heal mechanic from own-fire exists today; scope a per-tick
      heal magnitude on the imbue-path state. Host/SP-authoritative like burn; heal syncs to the owner in MP.
      *Art: rainbow-tinged flame (handoff to Artist).*
    - 🔥 **chaosfire ground — HURTS enemies AND the owner.** The existing enemy burning-ground, now also
      testing the *caster* against it (today it spares the caster). Tune the self-DPS to be a real threat,
      not chip — that self-burn IS the balance cost of the leaf's massive AOE.
  - **Per-leaf climax spawns:** Flame of Chaos → a **massive slow-moving chaos-fire projectile** (borrow the
    fireball/arrow path, oversize + slow, leaves a chaosfire wake). Dragonfire → **directional dragonfire
    jets** on the 3rd swing. Dragondance → **3 escalating concentric ring-waves**, 3rd = dragonfire.
    Helldance → **3 escalating cones** of chaosfire.
- **State.** A per-player imbue-path map (rank + chosen Form + chosen Chaos per skill), parallel to the
  existing `skillMods`/`gritMods` (`~2425`). Numeric ranks write magnitudes the FX spawn sites read
  (thread into `gFireWaves`/`gFireTrails`/`gFirePillars` spawn params, `~3619`/`~5708`/etc.).
- **Draft integration.** Ranks 1–4 / 6–9 appear as ordinary draft cards (reuse `_cardValue` rarity/Favor
  economy). **Ranks 5 and 10 are special "evolution choice" events** — a 2-option overlay, modeled on the
  existing imbue-overlay (`#g-imbue-overlay`) or a flagged draft card pair. Gated on owning that imbue.
- **AI-native.** The two evolution events are game-pausing choices → each needs a `gSim*` programmatic
  hook (mirror `gSimDraft.pick`) or headless runs stall. New `Sim.observe()` fields: per-skill rank +
  pending evolution choice. (Engineer's charter; noted so the harness doesn't rot.)

## Phasing — the shippable slice first

This is a **system**, not one feature — 5 skills × full tree is an epic. Ship it as a vertical slice, one
skill at a time, highest-feedback skill first:

- **Phase 1 — System + Dance of Fire (the slice).** ✅ Built (Slices A–C). The 10-rank tree data model +
  draft integration (rank-up cards + the two evolution-choice events + Sim hooks), and **Dance of Fire's
  full tree** (both Forms, all leaves). One named Art, fully playable, proving the whole system feels good.
- **Phases 2–5 — fan out** on the now-built framework + that skill's new FX. *~a session+ each.* **Each is
  fully designed above (Josh-approved 2026-06-10).** **Build order (highest-feedback first):**
  **Phase 2 = Heavy (Pyroclasm) → Phase 3 = Whirlwind (Pyre Waltz) → Phase 4 = Leap (Sunfall) →
  Phase 5 = Dash (Trail of Embers).**

Front-loads the system risk into Phase 1; every later phase is additive content on proven rails — no new
core mechanics, just per-skill FX shapes + the existing dragonfire/chaosfire grounds.

## Balance

- **Forms are sidegrades, not upgrades** — a *playstyle* choice (range vs. surround), tuned to comparable
  power so neither is the trap pick.
- **The two-age fork is sustain-vs-burst — tune it as a real choice, not a power tier.**
  - 🐉 **Dragon (heal) must NOT be free power.** It's the *sustain* pole, so its **damage is lower** than
    the Chaos leaf — you trade ceiling for survivability. The trap to avoid: "heals you AND hits hardest" =
    strictly-better. The heal is the payoff; the damage gap is the price. Tune heal-per-hit so it rewards
    aggression without making you unkillable (cap/diminish vs. large packs).
  - 🔥 **Chaos (self-burn) is power + cost.** Massive AOE is the draw; the **self-burn must be a genuine
    threat** (real DPS to the caster, not chip) or the "cost" is fake and it's strictly better than Dragon.
    The self-hazard / off-aim spread / off-timing re-trigger is the balancing lever — if a Chaos leaf can be
    played with no downside, it's under-costed.
- **Cap every numeric rank** (like `SKILL_STAT_FLOOR`) so a maxed path can't tank FPS or trivialize.
- Forks **irreversible per run** — build commitment is identity (and the run is non-persistent, so the
  next run re-chooses).

## Decisions (resolved — Josh, 2026-06-09)

1. **Rank-10 structure → BINARY TREE.** 2 Forms × 2 Chaos = **4 endpoints/skill.** Confirmed.
2. **Names → approved.** Dance of Fire · Pyre Waltz · Sunfall · Trail of Embers · Eruption stand. **New
   directive:** all **level-10 Chaos** names must **evoke dread / chaos / sinisterness** (the gods'
   grip slipping). Applied to Dance of Fire (Wake of Ruin · Cinderplague · Halo of Damnation · Unending
   Maelstrom); carry the same tone into the other four skills' Chaos leaves when built.
3. **Lore → logged as canon.** The waning-gods / turning-of-the-age myth is now in the Creative Manifesto
   Direction Log (2026-06-09). See the canon box at the top of this spec.

## Decisions (resolved — Josh, 2026-06-10)

4. **Per-god Higher Forces.** *(Superseded by #7.)* The level-10 peak was framed as each god's single
   Concept force (Cilia→Chaos, Boreas→Order, Bhumi→Light, Ikras→Darkness). #7 keeps these as the **new
   pole** but adds an **old pole** (the Animal-Spirit predecessor) the player can choose instead.
5. **Elemental Fusion is a mutually-exclusive alternative to the peak**, not an orthogonal add-on. Fuse a 2nd
   element (Favor, at the shrine) after a skill is level-5 + evolved → caps element A at 5, levels element B
   1→5 + one evolution, stacks both once-evolved effects. Pure = 1→10→peak; Fusion = 5+5, no peak.
   Second element gets its own 1→5 card track + one evolution (not base-effect-only). See "Elemental Fusion."
6. **Fusion parks behind Boreas** (needs a 2nd element). Phase 1 (Cilia pure tree → peak) is unaffected and
   ships first. The fusion hook is specced now; built when a 2nd god lands.

7. **The level-10 peak is a TWO-AGE FORK (Josh 2026-06-10 reframe).** Three ages of gods exist —
   **Animal Spirits (past) → Elementals (now) → Concepts (coming)**. At rank 10 the player chooses which
   way the age turns: the **Old-god (Animal Spirit) leaf** = *sustain* (for Cilia, the **Dragon** —
   dragonfire that **heals** the caster), or the **New-god (Concept) leaf** = *power + cost* (for Cilia,
   **Chaos** — massive AOE whose flames **burn** the caster). **One Old + one New leaf per Form** → still
   4 endpoints/skill (2 Dragon-heal, 2 Chaos-burn). *(CD canon: the three-age structure + this fork still
   need a `studio/CREATIVE_MANIFESTO.md` Direction Log entry — ⚑ Josh to log.)*
8. **Dance of Fire rank-10 fully specced (Josh-canon 2026-06-10).** Form A renamed **Emberlance → Emberfan**.
   All four leaves named + mechanically defined, unified by a **3-hit-combo LMB transform** (each hit
   escalates, 3rd is the climax): **Emberfan →** 🐉 *Dragonfire* (3rd swing jets dragonfire / heal-ground;
   rainbow visual) · 🔥 *Flame of Chaos* (3rd swing = massive slow chaos-fire ball + chaosfire wake);
   **Cinder Ring →** 🐉 *Dragondance* (3 escalating ring-waves, 3rd = dragonfire heal-ground) · 🔥 *Helldance*
   (3 escalating chaosfire cones). Two substances: **dragonfire** heals the caster, **chaosfire** hurts
   enemies + the caster. **Dance of Fire's tree is now design-complete and ready for Slice C build.**

9. **Phases 2–5 (the other four fire skills) fully designed (Josh-approved 2026-06-10).** Each skill's
   ranks 1–4 / Form fork @5 / ranks 6–9 / two-age @10 leaves are specced in "The other four imbued skills"
   above, grounded in each skill's live base FX + line-refs. **No new core mechanics** — every 🐉 leaf paints
   the Slice-C dragonfire heal-ground, every 🔥 leaf the chaosfire self-burn ground. **Heavy reworked in this
   pass (Josh's edits):** Art name **Eruption → Pyroclasm** (freeing "Eruption" for Form A); Form A
   **Magma Line → Eruption** (skillshot — final pillar 5× / harder); Form B **Volcanic Field → Firewall**
   (5 lines erupting in succession, travelling in the attack direction); 🐉 **Wyrmspine** = finale re-erupts
   3× at intervals + heals if you stand in it; 🔥 **Riftmaw** unchanged; new Firewall leaves 🐉 **Dragonmarch**
   (dragonfire carpet in the walls' wake) / 🔥 **Hellfront** (walls break loose omnidirectionally, burning
   you). **Build order:** Heavy → Whirlwind → Leap → Dash (highest-feedback first).

**→ Status: Phase 1 (Cilia tree + Dance of Fire) SHIPPED — full tree through rank 10. Phases 2–5 now fully
designed and cleared for engineering (build order: Heavy → Whirlwind → Leap → Dash).** Every later phase is
additive content on the proven Phase-1 rails: per-skill numeric levers + 2 Form FX shapes + 1 peak transform
reusing the existing dragonfire heal-ground / chaosfire self-burn ground. **The other gods' Animal-Spirit
poles + Elemental Fusion remain deferred** (designed when their god lands).
