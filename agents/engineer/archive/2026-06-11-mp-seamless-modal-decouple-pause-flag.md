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
