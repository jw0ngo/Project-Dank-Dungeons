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
