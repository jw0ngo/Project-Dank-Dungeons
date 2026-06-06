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

1. **Vertical slice — the current kit vs. the difficulty curve** · `in-progress` · pillar: game feel (rhythm) + mastery
   - **The slice goal (Josh's call 2026-06-06):** prove the **current Cilia fire kit + warrior toolkit** scales fairly against rising difficulty. No new content (no Boreas, no new enemy) until it feels good. The slice has **two halves** — the difficulty *curve* (Nightfall, shipped) and the *progression* that scales the kit against it (card-draft, building now).
   - **Half A — Nightfall Sieges · `SHIPPED` 2026-06-06.** The day/night cycle is now the difficulty clock: `wildNight` counter, fixed 60s siege window, roster-table budget spawner (`_wildBuildSiegeQueue` / `_wildSiegeRoster`), gutted day spawns → lull, `NIGHT n · siege: X left` HUD. Replaced the 90s threat faucet. **Mechanics done — roster counts / night length / live cap remain live-tune levers for the playtest.**
   - **Half B — Card-Draft Level-Up rework · `approved` (ACTIVE BUILD).** Full spec at *Now #2* ▼ — replaces STR/DEX/INT with a 3-card draft; this is the progression that makes the kit's scaling *tunable*.
   - **Slice success criteria (the playtest target, spanning both halves):**
     - Each night reads as a discrete *siege* with a clear lull between (rhythm, not soup). ✓ *mechanics shipped — now tune.*
     - The kit can **out-scale the early curve** with skilled play, with a **felt wall** mid-curve where it stops keeping up — that wall tells us where the next power lever (Boreas / deeper card pool / a new enemy) is actually needed. Hunting for it, not patching around it.
     - Spawn cadence never spikes into an unreadable wall; the live-cap keeps the screen fair.
     - Each imbued skill (swing / whirlwind / leap / dash) has ≥1 night-situation where it's the *right* answer (kit feels deep, not one-button).
   - **Tuning levers (the playtest dials):** roster counts/night · night & day duration · live spawn cap · stat-scaling slope · **card rarity-odds + magnitudes (Half B)**. Hold the Cilia kit's *base* numbers fixed — tune the *curve and the card economy* around it, so the slice tells us how the existing power scales.

2. **Card-Draft Level-Up rework — replaces STR/DEX/INT** · `approved` 2026-06-06 · pillar: mastery + build-craft depth + game feel
   - **Full build spec: [`specs/card-draft.md`](specs/card-draft.md).** Summary below; engineer builds from the spec.
   - One-liner: every level-up draws **3 random cards, pick 1** — improve a **passive stat**, the warrior's **passive skill (Grit)**, or an **active skill** — each rolled **Normal / Rare / Epic / Legendary** (×1.0 / ×1.7 / ×2.6 / ×4.0 magnitude). STR/DEX/INT removed entirely.
   - Why now: the slice asks "does the kit scale fairly?" — *delivered by the progression system*. STR/DEX/INT is a pre-solvable allocation screen with no drama; a rarity draft is the genre-correct roguelite loop and **the other half of the slice** (Half B above).
   - Balance spine: **randomize *which* card + *what tier*, never unbounded magnitude**; **rarity odds shift up by night/level** (the lever that keeps power tracking the siege curve); guaranteed-useful draws (≥1 active + ≥1 passive); reroll (anti-brick); per-skill caps + diminishing returns.
   - **⚠️ Landmine:** active-skill upgrades mutate `WeaponRegistry.sword` **globally** (~11670) → leaks across runs + buffs all players in MP. Route all card effects through **per-run/per-player state**.
   - **Open call resolved (Josh):** cards own skill *power upgrades*; unlocks stay level-gates; the MOBA `skillPoints` currency retires.
   - Size: multi-session; spine ~1 session (overlay + data model already exist). New art: none for Core. Core = rarities + draft + three pools + per-run state + reroll + STR/DEX/INT removal; transformative cards + odds-by-night = stretch.

3. **Boreas's Frost — control imbue kit (warrior)** · `held — behind slice` (was approved 2026-06-06) · pillar: build-craft depth + game feel
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

> Everything here is **gated behind the vertical slice.** With Nightfall shipped and the card-draft progression now in *Now*, the slice's "felt wall" will tell us whether the next move is a new power lever (Boreas), deeper card content, or roster variety. Don't pull from *Next* until the slice plays well.

1. **Co-op build synergy pass** · `proposed` · pillar: co-op that amplifies
   - One-liner: make two different gods' imbues *combine* on shared targets (e.g. one ignites, one detonates) so co-op is more than parallel play.
   - Why now: multiplayer exists and is delta-synced; the payoff is currently "two players, same game" rather than "two builds, one combo." **Boreas's Frost already seeds the marquee combo — freeze → ally shatter** — so this gets cheaper once it ships.
   - Size: multi-session. Depends on ≥2 gods having imbues (Cilia shipped + Boreas approved → unblocked once Boreas lands).

---

## Later — the idea pool (one big rock always visible)

- **🪨 BIG ROCK: the "Reclaim-the-Shrine" run loop** — the horizon structure the game is building toward (full design in [`WORLDBUILDING_CONCEPTS.md`](WORLDBUILDING_CONCEPTS.md)). A run = an incursion into a procedural **area** (first: the Goblin Forest) with **one usurped shrine**: fight to it and **reactivate it** (opening conquest; Goblin King as the usurper), then it's your **hearth** — return by day to imbue/deepen via **banked imbue charges** (pull, not a forced gate), survive sieges by night, with **random map events** keeping each return-trip fresh. Ties together Nightfall (shipped), the card-draft, and the Favor-gradient imbue system. **Depends on:** card-draft landing + ≥2 imbued gods (Boreas) + Favor design — so it's post-slice. Open forks live in the worldbuilding doc (one-vs-many areas; siege-threatens-shrine fusion).
- **A fifth god, or a new mode** — still a horizon expander (a fifth patron grows the build matrix; an endless/horde mode opens a fresh loop), but secondary to the run loop above as the anchor.
- **Meta-progression between runs** — a reason to come back: unlocks, account-light persistence that fits the single-file vanilla-JS constraint. (The "journey through areas / wider world" could live here.)
- **Day-lull content (slice-adjacent slice of the big rock)** — repopulating goblin camps + a few random events so Nightfall's day-lull isn't dead air. The smallest first taste of the run loop; could come sooner than the rest.
- **Audio/juice pass** — a dedicated game-feel sweep once a content arc lands (screen shake curve, hit-stop, layered SFX).
- **New enemy + boss variant (parked)** — a fast-flanker archetype that punishes tunnel-vision was proposed 2026-06-06; Josh deferred it ("not now — slice first"). Revisit if the slice's felt-wall is best answered by roster *variety* rather than a new power lever. Recipe documented (def → registry → exclusion list → sprite → palette).

---

_PM: keep this terse and current. Every `proposed` item carries pillar + one-liner + why-now + size + art cost. On developer approval, move to **Now** and flip to `approved`. On ship, delete and let the changelog carry the record._
