# Artist — Memory
*Crystallized, transferable art lessons. Read first each session; append at session end. Self-compact when over 250 lines (merge/supersede/raise-altitude; archive superseded entries to `agents/artist/archive/`).*

---

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
