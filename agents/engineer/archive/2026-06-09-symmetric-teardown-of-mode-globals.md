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
