# Mana Economy & Skill Management — make mana a real resource

**Status:** design (PM, 2026-06-11, Josh-directed) — live source of truth for *Now* item 7.

**Pillar:** game feel (weighty combat — primary) · build-craft depth. Serves the standing **weighty-combat
directive** (a committed action must cost you other options) and adds an **active resource-management layer**
to the build.

---

## The problem (Josh, playtest 2026-06-11)

Mana is a non-issue today. The player casts skills over and over with little worry — there's no real economy.
We want players **running out of mana, especially early game**. And the new **auto-firing God Skills** (item 2)
cost *nothing* and run forever, so there's no decision in keeping them on.

**Three moves:**
1. **Rework class-skill mana costs + cooldowns** so the pool actually empties. *Benchmark (for now): 1 leap +
   ~3s of whirlwind should drain a fresh early-game pool to ~empty.*
2. **God Skills cost mana per second** while active (Burning Body ≈ **5 mp / 3s**, upgrades scale up).
3. **Toggle system** — bind owned auto-cast God Skills to **hotkeys 1–9 in acquisition order**; the player
   chooses which to keep active and manages mana against that choice.

The unifying idea: **one shared mana pool** funds *both* the class's manual kit *and* the god layer's sustained
auto-fire. Scarcity forces real choices — burst now vs. sustain an aura, which skills to leave running.

> **Deliberate divergence from pure VS (record this):** Vampire-Survivors auto-fire is free and automatic. By
> putting God Skills on a per-second mana drain + a manual toggle, we re-introduce the **agency** pure auto-fire
> removed, and we **unify** the god layer and the class kit under one resource. The god layer stays
> class-agnostic (the toggle/drain is generic), so this doesn't break the platform-portability of item 2.

---

## Current economy (grounded — `index.html`, 60 fps)

- **Pool:** `maxMp 100`, start `mp 100` (`:3312`, reset `:14579`). Derived max scales via `mpBonus`/cards (`:13386`).
- **Regen:** `mpRegen 0.15`/frame = **~9/s** passive (`:2478`); **pauses during whirlwind**, which drains instead (`:4219-4226`).
- **Class-skill costs** (`WeaponRegistry.sword`, `:2478-2482`; spent at `:3817/3840/3933/4059/4221`):

  | Skill | Cost (today) | Cooldown (today) |
  |---|---|---|
  | Swing | 0 (free) | `swingCd 60` = 1.0 s |
  | Dash (evasion) | `mpCostEvasion 15` | `evasionCooldown 80` = 1.33 s |
  | Heavy | `mpCostHeavy 25` (on release) | `heavyCooldown 90` = 1.5 s |
  | Leap | `mpCostLeap 35` | `leapCooldown 200` = 3.33 s |
  | Whirlwind | `mpCostWwTick 0.08`/frame = **4.8/s** drain while active | `wwCooldown 120` = 2.0 s |

- **God Skills:** auto-fire from `gUpdateGodSkills` (`:3719`) → `gTickBurningBody` (`:3736`). **No mana cost; no
  toggle.** Owned skills come from `gOwnedGodSkills(p)`; magnitudes via `gGodFireParam(p,id,key)` = base + rank mods.
- **Floors:** `SKILL_STAT_FLOOR` (`:2542`) floors cooldowns/costs so reduction cards can't zero them.

**Benchmark check (today):** leap 35 + (4.8 × 3) = **49.4 / 100** → ends at half. Needs ~2× the bite to empty.

---

## The rework

### Phase 1 — class-skill mana + cooldowns (the benchmark)

Keep the pool at **100** and **tighten costs** (rather than shrink the pool) — this preserves the value of the
existing mana-investment cards (`mpRegenAdd`, `mpBonus`/maxMp), which become the early→late "loosen the economy"
progression. Starting numbers (tune by feel):

| Skill | Cost now → **proposed** | Cooldown now → **proposed** | Rationale |
|---|---|---|---|
| Swing | 0 → **0** | 60f → **60f** | Stays the free filler / mana-neutral baseline. |
| Dash | 15 → **18** | 80f → **80f** | Small bump; mobility stays affordable. |
| Heavy | 25 → **30** | 90f → **90f** | Modest; heavy is already gated by its windup. |
| **Leap** | 35 → **45** | 200f → **150f** (2.5 s) | The big single commit. CD trimmed so **mana**, not CD, is the felt limiter. |
| **Whirlwind** | 4.8/s → **18/s** (`mpCostWwTick 0.30`) | 120f → **90f** (1.5 s) | The mana sink. ~3 s of spin is a serious chunk of the pool. |

- **Benchmark satisfied:** leap **45** + (18 × 3) = **99 ≈ empty** from 100. ✓
- **Regen unchanged at 9/s** for now — the *standing* pressure comes from Phase 2's god-skill drain layered on top.
- **Cooldown philosophy:** mana is now the **primary gate**; cooldowns are the **rhythm / anti-spam** gate, not
  the resource gate. Trim leap/WW CDs so that *when you can afford it* the kit feels fluid and **running dry** is
  what stops you — not a CD you're staring at with a full bar. Don't double-gate.
- **Floors:** add/confirm `mpCostWwTick`, `mpCostLeap` floors stay sane; `evasionCooldown`/`leapCooldown` already
  floored. The whirlwind auto-off at `mp ≤ 0` (`:4222`) is the model for starvation (see Phase 3).

### Phase 2 — God Skills cost mana per second (rank-scaled)

- **Per-second drain while active**, paid in `gTickBurningBody` / `gUpdateGodSkills` each frame:
  `p.mp -= gGodFireParam(p, id, 'mpCost') * dt` (dt in frames; `mpCost` expressed per-frame, e.g. `5/3s = 0.0278/frame`).
- **Make `mpCost` a first-class god-skill param** so it **auto-scales with rank** through the *same* machinery as
  damage/radius: add an `mpCost` key to the registry `base` + the per-rank `waveStep`/`formStep` (`:13532-13557`).
  Then `gGodFireParam(p,id,'mpCost')` = base + rank mods, no special-casing.
  - **Burning Body starting curve:** base **≈1.67/s** (5 mp / 3 s) at rank 1; **+~0.15/s per rank** via the steps;
    Form @5 and Ascension @10 add a step (stronger = costlier) → maxed ≈ **3.0/s**. Tune by feel.
- **Drain is layered on top of regen**, not a replacement: net passive = `regen − Σ(active god-skill drains)`.
  When total active drain **exceeds regen**, the pool **bleeds even while idle** — this is the intended pressure
  that forces the player to toggle skills off (Phase 3).
- **MP-investment cards now matter twice:** they fund both the manual kit and how many auras you can sustain.

### Phase 3 — toggle / hotkey management

- **Bind owned God Skills to keys 1–9 in acquisition order.** Key N toggles skill N on/off.
- **Default on acquire: ON** (no regression — it starts firing immediately, as today) but now toggleable off.
- **Starvation model (DECIDED, Josh 2026-06-11 — dormant + auto-resume):** a toggled-on skill that can't be paid
  this frame goes **dormant** — stops firing + draining, FX fades, its hotkey greys/dims — and **auto-resumes**
  when regen restores enough mana. The skill stays *toggled-on* (preserves player intent); mana gates actual output.
  - **Pay in acquisition order (DECIDED, Josh 2026-06-11 — lowest key stays):** each frame, subtract drains from
    current mp **in key order (1→9)**; skills that can't be covered this frame go dormant. So when over-committed,
    your **last-toggled skills cut out first** and your core ones keep running — only the marginal skill flickers,
    not all of them.
- **HUD:** a small skill row near the MP bar (`#gmp`, drawn `:4233`) — each owned god skill as an icon + its
  number key + active/dormant state + its current per-second cost. Mirror the existing skill-cd HUD chips.

---

## Engineering grounding (source of truth; not prescriptive on *how*)

- **Phase 1** = number edits in `WeaponRegistry.sword` (`:2478-2482`, `:2495`, `:2476`) + the `sw.*` reset block
  (`:14583-14584`) + `SKILL_STAT_FLOOR` (`:2542`). No new systems.
- **Phase 2** = add `mpCost` to the `IMBUE_PATHS.cilia.burningBody` registry `base`/`waveStep`/`formStep`
  (`:13527-13567`); subtract `gGodFireParam(p,id,'mpCost')*dt` in `gTickBurningBody` (`:3736`). Trail/Pyroclasm
  (when built) get an `mpCost` in their registry entries for free via the same path.
- **Phase 3** = per-player toggle state (parallel to the god-skill map; e.g. `p.godSkillActive[id]` +
  `p.godSkillKey[id]` assigned in acquisition order at the acquire site `:13691`); a `keydown` branch for `'1'`–`'9'`
  (new handler or extend `:3416`/`:3521`); a gate in `gUpdateGodSkills` (`:3719`) skipping inactive/dormant skills;
  a HUD draw near `:4233`.
- **Multiplayer:** mana is per-player local; god-skill firing is already **local/host-authoritative** (each client
  ticks its own owned skills, only FX/damage outcomes sync via `_frSeq`). Toggle + dormant state are **local input
  state → no protocol change.** Confirm the toggle state never needs to leave the owning client.
- **AI-native (required, not optional):** toggles **re-introduce an input hook** that item 2's pure auto-fire had
  removed. The `Sim` harness needs **`Sim.toggleGodSkill(n)`** (toggle by key/id) and **`Sim.observe()`** must
  expose, per owned skill, `{key, active, dormant, mpCostPerSec}` + current `mp` — else headless bots can't manage
  mana and runs misrepresent the real economy. (This **supersedes** the god-skills.md note that auto-fire needs no
  input hook.)

---

## Balance

- **The benchmark is the anchor, not gospel:** "leap + ~3s WW ≈ empty (fresh early pool)" — tune the cost split to
  hit it while each skill still *feels* worth its price. Levers: per-skill cost · `mpRegen` · the god-skill drain curve.
- **God-skill drain is the new master pressure knob:** with 2–3 auras toggled on, net drain should *approach or
  exceed* regen so the player must choose what to keep lit. Too cheap → the toggle is meaningless; too steep →
  god skills feel unusable. Tune so **one** aura is comfortably sustainable, **all** of them is not.
- **Early vs late:** the base pool/costs are tuned tight for the early game; `mpRegenAdd` / `mpBonus` / maxMp cards
  are the deliberate loosening over a run. Don't make base regen so high it erases the early pinch.
- **Don't double-gate:** if a skill is mana-gated hard, a long cooldown on top is redundant and feels bad — let one
  system lead per skill (mana for leap/WW; windup for heavy; rate-CD for swing).

## Boundaries

- **Class skills (leap/WW/dash/heavy/swing) = the platform/class layer.** Their mana+CD live in `WeaponRegistry`.
- **God Skills (Burning Body etc.) = item 2's god layer.** Their per-second `mpCost` lives in the god-skill
  registry and scales with rank. The toggle/HUD/Sim-hook is generic and serves all future god skills + gods.
- **Patron Cards (item 0c)** are unaffected — they buff burn behaviour, not mana.

## Phasing (ship order)

1. **Phase 1 (quick):** class mana + cooldown rebalance → immediately playtest the "running dry" feel. Standalone.
2. **Phase 2 (session):** Burning Body per-second drain, rank-scaled via `mpCost`. Layers on item 2's god skills.
3. **Phase 3 (session):** toggle/hotkey + HUD + Sim hooks. Delivers the "manage what you keep active" decision.

Phase 1 alone delivers Josh's core ask (run out of mana early). 2–3 add the god-skill economy + management depth.
Depends on item 2's god-skill system being live (it is — Burning Body shipped) for Phases 2–3.
</content>
</invoke>
