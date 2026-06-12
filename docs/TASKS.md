# To Dust — Task Tracker

**The single shared backlog of concrete work, organized by the agent who owns each task.** Every to-do for
the PM, Engineer/CTO, and Artist lives here with a live status. When there's no higher-priority *Now* work in
[`ROADMAP.md`](ROADMAP.md), pull from your lane here.

> **TASKS vs ROADMAP — two layers, one axis each.**
> [`ROADMAP.md`](ROADMAP.md) is the **strategy** layer (PM-owned): *what* features we're building and *why*,
> priority, sizing, the product gate (`approved`/`shipped`). **This doc is the execution layer:** the concrete
> to-dos — feature sub-tasks, cross-role hand-offs, deferred cruft/bugs — for every agent. A roadmap feature
> spawns tasks here. **One fact, one home:** a task links its roadmap item by # / name and never re-states the
> *why*; the roadmap never tracks execution churn. (For spec-backed work the **spec** is the source of truth;
> a task tracks only *progress against it*, not build detail.)

## How to use this doc

- **Lanes are by owner** — the agent who does the work **and updates the status.** Read your lane to pick up work.
- **Any agent may add a task to any lane** (flag work for another). Tag who flagged it: `(↳ from ART, 2026-06-11)`.
  **Only the owning lane changes a task's status.**
- **One line per task where possible:** `<status> <type> **Title** — what + grounding (greppable symbol / file).
  (↳ from <role>, date)`. Meaty spec-less hand-offs keep a collapsible **detail** block — they're their only home.
- **Status:** ◻️ todo · 🔄 in-progress · ⛔ blocked · ✅ done (move to **Done** at the bottom; git keeps the depth).
- **Type:** 🔴 bug · 🟡 cruft (dead/misleading code, no behavior impact) · 🟢 polish · ✨ feature-work · 🎨 art · 🔧 chore.
- **Flip status the moment you act, in the same commit.** **Commit your own lane — never `git add -A`** (the tree
  carries cross-role WIP; stage explicit paths so a `pm:`/`eng:`/`art:` commit stays single-lane).
- **Session-open (~30s):** `git status` + `git log --oneline -15` → roadmap *Now* → your lane here → act.

---

## 🟦 PM lane

- ✅ 🔴 **pm-bot deploy-gating bug: a "docs-only" push can carry an un-pushed `index.html` commit to the remote**
  (↳ from ENG, 2026-06-12) — **DONE 2026-06-12 (PM).** Root cause: `git push` advances `origin/main` over the
  **whole ancestor chain**, so a pre-authorized docs push silently deployed the engineer's parked `index.html` #8
  fixers (`1f41da0`, now live). **Fix shipped** in `tools/pm-bot/pm_bot.py` — `commit_and_push` now routes through
  `_safe_push_main()`: it inspects the *entire* outgoing delta; if any commit touches `index.html`/`assets/`, it
  pushes **only the docs commits** (replayed onto the clean remote tip via an isolated `git worktree`, then
  reconciles local main by rebase) and **holds the build commit** for Josh's auth — never silently deploying. Clear
  "HELD" status on any cherry-pick/rebase conflict. Mirror of the ENG-memory learning + my PM-memory gate
  (2026-06-12). Tooling-only, deploy-inert. *(Heads-up: `1f41da0` is already live; the follow-up `78cd9b2` is
  correctly still local.)*

- ◻️ ✨ **Finalize Ikras / Boreas / Bhumi stat-synergy mechanics when each god is built** (↳ Josh 2026-06-12 ·
  spec [`specs/god-stat-identities.md`](specs/god-stat-identities.md) "design-ahead") — the per-god mechanics are
  PM-proposed (Ikras chain-arc ← move/atk speed; Boreas frost-field ← pickup range, CC uptime ← CDR, sustain ←
  mana regen; Bhumi thorns ← max HP, heal-engine ← HP regen). Confirm/redirect with Josh + author into each god's
  kit **when that god lands** (Boreas #5 is next — fold its hooks into the Frost-kit design at unhold). **Resolve
  the Attack-Speed stat gap** (no character-stat card exists for it — add one or map to swing-speed) before Ikras.

- ◻️ 🔧 **Re-rank after item 2's first slice lands** — once God Skills proves out in playtest, re-sequence *Next*:
  the Boreas unhold is the keystone (lights up Elemental Fusion + co-op synergy + its own Frost kit at once).
  Define the unhold trigger then. (roadmap #5 / *Next*)

- ◻️ ✨ **Mana-build card expansion — size as a proposal** (↳ Josh 2026-06-12 · spec [`specs/mana-economy.md`](specs/mana-economy.md) "mana-build card expansion" follow-on) — the *supply* side of item 7: a card pool rich enough to make SUSTAIN (regen), BURST (max-pool / UNIQUE multipliers like *3× pool*), and hybrid mana builds all viable. Item 7 only rebalances the existing `mpRegenAdd`/`mpBonus` cards ~10×; this expands the archetypes + introduces a **UNIQUE build-defining card class**. Write a roadmap proposal once item 7's mechanic is live (sequence after, don't block Phase 1). Embodies the build-potential north star (PM memory 2026-06-12).

---

## 🟧 Engineer / CTO lane

### God Skills — item 2 (↳ roadmap #2 · spec [`specs/god-skills.md`](specs/god-skills.md))

- ✅ ✨ **Trail of Embers — built, then REWORKED to the new evolution tree** — **done ENG 2026-06-12.** The 2nd
  Cilia god skill: a movement-as-weapon auto-fire. Generic pool entry `IMBUE_PATHS.cilia.trailOfEmbers` (`fire`
  block) + `gTickTrailOfEmbers` + a `case 'trailOfEmbers'` in `gUpdateGodSkills` → acquire/rank-up cards, Form @5
  & Ascension @10 forks (+ headless `gSimEvolution` hook), toggle, and action-bar HUD all come **free**. Emits per
  `TOE_PATCH_DIST` of distance *moved* (decoupled from dash). **Re-implemented to the PM rework (`25b02ef`):**
  - **Forms:** **Inferno Wake** = a **wide cone** fanning behind you (`gToeLayCone`: `TOE_CONE_N` patches in a V,
    apex at feet; `dmgMult 0.55`, `costMult 1.5` — broad/low-per-patch) · **Firesteps** = the **single line** but
    `dmgMult 1.6` (concentrated). *(Ember Shroud aura **cut** — removed all aura code + `mpPerSecByRank`.)*
  - **Ascensions** reuse the shipped substance grounds: 🐉 **Wyrmwake** (dragonfire cone, heal) · 🔥 **Chaoswake**
    (chaosfire cone, offset `TOE_CONE_BACK` behind so **never on the player's tile**) · 🐉 **Dragonfeet** (line
    patches erupt into dragonflame **pillars @`TOE_DRAGONFEET_FUSE`** via `gFirePillars` + a dragonfire heal-patch
    — new `kind:'dragon'` in `gTrailBombs`) · 🔥 **Chaos Steps** (relocated to Firesteps, unchanged — exploding
    footsteps dropped at the trailing anchor).
  - **Cost:** now **all per-emit** (no per-second anything) — `mpPatchByRank` per emit-tick × the form's `costMult`;
    cone 9→47 mp/s, line 6→31, footsteps ~43. Damage = independent `trailDmgByRank` (1→10 = 45× vs cost 21.7×).
    `gGodSkillDrainPerSec` shows honest effective mp/s while moving. Plumbed a ranked `burnDur` through
    `gSpawnFireTrail` (legacy callers fall back). `node --check` + economy extract-eval verified.
  - **⚠ Tuning watch (Josh):** Chaoswake self-burn (walk back into your wake) + Chaos-Steps blast (810 dmg rk10) +
    cone perf (~6 patches/tick) — tune by feel on the dummy. **Next God Skill: Pyroclasm** (interval + auto-target).

### Playtest feel/readability batch (↳ from PM playtest, Josh 2026-06-12 · roadmap #8)
*Nine developer-directed game-feel / readability / balance / bug fixes from the first mana-economy playtest.
All pre-greenlit (bug-driven + balance/polish on shipped systems). Mostly quick; grounding/anchors inline (line
refs drift — grep the symbol). **Grab the cheap irritant-fixers first** (#8.3 wolf leap, #8.4a colour split,
#8.5 fog shake) — tiny, and they clean up every playtest. **#8.7/#8.8/#8.9 are the mana-balance cluster** — do
#8.9 (cost/dps rescale) + #8.8 (ooc mana regen) before #8.7 (early difficulty), then re-judge night 1 with all three in.*

- ✅ ✨ **#8.9 — Rescale Burning Body's mana-to-dps economy (two independent per-rank tables)** — **done ENG 2026-06-12** (pushed; numbers tunable by feel). Built the corrected **model B**: `mpChunkByRank` (cost) + `auraDmgByRank`/`emitDmgByRank` (damage), each read straight off its table — no `gGodSkillDpsScale`/exponent. Low rank-1 anchor (2 mp/s), steps at the Form/Ascension forks, damage authored to climb faster than cost (dps/mana rises 5.0→11.9 over ranks 1→10, verified by extract-eval). Original detail below. (↳ from PM,
  Josh 2026-06-12 · spec [`specs/mana-economy.md`](specs/mana-economy.md) "Burning Body cost curve — RESCALED") —
  the shipped curve is **flat-linear in cost, gentler-linear in dps** → efficiency runs backwards (rank 1→2 = cost
  ×3.7 for dps ×1.5; dps/mana falls ~4× over ranks 1→10) and **evolution adds no step**. Retune to the spec's target
  curve. **⚠ MODEL CORRECTED (Josh 2026-06-12):** an earlier draft said "dps ∝ cost^1.5 as a runtime formula"; the
  engineer built `gGodSkillDpsScale` and it was **reverted**. Correct model = **two INDEPENDENT per-rank lookup
  tables, no coupling formula**: **(1)** `mpChunkByRank:[…]` (fixed cost per rank, charged every 3 s, low rank-1
  anchor ~2 mp/s, step at the Form/Ascension forks); **(2)** `auraDmgByRank:[…]` / `emitDmgByRank:[…]` (fixed damage
  per rank). **Author the damage table to climb faster than the cost table** so dps-per-mana rises with investment
  (Josh-chosen, model B) — but as *numbers*, NOT an exponent. Remove `gGodSkillDpsScale` + `GOD_DPS_EXP` + the
  `* dps` multipliers. Starting tables in the spec; tune by feel.
  - **Levers:** `gGodSkillBaseChunk` (`:~3943`) reads `mpChunkByRank` (already done); `gGodFireParam`'s `auraDmg`/
    `emitDmg` read the new `*ByRank` tables (or restore explicit per-rank damage). No derived scaling. Keep the 3 s cadence.
  - **One tunable for Josh:** the **rank-10 cost ceiling** (~45 mp/s proposed, down from ~88; lift if maxed BB should
    stay a Max-MP-gated monster). The damage-vs-cost steepness is now just the authored numbers — tune by feel.
  - **Verify on the training dummy** (`hitTrainingDummy` path already wired in `gTickBurningBody :~4021`): measure
    realized dps at ranks 1/5/10 per Form and confirm the dps/mp ratio climbs + the evolution steps read. Pairs
    with #8.7/#8.8 (this lowers early cost too — re-judge early difficulty together). Host-authoritative; the HUD
    mp/s figure (`gGodSkillDrainPerSec`) updates for free. **Trail/Pyroclasm (item 2) inherit this two-table model**
    when built — fixed per-rank cost + damage tables, not a flat ramp and not a formula.

- ✅ ✨ **#8.8 — Default out-of-combat MANA regen: 10 mp/s after 10 s of no mana use AND no damage** — **done
  ENG 2026-06-12.** Added a tiny **`gSpendMana(p,amt)`** helper (clamps to 0, stamps `p._lastMpUseFrame = gFrame`)
  and routed **all 6 spend sites** through it (god-skill base chunk + emit in `gTickBurningBody`, dash, leap, heavy,
  whirlwind per-frame). `gDamagePlayer` stamps `p._lastDmgFrame`; `gDealEnemyDamage` stamps `p._lastDealtFrame`
  (local player only — remote hits apply on a separate host path). A shared **`gOutOfCombat(p)`** = no damage
  **taken AND none dealt** for `OOC_REGEN_DELAY`. In `gUpdatePlayer`'s regen `else`-branch: when
  `gOutOfCombat(p)` **AND** `gFrame-(_lastMpUseFrame||0) ≥ OOC_REGEN_DELAY` (600f/10s), base regen swaps to **`OOC_MP_REGEN` (10/60 = 10 mp/s)**
  instead of `W().mpRegen` (~1/s); card `mpRegenAdd` still stacks; clamped to `maxMp`. Per-player local, MP-safe.
  Knobs: `OOC_REGEN_DELAY`, `OOC_MP_REGEN`. `node --check` + grep verified (helper declared once, all spend sites
  routed, no stray `p.mp -=`). **⚠ Design default IN EFFECT (flag for Josh):** an active god-skill charges its chunk
  every ~3 s → re-stamps `_lastMpUseFrame` → **ooc fast-regen won't fire while a skill is lit** (toggle it off to
  fast-recharge). Consistent with toggle-management; whirlwind likewise counts as "using mana." *(orig detail below.)*
  - **(orig)** mirror of HP-regen #8.2, relief valve for #8.7. Stamp `_lastMpUseFrame` at every mana-spend site;
    regen 10 mp/s after 10 s of no mana use AND no damage (`_lastDmgFrame`); overrides base ~1/s, `mpRegenAdd` stacks.

- ◻️ 🟢 **#8.7 — Early-game difficulty too hard with the new mana economy; scale back the first night(s)** (↳ from
  PM playtest, Josh 2026-06-12 · revisits roadmap #1 + #7) — with the tighter mana (can't spam leap to clear a
  horde), **night 1 is now too punishing.** Item 1 steepened the curve to fix the flat *late* game; it also lifted
  the *early* game. **Fix = push the difficulty later, not flatten it** (keep item 1's "tune the slope" intent — just
  start lower). Levers (all in the wilderness scaling, `:13727–13744` + nightfall `:14811–14816`):
  - **Night-1 stat step** — `wildThreatMult() = 1 + wildThreatLevel·0.35` (`:13728`) makes night 1 already **1.35×**
    HP/dmg (threat = night #, `:14811`). Soften the early step (gentler coefficient, or a threat curve that starts
    ~0 on night 1 and ramps), so night 1 reads as a *readable trickle* again.
  - **First-night horde** — `_wildSpawnHorde(_wildHordeSize(wildNight))` (`:14816`) + the per-night siege stream
    (`siegeSpawnAccum`): cut the night-1 horde size / spawn rate so the opening siege is clearable on the tight mana
    budget.
  - **Count/speed mults** — `1 + threat·0.15` (`:13737`) / `·0.08` (`:13731`): lower the early end if needed.
  - **Sequence AFTER #8.8 lands** — the out-of-combat mana regen is itself a survivability boost on night 1, so
    re-judge the felt difficulty *with* #8.8 in before deciding how far to cut (don't double-nerf). **Tune by feel:**
    night 1 should be beatable but not free; the late-game wall item 1 created must stay. Host-authoritative; no MP/Sim change.

- ✅ 🔴 **#8.3 — Wolf leap fires out of range; widen + gate like the warrior charge** — **done ENG 2026-06-12.**
  The task's `leapRange:200`/`:2555` refs were the *player's* leap; translated the intent to the wolf's real
  params. The wolf's "leap" is the pounce-bite: it commits when `dist≤lungeRange` (150 dire / 170 alpha) but the
  pounce impulse was capped by `WOLF_LEAP_MAX=16` (~80px reach) → committing at the far edge landed short. Fix =
  mirror `_aiWarrior`'s true-proximity gate: **commit only within 70% of `lungeRange`** (`WOLF_LUNGE_COMMIT_FRAC=0.70`)
  **+ raise pounce reach `WOLF_LEAP_MAX` 16→20** (~+25%) so the leap over-reaches the tighter gate → reliable connect
  for both wolf types (flankDist sits inside the gate, so the orbiter still closes to commit range). Knobs: the frac
  (0.70) + the cap (26). Host-side AI, no MP/Sim change. **Refinement (Josh, 2026-06-12):** another +30% lunge reach
  with the *commit range held the same* → the wolf now **leaps THROUGH** you (gap-close coefficient `0.20→0.26` =
  travel ×1.3 / ~30% past contact; `WOLF_LEAP_MAX 20→26` so it isn't re-clamped; a hard backpedal during the windup
  still makes it fall short — dodge counterplay). *(The original `200→260` numbers were for the wrong entity;
  the effect is the same warrior-style relationship — leap reach now exceeds commit distance. Detail preserved below.)*
  > *(orig)* in `_aiWolf` (`index.html:5392`) + the wolf leap range (`leapRange:200`, `:2555` — confirm this is the
  > wolf's def, not the player's `:15088`): (a) **+30% range** 200→**260**. (b) **Only initiate the leap within 70%
  > of max range** (≤182px) — mirror `_aiWarrior`'s true-proximity firing gate (`:5521–5524`). Today the wolf commits
  > from too far and lands short/whiffs.

- ✅ 🟢 **#8.4 — XP/Favor pickup text: colour split + aggregated XP counter** — **done ENG 2026-06-12.** Both parts
  in one: the per-orb gold `+N XP` float is replaced by a single persistent **`gXpPopup{total,expiry,pop}`** anchored
  over the player's head (`gAddXpPopup`/`gDrawXpPopup`, near `addGDmg`), accumulating over a **5 s window**
  (`XP_POPUP_WINDOW=300`, refreshed per pickup) with a scale-kick on each add, then easing out (`XP_POPUP_FADE`). It
  renders **soft white `#eef2ff`** → satisfies the colour split (a); **Favor stays per-pickup gold `#ffd040`**
  unchanged. Reset with `gDmgNums` on run-reset. Render-only, MP-safe. Flag for Josh: Favor left per-pickup (not
  aggregated) per the task. *(orig detail below.)*
  - **(a) Colour split** (trivial): XP pickup text → **white** (`addGDmg` at `:13858`, today gold `#ffd040`
    → `#ffffff` / soft `#eef2ff`); Favor pickup text **stays gold** (`:13782`, `#ffd040`). They're
    indistinguishable today because *both* are gold — this is the core "I can't read the popups" fix.
  - **(b) Aggregated XP counter:** replace the per-orb `+N XP` spam (they jumble on multi-pickup) with a
    **single** `+<total> XP` text above the player's head that **grows** as more XP is collected within a
    **5 s window** (each pickup adds to the running total + refreshes the window), then fades when the
    window lapses. Engineer's call on impl (a small persistent `gXpPopup{total,expiry}` drawn above
    `gPlayer`, vs the transient `addGDmg` list at `:13858`). **Favor stays per-pickup gold** (aggregate is
    XP-only per Josh) — flag if he wants Favor aggregated too. Render/HUD-only.

- ✅ 🟢 **#8.5 — Smooth the fog-of-war edge shake at the explore frontier** — **done ENG 2026-06-12.** Took the
  temporal-ease route: added a map-sized **`gFogVis` Float32Array** (allocated/reset in lockstep with `gFogMap`)
  holding each tile's *displayed* reveal 0→1. In `gDrawFog`'s low-res mask build, each tile's alpha now lerps
  unseen↔shroud by `gFogVis` (eased toward `gFogMap`'s 0/1 target at `FOG_REVEAL_EASE=0.05`/frame ≈ 0.33 s) instead
  of snapping → the bilinear-upscaled black↔shroud frontier grows smoothly rather than stepping one whole tile per
  reveal. Knob: `FOG_REVEAL_EASE`. Render-only, no sim/MP impact. Defensive `!gFogVis` guard added to `gDrawFog`.

- ◻️ 🟢 **#8.6 — Night vision radius should ease in/out, not snap** — `fogVisRadiusVisualPx()` (`:15337`)
  snaps between day (`dayR`) and night (`FOG_VIS_NIGHT*T`) the instant `wildIsNight` flips (`:14761`). Make
  the vision circle **ramp** as night nears/lifts — ease the visual radius over a transition window around
  the phase boundary (phase clock `:14758`, `WILD_DAY/NIGHT_DURATION`). Engineer picks the window (~last
  several seconds of the phase) + curve. **Visual-only** — the gameplay/spawn `fogVisRadius :15332` may keep
  snapping (Josh's note is about the *vision effect* appearance). Knob: transition duration.

- ✅ ✨ **#8.2 — Default out-of-combat HP regen: 3 HP/s after 10 s without taking damage** — **done ENG
  2026-06-12** (alongside #8.8 — shares the `_lastDmgFrame` stamp added to `gDamagePlayer`). In `gUpdatePlayer`'s
  HP-regen block: `_hpOoc = gOutOfCombat(p) ? OOC_HP_REGEN : 0` (**3/60 = 3 HP/s**, gated on **no damage taken AND
  none dealt** — mana use irrelevant), added to the card `hpRegenAdd` flat regen; clamped to `maxHp`.
  Per-player local, MP-safe. Knobs: `OOC_HP_REGEN`, `OOC_REGEN_DELAY` (shared 10 s delay w/ #8.8). **Juice tell:**
  `gSpawnRegenMote(p)` spawns one heal-green `#7CFC9E` mote per 12 frames (~5/s) at a random lower-body offset with
  an upward `vy` (−0.6…−1.0) + longer `life`, via `spawnGPCustom`; fires only while `_hpOoc>0 && _healing` so it
  **stops the instant** a hit lands (resets `_lastDmgFrame`) or HP fills. Reuses the `gParticles`/`MAX_PARTICLES`
  budget. `node --check` ok. **10 s gate resets on ANY hit (incl. chip)** — flag for Josh if real-hits-only wanted.

- ◻️ 🟢 **#8.1 — LOS reveal: fade trees that hide enemies near the player** — extend the canopy-fade in
  `gDrawTree` (`:9214`; the want-fade test `:9226` currently only checks the **player's** foot `px,py`;
  `TREE_FADE_ALPHA :9207`) so a tree also fades when its canopy box covers **any live enemy within an LOS
  radius of the player** (an invisible reveal circle ~the player's head, `LOS_R` ~3 tiles/~110 px — knob).
  Reuse the existing fade mechanism (don't outline the enemy — just fade the occluding canopy, same as
  player-occlusion). Keep it cheap: only for trees already in the draw cull, iterate `gEnemies` once.
  Render-only, no sim/MP impact. *(Small new mechanic — Josh-directed; combat-readability, pillar 1.)*

- ◻️ ✨ **Item 10 — Card-pool consolidation (~33 → ~23 cards)** (↳ from PM, Josh-approved 2026-06-12 · spec
  [`specs/card-pool.md`](specs/card-pool.md)) — collapse the per-skill stat sprawl into broad **character stats**
  + one **Mastery** card per active skill. Merge mapping (full table + balance + grounding in the spec):
  - **Merges:** `crit`+`critdmg` → **Ferocity** (both crit stats, one card); `sw-dmg`+`hv-dmg` → **Strength** (+%
    melee dmg to swing **&** heavy — new `wildBuffs.meleeDmgPct` read in `gDoSwingAt`+`gDoHeavyAtk`, stacks on
    Bloodlust's global `damagePct`; frame as a character stat — Josh may grow it into a major stat later);
    `sw-reach`+`hv-rad` → **Reach** (swing-reach + `heavyLen` in one); `sw-spd`+`hv-chg` → **Dexterity** (= the
    Attack-Speed card above).
  - **Mastery (multi-mod rank-aware apply — mirror `cil-dof` `:14233`):** **Whirlwind Mastery** (`ww-dmg`+`ww-rad`
    +`ww-cd`) · **Leap Mastery** (`leap-*` ×4) · **Dash Mastery** (`dash-dist`+`dash-cd`). One card advances the
    skill's whole mod-bundle per pick.
  - **Removes** the 15-card `cat:'skill'` block (→ 3 Mastery + the swing/heavy stats folding up into Strength/
    Reach/Dexterity). **Confirm nothing else reads the vanished ids.** Grit (4) + Patron/Cilia (3) untouched.
  - **Design-ahead hooks (don't build now):** Mastery cards may get **evolutions** later; **Strength/Dexterity**
    may graduate into **major character stats** — build the consolidation so those are additive.
  - **Sim/MP:** rides the existing `cardPicks`/`gDrawCards` plumbing (only ids change). Update `_paintDraft` icon
    `iconKey` mapping + `CARD_ICON_ART` for the new ids (levelup-screen.md). **Verify:** `node --check`; draft each
    new card → Strength buffs swing+heavy, Reach extends both, Ferocity grants both crit stats, each Mastery
    advances its bundle; no dangling reads. **Pairs with the Attack-Speed/Dexterity task above** (build together).

- ◻️ ✨ **Item 9 (Cilia slice) — God Stat Identities: wire Cilia's burn-explosion to crit** (↳ from PM,
  Josh 2026-06-12 · spec [`specs/god-stat-identities.md`](specs/god-stat-identities.md)) — rewire the
  Conflagration burn-explosion (item 0c) to run on **crit stats** instead of the bespoke `burnExplodeChance`:
  - **(1) Explosion chance per burn tick ← `critChance`** — in `gUpdateEnemyBurn` (`index.html:6419`, roll at
    `:6432`) source the per-tick detonation chance from `gPlayer.wildBuffs.critChance` (0–0.75) instead of
    `wildBuffs.burnExplodeChance`. **Tune:** 75%/tick (~every 0.4 s) is very chainy — likely scale it
    (`critChance × f`) so it reads as a satisfying cascade, not a constant chain. Judge live.
  - **(2) Explosion damage ← crit damage** — in `gBurnExplode` (`:6396`) the blast is `max(4, round(_burnTickDmg
    × 4))` (`:6403`); scale by the crit multiplier `(CRIT_BASE_MULT + wildBuffs.critDamage)` instead of the flat
    ×4 (pick a coefficient so a no-crit Cilia still detonates modestly, a crit build detonates hard).
  - **(3) Repurpose the `cil-conflag` "Conflagration" patron card** (`:14103`) to **"+explosion radius & chain"**
    (DECIDED, Josh 2026-06-12 — not a fork). Old job (`burnExplodeChance`) is gone (chance = crit now). It now
    adds **+explosion AoE radius** (bigger blast in `gBurnExplode`) **and +chain re-ignite** (wider/stronger
    re-ignite at `:6414` — e.g. larger chain radius and/or stronger/longer re-applied burn). New buff(s) (e.g.
    `burnExplodeRadius` / `burnExplodeChain`, your knobs). **Remove the now-dead `burnExplodeChance` buff**
    (factory `:3424`/`:15177`, reset `:16475`) **and its Statforge row** (`:16439`). Result: crit cards →
    detonation frequency + power; Conflagration → reach + chain. Searing Heat / Lingering Flame unaffected.
  - Host-authoritative (burn resolves host-side) → no MP change. **Verify** on the training dummy / a burning pack:
    crit cards now drive detonation frequency + blast size; zero-crit Cilia still chains modestly.

- ◻️ ✨ **Attack Speed — promote to a first-class CHARACTER stat** (↳ from PM, Josh 2026-06-12 · resolves the
  item-9 Ikras gap, spec [`specs/god-stat-identities.md`](specs/god-stat-identities.md)) — add a new
  `wildBuffs.attackSpeed` (%) character stat that **(1) speeds the normal attack** (more swings — reduces
  `swingCd`) and **(2) speeds the heavy charge** (faster windup — reduces `heavyMaxWindup`). The engine already
  has both pct-reduction hooks routed through **`pSkillSpeed` (`:2650`)**: swing rate at `:4597`
  (`pSkillSpeed(p,'swingCd','swingSpdPct')`), heavy charge at `:4392`
  (`pSkillSpeed(p,'heavyMaxWindup','heavyChgPct')`). **Cleanest wiring:** fold the character `attackSpeed` % into
  `pSkillSpeed`'s divisor for those two keys (`v = base / (1 + (skillPct + attackSpeed)/100)`) so it **stacks**
  with the existing skill-stats and the `SKILL_STAT_FLOOR` clamps (`swingCd:18`, `heavyMaxWindup:36`) keep it from
  zeroing out. Affects **swing + heavy only** — *not* cooldowns (CDR/`cdPct` owns those); heavy = charge speed,
  not its post-fire `heavyCooldown`.
  - **New passive card — "Dexterity"** ⚡ **"+X% Attack Speed"** (named per the card-pool consolidation, was
    "Frenzy"), ~**+7%/pick** (tune), **uncapped**. Add to `PASSIVE_CARDS` + the town/dev card list (`:15221`-area)
    + factory init (`:3422`) + run-start reset (`:15175`) + the Statforge dev block. **This card IS the Dexterity
    slot of the consolidation** ([`specs/card-pool.md`](specs/card-pool.md)) — it **replaces** the removed Swing:
    Tempo (`sw-spd`) + Heavy: Quickdraw (`hv-chg`) skill cards. **Build it as part of the consolidation rebuild below.**
  - **Char-screen display:** add an "ATK SPD" stat to the character panel alongside CRIT/MOVE/CD (~`:12535–12554`).
  - **Forks to flag (Josh's feel call):** **(a)** the swing *cooldown* (`swingCd`) is the primary "more swings"
    lever, but at high attack speed the swing *animation* (`swingDur 10f`) becomes the floor of the cycle — to keep
    scaling past ~2.5×, optionally also scale `swingDur` lightly (engineer judges feel; don't over-shorten the
    anim). **(b)** card value/curve — +7%/pick is a starting guess; tune so a committed attack-speed build feels
    fast but the floors keep it sane. *(name resolved: **Dexterity**.)*
  - **Ikras tie-in:** this IS the stat Ikras's identity pulls (item 9) — works on the base sword kit now; Ikras
    inherits it. Host/local; the swing/heavy timing is already local → no MP change. **Verify:** `node --check`;
    stack Dexterity → confirm faster swings + faster heavy charge, both clamped at the floors; char screen shows ATK SPD.

- ◻️ 🔧 **Apply the `assets/world` fold (atomic move + manifest rewrite)** (↳ from ART, 2026-06-12 ·
  Josh-approved) — `assets/world/` is flat and filling up (one area's set-dressing so far). Scheme
  (`assets/README.md`): **`world/` by AREA + `_shared/`**. **`tile/` stays FLAT** — decided, not foldered (spec
  [`specs/asset-area-namespace.md`](specs/asset-area-namespace.md); type is already in the id). Tooling done &
  dry-run CLEAN (44 files, every one mapped). **You run `--apply`** (sole `index.html` editor); it does `git mv`
  + `ART_MANIFEST` path rewrite in one commit — keys unchanged, paths only.
  ```
  python tools/fold-assets.py --domain world --apply   # 44 files -> _shared/ goblin-forest/ sanctum/  (22 manifest paths rewritten, 22 unwired just moved)
  ```
  Self-verifies every `assets/world/` path resolves post-rewrite; then `node --check` the extracted `<script>`
  + `python dev.py` → all world props still render (a missed path 404s → silent procedural fallback).
  **Do this BEFORE wiring the new forest assets below** (the `world.*` snippets cite the foldered paths; the
  `tile.forestgrass.*` snippet stays flat). Deploy-affecting → push with Josh's auth. *`world.tree.*`/
  `treesmall.*`/`foresttree.*` move under `world/goblin-forest/`; barrel/crate/chest/favorcoin under
  `world/_shared/`.* **Pairs with the B+ task below** — this fold is B+'s data source (gInitArt reads the
  `world/<area>/` path segment), so land it first.

- ◻️ 🔧 **Asset-area namespace — B+ impl** (↳ from ART, 2026-06-12 · **APPROVED by Josh 2026-06-12** · spec
  [`specs/asset-area-namespace.md`](specs/asset-area-namespace.md)) — make *area* a machine-queryable + runtime
  dimension, not just a folder. **B+:** in `gInitArt` (`~index.html:8034`), after resolving each entry's path,
  parse the `assets/world/<area>/` segment into runtime maps `gAssetArea[key]=area` + `gAreaAssets[area]=[keys]`
  (~5–8 lines, **pure addition — no key or draw-site changes**); entries not under a `world/<area>/` folder →
  `'shared'`/skip. That makes area queryable at runtime and sets up **per-area asset load/unload** (`gLoadArea`/
  `gUnloadArea`, gated so only the active area + `shared` load at boot — **defer the loader until a 2nd area
  exists**; land the map now). Depends on the `world` fold above (the path segment is the data source). Options
  A (area-in-key) and C (generated `AREA_MANIFEST`) are speced + parked — A rejected, C revisit at area #2.

- ◻️ 🎨 **Wire forest-tree set + forest-grass tiles + barrel/crate props** (↳ from ART, 2026-06-12) — four new
  asset families sliced & committed under `assets/`. All **new ids** (non-destructive — Josh's call: add, don't
  replace the existing `tree-*`/`grass-*` sets). **The `world.*` snippets use POST-FOLD foldered paths** (do the
  `world` fold task above first; if you wire before folding, drop the `<area>/` segment and the fold rewrites it).
  **The `tile.forestgrass.*` snippet is FLAT** (tiles aren't foldered — decided).
  <details><summary>detail (render spec)</summary>

  **1. Forest trees — `world.foresttree.0..8`** (9 files, ~605 KB, `assets/world/foresttree-<n>.png`). A 3rd tree
  family alongside `world.tree.*` (large) + `world.treesmall.*`. **Same pipeline & framing as `tree-*`:** 256²
  cell-framed canvas, bottom-anchored to **foot fraction ~0.94** (uniform across all 9) — so they draw through the
  **same `gDrawTree` feet-anchored world-prop path and share `TREE_FOOT≈0.94`**, no new draw code. Sliced with the
  `--bleed 50` overflow recovery (full canopies, no flat tops — QA contact CLEAN). Paste:
  ```
  'world.foresttree.0':'assets/world/goblin-forest/foresttree-0.png', 'world.foresttree.1':'assets/world/goblin-forest/foresttree-1.png',
  'world.foresttree.2':'assets/world/goblin-forest/foresttree-2.png', 'world.foresttree.3':'assets/world/goblin-forest/foresttree-3.png',
  'world.foresttree.4':'assets/world/goblin-forest/foresttree-4.png', 'world.foresttree.5':'assets/world/goblin-forest/foresttree-5.png',
  'world.foresttree.6':'assets/world/goblin-forest/foresttree-6.png', 'world.foresttree.7':'assets/world/goblin-forest/foresttree-7.png',
  'world.foresttree.8':'assets/world/goblin-forest/foresttree-8.png',
  ```
  - **Wiring (your call):** to make them appear, either extend `gWildTrees` placement to pick from this family too
    (add a per-tree `family:'tree'|'treesmall'|'foresttree'` + variant index, `gDrawTree` selects the keyspace) or a
    separate scatter pass. `gInitArt` will count `world.foresttree.*` like any variant set. **Size-coupling:** shares
    `TREE_FOOT≈0.94`; give it its own `TREE_BASE`-equivalent / per-family scale if it should read larger/smaller than
    the existing trees. These are taller "real forest" trees (fir/pine, willow #3, banyan #2, oaks/maples) — likely
    intended to dominate the Goblin Forest; Josh may later want them to *replace* `tree-*` (then just repoint the
    `world.tree.*` keys — drop-in).

  **2. Forest-grass tiles — `tile.forestgrass.0..8`** (9 files, ~157 KB, `assets/tile/forestgrass-<n>.png`). Opaque
  **96² RGB full-bleed** (matches the live `grass-*` treatment exactly — grass edge-to-edge, verified tiles
  seamlessly with no dark-edge grid). A darker, lusher forest-floor grass (flowers, dirt patches, rocks). Paste:
  ```
  'tile.forestgrass.0':'assets/tile/forestgrass-0.png', 'tile.forestgrass.1':'assets/tile/forestgrass-1.png',
  'tile.forestgrass.2':'assets/tile/forestgrass-2.png', 'tile.forestgrass.3':'assets/tile/forestgrass-3.png',
  'tile.forestgrass.4':'assets/tile/forestgrass-4.png', 'tile.forestgrass.5':'assets/tile/forestgrass-5.png',
  'tile.forestgrass.6':'assets/tile/forestgrass-6.png', 'tile.forestgrass.7':'assets/tile/forestgrass-7.png',
  'tile.forestgrass.8':'assets/tile/forestgrass-8.png',
  ```
  - **⚠ NOT auto-wired.** `gTileArt` only maps `TILE_FLOOR→'floor'`, `TILE_DIRT→'dirt'`, `TILE_GRASS→'grass'`. A new
    `forestgrass` family needs a `gTileArt` mapping for whatever tile id should use it (a new `TILE_FORESTGRASS`
    constant for a forest biome, **or** repoint `TILE_GRASS→'forestgrass'` if it's meant to be the wilderness grass).
    `gInitArt` auto-counts `tile.forestgrass.*` into `gTileVarCount` once the keys exist; variant selection uses the
    `gWallVar` table (not a coordinate hash). Opaque ground → normal `gTileArt` blit-and-return (no overlay/ground-
    beneath needed).

  **3. Barrel + crate props — `world.barrel` / `world.crate`** (`assets/world/barrel.png` 186×256 74 KB,
  `assets/world/crate.png` 204×256 75 KB). Transparent cutouts, white-bg removed + halo eroded (QA magenta CLEAN,
  metal-band highlights intact). **`barrel.png` overwrote the old 39×43 unwired placeholder** with a crisp HiDPI
  cutout; **`crate.png` is new.** Paste:
  ```
  'world.barrel':'assets/world/_shared/barrel.png', 'world.crate':'assets/world/_shared/crate.png',
  ```
  - **Wiring:** single overlay props (tall transparent cutouts → draw ground first, composite on top; same family as
    the chest/rock overlay path, feet-anchored by the bottom of the opaque pixels). Need a draw hook + placement
    (town set-dressing and/or wilderness scatter — a PM/Josh placement call; see the unwired-Sanctum-props task).
    **Raster → HiDPI:** draw at `devicePixelRatio` (`_prepHiDPICanvas`/`<img>`). Suggested draw size ~28–40 px tall;
    tune in-game (engineer's knob). If barrel/crate become destructible loot containers that's a systems call, not
    part of this art handoff — décor by default.

  **Verify (all):** `node --check` + grep each new key resolves to a file + `python dev.py` → foresttrees show full
  canopies feet-on-ground & mix with the other trees; forestgrass tiles blit seamlessly; barrel/crate composite
  cleanly over ground (no white halo). Source masters committed: `art/world/forest trees.png`, `art/tiles/forest
  grass.png`, `art/world/barrel.png`, `art/world/crate.png`.
  </details>

- ✅ 🎨 **Wire `fx.fireexplosion` — single fire-burst FX sprite** (↳ from ART, 2026-06-12 · **done ENG
  2026-06-12**) — wired as a one-shot **bloom** FX on the **Conflagration burn-tick detonation** (`gBurnExplode`,
  Josh's call): `gFireBursts` list + `gSpawnFireBurst`/`gUpdateFireBursts`/`gDrawFireBursts` (mirrors `gFireRings`).
  Sprite blooms **centre→edge** (ease-out, diameter `0.3r→2r`) then fades, **additive** (`'lighter'`), sized to
  `BURN_EXPLODE_R×1.15`. Loaded via a direct `Image` const (`FIREEXPLOSION_SPR`) like the fire-FX family — **not
  the manifest** (the fire-draw code uses direct consts). Host-spawned, **synced to co-op clients** via a new
  bounded `world/fx` set()-stream (`Net.sendFx`/`_onFxUpdate` + `gNetFx` rolling list + `gBurstAndSync`;
  id-deduped, history-baselined on join); procedural-disc fallback. `node --check` + an extract-eval canary of
  the client dedup verified.
  <details><summary>original handoff (Artist)</summary>

  one new transparent FX cutout committed at `assets/fx/cilia/fireexplosion.png` (256², ~88 KB; radial fire burst,
  bright white-hot core, flying embers/debris). A **single key** like `fx.thrust`/`fx.slash`. Original paste:
  ```
  'fx.fireexplosion':'assets/fx/cilia/fireexplosion.png',
  ```
  - **Compositing:** it's a **transparent cutout** (no black bg), so it draws fine alpha-composited — but for
    fire-over-scene a hot glow reads best with `globalCompositeOperation='lighter'` (additive; transparent areas
    contribute nothing, flame pixels add). Engineer's call; additive recommended.
  - **Use (open — PM/engineer call):** it's in the **Cilia** kit; natural homes are a one-shot **impact burst**
    (Cinderburst nova / Chaos Crown blast / a generic fire-hit pop), drawn for a short life with a quick
    scale-up + fade. Not wired to anything yet — this handoff is just the clean asset + key; *where* it fires is
    a design decision. No size-coupling to a hitbox unless it's bound to a damage radius (then scale the draw to
    that radius).
  - **Raster → HiDPI:** standard FX blit; draw size is a tunable (an impact pop ~64–140 px; a big nova larger).
    256² source covers a generous on-screen size. **Verify:** `node --check` + grep the key resolves to the file
    + `python dev.py` → trigger wherever wired; burst composites cleanly (no white halo), embers read.
  - *Tool:* new `tools/slice-single-fx.py` (one-cell `cut_cell`+`recover_specks` wrapper; slice-variants is
    3×3-only). Source master `art/fx/cilia/fire-explosion.png`. *(The older 9-variant `art/fx/cilia/fire-explosions.png`
    sheet is separate and unsliced — ping ART if a full explosion variant set is wanted too.)*
  </details>

- ◻️ 🎨 **Wire `fx.jumpimpact` — leap-landing impact shockwave** (↳ from ART, Josh 2026-06-12) — Josh: the
  `jump-impact` sprite should play on the **leap (`gFireLeap`) landing**. Verified it was **never wired** (master
  `art/fx/_shared/jump-impact.png` existed; no cutout in `assets/`, zero `index.html` refs). Now sliced & committed
  at `assets/fx/_shared/jump-impact.png` (256², ~47 KB; radial ground shockwave, bright white-hot core + spike
  ring). A **single key** like `fx.thrust`/`fx.slash`. Paste:
  ```
  'fx.jumpimpact':'assets/fx/_shared/jump-impact.png',
  ```
  - **Compositing: it's a black-bg light burst → additive `globalCompositeOperation='lighter'`** (the
    `FP_SPR`/`FW_SPR` pattern — black drops out, the shockwave glows; the soft radial glow a hard alpha cut
    would clip is preserved). Background is floored to true black (corners = 0,0,0 — QA'd, **no square wash**).
    Load it the same way as `FT_SPR` (`new Image(); .src='assets/fx/_shared/jump-impact.png'`) + the `haveSpr`
    guarded-fallback pattern.
  - **Where it fires:** the **"Impact VFX" block at `index.html:~4255`** (inside `gFireLeap`, at `lp.timer >=
    flightDur` landing) — currently spawns only `spawnGP` particles. Spawn the sprite there at `p.wx,p.wy`,
    **keep the existing particles** (they read as debris kicked up over the flat shockwave). It already
    `gShake`s on landing — the sprite is the missing visual core.
  - **Draw intent:** one-shot, **drawn flat/centered** on the landing point (the art is already a top-down
    ground ellipse — wider than tall in perspective — so **no rotation, no y-squash** needed; draw it as a
    centered square box and the perspective is baked in). Short life ~16–22 frames, scale ~0.5×→1.1× with alpha
    1→0 (quick pop + fade). **Size:** the bright ring spans ~0.9× the sprite width, so a draw box ≈ **`2.5 ×
    leapRadius`** (`leapRadius`=60 → ~150 px box) lands the ring around/just outside the damage zone — a live
    knob; tune in-game. **Size-coupling:** the box should scale off `leapRadius` so the visual tracks the hit
    zone if the radius is ever retuned (not a hard hitbox couple — the damage circle is the source of truth).
  - **Raster → HiDPI:** standard additive FX blit; 256² source covers a generous on-screen size at 2× DPR.
    **Verify:** `node --check` + grep the key resolves to the file + `python dev.py` → leap → on landing the
    shockwave pops additively over the ground (no square halo), scales/fades, and reads as a ground impact.
  - *Tool:* resize+true-black-floor+optimize of the 1254² master via Pillow (single light-on-black sprite — no
    cutout needed; additive compositing IS the "background removal"). Master `art/fx/_shared/jump-impact.png`.

- ✅ 🎨 **Wire SMALLER tree sprites + formation-based forest** (Josh, 2026-06-12) — **done 2026-06-12.**
  Re-used the occluding-prop system as-is (`gWildTrees`/`gDrawTree`/`gRCTrees`). Wired the `world.treesmall.0..8`
  set; small trees render smaller via a smaller draw `scale` (both sets are cell-framed to fill the 256²
  canvas — measured: small art is NOT smaller within its canvas, so scale is the only lever). Replaced the
  per-tile scatter with **three weighted formations** per Josh's rule (small-tree cluster ≫ large+cluster >
  lone large), anchors min-separated so stands read as distinct. `TREE_FOOT` 0.93→0.94 (re-measured uniform
  foot, both sets). Knobs documented inline. Verified: `node --check` + greps; visual check pending Josh's
  eyeball (`python dev.py`).

- ✅ 🎨 **Wire world TREE props — 9-variant scatter set** (↳ from ART, 2026-06-11) — **done 2026-06-11.**
  Wired as a new off-grid scatter-prop family mirroring `gRocks`: 9 `world.tree.<n>` manifest keys →
  `gWildTrees` (reset with the other run state) → placed in `generateWildernessMap` step 4c (seeded RNG, so
  MP-deterministic) on open grass clear of spawn/shrine/villages/obelisks/camps/forest, with a min-separation
  → returned as `kind:'tree'` entities, unpacked at load → drawn by `gDrawTree`, **depth-sorted in the y-sort
  `drawables`** so the player tucks behind a canopy / in front of a trunk. Feet-anchored via a **measured**
  `TREE_FOOT=0.93` (opaque base sits ~0.93 down the 256² canvas — measured all 9, not eyeballed); HiDPI smooth
  draw + procedural fallback. **Décor only — draw-only, no collision** (the spec's fork).
  **Revision (Josh, same day):** the painted trees **replace the procedural `TILE_TREE` forest**, not a
  separate open-field scatter — placement now samples FOREST tiles (`TREE_DENSITY=0.10` per forest tile,
  seeded), and the `TILE_TREE` tile draw became **shaded forest floor** (procedural canopies + the
  `_TC_TREE_*` palettes deleted). Slow-zone/walkability unchanged (still keyed off the tile id). **Live knobs
  for Josh to tune:** `TREE_DENSITY` (forest density), `TREE_BASE` (draw size), per-tree `scale` 0.7–1.1.
  **Follow-ups now done (Josh, 2026-06-12):** (1) **trunk collision** — `gRCTrees` (mirrors `gRCRocks`) with a
  player-sized trunk circle (radius = `TREE_BASE·scale·TREE_TRUNK_FRAC`, so it tracks draw size), wired into
  all 4 player collision paths (walk/dash/heavy-lunge/swing-lunge); player-only (enemies still pass through —
  available extension). (2) **canopy fade** — in `gDrawTree`, a tree that draws in front of the player and
  whose canopy box covers the player's foot eases to `TREE_FADE_ALPHA` (0.3) so it never hides the hero
  (eased per-tree via `t._a`; render-only). (3) **2× size** — `TREE_BASE` 150→300 (density left at 0.10; the
  small/sparse trunks keep it walkable — drop `TREE_DENSITY` if the canopy reads too thick). Browser canary
  (`Sim.batch`) not run (render + player-collision only, no sim-step coupling).
  <details><summary>detail (render spec)</summary>

  Art committed: `assets/world/tree-0..8.png` (9 interchangeable tree variants — oaks, a willow (#3),
  banyans; each a transparent cutout incl. its own rocky/grass **base**). Sliced from `art/world/trees.png`
  (3×3, `--bg white --frame cell --global`, source 1254² → 418px cells → resampled to **256×256**), magenta
  + over-green QA CLEAN. ~96–119 KB each (~961 KB total).
  - **Manifest keys** (paste as-is): `'world.tree.0':'assets/world/tree-0.png'` … `world.tree.8` (the new
    **`world` keyspace** — a world-prop *variant set*, analogous to `tile.grass.<n>` but NOT a ground tile;
    `gInitArt` loads them like any manifest path).
  - **NOT a tile — overlay/world-prop path.** A tree is a tall transparent cutout drawn *over* ground, not a
    `gTileArt` ground blit. Ground draws first; the tree composites on top (same family as the rock/spike
    `gTileProp` overlay, but trees overflow a tile cell — they're scatter props, not cell-bound).
  - **Placement (your call — the fork):** most natural is a **wilderness scatter** (Goblin Forest) — random
    positions + **random variant** of the 9 (reuse the `gWallVar`-style table or a position hash `% 9`), drawn
    feet-anchored. Alternative: discrete placed obstacles. Whether a tree **collides** (blocks movement at the
    trunk base, ~not the full canopy bbox) is a gameplay/systems call — if it's décor, draw-only; if an
    obstacle, add a small base-radius hitbox. **Size-coupling:** any collision radius ↔ draw scale move together.
  - **Anchor:** cutouts are **cell-framed**, so within each 256² canvas the trunk base sits at the lower-middle
    (transparent padding above canopy + below base), and **relative scale is preserved** (some trees are
    naturally bigger — intended variety). Feet-anchor by the **bottom of the opaque pixels** (the base), not the
    canvas bottom. Suggested draw size: tune in-game; start ~96–160 px tall over the wilderness grass.
  - **Raster → HiDPI:** draw at `devicePixelRatio` (`_prepHiDPICanvas`/`<img>`, not an undersized backing
    store). Source held to **256 px** for payload; that covers ~128 px render @2× DPR. If trees need to render
    larger/crisper, ping Artist for a **`--size 0`** re-slice (418 px native, ~290 KB each).
  - **Verify:** `node --check` + grep each `world.tree.<n>` key + `python dev.py` → trees scatter over the
    wilderness, variants mix, feet sit on the ground, canopies composite cleanly over grass (no white halo).
  </details>

- ✅ **Heavy charge locks out the normal swing** (↳ from PM playtest, 2026-06-11 · roadmap #6 `approved`) —
  **done 2026-06-11.** Added one guard at the `gDoSwingAt` chokepoint (`index.html:3545`): early-return while
  `heavyWindingUp || heavySwinging`. All three swing-trigger paths (mousedown, LMB-held repeat, pending buffer)
  funnel through `gDoSwingAt`, so the single guard covers the whole "until the heavy resolves" window (charge →
  swing → recovery), not just the windup. **Drop, not queue:** a click mid-heavy is eaten; the LMB-held repeat
  naturally resumes once the heavy clears, so holding through a heavy still feels right. **Why:** weighty-combat
  directive (Josh, standing) — a committed action must compromise other options.

- ✅ ✨ **Item 7 — Mana economy & skill management** (↳ from PM playtest, 2026-06-11 · roadmap #7 `approved` ·
  spec [`specs/mana-economy.md`](specs/mana-economy.md)) — **done 2026-06-12, all three phases.** Mana is now a
  real shared resource funding both the class kit and the god layer.
  - [x] **Phase 1 — class mana + cooldown rebalance** — `WeaponRegistry.sword` (registry **and** the `sw.*`
    run-start reset block, which re-clobbers `ww*`/`leap*` — both edited): leap `35→45` mp & CD `200f→900f`
    (15 s, CD-led); WW drain `0.08→0.30`/f (18/s, mana-led) & CD `120f→300f` (5 s) + power bump `wwDamage 22→30`,
    `wwRadius 36→44`; heavy `25→30`; dash `15→18`. Benchmark **leap + ~3 s WW ≈ empties 100 pool** ✓.
    `SKILL_STAT_FLOOR` confirmed sane (floors unchanged). Dash/heavy CDs left as-is (flagged for Josh). Live knobs.
  - [x] **Phase 2 — God Skills drain mana/sec, rank-scaled** — added `mpCost` (mp/**sec**) to
    `IMBUE_PATHS.cilia.burningBody` `base`(1.67)/`waveStep`(0.15)/both `formStep`s(0.2); auto-scales via
    `gGodFireParam` (the rank-up card pours *all* step keys → no special-casing). Maxed ≈2.92 mp/s. Drain paid
    centrally in the dispatcher (Phase 3) as `gGodFireParam(p,id,'mpCost')*dt/60`.
  - [x] **Phase 3 — toggle/hotkey + HUD + Sim hooks** — per-player `godSkillOrder`/`godSkillOff`/`godSkillDormant`
    (factory init + run-start reset). **Architecture call:** payment is **central in `gUpdateGodSkills`** (pay in
    key order 1→9, then fire), not inside each tick — exactly what "pay lowest-key-first, dormant-on-starve"
    needs, and keeps tick functions pure (the spec's "drain in gTickBurningBody" was grounding, not
    prescriptive). Acquisition order built **lazily** in the dispatcher (no per-acquire-site hook). `keydown`
    1–9 → `gToggleGodSkillByKey`. Signature-gated DOM chip row (`#g-godskills`) by the MP bar:
    key · icon · mp/s · lit/dormant(⚠)/off(✕). **Starvation = dormant + auto-resume, lowest-key-last** ✓.
    **AI-native:** `Sim.toggleGodSkill(n)` + `Sim.act({toggleGodSkill})`; `observe().player.godSkills[id]` now
    carries `{key,active,dormant,mpCostPerSec}` (+ existing `mp`).
  - **Verified:** `node --check` clean; no function shadowing; **extracted the real dispatcher functions and
    drove pay/dormant/auto-resume/key-order in Node** (6 behavior assertions pass — stronger than batch for the
    new logic). ⚠ **In-browser canary pending** (`Sim.batch(3)` + manual: acquire 2 god skills → over-commit mana
    → watch high-key go dormant + auto-resume → toggle with 1–9) — needs a live browser; run before tagging.
    Committed locally (deploy-affecting — awaiting Josh push auth).

- ✅ 🎨 **God-Skill Action Bar — upgrade the shipped HUD chip row** (↳ from PM, Josh-approved 2026-06-12 · spec [`specs/mana-economy.md`](specs/mana-economy.md) Phase 3 "God-Skill Action Bar") — **CORE done 2026-06-12.** Rebuilt `#g-godskills` from text chips into a **WoW-style slotted action bar** (`.gsb-slot` CSS, 34px slots): per-slot **hotkey badge** (corner), **skill icon**, **live per-second cost** (corner), and a **god-coloured border** as the state tell. States: **active** = patron's signature-colour border (`--gcol`); **dormant** = dim/grey + ⚠; **off** = grey + ✕; **poor** = red border + ⛔ (Max-MP can't cover the cost → "grow your mana"). **(3) Per-god signature colour = reused existing `IMBUE_GODS[god].col` datum** (Cilia `#ff7a22`; Boreas/Ikras/Bhumi already have theirs → future gods inherit free, verified). **(1) Real-icon hook wired** — each slot reads `CARD_ICON_ART[iconKey]` (iconKey = skill id) with the emoji as fallback; the art swap is now a 1-line `CARD_ICON_ART` add (see the icon-wiring task below — blocked on Artist). **STRETCH (animated god-particle border) deferred** — fast-follow, the static coloured border ships the functional tell. `node --check` + data-builder canary (signature colour, pool-too-small flag, iconKey). Deploy-affecting → push with Josh's auth.

- ◻️ 🎨 **Wire shared god-skill icons into draft card + action bar** (↳ from PM, 2026-06-12 · pairs with the Artist handoff + the action-bar task above) — once the Artist delivers the 3 Cilia skill icons, wire each as a `CARD_ICON_ART`-keyed asset used in **both** `_paintDraft` (the level-up card) **and** the `#g-godskills` slot — one asset, two sites (no duplicate icon set). Confirm the draft cards + god skills carry a stable `iconKey` to key off (not `card.name`). Folds together with the existing "Level-up screen art-direction pass" image-icon override. **Action-bar consumer READY (2026-06-12):** the slot already reads `CARD_ICON_ART[iconKey]` (iconKey = god-skill id) with an emoji fallback — so the bar half is just **defining `CARD_ICON_ART` + adding the 3 icon assets**; then mirror the same `CARD_ICON_ART[card.iconKey]` lookup in `_paintDraft`.

- 🔄 ✨ **Item 2 — God Skills** (roadmap #2 `approved` · spec [`specs/god-skills.md`](specs/god-skills.md)) —
  phased trigger-swap, 3/5 done:
  - [x] **Architecture generalization** (2026-06-11) — imbue-path mastery machinery generalized from
    hardcoded-`'swing'` → keyed by god-skill id; draft cards registry-driven (`gGodSkillCards`); auto-fire
    dispatcher `gUpdateGodSkills` ticks owned skills from `gUpdatePlayer`. *Load-bearing — Trail/Pyroclasm are
    now ~a registry entry + one updater branch each.*
  - [x] **Burning Body** (2026-06-11, *redirected from "Pyre Waltz"* — Josh: fire = AOE burst + burn, not
    movement/pull) — base **ignite-aura** + Form @5 **Firebloom** (ring/5s) / **Cinderburst** (nova/4s) → 6–9 →
    Ascension @10 🐉 Dragonbreath/Dragonheart · 🔥 Chaos Crown/Cataclysm. `gTickBurningBody`, standalone dmg,
    ring system extended (breathe/settle/healOwner). Logic-verified; **feel-tuning live in playtest**.
  - [x] **Migration** (2026-06-11) — whirlwind/dash/heavy revert to plain (3 fire-spawn blocks deleted); shrine
    pledge sets `gPlayer.patron` (`#g-imbue-overlay` parked); **Dance of Fire retired-and-parked** (`IMBUE_PATHS.cilia.swing` + wave FX kept, unreachable).
  - 🔄 **Trail of Embers — EVOLUTION REWORKED (Josh 2026-06-12)** *(item 2 · spec [`specs/god-skills.md`](specs/god-skills.md) → "Trail of Embers")* — **⚠ the OLD tree is ALREADY BUILT** (commits `13acbdd` + `2d9ad66`, unpushed): base movement-trail + Forms **Inferno Wake** (hot single lane) / **Ember Shroud** (aura) + ascensions **Wyrmwake / Chaos Steps / Phoenix Mantle / Immolation**, all live in `index.html` (registry ~`14533`, ticks ~`4175`). **So this is a REVISION of just-shipped code, not a greenfield build.** Delta:
    - **KEEP unchanged:** the base movement-emit trail; **Chaos Steps** (the exploding-footsteps detonation, ~`3978`/`4234`) — mechanic stays exactly as built, but **relocate it in the tree** from Inferno Wake's 🔥 leaf → **Firesteps'** 🔥 leaf.
    - **CHANGE:** **Inferno Wake** (Form A) "hotter single lane" → the **cone emitter** — lay patches across a **widening arc behind the movement vector** (apex at player, fanning wider behind; tunable half-angle + length). **Wyrmwake** (🐉) reshapes with it → **dragonfire cone** (weave back to heal — heal logic already built; only the emit shape changes).
    - **NEW:** **Chaoswake** (Inferno Wake's 🔥 leaf, *takes the slot Chaos Steps vacates*) — a **chaosfire cone** that **NEVER spawns a patch on the player's tile** (by construction — patches offset *behind* the apex). · **Firesteps** (Form B, *replaces Ember Shroud's slot*) — the base **single line at higher damage** (concentrate vs Wake's distribute). · **Dragonfeet** (Firesteps' 🐉 leaf) — per-patch **2s fuse → dragonflame pillar** (reuse `gFirePillars`, dragonfire substance → heal-ground; stand in the pillars to heal).
    - **CUT — remove the built code:** **Ember Shroud** (Form B aura, `emberShroud` ~`14569`, tick ~`4199`) + **Phoenix Mantle** (`phoenixMantle` ~`14575`) + **Immolation** (`immolation` ~`14577`). Net Form B becomes Firesteps. (The aura concept is logged deferred in the spec — don't delete the *idea*, just the live tree code.)
    - **Mana (RESOLVED, Josh 2026-06-12):** Trail is now **all per-emit** (Ember Shroud was the only per-second Form — cut → no per-second anywhere). Per-rank cost+damage tables per **#8.9** (two independent tables, damage climbs faster than cost, step at each evolution). The **cone charges per-emit-TICK** (one charge/tick, *not* per individual patch in the fan → a wide cone isn't runaway-priced). HUD: effective mp/s while moving. Full model: spec → *Trail of Embers → Mana cost*.
    - **Verify:** `node --check` + in-browser canary (pledge → acquire Trail → rank → pick each Form → each ascension); confirm Chaoswake never burns a stationary player, Dragonfeet pillars heal, Chaos Steps unchanged.
  - [x] **Pyroclasm — built** *(item 2 · spec [`specs/god-skills.md`](specs/god-skills.md) → "Pyroclasm")* — **done ENG 2026-06-12.** Generic pool entry `IMBUE_PATHS.cilia.pyroclasm` (`kind:'pyroclasm'`) + `gTickPyroclasm` + `gPyroTarget`/`gPyroPushPillar`/`gPyroFireLane`/`gPyroFireWalls` + a `case 'pyroclasm'` dispatch → acquire/rank-up/forks/toggle/HUD all free. Every `PYRO_INTERVAL` (~3s) it **auto-aims at the nearest enemy** (`gPyroTarget`, ≤`PYRO_RANGE`; holds fire + charges nothing when none) and fires a lane of `gFirePillars`. **All per-emit** (one `mpLaneByRank` charge per lane; effective mp/s = cost÷interval = BB-parity 2→45). Damage = independent `pillarDmgByRank` (45× vs cost 22.5×); Firewall `dmgMult 0.35` (many pillars) vs Eruption `1.0` (few + a `PYRO_FINALE_SCALE`/`DMG` finale) keeps the totals balanced (ST nuke ≈ AOE spread). **Forms:** Eruption (colossal finale) / Firewall (`PYRO_WALL_COUNT` advancing perpendicular walls). **Ascensions** reuse substance grounds via `gPyroPushPillar`: 🐉 Wyrmspine (finale re-erupts `PYRO_REERUPT`× + dragonfire heal) · 🔥 Riftmaw (`PYRO_RIFT_SCATTER` erratic chaos pillars past the aim) · 🐉 Dragonmarch (dragonfire walls + heal carpet) · 🔥 Hellfront (+2 chaos walls). Plumbed per-pillar `burnDur` + `scale` through `gFirePillars` (legacy heavy callers fall back); pillars now also hit the training dummy (DPS-testable). `node --check` + economy eval verified. **All three Cilia God Skills now built (Burning Body · Trail of Embers · Pyroclasm).**
    - **↻ Active-aim rework (Josh 2026-06-12 — "let's test how this feels"):** dropped the auto-target; **Pillars of Fire is now MOUSE-AIMED.** Cadence **3s → 7s** (`PYRO_INTERVAL 420`). For the last `PYRO_TELEGRAPH` (180f/3s) before each fire, a **pulsing hitbox indicator** (`gDrawPyroTelegraph`, `PYRO_TELE_PULSES 3`) shows where every pillar will erupt, **rotating around the player to follow the mouse** (`p.angle`); it then fires there. Refactored the layout into a shared **`gPyroPlan`** (single source of truth → telegraph + fire always match) feeding `gPyroFire`; removed `gPyroTarget`/`PYRO_RANGE`/`gPyroFireLane`/`gPyroFireWalls`. Per-emit cost unchanged → at 7s cadence the HUD mp/s ~halves (e.g. ~19 mp/s rank 10). `node --check` ok. **Test knobs:** `PYRO_INTERVAL`, `PYRO_TELEGRAPH`, `PYRO_TELE_PULSES`.
  - [ ] **Burning Body Ascension refinement — Eye of Chaos + leaf swap** (↳ from PM playtest, 2026-06-11 · spec [`specs/god-skills.md`](specs/god-skills.md) rank-10 table) — in `IMBUE_PATHS.cilia.burningBody` (`index.html:~13547–13563`): (1) **Firebloom 🔥** leaf `chaosCrown` → **`eyeOfChaos`** ('Eye of Chaos'), new **`ringMode:'ebb'`** — a slow chaosfire ring that ebbs net-outward → pauses at max → thickens/intensifies → dissipates (new branch in `gSpawnFireRing` alongside `breathe`/`settle`, `~index.html:6089–6193`); no permanent ground-circle. (2) **Cinderburst 🔥** leaf `cataclysm` → **`chaosCrown`** ('Chaos Crown'), keep `novaScale` colossal blast + route to settle a chaosfire ground-circle (`_laySettleRing`/`gLayChaosfireRing`). Net effect = the two 🔥 leaves trade Form slots; Cataclysm name retired. **Balance:** Eye of Chaos self-burn must stay a *real but readable* cost (ebb sweeps back over you). Tune ebb curve + thickness live.
    **⟵ Footprint rule (↳ from PM, Josh 2026-06-12 · spec [`specs/god-skills.md`](specs/god-skills.md) "Chaosfire identity & the footprint rule"):** **no chaos ascension may spawn chaosfire ground directly under the player on activation** — the field blooms *around* a clear safe footprint anchored on the player (reuse the 38px bare-center safe zone, anchored on the player's position). Chaosfire identity = root yourself + devastate around you; the self-burn cost is *relocating* (crossing your own fire), not a kite-check. **Scope (resolved Josh 2026-06-12 · updated 2026-06-12):** rule applies to the **settled-ground** chaos leaves — now **only Chaos Crown** (here). *(Hellfront was reshaped to advancing chaos walls, Josh 2026-06-12 → movement-relative → it leaves the footprint scope.)* **Exempt:** **Eye of Chaos** (travelling band), **all of Trail of Embers** (movement skill), **Riftmaw** (erratic fissure), **Hellfront** (advancing walls). **Live fix needed (Chaos Crown only):** the `_laySettleRing` settle must keep a clear player-centered bare pocket (confirm it doesn't plant chaosfire under the player). Eye of Chaos needs **no** change for this rule.
  - **⚠ Verification gap:** `node --check` + greps + logic trace done; the **in-browser canary** (`await Sim.batch(3)` + manual pledge→acquire→rank→fork→ascension) is **not yet run** — needs a live browser. Run before tagging.
  - [ ] **🐉×🔥 Dragon–Chaos synergy — confirm + tune** (↳ from PM, Josh 2026-06-12 · spec [`specs/god-skills.md`](specs/god-skills.md) "Dragon–Chaos synergy" block) — dragonfire heal & chaosfire self-burn should **cancel** when the grounds overlap (stand in a chaos field on a dragonfire carpet → no net self-damage; enemies still eat full chaos dmg). **(1) Confirm** overlapping substance fields already sum both owner-effects on the player per tick (no "one field per tile" short-circuit) — likely already true (independent substance grounds, both shipped Slice C). **(2) Tune** the cancellation: shipped coeffs are dragon heal **0.18×** vs chaos burn **0.35×/tick** (don't cancel at 1:1 by design). **Open call (needs Josh):** one dragon ground fully cancels one chaos ground (raise heal → ~0.35×), or negation **scales with investment** (heal stays < burn → must build deep into dragon to zero it) — **PM rec: investment-scaled.** Build-craft: promotes the rank-10 fork to a cross-skill hybrid axis + a marquee co-op combo (chaos player + dragon ally). Reachable only once two ascensions can coexist (full god-skill system, post item 7).

- ✅ 🔧 **FX asset reorg — update the `.src` paths** (↳ from ART, 2026-06-11 · **done ENG 2026-06-11**) — all 9 `.src`/manifest paths repointed to the foldered structure (`cilia/`, `_shared/`), incl. the dragonfire/chaosfire circles. Verified every path resolves to a real file; zero bare `assets/fx/<file>.png` refs remain; `node --check` clean. **The index.html path fixes are now committed (`331ae61`) alongside the asset moves — both on `main` locally; push together (still unpushed).** Original handoff retained below. `assets/fx/` is now foldered **by owner** (`cilia/` for the fire-god kit, `_shared/` for god-agnostic FX) per `assets/fx/README.md`. Greppable old→new (sprite-var anchor; line numbers drift):
  | sprite/key | old `.src` | new `.src` |
  |---|---|---|
  | `FW_SPR` | `assets/fx/fw.png` | `assets/fx/cilia/wave.png` |
  | `FR_SPR` | `assets/fx/fr.png` | `assets/fx/cilia/ring.png` |
  | `FC_SPR` | `assets/fx/fc.png` | `assets/fx/cilia/cross.png` |
  | `FT_SPR` | `assets/fx/ft.png` | `assets/fx/cilia/ground-trail.png` |
  | `FP_SPR` | `assets/fx/fp.png` | `assets/fx/cilia/pillar.png` |
  | `fx.thrust` | `assets/fx/thrust.png` | `assets/fx/_shared/thrust.png` |
  | `fx.slash` | `assets/fx/slash.png` | `assets/fx/_shared/slash.png` |

  Not-yet-wired (use the new home when you wire them — no migration): `chaosfire-circle`/`dragonfire-circle` → `cilia/` (see the ground-circle task); `explosion-0..8` → `_shared/` (currently unreferenced — if they turn out to be the Cinderburst nova, move to `cilia/` and ping Artist). **Verify:** grep proves zero `assets/fx/<bare>.png` refs remain; `python dev.py` → all fire FX still render.

- ✅ 🔧 **Fold `assets/char/` by faction** (↳ from ART, 2026-06-11 · **done ENG 2026-06-11**, `f13ce54`) — 248 char sprites folded into `player/`(72) · `goblins/`(112) · `wolves/`(64) and the 200 manifest paths repointed in one atomic commit via `fold-assets.py --apply`. Verified: 0 flat files remain, every `assets/char` path resolves, the index.html diff is a pure char-path rewrite, `node --check` clean, renames 100% (history preserved). Hurt-pose handoff paths updated to `goblins/`·`wolves/`. **Phase 2 = same tool for `tile/`, later** (fill its `FAMILIES` map). Scheme: `assets/README.md`.

- ◻️ 🎨 **Level-up screen art-direction pass** (↳ from ART, 2026-06-11 · spec [`specs/levelup-screen.md`](specs/levelup-screen.md)) — bring `#g-stat-pick` to the reference mockups' fidelity. Already ~80% there structurally; the spec is a per-element redline splitting **CSS-only polish (P1, no new art — divider, engraved card frame, rarity-label flank, amber confirm fill)** from the painted-art layer. **Build P1 first** (biggest fidelity jump, engineer-only). Key enabler to wire: the **image-icon override** — in `_paintDraft` swap `<span class="sc-icon">${card.icon}</span>` for `<img class="sc-icon-art">` when `CARD_ICON_ART[card.iconKey]` exists (rarity ring stays CSS); **confirm cards carry a stable `id`/`iconKey`** (don't key off `card.name`). Art assets (icons/filigree/frame) land per the manifest as Artist follow-ups. Verify both themes (Cilia warm + nameless-knight cool).

- ✅ 🎨 **Chaosfire + dragonfire ground-circle sprites** (↳ from ART, 2026-06-11 · **done ENG 2026-06-11**, `331ae61`) — `CHAOSFIRE_CIRCLE_SPR`/`DRAGONFIRE_CIRCLE_SPR` (`assets/fx/cilia/`) threaded through the Burning Body ring/nova spawns (`spr:` field) and drawn additively per-substance. Original render spec below.
  <details><summary>detail (render spec)</summary>

  Replace the procedural fill in **`gDrawFireFields`** (~`index.html:5776`) for these substances:
  - **Load** (FR_SPR pattern): `const CHAOSFIELD_SPR=new Image(); CHAOSFIELD_SPR.src='assets/fx/cilia/chaosfire-circle.png';` + dragonfire; `const FIELD_SPR={chaosfire:CHAOSFIELD_SPR, dragonfire:DRAGONFIELD_SPR};`
  - **Draw:** per field, if `FIELD_SPR[f.substance]` is loaded → additive `drawImage(spr, ox-R, oy-R, 2*R, 2*R)` (R=`f.r`), `globalAlpha = fade` (× optional gentle pulse `0.85+0.15*Math.sin(gFrame*0.25)`), and **skip** the radial-gradient wash + FT_SPR scatter for that field (the sprite IS the fill). Keep the procedural path as fallback when unloaded (the `haveSpr` pattern, like `fr.png`).
  - **Sizing:** flame rim sits ~0.76·R, soft wisps ~0.92·R → `D=2R` reads as a natural soft-edged burning disc just inside the damage radius. No `FR_RING_FRAC`-style constant needed (it's a filled disc, not a band).
  - **Color shift is intentional:** new dragonfire art is **prismatic rainbow** (canonical dragonfire), replacing the old greenish-gold gradient (`:5790`); chaosfire = dark crimson (was the purple→red gradient `:5789`). Expect the new look.
  - **Scope:** substance-keyed → immediately upgrades the **Dance-of-Fire climax** field (the only current `gSpawnFireField` caller, `:5834`). To give **Burning Body's Chaos Crown** "great burning circle" (today a patch-ring via `_laySettleRing`) and **Dragonheart's** at-feet pool the same painted disc, route those through `gSpawnFireField` instead of patch-trails — **engineer's logic call**, flagged not done.
  - **Verify:** `node --check` + grep keys + `python dev.py` → trigger a chaosfire/dragonfire field; confirm the disc renders additively, scales with the field, fades out.
  </details>

- ✅ 🎨 **Burning Body fire-ring art upgrade — one-constant wiring** (↳ from ART, 2026-06-11 · **done ENG 2026-06-11**: `FR_RING_FRAC` set to 0.76; new ring art at `cilia/ring.png` live via the reorg) — `assets/fx/fr.png` replaced with a nicer hand-painted ring (wispier filaments + a subtle interior heat-haze, no longer hollow). **The only `index.html` change: `FR_RING_FRAC 0.59 → 0.76`**. The new ring's bright band sits at frac **0.759** of the half-width (old was 0.61); the draw already sizes `D = 2*traveled/FR_RING_FRAC` so the bright band lands at the damage radius — leave it at 0.59 and the visible ring renders ~29% larger than where it hits. No manifest/key/draw-loop change (same `FR_SPR`, now at `assets/fx/cilia/ring.png` — see the FX-reorg task for the `.src` path move; still black-bg `'lighter'`; background floored to true black so no square wash). Affects all ring modes (Firebloom / Dragonbreath breathe / Chaos Crown settle / remote-visual) — all fine. **Verify:** pledge Cilia → Burning Body → reach Form @5 Firebloom; confirm the bright band tracks the damage edge and the interior reads as warm haze. Source/tool: `tools/fx-ring-heatfill.py` (`--no-fill` cleans a baked-fill source), masters in `art/fx/cilia/burning-body-ring-*.png`.

- ✅ 🎨 **Wire the new `world.treesmall.*` tree set + verify re-sliced large trees** (↳ from ART, 2026-06-12) — **done 2026-06-12** (same change as the formation-forest task above). Wired all 9 `world.treesmall.*` keys; re-sliced large `tree-0..8` are drop-in (same keys/paths); set `TREE_FOOT=0.94` (re-measured uniform foot via PIL, both sets); small trees render smaller via a smaller draw scale (both sets fill their canvas, so scale is the lever). Mixed small + large via the new formation generator. `node --check` + grep verified; full-canopy/feet-on-ground visual check pending Josh.
  <details><summary>detail (render spec)</summary>

  **Two deliverables, both in `assets/world/`:**
  1. **Large trees `tree-0..8` re-sliced (top-clip fix)** — Josh flagged `tree-5..8` "sliced off at the top." Confirmed: the source canopies overflow their 3×3 cells upward (cells 6,7,8 by ~33px), and the old `--frame cell` crop clipped them. Re-cut with the new `slice-variants.py --bleed 50` (expanded-window + `keep_owner`), bottom-anchored. **Same `world.tree.<n>` keys + same `assets/world/tree-<n>.png` paths → DROP-IN, no manifest/draw change.** ~838 KB total (9 files, was ~960 KB).
     - **⚠ Size-coupling to verify:** new cutouts are bottom-anchored with the **foot at fraction ~0.94** of the canvas (uniform across all 9; was a measured 0.93). Set/confirm **`TREE_FOOT` ≈ 0.94** (a ~1.5px shift at TREE_BASE=150 — trivial, but check). Canvas is now sized to the *full* (taller) tree, so at the same `TREE_BASE` the trees render marginally smaller — **bump `TREE_BASE` a touch (~+8–10%, 150→~163) if they look small**, or leave it (live knob, Josh's eyeball).
  2. **New small trees `treesmall-0..8`** — a distinct smaller/bonsai tree set (incl. a willow), bottom-anchored to the **same foot fraction ~0.94** so they share `TREE_FOOT` with the large set. ~681 KB total (9 files). Paste these manifest keys:
     ```
     'world.treesmall.0':'assets/world/treesmall-0.png', 'world.treesmall.1':'assets/world/treesmall-1.png',
     'world.treesmall.2':'assets/world/treesmall-2.png', 'world.treesmall.3':'assets/world/treesmall-3.png',
     'world.treesmall.4':'assets/world/treesmall-4.png', 'world.treesmall.5':'assets/world/treesmall-5.png',
     'world.treesmall.6':'assets/world/treesmall-6.png', 'world.treesmall.7':'assets/world/treesmall-7.png',
     'world.treesmall.8':'assets/world/treesmall-8.png',
     ```
     - **Wiring (your call):** `gInitArt` will count `world.treesmall.*` like any variant set. To mix them into the wilderness, either (a) extend `gWildTrees` placement to pick from BOTH families (e.g. a per-tree `family:'tree'|'treesmall'` + variant index, `gDrawTree` selects the keyspace), or (b) place small trees as their own scatter pass (denser/underbrush) — a **placement/design call** (PM/Josh). They draw through the same feet-anchored world-prop path as `tree-*` (same `TREE_FOOT`); a smaller `TREE_BASE`-equivalent (or a per-family scale) reads them as younger/scrub trees.
  - **Source masters:** `art/world/trees.png` (large, existing), `art/world/tree small.png` (small, new — committed). Tool now encodes the overflow fix: `slice-variants.py --bleed` (+ `--anchor`/`--foot-pad`).
  - **Verify:** `node --check` + grep each `world.tree.<n>` / `world.treesmall.<n>` key resolves to a file + `python dev.py` → wilderness trees show **full canopies (no flat tops)**, small + large variants mix, feet sit on the ground.
  </details>

- ◻️ 🎨 **Wire enemy HURT pose sprites** (↳ from ART, 2026-06-10) — 32 cutouts committed, new pose state the engine lacks (`gDrawEnemy` only picks idle/atk).
  <details><summary>detail</summary>

  Art committed for `goblinhurt`/`archerhurt`/`direwolfhurt`/`alphawolfhurt` (goblins sliced 192, wolves 256, swap at the same per-enemy `gs`). **⚠ Paths are foldered** (post char-reorg): `goblinhurt`/`archerhurt` → `assets/char/goblins/…`, `direwolfhurt`/`alphawolfhurt` → `assets/char/wolves/…`.
  - **Add to `ART_MANIFEST`** (no-separator id, like `goblinatk`): `'char.goblinhurt.<8 dirs>':'assets/char/goblins/goblinhurt-<dir>.png'`; archer → `goblins/`; direwolf/alphawolf → `wolves/` (all `assets/char/<faction>/<id>-<dir>.png`).
  - **Draw intent:** select `char.<defId>hurt.<dir>` while damage-flash active (`e.hitFlash>0`), priority over idle, same `gs` (no per-pose mult). `_bid` selection ~`index.html:7784`.
  - **Two flags:** (a) `hitFlash` is ~8 frames — likely too brief; give the swap its own short `_hurtHold` if it flickers (the wolf `biteStrike` lesson). (b) Scale parity: `check-pose-scale.py` vs idle reads goblin ~0.97 / alphawolf ~0.99 (ship at parity) but archer ~0.84 / direwolf ~0.88 (wider hunched recoils) — if the flinch reads oversized, add a per-pose mult in `gDrawEnemy` or ping Artist to re-pad.
  - **Verify:** `node --check` + grep each key + `python dev.py`, all 8 facings, hard-refresh.
  </details>

- ◻️ 🟢 **Unwired art inventory — cobble tiles + Sanctum props** (audit 2026-06-10) — prepped art committed to `assets/`, zero refs in `index.html`.
  <details><summary>detail</summary>

  - **Cobble tiles** (`assets/tile/cobble-0..3`, `2da0b0a`) — ⏸️ deferred (Josh 2026-06-10). Cobble is *opaque ground*; town (HUB_MAP) ground is all `TILE_FLOOR` — same id as the dungeon's dark floor. Wiring = either a Sanctum-only `inTown` branch in `gTileArt` (cobble in town, dark stone in dungeon) **or** replace `floor` globally. Pick up by deciding that fork.
  - **Sanctum set-piece props** (`assets/world/`: well, fountain, barrel, banner-large/small, dungeon-gate, market-stall, target-stand, todust-sign, torch-post, training-dummy, weapon-rack — 12, `2da0b0a`) — **per-prop work**: each needs a draw hook (town props load via a separate pipeline, not the manifest). Some map to existing town objects (training-dummy, target-stand, weapon-rack, torch-post, well, fountain) — confirm the object + draw site before wiring; decide procedural-replace vs new object. Raster → `devicePixelRatio`. Best sized as its own focused session; *which* props matter is partly an art-direction/PM call.
  - **Lesson:** always check a tile cut's alpha before assuming the tile-art path — opaque → `gTileArt` (blit-and-return); transparent cutout → an overlay path that draws ground first (`gTileProp`). (Rock/spike tiles already wired this way, `c7ddc67`.)
  </details>

- ◻️ 🎨 **Threat-tier EYE glow — restyle the placeholder** (↳ from ART, 2026-06-11) — refine `gDrawThreatGlow` from floating two-dots to an eye-anchored **subtle** tell: enemy eyes ignite yellow (tier 1) → red (tier 2). No new sprites; the look is decided (Artist) — this is the per-frame draw + the runtime-cheap eye-anchoring, which is engine-owned. **Evaluate in-game at true scale/motion behind a dev knob** (an offline still is the wrong medium for this — Artist mock discarded).
  <details><summary>detail (Artist spec)</summary>

  **The look (decided with Josh):** eyes **ONLY** — no body wash (a full-body tint was prototyped and rejected: "looks terrible"). A *subtle* "this one's harder" signal, escalating yellow→red. Tier flag already exists: `e.threatTier` 0/1/2, stamped in `_wildScaleEnt` (nights 4/8). Base goblin sprites already have glowing yellow eyes, so tier 1 = "ignite the existing eyes brighter," tier 2 = "shift them red."
  - **Colours:** start from the placeholder's yellow `#ffd84d` / red `#ff4030` (or a hotter ignite — yellow ~`rgb(255,224,90)`, red ~`rgb(255,70,50)`). Additive (`globalCompositeOperation='lighter'`).
  - **Subtle:** small tight eye glow + a faint soft halo; NOT a big bloom. Optional slow desynced pulse (reuse the existing `gFrame + per-enemy phase` sine; tier-2 ~1.5× faster for menace) — or steady; make it a knob.
  - **Anchoring (the real work):** the placeholder draws two dots at a fixed head offset off the hitbox `e.r` — they don't sit on the real eyes and don't track facing. Two cheap options (engineer's call — **NOT** per-frame pixel detection, too costly at >100 sprites):
    - **(preferred) Boot-time cached eye-mask:** at `gInitArt`, extract each char sprite's bright-yellow eye pixels ONCE into a small mask canvas cached in `gArtReg`; per frame blit it tinted to the tier colour, additively, at the sprite's transform. Pixel-accurate per facing, **auto-hides when the enemy faces away** (back facings have no eye pixels → empty mask), one cached blit/frame. Eye-key that works (validated in the Artist mock, reuse as the extraction filter): a pixel is an eye if `a>120 && r>200 && g>150 && b<110 && (r-b)>115`, within the upper-head band `y ∈ [0.12, 0.40]·H`, then dilate 1px to round the 2–3px blobs.
    - **(simpler) Per-(enemy,octant) eye-anchor table:** offsets for eye positions per facing; draw 1–2 additive dots there, suppress on the 3 back octants. Less accurate, no boot step.
  - **Hook:** `gDrawThreatGlow(e)` (already called post-draw for any `threatTier` enemy, ~`index.html:8729`) — refine in place. **Perf:** keep cheap (>100 sprites) — no per-sprite radial gradients / `shadowBlur`; cached-mask blit or a couple of `arc()` fills only.
  - **Acceptance:** the tell reads as "harder" in a moving pack at game zoom *without* shouting — judge live, not on a still. If it can't read subtly at true scale, nudge intensity up (a hotter core) before adding size.
  </details>

- ⛔ 🟢 **Custom sprite invisible to self in singleplayer** (design-gated) — your custom sprite broadcasts to other players (live in MP via `df_player_sprite` + `ccPixelsToCanvas`) but your own local render + char/inventory previews still draw the knight. Cosmetic, not a bug. **Blocked on a PM/CD design call:** should the local hero reflect the custom sprite (route local draw + previews through `ccPixelsToCanvas(...)`, knight as fallback), or is the knight canonical (demote the creator to MP-cosmetic-only / cut it)? Not an engineer drive-by.

- ◻️ 🔧 **CHANGELOG housekeeping** (↳ from PM, 2026-06-10) — (a) ✅ `docs/archive/changelog-dungeon-forge.md` now tracked (Session 15). (b) Fold the shipped items (0, 0b, 0c, 1, 3, 4) into the next tag. Going forward, sweep the changelog by era/half-year, not per release.

---

## 🟨 Artist lane

> **New-asset tasks here flow from the PM's Asset Audit** (reuse-first pipeline, [`agents/product/product.md`](../agents/product/product.md) → "The Asset Audit") — every art-bearing feature is audited for reuse first; only genuinely-new assets land here. **You're the inventory authority:** if a task says 🆕 NEW but an existing asset/master already covers it, downgrade it to ♻️ REUSE and tell the engineer the key (a cheap check that saves the work).

- ◻️ 🎨 **No-pause level-up sidebar — painted-frame / icon pass** (↳ from ENG, 2026-06-11 · ref `art/reference images/new level up screen (no pause).png`) — the sidebar shipped functional with the existing CSS ornate frame (`.lvl-portrait`) + the existing `assets/portraits/cilia.jpg` portrait. To reach the mockup's fidelity: a **painted panel frame** (the ornate gilt border around the card list, not just the portrait), **per-card-row icons** (the draft uses emoji glyphs today — `CARD_ICON_ART`-style overrides), and **rarity filigree**. Cards are now horizontal rows (icon-ring · rarity · name · desc · Favor chip), stacked vertically in a left-docked panel. Engineer wires assets per manifest once sliced. *(Overlaps the existing "Level-up screen art-direction pass" / `specs/levelup-screen.md` — fold together; that spec predates the no-pause reflow, so re-baseline it against the new row layout.)*

- ◻️ 🎨 **Cilia in-game sprite — from the new full-body master** (↳ from Josh, 2026-06-12) — source master parked at `art/gods/cilia full body.png` (1535×1024, full standing figure, transparent-ready). Josh: "will be used as an in-game sprite of Cilia." **Pipeline decision pending** before slicing: what *kind* of in-game presence is she — a single static NPC at the shrine (one cutout, feet-anchored, `world.cilia`-style key), or a directional/animated avatar (needs a turnaround, not one pose)? Confirm the use with Josh/PM, then bg-remove → size to the established char/world scale → `ART_MANIFEST` handoff to Engineer. Don't slice until the use is settled (one pose vs. turnaround changes everything).

- ◻️ 🎨 **God-skill icons — Cilia set (3), SHARED draft-card + HUD action-bar** (↳ from PM, Josh-approved 2026-06-12 · spec [`specs/mana-economy.md`](specs/mana-economy.md) Phase 3 "God-Skill Action Bar") — **one icon per god skill, used in BOTH** the level-up draft card **and** the new HUD action-bar slot (author one set, not two). Cilia launch = **3 icons**: **Burning Body** (ignite-aura / AOE burst-fire), **Trail of Embers** (burning trail), **Pyroclasm** (ranged fire pillars). Read clearly at small HUD size *and* on the draft card; fit the existing `CARD_ICON_ART` keying (`specs/levelup-screen.md` image-icon override) — slice + manifest snippet to Engineer with a stable `iconKey`. Each reads as a *Cilia/fire* skill (warm palette) to pair with the fire-red god border. +1 icon per future god skill. *(Pairs with the two Engineer-lane action-bar tasks.)*

- *(eye-glow look **decided & handed to Engineer** 2026-06-11: eyes-only, subtle, yellow→red; full-body tint tried & rejected. See the Engineer-lane handoff + Done.)*

---

## ✅ Done (recent track record — prune to git history as it grows)

- **2026-06-12 — Asset-folder stewardship: scheme set, fold tooling ready** (Artist, ↳ from Josh — new standing
  responsibility) — Josh assigned the Artist ongoing **upkeep of `assets/`** as the game scales across areas
  (`world/` was filling from one area's set-dressing). Decided axis (Josh-approved): **`world/` folds by AREA**
  (`goblin-forest/` · `sanctum/` · `_shared/` for cross-area props) — a new area = a new folder. **`tile/` stays
  FLAT** (decided via the follow-up spec — type is already in the id; area, the only new fact, isn't a tile
  property). Recorded the responsibility in `agents/artist/artist.md`
  (+ scope), rewrote `assets/README.md` with the decided per-kind taxonomy, extended `fold-assets.py` `FAMILIES`
  (world + tile), and **taught `slice-variants.py` to auto-route** tile/world outputs into their family folder +
  emit the foldered manifest path (so new slices don't re-flatten — the "migrate the tool with the pipeline"
  rule). Dry-ran both folds CLEAN (44 world + 48 tile files, every one mapped). Engineer-lane handoff filed for
  the atomic `--apply` (move + manifest rewrite). Tooling/docs only — not deploy-affecting; committed.
- **2026-06-12 — Forest trees + forest grass + barrel/crate sliced** (Artist, ↳ from Josh) — four asset families
  cut from new masters: (1) **`world.foresttree.0..8`** — a 3rd tree family (fir/pine, willow, banyan, oaks; 256²,
  bottom-anchored foot ~0.94 to share `TREE_FOOT` & the `gDrawTree` path; `slice-variants --bleed 50` so canopies
  aren't clipped; QA CLEAN). (2) **`tile.forestgrass.0..8`** — opaque 96² full-bleed forest-floor grass (small
  custom PIL crop: inner-square inset past the sheet's dark bushy fringe → matches the live `grass-*` treatment,
  verified seamless-tiling, no dark grid). (3+4) **`world.barrel` / `world.crate`** — single transparent props
  (white-bg flood-fill + erode via the slicer's `cut_cell`; barrel replaced its tiny 39×43 placeholder, crate new).
  All **new ids** (Josh: add, don't replace existing tree/grass sets). Engineer wiring handoff filed (Engineer lane)
  with paste-ready manifest snippets. ~908 KB total. Committed locally (deploy-affecting — awaiting Josh push auth).
- **2026-06-12 — Tree sprites: small set sliced + large-tree top-clip fixed; `slice-variants.py` gains `--bleed`** (Artist, ↳ from Josh) — sliced the new `art/world/tree small.png` 9-variant sheet → `assets/world/treesmall-0..8` (new smaller-tree variety incl. a willow), and re-sliced the existing large `tree-0..8` to recover canopy tops Josh flagged as clipped on `tree-5..8`. **Root cause:** the bottom/middle source trees overflow their 3×3 cells upward (~33px), and `slice-variants.py` (which crops to the exact cell) had no overflow recovery. **Fix — ported `--bleed` (expanded-window + `keep_owner`) from `slice-turnaround.py` into `slice-variants.py`**, plus `--anchor bottom`/`--foot-pad` so every recovered variant shares one foot baseline (foot fraction ~0.94, uniform across all 18). QA'd both magenta contacts CLEAN (full canopies, feet aligned, no neighbour fragments; bg-leak metric over-reports on bright foliage). Engineer handoff filed (Engineer lane): `treesmall` keys to wire + verify `TREE_FOOT≈0.94`/`TREE_BASE`. *Lesson: a recurring cutout defect class belongs IN the slicer — tree-canopy-overflow on a variant sheet is now a documented flag.* Committed locally (deploy-affecting — awaiting Josh push auth).
- **2026-06-12 — Cilia pledge-card art fixed + optimized** (Artist, ↳ from Josh) — Josh's updated bust (full flaming hair no longer cut off at the top of frame) had landed as an unoptimized 2.1 MB `assets/gods/cilia.png` while `index.html:765` still pointed at the deleted `assets/gods/cilia.jpg` → broken pledge card. Converted the new master → **`assets/gods/cilia.jpg`** (1408×792, 204 KB — in family with bhumi 170 / boreas 200 / ikras 169 KB), removed the 2.1 MB PNG. **No `index.html` change** (line 765 already references `cilia.jpg`). QA'd: full hair contained, no flatten/banding, dark bg intact, crops clean to the 130px `top center` card strip.

- **2026-06-11 — No-pause level-up sidebar** (Engineer, ↳ from CD/Josh · ref `art/reference images/new level up screen (no pause).png`) — the wilderness level-up no longer touches `gPaused`: leveling bumps `gDraft.pending` + flashes a bottom-left FAB (`#g-levelup-fab`); clicking it opens a left-docked, non-blocking `#g-stat-pick` sidebar (container `pointer-events:none`, only the `.lvl-dock` interactive → world clicks fall through to the canvas, player keeps move+attack and stays vulnerable). Draft logic **lifted out of the `gWildShowStatPick` closure to module scope** (`gDraft` state + `gDraftQueue/Generate/Paint/Select/Open/Close/Confirm/Reroll/UpdateFab/Reset`, `_draftUpgradeCard/_draftBuyRank`), so state persists across panel open/close and the §8 bot resolves it headlessly (gSimDraft/gSimEvolution shapes + all Favor-spend logic preserved verbatim). Cards reflowed to vertical **card-rows** (`.sc-body`). Lv 5/10 **Form/Ascension fork** renders its 2 options as rows **in the same sidebar** (reuses `_evolutionOptions`/`_chooseEvolution`); `gOpenEvolutionMenu` now serves the skillforge dev path only. `node --check` clean; greps confirm zero draft-path `gPaused`, no orphaned closures, harness reads intact. **⚠ In-browser canary pending** (`await Sim.batch(3)` + manual: level up→FAB→open→pick→confirm, move/attack with panel open, reach Lv 5 fork, die-with-panel-open) — needs a live browser; run before tagging. Artist follow-up filed (painted frame / card icons). Committed locally (deploy-affecting — awaiting Josh push auth).
- **2026-06-11 — World props wired: favor coin + treasure chests** (Engineer, ↳ from ART) — 3 manifest entries (`world.favorcoin`/`chest-closed`/`chest-open`) auto-load via `gInitArt`; `gDrawFavorOrbs` draws the coin sprite (gold pickup glow + gentle bob kept, procedural disc as fallback); both chest draw sites (village `~15159` + wolf-camp `~15204`) route through a shared `_drawChestSprite()` helper (open art once `looted`, else closed; feet-anchored; guarded camp chest dims via reduced alpha; procedural box fallback retained). Pure render-only (gated `inWilderness`, no logic/state) → Sim/MP-safe. `node --check` clean + greps confirm wiring. *Sizing knobs: `FAVORCOIN_PX 22`, `CHEST_PX 30`. **Verify in-game with a hard-refresh** (browser eyeball pending) — reopen if coin/chest scale or anchor reads off.*
- **2026-06-11 — `char/` reclassed into per-type folders + player→knight class** (Engineer, ↳ from ART) — atomic `reclass-char.py --apply` (250 files moved, 200 paths + 72 keys rewritten, slash/thrust → `fx/knight/`); 16 draw-code edit-groups applied (art layer → `knight`; game-logic `kind:'player'` / `SpriteRegistry('player')` fallback preserved). Verified: all 74 draw-constructed keys resolve to a manifest entry + real file, staged tree case-exact for Pages, `node --check` clean. **Diagnosed Josh's Pages atk/heavy 404 along the way: committed HEAD was already case-correct → stale Pages/CDN cache; the fresh knight paths sidestep it.** Committed atomically (deploy-affecting — awaiting Josh push auth).

- **2026-06-11 — Threat-tier glow look decided** (Artist) — eyes-only, subtle, yellow→red. A full-body tint was prototyped and rejected ("looks terrible"); the eyes-only direction is set and handed to Engineer (lane). *Process lesson: a runtime draw-effect is engineer-owned and must be prototyped in-canvas/in-game, not in an offline raster mock — the Artist sets the look direction + palette, not a simulated render.*
- **2026-06-11 — Item 0 Player animation pass closed** (walk · dash · heavy windup all wired + playtested OK).
- **2026-06-11 — Player WALK cutout halo + boot loss RESOLVED** (Artist) — defringe-v2 (full antialiased ramp to `α<245`) + `--shadow-bg`/`--shadow-lum 13 --shadow-band 0.90` boot-protected re-cut of E/NE/SE (+mirrors). All 8 dirs full-ring fringe ~12–17 (idle 18–22), boots intact, registration unchanged → no `index.html`/manifest change. Lessons crystallized in `agents/artist/memory.md`. *(Verify in-game with a hard-refresh; reopen here if a halo persists.)*
- **2026-06-10 — Rock + spike-fence tiles wired** (`gTileProp` overlay path — cutouts, not opaque ground).
- **2026-06-10 — Wolf camps stream packs by player proximity** (no more ~160 always-live wolves; per-camp clear/respawn survives unload).
- **2026-06-11 — `slice-turnaround.py` per-type-folder native** (Artist) — the slicer now auto-routes its 8 cutouts into `assets/char/<group>/<type>/` and emits the two-level manifest paths + the `player→knight` key rename, driven by importing `reclass-char.py`'s `classify`/`TYPE_GROUP`/`TYPE_RENAME` (single source of truth — adding a new enemy stays one line there). Unknown id → loud WARN + flat `assets/char/` fallback; `--assets-dir` is the manual escape hatch (verbatim, no routing/rename). Verified: `route()` correct for all enemy/player/knight/unmapped cases, real goblin re-slice landed in `goblins/goblin/` with `char.goblin.*` keys (QA CLEAN, reverted), `slice-variants.py` import chain intact, `--help` fixed on cp1252 (two pre-existing `→`→`->`). Tooling-only, not deploy-affecting. *Closes the "migrate the tool when you migrate the pipeline" debt from the per-type reclass.*
- **2026-06-09 — `slice-turnaround.py` path-native** (writes `assets/char/<id>-<dir>.png` + path snippet; base64 step removed).
- **2026-06-09 — Wolf lunge-bite pose reads** (`_biteHold` 24f draw-only dwell).
- **2026-06-09 — Inert STR/DEX/INT scaling shims removed**; `wildDmgMult` removed; %damage flows uniformly through `wildBuffs.damagePct`.
- **2026-06-09 — Skill tooltips show live buffed damage**; bow kill drops an XP orb; vestigial sword-charge player state removed (wire-compat held).
- **2026-06-09 — `DUNGEON_FORGE_CTO_DOC.md` → `TO_DUST_CTO_DOC.md`** (+ 14 referencing files; `DF1` seed prefix & localStorage key frozen for compat).
