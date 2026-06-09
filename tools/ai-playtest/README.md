# AI Playtest — Claude plays To Dust

Lets **Claude** play a live wilderness run through the `§8` `Sim` harness, so you can
watch how a reasoning agent handles combat, kiting, ability use, and the card draft —
qualitative playtesting, not balance-at-scale (use `Sim.batch()` with the scripted bot
for that).

## How it works (hierarchical, real-time)

A Claude API call is a network round-trip; the game runs at 60 fps. So Claude doesn't
play frame-by-frame — it plays at **altitude**:

```
browser (Sim.aiConnect)                         this proxy                  Claude API
  every frame:  execIntent(observe())  ── reflexes (move/aim/dash/attack)
  every ~350ms: POST observe() ───────────────► /decide ──► messages.parse ──► INTENT
                apply returned intent ◄───────────────────────────────────────┘
```

The proxy holds `ANTHROPIC_API_KEY`. **It is never put in `index.html`** — a key shipped
in the browser would leak to every player.

## Run it

```sh
pip install anthropic
# Windows PowerShell:
$env:ANTHROPIC_API_KEY = "sk-ant-..."
python tools/ai-playtest/server.py          # → http://localhost:8788
```

Serve the **`-sim`** build (this worktree) and open it, e.g. `python dev.py` from this
directory, then in the browser console:

```js
Sim.aiConnect()                                   // model claude-opus-4-8, replans every 350ms
Sim.aiConnect({ model: 'claude-haiku-4-5', decideMs: 250 })   // faster/cheaper loop
Sim.aiConnect({ model: 'claude-sonnet-4-6' })
Sim.aiDisconnect()                                // hand control back
```

Watch the console: each decision logs the intent + Claude's one-line rationale. If the
proxy is down or the key is missing, the browser warns and the built-in heuristic keeps
the hero alive so the run doesn't stall.

## Configurable model

`Sim.aiConnect({ model })` sends the model per request; the proxy allows
`claude-opus-4-8` (default), `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`.
A/B them on the same run to compare play quality vs. latency/cost.

## The contract

- **Browser → proxy** `POST /decide` `{ obs, lastIntent, model }` — `obs` is `Sim.observe()`.
- **Proxy → browser** `{ intent }` where intent =
  `{ target:int|null, range:"melee"|"kite", action:"attack"|"retreat"|"whirlwind"|"collect"|"hold", dashIfThreatened:bool, cardPick:int|null, note:string }`.
- `Sim.execIntent()` (in `index.html` `§8`) translates the intent into frame-level inputs.

To change how Claude thinks, edit `SYSTEM_PROMPT` / the `Intent` schema in `server.py`.
To change how an intent is *executed*, edit `Sim.execIntent` in `index.html`.

## Notes

- This is **dev tooling on the `sim-harness` branch**, separate from the level-up redesign
  on `main`. Merge order and the shared card-draft hotspot are tracked in the engineer's notes.
- Latency note: the loop intentionally omits extended thinking for speed and cross-model
  safety. For deeper tactical reasoning on Opus, add `thinking={"type":"adaptive"}` in
  `server.py` (Opus/Sonnet only — not Haiku).
