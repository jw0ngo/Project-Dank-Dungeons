# Product Manager — Memory
*Crystallized, transferable product lessons. Read first each session; append at session end. Self-compact when over 250 lines (merge/supersede/raise-altitude; archive superseded entries to `agents/product/archive/`).*

Crystallized, high-altitude product craft for *To Dust*. Newest first. Read this first each session;
add to it at session end (studio doctrine — see `studio/STUDIO.md`). One entry = one dated, titled
lesson: **the principle → why → how to apply.** Quality over volume.

> **Division of homes:** the backlog itself lives in `docs/ROADMAP.md`; the operating model in
> `docs/PRODUCT_MANIFESTO.md`. *This* file is the step up — transferable lessons about *how to do
> product well here* (what proposals land, where sequencing went wrong and why).

> Entry template:
>
> ### YYYY-MM-DD — <short principle as a title>
> - **Principle:** <the transferable lesson, one line>
> - **Why:** <what made it true here>
> - **How to apply:** <what to do next time>

---

### 2026-06-10 — A "can we do X?" question often hides unstated architecture; ground in the engine before answering, and the cheapest big pivot reuses tuned systems and swaps only their coupling

- **Principle:** Three moves made a major late pivot (gods stop imbuing active skills → become auto-firing,
  class-agnostic VS-style skills) land in one session. (1) When Josh asked "is multiple classes still
  feasible?", the high-value response wasn't a yes/no — it was *grounding in the real engine first* (found
  `gActiveWeapon` + `WeaponRegistry` + a live bow kit), which reframed the answer and surfaced his **unstated
  platform intent** (the combat system is a reusable platform; the roguelike is mode one). A scoping question
  frequently encodes an architectural direction the prompter hasn't said out loud yet — draw it out. (2) When
  two systems compete for the same role ("classes" and "gods" both = build identity), the resolution is almost
  always **make them orthogonal axes that multiply** (class = active kit/delivery; god = portable passive
  layer), not pick one. (3) The pivot was cheap to spec because most of the work was a **trigger swap** on FX
  systems that were *already built and tuned* — the content existed; only the coupling changed. Spotting that
  one piece was *already* in the target shape (Pyre Waltz already fires on an interval) let me sequence it
  first as the "proves-the-pattern, near-free" build.
- **Why:** Pre-1.0 direction moves in big jumps, and the prompter is the only persistent context — so their
  questions carry intent the docs don't yet hold. And a one-file game accumulates tuned, load-bearing systems;
  the expensive part of any feature is the *tuned behaviour*, not the wiring. A pivot that preserves the tuned
  systems and only re-wires their triggers is an order of magnitude cheaper than it first looks — but only if
  you read the code to *find* that the assets are reusable.
- **How to apply:** On a feasibility/scoping question, **read the relevant engine systems before answering**
  and ask what architecture the question implies — name it back and confirm. When two systems want the same
  identity slot, propose the orthogonal-axes split. When repurposing, **audit what already exists and is
  tuned** (FX, registries, timers) and frame the work as the *minimal coupling change*; pick the item already
  closest to the new shape as the first/cheapest build to de-risk the pattern. Capture a revealed platform/vision
  beat as canon (manifesto) the moment it's stated, so it doesn't drive decisions silently.

### 2026-06-10 — Phase so creative direction can still pivot; verify "as already written" canon before grounding on it

- **Principle:** Two things made a late, substantial thematic reframe land cheaply this session. (1) The
  Imbue Paths phasing front-loaded *system risk* (build the rails + one skill's lower ranks first) and
  treated higher tiers as *additive content designed just-in-time* — so when Josh reframed the level-10
  peak (single "Chaos Ascension" → a two-age Dragon-heal/Chaos-self-burn fork), it touched **only the
  unbuilt Slice C**; nothing in flight broke. (2) Josh cited the reframe as "already in the manifesto" —
  a quick grep proved the Animal-Spirit predecessor age was **not** recorded anywhere. Capturing it as
  *new* canon (and flagging the missing Direction-Log entry) beat silently grounding on a false premise.
- **Why:** Pre-1.0 creative direction is still moving. A roadmap/spec that bakes full detail into
  *not-yet-built* tiers makes every pivot a rewrite; one that keeps unbuilt tiers as thin, replaceable
  design absorbs pivots for free. And the human prompter is the only persistent context across resets, so
  they sometimes mis-remember what's been logged — treating their canon references as *verify-then-capture*,
  not gospel, keeps the docs honest.
- **How to apply:** Phase features so the *system* is proven early and *content/identity* tiers stay
  cheaply re-designable; don't fully spec a tier you won't build for several sessions. When the CD says
  "as written in X," **grep X first** — if it's absent, capture it as new canon, write it into the spec
  (source of truth) verbatim, and flag the canonical home (manifesto/Direction Log) that still needs it.
  Note when a reframe *grows* an unbuilt slice's scope (here, a 3-hit-combo swing rewrite) so engineering
  re-sizes before committing.

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
- **How to apply:** Before pitching, read `CHANGELOG.md`, skim the relevant systems, and name which
  Creative Manifesto principle the idea serves. Arrive with a decision-ready one-pager, not a question.
