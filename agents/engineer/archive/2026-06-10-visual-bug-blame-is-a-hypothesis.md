### 2026-06-10 — A user blaming a visual bug on your edits is a hypothesis to test, not a fact to accept

- **Principle:** When a user attributes a visual regression to your recent work, **prove causation before you
  accept or deny it** — with two cheap, decisive checks: (1) `git diff <session-base>..HEAD -- <artifact>`
  filtered for the relevant code path (here the player-render path: `gDrawSprite`/`drawAnyPlayer`/`_smooth`/
  composite) — it's often **zero** matches; (2) measure the suspect asset against a known-good sibling. Don't
  argue from theory or timing; let the diff and the measurement decide, then hand the finding to the owning role
  *with the data*.
- **Why:** the "walk sprites have a dark halo, your latest edits did it" report felt plausible (livereload had
  just reloaded after my commit) but was wrong: the whole-session `index.html` diff touched **no** player-render
  line (the one render line added all session was a `save/restore`-wrapped, player-exempt composite op in the
  enemy threat-glow), and `assets/char/` was git-clean. Measuring the PNGs settled it — walk frames carry a wide
  gray fringe (~55-64) vs the idle's tight dark one (~14), a `slice-walk-cycle.py` keying artifact baked into the
  art (fixable: the cleanly re-cut `-e`/`-w` frames measure ~22). Never my code.
- **How to apply:** for "X looks wrong" reports, separate **render-path regression** (your lane — a session diff
  proves/disproves) from **asset defect** (measure vs a sibling → owning role's lane); route the asset defect to
  the Artist with the measured table + a roadmap handoff (`CLEANUP_BACKLOG` "Art / sprites") and re-verify on
  redelivery. Generalises the eyeball-vs-measure discipline from *making* art to *diagnosing* it.
