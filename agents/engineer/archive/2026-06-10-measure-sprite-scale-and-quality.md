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
