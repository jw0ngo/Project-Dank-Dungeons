# Artist — Learnings

Crystallized, high-altitude art craft for *To Dust*. Newest first. Read this first each session; add
to it at session end (studio doctrine — see `../studio/STUDIO.md`). One entry = one dated, titled
lesson: **the principle → why → how to apply.** Quality over volume.

> **Division of homes:** the pipeline + house style live in `../docs/ART_PIPELINE.md`; per-asset
> traits and prompt templates in `../docs/Art_Designer_Agent.md`; cutout/debugging specifics in
> `../docs/SESSION_JOURNAL.md`. *This* file is the step up — transferable lessons about *how to make
> art well here* (what kept assets on-style and rendering correctly).

> Entry template:
>
> ### YYYY-MM-DD — <short principle as a title>
> - **Principle:** <the transferable lesson, one line>
> - **Why:** <what made it true here>
> - **How to apply:** <what to do next time>

---

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
