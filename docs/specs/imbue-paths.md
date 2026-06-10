# Imbue Paths — the imbued-skill mastery system

**Status:** design (PM, 2026-06-09; extended 2026-06-10 with per-god Higher Forces + Elemental Fusion) —
fleshes out *Now* item 2 (**Imbue Paths**). Phase 1 (Cilia pure tree → Chaos) cleared for engineering;
fusion + the other gods' forces are specced but deferred (see Decisions).

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

## The level-10 peak — each god's Higher Force

The level-10 evolution is the skill **ascending into the god's "higher power"** — the raw force the
waning god channels to survive. **Each god routes to a different force, with its own signature cost**
(CD canon, Josh 2026-06-10 — *to be logged in `studio/CREATIVE_MANIFESTO.md`*):

| God | Element | Level-10 Higher Force | Signature cost (the "grip slipping") |
|-----|---------|----------------------|--------------------------------------|
| **Cilia** | Fire | **Chaos** | Uncontrolled / indiscriminate — spreads, splits, lingers in *your* space too |
| **Boreas** | Ice | **Order** | Rigid / binding — control that constrains the caster as much as the enemy *(define when built)* |
| **Bhumi** | Earth | **Light** | Overexposing / revealing — power that blinds or burns out *(define when built)* |
| **Ikras** | Wind | **Darkness** | Draining / obscuring — chaining that consumes or hides *(define when built)* |

(The four forces form oppositional pairs — Chaos↔Order, Light↔Darkness — a latent future axis; not built now.)

### The Chaos rule (Cilia's instance — the template for the others)

A Chaos Ascension is **not** "the same thing but bigger." Every one must add an **uncontrolled,
indiscriminate element** alongside the power — the god's waning grip showing through:

- **Burning ground that lingers in your space**, not just the enemy's — you now share the battlefield
  with your own fire (reuses the existing `burning-ground` / `gFireTrails` hazard).
- **Effects that spread, split, or re-trigger beyond your aim / timing** — you start the havoc, the
  chaos finishes it where *it* wants.

This is weighty-combat at the build layer: peak power carries a real cost and a real risk. It also seeds
co-op chaos (your fire is a hazard your ally must read too). **Each other god's higher force obeys the
same shape — power + a signature, on-theme cost — expressed through that force, not Chaos.**

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

## Decisions (resolved — Josh, 2026-06-10)

4. **Per-god Higher Forces.** The level-10 peak is each god's own force, not universal Chaos: Cilia→**Chaos**,
   Boreas→**Order**, Bhumi→**Light**, Ikras→**Darkness**, each with a signature cost. *(CD canon — Josh to log
   in `studio/CREATIVE_MANIFESTO.md`.)* See "The level-10 peak" section. Cilia's Chaos tree is unchanged.
5. **Elemental Fusion is a mutually-exclusive alternative to the peak**, not an orthogonal add-on. Fuse a 2nd
   element (Favor, at the shrine) after a skill is level-5 + evolved → caps element A at 5, levels element B
   1→5 + one evolution, stacks both once-evolved effects. Pure = 1→10→Higher Force; Fusion = 5+5, no peak.
   Second element gets its own 1→5 card track + one evolution (not base-effect-only). See "Elemental Fusion."
6. **Fusion parks behind Boreas** (needs a 2nd element). Phase 1 (Cilia pure tree → Chaos) is unaffected and
   ships first. The fusion hook is specced now; built when a 2nd god lands.

**→ Status: Phase 1 (pure tree + Dance of Fire) cleared for engineering** — the 10-rank tree + per-skill
level + Form@5 + Chaos@10 for Cilia. **Fusion + the other gods' Higher Forces are specced but deferred**
(fusion behind Boreas; Order/Light/Darkness costs defined when each god is built).
