# Archived engineer memory entries (compacted 2026-06-11)

Raw originals moved out of `agents/engineer/memory.md` to keep it under the 250-line compaction
threshold. Both lessons are still valid — the first is now **institutionalized** in `docs/BOARD.md` +
`CLAUDE.md` (the shared board is explicitly a live cross-role input); the second was a one-time migration
(base64 art externalized, done). Kept here for provenance.

---

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
  brain — cheap to re-read, expensive to re-architect. *(Now codified in `docs/BOARD.md`.)*
