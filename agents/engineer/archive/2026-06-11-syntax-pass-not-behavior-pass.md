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
