# Spec — Level-Up Card Pool (consolidated)

**Status:** approved (Josh 2026-06-12). Consolidate the draft from ~33 cards → ~23, **smaller and more
focused** — collapse the per-skill stat sprawl into broad **character stats** + one **Mastery** card per active
skill. · **Owner:** PM (design) → Engineer (rebuild). · **Pillar:** build-craft depth (every pick a real build
choice) + game feel (a legible draft).

---

## Why

The old pool split the *same verb* (damage / reach / speed / cooldown) across five skills (15 skill cards) plus
paired passives (crit / crit-dmg) — so a draft of 3 offered cards rarely felt build-defining. Consolidation makes
**each card move the needle**: broad character stats that always matter, and one bundled Mastery card per active
skill (you commit to the *skill*, not micro-pick its radius).

**Two future hooks Josh flagged (design-ahead, not now):** Mastery cards **may get evolutions** later (a deep
Whirlwind Mastery forks into a variant); **Strength** (and likely Dexterity) **may graduate into major character
stats** (STR/DEX-style) governing more than the melee kit. Build the consolidation so these are additive later.

---

## The consolidated pool (~23)

### A · Character stats — broad, draft anytime (13)
| Card | Effect | Replaces / merges |
|---|---|---|
| **Bloodlust** | +% Damage (ALL — skills, god skills, melee) | unchanged |
| **Strength** ⚔ | +% **melee attack damage** (swing **&** heavy) | **Swing: Bite (`sw-dmg`) + Heavy: Devastation (`hv-dmg`)** — *"basically attack damage; may become a major character stat later" (Josh)* |
| **Ferocity** ✷ | **+crit chance & +crit damage** | **Precision (`crit`) + Savagery (`critdmg`)** |
| **Dexterity** ⚡ | +% **attack speed** (swing rate + heavy charge) | the Attack-Speed stat (renamed from "Frenzy") — **replaces Swing: Tempo (`sw-spd`) + Heavy: Quickdraw (`hv-chg`)** |
| **Reach** ↔ | +reach to **swing & heavy** | **Swing: Reach (`sw-reach`) + Heavy: Reach (`hv-rad`)** |
| Swiftness ⚡ | +% Move Speed | unchanged |
| Alacrity ↺ | −% Cooldowns | unchanged |
| Vitality ❤ | +Max HP | unchanged |
| Regeneration ✚ | +HP/s | unchanged |
| Arcane Vessel ✦ | +Max MP | unchanged |
| Clarity ❖ | +MP/s | unchanged |
| Magnetism ◎ | +Pickup Range | unchanged |
| Wisdom ★ | +% XP Gain | unchanged |

> The basic melee attacks (swing + heavy) are now governed **entirely by character stats** — Strength (dmg),
> Reach (range), Dexterity (speed). No more swing/heavy card category. Clean.

### B · Skill Mastery — one card per active skill, gated on unlock (3)
Each is **one card** whose apply() advances **several** of that skill's `skillMods` per pick (the rank-aware
multi-mod apply pattern, like the imbue rank-up card). You commit to the skill; the card carries its whole
improvement bundle.
| Card | Bundles (per pick) | Merges |
|---|---|---|
| **Whirlwind Mastery** | +dmg, +radius, −cooldown | `ww-dmg` Edge + `ww-rad` Reach + `ww-cd` Rhythm |
| **Leap Mastery** | +dmg, +radius, +range, −cooldown | `leap-dmg` Force + `leap-rad` Impact + `leap-rng` Bound + `leap-cd` Tempo |
| **Dash Mastery** | +distance, −cooldown | `dash-dist` Momentum + `dash-cd` Recovery |

### C · Grit (4) — unchanged
`grit-shield` Bulwark · `grit-cap` Resolve · `grit-dur` Endurance · `grit-streak` Instinct. Already a focused,
gated set — leave as-is.

### D · Patron / Cilia (3) — unchanged
`cil-conflag` Conflagration *(repurposed to +explosion radius & chain, see god-stat-identities.md)* ·
`cil-linger` Lingering Flame · `cil-searing` Searing Heat. God-gated identity set — leave as-is.

---

## Merge mapping (engineer — what folds where)

| Old card(s) | → New | Notes |
|---|---|---|
| `crit` Precision + `critdmg` Savagery | **Ferocity** | one card writes BOTH `wildBuffs.critChance` + `critDamage` |
| `sw-dmg` Bite + `hv-dmg` Devastation | **Strength** | one card → +% dmg to swing **and** heavy (a shared `meleeDmgPct` read by both `gDoSwingAt` + `gDoHeavyAtk`, stacking on Bloodlust's global `damagePct`). Frame as a `wildBuffs` character stat so it can grow into a major stat later. |
| `sw-reach` + `hv-rad` | **Reach** | one card writes both the swing-reach mod + `heavyLen` |
| `sw-spd` Tempo + `hv-chg` Quickdraw | **Dexterity** | = the Attack-Speed stat (`wildBuffs.attackSpeed`), which already folds into `pSkillSpeed` for `swingCd` + `heavyMaxWindup`. **Rename the in-flight "Frenzy" card → "Dexterity"** and drop these two skill cards. |
| `ww-dmg` + `ww-rad` + `ww-cd` | **Whirlwind Mastery** | one card, multi-mod apply (advance `wwDamage`/`wwRadius`/`wwCooldown` per pick) |
| `leap-dmg` + `leap-rad` + `leap-rng` + `leap-cd` | **Leap Mastery** | multi-mod apply (`leapDamage`/`leapRadius`/`leapRange`/`leapCooldown`) |
| `dash-cd` + `dash-dist` | **Dash Mastery** | multi-mod apply (`dashDistance`/`evasionCooldown`) |

**Removed entirely:** the 15-card `cat:'skill'` block collapses to the 3 Mastery cards + the swing/heavy stats
folding up into Strength/Reach/Dexterity. **No card writes the old per-skill ids that vanished** — confirm nothing
else reads them.

---

## Balance (starting values — tune by playtest)

Bundled cards give *roughly the sum* of the old per-pick values, trimmed slightly since one slot now buys several
stats (the point is impact-per-pick, not strict parity):
- **Strength** +8% melee dmg/pick (was Bite +8% swing / Devastation +8% heavy — now both in one).
- **Ferocity** +3% crit chance & +15% crit dmg/pick (standalones were +4% / +20% — trim for the 2-in-1).
- **Reach** +8 reach to swing & heavy/pick.
- **Dexterity** +7% attack speed/pick (per the Attack-Speed task).
- **Whirlwind Mastery** +5 dmg, +4px radius, −0.3s cd/pick · **Leap Mastery** +8 dmg, +8px radius, +16px range,
  −0.5s cd/pick · **Dash Mastery** +14px distance, −0.2s cd/pick.
- **Uncapped** (pool-wide caps already removed); existing floors (`SKILL_STAT_FLOOR`, crit 0.75 clamp, cd 99%
  clamp) still govern degenerate states.

**Boundaries:** Bloodlust (all damage) and Strength (melee only) intentionally coexist — Bloodlust is the
generalist, Strength the melee specialist that also buffs god-skill-independent melee. Keep Mastery dmg distinct
from Strength (Mastery = the *skill's* own damage mod; Strength = swing/heavy only). Patron/Grit untouched.

## Engineering grounding

- All cards live in the `cat:'passive'`/`cat:'skill'`/`cat:'grit'` arrays (~`index.html:14013–14092`). Passive →
  `wildBuffs` via the obelisk pipeline; skill → `skillMods` via `pSkillStat`. Mastery cards use the **multi-mod
  rank-aware apply** (mirror the imbue rank-up card `cil-dof` apply at `:14233`, which pours a step-set into mods).
- New `wildBuffs` keys: `meleeDmgPct` (Strength). Ferocity reuses `critChance`/`critDamage`; Dexterity reuses
  `attackSpeed`; Reach reuses the swing-reach + `heavyLen` mods.
- **Sim/MP:** these ride the existing `cardPicks`/`gDrawCards` plumbing — only the card ids change. Verify the
  `_paintDraft` icon/`iconKey` mapping (levelup-screen.md) covers the new ids; update `CARD_ICON_ART` keys.
- **Verify:** `node --check`; draft each new card → confirm Strength buffs both swing+heavy, Reach extends both,
  Ferocity grants both crit stats, each Mastery advances its bundle; no dangling reads of the removed ids.
