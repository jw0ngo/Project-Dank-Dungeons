# Spec — Neutral Wolf Camps (jungle creep camps)

**Status:** `spine built` 2026-06-09 (eng) — *was* `approved` (Josh) · **the final major mechanical feature of the vertical slice**, shipped right after Favor.
**Spine landed (eng 2026-06-09):** 40 crescent dens placed at world-gen (carved into the `rocks` layer); `direwolf` + `alphawolf` EntityDefs + `_aiWolf` (neutral / circle-flank / telegraphed lunge-bite / hard-leash + full-heal); `isNeutral` + camp-linked `_wolfWakeCamp`; `gUpdateWolfCamps` 3-min respawn + chest-on-clear (2–4 Favor) inside `gSimUpdate`; minimap dots; editor palette. **Open calls resolved to the spec's recommendations** (gated-on-clear chest · Alpha-as-elite · flat 3–5 pack · random crescent mouth · 180s `WOLF_CAMP_RESPAWN`). **Remaining = playtest/tune + polish** (lunge-bite juice, pack-wake telegraph, threat-scaled packs) and the in-browser `await Sim.batch(3)` canary.
**Owner handoff:** PM → engineering (systems) + Artist (wolf sprites). Engineer owns the *how* per [`agents/engineer/engineer.md`](agents/engineer/engineer.md).
**Pillar:** game feel (a new, readable combat encounter + a farm-route rhythm) · mastery (risk/route decisions) · build-craft depth (a reliable, repeatable economy source feeding [`favor.md`](favor.md) + the card draft).
**Reads with:** [`favor.md`](favor.md) (the chest is the marquee Favor source) · the day-farm/VS-night spawn loop (camps are the *day* content the lull was waiting for).

**One-liner:** **Neutral wolf camps** are LoL/Dota-style jungle creep camps — **40 fixed, well-spaced** crescent rocky outcrops scattered across the world, each holding a **stationary wolf pack guarding a chest**. The pack is **neutral** (it ignores you until attacked), the camp **respawns every 3 minutes**, so clearing camps becomes a **farming route** you run across the map between sieges.

> **Why this is the last slice feature (Josh's call):** the day half of the spawn loop is currently a *living density* of goblin camps that respawn *around the player*. Neutral wolf camps give the day a **map of fixed, repeatable objectives** — a reason to *route* across the world, not just kite in place — and a steady, skill-gated income for the Favor economy being built now. Wolves also fulfil the parked **"fast-flanker archetype"** roster-variety idea, so the slice ends with a second enemy *feel* (quick, lunging pack) next to the goblins (telegraphed, grindy). With this in, the slice is **mechanically complete** → pure playtest/tune.

---

## 1. The camp — a fixed map feature

- **40 camps**, placed once at world-gen, **well-spaced** and away from spawn/villages/shrine. Use the existing **obelisk placement pattern** (rejection sampling with a min-separation check, `~11463`) → a new `gWildCamps[]` of `{cx, cy, wolves:[…], chest, respawnAt, cleared}`.
  - Recommended **min-separation ≈ 35 tiles** (≈1120px). On a 600×300 map, 40 points have ~67-tile average spacing, so 35 fits comfortably; raise the attempt budget (~1500, with a graceful "placed as many as fit" fallback — never hard-fail gen).
  - Exclusions: not within a village radius+buffer, not within the shrine, ≥ ~20 tiles from spawn (don't drop a pack on the player's start).
- **The crescent rocky outcrop.** Each camp's silhouette is a **C-shaped arc of impassable rock** (reuse the existing `rocks` tile layer — *no new art*). The arc opens toward one side (random or toward-spawn); the pack stands in the concavity, the chest in the middle of the pack. The arc gives the camp a **readable shape from a distance** and a **single tactical approach** (you fight into the mouth of the crescent). Carve the interior floor clear of trees like villages do (`~11276`).
- **Minimap:** a small neutral dot per camp (mirror the village/obelisk minimap dots, `~13076`) so routes are plannable. Dim when cleared, bright when up (stretch — see §6).

## 2. The pack — two wolves, a fast-flanker identity

Two enemy types, both from the **art Josh added** (`art/enemy alpha wolf.png`, `art/enemy dire wolf.png`). Wolves play **opposite to goblins**: goblins are slow + telegraphed + grindy; wolves are **fast, circling flankers** that punish tunnel-vision — they close distance quickly and **lunge-bite** (a short telegraphed pounce-dash), then reposition.

| Type | Role | Per camp | Feel |
|---|---|---|---|
| **Direwolf** | pack grunt | **2–4** | fast mover, circles to flank, telegraphed lunge-bite |
| **Alpha Wolf** | pack leader / elite | **1** | larger, tankier, harder bite — the standout that guards the chest |

- **Pack size 3–5** total (1 Alpha + 2–4 Direwolves), scaling slightly with `wildThreatLevel` if desired (hold flat for first tune).
- *Naming/role open call:* Alpha = the elite leader (recommend). If the **direwolf art reads bigger** than the alpha art, swap which sprite is the elite — the **art should drive which one reads as "the big one."** Hand the final call to the Artist + engineer.
- **Weighty-combat pillar:** the lunge-bite is the wolf's committed move — it dashes through its strike and has a recovery window where it's exposed (dodge the pounce → free punish). Keep the bite *telegraphed* (a brief crouch/tell) so it's readable and dodgeable, same contract as the goblin cone.

## 3. Neutrality — the defining trait (vs. goblin ambient camps)

This is the **one genuinely new behavior**. Goblin ambient camps aggro **on proximity** (`isAmbient`, pull within `AMBIENT_PULL_R`, `~4564`). Wolf camps are **neutral** — true jungle-creep behavior:

- **A wolf pack ignores the player entirely until attacked.** You can walk *through or past* a camp untouched. (New flag, e.g. `isNeutral`, distinct from `isAmbient`.)
- **The whole pack wakes together** when *any* member is hit (camp-linked aggro) — so it's a commitment to engage, not a pick-one-off.
- **Hard leash to the camp.** Run far enough and the pack **disengages, full-heals, and returns to the outcrop** (reuse the `homeWx/Wy` leash branch, `~4613`). You can't kite a pack across the map; you fight it at its camp or you leave it.
- This makes the camp a **choice**: engage for the reward, or route past to save HP/time. That choice *is* the feature.

## 4. Respawn every 3 minutes — the farm route

- When a camp's **last wolf dies**, mark `cleared`, stamp `respawnAt = now + 180s`, and **re-lock its chest**.
- On expiry, **respawn the full pack** at the outcrop anchor and **re-fill the chest**. (Use the wilderness run clock / `secs`, **never `Date.now()` in any hash/placement** — gotcha.)
- **This per-frame respawn check MUST live inside `gSimUpdate(dt)`** (AI-native invariant — loose in `loop()` and headless runs skip it).
- Net effect: 40 camps on staggered 3-min timers = a **continuous farm route**. Clear a cluster, move to the next, loop back as the first refreshes. This is the day-loop's spine.

## 5. The reward — the chest (ties to Favor)

- Each camp has **one chest** at its center (reuse the chest entity `{tx,ty,wx,wy,looted}` + the proximity-loot path `~12994`).
- **Gated on clear (recommend):** the chest unlocks/loots only **after the pack is dead** — the reward *for fighting*, and it stops players from sneaking loot past neutral wolves. *(Open call: alt = chest grabbable anytime but grabbing aggros the pack — the "greedy grab." More feel, messier. Recommend gated-on-clear for slice clarity.)*
- **Payout = Favor + XP.** These camps are the **reliable Favor source** the Favor spec calls for (the trickle is enemy drops; chests are the income). Because they **repeat every 3 min**, keep each chest **modest** so the route is worth running without trivializing the economy.
  - Recommended start: **camp chest = 2–4 Favor** (vs village chests' 3–6 one-shot); wolf kills give XP and roll the standard per-`EntityDef` Favor drop (set Direwolf ≈ goblin-tier, Alpha ≈ warrior-tier in the Favor table).
- On respawn the chest **re-locks** so the same camp pays out again next cycle.

## 6. Touches *(grounded — engineer owns the how)*

- **World-gen:** add a camp-placement pass beside obelisks (`~11463`) → `gWildCamps[]`; carve crescent rock arcs into the `rocks` layer; place one chest per camp. Reset with the run.
- **New enemies — the full recipe (the `§5`/`§6e` gotcha — do all five):**
  1. **`EntityDefs`** for `direwolf` + `alphawolf` — **every entry MUST have `hp`** (missing `hp` → unkillable enemy). Add the new bite/lunge fields + a `favor` drop field (per [`favor.md`](favor.md)).
  2. **`EnemyRegistry`** entries → a new **`_aiWolf`** (fast flank + neutral aggro + lunge-bite + leash).
  3. **Add both to the goblin-AI exclusion list** (else they run goblin AI *too* → double-movement bug).
  4. **Sprites** wired by the Artist (`char.direwolf.*` / `char.alphawolf.*`) — see handoff below.
  5. **Editor palette** entries.
- **Neutral aggro:** new `isNeutral` flag + camp-linked wake (hit one → wake all in `campId`) + hard leash via `homeWx/Wy` (`~4613`).
- **Respawn:** per-camp timer ticked **inside `gSimUpdate(dt)`**; respawn pack + re-fill chest on expiry.
- **Chest-on-clear:** gate the existing loot path on `camp.cleared`; payout Favor+XP; re-lock on respawn.
- **Minimap:** camp dots (`~13076`).
- **AI-native invariants:** wolves must be killable + appear in `Sim.observe()` (new enemy types near the player); respawn tick in `gSimUpdate`; **canary `await Sim.batch(3)`** after wiring (a stall = a coupling broke — likely the exclusion list or a missing `hp`).

**Size:** **multi-session.** Spine ~1 session (camps placed + crescents carved + wolves spawn/killable + chest-on-clear + 3-min respawn). Polish after (lunge-bite juice, minimap dots, pack-wake telegraph, threat scaling).
**New art:** the two wolf sprites (Josh added the source PNGs — Artist prep below). Rock outcrops + chest reuse existing art (no new tiles needed).
**Balance:** the master levers are **chest Favor amount × 40 camps × (1 / 3min)** = the world's steady income, and **pack strength vs. reward**. These camps are repeatable, so they're the economy's *floor* — tune so a farm route is worth running but never out-paces siege risk as the income of choice. Hold the kit's base numbers fixed; tune the camp economy around them like the rest of the slice.

## 7. Open calls (recommendations inline)

1. **Chest gating** — gated-on-clear (recommend) vs. greedy-grab-aggros-pack.
2. **Alpha vs. Direwolf as the elite** — Alpha = leader (recommend); let the **art** override if the direwolf reads bigger.
3. **Pack scaling** — flat 3–5 (recommend for first tune) vs. scale with `wildThreatLevel`.
4. **Crescent opening direction** — toward spawn (always a clean approach) vs. random (more varied reads). Recommend random with a guaranteed walkable mouth.
5. **Respawn cadence** — fixed 180s (Josh's spec) — keep as a single tuning constant so the playtest can dial it.
