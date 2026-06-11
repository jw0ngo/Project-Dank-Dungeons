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

- ◻️ 🎨 **Wire world TREE props — 9-variant scatter set** (↳ from ART, 2026-06-11) — 9 transparent tree
  cutouts committed to `assets/world/`; new world prop, no draw hook/placement yet (systems work, not just
  a manifest paste).
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

- ◻️ ✨ **Heavy charge locks out the normal swing** (↳ from PM playtest, 2026-06-11 · roadmap #6 `approved`) —
  while the heavy attack is charging (`p.heavyWindingUp === true`, `index.html:3327`) the player can still fire a
  normal swing; gate it out. Suppress the swing trigger (LMB→`gDoSwingAt`, dispatch `~index.html:3517`) whenever
  `heavyWindingUp` is set, so committing to a heavy means committing — no free swing mid-charge. **Why:**
  weighty-combat directive (Josh, standing) — a committed action must compromise other options; charging heavy
  shouldn't let you also poke. Engineer owns whether to drop the input or queue it; product intent = no swing
  damage/animation while winding up a heavy.

- ◻️ ✨ **Item 7 — Mana economy & skill management** (↳ from PM playtest, 2026-06-11 · roadmap #7 `approved` ·
  spec [`specs/mana-economy.md`](specs/mana-economy.md)) — make mana a real, shared resource. Phased:
  - [ ] **Phase 1 — class mana + cooldown rebalance** (quick, standalone) — tighten `WeaponRegistry.sword`
    costs/CDs (`index.html:2476-2495`) + the `sw.*` reset block (`:14583-14584`) so **1 leap + ~3s WW ≈ empties
    the 100 pool**. Starting numbers in the spec (leap 35→45 & CD 200→150f; WW drain 4.8/s→18/s & CD 120→90f;
    heavy 25→30; dash 15→18). Mana leads, CD is rhythm — don't double-gate. Confirm `SKILL_STAT_FLOOR` (`:2542`).
  - [ ] **Phase 2 — God Skills drain mana/sec, rank-scaled** — add an `mpCost` key to `IMBUE_PATHS.cilia.burningBody`
    `base`/`waveStep`/`formStep` (`:13527-13567`) so it auto-scales via `gGodFireParam`; subtract
    `gGodFireParam(p,id,'mpCost')*dt` in `gTickBurningBody` (`:3736`). Base ≈ 5mp/3s; curve in spec. Layered on
    regen (net = regen − Σdrains), so over-committing bleeds the pool even idle.
  - [ ] **Phase 3 — toggle/hotkey + HUD + Sim hooks** — per-player toggle state (acquisition-order key 1–9, default
    ON, assign at acquire `:13691`); `keydown` 1–9 branch; gate `gUpdateGodSkills` (`:3719`) on active/not-dormant;
    HUD row near the MP bar (`:4233`). **Starvation = dormant-resume, pay in key order 1→9** (DECIDED Josh
    2026-06-11 — no fork). **AI-native (required):** add `Sim.toggleGodSkill(n)` + expose per-skill `{key,active,dormant,mpCostPerSec}`
    + `mp` in `Sim.observe()` — toggles re-add the input hook item 2 had dropped.

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
  - [ ] **Trail of Embers** — add `kind:'distance'` registry entry + a movement-accumulator branch in `gUpdateGodSkills` (dash trail spawn already removed; just the updater branch remains).
  - [ ] **Pyroclasm** — add `kind:'interval+autotarget'` entry + a nearest-cluster helper + updater branch (heavy spawn already removed).
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

- *(eye-glow look **decided & handed to Engineer** 2026-06-11: eyes-only, subtle, yellow→red; full-body tint tried & rejected. See the Engineer-lane handoff + Done.)*

---

## ✅ Done (recent track record — prune to git history as it grows)

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
