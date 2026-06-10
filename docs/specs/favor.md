# Spec — Favor (the world currency)

**Status:** `approved` direction 2026-06-08 (Josh) · **supersedes the Favor mechanics in [`favor-imbue.md`](favor-imbue.md)** (see *Reconciliation* §7).
**Owner handoff:** PM → engineering. Engineer owns the *how* per [`agents/engineer/engineer.md`](agents/engineer/engineer.md).
**Pillar:** build-craft depth (a player-controlled power lever) · game feel (a rare drop + a juicy spend) · mastery (spend decisions, not just draws).
**Reads with:** [`card-draft.md`](card-draft.md) (cards = magnitude, rarity tiers) · [`card-pool-expansion.md`](card-pool-expansion.md) (the active card-economy build this layers onto).

**One-liner:** **Favor** is the **gold-coin currency of the world** — it drops rarely from enemies (scaled by type) and from chests. After you commit to a **patron god at level 5**, Favor is spent at the level-up card screen to **reroll** your draw and to **upgrade a card's rarity**. It's a rare resource that lets you *buy your way up the power curve* on the draws that matter.

> **Why this model (supersedes the "price of a new patron" version):** the earlier spec made Favor gate multi-god breadth — but that only *matters* once a 2nd god (Boreas) ships, so it can't be felt in the slice. Tying Favor to the **card economy** (reroll + rarity-upgrade) makes it a real, testable lever **right now with only Cilia**, and it plugs straight into the rarity system the card-draft already shipped. One currency, two legible sinks, immediate slice value.

---

## 1. The currency

- **`gFavor`** — a **run-scoped** integer (recommended; see open call #1), reset each run beside the card state (`~12400`). The "gold coins" of the world.
- **HUD:** a Favor counter with a gold-coin glyph near the level/XP readout (`~g-xp-wrap`).
- **MP:** per-player run state; drops are **host-authoritative** like XP orbs.
- **Designed to extend:** Favor is the world's money — Core spends are reroll + rarity-upgrade, but the var/HUD should be built so later sinks (a town shop for the dormant `gEquipment` slots, etc.) can read the same wallet without rework.

---

## 2. Earning Favor (rare, scaled)

### From enemies — scaled by type
A low drop chance, weighted up for tougher enemies, surfaced as a **Favor coin pickup** (mirror `gXPOrbs` → a `gFavorOrbs[]`, gold/amber, auto-collected within pickup range → the **pickup-range passive card** synergises). Rolled in `gKillEnemy` (`~2828`) off a per-`EntityDef` value.

| Enemy | Drop chance | Amount | Notes |
|---|---|---|---|
| Goblin | ~4% | 1 | the floor — most kills drop nothing |
| Archer / Bomber | ~6% | 1 | |
| Warrior | ~12% | 1 | tougher → more likely |
| Shaman | ~15% | 1–2 | |
| **Goblin King (boss)** | **100%** | **8–12** | boss kills are a Favor windfall |

Implement as a per-`EntityDef` `favor:{chance, min, max}` (or a single expected-value field) so the table is one tuning surface. *(Future elites slot in here trivially.)*

### From chests
Each **existing village chest** (`~11328`, looted at `~12917`) drops **3–6 Favor** on open — replace/augment the current `CHEST!` flavor pop with the coin payout. Chests become the reliable Favor source; enemy drops are the trickle.

**Master lever:** the enemy drop rate + chest amount set the whole economy. Keep Favor **rare** — every spend should feel like a real choice, not pocket change.

---

## 3. The spend gate — commit to a patron at level 5

Favor **accrues from level 1**, but **can't be spent until you've selected your patron god at level 5** (the existing first-patron / shrine-imbue beat). Until then the spend buttons are locked with a "Choose a patron (Lv 5)" hint.

- Anchors the currency to the patron-commitment moment and gives a reason to reach level 5.
- Recommended gate = **"first patron selected"** (the real event), not a hard `level >= 5` check — they coincide today but the event is the honest condition.

---

## 4. The two sinks (both on the level-up card screen)

### Sink A — Reroll (replaces the free-charge system)
- Re-draws all 3 cards (reuse `gWildReroll()` `~11962`).
- **Now Favor-priced**, escalating **within a single level-up**, reset each level: **3 / 5 / 8 …** Favor.
- **Retire the free-charge economy:** the `p.rerolls` counter + the `+1 every 5 levels` grant (`~12038`) are removed; reroll is pure Favor. *(Open call #3: keep **1 free** reroll per level then Favor, if onboarding feels too tight.)*

### Sink B — Rarity upgrade (the new marquee spend)
- On the card screen, spend Favor to **bump one shown card up one rarity tier** (Common→Rare→Epic→Legendary). The card's magnitude **recomputes** at the new tier (rarity is pure ×multiplier — [`card-draft.md`](card-draft.md)).
- **Cost by target tier** (escalating): **→Rare 4 · →Epic 8 · →Legendary 16** Favor.
- **Chains:** you may upgrade the same card multiple steps, paying each (Common→Rare→Epic = 4+8). **Rerolling a card clears its upgrades.** Can't exceed Legendary.
- One upgrade action targets one of the three cards; UI = a small "▲ upgrade (cost)" affordance on each card, lit only if affordable.
- **Synergy with odds-by-night:** the night-curve passively raises *base* rarity odds; rarity-upgrade is the *active, player-bought* version of the same lever — together they're how a player keeps power tracking the siege. Two dials, one feeding the other.

---

## 5. Numbers (live-tune starting points)

- **Enemy drops:** per table §2 (grunt floor ~4% → 1; boss guaranteed 8–12).
- **Chest:** 3–6 Favor each.
- **Reroll:** 3 / 5 / 8 (within a level, resets each level).
- **Rarity upgrade:** →Rare 4 · →Epic 8 · →Legendary 16.
- **Economy sanity (~level-20 run):** ~15–30 Favor from kills + ~15–25 from chests ≈ **30–55 Favor/run** → funds a handful of rerolls, ~2–3 Legendary upgrades, or a mix. A real budget, never spam. Tune drop rate/chest amount to taste.

---

## 6. Touches *(grounded — engineer owns the how)*

- **New `gFavor`** run var; reset in the run-reset block (`~12400`, beside the card-state reset).
- **Favor coin drop:** mirror `gXPOrbs` → `gFavorOrbs[]`; spawn in `gKillEnemy` (`~2828`) off a per-`EntityDef` `favor` field; collect within pickup range; host-authoritative.
- **Chest payout:** village chest loot (`~12917`) → grant 3–6 Favor on open (replace the `CHEST!` pop).
- **HUD:** Favor counter + coin glyph near `~g-xp-wrap`.
- **Spend gate:** read "has first patron" (shrine patron-select state); lock spend UI until then.
- **Reroll:** repoint `gWildReroll()` (`~11962`) cost from `p.rerolls` → escalating `gFavor`; remove the `+1/5-levels` charge grant (`~12038`) and the `rerolls` field (`~3068`/`~12400`).
- **Rarity upgrade:** new per-card "▲ upgrade" control in `gWildShowStatPick()` (`~11716`/card-draft draw block ~11930); on click, charge Favor, bump the card's rolled rarity, recompute its value via the existing `_cardValue(card, mult)` (`~11828`) path, re-render the card frame/glow.
- **EntityDefs:** add the `favor` drop field per enemy (`§5`).

**Size:** multi-session; **spine ~1 session** — the currency var, the XP-orb-clone drop, the chest hook, the HUD, and the two card-screen spends are all small and sit on existing systems (orbs, chests, the rarity/`_cardValue` path, the reroll button). **New art:** a Favor coin sprite + a small HUD coin glyph (reuse the gold rarity color for the upgrade UI).

**Balance:** Favor rarity is the master lever — too generous and rerolling-to-Legendary trivializes the draft; too stingy and the system is invisible. Tie tuning to the slice: rarity-upgrade is a power lever, so its cost + drop rate are part of "does the kit out-scale the curve." Hold card base numbers fixed; tune the Favor economy around them.

---

## 7. Reconciliation — what this changes vs. `favor-imbue.md`

The approved [`favor-imbue.md`](favor-imbue.md) gave Favor a *different* single job — **the price of a new (additional) patron**, expressing a depth-free / breadth-paid build gradient. **This spec replaces that job.** Favor is now the **card-economy currency**; it does **not** price multi-god breadth.

**Open consequence (call #2):** how is multi-god **breadth** gated when Boreas lands, if not by Favor? Recommended: **decouple it from Favor and park it** — revisit breadth-gating when the 2nd god is actually on the table (it could be free/level-paced, or a separate mechanic). This keeps Favor single-purpose and shippable now. The imbue-*application* notes in `favor-imbue.md` (level-up imbue affordance, attuned-gating, retiring `gImbueAllowance`) remain useful reference for the imbue system independent of Favor.

---

## 8. Open calls

1. **Run-scoped vs. persistent.** Recommend **run-scoped now** (matches per-run reset + slice simplicity); build the wallet so a **persistent meta-currency** can wrap it later (the Later big-rock meta-progression — "gold of the world" invites it).
2. **Breadth-gating after the pivot** — park it, decouple from Favor (§7). Recommend.
3. **Reroll onboarding** — fully Favor-priced (recommend) vs. 1 free reroll/level then Favor.
4. **Rarity-upgrade chaining** — allow multi-step paying each (recommend) vs. one bump per card per draft.
5. **Spend gate** — "first patron selected" event (recommend) vs. hard `level >= 5`.
6. **Future sinks** — Favor → the dormant `gEquipment` shop is the obvious next sink; out of scope now, but the reason to call Favor "the world currency" rather than "reroll tokens."

**Recommendation:** build as a **fast-follow to Card Pool Expansion** (it layers on the same rarity/card-screen code). Single currency, two card-economy sinks, fully testable with Cilia today — no Boreas dependency. Gate it behind the slice like everything else, but it's the cheapest, most slice-relevant of the post-card-pool items.
