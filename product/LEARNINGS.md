# Product Manager — Learnings

Crystallized, high-altitude product craft for *To Dust*. Newest first. Read this first each session;
add to it at session end (studio doctrine — see `../studio/STUDIO.md`). One entry = one dated, titled
lesson: **the principle → why → how to apply.** Quality over volume.

> **Division of homes:** the backlog itself lives in `../docs/ROADMAP.md`; the operating model in
> `../docs/PRODUCT_MANIFESTO.md`. *This* file is the step up — transferable lessons about *how to do
> product well here* (what proposals land, where sequencing went wrong and why).

> Entry template:
>
> ### YYYY-MM-DD — <short principle as a title>
> - **Principle:** <the transferable lesson, one line>
> - **Why:** <what made it true here>
> - **How to apply:** <what to do next time>

---

### 2026-06-09 — The felt-wall playtest is the highest-value input; design to provoke it, not patch around it

- **Principle:** A vertical slice exists to reveal *where* the current design stops working — the "felt
  wall." The PM's highest-leverage move is to build the slice so a playtest surfaces that wall, then read
  the wall *as the spec* for what's next — instead of pre-committing to the obvious fix.
- **Why:** This session, holding Boreas (the obvious "add more power" answer) until the playtest spoke paid
  off — the wall was flat enemy scaling + plateauing level-up cards, both fixable inside existing systems.
  Reflexively unholding a new god would have spent a multi-session epic on the wrong problem.
- **How to apply:** When a slice is mechanically built, *resist proposing new content* — push for the
  playtest and pre-stage a **ranked fork** of candidate fixes keyed to what the wall might reveal; let the
  wall choose. Translate "this feels boring / weak" into the **systemic gap** it implies (shallow card
  depth, flat curve), not a one-off patch.

### 2026-06-09 — The human prompter is the serial bottleneck; optimize for fewer, denser loops and zero re-explanation

- **Principle:** Every AI role resets between sessions, so the human is the *only* persistent context and
  the serial bottleneck. Efficiency isn't "roles work faster" — it's: need the human fewer times, make each
  turn dense (batch decisions), and make the docs carry the memory so nothing is ever re-explained.
- **Why:** This session moved fast *because* Josh front-loaded a structured playtest dump and answered all
  three open design calls in one turn. The friction we hit was the opposite kind: design detail duplicated
  across the roadmap *and* the spec (drift bait), and a near-miss `git add -A` that almost swept cross-role
  WIP into a `pm:` commit — both **memory/hygiene** failures, not thinking failures.
- **How to apply:** Spec-backed roadmap items = pointer + summary only (the spec is the source of truth);
  stage explicit paths, never `git add -A`; hand the prompter the *symptom* and let the role design the fix
  unless they have strong conviction. **Fold a workflow-friction check into session-end crystallization:**
  "what cost us a turn today, and what doc change prevents it next time?"

### 2026-06-09 — Ground every pitch in the shipped game and the feel target

- **Principle:** Proposals land when they're grounded in what *actually* shipped and serve the
  Creative Director's feel/story pillars — not when they're clever in the abstract.
- **Why:** This is a pre-1.0, one-file game directed toward a specific feel. Ideas that ignore the
  current build or the soul of the game cost trust and rework.
- **How to apply:** Before pitching, read `../CHANGELOG.md`, skim the relevant systems, and name which
  Creative Manifesto principle the idea serves. Arrive with a decision-ready one-pager, not a question.
