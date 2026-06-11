# Artist — Memory
*Crystallized, transferable art lessons. Read first each session; append at session end. Self-compact when over 250 lines (merge/supersede/raise-altitude; archive superseded entries to `agents/artist/archive/`).*

---

### 2026-06-12 — Organizing assets for an AI-native game: foldering is mostly human-readability; machine-value comes from where CODE reasons, or from DERIVING the dimension cheaply

- **Principle:** Before a structural reorg, ask the AI-native question Josh asks — *"does this actually help the
  agents/engine, or is it human cosmetics?"* — and **answer it honestly, don't defend your own work.** A folder
  tree is navigated by humans; an AI navigates by **grep/glob and by the `ART_MANIFEST` *key*** (`world.foresttree.0`),
  which is built by **string concatenation at each draw site** (`'world.tree.'+variant`) and almost never parsed.
  So foldering `assets/` changes only the path *string* a key points at → **near-zero machine value on its own**
  (the keys already gave perfect structure). The machine-useful fact a fold *can* add is **membership** (which
  area/owner a thing belongs to) — but only if that membership lands somewhere code/agents read.
- **Why — the resolution that beat both extremes (the "B+" call):** the honest options were (A) put area *in the
  key* (`world.<area>.<id>`) — purest but a whole-keyspace rename + every concat site, deploy-gated, typo→silent
  procedural fallback; (B) area in the *folder only* — cheap but invisible to anything reading keys, one `git mv`
  from desync. The winner was **derive the dimension from what you already built**: keep keys flat, and at boot
  parse the foldered **path** (`assets/world/<area>/…`) into a runtime `gAreaAssets` map (~5 lines, pure addition,
  no key/draw churn) — making area queryable *and* unlocking per-area asset load/unload. The fold becomes the
  *data source*, not the deliverable. **Corollary — don't fold what's redundant:** `tile/` by type is restating
  the id (`tile.grass.*` already says "grass", and `gInitArt` reads it via `split('.')[1]`), so it stays FLAT.
  Fold only where the folder adds a NEW machine-legible fact (area, for `world/`).
- **How to apply:** (a) **assets/ upkeep is now a standing Artist responsibility** (`agents/artist/artist.md`):
  keep it structured as areas multiply; the living scheme is `assets/README.md`; **per-kind axis** (`char/` by
  faction→type, `fx/` by owner, `world/` by **area** + `_shared/`, `tile/` **flat**) — never one axis everywhere,
  fold only at >~12 and kept shallow. (b) A code-referenced reorg is a **two-owner atomic op**: Artist owns the
  scheme + tool + dry-run, the **engineer** runs `fold-assets.py --apply` (git mv + manifest rewrite in ONE
  commit — sole `index.html` editor); half-done = 404'd art that silently falls back. (c) **Migrate the slicer
  with the fold** (the recurring lesson): `slice-variants.py` now imports the `FAMILIES` map and auto-routes
  `world` slices into `world/<area>/` + emits the foldered path, so new art doesn't re-flatten; an unmapped id
  warns + falls back flat → add it to `FAMILIES` first. (d) When you reach for an art tool (Pillow, a fold
  script), first check the deliverable's *medium* — here the real lever was a 5-line engine change + a spec, not
  more asset moves (sibling to the 2026-06-12 "draw-effect is engineer-owned, hand off the look" lesson). Spec
  the tradeoff (`docs/specs/asset-area-namespace.md`) and let Josh pick the altitude.

### 2026-06-12 — Opaque ground tiles vs. transparent prop cutouts need OPPOSITE slicing; single props reuse the slicer's `cut_cell`

- **Principle:** A 3×3 sheet's right treatment depends on what the cells *are*. **Opaque ground tiles** (forest
  grass) must end up **full-bleed** (texture edge-to-edge so they tile seamlessly) — so if the sheet frames each
  tile with a dark bushy fringe + margins, you **crop the inner solid square inset past the fringe** (measure the
  content bbox per cell, inset ~11%, resize to the live tile res, output **opaque RGB**). Do NOT run the cutout/
  bg-removal path on them — alpha-keying the fringe gives a tile with transparent edges that shows a grid when
  tiled. **Transparent props** (barrel/crate) are the opposite: edge-seeded flood-fill the bg + erode the halo,
  keep alpha. Match the **existing family's** treatment (the live `grass-*` are 96² opaque full-bleed — I matched
  that, not the artist.md's stale "128" note).
- **Why:** I nearly defaulted both to `slice-variants` (a cutout tool). The grass tiles needed a *custom* inner-
  square crop (no tool flag fits "drop the framing fringe, stay opaque"); the single props needed bg-removal but
  aren't a 3×3 sheet — so I **imported `cut_cell` from `slice-turnaround.py`** and ran it on the whole image
  (a single prop = a one-cell sheet). Reusing the slicer's accumulated edge-case logic beat hand-rolling flood
  fill.
- **How to apply:** (a) **Verify tiling, not just the cutout** — render a 4×4 repeat of a ground tile and eyeball
  for a dark-edge grid / seams; the magenta contact only proves the cutout, not that it *tiles*. (b) For a single
  isolated prop on a plain bg, `import cut_cell` (+ `--erode`-equivalent) rather than reaching for `extract-town-
  props.py` (that's for props fused to busy same-colour ground). (c) Trust the in-game/over-ground render over any
  bg-leak number — bright foliage/grass over-reports leak (the metric counts near-white highlights as bg).

- **Principle:** A 3×3 *variant* sheet of tall feet-anchored props (trees, bushes) has two failure modes the
  default `slice-variants.py --frame cell` path can't handle, and both must be fixed **in the slicer**:
  (1) **Canopy overflow** — bottom/middle-row figures are drawn taller than their cell and bleed *up* into the
  cell above; `slice-variants` crops to the *exact* cell **before** cutting, so the overflow is gone before
  `cut_cell` ever sees it → flat-topped sprites. Recovery needs the expanded-window + `keep_owner` pattern
  (cut a window N px past the cell, keep only the component owning the cell, discard the neighbour pulled in)
  — which lived only in `slice-turnaround.py`. I **ported it as `slice-variants.py --bleed`** (+ imported
  `keep_owner`). (2) **Inconsistent feet** — `--frame cell` leaves each figure's feet wherever the art sat in
  its cell, and `--frame square` *vertically centres* (feet at different heights). A feet-anchored prop drawn
  by one engine foot fraction (`TREE_FOOT`) needs **every variant on one foot baseline** → I added
  `--anchor bottom`/`--foot-pad`: shared square sized to the largest figure, each placed feet-on-a-line a
  fixed pad above the bottom, so foot fraction = `1 - foot_pad` is identical across all variants (and relative
  scale is preserved — no per-figure resize).
- **Why — diagnose overflow vs. flush before reaching for `--bleed`, because the obvious metric lies:** a
  "non-white pixels in the band *above* the cell top" count is **confounded by the adjacent cell's content**
  (the tree above's base/roots sit in that band). The clean diagnosis: per cell, scan **upward from the cell
  top to the first near-white separator row** (that distance = this figure's true overflow, ~33px for the
  worst trees here), and **crop the boundary strip with the cell line drawn on it and eyeball it** — you can
  see the lower canopy cross the line with a clean white gap to the upper base (→ recoverable, figures don't
  touch → `keep_owner` is unambiguous). top_gap=0 on the cutout = touches the edge; combined with measured
  overflow = clipped, not merely flush.
- **How to apply:** (a) for any tall variant-prop sheet, slice with `--bleed N` (N a bit above the worst
  measured overflow) — it implies bottom-anchoring; QA the magenta contact for full crowns + a common foot
  line + no neighbour fragments (the `comps=N` print shows how many blobs `keep_owner` weighed). (b) **Report
  the foot fraction as size-coupling** in the engineer handoff: bottom-anchored framing fixes the foot at
  `1 - foot_pad` (~0.94 here), so `TREE_FOOT` must match; and because the canvas now holds the *full taller*
  tree, the body is a smaller fraction of the canvas → at the same draw size it renders ~8–10% smaller, so
  `TREE_BASE` may need a bump (name both, engineer moves them together). (c) Same-keys re-slice = **drop-in**
  (no manifest/draw change); a genuinely new variety gets a new id/keyspace (`world.treesmall.*`) + a wiring +
  placement handoff. (d) Sibling to the 2026-06-10 "encode a recurring defect class as a slicer flag" lesson —
  overflow recovery for variant sheets now *is* `--bleed`, so the next tall-prop sheet just works.

- **Principle:** When a task produces **no new sprite** — a glow, tint, shader-like tell, anything composited per-frame over a moving sprite — it is a **draw-layer effect, not an art asset**, and it is **engineer-owned** (it lives in `index.html`'s draw loop). The Artist's whole job is the **look direction** (palette, subtlety, behaviour: "eyes-only, subtle, yellow→red") handed off as a spec — *not* a simulated render. Recognize the "no new sprites / lives in the draw loop / must read in motion at game zoom" signature early and hand off; don't escalate with art tools.
- **Why — the tool/medium mismatch that produced bad work:** asked for a subtle enemy-difficulty *eye glow*, I prototyped it in **Pillow** (a static raster lib) and it failed three ways, each a symptom of one root cause — *wrong medium*: (1) Pillow's `GaussianBlur` is isotropic, so an eye bloom bled straight onto the archer's **nose** — an artifact of the offline approximation that the canvas `'lighter'` composite wouldn't produce; (2) my mechanism was **per-pixel eye detection**, which the runtime **can't afford** across >100 night sprites, so I was tuning a pipeline the real renderer would never use; (3) a **3× static crop** misrepresented the only thing that matters — does a *subtle* tell read on tiny, moving, pulsing eyes at game zoom. Josh rejected it twice ("looks terrible… perhaps you aren't cut out for this"). The right tool shares the deliverable's medium: **canvas/JS — a standalone harness using the same `gctx` compositing, or the engineer wiring it in-game behind a dev knob** — never offline raster.
- **How to apply:** (a) **Triage by deliverable, not by topic:** "does this produce an asset file?" No → it's a render spec to the engineer; my output is colours + intent + a cheap-runtime *suggestion*, evaluated live. (b) **Match medium to medium:** Pillow + the slice tools are exactly right for the *static asset pipeline* (slice/cutout/defringe/source composites) and exactly wrong for *live render effects* — a still can't show motion, game-zoom scale, additive compositing, or pulse, and it invents artifacts. (c) Salvage the reusable nugget into the handoff (here: the eye-key thresholds `r>200,g>150,b<110,(r-b)>115` in the upper-head band + a boot-time cached-mask approach so it's pixel-accurate without per-frame detection), then **discard the wrong-medium mock** so no one reuses the approach. (d) Sibling to "your deliverable is the asset + a wiring spec, not a wired `index.html`" — this extends it: for a *pure* draw-effect there's no asset at all, so the deliverable is *only* the spec.

### 2026-06-11 — Before reporting an art task as "outstanding," verify it against `index.html` — handoff docs lag the engineer's wiring

- **Principle:** A handoff/roadmap note is a *snapshot at write time*, not live state. Engineer wiring
  routinely lands without the tracking doc being updated (doc-drift), so a ROADMAP/backlog entry that
  says "in flight / untracked / to-wire" can describe something already **shipped**. Never relay an art
  task as outstanding from a doc alone — **grep the proof in `index.html` first**: the `ART_MANIFEST`
  key (`char.<id>.<dir>`), the draw selector, and the scale constant; plus confirm the cutouts exist and
  are git-tracked. If all three are present, it's wired — the doc is stale, not the feature.
- **Why:** I opened a session reporting the heavy-attack windup as "the single most actionable artist
  task," sourced from ROADMAP item 0's stale build-note ("windup poses in flight, untracked"). It was
  fully shipped in commit `adf291d` — manifest (`char.playerheavywindup.*`), selector (`p.heavyWindingUp`),
  and `WINDUP_DRAW_MULT`/`WINDUP_PLANT` constants all live; same for the dash. Josh caught it. The
  session-start brief + handoff docs are a starting *hypothesis*, not ground truth.
- **How to apply:** (a) the moment a task is "report what's outstanding," reconcile each candidate against
  `index.html` (one grep per manifest key) before listing it — wiring presence is the truth, the doc is a
  hint (sibling to the engineer's "diagnose ownership before touching" reflex). (b) When you find a doc
  stale, fix only the docs the Artist *owns* (this memory, your **Artist lane in `docs/TASKS.md`**) —
  **`docs/ROADMAP.md` is PM-owned and read-only**; flag a stale roadmap status to the PM (log it in
  `docs/TASKS.md`, don't edit the roadmap). Don't let a known-false note re-mislead the next session.
  (c) Source of truth for *outstanding* work is **`docs/TASKS.md`** (the shared task tracker, owner-lanes
  PM/Engineer/Artist — supersedes the old BOARD.md + CLEANUP_BACKLOG.md, merged 2026-06-11); treat this
  memory as the artist's *live* index but re-verify every claim against `index.html` + the tracker, never
  as settled fact.

### 2026-06-10 — Particle-system FX: hundreds of sliced sprites compose one skill, and a *scaling* effect scales by COUNT, not by upscale

- **Principle:** A second FX layer beyond the static effect-sprite: treat each sliced FX cutout as a tiny
  *instance* and spawn hundreds — the big skill (expanding spiral, ring, crescent, jet, ball) is *emergent*
  from the swarm. The one rule that makes it survive in-game: a skill whose reach/area grows with rank must
  scale by adding particle **count with area** (≈`scale^1.7`) at roughly constant per-particle size — NOT by
  bitmap-upscaling a fixed image, which goes fat + sparse + blurry. Density and grain stay constant; only the
  extent grows. Proven by rendering S/M/L at the same display box (wave/ring) — the grain was identical, just
  more of it. Tool: `tools/fx-skill-fx.py` (scale-aware emitters); `fx-particle-sim.py` (emitter base);
  `fx-gif-compose.py` (the earlier single-big-sprite keyframe model — the WRONG model for this, kept as a foil).
- **Why — the recipe that made shapes read** (Josh rejected the first cut as flat vs the dragonfire jet):
  (1) **sprite-variation MIX** — one sprite repeated reads as tiling; a weighted table across a set's cells
  (comets as directional streaks, flames as body, swirl as turbulence) reads organic. (2) **Spine
  concentration** — bias density onto the shape's defining line (ring band, crescent front, X arms, lane
  centerline, pillar columns, ball core) and taper the edges, so the silhouette is unmistakable; a uniform
  scatter is a blob. (3) **Directional alignment** — a flame sprite is native-"up", so `rot = target_dir_deg +
  90` points it along the local shape direction (radial / arm / jet axis); bursts rotate freely. (4) **Colour
  recovery** — vivid hues that live in a sprite's soft low-alpha wisps sink toward black when composited small;
  a saturation bump *plus a brightness lift* (black stays black under multiply) raises them back out (dragonfire
  rainbow). A "solid + rainbow" ask is in tension: dense overlap reads as the hot warm core, colour shows where
  it's sparse (tips) — name that trade-off rather than chasing both at the core.
- **How to apply:** (a) **Read the implemented skills before authoring FX** — map effects to what's real
  (here the Cilia's Fire kit + Dance-of-Fire ascensions), and verify "off-style" art against the code first:
  the prismatic *dragonfire* and dark-red *chaosfire* I'd flagged as off-house-style were literally named
  in-game substances. (b) For a *traveling* effect (the chaos ball), drive every particle's start/end off a
  shared `centre(global_t)` so the mass stays coherent and moves one way — independent per-particle paths gave
  "two clouds drifting apart". "Heavy/solid" = crank **count** + centre-bias the radius + full opacity, not
  bigger sprites. (c) A hollow **ring** cell's empty middle is an *enclosed* bg pocket → `--global`, not
  `--sever` (sever fills it opaque — it keeps interior as figure). Diagnose enclosed-vs-border-connected before
  picking the flag. (d) Deliverable framing: the **GIF is an evaluation artifact** (gitignore the heavy
  `_gifs/`/`_qa/`); the in-game form is a **frame-strip PNG + `'lighter'` compositing** + a scale-tier
  decision — an engineer handoff, not a GIF drop. Build the emitter with live knobs (MIX table, concentration
  bias, `omax` taper, `saturate`/`bright` on the return) so tuning is data, not code surgery.

### 2026-06-10 — Cutout-defect diagnosis: classify by measurement before reaching for a flag, and every QA metric can lie

*Raised from four 2026-06-10 entries (prove-ownership / halo-stack / geometry-first / clip-separator); raw
detail with exact px counts + flag values in `archive/2026-06-10-cutout-defect-raw.md`.*

- **Principle — diagnose the defect *class* by measurement, then pick the tool; never guess a flag.** Each
  cutout defect has a measurable signature that names the fix, and they don't overlap:
  - **Geometry (clipped paw/foot/holes):** compare each figure's connected-blob bbox to its **cell** and to
    the **sheet edge**. Overflow past the cell but *not* the sheet = pixels exist, the rigid crop discarded
    them → recoverable with `--bleed` (cut an expanded window, keep the component that owns the cell). Overflow
    past the *sheet* = never drawn → needs new art, no flag helps. White-on-white interior holes → `--sever`.
  - **Colour fringe (grey halo on the soft edge):** the RGB of the semi-transparent edge is bg-blended grey,
    not the house dark outline → luminance-clamp it to the idle outline tone (`defringe-sprite.py`). Re-keying
    is the wrong tool here (a `--tol` sweep eats the neutral-grey steel; nearest-solid bleed *brightens* it).
  - **Baked cast shadow (opaque smudge trailing the feet, `α=255`):** colour-only can't touch it → **re-cut**
    seeding the shadow as definite bg (`slice-walk-video.py --shadow-bg`), bounded by `--shadow-lum`/`--shadow-band`
    so it doesn't eat the dark boots that sit in the same bottom band.
  - **Localized border on a *symmetric* prop (one-side-only):** that's a directional baked shadow gradient, not
    AA → raise `--thresh` to key the shadow band as bg (exploit the figure-vs-shadow colour gap), **not** `--erode`.
    A uniform thin bright ring *is* true AA → `--erode`. The tell: sample the edge gradient per side (sharp 1px
    ramp = AA; gradual ramp into a near-neutral band = shadow).
- **Why — the metric trap: every QA number can false-pass or conflate, so the render is the truth.** A
  fringe metric that measures only a soft sub-band (`8<α<200`) misses the bright near-opaque rim (`α 200–239`)
  and opaque smudges (`α=255`) — a frame measured "clean" while Josh still saw the halo (defringe-v1). A
  foot-area pixel count **conflated** intended shadow-removal with unintended boot-loss, so −44% was mostly
  legitimate and the post-fix count barely moved (recovered boot ≈ extra shadow removed) — blind to both
  effects. Fixes: QA a fringe metric against the idle's **full ring** (`8≤α<245`); **split** any count that
  sums opposing effects; and judge by the **over-ground render + magenta contact (before/now/fix three-way)**,
  not one average.
- **How to apply:** (a) for any "X broke my asset" report, **prove ownership first** — `git diff HEAD` +
  the tool's write-set (`{id}-{dir}.png` for its `id`) separates "did this change?" (git) from "is it
  defective?" (pixels); it's usually a two-command exoneration, and often the real cause is a *prior*
  session's re-cut. (b) An mp4 re-cut is **alpha+RGB** → it undoes any prior RGB-only defringe; **defringe
  must follow every re-cut.** (c) A backlog note that asserts "boots survive" is a claim to **re-measure
  across every affected facing**, not assert from the easy ones (the planted side-profile foot sits deepest
  in the shadow-seed band). (d) When a defect is a *recurring class*, encode it as a documented slicer flag —
  the slicer is the accumulated solution to every cutout edge case; a new edge case belongs *in* it. Snapshot/
  commit before in-place rewrites — recoverability is what makes rejected experiments safe.

### 2026-06-10 — A pose's scale recommendation in a handoff must be a head/shoulder measurement, never bbox/body-fill

- **Principle:** When handing off an action-pose sheet (wind-up, dash, swing — anything whose silhouette
  differs from idle), the draw-mult I recommend must come from **`python tools/check-pose-scale.py <prefix>`**
  (mean of head-width and shoulder-width ratios vs idle, per facing) — **not** bbox height, `bodyH`, or
  "body-fill" parity. `--match-bodyh` in the slicer is correct only for idle-silhouette sheets (walk cycles);
  for a coiled/extended pose, bbox height lies about body size. Paste the tool's `RECOMMEND draw-mult` and
  `feet-plant` lines into the handoff verbatim.
- **Why:** I handed off the heavy wind-up recommending the swing's `1.3` mult on a 0.736-vs-0.732 body-fill
  parity — it rendered ~30% too big (Josh flagged it). The coiled pose has a short bbox but normal-sized body:
  by head/shoulder it's idle-sized in-cell (shoulder 90 vs 92), true mult ~1.07. Head and shoulder each alone
  are noisy and move *oppositely* across silhouettes; their **mean** cancels it (the dash, correct at 1.0,
  measures head 1.12 / shoulder 0.88 / mean 1.00).
- **Corollary — a re-cut that changes the frame/canvas size is a COUPLED engineer change; flag the exact
  ratio.** Recovering the heavy-swing's overflowing back foot forced all 8 facings to a 208 frame (from 192);
  `gDrawSprite` scales the whole canvas, so the engineer's draw-mult had to grow `208/192` (≈1.08×) or the
  body shrinks. "I preserved the body scale" is *not* enough — the frame size is itself a render coupling.

### 2026-06-10 — A motion clip isn't a turnaround sheet: registration must match the shipped idle sheet

- **Principle:** A generated **walk video** drifts in scale (subject walks toward/away, ~10–25%), translates,
  and may turn in the first frames before settling. So pick all N frames from **one gait cycle** in the
  settled-facing window, use **one uniform feet-anchored scale** (preserves the natural contact-vs-passing
  bob; per-frame height-normalisation flattens it), and **match the existing idle sheet's body height + feet
  baseline** — the live system swaps idle↔walk at the *same* draw scale, so a self-normalised frame (body
  168, feet floating y180) pops vs the idle (body 180, feet y191). (The cutout/separator half — GrabCut when
  fg/bg colours overlap — folded into the cutout-defect lesson above.)
- **How to apply:** for any video/photographed source, (a) **verify source identity + facing first** by
  zooming an unambiguous feature (helmet back vs visor — don't trust full-body silhouette at thumbnail size;
  I burned a cycle on a stale renamed clip that turned front→back), (b) measure the **already-shipped** sheet
  you must match and drive scale/feet from it (it's the ground-truth spec, not a guess), (c) it's encoded in
  `tools/slice-walk-video.py` (GrabCut + `--match-bodyh` + feet-anchor + `--mirror`).

### 2026-06-10 — Mirroring an asymmetric sprite: measure against ground truth, patch only what flips

- **Principle:** "No lazy mirroring" is a *generation* rule, not an absolute runtime ban. Before committing
  to redraw an opposite facing, **measure how wrong a flip actually is against the true-rotated idle you
  already have** — pixel-diff *and* eyeball at full size. For this knight only the sword shoulder visibly
  flips, and even that reads correct at full size; scabbard/strap/rim-light flips are sub-perceptual. So
  E↔W, NE↔NW, SE↔SW mirror cleanly — halving an 8-direction job (~24 generated frames → ~12 + a deterministic
  flip, `art/player/_mirror-QA/`). Where a flip *does* break one part, re-composite only that part.
- **How to apply:** when an opposite facing is needed and a true-rotated reference exists, build the
  mirror-vs-truth comparison first and let it decide; generate fresh art only for the parts the flip can't carry.

### 2026-06-09 — Done = on-style + spec handed off + (engineer-)verified render; your deliverable is never a wired `index.html`

- **Principle:** The Artist does not edit `index.html` — the engineer is its sole editor. You produce the
  art files (`assets/`/`art/`), the slice tool's output, and a *render spec* (paste-ready `ART_MANIFEST`
  snippet + draw/scale intent + size-coupling); the engineer wires it and verifies. An asset only *counts*
  when it matches the established direction **and** renders in every facing in the live game — consistency
  over novelty, no half-measures (6 clean cutouts + 2 haloed = not shipped). So "done" for the Artist =
  "on-style, QA'd magenta-clean, spec handed off, assets correct" — not "I made it render."
- **Why:** "art" tasks kept forcing edits into procedural code (the wolf-bite hold lived as a timer tick
  inside `_aiWolf`). When a role's work routinely crosses its own boundary, the boundary is drawn wrong — so
  we redrew it along *declarative-art vs procedural-code*, not by region of one file. One owner on the single
  game file removes the two-roles-one-file risk (and a stray quote in a manifest path breaks all of `index.html`).
- **How to apply:** slice → drop cutouts in `assets/` → QA the magenta contact sheet → verify *your* output
  (clean cutouts, correct keys/paths, files present). Then hand off the snippet + `<ID>_SCALE` value/feel +
  any size-coupling (scale ↔ hitbox ↔ attack radii) for the engineer to apply and prove in one commit
  (`node --check` + grep the key + load all 8 facings). If a task needs a code edit, describe the intent —
  don't reach into the file. (Sibling to the 2026-06-11 verify-vs-`index.html` lesson.)

### 2026-06-09 — Migrate the tool when you migrate the pipeline, or every use pays a hand-bridge tax

- **Principle:** When the asset pipeline changes shape (here: inline base64 → external files under
  `assets/`), the generator that feeds it has to move in the same step. A tool left a step behind doesn't
  fail loudly — it silently makes every future use a manual fix-up.
- **Why:** `slice-turnaround.py` kept emitting base64 manifest snippets long after art was externalized,
  so each slice meant hand-dropping PNGs into `assets/char/` and rewriting the snippet to paths — a
  deferred-tooling debt invisible until it accreted across many uses.
- **How to apply:** when you change where art *lives* or how it's *referenced*, grep the tooling that emits
  that reference (`tools/`) and update it in the same pass; make the output paste-ready for the *current*
  pipeline and smoke-test it on a real sheet — a tool that compiles but emits the old format is still broken.

### 2026-06-09 — A sprite's dwell time is a feel knob, separate from the action's hitbox timing

- **Principle:** "Wired and rendering in all 8 facings" isn't "done" — a pose/attack sprite also has to
  *read* at gameplay speed, and how long it stays on screen is its own tunable, not a free by-product of the
  combat window that triggers it.
- **Why:** the wolf lunge art was sliced clean, registered, `node --check`'d — yet playtest said it "flashed
  past," because the swap condition (`biteStrike`, ~12f) is the *combat* follow-through, too short to read.
- **How to apply:** give the *display* its own hold timer (e.g. a draw-only `_biteHold`) decoupled from the
  hitbox/recovery math, so readability tunes without touching combat feel — and treat a real playtest, not
  the render, as the acceptance test. Coordinate with the engineer when the only lever is a combat-timing field.
