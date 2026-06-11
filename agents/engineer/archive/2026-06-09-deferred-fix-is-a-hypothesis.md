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
