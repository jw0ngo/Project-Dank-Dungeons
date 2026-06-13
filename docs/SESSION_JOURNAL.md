# To Dust — Session Journal
**Reverse-chronological log of sessions, decisions, and hard-won debugging lessons — newest at top.**

Each entry captures: what was built, what broke badly, and what the root cause taught us. The debugging lessons are the most portable value — they represent understanding that cannot be derived from the code alone.

> **How to add an entry (read before logging a session):**
> - **Date-keyed header, newest at the TOP:** `## YYYY-MM-DD — Title  [roles] · sN`. Insert it directly under
>   this note, above the previous newest entry. No manual sequence math — the **date** orders it; `sN` is a
>   stable id (the next integer after the current max) kept only for cross-references (e.g. the Architecture
>   Decisions Log's *Session* column) and to break same-day ties.
> - **`[roles]`** tags the agents involved — `[eng]`, `[PM]`, `[artist]`, or combined like `[PM+eng]`. A
>   cross-role or role-switching session is **one** entry tagged with every role; grep a tag to filter.
> - **Same-day sessions** each get their own entry; the later one sits **above** the earlier (higher `sN` on top).
> - Crystallized, role-specific lessons still graduate to `agents/<role>/memory.md` — this file is the shared,
>   cross-role timeline; the per-role memory is the distilled layer.

> **Older sessions (1-13) are archived** in [`docs/archive/session-journal-2026H1.md`](archive/session-journal-2026H1.md).
> Their still-live, distilled value survives in the **Debugging Heuristics Reference** + **Architecture Decisions
> Log** tables (bottom of this file) and in `agents/engineer/memory.md`. This live file keeps only the **most
> recent sessions** + the reference tables; archive older sessions there as the list grows.

---

## 2026-06-13 — Night siege: uncapped growing all-angles horde, fixed per-second arrival rate  [eng] · s21

### Built / Done
- **Reshaped the wilderness night siege** to a constant all-angles onslaught (Josh's feel spec): stream
  starts immediately at nightfall; the single-direction opening horde is **delayed to t+10s**
  (`siegeHordePending`, dropped from `gWildSpawnTick`); stream **stops in the final 10s**
  (`WILD_NIGHT_SPAWN_TAIL`) as a mop-up window. (Earlier pass this session.)
- **Diagnosed Josh's "goblins stop, warriors keep coming" bug** → **no goblin-specific cap exists.** It's
  emergent: the tight global live cap (`wildCurrentCap`, old 40→128) + attrition (goblin 30 HP vs warrior
  80 HP). When the field hits the cap, `room = cap−live` → 0 and the **whole stream stalls** — player then
  clears fragile goblins while tanky warriors linger → field drifts elite. That same tight cap also made
  the desired *growing* horde impossible. Fix for both = raise the cap.
- **Measured the real perf ceiling** before raising (new keeper canary check `perfspawn`): drives
  `gSimUpdate(1)+gRender()` as manual frames (sidesteps headless rAF throttling), escalating a realistic
  night-12 mix. Result: **enemy-count cost is trivial** — gSimUpdate (AI + separation grid) ~1ms@40 →
  **~4ms p95 @260**; gRender **median ~6–8ms, flat in N**. The scary render **p95 (~42–55ms) is a fixed
  headless software-raster/GC artifact** (already ~43ms at N=40, doesn't track count; won't occur on a
  GPU browser). **The asserted "128" ceiling was way conservative — engine handles 260+ fine.**
- **Iterated to the FINAL model: a fixed per-second arrival RATE for the whole night — NO concurrent cap
  AND no per-night total** (Josh's repeated steering: cap→184 → per-night budget 300 → "forget the total,
  just set enemies/sec over a fixed night"). So `wildCurrentCap()` **and** the budget machinery
  (`_wildNightBudget`/`siegeBudget`/`siegeSpawned`/the tail cutoff) are all **deleted**. `_wildNightRate(n)
  = 3 + min(n,12)·0.25` → **night1 ≈ 3.25/s, +0.25/s per night, plateau night12 ≈ 6/s**; enemies arrive at
  that rate from nightfall to dawn, so an un-thinned horde **just keeps growing** (size ≈ rate×night −
  kills; night1 no-kill ≈ 410, night12 ≈ 790). Opening horde delayed to t+10s (`WILD_NIGHT_HORDE_DELAY`,
  renamed from the old TAIL) is on top. Type mix `_wildSwarmType` unchanged.
  **Why the change:** the per-night *total* (300) made a no-kill player's horde stop ~4:50 (night1 = run
  minutes 3–5; the 300÷110s rate ran out right at the night's end) — Josh read that as a bug. A pure rate
  has no total to "run out", so the swarm grows continuously all night. The day lull between nights (3-min
  day, no siege) still exists by design.
- **Perf** (rate model's worst case ≈ night12 no-kill ~790 concurrent): headless `gSimUpdate`+`gRender` —
  ~600 ≈ 9ms/frame (comfortable 60fps), ~900 ≈ render-median 33ms (30fps line, headless software raster,
  smoother on GPU; update path <13ms p95). Degrades gracefully; only a fully-passive late night (already a
  death sentence) reaches those densities.
- **Regression check `nightgrow`** (rewritten for the rate model) reproduces the night-1 no-kill case:
  walks the full 120s night with zero kills, asserts the horde is **still climbing in the back half**
  (no mid-night stop/cap) and reaches ≈410 by dawn with goblins present. Passes (`rate 3.25, live 218→380
  →413`). `perfspawn` kept as the manual perf probe. Boot canary clean (0 errors).

### Debugging lesson
- **"X stops happening" is often a global throttle + differential attrition, not an X-specific limit.**
  Goblins didn't have a cap; they just lose the survival race once a *shared* cap pins the field — the
  tanky type wins the standing population. Before adding a per-type rule, check whether a global gate +
  uneven lifetimes already explains it.
- **Measure before trusting an asserted ceiling — and read the median, not p95, under headless render.**
  Headless Chromium has no GPU; its render p95 is raster/GC noise uncorrelated with load. The per-frame
  *compute* (gSimUpdate) and the render *median* are the trustworthy signals; both said we had ~2× the
  headroom the old comment claimed.

---

## 2026-06-13 — index.html refactor survey + banner re-home + fire-FX stages 1–2  [eng] · s20

### Built / Done
- **Refactor survey of `index.html`** (~17.9k lines, 575 functions, ~471 top-level globals) → 5 prioritized
  angles, logged as tasks. Josh approved #1 (banner re-home) + #4 (gSimUpdate extraction) for this session;
  #3 (per-frame system registry) and #2 (fire-FX unification) logged as ◻️ in `tasks/engineer.md`.
- **§-banner re-home (zero code moves):** "§6d TRAINING DUMMY" had silently grown to 3,012 lines / 92
  functions / 143 knobs. Now: §6d "& SANCTUM PROPS" (just the dummy + forges) · new **§6h** PLAYER DAMAGE &
  GRIT · **§6e** at the real AI start · new **§6i** FIRE FX · **§6e-ii** ENEMY SYSTEM (cont.) · §6c/§6f moved
  to their true starts. §6e's add-a-new-enemy recipe now names the goblin **exclusion-list** step and
  mandatory `EntityDefs.hp` (both were documented only in engineer.md gotchas before).
- **Extracted `gClientEnemyArrowTick`/`gClientPlayerArrowTick` (§6.3c)** from the ~70 lines inlined in
  `gSimUpdate` — placed beside their authoritative host-side siblings; bodies verbatim (`gLastDt`→`dt`,
  identical at that point). Behavior unchanged; canary `--batch 3` clean.
- **CODE_MAP discipline encoded as a tool** (Josh's ask): `verify-repo.py` check #4 fails when
  `docs/CODE_MAP.md` is stale vs the banners (`gen-code-map.py --check`); engineer.md now lists CODE_MAP as a
  read-every-session ref + regen duty.

- **Refactor #2 stages 1–2 (fire-FX unification, Josh-approved).** Stage 1 (`d60a8f1`): the nine §6i families
  now hook the engine via `FIREFX_UPDATE`/`FIREFX_DRAW_UNDER`/`FIREFX_DRAW_OVER`/`gResetFireFx()` dispatch
  tables — gSimUpdate/gRender/gameLoad each call one dispatcher; a new family is a registration, not a 4-site
  edit. Stage 2 (`c65fd44`): `_fxTargetable`/`_fxHitFeedback`/`_fxOwnerGroundTick` collapse the duplicated
  guard/feedback/owner-ground blocks across all nine update fns (exact values threaded; shape tests stay
  per-family). New permanent canary preset **`--check firefx`**: plants an unkillable goblin, fires all nine
  families, asserts damage landed + every fx array drained (~1s). Stage 3 (draw-side dedup + knob→defs)
  logged ◻️ — needs human eyes on the dev window, headless can't see draw regressions.

- **Refactor #2 stage 3 (`71fadd7`): draw-side dedup.** `_fxBlitCentered` + `_fxFadeInOut` collapse the
  additive-blit and fade-envelope boilerplate across rings/crosses/bursts/aura/trails and crosses/jets/
  trails/fields; waves/jets/pillars keep their custom geometry. **Knob→def fold rejected** — it would blind
  gen-code-map's flat-UPPER-const knob census for zero behavioral gain. Draw paths exercised LIVE via a
  canary `--expr` (spawn all families, let real frames render — `runFast` skips gRender, so the firefx
  check alone never executes draw code). Pending: Josh's visual pass.

- **Refactor #3b — EnemyRegistry positive dispatch (kills the double-AI footgun).** `gUpdateEnemies` dispatched
  AI by iterating all 8 registry entries × all enemies and skipping non-matches; goblin used a **negative
  exclusion list** (`!(isArcher||isWarrior||…)`), so any new type missing from that `||` chain would run BOTH
  its own AI and goblin AI. Replaced with positive dispatch: `(EnemyRegistry[e.defId] || EnemyRegistry.goblin)
  .ai(e, dt)` over a single enemy pass — each enemy runs exactly one AI, fallback preserves the old default,
  no exclusion-list bookkeeping. Dropped the now-dead `flagProp` field + unused `_pcx/_pcy`. Verified safe:
  every factory sets `defId` to a registry key (8/8), and the `isPatrol` branch is dead code (`isPatrol`/
  `patrolVx` never assigned), so the loop restructure changes no live behavior. New permanent canary
  **`--check enemyai`** plants one of each type and asserts each one's AI runs (it moves). CTO doc + engineer
  memory de-staled (both described the removed `{ai, flagProp}` footgun).
- **Refactor #3a (gSimUpdate per-frame registry) — DECLINED after reading the hot path.** The explicit
  `if(gPlayer…)gUpdateX(dt)` list is self-documenting and its gates are heterogeneous (present / alive /
  host+alive / client+alive / town+dummy); a `{gate, fn}` registry would need predicate-functions or
  special-casing that reads *worse*, and the "structural invariant" payoff is marginal (gSimUpdate is already
  THE single step fn — the loop()-vs-step problem #3a was meant to harden is already solved). High-risk hot
  path, low reward → not worth it. The survey proposed it; close reading changed the call.
- **Design-state log sync (Josh):** the imbued-actives removal (a while back) is now reflected in the logs —
  **god skills are ALL auto-cast mana skills; the warrior kit is never imbued; the imbued-kit code is shelved**
  (kept, canary-covered, unreachable). §2 array decls + the §6i banner now carry an explicit LIVE/SHELVED
  inventory (live: rings/bursts/trails/pillars + aura via Burning Body / Trail of Embers / Pyroclasm; shelved:
  waves/embers/fields/jets/crosses — spawners parked with the imbued swing/leap/dash/heavy branches). The CTO
  doc was already correct (its "Parked" §); the code comments + engineer memory lagged. PM flagged to sweep
  roadmap/spec language.

### Lessons
- **The generated map found the drift the banners hid.** The §6d mislabel was invisible while navigating by
  banner; one glance at CODE_MAP's per-section function counts exposed it. Generated mirrors don't just stay
  honest — they make dishonesty *visible*.
- **"Unify N similar systems" scope-checks itself once you read the update fns.** The pre-read estimate
  ("one entity system, collapse 1k+ lines") dissolved on contact: the nine families share *plumbing* (guards,
  hit feedback, owner ground ticks, engine hookup) but their shape tests are genuinely distinct identities.
  Unify the plumbing, registry the hookup, leave the identities alone — and write the targeted canary
  (`firefx`) BEFORE claiming behavior is preserved; `--batch` alone never exercises skill-hit paths.
- Pre-existing, harmless: two nested `function draw(){}` locals (`_imbueAnimateBg`/`_shrineAnimateBg`) show up
  in CODE_MAP §10 — scoped, not the duplicate-declaration footgun.

## 2026-06-12 — Mana economy (item 7) — all three phases  [eng] · s19

### Built / Done
- **Item 7 (mana economy & skill management) — Phases 1–3 landed in one session.** Mana now funds both the
  class kit and the god layer from one pool.
  - **Phase 1 (numbers):** tightened `WeaponRegistry.sword` — leap 45 mp / 15 s CD (CD-led), whirlwind
    0.30/f (18/s) / 5 s CD + power bump (dmg 22→30, radius 36→44) (mana-led), heavy 30, dash 18. **Edited the
    `sw.*` run-start reset block too** — it re-clobbers `ww*`/`leap*` to hardcoded bases each run, so a registry
    edit alone would be silently reverted at run start. Benchmark hit: leap + ~3 s WW ≈ empties the 100 pool.
  - **Phase 2 (rank-scaled drain):** added an `mpCost` key (mp/**sec**) to the Burning Body registry
    base/waveStep/formStep. It auto-scales with rank for free because the rank-up card pours **every** key of
    the step object into mods (`for(const k in step)`), so a new param needs no apply-site change — same path
    as emitDmg. Maxed ≈2.92 mp/s.
  - **Phase 3 (toggle/HUD/Sim):** keys 1–9 toggle owned god skills (acquisition order); central pay-then-fire
    in `gUpdateGodSkills`; dormant + auto-resume on starvation, paid lowest-key-first; signature-gated DOM chip
    row by the MP bar; `Sim.toggleGodSkill(n)` + enriched `observe()`.
- **Same-session playtest fixes (Josh).** (1) **"Not consuming mana"** — the 1.67/s drain was real but masked
  by the 9/s passive regen; Josh's fix was to **cut base regen to 1 MP/s** (`mpRegen` 0.15→0.01667), so one
  aura net-drains (the spec's "layered on regen" model only bites once regen is tight). (2) **Toggle hid only
  half the skill** — `gDrawBurningBodyAura` was gated on *ownership*, so toggling off stopped the emit but the
  base aura glow churned on. Added `gGodSkillRunning(p,id)` (owned ∧ on ∧ not-dormant) as the one predicate the
  fire/drain AND the draw share. (3) **Chip always said "Burning Body"** — added `gGodSkillDisplay` so the label
  shows the *current evolution* (Ascension ▸ Form ▸ base), since an evolution replaces what it grew from.
  (4) **Drain should track on-screen effects, not be a flat per-second number** (Josh) — reworked to a
  **hybrid**: flat continuous aura `mpCost` (5 mp/3 s, now *flat* across ranks — dropped the per-rank mpCost
  scaling) **+ a per-emit `mpEmit` chunk** charged in `gTickBurningBody` when a burst/ring fires (Cinderburst
  +10/nova, etc.; leaf overrides Form). So mana visibly chunks down with the effect. (5) **Hard-gate it**
  (Josh) — emits were firing for free at empty mana. Moved from a smooth per-frame drain to **discrete,
  affordability-gated charges**: the base is a **5-MP lump every 3 s** (`p._bbCostTimer`, `BB_AURA_INTERVAL`)
  that, if unaffordable, takes the whole skill dormant; each emit is gated `if(mp<emitCost) return` (skip the
  beat, aura keeps running). The dispatcher stopped doing per-frame payment — charges now live in the tick,
  still in key order. *Lesson: when a cost should "feel" like the action, charge it as a discrete lump at the
  event's commit point AND gate the event on affording it (no effect ⇒ no drain ⇒ no effect), rather than a
  smooth drain that floors at 0 and lets the effect fire for free; surface both on the HUD (`1.7/s +10`).*
  (6) **Cost must SCALE with rank; final model (Josh, after I overengineered):** the base-aura chunk **grows
  per level** (`mpChunk 10 + mpChunkInc 27 × (rank-1)` → ~253 MP @rank 10, charged every fixed 3 s), the
  evolved emit adds a **flat** chunk, and at rank 10 the time-average lands in the **80-100 MP/s** benchmark.
  **No cap** — the rank-10 chunk deliberately **exceeds a starting 100 pool**, so a maxed skill won't fire
  until you build Max-MP (HUD chunk turns red ⛔). *Lesson — when a designer gives a benchmark like "~90 MP/s
  at max," it's a TARGET to back-solve a per-level increment from, not a literal continuous rate to implement;
  I burned several rounds converting the discrete chunk system to a smooth drain, adding frequency-scaling and
  cost caps, all of which the designer then had to walk back ("keep the dynamic system", "keep the interval",
  "no cap"). Implement the simplest discrete mechanic that meets the stated knobs, expose the numbers as live
  consts, and let the benchmark drive ONE increment — don't re-architect the model to hit a number. And when a
  constraint pair looks impossible (here: "~90/s avg" + "castable on a base pool"), surface it instead of
  silently capping — the designer's resolution ("you can't cast it without Max-MP") was the whole point.*

### Decisions / lessons
- **Where to put a per-second drain: pay centrally in the dispatcher, not inside each skill's tick.** The
  spec grounded Phase 2 as "subtract in `gTickBurningBody`" and Phase 3 as "gate in `gUpdateGodSkills`." Those
  fight: Phase 3's "pay in key order 1→9, dormant-on-starve" can only be enforced where you see *all* skills at
  once and control the order — the dispatcher. Draining inside the tick would force the gate to *peek* each
  cost to decide payability, risking double-accounting. Doing both (pay + dormancy decision + fire-dispatch) in
  one central loop keeps the tick functions pure FX/damage and makes "lowest-key stays" a one-line consequence
  of iteration order. **Lesson: when a spec phases a mechanic across two sites, find the site that can express
  the *hardest* constraint (here: ordered, all-at-once payment) and put the whole thing there.**
- **A run-start reset block is a second source of truth for any value it touches.** `ww*`/`leap*` are mutated
  in place by ability upgrades, so they're re-seeded from hardcoded literals each run (`sw.wwCooldown = 120;`).
  Editing only the `WeaponRegistry` definition looks correct (`node --check` passes, the registry reads right)
  but the value silently reverts the next run. **Any stat that's both registry-defined AND reset-block-seeded
  must be changed in both places** — grep the reset block for the symbol before trusting a registry edit.
- **Verifying new control-flow logic with no browser:** extracted the real `gUpdateGodSkills` /
  `gSyncGodSkillOrder` / `gToggleGodSkillByKey` (brace-balanced slice from `index.html`), stubbed the ~5
  dependencies, and drove pay/dormant/auto-resume/key-order in ~40 lines of Node. Caught nothing this time but
  *proved* the new logic — stronger and cheaper than `Sim.batch` for a self-contained state machine (which I
  still owe in-browser before tagging).

## 2026-06-11 — God Skills slice 1 (Burning Body) shipped, asset reorg, PM playtest retune  [PM+eng] · s18
*combined PM + engineer (role-switched from artist mid-session); parallel sessions sharing the tree*

### Built / Done
- **Burning Body (god-skill item 2, slice 1) shipped** — ignite-aura + Firebloom/Cinderburst + Dragon/Chaos
  ascensions; ground-circle sprites + ring upgrade (`FR_RING_FRAC` 0.76) wired. Logged in CHANGELOG
  `[Unreleased]`; ROADMAP item 2 flipped to in-progress with the build order (Burning Body → Trail of Embers
  → Pyroclasm). Verified `node --check` + the AI-native invariants statically (`gUpdateGodSkills` is in the
  `gSimUpdate` chain via `gUpdatePlayer`; the ascension fork sets `gSimEvolution`, so headless runs resolve
  it). **Browser `Sim.batch` canary still owed** (no headless browser this session).
- **PM + Josh full-run playtest retune (2026-06-11).** Josh played a full run; the PM/engineer tuned from it
  and recorded it in CHANGELOG `[Unreleased]`: Burning Body cards surface far more once pledged
  (`GODSKILL_CARD_CHANCE` 0.6, prioritized over patron burn-card injection), chaosfire is never laid under the
  player, and emit-damage was rebalanced. Also recorded Josh's redirect renaming skill 1 **Pyre Waltz →
  Burning Body** (ROADMAP). PM-reviewed, engineer-committed (git access).
- **`assets/` reorganized for long-term health.** `fx/` → `_shared/` + per-god (`cilia/`…); `char/` → faction
  folders (`player`/`goblins`/`wolves` — 248 files, 200 manifest paths). New `tools/fold-assets.py` does the
  `git mv` **and** the `ART_MANIFEST` path-rewrite atomically + self-verifies. `assets/README.md` records the
  durable scheme: **top level by asset-kind; fold within a kind on *its own* axis** (char=faction, fx=owner,
  tile=type) — not "by god everywhere". `art/fx/` masters mirrored. New FX (Burning Body ring + heat-fill,
  dragonfire/chaosfire ground-circles) cleaned to true-black via `tools/fx-ring-heatfill.py`.
- Spec'd (Artist→Engineer handoffs, in `docs/TASKS.md` + `docs/specs/levelup-screen.md`): level-up screen
  art pass + 27-icon generation batch; enemy hurt poses; threat-tier eye glow.

### Lessons
- **Code-referenced asset paths migrate atomically — script the move + the manifest rewrite as ONE op.** In a
  single-file game, ~200 `ART_MANIFEST` strings point at files; a half-done fold (files moved, paths stale)
  404s every sprite into the procedural fallback, which `node --check` never catches. `fold-assets.py --apply`
  does both in one self-verifying commit; the engineer (sole `index.html` editor) runs it so the halves are
  inseparable. (Crystallized in `agents/engineer/memory.md`.)
- **The shared-tree auto-sweep trap** (reinforces s14): a "stage everything" moment bundled cross-role
  WIP (`index.html`, PM's `ROADMAP`) into an *art* commit. Fix: `git reset --soft` + restage **explicit
  paths**. Reconcile a diverged `origin` with `--force-with-lease` **only after** diffing that nothing unique
  to origin is lost (here only PM's `ROADMAP`, preserved uncommitted in the working tree).
- **Journal upkeep reworked: date-keyed, reverse-chronological, newest at top.** This wrap was first filed as a
  duplicate "Session 15" prepended above the *existing* Session 15 — manual `max(n)+1` numbering miscounts and
  fights the natural prepend instinct. Fix (this session): headers are now `## YYYY-MM-DD — title [roles] · sN`,
  newest at the top; the date orders entries and `sN` is just a stable cross-ref/tiebreak id. See the header note.

---

## 2026-06-10 — Card pass, wolf fixes, late-game danger, patron cards + a walk-halo diagnosis  [eng] · s17
*engineer (alongside parallel PM + Artist sessions on the shared tree)*

### Built (shipped v0.5.0 + uncommitted/awaiting-push)
- **0b Combat card pass (shipped v0.5.0):** per-skill damage cards (Swing: Bite, Heavy: Devastation, both
  +8% via new `swingDmgPct`/`heavyDmgPct` skillMods applied at `gDoSwingAt`/`_fireHeavyAtk` + the char-screen
  readout), retargeted the old width card → **Heavy: Reach** (`heavyLen`). Then **removed pick caps
  pool-wide** (27 cards, scripted) — draft RNG is the only governor; degenerate states were already
  clamped/floored independently (crit 75%, CD 99%, `SKILL_STAT_FLOOR`, Grit streak ≥2).
- **3+4 Wolf fixes (shipped v0.5.0):** wolves are native climbers — added an optional walk-predicate param
  to `gRC` (default `gIsWalk`, zero change for other callers) and resolve wolves with `gIsWalkWolf` (rock
  climbable) + skip `gRCDestructibles`/`gTreeSlow`; bumped base HP/bite (dire 26→38/10→15, alpha 72→105/17→25).
- **1 Late-game danger (built, awaiting push):** new `wildDmgMult` (+15%/night) at the **`gDamagePlayer`
  chokepoint** so every damage source scales with one edit; steeper HP/density/cap slopes; mix-shift
  breakpoints (warriors n4, shamans n6, goblin backbone thins 100→60 at n8+); `e.threatTier` flag (0/1/2)
  → `gDrawThreatGlow` yellow/red eye-glow tell.
- **0c Patron Cards (built, awaiting push):** reusable `PATRON_CARDS` pool keyed by patron god, gated by
  `gIsPatronActive`, ~25% draft injection swapping one fill slot. Cilia burn set: Conflagration (per-tick
  detonation → `gBurnExplode` AoE+re-ignite chain), Lingering Flame (`burnDurMult`), Searing Heat
  (`burnTickMult`); duration/tick applied in `gApplyEnemyBurn`, detonation rolled in `gUpdateEnemyBurn`
  (already inside `gSimUpdate`). Host/SP-authoritative → no MP-protocol change.

### Lessons
- **A user attributing a visual bug to your edits is a hypothesis to test, not a fact to accept.** The
  "walk sprites have a dark halo" report felt caused by my reload, but the session-wide `index.html` diff
  had **zero** player-render lines and the assets were git-clean. Measuring the PNG alpha-fringe nailed it:
  walk frames carry a wide mid-gray semi-transparent edge band (brightness ~55-64) vs the idle's tight dark
  fringe (~14) — a slicer keying artifact, fixable by the Artist (the cleanly re-cut `-e`/`-w` frames at
  ~22 prove it). Diagnosis = diff for causation + measure the asset against a known-good sibling; then hand
  it to the owning role with the data (`CLEANUP_BACKLOG` "Art / sprites" + a roadmap ENG→ARTIST line).
- **A roadmap's "X scales with threat" is a claim to grep, not a given — then fix at the chokepoint.** The
  board said HP+dmg both scaled ×(1+0.25·night); `wildThreatMult` had a single caller touching HP/speed
  only, so enemy *damage never scaled at all*. Applying the new `wildDmgMult` at the one `gDamagePlayer`
  chokepoint covered melee/arrows/bombs/fireballs/MP-mirror with zero per-site wiring — the same
  "one interface-narrow chokepoint" move that made the burn mods and the threat tell cheap.
- **The shared tree carries other roles' WIP — commit only your lane, every time.** All session, the PM's
  `imbue-paths.md`/`ROADMAP.md` edits and the Artist's `slice-turnaround.py` sat modified in the tree; the
  release gate (`release.ps1`) refused to run with them dirty, so I `git stash push -- <path>` for the
  exact Artist file across the tag, then popped it. Always stage explicit paths; never `git add -A`.

---

## 2026-06-09 — Art externalized (index.html 14 MB → 650 KB)  [eng] · s16

**Built:** Moved all inline base64 image art out of `index.html` into files under a new `assets/` tree.
A census (`tools/census-base64.py`) found 179 inline blobs — 172 `ART_MANIFEST` entries, 5 `F*_SPR` fire
sprites, 2 figure consts — plus the 4 shrine god-card `<img>`s (12 MB of base64). One scripted pass
(`tools/externalize-art.py`) decoded each blob to a file (named from its manifest key / var), rewrote the
reference to the path, and relocated the POC god cards into `assets/gods/`. `gInitArt` already did
`im.src = ART_MANIFEST[key]`, so a path is interchangeable with a data-URL — the change is
behaviour-preserving. Result: 183 asset files, `index.html` 14 MB → ~650 KB.

**Lesson — externalizing inline art is a value-rewrite, not an engine change, *when* the loader is already
src-generic.** The whole migration was "decode blob → write file → swap the string literal." Zero draw-code
changes. The precondition that made it safe: the only consumer of a manifest value was `im.src = value`
(grep-confirmed — no `atob`, no `startsWith('data:')`, no base64 slicing anywhere). Before externalizing
any inlined data, **grep for code that introspects the value as a data-URI**; if nothing does, it's a
mechanical swap.

**Lesson — for art changes, "no 404s" is the real correctness check, not `node --check`.** A typo'd path
passes syntax check, returns 404 at runtime, and **silently falls back to the procedural sprite** — looks
plausible, art just quietly missing. Verified instead by HEAD-ing every `assets/` path referenced in the
HTML over a local server (183/183 reachable) and headless-rendering the town (Chrome `--headless=new
--screenshot` over `python -m http.server`). The screenshot caught that real sprites loaded; the reachability
sweep caught that nothing was orphaned.

**Lesson — `<img src>` relative paths load from `file://`, but a headless full-boot needs a server.** The
POC confirmed the four god cards render from a bare `file://` double-click (image loads aren't CORS-blocked).
But headless-booting the *whole game* from `file://` produced no screenshot (Firebase remote `<script>`s /
virtual-time timing) — over `http://localhost` it rendered fine. So: `file://` is OK for the shipped game,
but verify headless over HTTP.

**Tooling friction:** `tools/slice-turnaround.py` still emits base64 manifest snippets — now a step behind
the file-based pipeline (logged in `CLEANUP_BACKLOG.md`, flagged in `agents/artist/artist.md`).

---

## 2026-06-09 — Neutral Wolf Camps (spine)  [eng] · s15
*engineer | ~12,800 lines*

### Built
- **Neutral Wolf Camps** — the final mechanical-slice feature (spec `docs/specs/neutral-camps.md`).
  40 fixed crescent rock dens at world-gen, each a neutral pack (1 Alpha + 2–4 Direwolves) guarding a
  chest. New `direwolf`/`alphawolf` EntityDefs + `makeWolfEnt` + one shared `_aiWolf` (neutral until
  hit; circle-to-flank; telegraphed lunge-bite with an exposed recovery; `WOLF_LEASH_R` hard-leash →
  disengage + full-heal). Camp-linked wake (`_wolfWakeCamp` from the `gDealEnemyDamage` chokepoint so a
  one-shot still propagates). `gUpdateWolfCamps` inside `gSimUpdate` runs the 3-min respawn + chest-on-
  clear (2–4 Favor via `gGrantFavor`) off the run clock. Crescents carved into the existing `rocks`
  layer (no new tile art); minimap dots; editor palette. Sprites/draw-scales were pre-wired by the
  Artist (`char.{direwolf,alphawolf}.*`, `ENEMY_DRAW_SCALE`).

### Lessons
- **Reuse the village template, but diverge on the *one* new axis.** Camps are villages-shaped (placed
  at gen → `gWildCamps[]` of `data` objects → runtime `_wolves` populated in `goWilderness` → per-frame
  update + chest-on-proximity + minimap dots). The *only* genuinely new code is the behavior that
  differs — neutrality + leash-heal in `_aiWolf`. Copying the surrounding scaffold (despawn exemption,
  reset sites, entity-load `forEach`, draw dispatch) is mechanical; spend the thought on the delta.
- **Wake on the damage chokepoint, not the kill path.** Hooking pack-wake into `gDealEnemyDamage`
  *before* the `hp<=0` branch (not in `gKillEnemy` or the non-fatal `_villageCheckDamageAlert` else)
  means a one-shot killing blow on one wolf still wakes the rest — the obvious "wake on hit" spot misses
  the lethal hit.
- **`SpriteRegistry.get()` falls back to `player`, so the eager fallback arg in `gDrawEnemy` is
  crash-safe** for a brand-new `defId` even before art loads — but the *real* art still renders because
  `gDirBody` finds `char.<id>.<dir>`. New enemy types don't need a pixel-array sprite registered first.
- **Verification reality (no node here):** confirmed syntax by a **differential bracket-balance** of the
  extracted `<script>` vs `git show HEAD:index.html` (identical residual = no nesting broken), plus
  targeted greps for every wiring site + a duplicate-declaration scan. The runtime `await Sim.batch(3)`
  canary and visual playtest remain the browser-side loop (`python dev.py`).

---

## 2026-06-09 — Image-Art Combat Pass, Card Pool Expansion, Weighty Heavy, Level-Up Redesign  [eng] · s14
*engineer (+ a parallel playtest session sharing the tree)*

### Built
- **Image-art combat poses across the whole cast.** Player normal-attack + heavy-attack + a
  procedural walk bob; every enemy got an attack pose wired to its real attack state (goblin
  `goblinatk` on the new cone windup, archer `archeratk` on `shootWindup`, warrior `warrioratk` on
  `swing-windup`/`charging`, bomber `bomberatk` on a new throw windup, shaman `shamanatk` on cast,
  king `kingatk` on any attack phase); bomber/shaman upgraded from procedural to directional art.
- **Goblin telegraphed melee** — plant → fill a red cone over `atkWindup` → strike only if still in
  cone (dodgeable); plus body **contact chip** on its own cooldown so a swarm can't be walked through.
- **Removed post-hit i-frames** (a swarm can't be cheesed by a mercy window); dash/leap/roll evasion
  i-frames kept; fire-beam trap moved to its own `_beamCd`; visual-only `_hitFlash` keeps the red flash.
- **Card Pool Expansion (Now #2, shipped):** Stage 1 per-player swing/heavy/dash stat migration to
  `pSkillStat`; Stage 2 the swing/heavy/dash cards (+ `pSkillSpeed` % form) + HP-regen nerf; Stage 3
  the **crit** system (chance/damage, host-side roll on `gDealEnemyDamage`, gold crit numbers).
- **Weighty heavy attack** — doubled commitment window (active swing + planted recovery), true
  movement lock (the `p.smashing`→`p.heavySwinging` bug), feet-anchored pose scale.
- **Level-up "Choose a Blessing" redesign** — CSS chrome (frame/title/cards/buttons), themed by patron
  (Cilia warm / Nameless-Knight cool), figures as image cutouts, semi-transparent backdrop.
- **Sprite-keying tooling** hardened (`--erode` halo, `--global` pockets, `--sever` detail-equals-bg)
  + a size-consistency step — see the Sprite Import Checklist below.

### Lessons
- **Parallel Claude sessions on ONE shared working tree → divergent history; reconcile by CONTENT,
  not by panic or commit-message.** An eng session and a playtest session both committed to the same
  tree and pushed; `main` diverged from origin (ahead 2 / behind 1) with two *same-named* "full-res
  sprites" commits on each line. The safe reconcile that loses nothing:
  1. **Commit your own uncommitted work FIRST** — a real commit can't be lost in a merge; a dirty
     tree can.
  2. **`git diff <localHEAD> origin/main --stat`** to see the *real* content delta. Here it was **only
     `index.html`** — the 24 sprite PNGs + slicer were byte-identical on both lines (one line just had
     an extra "combined index.html" checkpoint). Identical content on both sides ⇒ the merge is
     conflict-free. **Don't trust commit-hash/message identity — diff the bytes.**
  3. **`git merge` (NOT rebase).** Rebase would re-apply the duplicate file-adds onto origin and
     conflict ("already exists"); merge with identical content just records the history join.
  4. **Verify the merged file parses and carries markers from BOTH lines** before pushing.
- **Speed cards are a different shape than flat cards.** Attack-speed / charge-speed must be a
  *diminishing percent* (`base/(1+Σ%/100)`, via `pSkillSpeed`), not a flat `skillMods` add — flat
  frames stack linearly to zero and violate the "no frames in card text" rule.
- **A flag that's never set silently disables a guard.** The heavy movement-lock gated on `p.smashing`
  (never assigned anywhere) instead of `p.heavySwinging`, so the player could run mid-smash for ages.
  Grep that a guard's flag is actually *written* somewhere, not just read.

---

## Sprite Import Checklist (run this for EVERY new sprite)

Cutting a sprite out of its background — and matching its size to the rest of the character's frames —
keeps re-introducing the same handful of bugs. `tools/slice-turnaround.py` has the keying levers + an
automatic QA pass; steps 1–4 are keying, step 5 is **size consistency**, step 6 is **geometry recovery**
(figures drawn larger than their cell). Run all of it every time:

1. **Slice it**, then **look at the magenta QA contact sheet** the tool prints (`contact.png`). White/dark
   halos and any background showing through pop instantly against magenta. The tool also prints a
   per-direction **`bg-leak Npx`** count and a final **`QA: CLEAN / CHECK`** verdict — a non-trivial leak is a bug.
2. **Edge halo** (thin white/dark fringe at the silhouette = anti-aliased bg-blended pixels left opaque):
   add **`--erode 1`** (tightens the alpha mask ~1px); raise to 2 if it persists. A small `--feather` then softens.
3. **Background showing through an enclosed pocket** (gap inside a drawn bow/string, between shrine pillars —
   anything the figure encloses): the default edge-seeded flood fill can't reach it. Use **`--global`** to cut
   *all* background-coloured pixels. Only safe when interior detail isn't the same colour as the bg.
4. **Chunks of the figure missing / fragmented** (dark armour on a black sheet, light stone on a white sheet —
   interior detail shares the bg colour): first try **lowering `--thresh`** toward the true bg brightness (e.g.
   the goblin warrior idle needed `--thresh 24` on its near-black sheet). If the detail is *genuinely* the same
   colour as the bg so no threshold separates them (the player **normal-attack** lunge — dark steel armour on a
   ~25-brightness sheet), use **`--sever N`** instead: it erodes the background mask to cut the thin channels
   that connect interior recesses to the exterior, then floods from the border, so the recesses stay filled.
   In `--sever` mode the `bg-leak` metric over-reports (the kept detail *is* bg-coloured) — judge by the magenta
   contact, not the number.
5. **Size consistency — the new pose must render at the SAME on-screen body size as the character's idle/base
   sprite.** Source sheets are often drawn at a *different zoom* (an attack/swing sheet zoomed out to fit the
   motion → figure physically smaller in its cell). **Do not scale-match by the bounding box** — it's polluted
   by extended weapons (a sword/bow flings the bbox wide) and crouched stances (shortens it). Match a
   **pose-invariant body feature: helmet/shoulder width in a FRONT view** (`'s'`/`'n'`) — measure it in the new
   frame vs the idle frame; the ratio is the correction. Fix by re-slicing at a corrected `side`, or (to keep an
   extended weapon from clipping) a **feet-anchored draw multiplier** that grows the pose upward from the foot
   line (see the player heavy `HEAVY_DRAW_MULT` = 1.3, the measured idle/heavy helmet ratio). **Measure, don't
   eyeball** — coarse visual steps overshoot (1.5× looked right; the measured truth was 1.3×). Confirm by
   rendering the new pose next to idle, bottom-aligned, heads matching. (Hit on the king, bomber, and player heavy.)
6. **Figure sliced flat at an edge / paws-tail-nose cut off** (wide **lunge / attack** poses drawn *larger than
   their 3×3 cell* — they overflow into the empty centre, and the rigid per-cell crop throws those pixels away):
   use **`--bleed N`**. First **diagnose**: get each figure's true connected-blob bbox and compare it to its cell
   *and* to the sheet edge. If the blob overflows the **cell** but not the **sheet edge**, the pixels exist on the
   sheet (just in the empty centre) and `--bleed` recovers them — it cuts on a window expanded N px past each cell,
   then keeps only the component that *owns* the cell (neighbours pulled into the window are dropped). Set N a bit
   above the worst overflow (the wolf-mother attack lunge spilled ~145px → `--bleed 170`). If a blob overflows the
   **sheet edge**, those pixels are genuinely gone — re-generate the source smaller in-cell; no flag recovers them.
   The attack-pose case is usually **both** problems at once — overflowing *and* white-on-white — so the wolf-mother
   attack sheet wanted `--bleed 170 --sever 2`. Owner-selection assumes figures don't touch (clean bg gap between
   cells); watch the per-direction `comps=N` print and the magenta contact for a dropped real part.

Single one-off images (not 3×3 turnarounds, e.g. `world.shrine`) aren't run through the slicer, but apply the
*same* global-key + erode + magenta-check by hand. The shrine needed both (`--global` for the pillar gaps, 1px
erode for the halo).

---

## Debugging Heuristics Reference

| Symptom | First thing to check |
|---------|---------------------|
| Enemy unkillable from spawn | Missing `hp` in EntityDefs |
| Enemy has wrong AI / double movement | `isXxx` missing from goblin exclusion list |
| Scaling/buff has no effect | Duplicate function declaration |
| Enemies missing when area discovered | Despawn radius + `isHeld` flag |
| Click handler fires but nothing happens | Parent `pointer-events:none` |
| Generator produces wrong pattern on circles | Duplicate tile positions before sequence logic |
| `const` variable undefined at runtime | Declaration order — `const` does not hoist |
| `beforeunload` not showing dialog | Handler must be unconditional |
| Bitwise hash gives constant values | `Date.now()` overflows 32-bit |
| Buff system makes enemies unkillable | maxHp division of rounded integers; store original |
| Tiles/variants form a repeating pattern | `hash % 2^k` reads low bits — use the `gWallVar` table |
| Sudden FPS drop after a draw change | Per-primitive canvas state toggle in a hot loop |
| On-hit flash shows a square box | `source-atop` fill on the shared canvas tints the opaque bg too — tint an offscreen sprite copy |
| Sprite looks wrong size vs. another | Per-entity draw multiplier (e.g. `PLAYER_DRAW_SCALE`), not the sprite/box |
| Overlapping AoE patches over-damage | Per-patch hit-cooldowns multi-hit — use one shared per-enemy cooldown |
| `node --check` unavailable / parser rejects valid code | No Node here; use esprima-python but neutralize ES2019+ first (`catch{}`, `??`, `?.`-before-ident, BigInt `0n`) — and skip the parse entirely for numeric/comment-only edits |
| Art loads locally but 404s on GitHub Pages | Case-sensitivity (Linux) hidden by Windows `core.ignorecase`. Check manifest paths against the **committed/staged git tree** case-sensitively (`git ls-files --cached`), not the disk. If the commit is already case-exact → it's a **stale Pages/CDN-cached 404**, not a path bug; a fresh path on next deploy sidesteps it |
| Special chars (`—`/`§`/`→`/`×`) turn to mojibake after a PowerShell file rewrite | `Get-Content`/`Out-File` used the Win-1252 default — a `SimpleMatch` on `—` then also silently fails to match. Read+write UTF-8 via .NET (`[IO.File]::ReadAllLines`/`WriteAllText` with `UTF8Encoding($false)`); match lines by an ASCII-only substring |
| Deleting a stat used in 50+ places | Neuter the helper to its neutral return (1/0); don't edit every call-site (works when the stat's baseline is 0) |
| MP: one player's upgrade buffs everyone | A shared registry (`WeaponRegistry`) was mutated for a per-player effect — use a per-player modifier map read at use-time |
| Map/field read throws on remote peers | Route single→map reads through one null-safe helper (`gIsImbued` guards `p && p.imbues`) |
| White/dark halo around a cut-out sprite | Anti-aliased bg-blended edge pixels left opaque — `--erode 1` in the slicer (tighten the mask) |
| Background showing through inside a sprite | Enclosed pocket the flood fill can't reach (bow gap, shrine pillars) — `--global` key |
| Chunks of a sprite missing / fragmented | Interior detail shares the bg colour — lower `--thresh`; if detail truly matches the bg, `--sever N` (morphological channel cut) |
| New pose renders bigger/smaller than idle | Source sheet drawn at a different zoom — match by front-view helmet width (not the bbox); re-slice `side` or feet-anchored draw mult |
| Sprite clipped flat at a cell edge / limbs cut off | Figure drawn larger than its 3×3 cell, overflowing into the empty centre — `--bleed N` (cut on an expanded window, keep the cell's owner blob). Confirm overflow is past the cell, not the sheet edge, first |
| User blames a visual bug on your recent code edits | Prove causation before accepting it: `git diff <session-base>..HEAD -- index.html` filtered for the render path (`gDrawSprite`/`drawAnyPlayer`/`_smooth`/composite) — often **zero** matches. Then measure the asset's alpha-fringe (8<α<200 band brightness) vs a known-good sibling — a baked-in keying halo (walk frames ~55, idle ~14) is an art-pipeline regression, not a code one |
| A documented multiplier "doesn't scale" in play | Grep that the multiplier is *actually applied* — `wildThreatMult` was believed to scale HP+dmg but had ONE caller touching HP/speed only; enemy damage never scaled. A roadmap claim about scaling is a hypothesis until grep confirms the call-site exists |

---

## Architecture Decisions Log

*The `Session` column cites the `sN` id from each entry's header.*

| Decision | Rationale | Session |
|----------|-----------|---------|
| Single HTML file | Portability, no build step, easy Claude.ai deployment | 1 |
| Art externalized to `assets/` files (was inline base64) | `index.html` 14 MB → 650 KB; greppable/diffable again; HTTP-cached; lazy-load now possible. Loader was already `im.src=value`, so behaviour-preserving | 16 |
| EnemyRegistry pattern | Decouples AI dispatch from entity creation, easy to add types | 7 |
| `isHeld` universal hold-position | Replaces `isVillage` + `isShrineGuard` redundancy | 9 |
| `gBombFireZones` separate array | Bombs and fire are separate lifecycles; don't mix | 9 |
| Skill points on player object | Persists across level-up screen close, accessible anywhere | 9 |
| `_shamanBaseMaxHp` stored on entity | Avoids rounding drift on buff expiry | 9 |
| Shrine always visible on minimap | Player needs to locate it; fog-gating would make it unfindable | 9 |
| `beforeunload` unconditional | Conditional guards are pre-classified as non-blocking by browsers | 9 |
| Art-tile variants via `gWallVar` table | Coordinate hash `% 4` showed a diagonal pattern; the table is structure-free | 10 |
| Tile art baked to device size, smoothing off | 1:1 blit; per-tile smoothing toggle killed dungeon FPS | 10 |
| FX sprites (fire pillar/wave) additive on black | Black bg drops out, flames glow over the scene | 10 |
| Imbued effects as `gFire*` arrays (ring/cross/trail) | One shape per effect: spawn/update/draw + `gDealEnemyDamage`; MP-synced via cast seq / dash flag | 11 |
| Shared per-enemy trail cooldown (`gTrailHits`) | Overlapping patches would otherwise multi-hit; keep DPS predictable | 11 |
| Engineering Charter as standing operating model | Codifies CTO authority, refactor cadence, and repo verification reality | 11 |
