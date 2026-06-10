# Archived engineer memory — sprite-measurement entries (2026-06-10)

*Superseded 2026-06-10 by the consolidated entry "Measure sprite scale & art quality — never trust a
handoff figure or an eyeball" in `agents/engineer/memory.md`. Raw originals preserved here.*

---

### 2026-06-10 — When your metric is noisy and the user gives bracketing reports, triangulate from THEIR observations

- **Principle:** If an automated measurement is unreliable for a case (the heavy-swing scale: the extended
  sword inflates shoulder width, the pitched head corrupts the head band → per-facing 0.77..1.94), do **not**
  override the user's in-game observations with a clever theory. Successive user reports often *bracket* the
  truth: "it pops bigger" (at 1.3/192≈1.41/208) and then "it's smaller than idle" (at 1.16/208) pin the
  answer between them — which is exactly the tool's idle-match (~1.31/208) that I'd dismissed as noise.
- **Why:** I thrashed the swing mult 1.3→1.10→1.16→1.31 across three rounds because I kept reasoning from
  corrupted numbers and a plausible-but-wrong "anchor it to the wind-up" shortcut, treating the tool's 1.31
  as too-noisy-to-trust. The user's two plain observations had already fenced the value; trusting them sooner
  would have skipped two iterations. The metric was noisy *and* the human signal was strong — I weighted them
  backwards.
- **How to apply:** when eyeball feedback and a shaky metric disagree, let the human reports set the bracket
  and use the metric only to interpolate within it. Two contradictory-sounding reports ("too big" then "too
  small") aren't the user being fickle — they're a binary search; take the midpoint. Reserve the confident
  metric-over-eyeball move for cases where the metric is actually trustworthy (stable stances), not the
  pathological ones.

### 2026-06-10 — A pose's draw-mult is a measured number with a gate, not a handoff figure you trust

- **Principle:** Before wiring the draw multiplier for any new action-pose sheet (`playeratk`/`playerheavy`/
  `playerdash`/`playerheavywindup`/enemy poses), **run `python tools/check-pose-scale.py <prefix> --mult M
  --plant P`** and make it pass (exit 0). The body must match idle *apparent* size by a pose-invariant
  feature — the **mean of head-width and shoulder-width ratios** vs idle — never by bbox height / `bodyH` /
  body-fill, which a different silhouette distorts. Give each pose its own named constant
  (`WINDUP_DRAW_MULT`=1.07, `WINDUP_PLANT`=0.14·PSCALE) — don't reuse another pose's mult.
- **Why:** the heavy WIND-UP shipped at `1.3` (copied from the swing, justified by a 0.736-vs-0.732
  *bbox-fill* parity in the Artist handoff) and rendered ~30% too big — Josh flagged the pop immediately.
  Measured properly, the coiled wind-up is already idle-sized in-cell (shoulder 90 vs idle 92); the true
  mult is ~1.07. The head/shoulder *mean* is what's robust (each alone is noisy and they move oppositely):
  the dash, correct in-game at 1.0, measures head 1.12 / shoulder 0.88 / mean 1.00 — that validated the
  estimator against known-good art. The "match by helmet width not bbox" rule was *already* in memory but
  unenforced, so a bbox-fill recommendation slipped through. The fix was to turn the rule into a tool+gate.
- **How to apply:** treat any scale figure in an Artist handoff as a hypothesis, not a fact — verify it with
  `check-pose-scale.py` before wiring. A pose whose feet sit above the cell bottom (coiled stances) needs a
  downward plant offset too (= idle feetY − pose feetY; the tool reports it). **`gDrawSprite` maps the WHOLE
  sprite canvas to `PSCALE*mult`, so the draw-mult is coupled to the canvas (cell) size: if a sheet is re-cut
  to a different cell size (the heavy swing went 192→208 to fit a recovered foot), the mult must re-scale by
  `new/old` (1.3→1.41-equiv) or the body silently shrinks/grows — RE-RUN the tool, which now normalises by
  cell so it stays canvas-correct.** When a recurring art-wiring judgment keeps biting, encode it as a
  measuring tool that emits a pass/fail, so the next session can't trust-the-eyeball its way back into the
  bug — and make the tool normalise by the unit it compares in, or it gives confidently-wrong numbers the
  moment an assumption (uniform canvas) breaks.

### 2026-06-10 — Wire variant art as a data-driven map, and let the Artist own the assets

- **Principle:** When wiring directional/variant art (an 8-way walk cycle, per-element skins), make the
  swap a **data-driven lookup** (`PLAYER_WALK_OCT = {octant→dir}` consulted each frame + `char.<id>.<dir>`
  registry keys) rather than branching code. Each new asset is then a *one-line* wire, and — crucially —
  the **Artist can commit the `assets/` files independently while the engineer commits only the
  `index.html` wiring**. That seam let a parallel Artist session deliver/​re-cut sprites (E re-cut, W
  mirror) with zero re-wiring on my side: same filenames → the manifest already pointed at them.
- **Why:** This session I overstepped and *sliced* the first three directions as engineer — and promptly
  misdiagnosed the East scale by **eyeballing an overlay instead of measuring**, bumped the scale, and
  grew+clipped the helmet. The Artist's measured re-cut was cleaner. The boundary exists because slicing
  is the Artist's craft; the engineer's job is the map + the keys. (Boundary recorded in user memory
  `sprite-pipeline-role-boundary`.)
- **How to apply:** If raw art (frame folders, a sheet, an `.mp4`) lands in an engineer session, hand the
  slicing to `/artist`; keep your work to the registry/map wiring. Verify the handoff by *measuring*
  (192² canvas, foot row, body span, no `top_row==0` clip), never by eye. Design the wiring so a new
  variant = one map entry + its keys, and the two roles commit on their own side of the file boundary.
