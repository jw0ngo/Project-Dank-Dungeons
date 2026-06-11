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

### 2026-06-12 — Occluding environment sprites: a reusable system + three rules (cull by extents · fade tracks the occluded · hitbox matches the art)

- **Principle:** A tall world-prop the player can walk behind (tree, and future pillars/statues) is the
  `gWildTrees` / `gDrawTree` / `gRCTrees` family. Three rules make it read right and all transfer to the next
  such sprite:
  1. **Cull by the DRAWN extents, not the anchor.** A foot-anchored sprite draws far ABOVE its foot, so
     culling on the foot with a small margin clips *visible* sprites at the screen edge → "popping." Use
     margins derived from the size const (canopy reaches ~0.93·h above the foot). Latent at small scale,
     blatant at 2×.
  2. **The occlusion-fade boundary must track the OCCLUDED entity, not a fixed fraction of the occluder.**
     Standing rule of thumb: **the player's top half always stays visible** behind env sprites. How much of
     the sprite covers the player depends on where they *stand*, so map the player's **waist** (foot −
     `PLAYER_VIS_H`/2) into the sprite's image-height fraction and go fully translucent at/above it, ramping
     to opaque below. A fixed "top X% fades" is wrong — it ignores the player's position.
  3. **Hitbox matches the art's footprint, and the opaque region coincides with the hitbox.** A wide/short
     base (roots+rocks) is an **ellipse**, not a circle (a circle over-blocks vertically); a circle centred
     on the foot dips a full radius *below* the visible base and reads "too low" — anchor the shape so its
     base meets the ground contact. Drive the collision extent AND the always-opaque draw band from the
     **same const** so the player can see exactly where collision is.
- **Mechanics worth keeping:** depth-sort props by foot-y in the `drawables` list (NOT the tile pass, which
  always sits under entities) so the player tucks behind a canopy / in front of a trunk. Smooth opacity
  gradient = draw to a **reused offscreen** then `destination-in` a vertical linear gradient (a hard clip =
  visible seam); faded sprites only. Player-radius-inflated point-vs-ellipse is a fine cheap resolution.
  Placement seeded in map-gen ⇒ MP-deterministic. Every feel value (`TREE_BASE`, `TREE_DENSITY`,
  `TREE_BASE_RX/RY_FRAC`, `TREE_FADE_ALPHA/BLEND`, `PLAYER_VIS_H`) is a **named knob** — the feature
  converged over ~7 one-number user iterations (sibling of the visual-feature-converges-on-the-user's-eye
  lesson).
- **Applied + extended (2026-06-12, shipped v0.12.0):** added a `world.treesmall.*` set (foot re-measured →
  `TREE_FOOT` 0.94; both sets fill the canvas, so "small" reads smaller only via a smaller *draw scale*) and
  rebuilt placement as weighted **formations** — the hard tuning lived in the spacing rule directly below.

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

### 2026-06-10 — De-risk a large spec'd feature: sub-slice on rails, dev harness, named knobs — archived
- Land a big spec'd feature as independently-verified **sub-slices on rails built once**, plus a `_DEV`-gated
  harness that drives the *real* systems (one click to any deep state) and placeholder FX on named const knobs
  (feel-iteration = edit-a-number). Build the system + its highest-feedback instance first; fan the rest out as
  registry data + per-instance FX. Centralize a shape into one source of truth read by both hitbox and draw.
  Split intermixed commits by snapshot→scripted-revert-one-concern→commit→restore. `node --check` is blind to
  boot-path TDZ — declare cross-cutting flags early, verify behavior. Full entry:
  `agents/engineer/archive/2026-06-10-de-risk-spec-feature-rails-harness-knobs.md`.

### 2026-06-10 — Measure sprite scale & art quality; never trust a handoff figure or an eyeball — archived
- Sprite-art numbers (draw-mult, edge quality, facing scale) are **measured against known-good art**, never
  trusted from a handoff or eyeballed: match idle *apparent* size by the **head/shoulder-width ratio mean**
  (pose-invariant) via `tools/check-pose-scale.py`, not bbox/body-fill; gauge cutout keying by the alpha-fringe
  brightness vs a clean sibling. `gDrawSprite` couples the mult to cell size (re-cut cell → rescale mult
  `new/old`). When a shaky metric and the user's eye disagree, **let the user's reports bracket and the metric
  interpolate** (two opposite reports = binary search → midpoint). Full entry:
  `agents/engineer/archive/2026-06-10-measure-sprite-scale-and-quality.md`.

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
