# Spec — Card-Draft Level-Up System

**Status:** `approved` 2026-06-06 · the progression half of the vertical slice ([`../ROADMAP.md`](../ROADMAP.md) → *Now*).
**Owner handoff:** PM → engineering. The engineer owns the *how* per [`agents/engineer/engineer.md`](agents/engineer/engineer.md); this is the *what/why* with enough detail to build.
**Pillar:** mastery (earned, legible power) · build-craft depth · game feel (the level-up *moment*).

**One-liner:** every level-up pauses into a **draw of 3 randomly-rolled cards; pick one**. Cards improve a **passive stat**, the warrior's **passive skill (Grit)**, or an **active skill** — each rolled at one of four rarities (**Normal / Rare / Epic / Legendary**) that scale its magnitude. Replaces STR/DEX/INT entirely.

**Why now:** the slice asks "does the kit scale fairly vs. the Nightfall siege curve?" — *this system delivers that scaling*. STR/DEX/INT is a pre-solvable allocation screen with no drama; a rarity draft is the genre-correct roguelite loop (Hades/VS) and makes every level a decision with a spike of excitement.

**Player experience:** ding a level → world pauses → three cards fan out. A common +6% damage, a blue (Rare) Whirlwind upgrade, and — gold border, screen-pop — a **Legendary** "Leap: +32 damage, +24px radius." You feel the pull of the gold card (a big magnitude spike) vs. the safe stat, pick, watch it flare into your build, and you're back in the fight. Over a run a bare warrior becomes a specific, lucky, *yours* build.

> **Design boundary (Josh, 2026-06-06): cards are MAGNITUDE, not transformation.** Every rarity of a card does the *same thing*, just bigger — a Legendary skill card simply boosts its stat(s) more than a lower rarity (per the ×tier multiplier). Cards never change *how* a skill behaves. The **transformative milestones for skills are the patron-god imbues** (the shrine run-loop — see `gIsImbued` / [`WORLDBUILDING_CONCEPTS.md`](../WORLDBUILDING_CONCEPTS.md)). This supersedes every "transformative card" mention below.

---

## Rarity tiers — the controlled randomness

Core balance trick: **randomize *which* card and *what tier* — never unbounded magnitude.** A card's effect = base value × tier multiplier. You can't roll a 10×, only a better-tier version of a known card.

| Rarity | Color | Base draw odds | Magnitude × |
|---|---|---|---|
| **Normal** | white/grey | 64% | ×1.0 |
| **Rare** | blue | 26% | ×1.7 |
| **Epic** | purple | 8% | ×2.6 |
| **Legendary** | gold | 2% | ×4.0 |

- **Odds scale with the curve (the key tuning lever):** the table shifts toward higher rarities by **night number / level**, so kit power tracks the rising siege. This is *the* dial that keeps the slice fair — tune it, not the base kit. *(Stretch: a "Luck" passive card nudges odds.)*
- Each of the 3 cards rolls its rarity **independently**.

---

## Card categories & example pool

*Values shown at **Normal**; ×tier scales them. Tables are live-tune starting points.*

**A — Passive stats** (absorb everything STR/DEX/INT did):
+5% damage · +6% move speed · +12 max HP · +5% attack speed · −4% cooldowns · +3% lifesteal · +0.4 HP/s regen · +12 max MP / +0.3 MP/s · +12% XP gain · +pickup range.

**B — Grit (warrior passive skill)** — current base: +20 shield/trigger, 20% maxHP cap, 3s duration, 5-hit streak:
+6 shield/trigger · +4% shield cap · +0.5s duration · −1 streak to trigger (5→4→3, floored). Higher rarities scale these numbers up (×tier) — no transformative Grit card (a Legendary Grit is just a bigger shield/cap/duration roll).

**C — Active skill upgrades** (one card targets one of swing / whirlwind / leap / dash / heavy):
+damage · +radius/range · −cooldown · −MP cost (all ×tier). Higher rarities just roll **bigger numbers** — there are no transformative skill cards (a Legendary is a large stat spike, not a behavior change). Skill *transformation* is the patron-god imbues' job (see Design boundary above), keeping the two systems cleanly separated.

---

## Draw rules

- **3 cards, pick 1** per level-up (reuse the existing confirm overlay).
- **Guaranteed-useful mix:** always ≥1 active-skill card and ≥1 passive/Grit card; 3rd wild — so neither axis starves.
- **De-dupe within an offer;** never offer a maxed item.
- **Reroll:** refreshes all 3; **priced in Favor** (escalating per reroll, resets each level) — see [`favor.md`](favor.md), which also adds a **rarity-upgrade** Favor sink on the card screen. Anti-brick tool — luck must not decide a run (mastery pillar).

## Guardrails — the "stays balanced" half

- **Per-active-skill cap** (~6 upgrade cards each) — no single-skill degeneracy.
- **Diminishing returns / soft cap** on stacked identical passives — no infinite-%damage snowball.
- **Legendary pool curated** and non-repeating within a run.

---

## Scope

**Core (must-ship):**
- Remove STR/DEX/INT + the scaling-grade subsystem.
- Four rarities (odds + multipliers).
- 3-card weighted draw with the guaranteed mix + de-dupe.
- Passive pool · Grit-upgrade pool · active-skill upgrade pool — all routed through **per-run / per-player state**.
- Reroll.
- Rarity styling on the existing overlay.

**Stretch (same arc, fast-follow):**
- Rarity-odds-by-night curve · a Luck stat · per-rarity frame art · banish/skip.

*(Transformative skill cards are **cut**, not deferred — cards are numbers-only at every rarity; skill transformation lives in the god imbues. See the Design boundary above.)*

---

## Touches *(grounded — engineer owns the how)*

- `gWildShowStatPick()` (~11716) — repurpose the existing card overlay into the 3-card draft.
- `WILD_STATS` (~11618) — **delete** (STR/DEX/INT) → passive-card pool.
- `WILD_ABILITIES` (~11640) — reuse as active-skill card defs, **re-routed off the global registry** (see landmine).
- `SKILL_SCALING` / `SCALING_BONUS_PER_POINT` / `wildStr|Dex|Int*` helpers (~11561–11602) — **delete** (dead once stats go).
- Grit: `GRIT_SHIELD / GRIT_DURATION / GRIT_CAP_PCT / GRIT_ATK_STREAK` (~4413), `gGritGain` / `gGritCap` — make **per-run-modifiable** (player-state overrides, not consts).
- Level-up trigger (`wildLevel++` ~11541); run-reset (~12162 / ~12179) — reset per-run card state each run.
- Overlay DOM/CSS (`#g-stat-pick`, `.stat-card`, `sc-*`) — rarity borders/glow + a reroll button.

**⚠️ Landmine (load-bearing for balance + multiplayer):** active-skill upgrades today mutate `WeaponRegistry.sword` **globally** (`sw.wwDamage += 5` ~11670) — leaks across runs and, in MP, **one player's cards buff everyone**. All card effects must write to a **per-run, per-player modifier object**, read at use-time. Design this in from the start.

**Size:** multi-session; the spine (rarities + weighted draw + three pools + per-run state + reroll) is ~1 solid session because the overlay + data model already exist. **New art:** none for Core (rarity = border/glow color, reuse glyph icons); per-rarity frames are stretch.

**Balance:** all tables are live-tune starting points. **Hold the Cilia kit's base numbers fixed; tune the card economy** (rarity odds-by-night + magnitudes) so power tracks the siege — that's what the slice measures. More enemies → faster XP → faster cards → power keeps pace; tune XP/level pacing alongside the roster.

---

## Open calls

1. **`skillPoints` reconciliation — RESOLVED (Josh, 2026-06-06): cards own skill *power upgrades*; skill *unlocks* stay as level-gates (auto-unlock at set levels); the separate MOBA `skillPoints` currency (Ctrl+click toolbar, ~3118 / grant ~11801) retires.** Toolbar UX barely changes. *(Engineer: confirm no other system reads `skillPoints` before removing.)*
2. **Per-run state migration** off `WeaponRegistry` — non-negotiable for correctness/MP (see landmine).
3. **Transformative cards — RESOLVED (Josh, 2026-06-06): cut entirely.** Cards are magnitude-only at every rarity (Legendary = a bigger stat roll, not a behavior change). Skill transformation is owned by the patron-god imbues. This removes the spec's largest design-time sink — Core is now purely the numeric card economy.
4. **Cards ≠ imbues — load-bearing now.** Cards tune within-run numbers (magnitude); the god *imbues* (shrine run-loop, already shipping — `gIsImbued`; see [`../WORLDBUILDING_CONCEPTS.md`](../WORLDBUILDING_CONCEPTS.md)) own *identity / behavior change*. With transformative cards cut, this is the clean split between the two systems — keep the pools from colliding.

**Recommendation:** ship **Core** now (numbers-only — no transformatives to defer); odds-by-night curve as fast-follow stretch.
