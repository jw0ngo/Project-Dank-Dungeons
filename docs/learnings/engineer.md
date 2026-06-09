# Engineer / CTO — Learnings

Crystallized, high-altitude engineering craft for *To Dust*. Newest first. Read this first each
session; add to it at session end (studio doctrine — see `../../studio/STUDIO.md`). One entry = one
dated, titled lesson: **the principle → why → how to apply.** Quality over volume.

> **Division of homes:** tactical debugging lessons stay in `../SESSION_JOURNAL.md`; deferred findings
> in `../CLEANUP_BACKLOG.md`; architecture in `../DUNGEON_FORGE_CTO_DOC.md`. *This* file is the step up
> from all of them — the transferable principles about *how to engineer well in this codebase*.

> Entry template:
>
> ### YYYY-MM-DD — <short principle as a title>
> - **Principle:** <the transferable lesson, one line>
> - **Why:** <what made it true here>
> - **How to apply:** <what to do next time>

---

### 2026-06-09 — A new standing entity population is a hidden input to every global census

- **Principle:** When you add a large, *persistent* cohort to a shared collection (`gEnemies`), audit
  every system that does an unfiltered scan/count over that collection. A budget or cap that counts
  "all of them" will silently misbehave the moment your cohort exists — the bug surfaces in an
  unrelated subsystem, not in your new code.
- **Why:** 40 wolf camps spawned ~160 persistent neutral wolves into `gEnemies` at run start. Each
  wolf was correct in isolation, but the night-siege stream's live-cap census
  (`for(const e of gEnemies){ if(!e.dead) live++; }`) counted them, pinning `live ≥ cap` so `room`
  was always 0 — the opening horde dropped, then *zero* stream followed. The regression was emergent:
  a subsystem that quietly assumed `gEnemies ≈ siege enemies`.
- **How to apply:** Before shipping a persistent cohort, grep every `for(...of gEnemies)` (and any
  global counter) and ask at each site, "should my new cohort count here?" Give cohorts a
  discriminator (`campId`, `isHeld`, `isNeutral`, `isAmbient`) and make each census express *intent*
  ("siege/threat-relevant"), not mere liveness. The same audit applies to separation grids, despawn
  sweeps, and any O(n) pass keyed on the shared array.

### 2026-06-09 — When the verification tool is missing, verify differentially against a known-good baseline

- **Principle:** If the canonical check can't run (here: no Node, so `node --check` was impossible),
  don't skip verification — build a cheap proxy and run it against *both* your change and the last
  committed build, then compare. Equal output ⇒ your edit introduced no net regression in whatever the
  proxy measures, even if the proxy itself is imperfect.
- **Why:** I wrote a string/comment/template-aware delimiter-balance scanner for the inlined `<script>`.
  It reported a spurious "unclosed" (a regex blind spot early in the file) — but `HEAD` reported the
  *identical* residual, so the comparison proved my inserts were balanced. The baseline cancels the
  tool's own blind spots; the signal is the *diff*, not the absolute result.
- **How to apply:** For any verification you can't run natively, reach for `git show HEAD:file` as the
  reference and diff your proxy's output against it. Be explicit in the writeup that this is a
  differential syntax proxy, not behavior — flag the real behavior gate (here: a browser `Sim.batch`)
  as still owed.

### 2026-06-09 — The shared board is a live input, not just a handoff log — re-read it mid-build

- **Principle:** In this studio the roadmap/handoff board is edited by other roles *while you build*.
  Treat a mid-build board change as a design input that can change an implementation decision, not just
  status noise.
- **Why:** Mid-Favor-build the PM's board gained "Wolf Camps — the chest is the marquee Favor source,
  coordinate the chest payout." That turned an inline chest-grant into a reusable `gGrantFavor(amount,
  wx, wy)` chokepoint so the upcoming camp chests reuse one wallet + one juice path — a better design I'd
  have missed by treating the board as read-once.
- **How to apply:** When a system you're touching is named in another role's queued work, build the seam
  they'll plug into (a shared helper / hook), not just the path in front of you. The repo is the shared
  brain — cheap to re-read, expensive to re-architect.

### 2026-06-09 — A repo-wide rename is two categories, not one

- **Principle:** When renaming a thing across the repo, split occurrences into **display text** (rename
  freely) and **frozen compatibility tokens** (never touch): serialization prefixes (`DF1` seed),
  storage keys (`dungeon-forge:map:`), filenames with many references, and historical snapshots
  (`docs/archive/`, stale parallel trees). Renaming a frozen token silently breaks live data.
- **Why:** The *Dungeon Forge → To Dust* rename: changing the save key would orphan every player's
  stored maps; changing the seed prefix would invalidate every shared seed — both invisible at commit
  time, broken only in the user's browser.
- **How to apply:** Before a find/replace, grep all variants and triage each into rename-vs-freeze.
  Script the rename over an explicit include-set (exclude archives/stale trees), then hand-fix the
  edge token (add a "frozen legacy" comment), and log deferred filename renames to `CLEANUP_BACKLOG.md`
  rather than risking a wide `git mv` mid-task.

### 2026-06-09 — The toolchain will pass a change that does nothing

- **Principle:** Verifying *syntax* is not verifying *behavior*. In this one-file game, a change can be
  syntactically perfect and still inert — a duplicate `function` shadows the real one, a new per-frame
  system sits outside `gSimUpdate`, a sprite scale moves without its hitbox.
- **Why:** `node --check` passes on duplicate declarations; headless/`Sim` runs skip systems left
  loose in `loop()`; nothing flags a wire that was never connected.
- **How to apply:** After every change, run a *targeted* proof it took effect (grep the new key, check
  for duplicate `function name(`, run `await Sim.batch(3)` after notable changes), then load it. Treat
  "it parses" as step one of three, never the finish line.
