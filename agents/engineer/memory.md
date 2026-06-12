# Engineer — Memory
*Crystallized, transferable engineering lessons. Read first each session; append at session end. Self-compact when over 250 lines (merge/supersede/raise-altitude; archive superseded entries to `agents/engineer/archive/`).*

Crystallized, high-altitude engineering craft for *To Dust*. Newest first. Read this first each
session; add to it at session end (studio doctrine — see `studio/STUDIO.md`). One entry = one
dated, titled lesson: **the principle → why → how to apply.** Quality over volume.

> **Division of homes:** tactical debugging lessons stay in `docs/SESSION_JOURNAL.md`; deferred findings /
> to-dos in your Engineer lane of `docs/TASKS.md`; architecture in `docs/TO_DUST_CTO_DOC.md`. *This* file is the step up
> from all of them — the transferable principles about *how to engineer well in this codebase*.

> Entry template:
>
> ### YYYY-MM-DD — <short principle as a title>
> - **Principle:** <the transferable lesson, one line>
> - **Why:** <what made it true here>
> - **How to apply:** <what to do next time>

---

### 2026-06-12 — `git push` ships the whole ancestor chain — a "docs-only" lane push can silently deploy un-pushed `index.html` underneath it

- **Principle:** Push gating is per-*commit* in our heads but per-*ref* in git. `origin/main` advancing to a docs
  commit carries **every ancestor**, including an Engineer `index.html` commit that was committed-locally-but-
  deliberately-unpushed (deploy-gated). It happened: I committed the three #8 fixers locally (`index.html`, awaiting
  Josh's deploy auth); the pm-bot then committed a docs-only card change *on top of mine* and pushed it (PM docs
  pushes are pre-authorized) — which deployed my `index.html` to Pages with no explicit OK. The "docs-only pushes
  are pre-authorized" rule silently assumes the PM commit sits on a *clean* base; stacked on an un-pushed
  deploy-affecting commit, the assumption breaks.
- **Why:** A single shared `main` with two lanes committing freely + one lane allowed to push = the pushing lane
  owns the deploy decision for *everything below its commit*, not just its own diff. Order of commits, not
  authorship of the top commit, decides what deploys.
- **How to apply:** (1) **Before any pre-authorized push, gate on the whole delta, not your own commit:** only
  push if `git log --oneline origin/main..HEAD -- index.html assets/` is **empty** (no deploy-affecting commit in
  the range). If it's non-empty, the push is deploy-affecting regardless of who authored the top commit → needs
  Josh. (2) As the Engineer, assume *any* local `index.html` commit can be swept to the remote by a later lane
  push — so a local commit is **not** a safe "hold"; if work must not deploy yet, keep it **uncommitted** (stash/
  worktree) or on a non-`main` branch, not just unpushed on `main`. (3) Fix filed for the pm-bot in the PM lane.

### 2026-06-12 — Sync a host-decided event to co-op clients by its ORIGIN shape: per-player seq · bounded set-stream · push

- **Principle:** To replay a host-authoritative event on clients, pick the sync primitive that matches the
  event's *origin & cardinality*, not the nearest one. Three shapes in this codebase: (1) **per-player seq
  counter** (`_frSeq`) for FX that originate AT a player (position = the synced player, implicit); (2)
  **bounded set-based, id-deduped stream** (`world/fx` via `Net.sendFx`/`_onFxUpdate`/`gNetFx`/`gBurstAndSync`)
  for **host-decided WORLD events at arbitrary positions** (a Conflagration detonation at an enemy) — `set()`
  stays bounded (no push-growth), a monotonic id lets clients dedupe AND **baseline-skip history on join**; (3)
  **push()** for **client→host** one-shot reports (`sendHits`). I reached for the player-seq first — wrong: the
  burst is at an enemy, not a player, so it needs an explicit `{x,y}` payload + its own id space.
- **How to apply:** new host→client cosmetic world FX (future god-skill detonations) ride the `world/fx`
  channel — spawn-local + record-on-host, broadcast-on-change, client baseline-then-dedupe-by-id. Keep it
  **cosmetic** (no gameplay authority) so a dropped/dup event is harmless; verify the client dedupe by extract-eval.

### 2026-06-12 — A designer's quantitative benchmark is a TUNING TARGET, not a mechanic spec — don't re-architect to hit a number

- **Principle:** When the designer hands a number ("rank-10 ≈ 80–100 MP/s"), it sizes a *parameter*, not the
  *mechanic*. I burned ~5 rounds converting a discrete per-rank chunk cost → a smooth drain → frequency-scaling
  → a cost cap, all to make one average "come out right" — and the designer walked **every** one back ("keep
  the dynamic system", "keep the interval", "no cap"). The right move: build the simplest mechanic that honors
  the *stated knobs* (chunk every 3 s, grows per level, per-emit on evolves), expose the numbers as live consts,
  and let the benchmark drive **one** increment. Iterate numbers, not architecture. The tell you've gone wrong:
  you're changing the mechanic's *shape* (discrete↔continuous, adding a cap/clamp/new scaling axis) to hit a
  target — that's re-architecting, not tuning. Re-read the directive for the *mechanic* words and treat the
  number as the dial.
- **When two stated constraints look impossible, SURFACE the conflict — don't silently clamp it away.** "~90/s
  average" + "castable on a base pool" can't both hold at a fixed interval + 100 pool; I nearly shipped a cost
  cap to force castability, but the designer's resolution was the opposite ("not enough Max-MP → you literally
  can't cast it — that gate IS the design"). A cap/clamp that makes the impossible look possible erases the
  decision the designer wanted. Present the conflict + the tradeoff; let them choose.

### 2026-06-12 — A phased/multi-site mechanic belongs at the site that enforces the HARDEST constraint; and a run-start reset block is a second source of truth

- **Principle:** When a spec splits a mechanic across two code sites, don't implement each phase where the
  spec happens to name it — find the site that can express the **hardest constraint** and put the *whole*
  mechanic there. Item 7's mana drain was grounded as Phase 2 "drain inside `gTickBurningBody`" + Phase 3
  "gate in `gUpdateGodSkills`." Those fight: the hard constraint was *"pay per-second drains in hotkey order
  1→9, last-toggled starves first, dormant + auto-resume"* — enforceable only where you see **all** skills at
  once and control iteration order: the dispatcher. Draining inside each tick would force the gate to *peek*
  every cost to decide payability (double-accounting risk). One central **pay-then-fire** loop made
  "lowest-key stays" a one-line consequence of loop order and kept tick functions pure FX/damage. The spec
  even labels its grounding "not prescriptive on *how*" — read phase-site hints as *where the effect lands*,
  not *where the code goes*.
- **Second source of truth — the run-start reset block.** Stats that upgrades mutate **in place**
  (`sw.wwCooldown`, `sw.mpCostLeap`) are re-seeded from hardcoded literals every run (`gWildReset`'s `sw.* =`
  block). Editing only the `WeaponRegistry` definition passes `node --check`, reads correct, and **silently
  reverts at the next run start.** Any value that is both registry-defined AND reset-seeded must change in
  **both** places — grep the reset block for the symbol before trusting the definition-site edit. (Same
  family as the duplicate-`function` shadow trap: "looks wired, does nothing.")
- **How to apply:** for a phased feature, locate the single chokepoint that satisfies *every* constraint
  before writing; for a number tune, grep for a reset/re-seed of the symbol first. New rank-scaling params come
  free when the rank-up apply pours **every** key of the step object (`for(const k in step)`). Verified the
  dispatcher by **extracting the real functions and driving the state machine in Node** (no-browser canary).

### 2026-06-12 — Occluding environment sprites: a reusable system + three rules (cull by extents · fade tracks the occluded · hitbox matches the art)

- **Principle:** A tall world-prop the player walks behind (tree → future pillars/statues) is the
  `gWildTrees`/`gDrawTree`/`gRCTrees` family. Three transferable rules: (1) **Cull by the DRAWN extents, not
  the anchor** — a foot-anchored sprite draws far above its foot, so foot-culling clips visible sprites at the
  edge ("popping"); margin from the size const (canopy ~0.93·h up). Latent at 1×, blatant at 2×. (2) **The
  occlusion-fade boundary tracks the OCCLUDED entity, not a fixed fraction of the occluder** — keep the
  player's top half visible: map their **waist** (foot − `PLAYER_VIS_H`/2) into the sprite's height fraction,
  translucent at/above it. "Top X% fades" ignores where they stand. (3) **Hitbox matches the art's footprint;
  the opaque region coincides with the hitbox** — a wide/short base is an **ellipse** (a foot-centred circle
  over-blocks vertically + reads "too low"); drive collision extent AND the always-opaque draw band from the
  **same const** so collision is visible.
- **Mechanics:** depth-sort props by foot-y in `drawables` (NOT the tile pass, always under entities). Smooth
  fade = draw to a **reused offscreen** then `destination-in` a vertical gradient (hard clip = seam). Seeded
  placement ⇒ MP-deterministic. Every feel value is a **named knob** (converged over ~7 one-number user
  rounds — sibling of the visual-feature-converges lesson). Extended v0.12.0 with a `world.treesmall.*` set
  (smaller via *draw scale*, both sets fill the canvas) + weighted **formations**.

### 2026-06-12 — A many-round spacing/feel knob converges to one physical rule, not stacked per-category constants

- **Principle:** When a placement/spacing feature is tuned over many one-number rounds, the convergent form is
  usually **one constraint derived from the real geometry**, not a pile of per-category constants. Tree spacing
  churned small-min-sep → +large-min-sep → +cross-set, and each *new category* exposed a gap the prior constants
  couldn't see (small-vs-large could still wall the player even with both per-set seps "right"). The move that
  ended it: derive the rule from the actual hitboxes — **any two trees keep centre-distance ≥
  `rxOf(a)+rxOf(b)+TREE_WALK_GAP`** (one player-width clearance), which subsumes *all* pair types at once and
  self-tunes when scales or trunk-width change. Stacked constants also breed brittle hand-coupling (I kept
  re-deriving `RX_FRAC`↔`MIN_SEP` in comments).
- **Why:** a per-category knob encodes the *symptom* (this pair too close), not the *cause* (trunk geometry vs
  player width). Symptoms are unbounded; the geometry is finite — so the physical rule is both shorter and
  complete.
- **How to apply:** the moment a spacing/feel knob needs a *second* per-category exception, stop adding
  constants — ask "what physical quantity is this approximating?" and compute the constraint from it, enforced
  O(1) via a spatial hash, seeded for MP-determinism; expose just the one comfort term (`TREE_WALK_GAP`) for
  live taste. Direct sibling of the *visual-feature-converges-on-the-user's-eye* lesson below: iteration is how
  you find the right **abstraction**, not an excuse to keep stacking parameters. (Also: lushness-vs-walkability
  was a real tension resolved by *thinning the collision* `TREE_BASE_RX_FRAC` 0.30→0.22, not by spacing — when
  two goals fight over one knob, look for the *other* knob that lets both win.)

### 2026-06-11 — An art handoff's "new prop" framing can really be a "replace the placeholder" job — reconcile the spec against what's already on screen

- **Principle:** An Artist render-spec tells you how the *art* works, not what *product role* it plays in the
  live game. The tree handoff said "NEW world-prop, scatter, NOT a tile" — so I built an open-field scatter
  layer beside the existing procedural `TILE_TREE` forest. The CD actually wanted those painted sprites to
  *replace* the placeholder forest. Both readings satisfy the literal spec; only looking at what's already
  rendered distinguishes them. Before wiring a "new" asset, ask: **is there an existing procedural/placeholder
  thing this art is meant to supersede?** If yes, the job is a swap (retarget placement onto the old thing's
  positions + delete the old draw), not an addition.
- **The tell + the disambiguation were both cheap.** The user's word **"still"** ("still getting placeholder
  trees") points at something that *predates* your change — i.e. not the thing you just added. And the
  "which placeholder?" question settled in two greps: there was **no** pre-existing tree entity/sprite, and
  `gInitArt` + valid case-correct PNGs meant the new art *does* load — so the only thing left that could read
  as "placeholder" was the procedural `TILE_TREE` tile draw. Enumerate the candidate sources and eliminate
  by evidence instead of guessing or rebuilding twice.
- **Reusable mechanics (good first-cut, survived the pivot):** a scatter/overflow world-prop is the `gRocks`
  family — off-grid `{wx,wy,variant,scale}` generated in the **seeded** map gen (so MP-deterministic), returned
  as `kind:` entities, unpacked at load, and pushed into the **y-sorted `drawables`** so it occludes/tucks
  with characters (NOT drawn in the tile pass, which always sits under entities). Feet-anchor by the
  **measured alpha-bbox foot** (PIL `getbbox` over the PNGs → the base sits ~0.93 down; one shared `*_FOOT`
  const), never the canvas bottom. Only the *placement source* changed in the pivot (open grass → forest
  tiles) — the render/draw/load machinery was right the first time.
- **How to apply:** for any art-wiring handoff, hold the spec next to a live look (or a precise mental model)
  of what currently occupies that visual slot; when the art is a quality upgrade of an existing element, plan
  for swap-and-delete (retarget + remove the superseded draw + its now-dead consts) and expose density/size as
  named knobs for the CD to tune live — a visual feature's final spec converges on his eyeball, not your first
  guess. Sibling of the 2026-06-11 fog lesson (pull the visual forks before a big rewrite) and the
  display-text-vs-frozen-token rename split.

### 2026-06-11 — To make a modal MP-seamless, separate "UI is open" from "the world is frozen" — archived
- `gPaused` had accreted four meanings (UI-open, sim-freeze, input-lock, immunity); a non-blocking modal needs
  only the first, so the fix is to **stop the modal setting the shared flag at all**, not pause-then-exempt each
  consumer. Lift modal logic out of engine-capturing closures to module scope so *panel visibility* (`gDraft.open`)
  decouples from *pending state* (`gSimDraft`, which the headless bot resolves without UI). Before making any modal
  "not pause," grep every reader of the pause flag and give the new modal its own boolean. (Mechanics: structural
  region-replace = splice by line-range with boundary assertions; DOM↔canvas units = measure the panel live as a
  ratio of canvas width × VW.) Full entry: `agents/engineer/archive/2026-06-11-mp-seamless-modal-decouple-pause-flag.md`.

### 2026-06-11 — A Pages-only 404 with a case-correct commit is a STALE CACHE; rename only the layer that's the art — archived
- Art that loads locally but 404s on Pages: **prove case against the committed git tree, not the working disk**
  (`core.ignorecase` hides it locally; the index is what deploys). Every manifest path ∈ `git ls-tree -r HEAD`
  (case-sensitive set test) → the commit is innocent, the 404 is a **stale Pages/CDN build**; a fresh asset path
  sidesteps it next deploy. For an entangled identity rename (`player` = art class **and** frozen game-logic
  token), **split by layer**: rename only the art layer, leave logic tokens frozen, and verify every
  draw-CONSTRUCTED key resolves to a manifest entry *and* a real file. Full entry:
  `agents/engineer/archive/2026-06-11-pages-stale-cache-and-rename-by-layer.md`.

### 2026-06-11 — A feel/visual feature's spec converges through user iteration; localize by the differing parameter, decouple shared knobs first
- For a *feel/visual* feature (fog, juice, a HUD bar) the real spec emerges over several fast user rounds —
  don't over-plan the first cut, but DO pull the consequential **visual forks** out of the user *before a big
  rewrite* (shape · persistence · what-hides), not after (I rewrote fog ~4× by implementing each clue instead of
  asking up front). A **"works in regime A, not B"** report ("works at night, not day") is a **parameter-regime
  bug, not a render bug** — localize by the parameter that differs (vision radius vs screen), cheaper than
  reading code. **Decouple a shared knob before retuning it for one use:** `fogVisRadius()` drove the visual
  circle AND enemy aggro — split gameplay onto its own const *first* (one number feeding two systems is a trap).
  Canvas tricks: composite on a **reused offscreen** then blit (so `destination-out` hits only the effect), and
  **bilinear-upscale a low-res 1px/tile mask** for smooth sub-tile fields; both render-only ⇒ MP/Sim-safe.
  "Tune it live" = every magnitude a named const (the user iterates on numbers, not geometry).

### 2026-06-11 — Documentation is a system: tier by load-cost, key shared artifacts to self-order, write every altitude — archived
- Docs are engineered artifacts with failure modes: (1) **tier always-on context by load-frequency, not topic** —
  keep auto-loaded files thin routers, push depth behind role/task gates (root `CLAUDE.md` split dropped universal
  load 194→60); (2) **key a multi-writer log on a self-ordering primary** (date, newest-first), not a hand-counter
  that collides; (3) **prefer a tagging/keying fix over fragmenting** a shared cross-role artifact per-role; (4)
  **each altitude is a separate write** — a crystallized principle doesn't capture the tactic, log both. Corollary:
  **restructure before you rewire** (lock target shape, then rewire refs in one pass). Full entry:
  `agents/engineer/archive/2026-06-11-doc-system-tiers-keys-altitudes.md`.

### 2026-06-11 — Code-referenced asset paths migrate atomically: script move + manifest-rewrite as one op
- **Principle:** Reorganizing assets referenced by explicit path strings (~200 `ART_MANIFEST` entries) is a
  move **plus** a synchronized path-rewrite — inseparable. A half-migration (files moved, paths stale) 404s
  every asset to its procedural fallback, invisible to `node --check`. Do both by **script, never by hand**,
  in one self-verifying commit (`tools/fold-assets.py --apply` = `git mv` + rewrite + assert each path resolves).
- **How to apply:** dry-run first (prove 0 unmapped + the rewrite count); the `index.html` owner runs `--apply`
  so both halves land in ONE commit. Organize on the **durable axis** — top-level by asset-kind, fold within on
  the kind's own axis (char=faction, fx=owner, tile=type; `assets/README.md`), never a volatile one (skill names).

### 2026-06-11 — Syntax-pass ≠ behavior-pass; when no browser, extract-and-eval the real logic — archived
- "It parses" is step one of three: a change can be syntactically perfect yet inert/wrong (a duplicate `function`
  shadows the real one, a per-frame system sits outside `gSimUpdate`, a **parked sibling leaks into a generalized
  loop**). Always run a *targeted proof it took effect* (grep the new key, `grep -c "function name("`,
  `await Sim.batch(3)`). When the in-engine canary needs a browser you lack, **regex-extract the real pure
  functions from `index.html` and `eval` them in Node behind a few stubs** to drive the state machine (~40 lines,
  no framework) — caught a parked-sibling bug `node --check`+greps both missed. Generalizing in place? discriminate
  by a **structural marker** of the new capability, not by name. For hooks, the proof is **observing the side
  effect fire**, not reading the script (a `[string]$P=$null` PowerShell param silently becomes `''`). Full entry:
  `agents/engineer/archive/2026-06-11-syntax-pass-not-behavior-pass.md`.

### 2026-06-10 — Three archived lessons (one-line index; full entries in `agents/engineer/archive/2026-06-10-*.md`)
- **De-risk a large spec'd feature: sub-slices on rails + dev harness + named knobs** — land it as independently-
  verified sub-slices, a `_DEV`-gated harness driving the *real* systems (one click to any deep state), placeholder
  FX on const knobs (feel-iteration = edit-a-number); system + highest-feedback instance first, fan the rest out as
  registry data; one shape → one source read by hitbox AND draw; split intermixed commits by snapshot→revert-one→
  commit→restore; `node --check` is blind to boot-path TDZ. `…-de-risk-spec-feature-rails-harness-knobs.md`.
- **Measure sprite scale & quality; never trust a handoff figure or an eyeball** — match idle *apparent* size by the
  head/shoulder-width ratio mean (pose-invariant, `tools/check-pose-scale.py`), not bbox; gauge keying by alpha-fringe
  brightness vs a clean sibling; `gDrawSprite` couples mult to cell size (re-cut → rescale `new/old`); when metric and
  eye disagree, let the user's reports bracket and the metric interpolate. `…-measure-sprite-scale-and-quality.md`.
- **A user blaming a visual bug on your edits is a hypothesis to test** — (1) `git diff <base>..HEAD -- <artifact>`
  filtered to the render path (often zero), (2) measure the suspect asset vs a sibling; separate render-path
  regression (your lane) from asset defect (owning role) and route with data. `…-visual-bug-blame-is-a-hypothesis.md`.

---

### 2026-06-09 — Four archived lessons (one-line index; full entries in `agents/engineer/archive/2026-06-09-*.md`)
- **A deferred "Fix:" is a hypothesis, not an instruction** — its premise rots between writing and acting;
  re-confirm against *current* code (grep symbols, trace reachability + consumers) before executing, especially
  destructive prescriptions; if false, reframe and report. `…-deferred-fix-is-a-hypothesis.md`.
- **A mode-global flipped for a special mode must be torn down symmetrically** — save-at-entry / restore-in-
  `finally`, or the mutation leaks into the default mode far from the toggle (`Sim.startRun` left `_SIM.muted`
  set → game mute). Treat the AI-native harness as production code. `…-symmetric-teardown-of-mode-globals.md`.
- **A new standing entity population is a hidden input to every global census** — a large *persistent* cohort in
  a shared collection (`gEnemies`) silently breaks unfiltered scans/counts (~160 neutral wolves pinned the
  siege cap); give cohorts a discriminator, make each census express *intent*. `…-standing-population-global-census.md`.
- **A repo-wide rename is two categories** — rename-freely **display text** vs never-touch **frozen tokens** (seed
  prefix `DF1`, storage keys, many-ref filenames, `docs/archive/` snapshots); triage every variant before a
  find/replace. `…-repo-rename-two-categories.md`.
