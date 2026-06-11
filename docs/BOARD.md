# To Dust — Execution Board

*The **shared** cross-role working board: who is building **what, right now**, with what blockers, and the
live hand-off log. **All three roles write here** ([PM] / [ART] / [ENG]).*

> **This is not the roadmap.** [`ROADMAP.md`](ROADMAP.md) is **PM-owned and product-pure** — it holds
> *what/why*, priority, sizing, and the product gate (`approved` / `shipped`). **This board holds execution
> state** — `in-progress`, blocked, sub-task checkboxes, and the hand-off log. **One fact, one home:** the
> board references a roadmap item by **# / name** and never re-states its *why*. If you're tempted to copy
> intent here, link the roadmap item instead — duplicated intent is how the two docs drift.

---

## How to use this board

- **Status lives here, not on the roadmap** — except the two *product* events the PM owns (`approved`,
  `shipped`), which stay on the roadmap. The granular middle — `in-progress` / blocked / sub-tasks — is
  the board's job. Flip it **the moment you act, in the same commit** as the work.
- **Tag your lane** on every line you add: `[PM]` / `[ART]` / `[ENG]`. Date entries (`YYYY-MM-DD`).
- **Commit your own lane — never `git add -A`.** The working tree carries long-lived cross-role WIP
  (untracked art PNGs, other roles' in-flight edits); a blind `git add -A` sweeps another role's work into
  your commit under the wrong prefix. **Stage explicit paths** so a `pm:`/`art:`/`eng:` commit is single-lane.
- **Session-open ritual (~30s):** `git status` + `git log --oneline -15` → read the roadmap *Now* block →
  read this board (Active + Handoffs) → act. `tools/doc-drift-check.ps1` (Stop hook) nudges if this goes stale.
- **Source-of-truth rule (avoid drift):** for any item backed by a spec (`docs/specs/*.md`), the **spec is
  the source of truth**; the roadmap item is a thin pointer and this board tracks only *progress against it*.
  Don't mirror build detail (line-refs, balance, phasing internals) here — it lives in the spec.

**Status legend (execution):** `queued` · `in-progress` · `blocked` · `done` (→ PM marks the roadmap item
`shipped` and the board line clears next sweep).

---

## Active work

### Item 2 — God Skills *(roadmap #2, `approved`)* · spec: [`specs/god-skills.md`](specs/god-skills.md)
Phased trigger-swap; build order proves the pattern cheapest-first.
- [ ] **Pyre Waltz** — `queued` `[ENG]` · decouple `gFireRings` from the whirlwind gate → per-skill interval timer. *Start here.*
- [ ] **Trail of Embers** — `queued` `[ENG]` · emit `gFireTrails` on any movement (distance-based), not just dash.
- [ ] **Pyroclasm** — `queued` `[ENG]` · `gFirePillars` on interval + new auto-target (nearest cluster).
- [ ] **Migration** — `queued` `[ENG]` · whirlwind/dash/heavy revert to plain; **Dance of Fire retire-and-park** (decided, no flag).
- **No open questions** — spec is zero-question as of 2026-06-11.

### Item 0 — Player animation pass *(roadmap #0, pre-greenlit)*
- [x] **Walk** — `done` `[ART]/[ENG]` · 8 facings shipped v0.4.0.
- [x] **Dash** — `done` `[ENG]` · 8-dir cutouts wired (`char.playerdash.<dir>`, commit `adf291d`).
- [x] **Heavy windup** — `done` `[ENG]` · 8-dir telegraph wired (`char.playerheavywindup.<dir>`, commit `adf291d`).
- **→ [PM] all three legs shipped — re-status the roadmap item (close item 0 / fold to changelog).**

---

## ⇄ Hand-off log

*Append a dated, lane-tagged line; **delete when cleared.** Live hand-offs only — shipped ones move to the changelog.*

- **[ENG] → [ART] (2026-06-10):** **player WALK cutouts have a loose gray halo** (dark fringe in-game, worst
  while moving) — a background-removal quality issue in the PNGs, **not** an engine bug. Re-cut the haloed
  frames tighter via `tools/slice-walk-cycle.py` (`--tol`↑ from 24, `--erode`→2, QA `--compare` vs the idle).
  Priority `-n`/`-s` (all 4 frames), then the diagonals' `-3` frames. **Full data table + per-facing fringe
  measurements + target in `docs/CLEANUP_BACKLOG.md` → "Art / sprites".** Engineer re-verifies the alpha edge
  on redelivery. *(In flight — `_walkqa`/`_haloqa`/`_recut` dirs active in the working tree.)*
- **[PM] → [ART] (2026-06-10):** **eye-glow difficulty tell** (item 1) — enemy eyes glow **yellow (mid) → red
  (top)**, an additive draw-layer tint, **no new sprites**. **Unblocked:** the flag exists — `e.threatTier`
  (0/1/2, stamped in `_wildScaleEnt`; tiers at nights 4/8 via `WILD_TIER1_THREAT`/`WILD_TIER2_THREAT`) — and a
  placeholder two-dot+halo render is live in `gDrawThreatGlow` (contract comment inline). Restyle via a spec
  handed back to the engineer (sole `index.html` editor).
- **[PM] → [ART] (open):** **Favor-coin art** — `fx.favor-coin` + a HUD glyph for the placeholder `✦` (drawn
  procedurally in `gDrawFavorOrbs`).
- **[PM] → [ENG] (2026-06-10):** **CHANGELOG archive** — pre-rename Dungeon Forge era (v0.9.0–v0.11.0) moved to
  `docs/archive/changelog-dungeon-forge.md`, pointer left in `CHANGELOG.md`. Still **untracked** in the working
  tree; fold into a `docs:` commit. Going forward, sweep the changelog by era/half-year, not per release.
