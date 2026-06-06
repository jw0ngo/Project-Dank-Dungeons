# Dungeon Forge — Product Roadmap

**The PM↔engineering handoff medium.** The Product Manager maintains this doc per [`PRODUCT_MANIFESTO.md`](PRODUCT_MANIFESTO.md); the engineer pulls **approved** items from *Now* and builds them per [`ENGINEERING_CHARTER.md`](ENGINEERING_CHARTER.md).

**Status legend:** `proposed` (PM idea, not yet seen by developer) · `approved` (developer greenlit — engineer may build) · `in-progress` · `shipped` (move to changelog, delete here) · `held` / `cut`.

Keep the three horizons full. Re-rank after every release. This seed reflects game state at **v0.11.0**; everything below is `proposed` until the developer approves it.

---

## Now — approved or next in line (1–3 items)

_Nothing approved yet. The PM seeds candidates in **Next**; the developer promotes one here on approval._

---

## Next — proposed, sized, sequenced

> The build-craft spine just completed its first full arc: **all four of Cilia's Fire imbues** (swing / whirlwind / leap / dash) shipped in v0.11.0. The highest-leverage next moves extend that proven pattern to a second god and give the roster its next boss beat.

1. **Second god's imbue arc — pick one of Ikras / Bhumi / Boreas** · `proposed` · pillar: build-craft depth
   - One-liner: a full four-skill imbue set for a second patron, following the Cilia's Fire template, so a second build identity exists.
   - Why now: the imbue pattern is proven and the registries are warm; a second god roughly *doubles* build variety for a fraction of the first one's cost. This is the clearest "deepen, don't scatter" move.
   - Size: multi-session (one imbue per skill, like Cilia). New art: per-skill FX sprites (the main cost — scope which god by which FX are cheapest/most distinct).
   - Open call for developer: **which god next?** (PM recommendation pending a feel/fantasy read — e.g. Boreas=frost/slow vs Ikras vs Bhumi.)

2. **A new enemy + its boss variant** · `proposed` · pillar: mastery / escalation
   - One-liner: extend the roster (the "add a new enemy" recipe is documented: def → registry → exclusion list → sprite → palette) plus a boss milestone in its line.
   - Why now: boss milestones are a shipped, loved beat (Goblin King); the roster has room before it feels repetitive.
   - Size: session (enemy) + multi-session (boss art/mechanics). New art: 8-dir sprite sheet.

3. **Co-op build synergy pass** · `proposed` · pillar: co-op that amplifies
   - One-liner: make two different gods' imbues *combine* on shared targets (e.g. one ignites, one detonates) so co-op is more than parallel play.
   - Why now: multiplayer exists and is delta-synced; the payoff is currently "two players, same game" rather than "two builds, one combo."
   - Size: multi-session. Depends on ≥2 gods having imbues (gated behind item 1).

---

## Later — the idea pool (one big rock always visible)

- **🪨 BIG ROCK: a fifth god, or a new mode** — the horizon beyond the next patch. A fifth patron expands the build matrix; a new mode (e.g. endless dungeon, horde, or a meta-progression layer) opens a fresh loop. Keep exactly one of these visible as the long-horizon anchor.
- **Meta-progression between runs** — a reason to come back: unlocks, account-light persistence that fits the single-file vanilla-JS constraint.
- **Wilderness content depth** — events, named encounters, or objectives layered onto the seeded 600×300 world beyond villages/obelisks/shrines.
- **Audio/juice pass** — a dedicated game-feel sweep once a content arc lands (screen shake curve, hit-stop, layered SFX).

---

_PM: keep this terse and current. Every `proposed` item carries pillar + one-liner + why-now + size + art cost. On developer approval, move to **Now** and flip to `approved`. On ship, delete and let the changelog carry the record._
