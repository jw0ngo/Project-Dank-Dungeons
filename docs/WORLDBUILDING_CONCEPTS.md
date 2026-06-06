# Dungeon Forge — Worldbuilding & Design Concepts

**Status: EXPLORATORY.** Setting themes and core-design thinking, captured so it isn't lost.
Everything here is **subject to change** and is **upstream of the approval gate** — it is *not* a
build spec and *not* on the roadmap. The build queue is [`ROADMAP.md`](ROADMAP.md); nothing here
becomes engineering work until it's proposed, approved, and moved there. This doc is the "why the
world works this way" that future proposals draw on.

Captured 2026-06-06 from a design ideation session (Josh + PM).

---

## Setting (dark fantasy — Souls / Elden Ring lineage)

- The world is **dark fantasy**: gods **come and go**. The patrons we know (Cilia, Boreas, Ikras,
  Bhumi) are **waning** — their myths fading — and they survive only by being *remembered and
  wielded*. So they hunt for **champions** to relight their myth and keep them alive.
- The **player character is a potential champion** — but they are an **individual with their own
  mission** (TBD), not a born servant. They take on the gods' blessings to further *their own*
  ends.
- **Using a god's blessings in battle relights that god's myth.** The gameplay loop *is* the
  fiction: wielding power feeds the power.

*(General themes, subject to change.)*

---

## The core fantasy

> **An individual hero who wields the gods' blessings for their own benefit, while retaining their
> own creativity and individuality.**

Not "a devotee who has mastered one god." The skilled/creative player uses blessings *as it suits
them*. Full devotion to a single god is **a valid path, but a dark one** — it means extinguishing
one's own soul/desires and replacing them with the patron's.

This is the load-bearing design decision: the build system must let players **mix** gods'
blessings (that's the expression of individuality and mastery), while making mixing a **meaningful
tradeoff** rather than a free buffet.

---

## Core build philosophy — the Devotion gradient

**Mixing is allowed and central — but costed.** Imbuing skills with gods' power draws on a finite
per-run resource, **Favor**, and deeper power costs more. This single mechanic turns the fantasy
into a system and controls the design risks (balance, identity, co-op, readability) at once.

Three poles on one gradient:

- **Spread wide — the individual hero.** Sample several gods; each blessing stays **shallow**.
  Flexible, creative, "you" — but no single god's power fully blooms.
- **Concentrate — toward devotion.** Pour Favor into one god to unlock its **deeper imbue tiers**
  (within-god specialization). Stronger, narrower.
- **Full devotion — extinguish the self.** Max one god → a **champion capstone** (transformation /
  ultimate; the god's myth fully relit through you). Enormous power, but flexibility is gone and
  your skills become *the god's*, not yours. The dark pact: power for selfhood.

**The self axis already exists.** Your **base class kit and its leveling are *yours*** (the
warrior's skills). Imbues are a god's flavor *wielded on top*. So the build tension is literally
**self ↔ god(s)**, and the "self" half is already built. Full devotion = the god *overwrites* your
skills.

### Why the gradient works (the four risks it neutralizes)

| Risk of *free* mixing | Neutralized by Favor scarcity |
|---|---|
| Balance explosion (max fire **and** max ice) | Can't afford to max two gods; mixed builds are made of *shallow* blessings — only focus buys depth. The combinatorial space collapses to a curve. |
| Identity dilution → "soup" | Scarcity nudges every build toward a **dominant god + accents** — a clear silhouette. |
| Co-op contrast lost (pillar 4) | Deep power needs a primary, so two players naturally anchor **different mains** → freeze→shatter-style cross-god contrast survives emergently. |
| Visual noise (pillar 1) | A dominant primary = coherent, readable FX with an accent, not a chaos of unrelated effects. |

### Fiction → system mapping

- *Gods waning, hunting champions to relight their myth* → **Favor is the relighting**; using a
  god's skills feeds it.
- *Use blessings as it suits you, keep your individuality* → the **skilled player threads the
  gradient** — enough of two gods to create combos, without surrendering self.
- *Full devotion = extinguish the soul* → the **capstone path**: the god overwrites your skills.
  Powerful, narrow, a sacrifice.
- *Hero with their own mission* → the **self axis** (base kit + leveling) is yours; gods are tools.

---

## North star: Souls / Elden Ring

ER builds mix freely (faith/strength hybrids are real and expressive) but are constrained by
**stat investment, limited slots, FP, equip load, costly respec** — identity comes from *what you
committed to*, never a forced mono-theme. Translate directly: **Favor = stat investment, imbue
slots = limited, deeper tiers cost more, swapping has friction.** The thing to avoid is *free*
mixing, not mixing itself.

*(Contrast: Hades makes free god-mixing its whole spine, but via run-to-run randomness + authored
Duo boons — a different, bigger commitment that fights the "pre-selected class + kit" determinism
and the single-god co-op fantasy. We're taking the ER-style costed-hybrid route, not the Hades
route.)*

---

## World structure — areas, shrines & the run loop

*(Added 2026-06-06.)*

**The world is a set of areas; a run is an incursion into one.** Each **area** = a biome + an
enemy faction + **one usurped shrine** to reclaim. The first area is the **Goblin Forest**,
inhabited by goblins. (This is a scalable content *template*: future areas reskin biome + faction
+ shrine — the engine for the "wider world.")

- **Maps are procedurally generated and non-persistent** (as today) — each run feels fresh; you do
  not learn one fixed map. **One shrine per map.**
- **The shrine is held by the enemy.** In the Goblin Forest the shrine was abandoned by humans and
  **usurped by goblins**, who exploit the gods' *remnant* power for their own benefit (their
  shamans channel the perverted version). The remnant divinity is *why* the forest is theirs and
  *why* there's power to harvest.
- **The player reactivates the shrine** to draw on the gods' true power in service of their quest.

### Two beats — keep them separate

- **Reactivation = a one-time conquest.** Fight to the held shrine, clear the usurpers, reclaim it.
  The run's opening objective + a power-fantasy beat + the natural home for the **Goblin King**
  (the usurper holding it). Optional mechanic: while corrupted, the shrine **buffs nearby goblins**
  — so reclaiming it both *unlocks your power* and *debuffs the enemy* (a contested aura, not a
  passive unlock).
- **Pilgrimage = the recurring return.** Once reclaimed, the shrine is **your hearth** in hostile
  territory — where you imbue/deepen skills, spend Favor, restock, recover between sieges. You
  return because it's *yours and rewarding*, not because a rule forces you (the bonfire pattern).

### The run loop (the emerging structure)

> **Day:** explore the procedural map — raid goblin camps, hit shops, trigger random events, build
> Favor/gold. **Night:** survive the siege (Nightfall, shipped). **Every few levels:** an imbue
> charge banks → pilgrimage back to your reclaimed shrine to imbue or deepen a skill → the build
> inflects. World pressure escalates. Repeat.

**Anti-tedium = random events, not multiple shrines.** With one shrine, the return trip stays fresh
because the map **spawns varied, mostly-opt-in, net-positive events** (roaming mini-boss over loot,
goblin caravan ambush, remnant-cache, captive) that *reward* traversal and feed the run economy.
Events that **block** a mandatory return reintroduce friction — keep most skippable.

**Bank the imbue, don't gate the level.** Reaching the level milestone grants an *imbue charge*;
the shrine is where you cash it. The player is **never blocked** from leveling/playing — only
*pulled* back by an available reward. "Must return" → "want to return."

---

## Decisions locked (this session)

- **Favor is a single shared pool** — spend it on any god; pure opportunity cost. (Chosen over a
  per-god track for legibility; per-god *flavor* can layer on top later.)
- **The "individuality / no-god" path is deferred** — a hero who takes *no* god and powers up
  their own soul instead is a tempting playable build (makes individuality literal, not just a
  restraint on devotion), but it's ~a fifth god's worth of content. Revisit later.
- **One shrine per map; maps stay procedurally generated & non-persistent** — freshness via random
  events, not a learnable fixed world or distributed shrines.
- **Area template:** biome + enemy faction + one usurped shrine to reclaim. First area = Goblin
  Forest.
- **Shrine = reclaimed hub** (reactivate-once conquest), not a vending machine; **pilgrimage is a
  pull** (banked imbue charges), not a hard gate. *(Recommended/locked-in-intent; validate in
  playtest.)*

---

## Open questions (for later)

- Exact capstone (full-devotion) design per god — transformation? ultimate skill? what's traded?
- How Favor is earned in a run (shrines, kills, milestones?) and whether it's respec-able.
- Whether deeper tiers are linear (tier 1→2→3) or branching (the within-god specialization tree).
- The player character's actual **mission** (the "self" the devotion path extinguishes).
- **One area per run, or several?** Lean: one (Goblin Forest) = the slice; multi-area becomes a
  later layer or meta-progression. Don't build the world map yet.
- **Shrine economy unification:** reclaim (unlock) + Favor (breadth-vs-depth spend) + imbue charges
  (cadence) should be designed as *one* system, not three bolted-together currencies.
- **Big synergy to weigh (bigger scope):** should the **night siege threaten the reclaimed
  shrine** — defend your base by night, pilgrimage by day — fusing Nightfall + the shrine loop into
  one structure? Powerful, but a meaningfully larger design.

---

## Sequencing (how this reaches the game — not yet)

- **The gradient can't be tested with one god** — it needs ≥2 imbue sets to mean anything, so it
  sequences **after Boreas**, not now.
- **The vertical slice is unaffected and still correct:** one god vs. the difficulty curve = a
  *high-devotion Cilia build* on this model. Prove that feel first ([`ROADMAP.md`](ROADMAP.md) →
  *Now*).
- **Cheap MVP when we get there:** skip the full Favor economy at first — just give the player
  **fewer imbue slots than skills.** Choosing *which* skills get *which* god, under scarcity,
  already creates the wide-vs-deep tension for almost no system cost. Grow the economy later.

See also: the **god identities** table in [`ROADMAP.md`](ROADMAP.md) (each patron's distinct
combat identity — the blessings this system mixes).
