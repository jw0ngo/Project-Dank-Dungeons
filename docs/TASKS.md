# To Dust — Task Tracker

**The single shared backlog of concrete work, organized by the agent who owns each task.** Every to-do for
the PM, Engineer/CTO, and Artist lives here with a live status. When there's no higher-priority *Now* work in
[`ROADMAP.md`](ROADMAP.md), pull from your lane here.

> **TASKS vs ROADMAP — two layers, one axis each.**
> [`ROADMAP.md`](ROADMAP.md) is the **strategy** layer (PM-owned): *what* features we're building and *why*,
> priority, sizing, the product gate (`approved`/`shipped`). **This doc is the execution layer:** the concrete
> to-dos — feature sub-tasks, cross-role hand-offs, deferred cruft/bugs — for every agent. A roadmap feature
> spawns tasks here. **One fact, one home:** a task links its roadmap item by # / name and never re-states the
> *why*; the roadmap never tracks execution churn. (For spec-backed work the **spec** is the source of truth;
> a task tracks only *progress against it*, not build detail.)

## How to use this doc

- **Lanes are by owner** — the agent who does the work **and updates the status.** Read your lane to pick up work.
- **Any agent may add a task to any lane** (flag work for another). Tag who flagged it: `(↳ from ART, 2026-06-11)`.
  **Only the owning lane changes a task's status.**
- **One line per task where possible:** `<status> <type> **Title** — what + grounding (greppable symbol / file).
  (↳ from <role>, date)`. Meaty spec-less hand-offs keep a collapsible **detail** block — they're their only home.
- **Status:** ◻️ todo · 🔄 in-progress · ⛔ blocked · ✅ done (move to **Done** at the bottom; git keeps the depth).
- **Type:** 🔴 bug · 🟡 cruft (dead/misleading code, no behavior impact) · 🟢 polish · ✨ feature-work · 🎨 art · 🔧 chore.
- **Flip status the moment you act, in the same commit.** **Commit your own lane — never `git add -A`** (the tree
  carries cross-role WIP; stage explicit paths so a `pm:`/`eng:`/`art:` commit stays single-lane).
- **Session-open (~30s):** `git status` + `git log --oneline -15` → roadmap *Now* → your lane here → act.

---

## 🟦 PM lane

- ◻️ 🔧 **Re-rank after item 2's first slice lands** — once God Skills proves out in playtest, re-sequence *Next*:
  the Boreas unhold is the keystone (lights up Elemental Fusion + co-op synergy + its own Frost kit at once).
  Define the unhold trigger then. (roadmap #5 / *Next*)

---

## 🟧 Engineer / CTO lane

- ◻️ 🔧 **Apply the `assets/world` + `assets/tile` fold (atomic move + manifest rewrite)** (↳ from ART,
  2026-06-12 · Josh-approved scheme) — `assets/world/` and `assets/tile/` are flat and filling up (one area's
  worth so far). New standing scheme (`assets/README.md`): **`world/` by AREA + `_shared/`**, **`tile/` by
  terrain TYPE**. Tooling done & dry-run CLEAN (every file maps, no unmapped). **You run `--apply`** (sole
  `index.html` editor); it does `git mv` + `ART_MANIFEST` path rewrite in one commit per domain — keys
  unchanged, paths only.
  ```
  python tools/fold-assets.py --domain world --apply   # 44 files -> _shared/ goblin-forest/ sanctum/  (22 manifest paths rewritten, 22 unwired just moved)
  python tools/fold-assets.py --domain tile  --apply   # 48 files -> floor/ cobble/ dirt/ grass/ forestgrass/ rock/ spike/  (35 rewritten, 13 moved)
  ```
  Self-verifies every `assets/<domain>/` path resolves post-rewrite; then `node --check` the extracted
  `<script>` + `python dev.py` → all tiles/props still render (a missed path 404s → silent procedural
  fallback). **Do this BEFORE wiring the new forest assets below** (their snippets now cite the foldered
  paths). Two separate commits (one per domain) keep each diff a clean path-rewrite. Deploy-affecting → push
  with Josh's auth. *`world.tree.*`/`treesmall.*`/`foresttree.*` all move under `world/goblin-forest/`;
  `grass`/`forestgrass` etc. under their `tile/<type>/`.*

- ◻️ 🎨 **Wire forest-tree set + forest-grass tiles + barrel/crate props** (↳ from ART, 2026-06-12) — four new
  asset families sliced & committed under `assets/`. All **new ids** (non-destructive — Josh's call: add, don't
  replace the existing `tree-*`/`grass-*` sets). **Snippets below use the POST-FOLD foldered paths** (do the fold
  task above first; if you wire before folding, drop the `<area>/`/`<type>/` segment and the fold will rewrite it).
  <details><summary>detail (render spec)</summary>

  **1. Forest trees — `world.foresttree.0..8`** (9 files, ~605 KB, `assets/world/foresttree-<n>.png`). A 3rd tree
  family alongside `world.tree.*` (large) + `world.treesmall.*`. **Same pipeline & framing as `tree-*`:** 256²
  cell-framed canvas, bottom-anchored to **foot fraction ~0.94** (uniform across all 9) — so they draw through the
  **same `gDrawTree` feet-anchored world-prop path and share `TREE_FOOT≈0.94`**, no new draw code. Sliced with the
  `--bleed 50` overflow recovery (full canopies, no flat tops — QA contact CLEAN). Paste:
  ```
  'world.foresttree.0':'assets/world/goblin-forest/foresttree-0.png', 'world.foresttree.1':'assets/world/goblin-forest/foresttree-1.png',
  'world.foresttree.2':'assets/world/goblin-forest/foresttree-2.png', 'world.foresttree.3':'assets/world/goblin-forest/foresttree-3.png',
  'world.foresttree.4':'assets/world/goblin-forest/foresttree-4.png', 'world.foresttree.5':'assets/world/goblin-forest/foresttree-5.png',
  'world.foresttree.6':'assets/world/goblin-forest/foresttree-6.png', 'world.foresttree.7':'assets/world/goblin-forest/foresttree-7.png',
  'world.foresttree.8':'assets/world/goblin-forest/foresttree-8.png',
  ```
  - **Wiring (your call):** to make them appear, either extend `gWildTrees` placement to pick from this family too
    (add a per-tree `family:'tree'|'treesmall'|'foresttree'` + variant index, `gDrawTree` selects the keyspace) or a
    separate scatter pass. `gInitArt` will count `world.foresttree.*` like any variant set. **Size-coupling:** shares
    `TREE_FOOT≈0.94`; give it its own `TREE_BASE`-equivalent / per-family scale if it should read larger/smaller than
    the existing trees. These are taller "real forest" trees (fir/pine, willow #3, banyan #2, oaks/maples) — likely
    intended to dominate the Goblin Forest; Josh may later want them to *replace* `tree-*` (then just repoint the
    `world.tree.*` keys — drop-in).

  **2. Forest-grass tiles — `tile.forestgrass.0..8`** (9 files, ~157 KB, `assets/tile/forestgrass-<n>.png`). Opaque
  **96² RGB full-bleed** (matches the live `grass-*` treatment exactly — grass edge-to-edge, verified tiles
  seamlessly with no dark-edge grid). A darker, lusher forest-floor grass (flowers, dirt patches, rocks). Paste:
  ```
  'tile.forestgrass.0':'assets/tile/forestgrass/forestgrass-0.png', 'tile.forestgrass.1':'assets/tile/forestgrass/forestgrass-1.png',
  'tile.forestgrass.2':'assets/tile/forestgrass/forestgrass-2.png', 'tile.forestgrass.3':'assets/tile/forestgrass/forestgrass-3.png',
  'tile.forestgrass.4':'assets/tile/forestgrass/forestgrass-4.png', 'tile.forestgrass.5':'assets/tile/forestgrass/forestgrass-5.png',
  'tile.forestgrass.6':'assets/tile/forestgrass/forestgrass-6.png', 'tile.forestgrass.7':'assets/tile/forestgrass/forestgrass-7.png',
  'tile.forestgrass.8':'assets/tile/forestgrass/forestgrass-8.png',
  ```
  - **⚠ NOT auto-wired.** `gTileArt` only maps `TILE_FLOOR→'floor'`, `TILE_DIRT→'dirt'`, `TILE_GRASS→'grass'`. A new
    `forestgrass` family needs a `gTileArt` mapping for whatever tile id should use it (a new `TILE_FORESTGRASS`
    constant for a forest biome, **or** repoint `TILE_GRASS→'forestgrass'` if it's meant to be the wilderness grass).
    `gInitArt` auto-counts `tile.forestgrass.*` into `gTileVarCount` once the keys exist; variant selection uses the
    `gWallVar` table (not a coordinate hash). Opaque ground → normal `gTileArt` blit-and-return (no overlay/ground-
    beneath needed).

  **3. Barrel + crate props — `world.barrel` / `world.crate`** (`assets/world/barrel.png` 186×256 74 KB,
  `assets/world/crate.png` 204×256 75 KB). Transparent cutouts, white-bg removed + halo eroded (QA magenta CLEAN,
  metal-band highlights intact). **`barrel.png` overwrote the old 39×43 unwired placeholder** with a crisp HiDPI
  cutout; **`crate.png` is new.** Paste:
  ```
  'world.barrel':'assets/world/_shared/barrel.png', 'world.crate':'assets/world/_shared/crate.png',
  ```
  - **Wiring:** single overlay props (tall transparent cutouts → draw ground first, composite on top; same family as
    the chest/rock overlay path, feet-anchored by the bottom of the opaque pixels). Need a draw hook + placement
    (town set-dressing and/or wilderness scatter — a PM/Josh placement call; see the unwired-Sanctum-props task).
    **Raster → HiDPI:** draw at `devicePixelRatio` (`_prepHiDPICanvas`/`<img>`). Suggested draw size ~28–40 px tall;
    tune in-game (engineer's knob). If barrel/crate become destructible loot containers that's a systems call, not
    part of this art handoff — décor by default.

  **Verify (all):** `node --check` + grep each new key resolves to a file + `python dev.py` → foresttrees show full
  canopies feet-on-ground & mix with the other trees; forestgrass tiles blit seamlessly; barrel/crate composite
  cleanly over ground (no white halo). Source masters committed: `art/world/forest trees.png`, `art/tiles/forest
  grass.png`, `art/world/barrel.png`, `art/world/crate.png`.
  </details>

- ✅ 🎨 **Wire SMALLER tree sprites + formation-based forest** (Josh, 2026-06-12) — **done 2026-06-12.**
  Re-used the occluding-prop system as-is (`gWildTrees`/`gDrawTree`/`gRCTrees`). Wired the `world.treesmall.0..8`
  set; small trees render smaller via a smaller draw `scale` (both sets are cell-framed to fill the 256²
  canvas — measured: small art is NOT smaller within its canvas, so scale is the only lever). Replaced the
  per-tile scatter with **three weighted formations** per Josh's rule (small-tree cluster ≫ large+cluster >
  lone large), anchors min-separated so stands read as distinct. `TREE_FOOT` 0.93→0.94 (re-measured uniform
  foot, both sets). Knobs documented inline. Verified: `node --check` + greps; visual check pending Josh's
  eyeball (`python dev.py`).

- ✅ 🎨 **Wire world TREE props — 9-variant scatter set** (↳ from ART, 2026-06-11) — **done 2026-06-11.**
  Wired as a new off-grid scatter-prop family mirroring `gRocks`: 9 `world.tree.<n>` manifest keys →
  `gWildTrees` (reset with the other run state) → placed in `generateWildernessMap` step 4c (seeded RNG, so
  MP-deterministic) on open grass clear of spawn/shrine/villages/obelisks/camps/forest, with a min-separation
  → returned as `kind:'tree'` entities, unpacked at load → drawn by `gDrawTree`, **depth-sorted in the y-sort
  `drawables`** so the player tucks behind a canopy / in front of a trunk. Feet-anchored via a **measured**
  `TREE_FOOT=0.93` (opaque base sits ~0.93 down the 256² canvas — measured all 9, not eyeballed); HiDPI smooth
  draw + procedural fallback. **Décor only — draw-only, no collision** (the spec's fork).
  **Revision (Josh, same day):** the painted trees **replace the procedural `TILE_TREE` forest**, not a
  separate open-field scatter — placement now samples FOREST tiles (`TREE_DENSITY=0.10` per forest tile,
  seeded), and the `TILE_TREE` tile draw became **shaded forest floor** (procedural canopies + the
  `_TC_TREE_*` palettes deleted). Slow-zone/walkability unchanged (still keyed off the tile id). **Live knobs
  for Josh to tune:** `TREE_DENSITY` (forest density), `TREE_BASE` (draw size), per-tree `scale` 0.7–1.1.
  **Follow-ups now done (Josh, 2026-06-12):** (1) **trunk collision** — `gRCTrees` (mirrors `gRCRocks`) with a
  player-sized trunk circle (radius = `TREE_BASE·scale·TREE_TRUNK_FRAC`, so it tracks draw size), wired into
  all 4 player collision paths (walk/dash/heavy-lunge/swing-lunge); player-only (enemies still pass through —
  available extension). (2) **canopy fade** — in `gDrawTree`, a tree that draws in front of the player and
  whose canopy box covers the player's foot eases to `TREE_FADE_ALPHA` (0.3) so it never hides the hero
  (eased per-tree via `t._a`; render-only). (3) **2× size** — `TREE_BASE` 150→300 (density left at 0.10; the
  small/sparse trunks keep it walkable — drop `TREE_DENSITY` if the canopy reads too thick). Browser canary
  (`Sim.batch`) not run (render + player-collision only, no sim-step coupling).
  <details><summary>detail (render spec)</summary>

  Art committed: `assets/world/tree-0..8.png` (9 interchangeable tree variants — oaks, a willow (#3),
  banyans; each a transparent cutout incl. its own rocky/grass **base**). Sliced from `art/world/trees.png`
  (3×3, `--bg white --frame cell --global`, source 1254² → 418px cells → resampled to **256×256**), magenta
  + over-green QA CLEAN. ~96–119 KB each (~961 KB total).
  - **Manifest keys** (paste as-is): `'world.tree.0':'assets/world/tree-0.png'` … `world.tree.8` (the new
    **`world` keyspace** — a world-prop *variant set*, analogous to `tile.grass.<n>` but NOT a ground tile;
    `gInitArt` loads them like any manifest path).
  - **NOT a tile — overlay/world-prop path.** A tree is a tall transparent cutout drawn *over* ground, not a
    `gTileArt` ground blit. Ground draws first; the tree composites on top (same family as the rock/spike
    `gTileProp` overlay, but trees overflow a tile cell — they're scatter props, not cell-bound).
  - **Placement (your call — the fork):** most natural is a **wilderness scatter** (Goblin Forest) — random
    positions + **random variant** of the 9 (reuse the `gWallVar`-style table or a position hash `% 9`), drawn
    feet-anchored. Alternative: discrete placed obstacles. Whether a tree **collides** (blocks movement at the
    trunk base, ~not the full canopy bbox) is a gameplay/systems call — if it's décor, draw-only; if an
    obstacle, add a small base-radius hitbox. **Size-coupling:** any collision radius ↔ draw scale move together.
  - **Anchor:** cutouts are **cell-framed**, so within each 256² canvas the trunk base sits at the lower-middle
    (transparent padding above canopy + below base), and **relative scale is preserved** (some trees are
    naturally bigger — intended variety). Feet-anchor by the **bottom of the opaque pixels** (the base), not the
    canvas bottom. Suggested draw size: tune in-game; start ~96–160 px tall over the wilderness grass.
  - **Raster → HiDPI:** draw at `devicePixelRatio` (`_prepHiDPICanvas`/`<img>`, not an undersized backing
    store). Source held to **256 px** for payload; that covers ~128 px render @2× DPR. If trees need to render
    larger/crisper, ping Artist for a **`--size 0`** re-slice (418 px native, ~290 KB each).
  - **Verify:** `node --check` + grep each `world.tree.<n>` key + `python dev.py` → trees scatter over the
    wilderness, variants mix, feet sit on the ground, canopies composite cleanly over grass (no white halo).
  </details>

- ✅ **Heavy charge locks out the normal swing** (↳ from PM playtest, 2026-06-11 · roadmap #6 `approved`) —
  **done 2026-06-11.** Added one guard at the `gDoSwingAt` chokepoint (`index.html:3545`): early-return while
  `heavyWindingUp || heavySwinging`. All three swing-trigger paths (mousedown, LMB-held repeat, pending buffer)
  funnel through `gDoSwingAt`, so the single guard covers the whole "until the heavy resolves" window (charge →
  swing → recovery), not just the windup. **Drop, not queue:** a click mid-heavy is eaten; the LMB-held repeat
  naturally resumes once the heavy clears, so holding through a heavy still feels right. **Why:** weighty-combat
  directive (Josh, standing) — a committed action must compromise other options.

- ✅ ✨ **Item 7 — Mana economy & skill management** (↳ from PM playtest, 2026-06-11 · roadmap #7 `approved` ·
  spec [`specs/mana-economy.md`](specs/mana-economy.md)) — **done 2026-06-12, all three phases.** Mana is now a
  real shared resource funding both the class kit and the god layer.
  - [x] **Phase 1 — class mana + cooldown rebalance** — `WeaponRegistry.sword` (registry **and** the `sw.*`
    run-start reset block, which re-clobbers `ww*`/`leap*` — both edited): leap `35→45` mp & CD `200f→900f`
    (15 s, CD-led); WW drain `0.08→0.30`/f (18/s, mana-led) & CD `120f→300f` (5 s) + power bump `wwDamage 22→30`,
    `wwRadius 36→44`; heavy `25→30`; dash `15→18`. Benchmark **leap + ~3 s WW ≈ empties 100 pool** ✓.
    `SKILL_STAT_FLOOR` confirmed sane (floors unchanged). Dash/heavy CDs left as-is (flagged for Josh). Live knobs.
  - [x] **Phase 2 — God Skills drain mana/sec, rank-scaled** — added `mpCost` (mp/**sec**) to
    `IMBUE_PATHS.cilia.burningBody` `base`(1.67)/`waveStep`(0.15)/both `formStep`s(0.2); auto-scales via
    `gGodFireParam` (the rank-up card pours *all* step keys → no special-casing). Maxed ≈2.92 mp/s. Drain paid
    centrally in the dispatcher (Phase 3) as `gGodFireParam(p,id,'mpCost')*dt/60`.
  - [x] **Phase 3 — toggle/hotkey + HUD + Sim hooks** — per-player `godSkillOrder`/`godSkillOff`/`godSkillDormant`
    (factory init + run-start reset). **Architecture call:** payment is **central in `gUpdateGodSkills`** (pay in
    key order 1→9, then fire), not inside each tick — exactly what "pay lowest-key-first, dormant-on-starve"
    needs, and keeps tick functions pure (the spec's "drain in gTickBurningBody" was grounding, not
    prescriptive). Acquisition order built **lazily** in the dispatcher (no per-acquire-site hook). `keydown`
    1–9 → `gToggleGodSkillByKey`. Signature-gated DOM chip row (`#g-godskills`) by the MP bar:
    key · icon · mp/s · lit/dormant(⚠)/off(✕). **Starvation = dormant + auto-resume, lowest-key-last** ✓.
    **AI-native:** `Sim.toggleGodSkill(n)` + `Sim.act({toggleGodSkill})`; `observe().player.godSkills[id]` now
    carries `{key,active,dormant,mpCostPerSec}` (+ existing `mp`).
  - **Verified:** `node --check` clean; no function shadowing; **extracted the real dispatcher functions and
    drove pay/dormant/auto-resume/key-order in Node** (6 behavior assertions pass — stronger than batch for the
    new logic). ⚠ **In-browser canary pending** (`Sim.batch(3)` + manual: acquire 2 god skills → over-commit mana
    → watch high-key go dormant + auto-resume → toggle with 1–9) — needs a live browser; run before tagging.
    Committed locally (deploy-affecting — awaiting Josh push auth).

- 🔄 ✨ **Item 2 — God Skills** (roadmap #2 `approved` · spec [`specs/god-skills.md`](specs/god-skills.md)) —
  phased trigger-swap, 3/5 done:
  - [x] **Architecture generalization** (2026-06-11) — imbue-path mastery machinery generalized from
    hardcoded-`'swing'` → keyed by god-skill id; draft cards registry-driven (`gGodSkillCards`); auto-fire
    dispatcher `gUpdateGodSkills` ticks owned skills from `gUpdatePlayer`. *Load-bearing — Trail/Pyroclasm are
    now ~a registry entry + one updater branch each.*
  - [x] **Burning Body** (2026-06-11, *redirected from "Pyre Waltz"* — Josh: fire = AOE burst + burn, not
    movement/pull) — base **ignite-aura** + Form @5 **Firebloom** (ring/5s) / **Cinderburst** (nova/4s) → 6–9 →
    Ascension @10 🐉 Dragonbreath/Dragonheart · 🔥 Chaos Crown/Cataclysm. `gTickBurningBody`, standalone dmg,
    ring system extended (breathe/settle/healOwner). Logic-verified; **feel-tuning live in playtest**.
  - [x] **Migration** (2026-06-11) — whirlwind/dash/heavy revert to plain (3 fire-spawn blocks deleted); shrine
    pledge sets `gPlayer.patron` (`#g-imbue-overlay` parked); **Dance of Fire retired-and-parked** (`IMBUE_PATHS.cilia.swing` + wave FX kept, unreachable).
  - [ ] **Trail of Embers** ⏸ *(sequenced after item 7 — build with `mpCost` + toggle from the start)* — add `kind:'distance'` registry entry (incl. an `mpCost` per the item-7 model) + a movement-accumulator branch in `gUpdateGodSkills` (dash trail spawn already removed; just the updater branch remains).
  - [ ] **Pyroclasm** ⏸ *(sequenced after item 7 — build with `mpCost` + toggle from the start)* — add `kind:'interval+autotarget'` entry (incl. `mpCost`) + a nearest-cluster helper + updater branch (heavy spawn already removed).
  - [ ] **Burning Body Ascension refinement — Eye of Chaos + leaf swap** (↳ from PM playtest, 2026-06-11 · spec [`specs/god-skills.md`](specs/god-skills.md) rank-10 table) — in `IMBUE_PATHS.cilia.burningBody` (`index.html:~13547–13563`): (1) **Firebloom 🔥** leaf `chaosCrown` → **`eyeOfChaos`** ('Eye of Chaos'), new **`ringMode:'ebb'`** — a slow chaosfire ring that ebbs net-outward → pauses at max → thickens/intensifies → dissipates (new branch in `gSpawnFireRing` alongside `breathe`/`settle`, `~index.html:6089–6193`); no permanent ground-circle. (2) **Cinderburst 🔥** leaf `cataclysm` → **`chaosCrown`** ('Chaos Crown'), keep `novaScale` colossal blast + route to settle a chaosfire ground-circle (`_laySettleRing`/`gLayChaosfireRing`). Net effect = the two 🔥 leaves trade Form slots; Cataclysm name retired. **Balance:** Eye of Chaos self-burn must stay a *real but readable* cost (ebb sweeps back over you). Tune ebb curve + thickness live.
  - **⚠ Verification gap:** `node --check` + greps + logic trace done; the **in-browser canary** (`await Sim.batch(3)` + manual pledge→acquire→rank→fork→ascension) is **not yet run** — needs a live browser. Run before tagging.

- ✅ 🔧 **FX asset reorg — update the `.src` paths** (↳ from ART, 2026-06-11 · **done ENG 2026-06-11**) — all 9 `.src`/manifest paths repointed to the foldered structure (`cilia/`, `_shared/`), incl. the dragonfire/chaosfire circles. Verified every path resolves to a real file; zero bare `assets/fx/<file>.png` refs remain; `node --check` clean. **The index.html path fixes are now committed (`331ae61`) alongside the asset moves — both on `main` locally; push together (still unpushed).** Original handoff retained below. `assets/fx/` is now foldered **by owner** (`cilia/` for the fire-god kit, `_shared/` for god-agnostic FX) per `assets/fx/README.md`. Greppable old→new (sprite-var anchor; line numbers drift):
  | sprite/key | old `.src` | new `.src` |
  |---|---|---|
  | `FW_SPR` | `assets/fx/fw.png` | `assets/fx/cilia/wave.png` |
  | `FR_SPR` | `assets/fx/fr.png` | `assets/fx/cilia/ring.png` |
  | `FC_SPR` | `assets/fx/fc.png` | `assets/fx/cilia/cross.png` |
  | `FT_SPR` | `assets/fx/ft.png` | `assets/fx/cilia/ground-trail.png` |
  | `FP_SPR` | `assets/fx/fp.png` | `assets/fx/cilia/pillar.png` |
  | `fx.thrust` | `assets/fx/thrust.png` | `assets/fx/_shared/thrust.png` |
  | `fx.slash` | `assets/fx/slash.png` | `assets/fx/_shared/slash.png` |

  Not-yet-wired (use the new home when you wire them — no migration): `chaosfire-circle`/`dragonfire-circle` → `cilia/` (see the ground-circle task); `explosion-0..8` → `_shared/` (currently unreferenced — if they turn out to be the Cinderburst nova, move to `cilia/` and ping Artist). **Verify:** grep proves zero `assets/fx/<bare>.png` refs remain; `python dev.py` → all fire FX still render.

- ✅ 🔧 **Fold `assets/char/` by faction** (↳ from ART, 2026-06-11 · **done ENG 2026-06-11**, `f13ce54`) — 248 char sprites folded into `player/`(72) · `goblins/`(112) · `wolves/`(64) and the 200 manifest paths repointed in one atomic commit via `fold-assets.py --apply`. Verified: 0 flat files remain, every `assets/char` path resolves, the index.html diff is a pure char-path rewrite, `node --check` clean, renames 100% (history preserved). Hurt-pose handoff paths updated to `goblins/`·`wolves/`. **Phase 2 = same tool for `tile/`, later** (fill its `FAMILIES` map). Scheme: `assets/README.md`.

- ◻️ 🎨 **Level-up screen art-direction pass** (↳ from ART, 2026-06-11 · spec [`specs/levelup-screen.md`](specs/levelup-screen.md)) — bring `#g-stat-pick` to the reference mockups' fidelity. Already ~80% there structurally; the spec is a per-element redline splitting **CSS-only polish (P1, no new art — divider, engraved card frame, rarity-label flank, amber confirm fill)** from the painted-art layer. **Build P1 first** (biggest fidelity jump, engineer-only). Key enabler to wire: the **image-icon override** — in `_paintDraft` swap `<span class="sc-icon">${card.icon}</span>` for `<img class="sc-icon-art">` when `CARD_ICON_ART[card.iconKey]` exists (rarity ring stays CSS); **confirm cards carry a stable `id`/`iconKey`** (don't key off `card.name`). Art assets (icons/filigree/frame) land per the manifest as Artist follow-ups. Verify both themes (Cilia warm + nameless-knight cool).

- ✅ 🎨 **Chaosfire + dragonfire ground-circle sprites** (↳ from ART, 2026-06-11 · **done ENG 2026-06-11**, `331ae61`) — `CHAOSFIRE_CIRCLE_SPR`/`DRAGONFIRE_CIRCLE_SPR` (`assets/fx/cilia/`) threaded through the Burning Body ring/nova spawns (`spr:` field) and drawn additively per-substance. Original render spec below.
  <details><summary>detail (render spec)</summary>

  Replace the procedural fill in **`gDrawFireFields`** (~`index.html:5776`) for these substances:
  - **Load** (FR_SPR pattern): `const CHAOSFIELD_SPR=new Image(); CHAOSFIELD_SPR.src='assets/fx/cilia/chaosfire-circle.png';` + dragonfire; `const FIELD_SPR={chaosfire:CHAOSFIELD_SPR, dragonfire:DRAGONFIELD_SPR};`
  - **Draw:** per field, if `FIELD_SPR[f.substance]` is loaded → additive `drawImage(spr, ox-R, oy-R, 2*R, 2*R)` (R=`f.r`), `globalAlpha = fade` (× optional gentle pulse `0.85+0.15*Math.sin(gFrame*0.25)`), and **skip** the radial-gradient wash + FT_SPR scatter for that field (the sprite IS the fill). Keep the procedural path as fallback when unloaded (the `haveSpr` pattern, like `fr.png`).
  - **Sizing:** flame rim sits ~0.76·R, soft wisps ~0.92·R → `D=2R` reads as a natural soft-edged burning disc just inside the damage radius. No `FR_RING_FRAC`-style constant needed (it's a filled disc, not a band).
  - **Color shift is intentional:** new dragonfire art is **prismatic rainbow** (canonical dragonfire), replacing the old greenish-gold gradient (`:5790`); chaosfire = dark crimson (was the purple→red gradient `:5789`). Expect the new look.
  - **Scope:** substance-keyed → immediately upgrades the **Dance-of-Fire climax** field (the only current `gSpawnFireField` caller, `:5834`). To give **Burning Body's Chaos Crown** "great burning circle" (today a patch-ring via `_laySettleRing`) and **Dragonheart's** at-feet pool the same painted disc, route those through `gSpawnFireField` instead of patch-trails — **engineer's logic call**, flagged not done.
  - **Verify:** `node --check` + grep keys + `python dev.py` → trigger a chaosfire/dragonfire field; confirm the disc renders additively, scales with the field, fades out.
  </details>

- ✅ 🎨 **Burning Body fire-ring art upgrade — one-constant wiring** (↳ from ART, 2026-06-11 · **done ENG 2026-06-11**: `FR_RING_FRAC` set to 0.76; new ring art at `cilia/ring.png` live via the reorg) — `assets/fx/fr.png` replaced with a nicer hand-painted ring (wispier filaments + a subtle interior heat-haze, no longer hollow). **The only `index.html` change: `FR_RING_FRAC 0.59 → 0.76`**. The new ring's bright band sits at frac **0.759** of the half-width (old was 0.61); the draw already sizes `D = 2*traveled/FR_RING_FRAC` so the bright band lands at the damage radius — leave it at 0.59 and the visible ring renders ~29% larger than where it hits. No manifest/key/draw-loop change (same `FR_SPR`, now at `assets/fx/cilia/ring.png` — see the FX-reorg task for the `.src` path move; still black-bg `'lighter'`; background floored to true black so no square wash). Affects all ring modes (Firebloom / Dragonbreath breathe / Chaos Crown settle / remote-visual) — all fine. **Verify:** pledge Cilia → Burning Body → reach Form @5 Firebloom; confirm the bright band tracks the damage edge and the interior reads as warm haze. Source/tool: `tools/fx-ring-heatfill.py` (`--no-fill` cleans a baked-fill source), masters in `art/fx/cilia/burning-body-ring-*.png`.

- ✅ 🎨 **Wire the new `world.treesmall.*` tree set + verify re-sliced large trees** (↳ from ART, 2026-06-12) — **done 2026-06-12** (same change as the formation-forest task above). Wired all 9 `world.treesmall.*` keys; re-sliced large `tree-0..8` are drop-in (same keys/paths); set `TREE_FOOT=0.94` (re-measured uniform foot via PIL, both sets); small trees render smaller via a smaller draw scale (both sets fill their canvas, so scale is the lever). Mixed small + large via the new formation generator. `node --check` + grep verified; full-canopy/feet-on-ground visual check pending Josh.
  <details><summary>detail (render spec)</summary>

  **Two deliverables, both in `assets/world/`:**
  1. **Large trees `tree-0..8` re-sliced (top-clip fix)** — Josh flagged `tree-5..8` "sliced off at the top." Confirmed: the source canopies overflow their 3×3 cells upward (cells 6,7,8 by ~33px), and the old `--frame cell` crop clipped them. Re-cut with the new `slice-variants.py --bleed 50` (expanded-window + `keep_owner`), bottom-anchored. **Same `world.tree.<n>` keys + same `assets/world/tree-<n>.png` paths → DROP-IN, no manifest/draw change.** ~838 KB total (9 files, was ~960 KB).
     - **⚠ Size-coupling to verify:** new cutouts are bottom-anchored with the **foot at fraction ~0.94** of the canvas (uniform across all 9; was a measured 0.93). Set/confirm **`TREE_FOOT` ≈ 0.94** (a ~1.5px shift at TREE_BASE=150 — trivial, but check). Canvas is now sized to the *full* (taller) tree, so at the same `TREE_BASE` the trees render marginally smaller — **bump `TREE_BASE` a touch (~+8–10%, 150→~163) if they look small**, or leave it (live knob, Josh's eyeball).
  2. **New small trees `treesmall-0..8`** — a distinct smaller/bonsai tree set (incl. a willow), bottom-anchored to the **same foot fraction ~0.94** so they share `TREE_FOOT` with the large set. ~681 KB total (9 files). Paste these manifest keys:
     ```
     'world.treesmall.0':'assets/world/treesmall-0.png', 'world.treesmall.1':'assets/world/treesmall-1.png',
     'world.treesmall.2':'assets/world/treesmall-2.png', 'world.treesmall.3':'assets/world/treesmall-3.png',
     'world.treesmall.4':'assets/world/treesmall-4.png', 'world.treesmall.5':'assets/world/treesmall-5.png',
     'world.treesmall.6':'assets/world/treesmall-6.png', 'world.treesmall.7':'assets/world/treesmall-7.png',
     'world.treesmall.8':'assets/world/treesmall-8.png',
     ```
     - **Wiring (your call):** `gInitArt` will count `world.treesmall.*` like any variant set. To mix them into the wilderness, either (a) extend `gWildTrees` placement to pick from BOTH families (e.g. a per-tree `family:'tree'|'treesmall'` + variant index, `gDrawTree` selects the keyspace), or (b) place small trees as their own scatter pass (denser/underbrush) — a **placement/design call** (PM/Josh). They draw through the same feet-anchored world-prop path as `tree-*` (same `TREE_FOOT`); a smaller `TREE_BASE`-equivalent (or a per-family scale) reads them as younger/scrub trees.
  - **Source masters:** `art/world/trees.png` (large, existing), `art/world/tree small.png` (small, new — committed). Tool now encodes the overflow fix: `slice-variants.py --bleed` (+ `--anchor`/`--foot-pad`).
  - **Verify:** `node --check` + grep each `world.tree.<n>` / `world.treesmall.<n>` key resolves to a file + `python dev.py` → wilderness trees show **full canopies (no flat tops)**, small + large variants mix, feet sit on the ground.
  </details>

- ◻️ 🎨 **Wire enemy HURT pose sprites** (↳ from ART, 2026-06-10) — 32 cutouts committed, new pose state the engine lacks (`gDrawEnemy` only picks idle/atk).
  <details><summary>detail</summary>

  Art committed for `goblinhurt`/`archerhurt`/`direwolfhurt`/`alphawolfhurt` (goblins sliced 192, wolves 256, swap at the same per-enemy `gs`). **⚠ Paths are foldered** (post char-reorg): `goblinhurt`/`archerhurt` → `assets/char/goblins/…`, `direwolfhurt`/`alphawolfhurt` → `assets/char/wolves/…`.
  - **Add to `ART_MANIFEST`** (no-separator id, like `goblinatk`): `'char.goblinhurt.<8 dirs>':'assets/char/goblins/goblinhurt-<dir>.png'`; archer → `goblins/`; direwolf/alphawolf → `wolves/` (all `assets/char/<faction>/<id>-<dir>.png`).
  - **Draw intent:** select `char.<defId>hurt.<dir>` while damage-flash active (`e.hitFlash>0`), priority over idle, same `gs` (no per-pose mult). `_bid` selection ~`index.html:7784`.
  - **Two flags:** (a) `hitFlash` is ~8 frames — likely too brief; give the swap its own short `_hurtHold` if it flickers (the wolf `biteStrike` lesson). (b) Scale parity: `check-pose-scale.py` vs idle reads goblin ~0.97 / alphawolf ~0.99 (ship at parity) but archer ~0.84 / direwolf ~0.88 (wider hunched recoils) — if the flinch reads oversized, add a per-pose mult in `gDrawEnemy` or ping Artist to re-pad.
  - **Verify:** `node --check` + grep each key + `python dev.py`, all 8 facings, hard-refresh.
  </details>

- ◻️ 🟢 **Unwired art inventory — cobble tiles + Sanctum props** (audit 2026-06-10) — prepped art committed to `assets/`, zero refs in `index.html`.
  <details><summary>detail</summary>

  - **Cobble tiles** (`assets/tile/cobble-0..3`, `2da0b0a`) — ⏸️ deferred (Josh 2026-06-10). Cobble is *opaque ground*; town (HUB_MAP) ground is all `TILE_FLOOR` — same id as the dungeon's dark floor. Wiring = either a Sanctum-only `inTown` branch in `gTileArt` (cobble in town, dark stone in dungeon) **or** replace `floor` globally. Pick up by deciding that fork.
  - **Sanctum set-piece props** (`assets/world/`: well, fountain, barrel, banner-large/small, dungeon-gate, market-stall, target-stand, todust-sign, torch-post, training-dummy, weapon-rack — 12, `2da0b0a`) — **per-prop work**: each needs a draw hook (town props load via a separate pipeline, not the manifest). Some map to existing town objects (training-dummy, target-stand, weapon-rack, torch-post, well, fountain) — confirm the object + draw site before wiring; decide procedural-replace vs new object. Raster → `devicePixelRatio`. Best sized as its own focused session; *which* props matter is partly an art-direction/PM call.
  - **Lesson:** always check a tile cut's alpha before assuming the tile-art path — opaque → `gTileArt` (blit-and-return); transparent cutout → an overlay path that draws ground first (`gTileProp`). (Rock/spike tiles already wired this way, `c7ddc67`.)
  </details>

- ◻️ 🎨 **Threat-tier EYE glow — restyle the placeholder** (↳ from ART, 2026-06-11) — refine `gDrawThreatGlow` from floating two-dots to an eye-anchored **subtle** tell: enemy eyes ignite yellow (tier 1) → red (tier 2). No new sprites; the look is decided (Artist) — this is the per-frame draw + the runtime-cheap eye-anchoring, which is engine-owned. **Evaluate in-game at true scale/motion behind a dev knob** (an offline still is the wrong medium for this — Artist mock discarded).
  <details><summary>detail (Artist spec)</summary>

  **The look (decided with Josh):** eyes **ONLY** — no body wash (a full-body tint was prototyped and rejected: "looks terrible"). A *subtle* "this one's harder" signal, escalating yellow→red. Tier flag already exists: `e.threatTier` 0/1/2, stamped in `_wildScaleEnt` (nights 4/8). Base goblin sprites already have glowing yellow eyes, so tier 1 = "ignite the existing eyes brighter," tier 2 = "shift them red."
  - **Colours:** start from the placeholder's yellow `#ffd84d` / red `#ff4030` (or a hotter ignite — yellow ~`rgb(255,224,90)`, red ~`rgb(255,70,50)`). Additive (`globalCompositeOperation='lighter'`).
  - **Subtle:** small tight eye glow + a faint soft halo; NOT a big bloom. Optional slow desynced pulse (reuse the existing `gFrame + per-enemy phase` sine; tier-2 ~1.5× faster for menace) — or steady; make it a knob.
  - **Anchoring (the real work):** the placeholder draws two dots at a fixed head offset off the hitbox `e.r` — they don't sit on the real eyes and don't track facing. Two cheap options (engineer's call — **NOT** per-frame pixel detection, too costly at >100 sprites):
    - **(preferred) Boot-time cached eye-mask:** at `gInitArt`, extract each char sprite's bright-yellow eye pixels ONCE into a small mask canvas cached in `gArtReg`; per frame blit it tinted to the tier colour, additively, at the sprite's transform. Pixel-accurate per facing, **auto-hides when the enemy faces away** (back facings have no eye pixels → empty mask), one cached blit/frame. Eye-key that works (validated in the Artist mock, reuse as the extraction filter): a pixel is an eye if `a>120 && r>200 && g>150 && b<110 && (r-b)>115`, within the upper-head band `y ∈ [0.12, 0.40]·H`, then dilate 1px to round the 2–3px blobs.
    - **(simpler) Per-(enemy,octant) eye-anchor table:** offsets for eye positions per facing; draw 1–2 additive dots there, suppress on the 3 back octants. Less accurate, no boot step.
  - **Hook:** `gDrawThreatGlow(e)` (already called post-draw for any `threatTier` enemy, ~`index.html:8729`) — refine in place. **Perf:** keep cheap (>100 sprites) — no per-sprite radial gradients / `shadowBlur`; cached-mask blit or a couple of `arc()` fills only.
  - **Acceptance:** the tell reads as "harder" in a moving pack at game zoom *without* shouting — judge live, not on a still. If it can't read subtly at true scale, nudge intensity up (a hotter core) before adding size.
  </details>

- ⛔ 🟢 **Custom sprite invisible to self in singleplayer** (design-gated) — your custom sprite broadcasts to other players (live in MP via `df_player_sprite` + `ccPixelsToCanvas`) but your own local render + char/inventory previews still draw the knight. Cosmetic, not a bug. **Blocked on a PM/CD design call:** should the local hero reflect the custom sprite (route local draw + previews through `ccPixelsToCanvas(...)`, knight as fallback), or is the knight canonical (demote the creator to MP-cosmetic-only / cut it)? Not an engineer drive-by.

- ◻️ 🔧 **CHANGELOG housekeeping** (↳ from PM, 2026-06-10) — (a) ✅ `docs/archive/changelog-dungeon-forge.md` now tracked (Session 15). (b) Fold the shipped items (0, 0b, 0c, 1, 3, 4) into the next tag. Going forward, sweep the changelog by era/half-year, not per release.

---

## 🟨 Artist lane

- ◻️ 🎨 **No-pause level-up sidebar — painted-frame / icon pass** (↳ from ENG, 2026-06-11 · ref `art/reference images/new level up screen (no pause).png`) — the sidebar shipped functional with the existing CSS ornate frame (`.lvl-portrait`) + the existing `assets/portraits/cilia.jpg` portrait. To reach the mockup's fidelity: a **painted panel frame** (the ornate gilt border around the card list, not just the portrait), **per-card-row icons** (the draft uses emoji glyphs today — `CARD_ICON_ART`-style overrides), and **rarity filigree**. Cards are now horizontal rows (icon-ring · rarity · name · desc · Favor chip), stacked vertically in a left-docked panel. Engineer wires assets per manifest once sliced. *(Overlaps the existing "Level-up screen art-direction pass" / `specs/levelup-screen.md` — fold together; that spec predates the no-pause reflow, so re-baseline it against the new row layout.)*

- ◻️ 🎨 **Cilia in-game sprite — from the new full-body master** (↳ from Josh, 2026-06-12) — source master parked at `art/gods/cilia full body.png` (1535×1024, full standing figure, transparent-ready). Josh: "will be used as an in-game sprite of Cilia." **Pipeline decision pending** before slicing: what *kind* of in-game presence is she — a single static NPC at the shrine (one cutout, feet-anchored, `world.cilia`-style key), or a directional/animated avatar (needs a turnaround, not one pose)? Confirm the use with Josh/PM, then bg-remove → size to the established char/world scale → `ART_MANIFEST` handoff to Engineer. Don't slice until the use is settled (one pose vs. turnaround changes everything).

- *(eye-glow look **decided & handed to Engineer** 2026-06-11: eyes-only, subtle, yellow→red; full-body tint tried & rejected. See the Engineer-lane handoff + Done.)*

---

## ✅ Done (recent track record — prune to git history as it grows)

- **2026-06-12 — Asset-folder stewardship: scheme set, fold tooling ready** (Artist, ↳ from Josh — new standing
  responsibility) — Josh assigned the Artist ongoing **upkeep of `assets/`** as the game scales across areas
  (`world/` was filling from one area's set-dressing). Decided axis (Josh-approved): **`world/` folds by AREA**
  (`goblin-forest/` · `sanctum/` · `_shared/` for cross-area props) — a new area = a new folder; **`tile/` folds
  by TERRAIN TYPE** (tiles recur across biomes). Recorded the responsibility in `agents/artist/artist.md`
  (+ scope), rewrote `assets/README.md` with the decided per-kind taxonomy, extended `fold-assets.py` `FAMILIES`
  (world + tile), and **taught `slice-variants.py` to auto-route** tile/world outputs into their family folder +
  emit the foldered manifest path (so new slices don't re-flatten — the "migrate the tool with the pipeline"
  rule). Dry-ran both folds CLEAN (44 world + 48 tile files, every one mapped). Engineer-lane handoff filed for
  the atomic `--apply` (move + manifest rewrite). Tooling/docs only — not deploy-affecting; committed.
- **2026-06-12 — Forest trees + forest grass + barrel/crate sliced** (Artist, ↳ from Josh) — four asset families
  cut from new masters: (1) **`world.foresttree.0..8`** — a 3rd tree family (fir/pine, willow, banyan, oaks; 256²,
  bottom-anchored foot ~0.94 to share `TREE_FOOT` & the `gDrawTree` path; `slice-variants --bleed 50` so canopies
  aren't clipped; QA CLEAN). (2) **`tile.forestgrass.0..8`** — opaque 96² full-bleed forest-floor grass (small
  custom PIL crop: inner-square inset past the sheet's dark bushy fringe → matches the live `grass-*` treatment,
  verified seamless-tiling, no dark grid). (3+4) **`world.barrel` / `world.crate`** — single transparent props
  (white-bg flood-fill + erode via the slicer's `cut_cell`; barrel replaced its tiny 39×43 placeholder, crate new).
  All **new ids** (Josh: add, don't replace existing tree/grass sets). Engineer wiring handoff filed (Engineer lane)
  with paste-ready manifest snippets. ~908 KB total. Committed locally (deploy-affecting — awaiting Josh push auth).
- **2026-06-12 — Tree sprites: small set sliced + large-tree top-clip fixed; `slice-variants.py` gains `--bleed`** (Artist, ↳ from Josh) — sliced the new `art/world/tree small.png` 9-variant sheet → `assets/world/treesmall-0..8` (new smaller-tree variety incl. a willow), and re-sliced the existing large `tree-0..8` to recover canopy tops Josh flagged as clipped on `tree-5..8`. **Root cause:** the bottom/middle source trees overflow their 3×3 cells upward (~33px), and `slice-variants.py` (which crops to the exact cell) had no overflow recovery. **Fix — ported `--bleed` (expanded-window + `keep_owner`) from `slice-turnaround.py` into `slice-variants.py`**, plus `--anchor bottom`/`--foot-pad` so every recovered variant shares one foot baseline (foot fraction ~0.94, uniform across all 18). QA'd both magenta contacts CLEAN (full canopies, feet aligned, no neighbour fragments; bg-leak metric over-reports on bright foliage). Engineer handoff filed (Engineer lane): `treesmall` keys to wire + verify `TREE_FOOT≈0.94`/`TREE_BASE`. *Lesson: a recurring cutout defect class belongs IN the slicer — tree-canopy-overflow on a variant sheet is now a documented flag.* Committed locally (deploy-affecting — awaiting Josh push auth).
- **2026-06-12 — Cilia pledge-card art fixed + optimized** (Artist, ↳ from Josh) — Josh's updated bust (full flaming hair no longer cut off at the top of frame) had landed as an unoptimized 2.1 MB `assets/gods/cilia.png` while `index.html:765` still pointed at the deleted `assets/gods/cilia.jpg` → broken pledge card. Converted the new master → **`assets/gods/cilia.jpg`** (1408×792, 204 KB — in family with bhumi 170 / boreas 200 / ikras 169 KB), removed the 2.1 MB PNG. **No `index.html` change** (line 765 already references `cilia.jpg`). QA'd: full hair contained, no flatten/banding, dark bg intact, crops clean to the 130px `top center` card strip.

- **2026-06-11 — No-pause level-up sidebar** (Engineer, ↳ from CD/Josh · ref `art/reference images/new level up screen (no pause).png`) — the wilderness level-up no longer touches `gPaused`: leveling bumps `gDraft.pending` + flashes a bottom-left FAB (`#g-levelup-fab`); clicking it opens a left-docked, non-blocking `#g-stat-pick` sidebar (container `pointer-events:none`, only the `.lvl-dock` interactive → world clicks fall through to the canvas, player keeps move+attack and stays vulnerable). Draft logic **lifted out of the `gWildShowStatPick` closure to module scope** (`gDraft` state + `gDraftQueue/Generate/Paint/Select/Open/Close/Confirm/Reroll/UpdateFab/Reset`, `_draftUpgradeCard/_draftBuyRank`), so state persists across panel open/close and the §8 bot resolves it headlessly (gSimDraft/gSimEvolution shapes + all Favor-spend logic preserved verbatim). Cards reflowed to vertical **card-rows** (`.sc-body`). Lv 5/10 **Form/Ascension fork** renders its 2 options as rows **in the same sidebar** (reuses `_evolutionOptions`/`_chooseEvolution`); `gOpenEvolutionMenu` now serves the skillforge dev path only. `node --check` clean; greps confirm zero draft-path `gPaused`, no orphaned closures, harness reads intact. **⚠ In-browser canary pending** (`await Sim.batch(3)` + manual: level up→FAB→open→pick→confirm, move/attack with panel open, reach Lv 5 fork, die-with-panel-open) — needs a live browser; run before tagging. Artist follow-up filed (painted frame / card icons). Committed locally (deploy-affecting — awaiting Josh push auth).
- **2026-06-11 — World props wired: favor coin + treasure chests** (Engineer, ↳ from ART) — 3 manifest entries (`world.favorcoin`/`chest-closed`/`chest-open`) auto-load via `gInitArt`; `gDrawFavorOrbs` draws the coin sprite (gold pickup glow + gentle bob kept, procedural disc as fallback); both chest draw sites (village `~15159` + wolf-camp `~15204`) route through a shared `_drawChestSprite()` helper (open art once `looted`, else closed; feet-anchored; guarded camp chest dims via reduced alpha; procedural box fallback retained). Pure render-only (gated `inWilderness`, no logic/state) → Sim/MP-safe. `node --check` clean + greps confirm wiring. *Sizing knobs: `FAVORCOIN_PX 22`, `CHEST_PX 30`. **Verify in-game with a hard-refresh** (browser eyeball pending) — reopen if coin/chest scale or anchor reads off.*
- **2026-06-11 — `char/` reclassed into per-type folders + player→knight class** (Engineer, ↳ from ART) — atomic `reclass-char.py --apply` (250 files moved, 200 paths + 72 keys rewritten, slash/thrust → `fx/knight/`); 16 draw-code edit-groups applied (art layer → `knight`; game-logic `kind:'player'` / `SpriteRegistry('player')` fallback preserved). Verified: all 74 draw-constructed keys resolve to a manifest entry + real file, staged tree case-exact for Pages, `node --check` clean. **Diagnosed Josh's Pages atk/heavy 404 along the way: committed HEAD was already case-correct → stale Pages/CDN cache; the fresh knight paths sidestep it.** Committed atomically (deploy-affecting — awaiting Josh push auth).

- **2026-06-11 — Threat-tier glow look decided** (Artist) — eyes-only, subtle, yellow→red. A full-body tint was prototyped and rejected ("looks terrible"); the eyes-only direction is set and handed to Engineer (lane). *Process lesson: a runtime draw-effect is engineer-owned and must be prototyped in-canvas/in-game, not in an offline raster mock — the Artist sets the look direction + palette, not a simulated render.*
- **2026-06-11 — Item 0 Player animation pass closed** (walk · dash · heavy windup all wired + playtested OK).
- **2026-06-11 — Player WALK cutout halo + boot loss RESOLVED** (Artist) — defringe-v2 (full antialiased ramp to `α<245`) + `--shadow-bg`/`--shadow-lum 13 --shadow-band 0.90` boot-protected re-cut of E/NE/SE (+mirrors). All 8 dirs full-ring fringe ~12–17 (idle 18–22), boots intact, registration unchanged → no `index.html`/manifest change. Lessons crystallized in `agents/artist/memory.md`. *(Verify in-game with a hard-refresh; reopen here if a halo persists.)*
- **2026-06-10 — Rock + spike-fence tiles wired** (`gTileProp` overlay path — cutouts, not opaque ground).
- **2026-06-10 — Wolf camps stream packs by player proximity** (no more ~160 always-live wolves; per-camp clear/respawn survives unload).
- **2026-06-11 — `slice-turnaround.py` per-type-folder native** (Artist) — the slicer now auto-routes its 8 cutouts into `assets/char/<group>/<type>/` and emits the two-level manifest paths + the `player→knight` key rename, driven by importing `reclass-char.py`'s `classify`/`TYPE_GROUP`/`TYPE_RENAME` (single source of truth — adding a new enemy stays one line there). Unknown id → loud WARN + flat `assets/char/` fallback; `--assets-dir` is the manual escape hatch (verbatim, no routing/rename). Verified: `route()` correct for all enemy/player/knight/unmapped cases, real goblin re-slice landed in `goblins/goblin/` with `char.goblin.*` keys (QA CLEAN, reverted), `slice-variants.py` import chain intact, `--help` fixed on cp1252 (two pre-existing `→`→`->`). Tooling-only, not deploy-affecting. *Closes the "migrate the tool when you migrate the pipeline" debt from the per-type reclass.*
- **2026-06-09 — `slice-turnaround.py` path-native** (writes `assets/char/<id>-<dir>.png` + path snippet; base64 step removed).
- **2026-06-09 — Wolf lunge-bite pose reads** (`_biteHold` 24f draw-only dwell).
- **2026-06-09 — Inert STR/DEX/INT scaling shims removed**; `wildDmgMult` removed; %damage flows uniformly through `wildBuffs.damagePct`.
- **2026-06-09 — Skill tooltips show live buffed damage**; bow kill drops an XP orb; vestigial sword-charge player state removed (wire-compat held).
- **2026-06-09 — `DUNGEON_FORGE_CTO_DOC.md` → `TO_DUST_CTO_DOC.md`** (+ 14 referencing files; `DF1` seed prefix & localStorage key frozen for compat).
