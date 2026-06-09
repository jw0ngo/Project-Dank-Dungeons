# To Dust — Product Roadmap

**The PM↔engineering handoff medium.** The Product Manager maintains this doc per [`PRODUCT_MANIFESTO.md`](PRODUCT_MANIFESTO.md); the engineer pulls **approved** items from *Now* and builds them per [`ENGINEERING_CHARTER.md`](ENGINEERING_CHARTER.md).

**Status legend:** `proposed` (PM idea, not yet seen by developer) · `approved` (developer greenlit — engineer may build) · `in-progress` · `shipped` (move to changelog, delete here) · `held` / `cut`.

Keep the three horizons full. Re-rank after every release. State: **v0.1.0** (To Dust rename + studio layer) — the **full card progression** (Card-Draft + Card Pool Expansion + Crit), weighty heavy attack, enemy/player attack sprites, and the **day-farm-zone + VS-night-horde spawn overhaul** (replaced Nightfall Sieges). **Engineer is building Favor now; Neutral Wolf Camps is the approved *final* mechanical-slice feature, queued right after it.**

---

## ⇄ Orchestration — how PM & engineering stay in sync

**The repo is the shared brain.** Both agents reset context between sessions, so cross-role
awareness lives *here*, not in memory. Topology = **one shared working tree** → the live state is
the tree itself; commits/push matter for the pm-bot + Pages deploy. Three layers, one home each:

- **Plan / queue → this file.** Every *Now* item carries a live status. **Flip it the moment you
  act**, in the *same commit* as the work: PM sets `approved`; engineer sets `in-progress` **when
  starting** (not just when done), then `shipped` on push. (Starting-on-flip is what stops the
  "PM proposes a thing already built" drift.)
- **Pulse / what just happened → git.** `git status` (uncommitted in-flight) + `git log --oneline`
  (prefix commits `pm:` / `eng:` / `docs:`) + CHANGELOG `[Unreleased]` for detail.
- **Handoff / waiting-on-whom → the ⇄ Handoffs queue below.** Either role appends a one-liner.

**Session-open ritual (both roles, ~30s):** `git status` + `git log --oneline -15` → read *Now* +
⇄ Handoffs → then act. **Enforcement:** `tools/doc-drift-check.ps1` (Stop hook) also watches this
file, so an untracked board nudges on session close.

### ⇄ Handoffs (append a line; delete when cleared)
- **PM → ENG:** **Neutral Wolf Camps** (`specs/neutral-camps.md`) is **approved** (Josh 2026-06-09) and
  queued as the **final mechanical-slice feature — build right after Favor.** 40 fixed, spaced crescent
  rock outcrops, each a neutral wolf pack (1 Alpha + 2–4 Direwolves) guarding a chest; pack ignores you
  until hit, hard-leashes to camp, **respawns every 3 min** → farm route. Reuses the obelisk placement
  pattern, the `homeWx/Wy` leash, the chest entity; new `isNeutral` flag + `_aiWolf`. Chest is the
  marquee **Favor** source — coordinate the chest payout with the Favor build. Spine first:
  place camps + carve crescents → wolves spawn/killable → chest-on-clear → 3-min respawn.
- **PM → ARTIST:** wolf sprites (`art/enemy alpha wolf.png`, `art/enemy dire wolf.png`) handed off for
  prep → `char.alphawolf.*` / `char.direwolf.*`, sized consistent with the goblin family. *(Artist
  dispatched this session.)*
- **PM ← ENG:** **Favor spine BUILT** (2026-06-09, uncommitted) — currency + enemy/chest drops + gold-coin
  pickups + HUD `✦` counter + both card-screen spends (Favor reroll 3/5/8 + per-card rarity-upgrade
  4/8/16, gated behind first-patron) + Sim hooks. Syntax-checked (no node here → delimiter-balance vs
  HEAD); **needs Josh's browser playtest** (`python dev.py`) before commit/push + release. Then flip SHIPPED.
- **ENG → ARTIST:** **Favor coin** art needed — a small gold-coin sprite for the pickup + a HUD glyph
  to replace the placeholder `✦`. Currently drawn procedurally (gold disc w/ rim in `gDrawFavorOrbs`).
  Wire under `fx.favor-coin` (or similar) when ready; the draw hook + HUD `#g-favor` are in place.

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
   - **Half A — the difficulty curve · `SHIPPED` (overhauled 2026-06-09).** The day/night cycle is the difficulty clock. *Originally* Nightfall Sieges (fixed roster budget spawner); **since replaced by the day-farm-zone + VS-night-horde model:** **day** = a populated MMO-style farming zone (`gWildPatrolTick` maintains a density of stationary goblin camps you roam to find + chain-pull); **night** = a Vampire-Survivors horde + constant threat-weighted stream that chases until dawn, plus restored fixed Goblin-King milestones (10/20/30 min). Per-night `wildThreatLevel` step + swarm-composition unlocks. **Mechanics done — densities / horde size / stream rate / live cap remain live-tune levers. (Neutral Wolf Camps, item 3, completes Half A's *day* content.)**
   - **Half B — Card progression · `SHIPPED` 2026-06-09 (fully built).** Card-Draft rework (3-card rarity draft replacing STR/DEX/INT; passive / active-skill / Grit pools; per-player `skillMods`; reroll; odds-by-night) **+ Card Pool Expansion** (swing/heavy/dash upgrade cards so the whole kit scales; **Crit** chance/damage with gold crit numbers + char-screen rows; HP-regen nerf). The progression that scales the kit against the curve is now complete. *(Detail: CHANGELOG `[Unreleased]`; specs `card-draft.md` + `card-pool-expansion.md`.)*
   - **→ The slice is now 100% built; the only remaining work is PLAYTEST/TUNE — this is the gate.** Nothing new (Boreas / Favor's deeper layers / roster variety) commits until the slice plays well and the **felt wall** is found.
   - **Slice success criteria (the playtest target, spanning both halves):**
     - Each night reads as a discrete *siege* with a clear lull between (rhythm, not soup). ✓ *mechanics shipped — now tune.*
     - The kit can **out-scale the early curve** with skilled play, with a **felt wall** mid-curve where it stops keeping up — that wall tells us where the next power lever (Boreas / deeper card pool / a new enemy) is actually needed. Hunting for it, not patching around it.
     - Spawn cadence never spikes into an unreadable wall; the live-cap keeps the screen fair.
     - Each imbued skill (swing / whirlwind / leap / dash) has ≥1 night-situation where it's the *right* answer (kit feels deep, not one-button).
   - **Tuning levers (the playtest dials):** roster counts/night · night & day duration · live spawn cap · stat-scaling slope · **card rarity-odds + magnitudes (Half B)**. Hold the Cilia kit's *base* numbers fixed — tune the *curve and the card economy* around it, so the slice tells us how the existing power scales.

2. **Favor — the world currency** · `in-progress` (eng, 2026-06-09 — spine build) · pillar: build-craft depth + game feel + mastery
   - **Full spec: [`specs/favor.md`](specs/favor.md).** **Supersedes `favor-imbue.md`** — Favor is no longer "the price of a new patron"; it's now the **card-economy currency.** Fast-follow to Card Pool Expansion (layers on the same rarity/card-screen code).
   - One-liner: **Favor = the gold-coin currency of the world** — rare drops from enemies (scaled by type) + from **chests** (existing village chests, `~12917`). After committing to a **patron at level 5**, spend Favor on the card screen to **reroll** the draw and **upgrade a card's rarity** (Common→…→Legendary).
   - Why this pivot (Josh): the old breadth-pricing only *matters* once Boreas ships, so it can't be felt in the slice. Tying Favor to reroll + rarity-upgrade makes it a real, **slice-testable lever now with only Cilia**, plugged straight into the shipped rarity system. Rarity-upgrade is the *active* twin of odds-by-night (the passive curve dial).
   - Grounds on existing systems: `gXPOrbs` (drop pattern) · village chests (`~11328`/`~12917`) · the free-charge reroll (`gWildReroll` `~11962`, now Favor-priced — retires the `p.rerolls` grant) · `_cardValue` (`~11828`, for the rarity bump).
   - **Open calls (in spec):** run-scoped vs persistent (recommend run-scoped, wallet built to extend) · how breadth is gated post-pivot (decouple from Favor, park) · future sink = the dormant `gEquipment` shop.
   - Size: multi-session; spine ~1 session (currency var + XP-orb-clone drop + chest hook + HUD + two card-screen spends — all on existing systems). New art: a Favor coin sprite + HUD glyph.

3. **Neutral Wolf Camps — jungle creep camps** · `approved` 2026-06-09 (Josh) · **build after Favor — the final mechanical-slice feature** · pillar: game feel + mastery + (economy feeds build-craft)
   - **Full spec: [`specs/neutral-camps.md`](specs/neutral-camps.md).** One-liner: **40 fixed, well-spaced crescent rock outcrops**, each a **neutral wolf pack guarding a chest** — the pack ignores you until attacked, hard-leashes to its camp, and **respawns every 3 minutes**, so clearing camps becomes a **farm route** across the map between sieges.
   - **Why it's the last slice feature (Josh):** gives the *day* loop a map of fixed, repeatable objectives (route, don't just kite) and the **reliable Favor income** the economy needs; the wolves also deliver a **second enemy *feel*** — fast, lunging pack-flankers vs. the goblins' slow telegraphed grind (realises the parked fast-flanker idea). With this in, **the slice is mechanically complete → pure playtest/tune.**
   - The pack: **1 Alpha Wolf** (elite leader, guards the chest) + **2–4 Direwolves** (fast flank-and-lunge grunts). Both from the sprites Josh added (`art/enemy alpha wolf.png` / `art/enemy dire wolf.png` → Artist prepping). Weighty-combat: the lunge-bite is the wolf's committed, telegraphed, punishable move.
   - **The one new behavior — neutrality:** unlike goblin *ambient* camps (aggro on proximity), wolf camps are **neutral** (aggro only when hit; whole pack wakes together; hard leash + full-heal on disengage). Engaging is a *choice* — that choice is the feature.
   - Grounds on existing systems: obelisk placement pattern (`~11463`, rejection-sample w/ min-sep) · the `homeWx/Wy` leash branch (`~4613`) · the chest entity + proximity loot (`~11377`/`~12994`) · the rock tile layer for the crescent (no new tile art). New: `gWildCamps[]`, an `isNeutral` flag, `_aiWolf`, a per-camp 3-min respawn tick **inside `gSimUpdate`**, and the **full new-enemy recipe ×2** (def w/ `hp` → registry → **goblin-AI exclusion list** → sprite → palette).
   - Size: **multi-session**; spine ~1 session (place camps + carve crescents → wolves spawn/killable → chest-on-clear → 3-min respawn). New art: the two wolf sprites (source PNGs added; Artist prep). Open calls (recommendations inline in spec): chest gated-on-clear · Alpha-as-elite (art may override) · flat vs threat-scaled pack · crescent opening dir.

4. **Boreas's Frost — control imbue kit (warrior)** · `held — behind slice` (was approved 2026-06-06) · pillar: build-craft depth + game feel
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

- **🪨 BIG ROCK: the "Reclaim-the-Shrine" run loop** — the horizon structure the game is building toward (full design in [`WORLDBUILDING_CONCEPTS.md`](WORLDBUILDING_CONCEPTS.md)). A run = an incursion into a procedural **area** (first: the Goblin Forest) with **one usurped shrine**: fight to it and **reactivate it** (opening conquest; Goblin King as the usurper), then it's your **hearth** — return by day to imbue/deepen via **banked imbue charges** (pull, not a forced gate), survive sieges by night, with **random map events** keeping each return-trip fresh. Ties together Nightfall (shipped), the card-draft, and the Favor economy ([`specs/favor.md`](specs/favor.md)). **Depends on:** card-draft landing + ≥2 imbued gods (Boreas) + Favor — so it's post-slice. *(Note: Favor pivoted away from pricing multi-god breadth → the run-loop's "banked imbue charges" / how breadth is gated is now an open call, decoupled from Favor.)* Open forks live in the worldbuilding doc (one-vs-many areas; siege-threatens-shrine fusion).
- **A fifth god, or a new mode** — still a horizon expander (a fifth patron grows the build matrix; an endless/horde mode opens a fresh loop), but secondary to the run loop above as the anchor.
- **Meta-progression between runs** — a reason to come back: unlocks, account-light persistence that fits the single-file vanilla-JS constraint. (The "journey through areas / wider world" could live here.)
- **Day-lull content (slice-adjacent slice of the big rock)** — repopulating goblin camps + a few random events so Nightfall's day-lull isn't dead air. The smallest first taste of the run loop; could come sooner than the rest.
- **Audio/juice pass** — a dedicated game-feel sweep once a content arc lands (screen shake curve, hit-stop, layered SFX).
- **New enemy + boss variant (parked)** — the parked fast-flanker archetype is now being **realised as the wolves** in Neutral Wolf Camps (*Now* item 3). What remains parked here is a *boss variant* (e.g. a dire-alpha world boss / a goblin elite) — revisit if the slice's felt-wall wants roster *variety* beyond the wolves. Recipe documented (def → registry → exclusion list → sprite → palette).

---

_PM: keep this terse and current. Every `proposed` item carries pillar + one-liner + why-now + size + art cost. On developer approval, move to **Now** and flip to `approved`. On ship, delete and let the changelog carry the record._
