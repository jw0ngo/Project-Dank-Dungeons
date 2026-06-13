# Feel-convergence raw entries (merged 2026-06-13 into one memory entry)

*(Two sibling entries archived verbatim from `agents/engineer/memory.md`; the merged lesson lives there as
"A feel/visual feature's spec converges through user iteration; the knob converges to one physical rule".)*

### 2026-06-12 — A many-round spacing/feel knob converges to one physical rule, not stacked per-category constants

- When a placement/spacing knob is tuned over many one-number rounds, the convergent form is usually **one
  constraint derived from the real geometry**, not a pile of per-category constants — each new category exposes a
  gap the prior constants can't see. Tree spacing ended when I derived it from the hitboxes: **any two keep
  centre-distance ≥ `rxOf(a)+rxOf(b)+TREE_WALK_GAP`** (one player-width clearance) — subsumes all pair types,
  self-tunes with scale/trunk-width. The moment a spacing knob needs a *second* per-category exception, stop
  adding constants and ask "what physical quantity is this approximating?"; enforce it O(1) via a spatial hash,
  seeded for MP-determinism, exposing just the one comfort term. (When two goals fight over one knob — lushness
  vs walkability — look for the *other* knob: thinned the collision `TREE_BASE_RX_FRAC`, not the spacing.) Sibling
  of the visual-feature-converges-on-the-user's-eye lesson: iteration finds the right **abstraction**.

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
