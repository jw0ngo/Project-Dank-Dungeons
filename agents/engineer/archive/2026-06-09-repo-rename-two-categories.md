### 2026-06-09 — A repo-wide rename is two categories, not one
*(Archived from `agents/engineer/memory.md` during the Session-15 compaction — distilled pointer kept in memory.)*

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
