# Engineer — Memory
*Crystallized, transferable engineering lessons. Read first each session; append at session end. Self-compact when over 250 lines (merge/supersede/raise-altitude; archive superseded entries to `agents/engineer/archive/`).*

Crystallized, high-altitude engineering craft for *To Dust*. Newest first. Read this first each
session; add to it at session end (studio doctrine — see `studio/STUDIO.md`). One entry = one
dated, titled lesson: **the principle → why → how to apply.** Quality over volume.

> **Division of homes:** tactical debugging lessons stay in `docs/SESSION_JOURNAL.md`; deferred findings /
> to-dos in your Engineer lane of `docs/TASKS.md`; architecture in `docs/TO_DUST_CTO_DOC.md`. *This* file is the step up
> from all of them — the transferable principles about *how to engineer well in this codebase*.

> Entry template:
>
> ### YYYY-MM-DD — <short principle as a title>
> - **Principle:** <the transferable lesson, one line>
> - **Why:** <what made it true here>
> - **How to apply:** <what to do next time>

---

### 2026-06-11 — Code-referenced asset paths migrate atomically: script move + manifest-rewrite as one op
- **Principle:** Reorganizing assets referenced by explicit path strings (~200 `ART_MANIFEST` entries) is a
  move **plus** a synchronized path-rewrite — inseparable. A half-migration (files moved, paths stale) 404s
  every asset to its procedural fallback, invisible to `node --check`. Do both by **script, never by hand**,
  in one self-verifying commit (`tools/fold-assets.py --apply` = `git mv` + rewrite + assert each path resolves).
- **How to apply:** dry-run first (prove 0 unmapped + the rewrite count); the `index.html` owner runs `--apply`
  so both halves land in ONE commit. Organize on the **durable axis** — top-level by asset-kind, fold within on
  the kind's own axis (char=faction, fx=owner, tile=type; `assets/README.md`), never a volatile one (skill names).

### 2026-06-11 — Syntax-pass ≠ behavior-pass; when no browser, extract-and-eval the real logic

- **Principle:** Verifying *syntax* is not verifying *behavior*. A change can be syntactically perfect and
  still inert or wrong — a duplicate `function` shadows the real one, a per-frame system sits outside
  `gSimUpdate`, a sprite scale moves without its hitbox, **or a parked sibling leaks into a generalized
  loop**. Always run a *targeted proof it took effect* (grep the new key, `grep -c "function name("`,
  `await Sim.batch(3)`); "it parses" is step one of three.
- **Three sharp instances:**
  - *Generalizing a hardcoded system in place* (imbue-paths `'swing'` → any god-skill id): a **parked
    sibling in the same registry** (`IMBUE_PATHS.cilia.swing`) got swept up when the new code iterated
    `Object.keys(pool)` — it would have offered "acquire Dance of Fire" as a god skill. Discriminate by a
    **structural marker of the new capability** (here a `fire` block, `gIsGodSkill = !!tree.fire`), not by
    name. Park ≠ inert: it still sits in the collection the new loop walks.
  - *The Sim canary is browser-side* (`document`/Canvas), so with no headless browser you can still
    unit-test the **real** pure logic: regex-extract the actual `function`/`const` declarations from
    `index.html` (brace-match to balance), `eval` them in Node behind ~5 stubs (`gPlayer`,
    `rollCardRarity`), and drive the state machine. This caught the parked-sibling bug that `node --check`
    + greps both missed. Watch const ordering (TDZ) and that `eval`-scope `const`s don't leak to the driver.
  - *A hook script that parses and exits 0 can still never do its job.* A PowerShell `[string]`-typed
    param **defaults to `''`, not `$null`** (`[string]$P = $null` → `''`), so a `if ($null -eq $Porcelain)`
    guard is always false and the real-`git` branch never runs. A new SessionEnd commit-reminder *and* the
    existing `doc-drift-check.ps1` were both silently dead this way (the latter for who-knows-how-long —
    "silent by design when nothing to report" hid the failure). Fix: gate on
    `$PSBoundParameters.ContainsKey('Porcelain')`. Silent automation is the worst kind — a hook that does
    nothing reads identical to one with nothing to do.
- **How to apply:** After a non-trivial change, prove it *behaves* — and when the in-engine harness needs a
  browser you don't have, lift the pure functions out and assert against them directly. It's the
  "test that would have caught it," achievable in ~40 lines without a framework. **For automation/hooks,
  the proof is observing the side effect fire** (pipe a synthetic payload in; watch it actually act), never
  "the script looks right" — and copy-pasting a buggy guard propagates the silent failure to the next script.

### 2026-06-10 — De-risk a large spec'd feature: sub-slice on rails, drive it with a dev harness, iterate feel behind named knobs

- **Principle:** A big, multi-session, fully-specced feature lands safest as **independently-verified
  sub-slices on rails you build once**, amplified by two things: (1) a **`_DEV`-gated test harness that
  drives the *real* systems** (never a parallel code path) so you can reach any deep state in one click,
  and (2) **placeholder FX wired to named registry/const knobs** so feel-iteration with the user is
  *edit-a-number*, not re-architect-geometry.
- **Why:** Imbue Paths Phase 1 split into Slice A (tree rails + numeric ranks) → B (Form fork + the
  reusable evolution overlay + the charter-critical `gSimEvolution` headless hook) → C (rank-10 ascension:
  3-hit combo + two burning-ground substances + four climaxes) — each `node --check`'d, grep-proven,
  node-logic-tested, and committed alone. A "Skillforge" panel (imbue / rank / trigger any fork on the
  shipping code) turned "grind the wilderness to rank 9 to test the capstone" into one button, and let the
  user redirect the wave shape, jet shape, ball size, ground placement, and ring radius ~7 times in a row —
  each a one-constant edit (`FW_*`, `DRAGONFIRE_JET_*`, `FLAMEOFCHAOS_*`, `FIREFIELD_EYE`) because each
  shape lived in *one* accessor/spawn. Once the rails existed, every leaf was registry data + one bespoke
  FX function. The riskiest piece (a new pausing modal) was de-risked by reusing Slice B's overlay+hook.
- **How to apply:** For a spec'd epic, build the system + its highest-feedback instance first (front-load
  the system risk); fan out the rest as registry data + per-instance FX. Stand up a `_DEV`-gated harness
  early, route it through shipping code, and make it reachable wherever you actually test (town **and**
  dungeon — drive its visibility from the one `showScreen('game')` gateway, gate actions on
  `isGameActive()`). Keep every feel value a named knob; centralize a shape into one source of truth
  (e.g. `gFireWaveShape` read by both hitbox and draw) so "what you see is what you hit" and one edit
  retunes both. **Committing intermixed feature + incidental tweaks from the single `index.html`:** split
  into clean commits by *snapshot full → scripted-revert one concern (report OK/SKIP/FAIL per site) →
  commit → restore the snapshot → commit the rest* — never hand-reapply a large block. And `node --check`
  is blind to runtime faults: a `const` referenced by the **boot path** before its own declaration line
  throws a TDZ error on load (the deploy-breaking kind), so declare cross-cutting flags (`_DEV`) early and
  verify behavior, not just parse.

### 2026-06-10 — Measure sprite scale & art quality; never trust a handoff figure or an eyeball (consolidated)

- **Principle:** Sprite-art numbers — a pose's draw-mult, a cutout's edge quality, a facing's scale — are
  **measured against a known-good reference**, never trusted from a handoff or judged by eye. (1) **Draw-mult:**
  before wiring any action-pose sheet, run `python tools/check-pose-scale.py <prefix> --mult M --plant P` to
  exit 0; match idle *apparent* size by the **mean of head- and shoulder-width ratios** (pose-invariant) — never
  bbox/`bodyH`/body-fill, which a different silhouette distorts. Each pose gets its own named const; coiled
  stances also need a plant offset (= idle feetY − pose feetY). (2) **Cutout quality:** measure the alpha-fringe
  (8<α<200 band brightness) against a clean sibling — a wide mid-gray band (~55) vs a tight dark one (~14) is a
  keying halo, an *art* defect, not a render one. (3) **Role boundary:** slicing is the Artist's craft; the
  engineer wires a **data-driven map** (`PLAYER_WALK_OCT`{octant→dir} + `char.<id>.<dir>` keys) so each variant
  is a one-line wire and the Artist commits `assets/` independently of your `index.html`.
- **Why:** the heavy wind-up shipped at `1.3` (copied from the swing on a bbox-fill parity in the handoff) and
  rendered ~30% too big; I once *eyeballed* an overlay and grew+clipped a helmet — both "trusted a number I didn't
  measure." The estimator validates against known-good art (the in-game-correct dash measures head/shoulder mean
  1.00), and the metric can itself be noisy (an extended sword inflates shoulder width → per-facing 0.77..1.94).
  **Gotcha:** `gDrawSprite` maps the WHOLE canvas to `PSCALE*mult`, so the mult is coupled to cell size — re-cut a
  sheet to a new cell (192→208 to recover a foot) and the mult must re-scale `new/old`; re-run the tool.
- **How to apply:** treat every scale/quality figure in a handoff as a hypothesis; verify with the tool before
  wiring. **When a shaky metric and the user's eyeball disagree, let the user's reports set the bracket and the
  metric interpolate within it** — two contradictory-sounding reports ("too big" then "too small") are a binary
  search, take the midpoint; reserve metric-over-eyeball for trustworthy stable stances. When a recurring
  art-wiring judgment keeps biting, encode it as a pass/fail measuring tool (normalised by the unit it compares
  in) so the next session can't trust-the-eyeball back in. (Memories `sprite-size-consistency`, `sprite-pipeline-role-boundary`; raw originals in `archive/`.)

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

### 2026-06-09 — A deferred entry's "Fix:" is a hypothesis, not an instruction — re-verify its premise — archived
- A backlog/spec "Fix:" premise rots between writing and acting; re-confirm against *current* code before
  executing — especially destructive prescriptions ("just delete it"). Grep the symbols it names, trace
  reachability + every consumer; if the premise is false, reframe the entry and report, don't proceed. Full
  entry: `agents/engineer/archive/2026-06-09-deferred-fix-is-a-hypothesis.md`.

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

### 2026-06-09 — A repo-wide rename is two categories (display text vs frozen compat tokens) — archived
- Split occurrences into rename-freely **display text** vs **never-touch frozen tokens** (seed prefix `DF1`,
  storage keys, many-reference filenames, `docs/archive/` snapshots) — renaming a frozen token silently breaks
  live data; triage every variant before a find/replace. Full entry:
  `agents/engineer/archive/2026-06-09-repo-rename-two-categories.md`.
