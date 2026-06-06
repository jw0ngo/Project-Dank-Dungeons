# Spec — Favor & the Imbue Economy

**Status:** `approved` 2026-06-06 (redesigned per Josh) · the build-craft economy layer over the [card-draft](card-draft.md) + the existing imbue system.
**Pillar:** build-craft depth (the wide-vs-deep gradient) · mastery (earned power) · game feel (a rare resource + a juicy spend).
**Reads with:** [`card-draft.md`](card-draft.md) (cards = magnitude) · [`../WORLDBUILDING_CONCEPTS.md`](../WORLDBUILDING_CONCEPTS.md) (Favor-gradient philosophy, run loop).

**One-liner:** **Favor** is a rare run-scoped currency that drops from kills, and it has **one job: it's the price of a new patron.** Imbuing skills with a god you're *already attuned to* is free (paced by level-ups); attuning to an *additional* god costs Favor. Depth is free; breadth is earned.

> **Why this model (supersedes the earlier dual-gate version):** the first design gated imbuing by *both* level allowance *and* Favor — two requirements for one action, too complex (Josh, 2026-06-06). This version gives Favor a single, legible job and is a *truer* expression of the build-craft gradient: **mono-god depth costs nothing but levels; multi-god breadth costs Favor.** Fewer code paths (Favor only triggers on a patron change), one currency, one mental model.

---

## The model

### Favor
- A **rare run-scoped resource** (`gFavor`, resets each run — wilderness imbues already start fresh).
- **Drops from enemy kills at a low rate** (most kills drop nothing), surfaced as a **Favor orb** pickup (mirror `gXPOrbs`), auto-collected within pickup range → the **pickup-range passive card** synergises.
- **Later:** elites/specials drop **guaranteed** Favor (1–3). Out of scope now; the drop hook should make it trivial to add.

### Attunement (what Favor buys)
- You become **attuned** to a god to imbue skills with it. Attunement is per-run, can hold several gods.
- **Your first patron is free** — reactivate the shrine, choose a god, you're attuned at no cost.
- **Each *additional* patron costs Favor, escalating** (2nd, 3rd, 4th cost progressively more). This is the entire Favor sink for build-craft — the price of a *divided soul*.

### Imbuing (free, once attuned)
- Imbuing a skill with **any god you're already attuned to is FREE.**
- **Imbues happen at level-up moments** — on the level-up screen you may spend your card pick to imbue a displayed **skill card** with an attuned patron (you get the card's magnitude *and* the imbue). Picking one card per level naturally paces imbues to ≤1 per level — **no separate "allowance" counter needed** (this is what retires the dual-gate).
- The shrine's "Imbue a Skill" overlay remains as a secondary, equivalent claim point.
- **Pre-req:** imbuing is available once you've reactivated the shrine and chosen your first patron (the early-run objective) — *not* a hard level number. (Sub-call: keep a soft "first imbue available at level 5" beat if we want guaranteed onboarding rhythm — default is patron-gated, not level-gated, for maximum simplicity.)

### Reroll
- Rerolling the level-up cards is a **secondary Favor sink** (escalating cost within a level-up, resets each level). Keeps to one currency. *(Flag: make rerolls free/charge-based instead if we want Favor to be purely about patrons.)*

---

## The gradient (why this is the build-craft spine)

| Path | Cost | Identity |
|---|---|---|
| **Mono-god (depth)** | free (levels only) | Devotion — one god across your kit. One-dimensional but cheap. The fiction's self-erasing path. |
| **Multi-god (breadth)** | escalating **Favor** | Individuality — combinations + **co-op synergy** (Boreas freeze → Cilia shatter) one god can't reach. Powerful, but you pay for it. |

Breadth isn't strictly stronger — it buys *versatility & combos*, not raw numbers — so both paths stay live. **The Favor drop rate is the master lever** for how viable multi-god is.

**Lore fit:** your primary god blesses you freely to relight their myth. Jealous, waning gods demand **tribute (Favor)** to share power with a champion who isn't wholly theirs — and the more gods you juggle, the more each demands. "Favor = the price of a divided soul."

---

## Numbers (live-tune starting points)

- **Favor drop rate:** ~4% of normal kills → 1 Favor. (Elites later: guaranteed 1–3.)
- **New-patron cost:** 1st **free** · 2nd **8** · 3rd **14** · 4th **20** Favor (escalating breadth cost).
- **Reroll cost (per level-up):** 1st **2** · 2nd **4** · 3rd **6** Favor, resets each level.
- **Sanity check:** a ~level-20 run earns ~15–25 Favor (tune via drop rate) → enough to attune to **1–2 extra gods**, or fewer gods + more rerolls. Multi-god is a real investment, not a default.

---

## Touches *(grounded — engineer owns the how)*

- **New `gFavor`** run var; reset in the run-reset block (~12162, beside `wildLevel = 1`).
- **New `gAttunedGods`** (a Set/array on the player, per-run) — tracks which patrons are paid-for. First entry free on shrine patron-select.
- **Favor orb drop:** mirror `gXPOrbs` — a `gFavorOrbs[]`, spawned in `gKillEnemy` (~2828) on a drop roll; collect within pickup range; increment `gFavor`. Distinct color (violet/gold). HUD counter near the level/XP readout (~`g-xp-wrap` / ~11870).
- **Attunement charge:** `gShrineSelectGod` (~13142) — choosing a god *not* in `gAttunedGods` costs the escalating Favor price (first is free); reject if insufficient Favor.
- **Imbue apply (now free, attuned-gated):** simplify `gImbueSelectSkill` (~13069) — drop the `gImbueAllowance` (floor(level/5)) gate; require only: skill unlocked · not already imbued · patron in `gAttunedGods`. Set `gPlayer.imbues[id] = patron`.
- **Level-up screen** `gWildShowStatPick()` (~11716): per-skill-card imbue affordance (shows the attuned-patron glyph; free) — picking imbues the skill; + the Favor-priced reroll button. Patron portrait data already wired (`GOD_DATA` ~11813).
- **Retire** `gImbueAllowance` (~13006) / `gShrineHasUnclaimed` (~13011) level-gating, or repurpose the shrine glow to "you can afford a new patron."
- **MP note:** `gFavor`, `gAttunedGods`, `gPlayer.imbues` are per-player run state; ensure Favor orbs/drops are host-authoritative like other pickups.

**Size:** multi-session. Spine (Favor var + orb drop + HUD + attunement cost on patron-select + free attuned imbues + level-up imbue affordance + Favor-reroll) is ~1 session — the imbue machinery and orb/pickup patterns exist, and this *removes* a gate rather than adding one. **New art:** a Favor orb sprite + a small Favor HUD glyph; reuse god glyphs for the imbue affordance.

**Balance:** keep Favor **rare** — attuning to a second god is a build-defining investment; too-generous drops make multi-god the default and collapse the gradient. Tune drop rate down until breadth feels *chosen*. Ties to the slice: imbues/breadth are a power lever, so Favor drop rate is part of "does the kit out-scale the curve."

---

## Open calls / notes

1. **Favor mechanics are still provisional** — Josh may revisit. This model is the current direction; build it so the patron-cost and drop-rate are easy to retune.
2. **Onboarding gate:** patron-gated (default) vs. a soft "first imbue at level 5" beat — minor, decide in playtest.
3. **Reroll on Favor** (default) vs. free/charge-based — flag above.
4. **Respec** (re-imbue a skill to a different attuned god) — defer; one imbue per skill for now.
5. **Run-loop reconciliation:** imbue *application* lives at the level-up screen; the shrine = **patron attunement / reactivation** (not a per-imbue pilgrimage). Reflected in [`../WORLDBUILDING_CONCEPTS.md`](../WORLDBUILDING_CONCEPTS.md).
6. **Dependency:** Favor's breadth cost only *matters* once a 2nd god imbues (Boreas) — but the whole system is **buildable & testable now with Cilia** (first patron free, free attuned imbues, Favor accrues for the eventual 2nd god, rerolls).

**Recommendation:** build the Favor spine as a fast-follow to the card-draft Core. Single currency, single job (price of a new patron), depth-free / breadth-paid.
