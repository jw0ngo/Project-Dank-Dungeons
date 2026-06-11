### 2026-06-11 — Documentation is a system: tier by load-cost, key shared artifacts to self-order, write every altitude (consolidated)

- **Principle:** The repo is the shared brain, so its docs are engineered artifacts with their own failure
  modes. Four standing rules, each from a real miss:
  1. **Tier always-on context by load-frequency, not topic.** Anything that auto-loads (`CLAUDE.md`/`AGENTS.md`,
     a journal two roles skim) is taxed on *every* session, including the ones that never use it — keep it a thin
     **router** (map + where-to-find-X) and push depth behind role/task-gated files. The engineer manual living in
     the root `CLAUDE.md` made PM/Artist sessions pay ~194 lines they never touched; splitting it dropped the
     universal load 194→60. Per-tool entrypoints must be thin pointers over ONE deep-doc set, never duplicated
     depth (a hand-maintained duplicate `AGENTS.md` rotted into a *contradicting* second source of truth).
  2. **Key a multi-writer append-only log on a self-ordering, collision-proof primary — not a hand-incremented
     counter.** Manual `## Session N` numbering produced a duplicate "Session 15" prepended into the wrong slot;
     re-keying on **date** (`## YYYY-MM-DD — title [roles] · sN`, newest-first) makes ordering automatic and
     collisions impossible. Keep the old sequence id only as a stable cross-reference (other docs cite it) and a
     same-day tiebreak.
  3. **Don't fragment a shared cross-role artifact per-role when a keying/tagging change fixes the real problem.**
     Splitting the journal into per-agent files (the tempting structural fix) would have shattered single
     cross-role sessions and duplicated the `agents/<role>/memory.md` layer; a `[roles]` **tag** gives per-role
     *filtering* on a unified timeline instead. Reach for the mechanical fix before the structural one.
  4. **When docs route content by altitude, each altitude is a separate, deliberate write.** Crystallizing a
     principle (`memory.md`/`LEARNINGS.md`) does NOT capture the tactic (the `SESSION_JOURNAL` lookup table) or
     vice-versa — the handoff between a working session and the framework is exactly where a tactic silently
     vanishes. Log both; the lean home for a one-liner tactic is the existing table, not a new narrative.
- **Corollary — restructure before you rewire.** References are a function of structure: when a change reshapes
  *where things live*, lock the target shape FIRST, then rewire inbound references in one pass. Sweeping
  `../docs`→`../../docs` mid-restructure was pure waste when the structure changed again two messages later.
  Scouting/folding content parallelizes early; the inbound-reference rewrite is the *last* step. Encode recurring
  maintenance as a data-driven hook reading declared frontmatter (`memory_compact_at`), not a hardcoded map.
- *(Consolidates the four 2026-06-10/06-11 doc-system entries; raw originals in
  `agents/engineer/archive/2026-06-10-doc-system-lessons.md`.)*
