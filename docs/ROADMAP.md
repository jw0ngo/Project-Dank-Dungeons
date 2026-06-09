# To Dust — Product Roadmap

*The single source of truth for **what we're building next and why.** Plain-English at the top of each
item for a quick read; a collapsible **🔧 Build notes** block on each carries the technical detail
engineering needs. The Product Manager owns this doc ([`PRODUCT_MANIFESTO.md`](PRODUCT_MANIFESTO.md));
engineering builds **approved** items from *Now*, top-down ([`ENGINEERING_CHARTER.md`](ENGINEERING_CHARTER.md)).*

---

## 📍 Where we are (June 9, 2026)

**v0.2.0 is live** (the Favor currency). The "vertical slice" — our test of whether the core combat
scales fairly against a rising difficulty curve — is **fully built**, and we just ran its first real
playtest. It told us exactly what we hoped a playtest would:

> **The two weak points are (1) the difficulty curve is too flat — late game isn't dangerous enough, and
> (2) leveling up gets boring because the upgrades are repetitive.** Notably, the game did *not* need a
> whole new god to fix this — both problems are fixable inside the systems we already have.

The five items below are the plan. The first four are approved and ranked in build order; the fifth (a
second god) stays parked because the playtest proved we don't need it yet.

## ⚡ At a glance

| # | What we're building | Status | Size | Why it matters |
|---|---|---|---|---|
| **1** | **Make late-game dangerous** — enemies scale harder + glow yellow→red as they get deadly | ✅ Approved | Multi-session | Fixes the flat difficulty curve (playtest weak point #1) |
| **2** | **Imbue Paths** — turn each fire skill into a 10-level mastery tree with branching upgrades | ✅ Approved — cleared for build | Large, phased | Fixes boring level-ups; the heart of "build your own playstyle" (#2) |
| **3** | **Wolves stop getting stuck** on their dens + ignore forest slow | ✅ Approved | Quick | Bug fix — unblocks wolf playtesting |
| **4** | **Wolves hit harder early** | ✅ Approved | Quick | Makes a wolf camp a real risk, not free loot |
| **5** | **Boreas** — a second god (ice/control) | ⏸️ Held | Multi-session | Parked — the playtest showed we don't need it yet |

---

## Now — what engineering builds next (in this order)

### 1. Make late-game dangerous — enemy scaling + a visible danger tell

`✅ approved` (2026-06-09) · **Size:** multi-session · **Pillars:** game feel, mastery · **Art:** glowing eyes (no new sprites)

**What:** Enemies barely get tougher as the nights pass right now. We'll make the difficulty genuinely
ramp the way *Vampire Survivors* does — more enemies, deadlier mixes, and more damage as the run goes on —
and let players *see* danger coming: **enemy eyes glow yellow at medium difficulty and red at the
hardest.**

**Why:** This is the #1 playtest finding. A flat curve means the late game feels the same as the early
game instead of escalating into a real threat — so the whole "can the player out-scale the curve?" test is
unfalsifiable until the curve actually climbs.

**Player experience:** Night 1 is a readable trickle of goblins. Later nights are visibly denser and
mixed (tougher enemy types weighted in), hit harder, and the glowing eyes telegraph a dangerous night and
juiced-up elites — hard, but fair and readable.

<details>
<summary>🔧 Build notes (engineering)</summary>

- **The current slopes are too gentle:** HP/dmg `×(1 + threat·0.25)`, speed `×0.08`
  (`wildThreatMult`/`wildSpeedMult`, `~11977`); ambient count `20 + threat·1.5` (`gWildAmbientTarget`,
  `~12746`); horde `20 + 10/night` capped 60 (`_wildHordeSize`, `~12656`).
- **Core:** steeper, *breakpointed* scaling — HP/dmg/count slopes **plus a composition table** that shifts
  the spawn mix toward tougher types (warrior/shaman/bomber) at `wildThreatLevel` thresholds (the VS
  lesson: pressure comes from density + mix-shift + breakpoints, not a smooth multiplier). Add a per-enemy
  **threat-tier flag** driving a two-tier additive **eye-glow overlay** on the enemy render.
- **Touches:** `wildThreatMult`/`wildSpeedMult` (`~11977`), `_wildHordeSize` (`~12656`),
  `gWildAmbientTarget` (`~12746`), swarm-composition unlocks (`~12664`), `_wildScaleEnt` (`~2689`).
- **Stretch:** per-night modifier flavor (e.g. an all-bomber night); a screen/audio cue when eyes go red.
- **Art hand-off:** eye-glow is a tint pass, **no new sprites** — Artist owns the look once the
  threat-tier flag exists.
- **Balance — tune the slope, not the base:** hold the Cilia kit's numbers fixed; push the curve until the
  "felt wall" moves later and reads as fair. Levers: HP/dmg/count slopes · per-archetype threshold nights ·
  glow-tier cutoffs. Counts must ramp *within* the live spawn cap (perf) — mix-shift carries the rest.
</details>

---

### 2. Imbue Paths — turn each fire skill into a mastery tree

`✅ approved` (2026-06-09) — **all design calls resolved; cleared for Phase 1 build** · **Size:** large, phased · **Pillars:** build-craft depth, game feel, mastery
**Full design:** [`specs/imbue-paths.md`](specs/imbue-paths.md)

**What:** Today, a fire-imbued skill is either on or off — there's nowhere to grow it, so level-ups become
repetitive stat bumps. We'll turn **each imbued skill into a named ability you level up 10 times**, with
two branch points where you choose how it evolves:

- **Level 5 — pick 1 of 2 "Forms"** that change *how the skill plays* (e.g. a long-range version vs. a
  close-quarters version).
- **Level 10 — pick 1 of 2 "Chaos" upgrades** — the peak of the skill, where it grows more powerful but
  also more wild and harder to fully control.

**Example — "Dance of Fire" (the normal attack):** at level 5 you choose **Emberlance** (fires a spread of
fireballs at long range — for spacing and kiting) *or* **Cinder Ring** (erupts a ring of flame around you —
for wading into a crowd). At level 10 each Form forks again into two dread "Chaos" endpoints — e.g.
Emberlance → **Wake of Ruin** (fireballs leave trails of fire across the battlefield) or **Cinderplague**
(they burst into spreading embers); Cinder Ring → **Halo of Damnation** (a ring of burning ground that
follows you) or **Unending Maelstrom** (the ring keeps re-erupting on its own). Four endpoints per skill.

**Why:** This is the #2 playtest finding and the core of our "build your own playstyle" promise. It turns
every level-up into a meaningful choice and makes two players' builds genuinely different.

**The story hook (now canon — logged in the Creative Manifesto, 2026-06-09):** *the gods are waning and
resort to "perceived higher powers" — chaos and order, light and dark — to preserve themselves; called
upon enough, those forces become the gods of the next age.* The game is set in **the turning of the age**.
The level-10 "Chaos Ascension" is that made playable — channeling a blessing to its peak routes it through
these raw forces, so it corrupts (fire spills onto the ground you stand on, effects spread past your aim).
This is what *"To Dust"* means: **the old gods crumble to dust, and new powers are born from it.**

<details>
<summary>🔧 Build notes (engineering)</summary>

- **The 10-rank tree per skill:** ranks 1–4 numeric upgrades → **rank 5 Form fork (1 of 2)** → ranks 6–9
  numeric → **rank 10 Chaos fork (1 of 2)**. Binary tree → 4 endpoints per skill; any run walks one path.
- **State:** a new per-player imbue-path map (rank + chosen Form + chosen Chaos per skill), parallel to
  `skillMods`/`gritMods` (`~2425`). Numeric ranks write magnitudes the FX spawn sites read.
- **Draft integration:** ranks 1–4 / 6–9 are ordinary draft cards (reuse `_cardValue` rarity/Favor
  economy, `~11828`); **ranks 5 & 10 are special 2-option "evolution" events** — model on the existing
  imbue overlay (`#g-imbue-overlay`) or a flagged draft pair. Gated on owning that imbue.
- **FX touched:** `gFireWaves`, `gFireTrails` (`~3619`), `gFirePillars` (`~5708`), `gFireRings`,
  `gFireCrosses`. The Chaos tier leans hard on the existing `burning-ground`/`gFireTrails` hazard.
- **AI-native:** the two evolution events pause the game → each needs a `gSim*` hook (mirror
  `gSimDraft.pick`) + new `Sim.observe()` fields (per-skill rank, pending evolution), or headless runs stall.
- **Phasing (so a large feature ships in slices):** **Phase 1 = the tree system + "Dance of Fire" fully
  built** (one skill, both Forms, all Chaos leaves — de-risks the whole system) → **Phases 2–5 = fan out**
  one skill per slot (Pyre Waltz · Sunfall · Trail of Embers · Eruption) on the proven framework.
- **Balance:** Forms are **sidegrades** (playstyle, not strictly stronger); Chaos is **power + cost** (the
  uncontrolled element is the balancing lever — if a Chaos leaf is strictly better than its Form, it's
  under-chaosed). Cap every numeric rank; forks are irreversible per run (builds are commitment).
- **✅ All design calls resolved (Josh, 2026-06-09):** binary tree (4 endpoints/skill); names approved with
  the standing rule that **all level-10 Chaos names evoke dread/chaos/sinisterness**; lore logged as canon.
  **Cleared for Phase 1 hand-off.**
</details>

---

### 3. Wolves stop getting stuck

`✅ approved` (2026-06-09, pre-greenlit bug fix) · **Size:** quick · **Pillar:** game feel · **Art:** none

**What:** Wolves are currently getting trapped on the rocky dens they spawn in. We'll let them climb over
obstacles to reach the player, and make them **unhindered by the forest** (no slowdown in trees) — they're
native to the land, so it should feel like nothing stops them.

**Why:** It's a visible bug, and the fix doubles as good feel — wolves that flow over terrain feel fast and
inevitable, exactly like the pack-flanker they're meant to be. Fixing this unblocks proper wolf playtesting.

<details>
<summary>🔧 Build notes (engineering)</summary>

- `_aiWolf` collision + the `gTreeSlow` call (`~4766`); add a wolf-specific obstacle exception (a hop/jump
  over rock & tree vs. `gRC`/`gRCDestructibles`) and skip tree-slow entirely for wolves.
</details>

---

### 4. Wolves hit harder early

`✅ approved` (2026-06-09, pre-greenlit balance) · **Size:** quick · **Pillar:** mastery · **Art:** none

**What:** Wolves are too soft at the start of a run, so a wolf camp is free loot instead of a real fight.
Bump their early-game health and bite damage so clearing a camp is a genuine **risk-vs-reward gamble.**

**Why:** Wolf camps are meant to be a meaningful choice — "do I risk this pack for the Favor?" That choice
doesn't exist if the wolves can't threaten you. Pairs naturally with item 1's glowing eyes (a tough Alpha
reads as red).

<details>
<summary>🔧 Build notes (engineering)</summary>

- Pure number tune: `EntityDefs.direwolf` / `.alphawolf` base HP + bite damage (`~2658` / `~2678`).
</details>

---

### 5. Boreas — a second god (held)

`⏸️ held` (Josh's call 2026-06-06, reaffirmed 2026-06-09) · **Size:** multi-session · **Pillars:** build-craft depth, game feel

**What (parked):** A second patron god — Boreas, ice/control — with a full four-skill kit built around
defense, freezing, and zoning, playing completely differently from Cilia's fire.

**Why it's parked:** The playtest proved the current problems are flat scaling + shallow leveling, **not a
missing god** — so we're fixing those in-system (items 1–4) instead. Boreas becomes a *build-variety and
co-op* play (a second god roughly doubles the build matrix and seeds the marquee co-op combo: one player
freezes, another shatters) to unhold once the curve and leveling feel right and we want more breadth. The
full design below is intact and ready to pick up.

<details>
<summary>🔧 Design notes (full Frost kit — ready when unheld)</summary>

A four-skill Frost kit built on **defense / zoning / freeze**, mechanically distinct from fire (static
fields, walls that block pathing, self-armor — not expanding damage-over-time):

- **Swing — Rimebite:** hits apply **Chill** (slow); each hit forms an orbiting ice shard → a stacking
  **frost shield** on the player. Offense feeds defense.
- **Whirlwind — Frost Bulwark:** a **stationary** slowing field centered on the player that chills
  everything inside while channeling, and grants the player damage reduction.
- **Leap — Permafrost:** impact raises a **ring of ice pillars** that *blocks enemy pathing* and freezes
  enemies caught in the slam.
- **Dash — Frost Step:** a defensive disengage — a brief **absorb shield**, freezes the first enemy passed
  through, and leaves a **slick of ice** that slows pursuers.
- **Heavy — Glacial Spike:** charged burst that **freezes solid** all enemies in the zone (hard CC).
- **Shatter (the payoff):** frozen enemies take bonus damage and **shatter** when struck (esp. by Heavy) —
  Boreas earns burst through setup, not raw DPS. Also the co-op hook: any ally's hit shatters your freeze.

**Size:** multi-session (one imbue per skill). **New art:** frost FX — ice shards/shield, slow field,
ice-pillar wall, ice slick, shatter burst (new *shapes*, not recolors). **Balance:** Chill ~35–40% slow;
freeze ~3 stacks → ~0.75s solid; shatter ~1.5× a hit; lower raw DPS than Fire (trades damage for control +
survivability); cap freeze duration + diminishing returns so lockdown never feels unfair.
</details>

---

## Next — likely, once the slice plays well

### Co-op build synergy pass

`proposed` · **Size:** multi-session · **Pillar:** co-op that amplifies

**What:** Make two different gods' powers *combine* on the same enemy — e.g. one player ignites, another
detonates — so co-op is more than two people playing the same game side by side.

**Why:** Multiplayer already works and stays in sync, but the payoff today is "two players, same game"
rather than "two builds, one combo." Boreas's freeze→shatter already seeds the marquee combo, so this gets
cheaper once Boreas ships. **Needs ≥2 gods with imbues** — unblocked once Boreas lands.

---

## Later — the idea pool (one big rock always visible)

- **🪨 BIG ROCK — the "Reclaim-the-Shrine" run loop.** The horizon the whole game is building toward (full
  design in [`WORLDBUILDING_CONCEPTS.md`](WORLDBUILDING_CONCEPTS.md)): a run is an incursion into a
  procedural area (first, the Goblin Forest) with one shrine the enemy has taken. Fight to it, reactivate
  it, and it becomes your home base — return by day to deepen your powers, survive sieges by night, with
  random map events keeping each trip fresh. Ties together the difficulty curve, the card draft, and the
  Favor economy. **Depends on:** the slice landing + a second god + Favor — so it's post-slice.
- **A fifth god, or a new mode** — a fifth patron grows the build matrix; an endless/horde mode opens a
  fresh loop. Secondary to the run loop as the anchor.
- **Meta-progression between runs** — a reason to come back: unlocks / light persistence that fits the
  single-file, no-backend constraint.
- **Day-lull content** — repopulating camps + a few random events so the daytime lull isn't dead air. The
  smallest first taste of the run loop; could come sooner than the rest.
- **Audio/juice pass** — a dedicated game-feel sweep once a content arc lands (screen shake, hit-stop,
  layered SFX).
- **A boss variant (parked)** — the fast-flanker idea is now realized as the wolves; what remains parked is
  a *boss-tier* variant (a dire-alpha world boss / a goblin elite). Revisit if the difficulty work wants
  more roster variety.

---

## The four gods (design north star)

Each patron is a **distinct combat identity** — expressed through genuinely different mechanics, never a
recolor. Co-op synergy falls out of the contrast (Boreas freezes → Cilia shatters).

| God | Element | Identity |
|-----|---------|----------|
| **Cilia** *(live)* | Fire | Offense, area damage |
| **Boreas** *(held)* | Ice | Defense, control, freezing, slowing |
| **Ikras** *(future)* | Wind | Mobility, chaining attacks & skills |
| **Bhumi** *(future)* | Earth | Tanking, reflecting damage (thorns), healing |

---

<details>
<summary>📎 Appendix — how PM &amp; engineering stay in sync (process)</summary>

**Status legend:** `proposed` (PM idea, not yet seen by Josh) · `approved` (greenlit — engineer may build)
· `in-progress` · `shipped` (move to changelog, delete here) · `held` / `cut`.

**The repo is the shared brain.** Both agents reset context between sessions, so cross-role awareness lives
*here*, not in memory. Every *Now* item carries a live status — **flip it the moment you act, in the same
commit:** PM sets `approved`; engineer sets `in-progress` **when starting** (not just when done), then
`shipped` on push. Pulse of what just happened → git (`git status` + `git log --oneline`, commit prefixes
`pm:` / `eng:` / `docs:`). **Session-open ritual (~30s):** `git status` + `git log --oneline -15` → read
*Now* + Handoffs → act. `tools/doc-drift-check.ps1` (Stop hook) nudges if this board goes stale.

**⇄ Handoffs (append a line; delete when cleared):**
- **PM → ENG:** Build *Now* top-down (1→4). Items 1 & 2 are the two systemic wall-fixes — **item 2's 3
  design calls are now resolved (binary tree, names, lore canon), so it's cleared for Phase 1** (the tree
  system + Dance of Fire's full 4-endpoint tree; see [`specs/imbue-paths.md`](specs/imbue-paths.md)). Items
  3 & 4 are pre-greenlit and OK'd to ship *ahead* of the big two to unblock wolf playtesting.
- **PM → ARTIST:** **eye-glow difficulty tell** (item 1) — enemy eyes glow **yellow (mid tier) → red (top
  tier)**, an additive draw-layer tint (no new sprites). Engineer sets the per-enemy threat-tier flag;
  Artist owns the look. Hand off once that flag exists.
- **PM → ENG (release housekeeping):** Favor shipped as **v0.2.0**; the Wolf Camps spine is still untagged
  in CHANGELOG `[Unreleased]`. Fold items 1–4 in and cut **v0.3.0** when they land (or tag wolf-camps alone
  first if it ships sooner). The Favor-coin art handoff (`fx.favor-coin` + HUD glyph for the placeholder
  `✦`, drawn procedurally in `gDrawFavorOrbs`) is still open with the Artist.

_PM upkeep: keep this current. Every item carries pillar + plain-English what/why + size. On approval, move
to **Now** and flip to `approved`; on ship, delete and let the changelog carry the record._
</details>
