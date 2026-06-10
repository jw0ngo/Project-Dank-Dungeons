# Engineer — Memory
*Crystallized, transferable engineering lessons. Read first each session; append at session end. Self-compact when over 250 lines (merge/supersede/raise-altitude; archive superseded entries to `agents/engineer/archive/`).*

Crystallized, high-altitude engineering craft for *To Dust*. Newest first. Read this first each
session; add to it at session end (studio doctrine — see `studio/STUDIO.md`). One entry = one
dated, titled lesson: **the principle → why → how to apply.** Quality over volume.

> **Division of homes:** tactical debugging lessons stay in `docs/SESSION_JOURNAL.md`; deferred findings
> in `docs/CLEANUP_BACKLOG.md`; architecture in `docs/TO_DUST_CTO_DOC.md`. *This* file is the step up
> from all of them — the transferable principles about *how to engineer well in this codebase*.

> Entry template:
>
> ### YYYY-MM-DD — <short principle as a title>
> - **Principle:** <the transferable lesson, one line>
> - **Why:** <what made it true here>
> - **How to apply:** <what to do next time>

---

### 2026-06-10 — When your metric is noisy and the user gives bracketing reports, triangulate from THEIR observations

- **Principle:** If an automated measurement is unreliable for a case (the heavy-swing scale: the extended
  sword inflates shoulder width, the pitched head corrupts the head band → per-facing 0.77..1.94), do **not**
  override the user's in-game observations with a clever theory. Successive user reports often *bracket* the
  truth: "it pops bigger" (at 1.3/192≈1.41/208) and then "it's smaller than idle" (at 1.16/208) pin the
  answer between them — which is exactly the tool's idle-match (~1.31/208) that I'd dismissed as noise.
- **Why:** I thrashed the swing mult 1.3→1.10→1.16→1.31 across three rounds because I kept reasoning from
  corrupted numbers and a plausible-but-wrong "anchor it to the wind-up" shortcut, treating the tool's 1.31
  as too-noisy-to-trust. The user's two plain observations had already fenced the value; trusting them sooner
  would have skipped two iterations. The metric was noisy *and* the human signal was strong — I weighted them
  backwards.
- **How to apply:** when eyeball feedback and a shaky metric disagree, let the human reports set the bracket
  and use the metric only to interpolate within it. Two contradictory-sounding reports ("too big" then "too
  small") aren't the user being fickle — they're a binary search; take the midpoint. Reserve the confident
  metric-over-eyeball move for cases where the metric is actually trustworthy (stable stances), not the
  pathological ones.

### 2026-06-10 — A pose's draw-mult is a measured number with a gate, not a handoff figure you trust

- **Principle:** Before wiring the draw multiplier for any new action-pose sheet (`playeratk`/`playerheavy`/
  `playerdash`/`playerheavywindup`/enemy poses), **run `python tools/check-pose-scale.py <prefix> --mult M
  --plant P`** and make it pass (exit 0). The body must match idle *apparent* size by a pose-invariant
  feature — the **mean of head-width and shoulder-width ratios** vs idle — never by bbox height / `bodyH` /
  body-fill, which a different silhouette distorts. Give each pose its own named constant
  (`WINDUP_DRAW_MULT`=1.07, `WINDUP_PLANT`=0.14·PSCALE) — don't reuse another pose's mult.
- **Why:** the heavy WIND-UP shipped at `1.3` (copied from the swing, justified by a 0.736-vs-0.732
  *bbox-fill* parity in the Artist handoff) and rendered ~30% too big — Josh flagged the pop immediately.
  Measured properly, the coiled wind-up is already idle-sized in-cell (shoulder 90 vs idle 92); the true
  mult is ~1.07. The head/shoulder *mean* is what's robust (each alone is noisy and they move oppositely):
  the dash, correct in-game at 1.0, measures head 1.12 / shoulder 0.88 / mean 1.00 — that validated the
  estimator against known-good art. The "match by helmet width not bbox" rule was *already* in memory but
  unenforced, so a bbox-fill recommendation slipped through. The fix was to turn the rule into a tool+gate.
- **How to apply:** treat any scale figure in an Artist handoff as a hypothesis, not a fact — verify it with
  `check-pose-scale.py` before wiring. A pose whose feet sit above the cell bottom (coiled stances) needs a
  downward plant offset too (= idle feetY − pose feetY; the tool reports it). **`gDrawSprite` maps the WHOLE
  sprite canvas to `PSCALE*mult`, so the draw-mult is coupled to the canvas (cell) size: if a sheet is re-cut
  to a different cell size (the heavy swing went 192→208 to fit a recovered foot), the mult must re-scale by
  `new/old` (1.3→1.41-equiv) or the body silently shrinks/grows — RE-RUN the tool, which now normalises by
  cell so it stays canvas-correct.** When a recurring art-wiring judgment keeps biting, encode it as a
  measuring tool that emits a pass/fail, so the next session can't trust-the-eyeball its way back into the
  bug — and make the tool normalise by the unit it compares in, or it gives confidently-wrong numbers the
  moment an assumption (uniform canvas) breaks. (Sharpens the eyeball-vs-measure lesson below; user memory
  `sprite-size-consistency` updated.)

### 2026-06-10 — Wire variant art as a data-driven map, and let the Artist own the assets

- **Principle:** When wiring directional/variant art (an 8-way walk cycle, per-element skins), make the
  swap a **data-driven lookup** (`PLAYER_WALK_OCT = {octant→dir}` consulted each frame + `char.<id>.<dir>`
  registry keys) rather than branching code. Each new asset is then a *one-line* wire, and — crucially —
  the **Artist can commit the `assets/` files independently while the engineer commits only the
  `index.html` wiring**. That seam let a parallel Artist session deliver/​re-cut sprites (E re-cut, W
  mirror) with zero re-wiring on my side: same filenames → the manifest already pointed at them.
- **Why:** This session I overstepped and *sliced* the first three directions as engineer — and promptly
  misdiagnosed the East scale by **eyeballing an overlay instead of measuring**, bumped the scale, and
  grew+clipped the helmet. The Artist's measured re-cut was cleaner. The boundary exists because slicing
  is the Artist's craft; the engineer's job is the map + the keys. (Boundary recorded in user memory
  `sprite-pipeline-role-boundary`.)
- **How to apply:** If raw art (frame folders, a sheet, an `.mp4`) lands in an engineer session, hand the
  slicing to `/artist`; keep your work to the registry/map wiring. Verify the handoff by *measuring*
  (192² canvas, foot row, body span, no `top_row==0` clip), never by eye. Design the wiring so a new
  variant = one map entry + its keys, and the two roles commit on their own side of the file boundary.

### 2026-06-10 — Settle the structure before rewiring references; structure determines the paths

- **Principle:** When a change reshapes *where things live* (a directory move, a doc consolidation, a
  rename), do not start mechanically fixing inbound references until the target structure is locked.
  References are a function of the structure — fix them against a structure that's still moving and you
  redo the work. Get the shape agreed first, then rewire once.
- **Why:** This session I began converting `../docs` → `../../docs` across the moved role files right
  after the user dropped them into `agents/`. Two messages later the structure changed again (fold the
  operating-model docs *into* one file per role, standardize on root-relative paths) — which deleted the
  very files I was repathing and inverted the path convention. The `../../` work was pure waste. The tell
  was there: the user was still actively reshaping ("each agent should have its own discrete file") — an
  unsettled structure.
- **How to apply:** When a restructure request arrives mid-flight, *pause the reference sweep* and
  converge the structure first (a crisp AskUserQuestion on the real forks — granularity, what folds in,
  where memory lives — beats guessing). Only once the shape is fixed, do the rewiring in one pass. Tell
  the seam apart: scouting/folding content is safe to parallelize early; the inbound-reference rewrite is
  the *last* step, because it's the one the structure invalidates. Corollary that paid off here: encode
  recurring maintenance as a **data-driven hook** reading each agent's declared frontmatter
  (`memory_compact_at`), not a hardcoded role→path map or a prose rule — then a structure change (a new
  agent) needs no hook edit; the agent self-registers.

### 2026-06-10 — When docs route content by altitude, each altitude is a separate write — or tactics fall through the seam

- **Principle:** A tiered doc system (high-altitude principle → `LEARNINGS.md`; tactical specifics →
  `SESSION_JOURNAL.md` + its lookup tables) only works if *both* halves are written deliberately.
  Crystallizing the principle does **not** capture the tactic, and vice-versa — they live in different
  files for different readers. The handoff between a working session and the framework is exactly where
  a tactic silently vanishes.
- **Why:** The parallel wolf-mother session crystallized the right *principle* ("measure the geometry
  before reaching for flags") into `artist/LEARNINGS.md`, but the *tactical* `--bleed` step it discovered
  never landed in the Sprite Import Checklist — the working-copy edit was dropped, and because the
  principle survived, the gap was invisible until audited. The next artist would have the wisdom but not
  the recipe. The same seam cuts the other way: a checklist step with no crystallized principle teaches
  the fix but not the class of mistake it prevents.
- **How to apply:** When you (or a parallel session) finish a piece of work, log it at *both* altitudes
  as two explicit acts: the recipe/flag/symptom-row in the tactical home, the transferable principle in
  `LEARNINGS.md`. When reconciling another session's output, don't assume "logged" means complete —
  check both homes. And the lean home for a tactical one-liner is the existing **lookup table**, not a
  new session narrative — that keeps the journal from re-bloating while still capturing the recipe.
  *(Workflow-friction this session: a PowerShell `Get-Content`/`Out-File` rewrite mangled em-dashes/`§`
  because it used the Win-1252 default — logged the .NET-UTF8 fix in the journal's heuristics table so
  it costs zero turns next time.)*

### 2026-06-10 — An auto-loaded context file pays its cost in *every* session — keep it a router, push depth behind it

- **Principle:** Context that loads unconditionally (the root `CLAUDE.md`/`AGENTS.md`, an append-only
  journal two roles skim) is a tax levied on every session, including the ones that never use it. Keep the
  always-loaded layer a thin **router** (map + where-to-find-X), and put the deep, role-specific content in
  files that load **only when that role/task is active**. Tier by load-frequency, not by topic.
- **Why:** The engineer's role manual *was* the repo-root `CLAUDE.md`, which auto-loads into every PM and
  Artist session too — so those roles silently paid for ~194 lines of engine architecture and gotchas they
  never touch (the Artist's startup ran ~1,700 hot lines before doing anything). PM and Artist already had
  their own role folders; the engineer's asymmetry was the whole leak. Splitting out `engineer/CLAUDE.md`
  made the engineer symmetric and dropped the universal auto-load 194→60. The parallel `AGENTS.md` had also
  rotted into a *contradicting* second source of truth (claimed "no Node," still described inlined base64
  art) precisely because it was a full hand-maintained duplicate rather than a thin pointer.
- **How to apply:** For any always-on context, ask "does every consumer need this, every time?" If not,
  demote it to on-demand and leave a one-line pointer. Cap append-only logs (archive the tail, keep recent +
  the distilled lookup tables hot). Make per-tool entrypoints (`CLAUDE.md`/`AGENTS.md`) thin routers over
  **one** shared deep-doc set — never duplicate the depth, or the copies drift and contradict. Instruct
  reads as "the relevant section of X," not "read X every session." Measure the win in hot-lines-at-startup.

---

### 2026-06-09 — A deferred entry's "Fix:" is a hypothesis, not an instruction — re-verify its premise before acting

- **Principle:** A backlog/spec item's stated premise rots between when it was written and when you act on
  it. Re-confirm the premise against the *current* code before executing the prescribed fix — especially
  when the fix is destructive (delete code, drop a field, remove a contract). The cost of a stale
  premise is highest exactly when the prescription is "just delete it."
- **Why:** The "orphaned character creator — delete the screen + `cc*` helpers + the `df_player_sprite`
  contract as dead weight" entry was wrong on audit: the creator is reachable (a hub button), and
  `df_player_sprite` + `ccPixelsToCanvas` are *live* in multiplayer (you broadcast your sprite; peers
  render it). Executing the prescribed deletion would have broken MP custom sprites. The entry also named
  two functions (`charDrawPreview`/`invRenderCharPreview`) that no longer exist — the premise had drifted
  on multiple axes. The real residue was a cosmetic inconsistency, not dead code.
- **How to apply:** Before acting on a deferred "Fix:", re-run its premise as a quick audit — grep the
  symbols it names (do they still exist?), trace reachability and every consumer ("what reads this? what
  breaks if it's gone?"). If the premise is false, *reframe the entry* (and surface the contradiction)
  instead of carrying out the deletion. This is the destructive-action discipline: when what you find
  contradicts how the work was described, stop and report, don't proceed.

### 2026-06-09 — Global state set for a special mode must be torn down symmetrically, or it corrupts the default mode

- **Principle:** When a sub-mode (headless sim, debug, replay) flips a *shared global* to change
  behavior, the same code path must restore it on exit — ideally save-at-entry / restore-in-`finally`,
  not set-and-forget. A one-way mutation leaks out of its mode and silently breaks normal operation,
  and the symptom shows up far from the toggle.
- **Why:** `Sim.startRun` set `window._SIM.muted = true` so headless stepping is silent, but nothing
  ever cleared it — so after *any* `Sim.batch`/`runFast` (including the `await Sim.batch(3)` canary the
  docs tell you to run), every SFX's `gpfx` guard early-returned and the game was mute until reload.
  The same function already had the correct pattern for a *different* global — `installClock()` /
  `restoreClock()` in a `try/finally` around the loop — so the fix was to make audio mirror the clock:
  remember the caller's state, mute for the stepping, restore in the `finally`.
- **How to apply:** For any `_SIM.*` / debug / mode flag that alters runtime behavior, own its full
  lifecycle in the function that enters the mode (capture → set → `finally` restore); don't set it in a
  "begin" helper and hope something resets it. When you find a leak like this, look for a *sibling
  global already toggled correctly in the same scope* and mirror its teardown. And treat the AI-native
  harness as production code: it mutates shared globals (`_SIM`, the clock, hooks), so its mode toggles
  need the same restore discipline — a harness that dirties the default play state is a real player bug.

### 2026-06-09 — A 14 MB scary blob can be a mechanical migration when the consumer is interface-narrow

- **Principle:** Before pricing a daunting refactor (here: de-inlining ~12 MB of base64 art), find the
  *single consumer* of the thing you're changing. If everything funnels through one
  interface-narrow chokepoint, the migration is a value-rewrite, not an engine change — cheap and
  low-risk. The fear scales with the byte count; the risk scales with how many places interpret the data.
- **Why:** All 179 inline images were consumed in exactly one place — `gInitArt`'s `im.src = ART_MANIFEST[key]`
  — which is format-agnostic (a path and a `data:` URL are identical to it). A grep confirmed *nothing*
  introspected the values as base64 (no `atob`, `startsWith('data:')`, or slicing). So a scripted
  decode-blob→write-file→swap-the-string-literal pass, with zero draw-code changes, did the whole thing.
- **How to apply:** Scope a big data-shape migration by grepping every read of the data and classifying
  each: "assigns/passes through" (safe) vs "parses/inspects the shape" (the real work). If the second
  set is empty, script the swap and verify by *consequence* not syntax — for art, "no 404s" (HEAD every
  referenced path) + a render screenshot catches what `node --check` can't (a typo'd path 404s and
  silently falls back to the procedural sprite, looking fine).

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
