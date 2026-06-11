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

### 2026-06-11 — To make a modal MP-seamless, separate "UI is open" from "the world is frozen" — they were one overloaded flag

- **Principle:** `gPaused` had quietly accreted *four* meanings: UI-open, sim-freeze, input-lock, and
  damage-immunity. The no-pause level-up only needed the first. The fix wasn't to special-case the modal
  inside each consumer — it was to **stop the modal from setting the shared flag at all** and let the world
  keep running. A modal is non-blocking by *not pausing*, not by pausing-then-exempting. (Bonus: the engine
  already ran the sim during a draft in MP — so "no-pause SP" just meant making SP behave like MP, the
  cheaper of the two consistencies.)
- **Why:** the draft logic lived as closures inside `gWildShowStatPick`, rebuilt each call and welded to
  `gPaused`. Lifting it to module scope (a `gDraft` state object + free functions) decoupled *panel
  visibility* (`gDraft.open`) from *draft existence* (`gSimDraft`/`gSimEvolution` set whenever a level-up is
  pending) — so the headless bot resolves drafts without ever opening UI, and the human opens on demand via
  a queued-count FAB. Closures that capture engine state are the thing that forces a "modal = pause" coupling.
- **Two mechanics worth reusing:** (1) **large structural region-replace** = write the new block to a temp
  file and **splice by line range with boundary assertions** (`node` reads lines, asserts the first/last
  match expectations, replaces), not a 270-line exact-match Edit that one whitespace char defeats. (2)
  **DOM-overlay ↔ canvas-world unit conversion:** to center the player in the *unblocked* area, measure the
  panel live (`dock.getBoundingClientRect().width / canvas.getBoundingClientRect().width * VW`) — the ratio
  survives devicePixelRatio/`gRenderS`/letterboxing that a hardcoded px offset wouldn't.
- **How to apply:** before making any modal "not pause," grep every reader of the pause flag and list what
  each *actually* needs (freeze? lock input? immunity? just "a panel is up"?); give the new modal its own
  boolean and leave the heavy flag for the things that truly stop the world. When a draft/choice must also
  work headlessly, keep its `gSim*` hook populated by *pending state*, not by *UI being open* — visibility
  and resolvability are different axes. Ease asymmetrically where it reads as motion (retract at half the
  open speed felt right; a symmetric snap-back felt jarring).

### 2026-06-11 — A Pages-only asset 404 with a case-correct commit is a STALE CACHE, not a path bug; and rename only the layer that's actually the art

- **Principle:** When art loads locally but 404s on GitHub Pages (Linux, case-sensitive) while Windows
  (`core.ignorecase=true`) hides it, the textbook cause is a case mismatch — but **prove it against the
  committed/staged git tree, not the working disk** (the disk lies under ignorecase; what *deploys* is the
  index). If the committed tree is already case-exact (every manifest path ∈ `git ls-tree HEAD` / `git
  ls-files --cached`, case-sensitive), then the live 404 is a **stale Pages build or CDN-cached 404**, not a
  bug in the current commit — and a content change that gives the asset a **fresh path** sidesteps it on the
  next deploy. Don't "fix" a correct commit; diagnose the delivery layer.
- **The two diagnostics that settle it fast:** (1) `git show HEAD:index.html` manifest paths vs `git ls-tree
  -r HEAD` as a **set membership** test = exactly what the case-sensitive host sees; (2) after staging a
  move, the same test against `git ls-files --cached` = what the *next* deploy will serve. Both are ~10-line
  Python; neither touches a browser.
- **Renaming an entangled identity — split by layer, not by token.** `player` meant two things: the
  **art class** (`char.player.*`, the `_bodyId` draw selectors, `fx.slash`) and the **game-logic hero
  identity** (entity `kind:'player'`, `SpriteRegistry('player')` pixel fallback, the editor, custom-sprite
  uploads). Renaming player→**knight** touched only the art layer; the logic identity is *frozen* (the
  `player` entity *wears* a `knight` class — and a blind `'player'`→`'knight'` would have broken MP/editor).
  A key-rename's "test that would have caught it": cross-check **every draw-CONSTRUCTED key**
  (`'char.'+_bodyId+'.'+dir`, `'char.knightwalk'+n+…`, `fx.knight.*`) resolves to a manifest entry **and** a
  real file — `node --check` + a path-exists grep both pass a rename that points the draw code at a dead key.
- **How to apply:** for "works here, broken on Pages," check the committed tree case-sensitively *first*
  (one grep, exonerates or convicts the commit); for any identity rename, enumerate the game-logic vs
  art-layer occurrences before find/replace (sibling to the 2026-06-09 display-text-vs-frozen-token split),
  rename only the art layer, and verify the full draw→key→file chain, not just parse.

### 2026-06-11 — A feel/visual feature's spec converges through user iteration; localize with the "what already works" diagnostic, and decouple before you resize
- **Principle:** For a *feel/visual* feature (fog of war, juice, game feel) the real spec emerges over several
  fast rounds with the user — don't try to nail it in one shot, and don't over-plan the first cut. But DO
  pull the consequential **visual forks** out of the user *before a big rewrite*, not after: shape (circle vs
  screen-shaped), persistence (does it stay revealed?), what hides (terrain vs entities). I rewrote the fog
  render ~4 times because I implemented each new clue instead of asking "circle or screen-shaped? persistent
  or spotlight?" up front once the direction was clear.
- **The sharpest diagnostic was the user's:** *"it works at night but not during the day."* A same-feature
  works-in-regime-A-not-B report is a **parameter-regime bug, not a render bug** — localize by the parameter
  that differs (day vision 30 tiles ≥ screen vs night 12 < screen). Render code was correct; only the radius
  was wrong. Cheaper than any code reading.
- **Decouple shared knobs before you retune one.** `fogVisRadius()` drove *both* the visual circle *and*
  enemy aggro/spawn distances; shrinking it for looks would have silently changed combat. Split gameplay
  ranges onto their own constants (`ENEMY_DEAGGRO_TILES`) **first**, then the visual radius is free to move.
  Generalises the "hidden input to every census" lesson: one number feeding two systems is a trap when you
  tune it for one.
- **How to apply:** Two standard canvas tricks worth reaching for — composite the effect on an **offscreen
  layer** then blit (so `destination-out` punches/erases hit only the effect, never the game canvas), and
  **bilinear-upscale a low-res (1px/tile) mask** for smooth sub-tile fields instead of per-tile `fillRect`
  (kills blocky reveal). Both are render-only ⇒ MP/Sim-safe by construction. When a feature is "tune it live,"
  expose every magnitude as a named const and say so — the user iterates on numbers, not geometry.

### 2026-06-11 — Documentation is a system: tier by load-cost, key shared artifacts to self-order, write every altitude (consolidated)

- **Principle:** The repo is the shared brain, so its docs are engineered artifacts with their own failure
  modes. Four standing rules, each from a real miss:
  1. **Tier always-on context by load-frequency, not topic.** Anything that auto-loads (`CLAUDE.md`/`AGENTS.md`,
     a journal two roles skim) is taxed on *every* session, including the ones that never use it — keep it a thin
     **router** (map + where-to-find-X) and push depth behind role/task-gated files. The engineer manual living in
     the root `CLAUDE.md` made PM/Artist sessions pay ~194 lines they never touched; splitting it dropped the
     universal load 194→60. Per-tool entrypoints must be thin pointers over ONE deep-doc set, never duplicated
     depth (a hand-maintained duplicate `AGENTS.md` rotted into a *contradicting* second source of truth).
  2. **Key a multi-writer append-only log on a self-ordering, collision-proof primary — not a hand-incremented
     counter.** Manual `## Session N` numbering produced a duplicate "Session 15" prepended into the wrong slot;
     re-keying on **date** (`## YYYY-MM-DD — title [roles] · sN`, newest-first) makes ordering automatic and
     collisions impossible. Keep the old sequence id only as a stable cross-reference (other docs cite it) and a
     same-day tiebreak.
  3. **Don't fragment a shared cross-role artifact per-role when a keying/tagging change fixes the real problem.**
     Splitting the journal into per-agent files (the tempting structural fix) would have shattered single
     cross-role sessions and duplicated the `agents/<role>/memory.md` layer; a `[roles]` **tag** gives per-role
     *filtering* on a unified timeline instead. Reach for the mechanical fix before the structural one.
  4. **When docs route content by altitude, each altitude is a separate, deliberate write.** Crystallizing a
     principle (`memory.md`/`LEARNINGS.md`) does NOT capture the tactic (the `SESSION_JOURNAL` lookup table) or
     vice-versa — the handoff between a working session and the framework is exactly where a tactic silently
     vanishes. Log both; the lean home for a one-liner tactic is the existing table, not a new narrative.
- **Corollary — restructure before you rewire.** References are a function of structure: when a change reshapes
  *where things live*, lock the target shape FIRST, then rewire inbound references in one pass. Sweeping
  `../docs`→`../../docs` mid-restructure was pure waste when the structure changed again two messages later.
  Scouting/folding content parallelizes early; the inbound-reference rewrite is the *last* step. Encode recurring
  maintenance as a data-driven hook reading declared frontmatter (`memory_compact_at`), not a hardcoded map.
- *(Consolidates the four 2026-06-10/06-11 doc-system entries; raw originals in
  `agents/engineer/archive/2026-06-10-doc-system-lessons.md`.)*

### 2026-06-11 — Code-referenced asset paths migrate atomically: script move + manifest-rewrite as one op
- **Principle:** Reorganizing assets referenced by explicit path strings (~200 `ART_MANIFEST` entries) is a
  move **plus** a synchronized path-rewrite — inseparable. A half-migration (files moved, paths stale) 404s
  every asset to its procedural fallback, invisible to `node --check`. Do both by **script, never by hand**,
  in one self-verifying commit (`tools/fold-assets.py --apply` = `git mv` + rewrite + assert each path resolves).
- **How to apply:** dry-run first (prove 0 unmapped + the rewrite count); the `index.html` owner runs `--apply`
  so both halves land in ONE commit. Organize on the **durable axis** — top-level by asset-kind, fold within on
  the kind's own axis (char=faction, fx=owner, tile=type; `assets/README.md`), never a volatile one (skill names).

### 2026-06-11 — Syntax-pass ≠ behavior-pass; when no browser, extract-and-eval the real logic

- **Principle:** Verifying *syntax* is not verifying *behavior*. A change can be syntactically perfect and
  still inert or wrong — a duplicate `function` shadows the real one, a per-frame system sits outside
  `gSimUpdate`, a sprite scale moves without its hitbox, **or a parked sibling leaks into a generalized
  loop**. Always run a *targeted proof it took effect* (grep the new key, `grep -c "function name("`,
  `await Sim.batch(3)`); "it parses" is step one of three.
- **Three sharp instances:**
  - *Generalizing a hardcoded system in place* (imbue-paths `'swing'` → any god-skill id): a **parked
    sibling in the same registry** (`IMBUE_PATHS.cilia.swing`) got swept up when the new code iterated
    `Object.keys(pool)` — it would have offered "acquire Dance of Fire" as a god skill. Discriminate by a
    **structural marker of the new capability** (here a `fire` block, `gIsGodSkill = !!tree.fire`), not by
    name. Park ≠ inert: it still sits in the collection the new loop walks.
  - *The Sim canary is browser-side* (`document`/Canvas), so with no headless browser you can still
    unit-test the **real** pure logic: regex-extract the actual `function`/`const` declarations from
    `index.html` (brace-match to balance), `eval` them in Node behind ~5 stubs (`gPlayer`,
    `rollCardRarity`), and drive the state machine. This caught the parked-sibling bug that `node --check`
    + greps both missed. Watch const ordering (TDZ) and that `eval`-scope `const`s don't leak to the driver.
  - *A hook script that parses and exits 0 can still never do its job.* A PowerShell `[string]`-typed
    param **defaults to `''`, not `$null`** (`[string]$P = $null` → `''`), so a `if ($null -eq $Porcelain)`
    guard is always false and the real-`git` branch never runs. A new SessionEnd commit-reminder *and* the
    existing `doc-drift-check.ps1` were both silently dead this way (the latter for who-knows-how-long —
    "silent by design when nothing to report" hid the failure). Fix: gate on
    `$PSBoundParameters.ContainsKey('Porcelain')`. Silent automation is the worst kind — a hook that does
    nothing reads identical to one with nothing to do.
- **How to apply:** After a non-trivial change, prove it *behaves* — and when the in-engine harness needs a
  browser you don't have, lift the pure functions out and assert against them directly. It's the
  "test that would have caught it," achievable in ~40 lines without a framework. **For automation/hooks,
  the proof is observing the side effect fire** (pipe a synthetic payload in; watch it actually act), never
  "the script looks right" — and copy-pasting a buggy guard propagates the silent failure to the next script.

### 2026-06-10 — De-risk a large spec'd feature: sub-slice on rails, drive it with a dev harness, iterate feel behind named knobs

- **Principle:** A big, multi-session, fully-specced feature lands safest as **independently-verified
  sub-slices on rails you build once**, amplified by two things: (1) a **`_DEV`-gated test harness that
  drives the *real* systems** (never a parallel code path) so you can reach any deep state in one click,
  and (2) **placeholder FX wired to named registry/const knobs** so feel-iteration with the user is
  *edit-a-number*, not re-architect-geometry.
- **Why:** Imbue Paths Phase 1 split into Slice A (tree rails + numeric ranks) → B (Form fork + the
  reusable evolution overlay + the charter-critical `gSimEvolution` headless hook) → C (rank-10 ascension:
  3-hit combo + two burning-ground substances + four climaxes) — each `node --check`'d, grep-proven,
  node-logic-tested, and committed alone. A "Skillforge" panel (imbue / rank / trigger any fork on the
  shipping code) turned "grind the wilderness to rank 9 to test the capstone" into one button, and let the
  user redirect the wave shape, jet shape, ball size, ground placement, and ring radius ~7 times in a row —
  each a one-constant edit (`FW_*`, `DRAGONFIRE_JET_*`, `FLAMEOFCHAOS_*`, `FIREFIELD_EYE`) because each
  shape lived in *one* accessor/spawn. Once the rails existed, every leaf was registry data + one bespoke
  FX function. The riskiest piece (a new pausing modal) was de-risked by reusing Slice B's overlay+hook.
- **How to apply:** For a spec'd epic, build the system + its highest-feedback instance first (front-load
  the system risk); fan out the rest as registry data + per-instance FX. Stand up a `_DEV`-gated harness
  early, route it through shipping code, and make it reachable wherever you actually test (town **and**
  dungeon — drive its visibility from the one `showScreen('game')` gateway, gate actions on
  `isGameActive()`). Keep every feel value a named knob; centralize a shape into one source of truth
  (e.g. `gFireWaveShape` read by both hitbox and draw) so "what you see is what you hit" and one edit
  retunes both. **Committing intermixed feature + incidental tweaks from the single `index.html`:** split
  into clean commits by *snapshot full → scripted-revert one concern (report OK/SKIP/FAIL per site) →
  commit → restore the snapshot → commit the rest* — never hand-reapply a large block. And `node --check`
  is blind to runtime faults: a `const` referenced by the **boot path** before its own declaration line
  throws a TDZ error on load (the deploy-breaking kind), so declare cross-cutting flags (`_DEV`) early and
  verify behavior, not just parse.

### 2026-06-10 — Measure sprite scale & art quality; never trust a handoff figure or an eyeball (consolidated)

- **Principle:** Sprite-art numbers — a pose's draw-mult, a cutout's edge quality, a facing's scale — are
  **measured against a known-good reference**, never trusted from a handoff or judged by eye. (1) **Draw-mult:**
  before wiring any action-pose sheet, run `python tools/check-pose-scale.py <prefix> --mult M --plant P` to
  exit 0; match idle *apparent* size by the **mean of head- and shoulder-width ratios** (pose-invariant) — never
  bbox/`bodyH`/body-fill, which a different silhouette distorts. Each pose gets its own named const; coiled
  stances also need a plant offset (= idle feetY − pose feetY). (2) **Cutout quality:** measure the alpha-fringe
  (8<α<200 band brightness) against a clean sibling — a wide mid-gray band (~55) vs a tight dark one (~14) is a
  keying halo, an *art* defect, not a render one. (3) **Role boundary:** slicing is the Artist's craft; the
  engineer wires a **data-driven map** (`PLAYER_WALK_OCT`{octant→dir} + `char.<id>.<dir>` keys) so each variant
  is a one-line wire and the Artist commits `assets/` independently of your `index.html`.
- **Why:** the heavy wind-up shipped at `1.3` (copied from the swing on a bbox-fill parity in the handoff) and
  rendered ~30% too big; I once *eyeballed* an overlay and grew+clipped a helmet — both "trusted a number I didn't
  measure." The estimator validates against known-good art (the in-game-correct dash measures head/shoulder mean
  1.00), and the metric can itself be noisy (an extended sword inflates shoulder width → per-facing 0.77..1.94).
  **Gotcha:** `gDrawSprite` maps the WHOLE canvas to `PSCALE*mult`, so the mult is coupled to cell size — re-cut a
  sheet to a new cell (192→208 to recover a foot) and the mult must re-scale `new/old`; re-run the tool.
- **How to apply:** treat every scale/quality figure in a handoff as a hypothesis; verify with the tool before
  wiring. **When a shaky metric and the user's eyeball disagree, let the user's reports set the bracket and the
  metric interpolate within it** — two contradictory-sounding reports ("too big" then "too small") are a binary
  search, take the midpoint; reserve metric-over-eyeball for trustworthy stable stances. When a recurring
  art-wiring judgment keeps biting, encode it as a pass/fail measuring tool (normalised by the unit it compares
  in) so the next session can't trust-the-eyeball back in. (Memories `sprite-size-consistency`, `sprite-pipeline-role-boundary`; raw originals in `archive/`.)

### 2026-06-10 — A user blaming a visual bug on your edits is a hypothesis to test, not a fact to accept — archived
- Prove causation with two cheap checks before accepting/denying: (1) `git diff <session-base>..HEAD -- <artifact>`
  filtered to the relevant render path (often **zero** matches), (2) measure the suspect asset vs a known-good
  sibling. Separate **render-path regression** (your lane — the diff decides) from **asset defect** (measure →
  owning role's lane) and route it with the data. Full entry:
  `agents/engineer/archive/2026-06-10-visual-bug-blame-is-a-hypothesis.md`.

---

### 2026-06-09 — A deferred entry's "Fix:" is a hypothesis, not an instruction — re-verify its premise — archived
- A backlog/spec "Fix:" premise rots between writing and acting; re-confirm against *current* code before
  executing — especially destructive prescriptions ("just delete it"). Grep the symbols it names, trace
  reachability + every consumer; if the premise is false, reframe the entry and report, don't proceed. Full
  entry: `agents/engineer/archive/2026-06-09-deferred-fix-is-a-hypothesis.md`.

### 2026-06-09 — A mode-global flipped for a special mode must be torn down symmetrically — archived
- A sub-mode (headless sim/debug/replay) that flips a *shared global* must restore it on exit
  (save-at-entry / restore-in-`finally`), or the mutation leaks and silently breaks the default mode far
  from the toggle (`Sim.startRun` left `_SIM.muted` set → game mute after any `Sim.batch`). Mirror a sibling
  global already toggled correctly in the same scope; treat the AI-native harness as production code. Full
  entry: `agents/engineer/archive/2026-06-09-symmetric-teardown-of-mode-globals.md`.

### 2026-06-09 — A new standing entity population is a hidden input to every global census — archived
- Adding a large *persistent* cohort to a shared collection (`gEnemies`) silently breaks any unfiltered
  scan/count over it (the ~160 neutral wolves pinned the night-siege live-cap). Give cohorts a
  discriminator and make each census express *intent* ("threat-relevant"), not mere liveness. Full entry:
  `agents/engineer/archive/2026-06-09-standing-population-global-census.md`.

### 2026-06-09 — A repo-wide rename is two categories (display text vs frozen compat tokens) — archived
- Split occurrences into rename-freely **display text** vs **never-touch frozen tokens** (seed prefix `DF1`,
  storage keys, many-reference filenames, `docs/archive/` snapshots) — renaming a frozen token silently breaks
  live data; triage every variant before a find/replace. Full entry:
  `agents/engineer/archive/2026-06-09-repo-rename-two-categories.md`.
