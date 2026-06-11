# Artist memory — archived raw entries (cutout-defect cluster)
*Archived 2026-06-11 during a compaction pass. These four 2026-06-10 entries were merged & raised in
altitude into the live `agents/artist/memory.md` lesson "Cutout-defect diagnosis: classify by measurement
before reaching for a flag; every QA metric can lie." Kept verbatim here for the hard-won flag specifics
(px counts, exact `--shadow-lum`/`--thresh` values) that the raised lesson distills out.*

---

### 2026-06-10 — Before fixing a "your tool broke my asset" report, prove ownership; and beware a metric that conflates two effects

- **Principle:** When the user says new work corrupted an existing asset, **diagnose ownership before
  touching anything** — it's usually a two-command exoneration or indictment. Here Josh suspected the new
  hurt/prop slicing was editing existing PNGs: `git diff HEAD` was **empty** for both suspects and the
  slicer's entire write-set is `{id}-{dir}.png` for its `id` arg, so slicing `goblinhurt` *cannot* write
  `warrior-se.png`. That cleared the new work in two checks and redirected to the real cause — a
  regression from a *prior* session (`playerwalk2-ne`'s rear boot, eaten by that session's `--shadow-bg`
  re-cut). One suspect (`warrior-se`) was a pre-existing original cut (untouched since externalize) —
  "didn't notice before" was correct. Separate "did this change?" (git) from "is it defective?" (pixels).
- **Why — the false metric:** my foot-area pixel count read `−44%` on the worst frame and `−29%` on the
  user's example, which looked catastrophic — but that count **conflated the intended shadow removal with
  the unintended boot loss**. Most of the loss was the baked floor-shadow blob (legitimately gone); the
  actual boot damage was a fraction. Worse, after the fix the count barely moved (1069→1091) because the
  **recovered boot ≈ the additional shadow removed** — so the number said "no change" while the render
  showed the rear boot fully restored. A metric that sums two opposing effects is blind to both.
- **How to apply:** (a) for any "X broke" report, run `git diff HEAD` + identify the tool's write-set
  first. (b) Never trust a single conflated count — split it (shadow vs boot here) or judge by the
  **render**; the magenta contact + a before/now/fix three-way is the truth, the pixel delta is a hint.
  (c) A backlog note that says "**boots survive**" is a claim to **re-measure across every affected
  facing** — the prior `--shadow-lum 16 / --band 0.80` guard saved N/S but the side/diagonal boots stayed
  eaten (the planted profile foot sits deepest in the seed band); the real fix was `--shadow-lum 13
  --shadow-band 0.90`. (d) An mp4 re-cut is **alpha+RGB**, so it *undoes* any prior RGB-only defringe —
  the re-cut frames came back with the grey halo (ring ~125); **defringe must follow every re-cut**.
  Single-prop cutout (coin/chest) has no grid tool — added `tools/cut-prop.py` reusing `cut_cell`.
  **Habit for single props — a border on ONE side of a symmetric shape is a directional baked SHADOW, not
  AA; fix it with `--thresh`, not `--erode`.** The favorcoin haloed white only along the *bottom* of a
  circle. A uniform anti-alias halo rings the whole edge, so "bottom-only on a circle" was the tell: the
  source had a **soft cast-shadow gradient under the coin** (lit from above) — a ~6px band of near-neutral
  light-gray pixels (min(R,G,B) 204–214) sitting just under the flood threshold (bg at min≥215), kept as
  "figure" and reading white. The top rim was a sharp 1px 255→gold edge with no such band. **`--erode` is
  the wrong tool** — I tried it first (erode 2 only knocked 43→1 and would chew the good gold rim all the
  way around); the right fix raises `--thresh` so the shadow band keys as bg, exploiting the **gap between
  figure colour and shadow colour** (gold rim min <180, shadow band 200–214 → thresh 55 = bg at min≥200
  cuts the shadow, spares the gold). **How to apply:** when a cutout border is *localized* on a symmetric
  prop, sample the edge **gradient per side** (sharp vs gradual min(R,G,B) ramp) before reaching for a
  flag — a gradual ramp into a near-neutral band = baked shadow → `--thresh` to the figure/shadow gap;
  a uniform thin bright ring = true AA → `--erode`. And measure the halo by **near-white-opaque px**, not
  edge-lum: a lit rim is legitimately brighter (the coin's top scrollwork keeps 6 bright-gold px — that's
  detail, not halo). (Josh caught the bottom-only border twice; the second catch is what surfaced the
  shadow-gradient root cause over my first erode guess.)

### 2026-06-10 — A sprite halo is a STACK of defects, each invisible to the previous fix's metric — verify against the full edge ring AND the over-ground render, never one number

- **Principle:** A walk-sprite "halo" reported in-game is rarely one defect. This cycle had **three**,
  each hidden from the last fix's QA metric: (1) a **grey colour fringe** on the soft edge band; (2) the
  bright **near-opaque rim** (`α 200–239`) that a soft-band metric *doesn't look at*; (3) an **opaque
  cast-floor-shadow** smudge (`α=255`) the fringe metric can't see at all. The trap is a **false-passing
  metric**: defringe-v1 clamped+measured only `8<α<200`, so a frame measured "lum 11 = clean" while the
  rim still read grey (lum ~113 vs idle ~48) and Josh still saw the halo. **Always QA a fringe metric
  against the idle's FULL ring (`8≤α<245` = 18–22 here), and trust the over-ground render + the user's
  eye over any single average** — the mean is blind to a localized bright rim and to opaque smudges.
- **Why:** the colour clamp (`defringe-sprite.py`, luminance-clamp the bg-blended fringe to the idle
  outline tone) is still the right *first* tool — same filenames, zero re-wire, and re-keying was wrong
  twice (a `--tol` sweep ate the grey steel; nearest-solid bleed *brightened* the halo). But colour-only
  can't fix a baked cast shadow — that needs a **re-cut** (`slice-walk-video.py --shadow-bg` seeds the
  shadow as definite bg). And `--shadow-bg` itself over-ate the dark **boots** (the seed keyed `lum<16`
  over the bottom quarter — boots fall in it), so I added `--shadow-lum`/`--shadow-band` to protect them.
  Net: defringe-v2 (full-ramp `α<245`) + boot-protected `--shadow-bg` re-cut of all 6 clip-derived dirs
  → 14.9–17.4, boots intact, registration unchanged (size 192/feet 189/body 181).
- **How to apply:** diagnose the defect *class* before reaching for a tool — `--check` against the clean
  idle on the **full** ring, then split the edge into sub-bands (soft `8–200`, rim `200–240`, solid) and
  visualize the **opaque-only** mask over magenta to catch a baked shadow blob the brightness metric
  misses. Colour clamp for a bright fringe; re-cut for a baked shadow/missing alpha; and when re-cutting,
  **QA the boots on the contact sheet every time** (the shadow seed lives right where the feet are).
  Keep the whole 8-set consistent: re-cut E/NE/SE from clips, mirror to W/NW/SW. Snapshot/commit before
  in-place rewrites — recoverability is what made the rejected experiments safe.

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

### 2026-06-10 — A motion clip isn't a turnaround sheet (cutout half — the separator)

- **Cutout:** the figure shares the bg's colour — the knight's steel is the same neutral grey as the
  studio backdrop and the navy tabard's shadows are as dark as it — so a brightness threshold eats the
  tabard, a tolerance flood leaks *through* the steel, and a median-plate bg-subtraction fails because a
  centred figure ghosts into the plate. **GrabCut** (colour models + spatial coherence) is the separator
  when fg/bg colours overlap; edge-flood only when bg is a distinct flat tone. (The registration half of
  this lesson stayed live in `memory.md`.)
