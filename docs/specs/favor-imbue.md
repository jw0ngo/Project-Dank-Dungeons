# Spec — Favor & the Imbue Economy

**Status:** `proposed` 2026-06-06 (fleshing Josh's directive) · the build-craft economy layer over the [card-draft](card-draft.md) + the existing imbue system.
**Pillar:** build-craft depth (the imbue gradient) · mastery (earned power) · game feel (a rare resource + a juicy spend).
**Reads with:** [`card-draft.md`](card-draft.md) (cards = magnitude) · [`../WORLDBUILDING_CONCEPTS.md`](../WORLDBUILDING_CONCEPTS.md) (Favor-gradient philosophy, run loop).

**One-liner:** **Favor** is a rare run-scoped currency that drops from kills and is the price of build-craft — spent to **imbue skills** with your patron god's power (the transformation layer) and to **reroll** the level-up cards. The first imbue (level 5) is free; everything after costs Favor.

---

## What Favor is

- A **rare run-scoped resource** (resets each run, like `wildLevel` — wilderness imbues already start fresh). Tracked as `gFavor`.
- **Drops from enemy kills at a low rate** (rare — most kills drop nothing). Surfaced as a **Favor orb** pickup (mirror `gXPOrbs`), auto-collected within pickup range — so the **pickup-range passive card** synergises.
- **Later:** special/elite enemies drop **guaranteed** Favor (1–3). Out of scope for the first build; the drop hook should make this trivial to add.
- It is the **shared pool** from the Favor-gradient design — finite, so you can't imbue everything; spending it on breadth (more imbues) vs. rerolls (better cards) vs. future depth is *the* build-craft tension.

## What Favor buys

1. **Imbuing a skill** — attach the **current patron's** power to one active skill (Cilia → fire kit, etc.). This is the **transformation** layer (cards never transform — see the card-draft design boundary). Imbuing is the build-moment.
   - **First imbue (at level 5) is FREE.** Guarantees every run tastes imbuing (onboarding beat).
   - **Each subsequent imbue costs Favor**, escalating (see numbers) so going *wide* gets pricier — the gradient, enforced by price.
2. **Rerolling the level-up cards** — refresh the 3-card hand for Favor; cost escalates within a single level-up, resets each level. (This **supersedes** the card-draft's earlier "start with ~1 reroll charge" — reroll is now Favor-priced, one currency.)
3. *(Future) Deepening an existing imbue* — the "narrow & deep" half of the gradient. Out of scope now; reserve Favor as the currency for it.

---

## Where imbuing happens — two touchpoints, one action

Imbuing is **one action** (`gPlayer.imbues[skillId] = patron`, respecting allowance + cost) exposed in two places:

- **The shrine (existing):** select/reactivate a patron (`gShrineSelectGod`), and the existing "Imbue a Skill" overlay can still claim imbues. Keep it — the shrine *must* be visited to choose a patron at all.
- **The level-up screen (NEW — the juicy one):** when skill cards are displayed, **spend Favor to "imbue" a displayed skill card** with the current patron. Picking that card then applies *both* its magnitude boost *and* the imbue. One screen, two systems married — cards bring the numbers, Favor brings the transformation.

**The patron is chosen at the shrine; imbues are applied at level-up.** You must have reactivated a patron (`gShrine.patron`) before the level-up screen offers imbuing — this keeps the shrine load-bearing (patron selection) while moving the *application* into the level-up flow, which removes most of the "trek back to the shrine for every imbue" friction.

### Level-up imbue UX

- Each **skill card** in the hand shows an **imbue affordance**: the patron's glyph + the Favor cost (or "FREE" for the level-5 first imbue), shown only if (a) a patron is selected, (b) the skill isn't already imbued, and (c) imbue allowance remains.
- Toggling imbue on a card marks it; **Favor is only spent on confirm** (when you actually pick that card). Imbuing a card you don't pick costs nothing.
- A **Reroll** button shows its current Favor cost.
- If no patron is selected: the imbue affordance is replaced by a quiet "Reactivate a shrine to channel a god" hint.

---

## How it layers on the existing imbue gate

The game already paces imbues: `gImbueAllowance()` = `min(floor(wildLevel/5), unlockedSkills)` — one claimable imbue per 5 levels. **Keep that as the *cadence* (when an imbue becomes claimable); Favor is the *price* of claiming it (after the first).**

- Level 5 → 1st imbue claimable → **free**.
- Level 10 → 2nd claimable → costs Favor. Level 15 → 3rd → more Favor. Etc.
- This is a deliberate **double lever**: allowance gates *when* (telegraphed build beats), Favor gates *how many you can afford* (the gradient). See open call #2 if we'd rather drop the allowance and let Favor alone pace it.

---

## Numbers (live-tune starting points)

- **Favor drop rate:** ~4% of normal kills → 1 Favor. (Elites later: guaranteed 1–3.)
- **Imbue cost:** 1st **free** · 2nd **4** · 3rd **6** · 4th **8** · 5th **10** Favor (escalating → wide is pricier).
- **Reroll cost (per level-up):** 1st **2** · 2nd **4** · 3rd **6** Favor, resets each level.
- **Sanity check:** a ~level-20 run earns roughly 15–25 Favor (tune via drop rate) → the free imbue + 2–3 paid imbues, *or* fewer imbues + several rerolls. The choice between breadth and consistency is the gradient. **Drop rate is the master lever.**

---

## Touches *(grounded — engineer owns the how)*

- **New `gFavor`** run var; reset in the run-reset block (~12162, beside `wildLevel = 1`).
- **Favor orb drop:** mirror `gXPOrbs` — a `gFavorOrbs[]`, spawned in `gKillEnemy` (~2828) on a drop roll; collect within pickup range; increment `gFavor`. Distinct color (violet/gold). HUD counter near the level/XP readout (~`g-xp-wrap` / ~11870).
- **Imbue apply:** reuse `gImbueSelectSkill` (~13069) logic — set `gPlayer.imbues[id] = (gShrine.patron||'cilia')`, respecting `gImbueAllowance()` (~13006) and now a **Favor charge**. Refactor so both the shrine overlay and the level-up screen call one shared `gClaimImbue(skillId, {free})` that handles allowance + cost.
- **Level-up screen** `gWildShowStatPick()` (~11716): add the per-skill-card imbue affordance + the reroll button + spend-on-confirm. Patron from `gShrine.patron`; portrait data already wired (`GOD_DATA` ~11813).
- **Shrine:** `gShrineSelectGod` (~13142), `gOpenImbueMenu`/`gRenderImbueCards` (~13015) — keep for patron selection; imbue overlay stays as the alt locus (now also charges Favor for non-first imbues).
- **MP note:** `gFavor` and `gPlayer.imbues` are per-player run state — fine; just ensure Favor orbs/drops are host-authoritative like other pickups.

**Size:** multi-session. Spine (Favor var + orb drop + HUD + level-up imbue affordance + Favor-reroll + shared `gClaimImbue`) is ~1 session because the imbue machinery and orb/pickup patterns already exist. **New art:** a Favor orb sprite + a Favor HUD glyph (small); reuse god glyphs for the imbue affordance.

**Balance:** Favor must be **genuinely rare** — each imbue is a transformation (big power spike), so a too-generous drop rate collapses the gradient (everyone imbues everything). Tune drop rate down until breadth feels *chosen*, not default. Ties to the slice: imbues are a power lever, so Favor drop rate is part of "does the kit out-scale the curve."

---

## Open calls (need Josh)

1. **Shrine vs level-up as the imbue locus.** *Recommend:* shrine = choose/reactivate patron; level-up = apply imbues for Favor; keep the shrine overlay as a secondary claim point. *(This is the main reconciliation — confirm.)*
2. **Double-gate (allowance + Favor) or Favor-only?** *Recommend:* keep the `floor(level/5)` allowance as telegraphed cadence + Favor as price. Alternative: drop the allowance, let escalating Favor cost pace breadth alone (simpler, but loses the "build beat every 5 levels" rhythm).
3. **Escalating imbue cost** (recommend — enforces the gradient) vs flat cost.
4. **Respec** (re-imbue a skill to a different god for Favor) — *defer;* one imbue per skill for now.
5. **Run-loop doc update:** moving imbue *application* to the level-up screen means the [`run loop`](../WORLDBUILDING_CONCEPTS.md) "pilgrimage every 5 levels to imbue" narrows to "shrine = patron selection / reactivation." Propagate once confirmed.
6. **Dependency:** only Cilia has imbue effects, so the economy is fully expressed once Boreas lands — but the **whole Favor system is buildable & testable now with Cilia** (free first imbue + paid second once a second skill is unlockable, + rerolls).

**Recommendation:** build the Favor spine (drop → orb → HUD → level-up imbue affordance + Favor-reroll, on a shared `gClaimImbue`) as a fast-follow to the card-draft Core. Confirm open calls #1 and #2 before the engineer starts.
