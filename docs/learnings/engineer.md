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

### 2026-06-09 — The toolchain will pass a change that does nothing

- **Principle:** Verifying *syntax* is not verifying *behavior*. In this one-file game, a change can be
  syntactically perfect and still inert — a duplicate `function` shadows the real one, a new per-frame
  system sits outside `gSimUpdate`, a sprite scale moves without its hitbox.
- **Why:** `node --check` passes on duplicate declarations; headless/`Sim` runs skip systems left
  loose in `loop()`; nothing flags a wire that was never connected.
- **How to apply:** After every change, run a *targeted* proof it took effect (grep the new key, check
  for duplicate `function name(`, run `await Sim.batch(3)` after notable changes), then load it. Treat
  "it parses" as step one of three, never the finish line.
