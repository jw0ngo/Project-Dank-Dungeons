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

### 2026-06-12 — A benchmark is ONE good example, not a uniform mandate; variety + restraint are what make standouts land

- **Principle:** Josh praised **Riftmaw** (a map-crossing chaos rift) as a benchmark for rank-10 "epic-ness." I
  over-read it as *"every rank-10 must be map-scale epic"* and re-spec'd two other capstones to also span the map.
  Wrong direction — Josh: you can't have many abilities, **especially within one god**, all become "epic" via the
  *same lever* ("affect the whole map"); it reads as repetitive soup AND it stops the genuine standout from
  standing out. **One great example is an example, not a template** — and **not everything must be maxed; restraint
  on most is what lets the loud ones land.**
- **Why:** *"make it a benchmark" ≠ "make everything hit it."* Memorability comes from a **distinct creative idea
  per item**, not a shared ceiling everything is raised to; uniformity flattens the contrast that makes a peak feel
  like a peak. Same family as open-vs-close build space + "distinct identity, not stat-sprawl" — **variety is the
  value.** (I also reflexively reached for an AskUserQuestion-driven *full re-spec* before Josh confirmed the
  direction was even right — momentum toward sweeping change is its own bias.)
- **How to apply:** When Josh holds something up as a "bar," capture **why it's good** (its specific creative idea),
  then ask *"the bar everything must hit, or one good example among varied others?"* — **default to the latter** for
  flavour/intensity across a set. Don't mass-apply; propose the *principle* + at most one or two genuine candidates,
  and preserve variety of **kind AND intensity** (let most things be modest). Beware the tidy-symmetry pull (the
  "chaos rift ↔ dragon spine" mirror was elegant *and* exactly the wrong over-generalization).

### 2026-06-12 — A spec hands the engineer tunable DATA + feel targets, never a FORMULA that derives one game quantity from another

- **Principle:** I wrote "DPS scales superlinearly with cost: `dps ∝ cost^1.5` (the efficiency exponent, the
  master tunable)" into the #8.9 mana spec as a *mechanic*. The engineer faithfully built it (`gGodSkillDpsScale`
  — damage derived from cost at runtime), and Josh rejected the whole thing: **skills should have a fixed cost AND
  a fixed damage per level, set independently.** The intent I was reaching for ("reward going deep on one skill")
  is real and survived — but it's a **property of the numbers you choose** (author the damage table to climb
  faster than the cost table), *not* a formula in code. I had encoded a **descriptive** relationship as a
  **prescriptive** coupling, which removes the designer's ability to tune the two sides independently — the exact
  opposite of the build-space freedom I usually protect.
- **Why:** a spec is a contract for the engineer to build *and for Josh to tune*. Two quantities Josh wants to
  feel out separately (cost vs damage, here) must reach him as two independent dials (data tables) with a feel
  *target* ("damage should outpace cost — tune by eye"), not as one quantity computed from the other. A formula
  coupling looks elegant and "can't drift," but the no-drift property is exactly the control Josh wanted to keep.
  This is the supply-side/`open-vs-close` lesson at the spec layer: don't bake a relationship into the substrate;
  expose it as numbers. (Engineer-memory sibling logs the build-side: faithful impl of an over-specced formula is
  still the engineer's miss to catch — and this session that engineer was *me in the other hat*.)
- **How to apply:** when a spec is tempted to write "X scales as f(Y)", stop — ask "does Josh want to set X and Y
  independently?" (almost always yes). If so, spec **two tables + a feel target for their relationship**, never a
  coupling formula or an "exponent knob". Reserve formulas for genuinely-locked invariants (rare). Give the
  engineer the *intent* + the dials, and let the playtest set the numbers.

### 2026-06-12 — A "docs-only" PM push is NOT deploy-safe by default: `git push` ships the whole `origin/main..HEAD` chain, gated build commits and all

- **Principle:** the PM's pre-authorized docs-only push right is about *what the PM commits*, but `git push origin
  main` advances the remote over the **entire ancestor chain**, not just your diff. On a shared `main`, the engineer
  commits `index.html` locally and **deliberately leaves it unpushed** awaiting Josh's deploy auth — so if your docs
  commit lands *on top of* that, your "harmless" push **sweeps the gated build commit to Pages and deploys it.** It
  happened today: my docs pushes deployed the engineer's `index.html` #8 fixers (`1f41da0`) with no explicit OK.
- **Why:** Pages redeploys on any push to `main`; a local-but-unpushed `main` commit is **not** a safe deploy-hold
  against a co-committer who shares the branch. "I only staged docs" guarantees nothing about what *else* rides along.
- **How to apply (standing gate — run EVERY time before pushing, CLI or pm-bot):** check the **whole outgoing
  delta**, not your top commit — `git log --oneline origin/main..HEAD -- index.html assets/`. **Empty → safe to
  push** (truly docs-only). **Non-empty → the push is deploy-affecting regardless of who authored the tip → HOLD for
  Josh's auth** (or push only your commit via a non-`main` path). Same gate the engineer crystallized + the filed
  pm-bot guard (PM lane). Corollary: after committing your docs, **don't reflexively `git push`** — gate first.

### 2026-06-12 — The engineer session builds from your spec in near-real-time; encode directives the moment they land, and expect to re-rank when eng ships ahead of the roadmap

- **Principle:** the PM and engineer sessions run **concurrently and out of sync**, with the spec/tasks as the
  live contract — so a verbal directive from Josh isn't "captured for later," it's a **near-real-time hand-off**.
  This session every design call (chaosfire footprint rule, Chaos Steps, the Dragon–Chaos synergy, the locked mana
  cost model, the action bar) went chat → spec/TASKS → **engineer-built the same day**: item 7 (all 3 phases) *and*
  the God-Skill Action Bar I'd approved minutes earlier both shipped before I next looked. The corollary: the
  roadmap **drifts behind reality fast** (it still said "item 7 approved — cleared for build" after item 7 had
  shipped), so "read the commits → re-rank" is a recurring, real duty, not housekeeping.
- **Why:** with two reset-between-session agents sharing one repo, the doc *is* the wire. A directive left only in
  chat never reaches the engineer; one encoded into the spec with the givens/forks separated (and the cheap-reuse
  framing surfaced) gets built almost immediately and correctly. And because eng moves fast, a stale roadmap
  silently mis-points the *next* pull.
- **How to apply:** (1) When Josh directs something, **write it into the spec/TASKS in the same turn** — don't
  batch it to session end; the engineer may pull it within minutes. (2) Keep the spec the source of truth and the
  roadmap a thin pointer, so a fast ship only requires flipping a status, not rewriting detail. (3) **Open every
  session by reading the commit log**, not just the docs — the docs lag the build; reconcile (mark shipped,
  re-sequence, surface newly-unblocked work) before proposing. (4) When you approve art-cost work, file the
  Artist + Engineer hand-offs immediately — this session the engineer wired the action-bar's real-icon *hook*
  before the icons existed, because the hand-off named the exact `CARD_ICON_ART` contract.

- **Principle (Josh, foundational — "this is how I want you to think of our game systems"):** in a roguelite,
  long-run playability comes from the **breadth of viable builds**, so every system is judged by one question —
  **does it *open* build space or *close* it?** The durable pattern he set on the mana rework: **freeze the core
  mechanic** (how mana is spent — flat per-second drain that scales with skill level + per-emit costs, no cap) and
  make the **content/card layer the variety surface**. Cards push *independent* levers that span the archetype axes
  (mana: regen → SUSTAIN builds, max-pool → BURST builds, hybrids between), and a **UNIQUE / build-defining card
  class** (rare, run-shaping — e.g. *3× your mana pool*) is the highest-variance lever. The mechanic is the fixed
  substrate; the cards are where diversity lives — and **both poles must stay viable** (neither sustain nor burst
  dominates), a balance constraint that lives in the card pool, not the mechanic.
- **Why:** a pre-1.0 one-file roguelite earns replays from "what can I build this run?" A mechanic with one optimal
  use makes every run converge and thins the game out. Keep the mechanic fixed but the supply side rich, and new
  archetypes become **additive content** (new cards) rather than mechanic rewrites — cheap to extend, and the
  combinatorics compound. (Same shape as the god-skill lesson: depth from *combination*, not more knobs.) A flat
  per-second drain, notably, is gated by **regen ÷ drain** for uptime (pool only buys burst length) — so "sustain"
  vs "burst" are two real, independent build paths the card pool can target separately.
- **How to apply:** (1) Evaluate every proposal through open-vs-close build space; prefer **fixed mechanic + a
  content layer with *spanning* levers** (cover the axes) over a clever one-true-use mechanic. (2) When a mechanic
  creates a **hard gate** (here: a maxed skill costs more mana than you have), make sure the **content layer can
  answer it** — the supply must scale to meet the demand (the mana cards must scale ~10× with the drain), and the
  gate is **telegraphed + has a relief valve** (toggle/dormant), so it reads as a *build choice*, not a trap. (3)
  Separate the **demand** surface (the mechanic) from the **supply** surface (the cards) in specs — they phase
  differently; ship the mechanic, then expand the content. (4) Reserve a UNIQUE card class for the run-defining swings.

### 2026-06-11 — When productionizing a directive, separate the *given* from your *inferred design philosophy* — and sequence the foundational system before the features that must inherit it

- **Principle:** Two moves from a mana-rework handoff. (1) Josh gave concrete *givens* (benchmark: "leap + ~3s
  whirlwind empties the early pool"; "Burning Body ≈ 5mp/3s"; "toggle auto-casts to 1–9"). I correctly grounded in
  the engine first (found the full mana economy: pool 100, ~9/s regen, per-skill costs/CDs) and wrote a spec — but
  I also baked in an *inferred philosophy* ("mana is the primary gate, so **trim** cooldowns") and asserted it as
  the obvious default. Josh wanted the opposite (CDs are too short → **lengthen** them; leap ≥15s, WW 5s). Both are
  valid designs; the failure was presenting an inferred feel-philosophy as a settled default instead of flagging it
  as a *choice*. **On feel levers where Josh has strong taste, state your inferred design stance explicitly as a
  fork, the same way you'd flag an open question — don't smuggle it in as the neutral default.** (2) The right
  reflex I *did* hit: when a feel complaint rode along with a number ("WW feels underpowered" + "set CD to 5s"), I
  translated it into a **required power pass paired with the CD**, not just the literal number — a longer CD on a
  weak skill is a double-nerf. (3) Sequencing: Josh then said "prioritize the mana rework over the new skills; the
  new skills take direction from it." → **a cross-cutting system that will reshape how pending features must work
  should be built first, so those features are *authored into* it, not retrofitted** (Trail/Pyroclasm now get their
  `mpCost`+toggle from the start). I re-ranked Now and recorded the dependency in roadmap + spec + tasks.
- **Why:** Pre-1.0, the human is the only persistent taste-holder and his feel intuitions are the product. A spec
  that hard-codes my inferred philosophy reads as "decided," so he has to *notice and reverse* it (costs a turn and
  risks it shipping silently) — whereas an explicitly-flagged stance costs him one glance to confirm/redirect. And
  building a dependent feature before its governing system means paying to retrofit (or worse, locking the system's
  shape to fit what was already built).
- **How to apply:** When turning a directive into a spec: (1) **List the givens verbatim** (benchmarks, names,
  numbers he stated) and keep them distinct from **your design inferences** (which lever leads, what to trim/grow,
  default behaviours). Flag every inference as a fork with a recommendation — *especially* combat-feel/pacing knobs,
  where his taste is strong and yours is a guess. (2) Translate any "feels weak/bad" rider into the **systemic
  change it implies** (a power pass, not just the literal number), and say so. (3) Before sequencing, ask "does a
  system in this batch reshape how another pending item must be built?" — if yes, **build the system first and mark
  the dependent items to inherit it** (don't let them ship in a pre-system shape). (4) Grounding-in-the-engine-first
  still paid off (it always does) — the miss was purely in how I *presented* the derived design, not the research.

- **Principle:** Two doc-architecture moves, one right and one wrong, in one session. The **right** split is
  by *altitude/concern that actually differs*: I made `ROADMAP.md` product-pure (strategy: what/why/priority,
  PM-owned) and pushed execution state to a separate shared doc. The **wrong** split, made minutes earlier,
  was carving *execution* into two docs (a new `BOARD.md` + the existing `CLEANUP_BACKLOG.md`) — which Josh
  caught as redundant one day later: a "hand-off log" and a "deferred-findings backlog" are **the same
  primitive** — *a task, sometimes flagged by another agent*. The fix was to merge them into one
  owner-laned tracker (`TASKS.md`: lanes by the agent who owns+updates the task; anyone may file into any
  lane). **Test before adding a doc/section:** "is this a genuinely different *kind* of thing, or the same
  thing sliced by who-touched-it / when-I-noticed-it?" If the latter, it's one list with a field
  (owner, status, flagged-by), not two docs.
- **Why:** A one-file game with reset-between-session agents leans hard on docs as the shared brain, so doc
  *structure* is real infrastructure — and overlapping task lists drift immediately (the Favor coin was
  already double-tracked, framed two ways, within 24h). The cost of a redundant doc isn't storage; it's that
  every cross-role item now has two homes that disagree. Consolidating cost a second restructure of the same
  governance files in one session — cheap *only* because I treated the day-old `BOARD.md` as disposable the
  moment the overlap was clear, instead of defending it.
- **How to apply:** (1) Before creating a doc or a parallel section, name the **one axis** it splits on and
  check the existing docs don't already cover that axis differently — collapse same-primitive lists into one
  with distinguishing *fields*, don't spawn parallel docs. (2) For cross-agent work, the durable shape is
  **owner-laned with a flagged-by field**: each agent reads/owns its lane, anyone can enqueue into another's.
  (3) A structural change ripples — re-point **every** live operating doc (`CLAUDE.md`/`AGENTS.md`/`STUDIO.md`
  + each agent file) *and* the stale routing-pointers in agent memories; leave historical journals/archives
  alone (they're records of what was true then). (4) When the shared tree carries another session's **staged**
  changes, commit with an explicit pathspec (`git commit -- <paths>`), not a bare commit, or you sweep their
  lane into yours. (5) Don't be precious: a doc/structure you shipped this session is still disposable if it's
  shown wrong — re-doing it now is cheaper than a drift surface that compounds.

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

### 2026-06-09 — Ground every pitch in the shipped game + the feel target

- Proposals land when grounded in what *actually* shipped and serving the CD's feel/story pillars, not clever in
  the abstract — read the build + name the Creative Manifesto principle the idea serves before pitching, and arrive
  with a decision-ready one-pager. *(Now baked into the operating model + the Asset Audit; kept as the origin note.)*
