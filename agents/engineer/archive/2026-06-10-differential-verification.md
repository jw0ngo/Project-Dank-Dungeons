# Archived engineer-memory entry

Archived 2026-06-10. Superseded: a portable Node LTS now lives outside the repo and is on PATH, so
`node --check` runs natively again — the "no Node, build a differential proxy" situation no longer
applies. The transferable kernel (when a check can't run, diff a proxy against a known-good baseline so
the baseline cancels the proxy's blind spots) is preserved here for reference.

---

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
