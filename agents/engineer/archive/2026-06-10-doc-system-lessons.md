# Archived raw entries — doc-system lessons (2026-06-10/06-11)

These three raw `memory.md` entries were consolidated (with the 2026-06-11 journal-rework lesson)
into the single "Documentation is a system" entry in `agents/engineer/memory.md`. Preserved here in
full for provenance.

---

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
