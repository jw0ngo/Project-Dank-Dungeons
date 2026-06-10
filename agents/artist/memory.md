# Artist — Memory
*Crystallized, transferable art lessons. Read first each session; append at session end. Self-compact when over 250 lines (merge/supersede/raise-altitude; archive superseded entries to `agents/artist/archive/`).*

---

### 2026-06-10 — A pose's scale recommendation in a handoff must be a head/shoulder measurement, never bbox/body-fill

- **Principle:** When handing off an action-pose sheet (wind-up, dash, swing — anything whose silhouette
  differs from idle), the draw-mult I recommend to the engineer must come from **`python
  tools/check-pose-scale.py <prefix>`** (mean of head-width and shoulder-width ratios vs idle, per facing),
  **not** from bbox height, `bodyH`, or "body-fill" parity. `--match-bodyh` in the slicer is correct only
  for idle-silhouette sheets (walk cycles); for a coiled/extended pose, bbox height lies about body size.
  Paste the tool's `RECOMMEND draw-mult` and `feet-plant` lines into the handoff verbatim.
- **Why:** I handed off the heavy WIND-UP recommending the swing's `1.3` mult, justified by a 0.736-vs-0.732
  body-fill parity — and it rendered ~30% too big in-game (Josh flagged it). The coiled pose has a short
  bbox but a normal-sized body: measured by head/shoulder it's already idle-sized in-cell (shoulder 90 vs
  92), true mult ~1.07. Head and shoulder each alone are noisy and move *oppositely* across silhouettes
  (a coil shrinks the head's bbox share, widens shoulders); their **mean** cancels it — verified because the
  dash, correct at 1.0 in-game, measures head 1.12 / shoulder 0.88 / mean 1.00.
- **How to apply:** every pose handoff includes the `check-pose-scale.py` output, and for a pose whose feet
  sit above the cell bottom, the measured feet-plant (idle feetY − pose feetY) too. A body-fill / bbox figure
  is never a scale spec — it's the trap that this exact bug keeps falling into. (Sibling to the idle-match
  lesson below; user memory `sprite-size-consistency` + engineer memory updated with the same tool+gate.)
- **Corollary — recovering overflow that won't fit forces a bigger frame, which is a COUPLED engineer change,
  flag it loudly.** Same session: the heavy-swing back foot overflowed its 192 cell; recovering it (the
  `--bleed` class — pixels existed in the sheet, not redrawn) made the full figure ~202px, so I re-cut all 8
  facings to a **208** frame, body pixel-scale + feet baseline held identical. But `gDrawSprite` scales the
  whole canvas, so the engineer's draw-mult had to grow by `208/192` (≈1.08×) or the body shrinks. I flagged
  the exact ratio in the handoff — do that whenever a re-cut changes the canvas size, because "I preserved the
  body scale" is *not* enough: the frame size is itself a render coupling.

### 2026-06-10 — A motion clip isn't a turnaround sheet: the separator and the registration both change

- **Principle:** Slicing sprites from a generated **walk video** (vs a flat turnaround sheet) breaks two
  assumptions at once. (1) **Cutout:** the figure shares the bg's colour — the knight's steel is the
  same neutral grey as the studio backdrop and the navy tabard's shadows are as dark as it — so a
  brightness threshold eats the tabard, a tolerance flood leaks *through* the steel, and a median-plate
  bg-subtraction fails because a centred figure ghosts into the plate. **GrabCut** (colour models +
  spatial coherence) is the separator when fg/bg colours overlap. (2) **Registration:** a clip *drifts
  in scale* (subject walks toward/away from camera, ~10-25%), *translates*, and may *turn* in the first
  frames before settling — so pick all N frames from **one gait cycle** in the settled-facing window,
  use **one uniform scale** feet-anchored (preserves the natural contact-vs-passing bob; per-frame
  height-normalisation flattens it), and **match the existing idle sheet's body height + feet baseline**
  so the live sprite doesn't pop when idle↔walk swap.
- **Why:** the player walk system swaps idle→walk at the *same* draw scale, so a self-normalised walk
  frame (body 168px, feet floating at y180) popped vs the idle (body 180, feet y191). Measuring the idle
  *and the already-shipped* south-walk set gave the exact target (feet 191, bodyH ~180, uniform scale)
  — the shipped set was the ground-truth spec, not a guess. Also: I burned a cycle slicing a *stale
  renamed* source (an old clip that turned front→back) and a frame from inside its turn-in; the helmet
  zoom (smooth back vs visor front) was what finally settled facing.
- **How to apply:** for any video/photographed source, (a) **verify source identity + facing first**
  (zoom an unambiguous feature — here helmet back vs visor — don't trust full-body silhouette at
  thumbnail size; the crest was on both sides of the surcoat), (b) measure fg/bg colour overlap to pick
  the separator (GrabCut when they overlap, edge-flood only when bg is a distinct flat tone),
  (c) measure the **idle sheet** you must match and drive scale/feet from it, and (d) encode it in the
  tool — `tools/slice-walk-video.py` now does GrabCut + idle-scale match (`--match-bodyh`) + feet-anchor,
  with `--mirror` for the proven opposite-facing flip. Pick frames from a stable one-cycle window.

### 2026-06-10 — Mirroring an asymmetric sprite: measure against ground truth, patch only what flips

- **Principle:** "No lazy mirroring" is a *generation* rule, not an absolute runtime ban. Before
  committing to redraw/regen an opposite facing, **measure how wrong a flip actually is against the
  true-rotated idle you already have** — pixel-diff *and* eyeball at full size. For this knight the only
  asymmetry that visibly flips is the sword shoulder, and at full size even that reads correct (the flip
  matches the true-rotated idle); the scabbard/strap/rim-light flips are sub-perceptual. So E↔W, NE↔NW,
  SE↔SW mirror cleanly — halving an 8-direction job. Where a flip *did* break one part, the fix is to
  re-composite only that part, not regenerate.
- **Why:** the temptation was to treat the right-hand-sword rule as forbidding all mirroring; a 3-pair
  ground-truth comparison (`art/player/_mirror-QA/`) proved the flip is shippable, turning ~24 generated
  frames into ~12 + a deterministic flip.
- **How to apply:** when an opposite facing is needed and a true-rotated reference exists, build the
  mirror-vs-truth comparison first and let it decide; only generate fresh art for the parts (or
  directions) the comparison shows the flip can't carry.

### 2026-06-10 — Measure the cutout's geometry before reaching for a flag; teach the tool the edge case

- **Principle:** When a sliced sprite reads wrong (holes, a paw cut flat), *diagnose the geometry first* —
  compare each figure's true connected-blob bbox against its **cell** and against the **sheet edge** —
  before guessing slicer flags. That measurement tells you which problem you have, and whether it's even
  recoverable: overflow past the *cell* but not the *sheet* means the pixels exist (the rigid per-cell
  crop just discarded them → recoverable); overflow past the *sheet* means they were never drawn (needs
  new art, no flag helps).
- **Why:** the wolf-mother attack lunges were sliced flat at the cell border and the white fur had holes.
  Eyeballing would've sent me to `--erode`/`--thresh` guesses. A 20-line blob-bbox check proved the
  figures overflowed their 418px cells into the empty centre but never touched the sheet edge — so the fix
  was to *recover* pixels, not regenerate art. That justified a new `--bleed` mode (cut an expanded
  window, keep the component that owns the cell) rather than a one-off hand-fix; combined with `--sever`
  it also sealed the white-on-white holes. All 16 verified 0-clip / 0-hole.
- **How to apply:** for any cutout defect, run the bbox-vs-cell-vs-sheet measurement before flags, and let
  the verdict pick the tool. When the cause is a *recurring class* (figures drawn larger than their cell,
  white-on-white leaks), encode it in `tools/slice-turnaround.py` as a documented flag — the slicer is the
  accumulated solution to every cutout edge case; a new edge case belongs *in* it, not in a manual
  workaround. Verify the output programmatically (hole/edge px counts), not just by eye, and keep
  `--bleed`'s owner-selection assumption honest (figures must not touch — watch the `comps=N` print).

### 2026-06-09 — Your deliverable is the asset + a wiring spec, not a wired `index.html`

- **Principle:** The Artist does not edit `index.html` — the engineer is its sole editor. You produce the
  art files (`assets/`/`art/`), the slice tool's output, and a *render spec* (a paste-ready `ART_MANIFEST`
  snippet + draw/scale intent); the engineer wires it and verifies the render. Done = "spec handed off
  and the assets are right," not "I made it render."
- **Why:** "art" tasks kept forcing edits into procedural code (e.g. the wolf-bite hold lived as a timer
  tick inside `_aiWolf`, an AI function). When a role's work routinely crosses its own boundary, the
  boundary is drawn wrong — so we redrew it along *declarative-art vs procedural-code*, not by region of
  one file. One owner on the single game file removes the two-roles-one-file coordination risk.
- **How to apply:** slice, drop the cutouts in `assets/`, QA the magenta contact sheet, and verify *your*
  output (clean cutouts, correct keys/paths). Then hand off: the snippet, the `<ID>_SCALE` value/feel,
  and any size-coupling (scale ↔ hitbox ↔ attack radii) for the engineer to apply in one commit. If a
  task needs a code edit, that's the engineer's — describe the intent, don't reach into the file.

### 2026-06-09 — Migrate the tool when you migrate the pipeline, or every use pays a hand-bridge tax

- **Principle:** When the asset pipeline changes shape (here: inline base64 → external files under
  `assets/`), the generator that feeds it has to move in the same step. A tool left a step behind doesn't
  fail loudly — it silently makes every future use a manual fix-up.
- **Why:** `slice-turnaround.py` kept emitting base64 manifest snippets long after art was externalized,
  so each slice meant hand-dropping PNGs into `assets/char/` and rewriting the snippet to paths. The cost
  was invisible until it accreted across many uses — a deferred-tooling debt, not a bug.
- **How to apply:** when you change where art *lives* or how it's *referenced*, grep the tooling that
  emits that reference (`tools/`) and update it in the same pass. Make the tool's output paste-ready for
  the *current* pipeline (path snippet straight into `ART_MANIFEST`), and smoke-test it on a real sheet —
  a tool that compiles but emits the old format is still broken.

### 2026-06-09 — A sprite's dwell time is a feel knob, separate from the action's hitbox timing

- **Principle:** "Wired and rendering in all 8 facings" isn't "done" — an attack/pose sprite also has to
  *read* at gameplay speed, and how long it stays on screen is its own tunable parameter, not a free
  by-product of the combat window that triggers it.
- **Why:** the wolf lunge art was sliced clean, registered, and `node --check`-verified, yet playtest
  said it "flashed past" — because the swap condition (`biteStrike`, ~12 frames) is the *combat* follow-
  through, which is too short to register the bite and is engineer-owned timing, not an art lever.
- **How to apply:** when wiring a pose-swap, give the *display* its own hold timer (e.g. a draw-only
  `_biteHold`) decoupled from the hitbox/recovery math, so you can tune readability without touching
  combat feel — and treat a real playtest, not just the render, as the acceptance test. Coordinate with
  the engineer when the only available lever is a combat-timing field.

### 2026-06-09 — On-style and fully-wired, or it didn't ship

- **Principle:** An asset only counts when it matches the established direction *and* renders in the
  live game in every facing — consistency beats novelty, and no half-measures.
- **Why:** Art is part of the build; a stray quote in a base64 blob breaks all of `index.html`, and a
  single off-style or half-cut sheet reads as broken to the player.
- **How to apply:** Match the existing sheets first; slice with `tools/slice-turnaround.py` and QA the
  magenta contact sheet; wire it, then prove it (`node --check` + grep the key + load all 8 facings)
  before calling it done.
