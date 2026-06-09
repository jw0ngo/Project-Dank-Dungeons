# Imbue Paths — the imbued-skill mastery system

**Status:** design (PM, 2026-06-09) — fleshes out *Now* item 2 (**Imbue card paths**). Awaiting Josh's
sign-off on the three open calls at the bottom before Phase 1 hands to engineering.

**Pillar:** build-craft depth (primary) · game feel · mastery. Serves the Creative Manifesto's *"builds
are identity, not arithmetic"* and *"the hero wields the gods' power"*.

> **Canon (CD beat, Josh 2026-06-09 — now logged in `studio/CREATIVE_MANIFESTO.md` Direction Log):** *the
> gods are waning in power and resort to other means of "perceived higher power" to preserve themselves —
> chaos and order, light and dark. If called upon enough, these concepts become the new gods of the next
> age.* The game is set in **the turning of the age**: the old gods are passing, the new are being born.
> Channeling a blessing to its **peak (rank 10)** routes the power through these raw, half-born forces —
> so the strongest powers carry **chaos: more havoc, less control.** This is what *To Dust* means
> (old gods crumbling to dust, new powers born from it) and the cost of borrowed divine power: at its
> limit, it corrupts. The level-10 "Chaos Ascension" is that theme made playable.

---

## The structure — a 10-rank mastery tree per imbued skill

Each imbued skill is a **named Art** that ranks up **10 times** over a run, via the level-up card draft.
The tree is two numeric stretches bracketing two branch points:

| Ranks | What the card does |
|------|--------------------|
| **1–4** | **Numeric upgrades** to the base imbue (damage · size/reach · duration · count). Ordinary draft cards, now framed as *ranking up a named ability* — this alone fixes "leveling is boring stat bumps." |
| **5 — FORM** | **Branch ①: choose 1 of 2 Forms.** A real transformation that changes the *shape and playstyle* of the skill (e.g. ranged vs. close-surround). Irreversible for the run. |
| **6–9** | **Numeric upgrades** to your chosen Form. |
| **10 — CHAOS** | **Branch ②: choose 1 of 2 Chaos Ascensions** of your Form. The capstone — power **plus** loss of control, per the waning-gods lore. Irreversible. |

So each skill is a **binary tree → 4 possible endpoints**, but any one run walks a single path:
`base → Form (1 of 2) → Chaos (1 of 2)`. Two players who both maxed Dance of Fire can play completely
differently. That divergence **is** the build-craft payoff.

**Why two numeric stretches between forks:** the forks are the *identity* moments; the numeric ranks are
the *commitment* you pour into the identity you chose. A fork with no investment on either side feels
weightless.

## The Chaos rule (what every rank-10 must do)

A Chaos Ascension is **not** "the same thing but bigger." Every one must add an **uncontrolled,
indiscriminate element** alongside the power — the god's waning grip showing through:

- **Burning ground that lingers in your space**, not just the enemy's — you now share the battlefield
  with your own fire (reuses the existing `burning-ground` / `gFireTrails` hazard).
- **Effects that spread, split, or re-trigger beyond your aim / timing** — you start the havoc, the
  chaos finishes it where *it* wants.

This is weighty-combat at the build layer: peak power carries a real cost and a real risk. It also seeds
co-op chaos (your fire is a hazard your ally must read too).

## Naming

Each imbued skill gets an evocative **Art name**, each Form a name, each Chaos leaf a name — names carry
the fantasy. Josh named the first (**Dance of Fire**). Names below for the other four are **PM proposals
— Creative Director's to override.**

---

## Worked example — DANCE OF FIRE (imbued normal attack)

*Base imbue today: a fire wave/arc cast on swing (`gFireWaves`).*

- **Ranks 1–4 (numeric):** +wave damage · +arc width · +travel distance · +burn duration.
- **Rank 5 — Form:**
  - **Form A · Emberlance** *(long range)* — the wave becomes a **volley of fireballs loosed in an arc**
    that travel a long distance. Playstyle: poke, spacing, kiting from safety.
  - **Form B · Cinder Ring** *(close / surrounded)* — the wave becomes a **ring of flame that erupts
    around you**. Playstyle: wade in, get surrounded, punish the crowd. *(Josh's "flame strike circle.")*
- **Ranks 6–9 (numeric):** Emberlance → +fireball count / +pierce; Cinder Ring → +ring radius / +pulse damage.
- **Rank 10 — Chaos Ascension (choose 1 of 2 on your Form):**
  - From **Emberlance →**
    - **Wake of Ruin** *(was "Hellfire Lanes" — Josh's example)* — the fireballs become **chaos fireballs
      that leave trails of burning ground** along their flight paths. You carve long lanes of fire across
      the field — lanes that linger and box in *you* as much as the enemy.
    - **Cinderplague** — fireballs **burst on impact into erratic secondary embers** that scatter where
      they will, spreading fire like a contagion. You aim the first shot; chaos aims the rest.
  - From **Cinder Ring →**
    - **Halo of Damnation** *(was "Pyre Halo" — Josh's "chaos fire wave")* — the ring leaves a **lingering
      circle of burning ground around you** that follows each eruption. Devastating while surrounded — but
      you're standing in it.
    - **Unending Maelstrom** — the ring **re-erupts 2–3 times** over a couple seconds on its own cadence,
      a firestorm that won't be called off. More havoc, on chaos's timing, not yours.

*(All four Chaos endpoints confirmed — binary tree, Josh 2026-06-09. Naming convention for every Chaos
leaf, this skill and the four to come: **evoke dread / chaos / sinisterness** — these are the gods' grip
slipping, not a triumphant power-up.)*

---

## The other four imbued skills (design skeleton — PM-proposed, build later)

Same 10-rank shape. Forks pitched to split **distinct playstyles**; Chaos leaves obey the Chaos rule.
Names + leaves are proposals pending the CD pass and the per-skill build.

| Skill (base FX) | Art name *(proposed)* | Form A @5 | Form B @5 | Chaos flavor @10 |
|---|---|---|---|---|
| **Whirlwind** — expanding fire rings (`gFireRings`) | **Pyre Waltz** | **Wildfire Bloom** — slow, huge, persistent rings (zone denial) | **Flame Vortex** — rings collapse *inward*, dragging + burning enemies toward you (melee setup) | Bloom → charred field that stays; Vortex → implodes into an uncontrolled nova |
| **Leap** — burning cross at impact (`gFireCrosses`) | **Sunfall** | **Meteor** — one big impact burst (gap-close nuke) | **Starfall** — impact scatters several smaller bursts around the landing (zone) | Lingering burn craters; or a delayed second impact on chaos's timing |
| **Dash** — flame trail (`gFireTrails`) | **Trail of Embers** | **Inferno Wake** — hotter/wider/longer trail (aggressive hit-and-run) | **Ember Shroud** — trail wraps you as a brief burning aura/peel (defensive, still damages) | Trail spreads sideways as wildfire; or flares into short-lived fire walls |
| **Heavy** — travelling line of fire pillars (`gFirePillars`) | **Eruption** *(or Pyroclasm)* | **Magma Line** — more pillars, longer focused lane (directional nuke) | **Volcanic Field** — pillars erupt in a radial cluster around the aim point (AOE) | Pillars leave run-long burning ground; or erupt erratically past where you aimed |

---

## Build / UI grounding (for the engineer, not prescriptive)

- **Heavy FX reuse.** Burning ground already exists (`gFireTrails` / `burning-ground` FX) — the Chaos
  tier leans on it hard. Form transforms reshape existing systems (`gFireWaves` → projectiles or a ring;
  `gFireRings` collapse direction; etc.). Fireball projectiles may borrow the arrow/projectile path.
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

- **Phase 1 — System + Dance of Fire (the slice).** Build the 10-rank tree data model + draft integration
  (rank-up cards + the two evolution-choice events + Sim hooks), and **Dance of Fire's full tree** (both
  Forms, all Chaos leaves). One named Art, fully playable, proving the whole system feels good. *Multi-session.*
- **Phases 2–5 — fan out** to Pyre Waltz · Sunfall · Trail of Embers · Eruption, one per slot on the
  now-built framework + that skill's new FX. *~a session+ each.*

Front-loads the system risk into Phase 1; every later phase is additive content on proven rails.

## Balance

- **Forms are sidegrades, not upgrades** — a *playstyle* choice (range vs. surround), tuned to comparable
  power so neither is the trap pick.
- **Chaos is power + cost, not pure power** — the uncontrolled element (self-hazard burning ground, wasted
  off-aim coverage, off-timing re-triggers) is the balancing lever. If a Chaos leaf is strictly better than
  its Form, it's under-chaosed.
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

**→ Status: cleared for Phase 1 hand-off to engineering** (the tree system + Dance of Fire's full tree).
