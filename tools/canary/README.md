# tools/canary — headless in-browser canary (Infra-1)

Drives the **real game** (`index.html`, no mocks) in headless Chromium from the CLI, via the
§8 Sim harness — so an agent can close its own verification loop instead of leaving
"⚠ in-browser canary pending — needs a live browser" debt.

## Setup (once per machine)

```
cd tools/canary
npm install
npx playwright install chromium
```

`node_modules/` is git-ignored; `package.json` pins the dep.

## Use

```
node tools/canary/run.mjs                    # preset: boot — game loads, idles 3s, zero errors
node tools/canary/run.mjs --batch 3          # 3 headless bot runs -> balance report (Sim.batch)
node tools/canary/run.mjs --check draft      # presets in checks.mjs: boot | batch | draft
node tools/canary/run.mjs --expr "Sim.observe().player"     # any expression, await-ed
node tools/canary/run.mjs --headful          # watch it run (debug the canary itself)
node tools/canary/run.mjs --url http://localhost:5500/index.html   # reuse a running dev.py
```

- Spawns its own `python -m http.server` on **:5599** (never fights `python dev.py` on :5500).
- Prints one JSON object; **exit 0 = clean, exit 1 = failure**.
- **Fails on:** any `pageerror`, any `console.error`, a thrown `--expr`, or a preset returning
  `__failed: true`.
- **Reports but does not fail on** `console.warn` — so `gInitArt`'s `[art] missing/undecodable:`
  warnings surface here without blocking (missing-asset *errors* are `tools/verify-repo.py`'s job).

## Writing checks

Add a named preset to `checks.mjs`: `{ desc, run: (page) => page.evaluate(async () => {...}) }`.
Return JSON-able data; return `{ __failed: true, why: '...' }` to fail. Top-level `function`
declarations in the game script are window-visible (`window.gWildGrantXP`); top-level
`let`/`const` are reachable inside `--expr` (evaluated in the page's global scope).

**Recipes:**
- Verify a specific card's bundle applies:
  `--expr "(()=>{ Sim.startRun(); gWildGrantXP(200,0,0); return Sim.observe().player; })()"`
  then assert the drafted stat moved (or use `--check draft` for the generic pipeline pass).
- God-skill flow: `--expr` with `Sim.startRun()` + the relevant `Sim.*`/dev helpers, asserting on
  `Sim.observe().player.godSkills`.
- Balance regression watch: `--batch 10` and compare `report.survivalSec` medians across changes.
