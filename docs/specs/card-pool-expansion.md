# Spec — Card Pool Expansion (Swing/Heavy/Dash scaling · Crit · sustain rebalance)

**Status:** `approved` 2026-06-08 · fills the card-draft's parked "deeper card content" stretch ([`../ROADMAP.md`](../ROADMAP.md) → *Now*). Builds directly on the shipped card-draft Core ([`card-draft.md`](card-draft.md)).
**Owner handoff:** PM → engineering. Engineer owns the *how* per [`agents/engineer/engineer.md`](agents/engineer/engineer.md).
**Pillar:** build-craft depth (more build axes) · game feel (crit juice) · mastery (the *whole* kit scales, not just whirlwind/leap).

**One-liner:** give **swing, heavy, and dash** their own upgrade cards, add **crit chance / crit damage** as real character stats (with cards), and rebalance sustain (nerf flat HP regen).

**Why now:** Today only whirlwind & leap have skill cards — **swing and heavy, the level-1 core of the kit, can't be upgraded at all**, and dash has no card either. That breaks the slice's own criterion ("each skill has a situation where it's the right answer") because half the kit never gets better over a run. Crit adds a second damage axis (chance × magnitude) so the draft is a real build decision, not "+5% damage again" — and crit numbers are pure feel.

**Player experience:** a swing build stacks **Swing: Tempo** into a blender; a heavy build rolls **Heavy: Quickdraw** until the charged nuke is near-instant; a crit build gambles **Precision + Savagery** and watches a gold **2,400** crack out of a goblin in a fat yellow number. Distinct, *yours* builds — from cards that stay pure magnitude.

> **Design boundary (carried from [`card-draft.md`](card-draft.md)): cards are MAGNITUDE, not transformation.** Crit is a numeric damage stat; every new card is "the same thing, bigger" by rarity. Skill *behavior* change stays owned by the patron-god imbues.

---

## 1. New cards

*Values at **Normal**; ×rarity-tier scales them (×1.0 / 1.7 / 2.6 / 4.0). All tables are live-tune starting points.*

### A — Active-skill cards (`cat:'skill'`) — extend `SKILL_CARDS` (~11792)

| id | Name | Skill | Effect (Normal) | Cap | `req` |
|---|---|---|---|---|---|
| `sw-reach` | Swing: Reach | swing | +4 swing reach (arc size) | 6 | always (lvl-1 kit) |
| `sw-spd` | Swing: Tempo | swing | **+6% attack speed** | 6 | always |
| `hv-chg` | Heavy: Quickdraw | heavy | **+8% charge speed** | 5 | always |
| `hv-rad` | Heavy: Devastation | heavy | +6 blast radius | 6 | always |
| `dash-cd` | Dash: Recovery | dash | −0.2s cooldown | 5 | `gIsSkillUnlocked('dash')` |
| `dash-dist` | Dash: Momentum | dash | +14 dash distance | 5 | `gIsSkillUnlocked('dash')` |

### B — Crit passive cards (`cat:'passive'`) — extend `PASSIVE_CARDS` (~11768)

| id | Name | Effect (Normal) | Cap | Guardrail |
|---|---|---|---|---|
| `crit` | Precision | +4% crit chance | 6 | **critChance hard-cap 75%** |
| `critdmg` | Savagery | +20% crit damage | 6 | base crit ×1.5 |

---

## 2. Crit system (net-new — crit does not exist today)

- **State:** `wildBuffs.critChance` (0–0.75) and `wildBuffs.critDamage` (added to a base crit multiplier of **×1.5**). Both route through `wildBuffs` like every other passive; reset per run.
- **The roll lives in the attacking caller** (player swing / heavy / whirlwind / leap impact): on a confirmed direct hit, `Math.random() < critChance` → `dmg *= (1.5 + critDamage)` and set a `crit` flag.
- **Hook:** pass the final damage + `opts.crit:true` into **`gDealEnemyDamage(e, dmg, opts)` (~4976)** — the existing MP-correct helper (host-authoritative, client-reports). `opts` already carries `burn`/`kbMag`; add `crit` the same way. **Do the crit roll on the host's authoritative path** so MP clients don't desync their own crit RNG.
- **Direct hits only (open call #1, recommended resolution):** crit applies to melee + skill *impact* damage, **not** to DoT/aura ticks (Cilia's fire burn, fire-ring ticks). Per-tick crit is a balance hole and a feel-spam mess. One rule at the hit site.
- **Juice (pillar 1 — don't skip):** crit damage numbers render **bigger + yellow/gold**. The floating-number system already exists; `opts.crit` carries through to its styling. This is half the reason crit is worth building.
- **Char screen (~10504):** surface Crit Chance % and Crit Damage % alongside the existing stat block.

---

## 3. Prerequisite — migrate swing/heavy/dash stats to per-player mods (LOAD-BEARING)

**⚠️ Same landmine the card-draft spec called out.** Whirlwind & leap stats were migrated to per-player `skillMods` via `pSkillStat(player,key)` in card-draft Stage 1 — **swing, heavy, and dash were not.** They still read their base values globally off `WeaponRegistry.sword`. Their cards CANNOT be wired until those stats read through `pSkillStat`, or the old bug returns: **upgrades leak across runs and, in MP, one player's cards buff everyone.**

- Migrate the swing (reach, attack-speed/interval), heavy (charge time, blast radius), and dash (cooldown, distance) reads to `pSkillStat` (mirror the Stage-1 migration exactly — see CHANGELOG "per-player skill stats").
- `pSkillStat` already floors cooldown/MP stats so reductions can't hit zero — extend the same flooring to the **swing interval**, **heavy charge time**, and **dash cooldown** (see guardrails).
- Add `dash` (and `swing`/`heavy` as needed) to `gIsSkillUnlocked()` (~11822) — currently only maps `ww`/`leap`. Dash unlocks at level 2.

---

## 4. Sustain rebalance — HP regen nerf

The `hpregen` card (Regeneration, ~11777) is too strong: flat **+0.4 HP/s base, cap 8** = always-on, unconditional sustain that trivializes chip damage and the day-lull.

- **`base 0.4 → 0.25`** and **`cap 8 → 5`** (max base ≈ 1.25 HP/s before rarity, down from 3.2).
- No other change; vampirism/lifesteal is **cut for now** (Josh, 2026-06-08).

---

## 5. Terminology rule (Josh, 2026-06-08)

**No "frames" in any player-facing card text.**
- Heavy charge card shows **"+X% charge speed"** (internally a charge-rate multiplier: `chargeTime = baseChargeFrames / (1 + Σcard%/100)`, capped ≈2.5× → ~40% min charge).
- Swing attack-speed card shows **"+X% attack speed"** (same multiplier form on the swing interval, floored).
- Cooldown cards (whirlwind/leap/dash) keep the **existing seconds display** (`−${(v/60).toFixed(1)}s`) — already not "frames," no change.

---

## 6. Touches *(grounded — engineer owns the how)*

- `SKILL_CARDS` (~11792) — add swing/heavy/dash entries.
- `PASSIVE_CARDS` (~11768) — add `crit` + `critdmg`.
- `pSkillStat` + the swing/heavy/dash stat reads (off `WeaponRegistry.sword`) — **migrate first** (§3).
- `gDealEnemyDamage` (~4976) — accept `opts.crit`; confirm crit-bearing sources route through it (raw `hp -= dmg` sites at 2854/4052/5098/8325 bypass it).
- Floating damage-number render — crit styling (bigger/gold).
- Char screen (~10504) — crit chance/damage rows.
- `gIsSkillUnlocked` (~11822) — add `dash`.
- Run-reset — crit state already lives in `wildBuffs` (reset for free with the existing per-run reset).

**Size:** multi-session. Crit (stat + roll + hook + render) ≈ 1 session; swing/heavy/dash migration + their cards ≈ 1 session; regen nerf trivial. **New art:** none (crit number = color/scale; cards reuse glyph icons).

**Build order:** (1) swing/heavy/dash migration → their cards + regen nerf — closes the kit-scaling gap (the slice value); (2) crit as its own mini-feature (the new build axis + the juice).

---

## 7. Open calls

1. **Crit on DoT/aura ticks? — recommend NO** (direct hits only). Confirm at the hit site.
2. **Crit RNG location** — roll on the **host authoritative path** to keep MP deterministic; clients render `opts.crit` styling from the reported hit.
3. **Swing "reach" representation** — px vs. a scale-%, depending on how the swing arc hitbox is defined. Engineer picks; display stays "+N reach" or "+N%".

**Balance:** hold the Cilia kit's base numbers fixed; these cards + crit are the new tuning surface. Crit chance hard-capped (75%) and crit damage + flat %damage held by the existing per-card caps + diminishing returns so the multiplicative stack can't snowball. Tune card bases + the crit cap in the slice playtest.
