# Spec — God Stat Identities

**Status:** framework + Cilia slice (Josh-directed 2026-06-12). Cilia mechanic **locked & buildable now**;
Ikras / Boreas / Bhumi mechanics are **PM-proposed, design-ahead** (those gods aren't built — these guide
their kits when they land). · **Owner:** PM (design) → Engineer (Cilia wiring). · **Pillar:** build-craft
depth (the heart) + the god-identity north star.

---

## The idea

Each patron god **owns a small set of character stats**, and the god's signature *mechanics read / scale
with those stats*. So a generic stat card (Precision = +crit chance, Magnetism = +pickup range, …) becomes a
**build-defining choice for that god** — without bespoke content. Pledge Cilia and suddenly crit cards aren't
"+damage sometimes," they're *"make my fire chain-detonate."*

**The pattern (the rule for every god, present and future):** don't invent a bespoke stat per god — **wire the
god's existing mechanics to read the character stats that express its identity.** Minimal new content, maximal
synergy, and it makes the whole shared stat pool deeper the more gods exist (the same stat means different
things under different patrons). This is the cheapest high-identity build-craft lever we have — same shape as
Patron Cards (item 0c), but it reuses the *generic* card pool instead of adding a god-specific one.

**Why it compounds with the mana economy:** the stat identities *are* archetypes. Boreas's mana-regen identity
is the **SUSTAIN** archetype incarnate; Cilia leans **BURST**. So this framework gives the pending mana-build
card expansion a *god-flavoured* home — the same regen/pool/crit cards read as different builds under different
patrons. (See [`mana-economy.md`](mana-economy.md) "build variety lives in the card pool.")

---

## Stat assignments (Josh 2026-06-12)

| God | Element · Identity | Owned stats | Signature mechanic hook |
|---|---|---|---|
| **Cilia** *(live)* | Fire · offense/AOE | **Crit Chance + Crit Dmg** | burn-tick explosion (chance ← crit chance, dmg ← crit dmg) — **LOCKED** |
| **Ikras** *(future)* | Wind · mobility/chaining | **Attack Speed + Move Speed** | chain arcs (count ← move speed, rate ← attack speed) — *proposed* |
| **Boreas** *(held)* | Ice · defense/control | **Mana Regen + Pickup Range + CDR** | frost-field size ← pickup range; CC uptime ← CDR; aura sustain ← mana regen — *proposed* |
| **Bhumi** *(future)* | Earth · tank/thorns/heal | **Health + HP Regen** | thorns dmg ← max HP; heal-engine ← HP regen — *proposed* |

**Stat keys (grounded, `wildBuffs.*`):** `critChance` (clamp 0.75), `critDamage` (added to `CRIT_BASE_MULT`),
`speedPct` (move speed), `cdPct` (cooldown, clamp 99), `pickupRange`, `mpRegenAdd`, `hpBonus`/`maxHp`,
`hpRegenAdd`. **⚠ Gap: there is no character-stat card for *Attack Speed*** — move speed is `speedPct`; "attack
speed" today exists only as a per-skill `swingSpeed` skill-stat. Ikras's attack-speed identity needs a new
character stat/card (or an explicit mapping to the swing-speed stat) — decide when Ikras is built.

---

## Cilia — Crit synergy (LOCKED, buildable now)

**Rewire the Conflagration burn-explosion (item 0c) to run on crit stats instead of the bespoke
`burnExplodeChance`:**

1. **Explosion chance per burn tick ← player crit chance.** In `gUpdateEnemyBurn` (`index.html:6419`, the roll
   at `:6432`), source the per-tick detonation chance from `gPlayer.wildBuffs.critChance` (0–0.75) instead of
   `burnExplodeChance`.
2. **Explosion damage ← player crit damage.** In `gBurnExplode` (`:6396`), the blast damage is currently
   `max(4, round(_burnTickDmg × 4))` (`:6403`); scale it by the crit multiplier `(CRIT_BASE_MULT + critDamage)`
   instead of the flat ×4 (engineer picks the coefficient so a no-crit-investment Cilia still detonates modestly
   and a crit build detonates hard).

**Effect:** crit cards (Precision, Savagery) become Cilia's chain-detonation engine — a crit build turns ignite
into a pack-clearing explosion cascade. Crit *is* fire's build axis.

**Tuning notes / forks for the engineer:**
- Crit chance caps at 0.75 → up to 75% detonate **per burn tick** (~every 0.4 s) is very chainy; tune the
  coefficient (e.g. explosion chance = `critChance × f`) so it reads as a satisfying cascade, not a constant
  screen-wide chain. Judge live.
- **The `cil-conflag` "Conflagration" patron card (`:14103`) becomes redundant** (its whole job was
  `burnExplodeChance`). **Decision (Josh):** retire it, or **repurpose** as a Cilia card that *amplifies the
  crit→explosion conversion* (e.g. +explosion radius / +chain re-ignite count / +a flat explosion-chance bonus
  on top of crit). PM rec: **repurpose to "+explosion radius & chain"** so the Cilia patron card still exists and
  deepens the crit-fire build rather than vanishing. Searing Heat (burn tick dmg) + Lingering Flame (burn
  duration) are unaffected and still feed the blast.
- Host-authoritative (burn/explosion already resolve host-side, `:6419`) → no MP-protocol change.

---

## Proposed mechanics for the unbuilt gods (PM design-ahead — confirm/redirect)

These are **my inference** filling Josh's "mechanics tbd," not locked. They finalize when each god is built;
recorded now so each god's kit is *authored into* its stat identity from the start (don't retrofit).

### Ikras (Wind · mobility/chaining) — Attack Speed + Move Speed
- **Move Speed → chain breadth.** Ikras's auto-skills arc between enemies; the **number of arcs / chain length
  scales with move speed.** The faster you move, the wider your wind chains — rewards the kiting mobility fantasy.
- **Attack Speed → chain frequency.** How fast the chains re-fire / re-arc scales with attack speed.
- **Lead mechanic (rec):** a lightning/wind chain that leaps between nearby enemies — *arc count ← move speed,
  re-arc cadence ← attack speed.* A pure mobility build = more, faster chains across the pack.
- **Blocked on:** the Attack-Speed stat-card gap above + Ikras existing at all.

### Boreas (Ice · defense/control/zoning) — Mana Regen + Pickup Range + Cooldown Reduction
- **Pickup Range → frost-field size** (Josh's seed). Bigger magnet = bigger control zone. Zoning identity made a
  stat. (His Frost Bulwark / slow-field radius reads `pickupRange`.)
- **CDR → CC uptime.** A control god wants to re-apply freeze/walls often — freeze/zone cooldowns (or freeze
  *duration*) scale with `cdPct`.
- **Mana Regen → aura sustain.** Boreas leans on *channelled/standing* zoning auras (the held Frost Bulwark), so
  **mana regen funds his uptime** — he's the **SUSTAIN archetype** of the mana economy (vs Cilia's burst). This
  is the cleanest sustain↔burst contrast in the roster, and the marquee co-op pairing.
- **Lead mechanic (rec):** a frost zone whose *radius ← pickup range*, *refresh ← CDR*, *sustained by mana
  regen* — pure control build = a huge, always-up freezing field.

### Bhumi (Earth · tank/thorns/heal) — Health + HP Regen
- **Max HP → thorns / reflected damage.** The more HP you stack, the more you reflect — the tank *is* the damage
  engine. (Thorns dmg = `f × maxHp`.)
- **HP Regen → heal engine.** HP regen feeds a heal-aura (self/ally) or an **overheal → earth-shield/earth-damage**
  conversion, so regen above full isn't wasted — it arms his earth mechanics.
- **Lead mechanic (rec):** a thorns aura whose reflect scales with max HP + an overheal-to-shield that turns HP
  regen into mitigation/retaliation. Stacking the tank stats *is* the offense.

---

## Scope & sequencing

- **Now (buildable):** the **Cilia crit-synergy** wiring only — small, host-side, reuses the live burn-explosion.
  Filed to the Engineer lane.
- **Design-ahead (no engineer work yet):** Ikras / Boreas / Bhumi mechanics land **with their gods**, authored
  into these stat identities. Boreas (held, roadmap #5) is the next to benefit — fold its frost-field/CDR/mana
  hooks into the Frost-kit design when it unholds.
- **Compounds with:** the mana-build card expansion (gods = archetypes), Patron Cards item 0c (the Cilia card
  repurpose), and the god-skill curve (#8.9). Keep boundaries clean — stat identities wire the *generic* pool to
  god mechanics; Patron Cards remain the *god-specific* pool.
