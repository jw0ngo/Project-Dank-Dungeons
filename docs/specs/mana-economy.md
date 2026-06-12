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
| **Leap** | 35 → **45** | 200f → **900f (≥15 s)** | A rare, heavy nuke. CD is its **repeat-gate**; the 45 mana just makes the opening leap+WW burst bite. |
| **Whirlwind** | 4.8/s → **18/s** (`mpCostWwTick 0.30`) | 120f → **300f (5 s)** | Mana-led **within** a burst; 5 s CD between spins. ⚠ **Feels underpowered on playtest (Josh)** — see Balance: pair the longer CD with a power bump (and re-check the 18/s drain isn't too steep on top). |

- **Benchmark satisfied:** leap **45** + (18 × 3) = **99 ≈ empty** from 100. ✓
- **Regen unchanged at 9/s** for now — the *standing* pressure comes from Phase 2's god-skill drain layered on top.
- **Cooldown philosophy (REVISED — Josh, 2026-06-11: current CDs are too short; lengthen them):** big abilities are
  **rare, deliberate plays** gated by a real cooldown, not spammable. **Leap → ≥15 s (900f)**, **Whirlwind → 5 s
  (300f)**. Which lever *leads* differs per skill: **leap is CD-led** (15 s repeat-gate; its mana cost just makes
  the opening burst bite), **whirlwind is mana-led within a burst** (18/s empties you mid-spin) with a 5 s CD
  between spins. Heavy stays windup-gated; swing stays rate-gated. **Dash/heavy CDs:** Josh's "too short" read is
  general — lengthen them on the same principle if playtest agrees (dash 1.33 s and heavy 1.5 s are candidates);
  left at current values pending his call (flagged, not guessed).
- **Floors:** add/confirm `mpCostWwTick`, `mpCostLeap` floors stay sane; `evasionCooldown`/`leapCooldown` already
  floored. The whirlwind auto-off at `mp ≤ 0` (`:4222`) is the model for starvation (see Phase 3).

### Phase 2 — God Skills cost mana per second (rank-scaled)

- **Per-second drain while active**, paid in `gTickBurningBody` / `gUpdateGodSkills` each frame:
  `p.mp -= gGodFireParam(p, id, 'mpCost') * dt` (dt in frames; `mpCost` per-frame). **Evolved Forms add a
  per-emit cost** on top, charged each time the effect fires (ring / nova / etc.).
- **Make `mpCost` a first-class god-skill param** so it **auto-scales with rank** through the *same* machinery as
  damage/radius: add an `mpCost` key to the registry `base` + the per-rank `waveStep`/`formStep` (`:13532-13557`).
  Then `gGodFireParam(p,id,'mpCost')` = base + rank mods, no special-casing. The per-emit cost is a second param on
  the Form, charged at the emit site.
- **Burning Body cost curve — RESCALED (Josh 2026-06-12, supersedes the old flat-linear "10 mp/3s + 27/level"
  model).** The shipped curve was **flat-linear in cost and gentler-linear in dps**, so efficiency ran *backwards*
  (rank 1→2 = cost ×3.7 for dps ×1.5; dps-per-mana **fell ~4×** rank 1→10) and **evolution added no step**. The
  redesign fixes the mana-to-dps economy. Three principles (the *principles* are Josh-locked; the *exact numbers*
  are a proposed realization — tune freely):
  1. **Anchor: rank 1 = 2 mp/s** (down from 3.33). 
  2. **Step-change at each evolution** — cost ramps gently within a tier, then **jumps at rank 5 (Form)** and again
     at **rank 10 (Ascension)**. Same shape for dps. Evolving must *feel* like a power+cost spike, not one more
     linear tick.
  3. **DPS scales superlinearly with cost: `dps ∝ cost^k`, `k ≈ 1.5`** (the **efficiency exponent**, the master
     tunable). This makes **dps-per-mana RISE with investment** — 20 mp/s deals ~**11×** the dps of 4 mp/s (Josh's
     "much more than 5×"). Pouring mana into one skill is rewarded → specialization is the payoff (build-craft
     north star). Because dps ∝ cost^1.5, a cost *step* at evolution yields an even bigger dps *step* **for free** —
     put the discontinuity in **cost**; the damage spike follows.

  **Proposed target curve** (engineer back-solves the registry to land the realized dps on these multiples; verify
  on the training dummy):

  | Rank | Cost mp/s | DPS (× rank-1) | note |
  |---|---|---|---|
  | 1 | **2.0** | 1.0× | |
  | 2 | 3.0 | 1.8× | |
  | 3 | 4.0 | 2.8× | |
  | 4 | 5.5 | 4.6× | |
  | 5 | **9.0** | **9.5×** | ⬆ Form evolution — step |
  | 6 | 12 | 14.7× | |
  | 7 | 16 | 22.6× | |
  | 8 | 21 | 34× | |
  | 9 | 27 | 50× | |
  | 10 | **45** | **107×** | ⬆ Ascension — big step |

  - **Two open tunables (Josh's call):** **(a) efficiency exponent `k`** — 1.5 = "much more than 5× but not
    runaway"; raise toward 2.0 for a steeper specialist reward (k=2 → 20mp/s = 25× the 4mp/s dps). **(b) rank-10
    ceiling** — proposed ~45 mp/s (down from ~88 to honour "lower cost"); lift it (steeper tier-2 ramp + bigger
    ascension step) if maxed Burning Body should stay a true Max-MP-gated monster.
  - **NO CAP on cost** (unchanged) — at high rank the cost still exceeds a base pool; the "build Max-MP/regen to
    wield it" gate IS the design (see build-diversity below). The rescale changes the *curve shape*, not the gate.
  - **Engineering levers (the how is the engineer's):** replace the flat `mpChunkInc:27` (`:14150`) with a **tiered
    per-rank schedule + explicit evolution cost-steps** at ranks 5/10 (so cost is piecewise, not one slope);
    steepen the `auraDmg`/`emitDmg` `waveStep`/`formStep` and add **evolution dps-steps** so realized dps tracks
    the target × multiples. The cost is no longer a clean `base + inc·(rank−1)` — it's tiered, so `gGodSkillBaseChunk`
    (`:3888`) needs a per-tier table (or base-chunk + a rank→cost lookup). Keep the 3 s chunk cadence.
- **Drain layered on regen**, not a replacement: net passive = `regen − Σ(active drains)`. When total active drain
  **exceeds regen**, the pool bleeds even while idle — the pressure that forces toggling skills off (Phase 3).

#### The mechanic is fixed; build variety lives in the CARD pool (design principle — Josh 2026-06-12)

**How mana is spent does not change from here** (numbers tweak, mechanic frozen): a per-second drain that
scales **super-linearly** with skill level (tiered, with evolution steps — see the rescale above) + per-emit costs
on evolved Forms, no cap. The variety comes from the **supply side — the
card pool — which we expand so a wide range of mana builds are all viable** (the roguelite north star: maximize
build potential = maximize long-run playability). A flat per-second drain is gated by two *independent* levers, and
cards push on either:

- **Regen growth → SUSTAIN builds.** Sustained uptime of a skill = **regen ÷ drain** (pool size doesn't change
  uptime — only burst length). Build regen high enough and a maxed skill runs continuously. (`mpRegenAdd`-family.)
- **Max-pool growth → BURST builds.** A big pool funds an **ult-window**: light the maxed skill, drain the pool over
  a few seconds, toggle off to recharge while you run cheap skills, repeat. (`mpBonus`/maxMp family **+ UNIQUE
  build-defining cards** — e.g. a rare that **3× your mana pool**.)
- **Both must stay viable — neither sustain nor burst should dominate.** That balance constraint lives in the **card
  pool**, not the drain mechanic. Hybrids (some regen + some pool) sit on the spectrum between.
- **The supply must scale to the maxed drain.** Post-rescale, a maxed Burning Body costs ~**45 mp/s** (proposed
  ceiling; tunable) vs the tight ~1/s base regen — so a *committed* sustain build must reach roughly that in regen,
  and a burst build needs a pool/UNIQUE multiplier big enough to fund an ult-window at that drain. **Rebalance +
  expand the mana cards in tandem with the drain** — shipping the high drain without the scaled supply bricks maxed
  skills with no recourse. (Its own design surface — the mana-build card expansion, flagged as follow-on below.)
  *(The new out-of-combat 10 mp/s regen — playtest batch #8.8 — is also part of the supply picture: it funds
  re-engage bursts between fights, but a continuously-lit aura still needs card investment to sustain.)*

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
- **HUD — the God-Skill Action Bar (upgraded; Josh-approved 2026-06-12, WoW-style):** a horizontal **action bar**
  near the MP bar (`#gmp`, drawn `:4233`) — each owned god skill is a **slotted icon** in hotkey order (1–9), with
  its number key, current per-second mana cost, and a clear **active/dormant state**.
  - **Icons are real art, SHARED with the draft cards (decided):** one icon per god skill serves **both** the
    level-up draft card **and** this HUD slot — author one set, not two. Plugs into the existing `CARD_ICON_ART`
    keying from the level-up art pass (`specs/levelup-screen.md`). Cilia launch = 3 icons (Burning Body, Trail of
    Embers, Pyroclasm); +1 per future god skill. Emoji glyph stays the fallback until the art lands.
  - **Active/dormant tell = a god-colored particle border (CORE state, particle juice is stretch):**
    - **Core (ships with Phase 3):** the slot reads **active** (lit) vs **dormant** (dimmed) unambiguously — at
      minimum a static god-colored border when active, greyed when dormant. This is the functional requirement of
      the toggle, so it ships with Phase 3.
    - **Stretch (fast-follow juice):** the border **lights up with particles of the skill's god** (Cilia =
      fire-red embers); animated. Pure feel polish on top of the core state — may slip a beat without blocking Phase 3.
  - **Per-god signature colour as data:** add a signature colour per god (Cilia = fire-red) as a small registry
    datum, so the border/particle treatment is generic and future gods (Boreas = ice-blue, etc.) inherit it free.
  - **Scope now = the god-skill bar only.** A *unified* bar folding in the class kit's CD chips is a later vision
    (Josh: "god-skill bar now, unify later") — out of scope for this phase. Mirror the existing skill-cd HUD chips' styling.

---

## Engineering grounding (source of truth; not prescriptive on *how*)

- **Phase 1** = number edits in `WeaponRegistry.sword` (`:2478-2482`, `:2495`, `:2476`) + the `sw.*` reset block
  (`:14583-14584`) + `SKILL_STAT_FLOOR` (`:2542`). No new systems.
- **Phase 2** = add `mpCost` to the `IMBUE_PATHS.cilia.burningBody` registry `base`/`waveStep`/`formStep`
  (`:13527-13567`); subtract `gGodFireParam(p,id,'mpCost')*dt` in `gTickBurningBody` (`:3736`). Trail/Pyroclasm
  (when built) author their `mpCost` via the **#8.9 step+superlinear curve from the start** — **not** the flat
  `base+inc` path this line originally implied (#8.9 condemned it). **Pyroclasm** is a clean interval skill →
  per-second drain like Burning Body. **Trail** mixes movement-emit + aura Forms, so its cost **follows emission
  shape** (✅ Josh 2026-06-12, "a movement skill charges only upon movement"): **per-patch** for the movement/patch
  Forms (base / Inferno Wake / Chaos Steps — you pay as you move), **per-second** for the continuous-aura Forms
  (Ember Shroud / Phoenix Mantle / Immolation). Detail in [`god-skills.md`](god-skills.md) → *Trail of Embers → Mana
  cost*. Both still inherit the #8.9 curve shape.
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
- **God-skill drain is the new master pressure knob — now build-dependent (revised Josh 2026-06-12):** at the
  ~80–100/s maxed drain, sustaining even **one** maxed skill takes real mana investment, and running all three
  maxed (~240–300/s) is never the goal. **Specialization** (max 1–2 skills + cheap filler, toggle the rest) is the
  intended endgame, not "everything maxed and lit." Tune the **supply** (regen/pool cards) so a *committed* mana
  build can sustain ~1–2 skills (sustain path) **or** burst-cycle a big one (burst path), while an un-invested
  build is forced to toggle aggressively. Too cheap → the toggle is meaningless; too steep with no supply → maxed
  skills brick. The lever to balance is the **card pool**, not the drain.
- **Early vs late:** the base pool/costs are tuned tight for the early game; `mpRegenAdd` / `mpBonus` / maxMp cards
  are the deliberate loosening over a run. Don't make base regen so high it erases the early pinch.
- **One lever leads per skill (not double-gate):** leap = **CD-led** (15 s) with mana as the opening-burst cost;
  whirlwind = **mana-led** within a burst with a 5 s CD between; heavy = windup-led; swing = rate-CD. Avoid making a
  skill *both* mana-starved AND CD-locked such that a full bar still can't act — pick the limiter that fits the skill.
- **⚠ Whirlwind feels underpowered (playtest, Josh 2026-06-11) — power pass REQUIRED with the CD change:** a longer
  5 s cooldown on an already-weak-feeling skill makes it *worse* unless its **payoff rises**. Pair the CD with a
  power bump — more damage per hit, larger radius, or longer spin per activation — and re-check that **18/s drain
  isn't too steep on top** (a heavily mana-starved *and* rarer whirlwind reads as a double nerf). Tune drain ×
  power × CD **together** so a 5-s-CD whirlwind feels like a worthwhile commitment, not a punishment. This is the
  one place Phase 1 is more than a number tweak.

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

**Follow-on (its own surface, after the mechanic lands) — the mana-build card expansion.** The drain mechanic
(Phases 1–3) is the *demand* side. The **supply** side — a card pool rich enough to support sustain builds (regen),
burst builds (pool/UNIQUE multipliers), and hybrids — is a separate, ongoing design surface that makes the variety
real. Item 7 ships the mechanic + rebalances the *existing* mana cards (`mpRegenAdd`/`mpBonus`) to ~10× scale; the
*expansion* (new regen/pool archetypes, a UNIQUE build-defining card class) is follow-on work, not a Phase-1 blocker.
Tracked in the PM lane.
</content>
</invoke>
