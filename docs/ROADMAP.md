# To Dust — Product Roadmap

**The PM↔engineering handoff medium.** The Product Manager maintains this doc per [`PRODUCT_MANIFESTO.md`](PRODUCT_MANIFESTO.md); the engineer pulls **approved** items from *Now* and builds them per [`ENGINEERING_CHARTER.md`](ENGINEERING_CHARTER.md).

**Status legend:** `proposed` (PM idea, not yet seen by developer) · `approved` (developer greenlit — engineer may build) · `in-progress` · `shipped` (move to changelog, delete here) · `held` / `cut`.

Keep the three horizons full. Re-rank after every release. State: **v0.2.0** shipped (Favor spine, live on Pages); Neutral Wolf Camps spine built (untagged). **The slice's first real playtest found the felt wall (Josh, 2026-06-09): the night curve is too flat and the card pool plateaus — NOT a missing god.** Four approved fixes now in *Now*: enemy-scaling overhaul + difficulty tell, imbue card paths, and two wolf fixes (traversal/tree-immunity bug + early-game lethality). Boreas stays held — the wall didn't call for it.

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
- **PM → ENG:** **Felt wall found → 4 approved fixes are now *Now* (ranked 1–4); build in that order.**
  First real slice playtest (Josh 2026-06-09): the night curve is too flat and the card pool plateaus —
  *not* a missing god. **(1) enemy-scaling overhaul + difficulty tell** and **(2) imbue card paths** are
  the two systemic wall-fixes (needed explicit approval — got it). **(3) wolf traversal/tree-immunity**
  (the stuck-on-rocks bug) and **(4) wolf early-game lethality** are pre-greenlit and OK'd to ride *ahead*
  of the big two to unblock wolf playtesting. Per-item grounding (touch points + current slopes) is in
  each *Now* entry.
- **PM → ARTIST:** **eye-glow difficulty tell** (part of item 1) — enemies' eyes glow **yellow at the mid
  threat tier → red at the top tier**, as an additive draw-layer overlay (no new sprites; a tint pass on
  the enemy render). Engineer sets the per-enemy threat-tier flag; Artist owns the exact glow look. Hand
  off once the scaling spine exposes the tier flag.
- **PM → ENG (release housekeeping):** Favor shipped as **v0.2.0**; Wolf Camps spine is still untagged in
  CHANGELOG `[Unreleased]`. Fold items 1–4 into that section and cut **v0.3.0** when they land (or tag
  wolf-camps alone first if it ships sooner). The Favor-coin art handoff (`fx.favor-coin` + HUD glyph for
  the placeholder `✦`, drawn procedurally in `gDrawFavorOrbs`) is still open with the Artist.

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

> **The slice is mechanically 100% built (curve + card progression + Favor + Wolf-Camp spine — see CHANGELOG).** Its first real playtest (Josh, 2026-06-09) **found the felt wall: the night curve is too flat and the card pool plateaus.** The four items below are the approved fixes — they tune/deepen the slice rather than add a new pillar. Boreas stayed held: the wall didn't call for a new god. **Build order = this ranking.** Hold the Cilia kit's *base* numbers fixed; tune the *curve and the card economy* around it.

1. **Enemy scaling overhaul + difficulty tell** · `approved` 2026-06-09 · pillar: game feel (readable threat) + mastery
   - One-liner: make the night curve actually *bite* — VS-style ramps on HP, damage, count, and composition as threat climbs, with enemies' **eyes glowing yellow (mid tier) → red (top tier)** as a free at-a-glance danger read.
   - Why now: **the felt wall.** Current slopes are too gentle — HP/dmg `×(1 + threat·0.25)`, speed `×0.08` (`wildThreatMult`/`wildSpeedMult` `~11977`), ambient `20 + threat·1.5` (`gWildAmbientTarget` `~12746`), horde `20 + 10/night` capped 60 (`_wildHordeSize` `~12656`). Late game is slightly tankier, not *more dangerous*. VS's lesson: pressure = **density + mix-shift + breakpoints**, not a smooth multiplier.
   - Player experience: Night 1 a readable trickle; mid-nights visibly denser, mixed (warriors/shamans/bombers weighted in), hitting harder, with **glowing eyes** telegraphing a hard night and juiced elites — the rising difficulty *reads* as fair instead of surprising.
   - Scope — **Core:** steeper, breakpointed scaling (HP/dmg/count slopes + a composition table shifting the spawn mix toward tougher types at `wildThreatLevel` thresholds) + the two-tier eye-glow overlay keyed to threat tier. **Stretch:** per-night modifier flavor (all-bomber night, etc.); a screen/audio cue when eyes go red.
   - Touches: `wildThreatMult`/`wildSpeedMult` (`~11977`), `_wildHordeSize` (`~12656`), `gWildAmbientTarget` (`~12746`), swarm-composition unlocks (`~12664`), `_wildScaleEnt` (`~2689`). Eye-glow = additive draw-layer overlay on the enemy render, **no new sprites** (a tint pass) — **Artist hand-off once a per-enemy threat-tier flag exists.**
   - Size: multi-session; scaling-curve spine ~1 session (numbers/table + a tier flag), eye-glow a follow-on.
   - Balance: **tune the slope, not the base** — push the curve until the felt wall moves later and reads fair. Levers: HP/dmg/count slopes · per-archetype threshold nights · glow-tier cutoffs. Watch density vs the live spawn cap (counts ramp *within* the cap; mix-shift carries the rest).

2. **Imbue card paths** · `approved` 2026-06-09 · pillar: build-craft depth
   - One-liner: give each imbued skill its **own card upgrade track** — cards that deepen the *imbue* (fire-trail duration on dash, fire-pillar count on heavy, fire-ring reach on whirlwind), so leveling expresses your build instead of repeating generic stat bumps.
   - Why now: **"leveling is boring"** = the pool tops out at flat stat cards, and the imbue system — the build-craft spine — is currently **binary** (imbued or not, no growth). Turning each imbue into a *path* multiplies meaningful choices and makes "forge a style" actually progress. This is the deeper-card-pool lever the slice predicted.
   - Player experience: after imbuing, the draft starts offering imbue-specific cards — *"Lingering Embers: +40% dash trail duration," "Eruption: +2 heavy fire-pillars," "Wildfire: whirlwind rings travel farther"* — you build toward an identity (trail-stacking zoner vs pillar-burst bruiser); level-ups sharpen the weapon.
   - Scope — **Core:** a new imbue-card category (gated on owning that imbue), 2–3 upgradeable params per imbued skill, written to a per-player imbue-mods map and threaded into the FX spawn sites. **Stretch:** a capstone card per skill — a qualitative change, not a number (the "step-level" moment).
   - Touches: card-draft pool + `_cardValue` (`~11828`), `skillMods`/`pSkillStat` plumbing (`~2425`) extended to imbue params; the four Cilia FX systems (`gFireTrails` `~3619`, `gFirePillars` `~5708`, `gFireRings`, `gFireCrosses`). Reuses the shipped rarity/Favor-upgrade economy.
   - Size: multi-session; spine ~1 session for 2 skills' paths, then fan out.
   - Balance: imbue cards enter the pool **only when that imbue is owned** (no early-draft dilution); magnitudes ride existing rarity tiers. **Cap each path** (like `SKILL_STAT_FLOOR`) so stacking can't tank FPS or trivialize.

3. **Wolf traversal + tree-immunity** · `approved` 2026-06-09 (pre-greenlit bug fix) · pillar: game feel
   - One-liner: wolves get **stuck on their own crescent rock dens** — give them a traversal exception (hop/jump over rock & tree obstacles to reach the player) **and** make them **immune to tree-slow** ("native species, unhindered by the land"), which also makes them feel fast and inevitable like a flanker should.
   - Touches: `_aiWolf` collision + the `gTreeSlow` call (`~4766`); a wolf-specific obstacle exception (vs `gRC`/`gRCDestructibles`). Bug + feel in one. Size: session. No new art.

4. **Wolf early-game lethality** · `approved` 2026-06-09 (pre-greenlit balance) · pillar: mastery
   - One-liner: wolves are too soft turn-one — bump Direwolf/Alpha base HP + bite damage so an early camp is a genuine **risk/reward gamble**, not free Favor. Pairs with item 1's eye-glow (an elite Alpha reads as red).
   - Touches: `EntityDefs.direwolf`/`.alphawolf` (`~2658`/`~2678`). Pure number tune. Size: session. No new art.

5. **Boreas's Frost — control imbue kit (warrior)** · `held — behind slice` (was approved 2026-06-06) · pillar: build-craft depth + game feel
   - **HELD (Josh's call 2026-06-06; reaffirmed 2026-06-09):** not active work. The slice's first playtest located the felt wall as **flat scaling + plateauing cards, not a missing god** — so the wall is being fixed in-system (items 1–4), *not* with Boreas. Boreas is now a **build-variety / co-op** play (second god ~doubles the build matrix; seeds freeze→shatter), to unhold once the curve + card depth feel right and we want breadth. Spec below is intact and ready.
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
