# Artist memory — archived raw entries (2026-06-13 compaction pass)
*Archived 2026-06-13: `memory.md` crossed its `memory_compact_at` of 250 lines. These entries were merged /
raised in altitude into the live `agents/artist/memory.md`; kept verbatim here for the raw specifics (exact
px values, flag values, incident narrative) the compacted lessons distill out. Mapping:*

- *The nine-point single-FX entry → live "FX cutout decision tree" (2026-06-12).*
- *The tiles-vs-props entry + the heading-less tall-variant-props block → live "A 3×3 sheet's right treatment
  depends on what the cells ARE" (2026-06-12).*
- *The heading-less draw-layer-effect block + the 2026-06-09 boundary entry → live "Done = on-style + spec
  handed off…" (2026-06-09/12).*
- *The pose-scale + walk-video entries → live "Action/motion sheets must register against the SHIPPED idle"
  (2026-06-10).*
- *The 2026-06-11 verify-vs-`index.html` entry → kept live, lightly trimmed; its `docs/TASKS.md` lane
  references were repointed to the per-agent task docs (`docs/tasks/artist.md` / `engineer.md` / `pm.md`)
  after the 2026-06-13 tracker split. Original wording below.*

---

### 2026-06-12 — A single FX sprite is NOT a variant sheet; the white-hot core survives edge-seeded flood *because* it's interior, which is also why fire never wants `--global`

- **Principle:** Match the cut to the asset's *cardinality*, not just its kind. A lone FX sprite (one `fx.<id>`
  key — the `fx.thrust`/`fx.slash`/`fx.fireexplosion` shape) is **not** a 3×3 variant set, and `slice-variants.py`
  is hardcoded 3×3 (`W//3, H//3`) — it can't process one sprite. The right pipeline is still `cut_cell` +
  `recover_specks` (FX flying embers ARE the art), just applied to **one cell**. I encoded that as
  `tools/slice-single-fx.py` rather than hand-bridging — the recurring single-FX-cutout case now lives in the
  tooling (sibling to "migrate the tool when you migrate the pipeline" / "encode a recurring defect class as a flag").
- **Why — the white-bg-vs-white-hot-core trap, and the connectivity insight that defuses it:** a fire burst on
  white has a near-white core; a naive whole-image white-key would punch it transparent. **Edge-seeded flood fill
  keeps the core for free** — the core is *interior* (surrounded by orange flame), so it's never border-connected
  and the flood never reaches it. Same fact, contrapositive: **do NOT reach for `--global` on fire** — `--global`
  cuts *enclosed* bg pockets, and a white-hot core reads as an enclosed white pocket → global would punch it out.
  (`--global` is for a genuine hole like the gap inside a drawn bow, not a bright core.) The bg-leak metric
  over-reports here (the core counts as "bg-white") — 321px on a clean cut; the magenta contact is the verdict.
- **How to apply:** (a) for a single burst/impact FX on a plain bg → `slice-single-fx.py <img> <id> --bg white
  --erode 1 --out-dir assets/fx/<owner>` (fx folds by OWNER, not derivable from the id, so name the owner dir).
  Default keeps specks; `--no-specks` to drop them. (b) Diagnose core-vs-hole before picking `--global`: a *bright*
  enclosed region is figure (leave default edge-seeded); an *empty* enclosed region (true gap) is the only
  `--global` case. (c) Handoff: a transparent FX cutout draws fine alpha-composited, but additive `'lighter'`
  reads hotter for fire-over-scene (transparent contributes nothing, flame pixels add) — name it, engineer's call.
  Where it *fires* (which skill) is a design call — deliver the clean asset + key, don't presume the wiring.
  **(d) Pure light-on-black bursts (shockwaves, glows, a white-hot impact) → DON'T cut at all.** When the master
  is bright light on a black field and the soft radial glow IS the art, the right deliverable is **not** a
  transparent cutout — additive `'lighter'` *is* the background removal (black contributes nothing). Just
  resize→**floor faint ambient to true black** (`max(R,G,B)≤~8 → 0`, re-floor after LANCZOS ringing)→optimize,
  and hand off black-bg + `'lighter'` (the `FP_SPR`/`FW_SPR` pattern). A hard alpha cut would clip the glow
  falloff; flooring kills the square wash (QA: corners must read `(0,0,0)` — a faint non-zero ambient adds a
  visible square under `'lighter'`). The discriminator vs. `--bg white` cutout (fireexplosion): **is it pure
  light you want to keep glowing, or a coloured object with edges?** Light→keep-black-additive; object→cut.
  (Proven on the leap-landing `jump-impact` shockwave — 1254² master, never wired; the win was choosing the
  *medium*, not running a slicer.)
  **(e) "Transparent" gen art is often an OPAQUE painted near-white checkerboard — check the corner alpha first.**
  ChatGPT/diffusion FX exports frequently *draw* a grey/white checkerboard to look transparent; the corner pixel is
  `(254,254,254,255)`, not `(_,_,_,0)`. So it's a real bg-removal job, not a trim — sample a corner, find the two
  checker shades (here white 254 / grey 241), set `--thresh` to catch the darker shade (`255-thresh <= 241` → ~16+).
  **(f) Fire/smoke defringe is NOT character defringe — the white-bg sibling of the (d) split.** A black-smoke FX on
  white (chaosfire) leaves a pale *neutral* halo: the AA edge is figure-blended-with-white (grey ~`(185,169,164)`),
  bright enough to survive the brightness key but not white enough to flood. `defringe-sprite.py` is WRONG here — it
  clamps edges to a DARK outline tone (right for a knight, it would *blacken* the glow). Fire halo must fade to
  **transparent**, not dark → new `slice-single-fx.py --dewhite` = neutral-gated white-spill alpha suppression
  (`a *= (255-min)/255` only where low-saturation, so coloured flame wisps are untouched). Diagnose first: split edge
  pixels into *neutral-bright* (halo → dewhite) vs *saturated* (real flame → leave) — the dragonfire pillar's edge was
  saturated orange `(246,148,129)` → no halo, untouched, while the grounds' neutral edge needed it.
  **(g) QA over the DARK game bg, not just magenta — a white halo's worst-contrast case is near-black, which magenta
  hides.** I passed all 6 on the magenta contact; Josh saw halos on 3 over the real dark scene. Composite over
  `(26,26,28)` (paste-with-alpha) and eyeball. (Sibling to "every QA metric can lie; the render is the truth.")
  **(h) COMPOSITING is part of the spec and splits by substance:** additive `'lighter'` erases black → chaosfire's
  black smoke vanishes if drawn additively. So **chaosfire = NORMAL alpha, dragonfire = additive** (bright, no black)
  — same draw entity, opposite blend; name the op per substance in the handoff. **(i) Tall FX keep native AR
  (`--frame tight`, not square pad):** the engine draws pillars at a fixed `FP_SPRITE_AR`, so square padding squishes
  them; deliver bbox-AR + report the ratio so the engineer uses `naturalWidth/Height` or a per-substance AR.

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

### 2026-06-11 — Before reporting an art task as "outstanding," verify it against `index.html` — handoff docs lag the engineer's wiring (ORIGINAL — live copy repointed to the per-agent task docs)

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
