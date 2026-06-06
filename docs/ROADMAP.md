# Dungeon Forge — Product Roadmap

**The PM↔engineering handoff medium.** The Product Manager maintains this doc per [`PRODUCT_MANIFESTO.md`](PRODUCT_MANIFESTO.md); the engineer pulls **approved** items from *Now* and builds them per [`ENGINEERING_CHARTER.md`](ENGINEERING_CHARTER.md).

**Status legend:** `proposed` (PM idea, not yet seen by developer) · `approved` (developer greenlit — engineer may build) · `in-progress` · `shipped` (move to changelog, delete here) · `held` / `cut`.

Keep the three horizons full. Re-rank after every release. This seed reflects game state at **v0.11.0**; everything below is `proposed` until the developer approves it.

---

## God design identities (north star)

Each patron owns a **distinct combat identity**. An imbued skill kit must express that identity
through genuinely different mechanics — different feel, effect, and **hitbox** — never a recolor
of another god's kit. (Cilia's current kit is *a* fire kit, not the structural template for the
others; it's itself open to rework.)

| God | Element | Identity |
|-----|---------|----------|
| **Cilia** | Fire | Offense, AOE damage. |
| **Boreas** | Ice | Defense, area control, freezing, slowing. |
| **Ikras** | Wind | Mobility, chaining attacks and skills. |
| **Bhumi** | Earth | Tanking, reflecting damage (thorns), healing. |

Co-op synergy (pillar 4) falls out of the contrast — e.g. Boreas freezes → Cilia shatters.

---

## Now — approved or next in line (1–3 items)

1. **Nightfall Sieges — unified cycle-threat + defined night waves** · `approved` 2026-06-06 · pillar: game feel (rhythm) + mastery
   - One-liner: the **fixed** day-night cycle *becomes* the difficulty clock — each night is a discrete siege with a fixed enemy roster scaled by night number; day is the lull. Replaces the unbounded night-rate faucet.
   - **★ THIS IS THE VERTICAL SLICE (Josh's call 2026-06-06).** The deliverable is a *tunable* spawn/difficulty curve to playtest the **current Cilia fire kit + warrior toolkit** against. No new content — no Boreas, no new enemy — until the slice feels good. Build the curve, then tune until the existing kit scales fairly. This is balance + playtest, not content.
   - Why now: live balance fire (night over-spawns at high threat). Foundational — **sequenced ahead of Boreas** (Josh's call 2026-06-06): frost's zoning/slow/freeze tunes directly against *how many* enemies arrive, so this must land first or Boreas gets re-tuned later.
   - The fix — three changes:
     1. **One clock:** kill the 90s threat timer; `wildThreatLevel` → **night counter** (`wildNight`), increments once at each nightfall. Stat scaling (`wildThreatMult`) reuses the same formula keyed off night #. Difficulty now steps up on a telegraphed beat, not invisibly.
     2. **Night = a fixed roster** from a wave table (starting numbers, tune live): goblins `10+5n`, archers `(n−1)·4` @n≥2, bombers `(n−2)·2` @n≥3, warriors `(n−4)·2` @n≥5, shaman `(n−6)` @n≥7, King `n%5`. (Josh's "30 gob / 20 arch" ≈ night 4–5.)
     3. **Day = lull:** gut day horde spawning → sparse ambient/patrol only. Calm makes the siege read as a siege.
   - **Night length: FIXED TIMER (option B — Josh's call 2026-06-06).** Difficulty ramps on a clock that never slows, so the player must out-scale it. The roster deploys *within* the fixed window: spawn cadence = `roster_total / night_duration`, throttled by the live-cap; unspawned remainder drops at dawn (reads as "held the line"). Intensity (enemies/sec) rises every cycle on top of per-cycle stat scaling → compounding pressure. NOT clear-to-dawn.
   - Scope — Core: roster table + budget spawner (replaces `_wildSpawnPool`/`wildWaveSize`/`wildSpawnInterval`/`wildCurrentCap`), threat→night-counter, day spawn gutted, HUD "NIGHT n · siege: X left." Stretch: fold boss-milestone timer (10min→king) into the roster's boss column · dawn recovery bonus · clear-streak escalation.
   - Touches: `wildThreatLevel`/`wildThreatTimer`/`WILD_THREAT_INTERVAL` (remove 90s tick ~11883), `gWildSpawnTick` + 4 spawn helpers, `gWildDayNightTick`/`_wildOnNightBegin`, boss milestones (optional), HUD threat label.
   - Size: multi-session; spine (table + budget spawner + one clock) is one solid first session. New art: none (HUD tweak only).
   - Balance: table above is the live-tune starting point; the depleting budget makes nights *testable* (a known count) for the first time. Day stat-scaling pace is slower than today (one step/cycle vs every 90s) — tune day length down if escalation feels slow.
   - **Slice success criteria (what "good" is — the playtest target):**
     - Each night reads as a discrete *siege* with a clear lull between (rhythm, not soup).
     - The current Cilia/warrior kit can **out-scale the early curve** with skilled play, and there's a **felt wall** somewhere mid-curve (a night where the kit *stops* keeping up) — that wall tells us where the next power lever (Boreas, an upgrade, a new enemy) is actually needed. We're hunting for it, not patching around it.
     - Spawn cadence never spikes into an unreadable wall; the live-cap keeps the screen fair.
     - Each imbued skill (swing / whirlwind / leap / dash) has at least one night-situation where it's the *right* answer (so the kit feels deep against the curve, not one-button).
   - **Tuning levers (engineer's dials for the playtest loop):** roster table counts per night · night duration / day duration · live spawn cap · `wildThreatMult` stat-scaling slope. Hold the Cilia kit's numbers fixed first — tune the *curve* to the kit, not the kit to the curve, so the slice tells us how the existing power scales.

2. **Boreas's Frost — control imbue kit (warrior)** · `held — behind slice` (was approved 2026-06-06) · pillar: build-craft depth + game feel
   - **HELD (Josh's call 2026-06-06):** not active work. Building a second god now contradicts the slice focus (scale the *current* kit first). Boreas is the prime candidate for the power lever the slice's "felt wall" will call for — unhold it once the slice playtests well and we know what the curve needs. Spec below is intact and ready.
   - One-liner: a four-skill Frost kit built on **defense / zoning / freeze**, mechanically
     distinct from fire (static fields, walls that block pathing, self-armor — not expanding DoT).
   - Why now: second god ~doubles build variety on warm registries; Frost plays the *most
     differently* from Fire (control vs DoT) and pre-pays the co-op synergy item (freeze→shatter).
   - The kit (each verb is control/defense, not damage-over-area):
     - **Swing — Rimebite:** hits apply **Chill** (slow) and each hit forms an orbiting ice shard
       → a stacking **frost shield** on the player. Offense feeds defense. *Hitbox:* normal arc,
       but the effect is inward (builds shield), not an outward crescent.
     - **Whirlwind — Frost Bulwark:** a **stationary** slowing field centered on the player that
       chills everything inside while channeling, and grants the player damage reduction.
       *Hitbox:* fixed-radius persistent zone that does NOT travel (vs fire's expanding rings).
     - **Leap — Permafrost:** impact raises a **ring of ice pillars** that *blocks enemy pathing*
       (a real barrier / zoning wall) and freezes enemies caught in the slam. *Hitbox:* closed
       collision ring (vs fire's two diagonal damage arms).
     - **Dash — Frost Step:** a defensive disengage — grants a brief **absorb shield**, freezes the
       first enemy passed through (get-off-me), and leaves a **slick of ice** that slows pursuers
       (slow, not damage). *Feel:* peel/escape, vs fire-dash's aggressive scorch.
     - **Heavy — Glacial Spike (frost pillars analog):** charged burst that **freezes solid** all
       enemies in the zone — the hard-CC lockdown.
   - **Shatter (the damage payoff):** Frozen enemies take bonus damage and **shatter** when struck
     (esp. by Heavy) — Boreas earns burst through setup (control → freeze → shatter), staying
     defensive in identity. Also the co-op hook: any ally's hit shatters your freeze.
   - Size: multi-session (one imbue per skill). New art: frost FX — ice shards/shield, slow field,
     ice-pillar wall, ice slick, shatter burst (new *shapes*, not recolors — that's the point).
   - Balance: Chill ~35–40% slow; freeze threshold ~3 stacks, ~0.75s solid; shatter ~1.5× a hit.
     Lower raw DPS than Fire — trades damage for control + survivability. Cap freeze duration +
     diminishing returns so lockdown never feels unfair.

---

## Next — proposed, sized, sequenced

> Everything here is **gated behind the vertical slice.** Sequence is determined by what the slice's playtest reveals: the "felt wall" tells us whether the next move is a new power lever (Boreas), an upgrade/progression layer, or roster variety. Don't pull from *Next* until the slice plays well.

1. **Co-op build synergy pass** · `proposed` · pillar: co-op that amplifies
   - One-liner: make two different gods' imbues *combine* on shared targets (e.g. one ignites, one detonates) so co-op is more than parallel play.
   - Why now: multiplayer exists and is delta-synced; the payoff is currently "two players, same game" rather than "two builds, one combo." **Boreas's Frost already seeds the marquee combo — freeze → ally shatter** — so this gets cheaper once it ships.
   - Size: multi-session. Depends on ≥2 gods having imbues (Cilia shipped + Boreas approved → unblocked once Boreas lands).

---

## Later — the idea pool (one big rock always visible)

- **🪨 BIG ROCK: a fifth god, or a new mode** — the horizon beyond the next patch. A fifth patron expands the build matrix; a new mode (e.g. endless dungeon, horde, or a meta-progression layer) opens a fresh loop. Keep exactly one of these visible as the long-horizon anchor.
- **Meta-progression between runs** — a reason to come back: unlocks, account-light persistence that fits the single-file vanilla-JS constraint.
- **Wilderness content depth** — events, named encounters, or objectives layered onto the seeded 600×300 world beyond villages/obelisks/shrines.
- **Audio/juice pass** — a dedicated game-feel sweep once a content arc lands (screen shake curve, hit-stop, layered SFX).
- **New enemy + boss variant (parked)** — a fast-flanker archetype that punishes tunnel-vision was proposed 2026-06-06; Josh deferred it ("not now — slice first"). Revisit if the slice's felt-wall is best answered by roster *variety* rather than a new power lever. Recipe documented (def → registry → exclusion list → sprite → palette).

---

_PM: keep this terse and current. Every `proposed` item carries pillar + one-liner + why-now + size + art cost. On developer approval, move to **Now** and flip to `approved`. On ship, delete and let the changelog carry the record._
