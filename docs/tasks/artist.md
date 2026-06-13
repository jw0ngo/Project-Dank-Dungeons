# 🟨 Artist — Tasks

**Owner: the Artist.** Only the owner flips a status here; **any agent may file a task in** (tag it
`(↳ from <role>, date)`). Conventions + the status/type legend live in the hub: [`../TASKS.md`](../TASKS.md).
Strategy/priority: [`../ROADMAP.md`](../ROADMAP.md). Sibling docs: [`pm.md`](pm.md) · [`engineer.md`](engineer.md).

---

> **New-asset tasks here flow from the PM's Asset Audit** (reuse-first pipeline, [`agents/product/product.md`](../../agents/product/product.md) → "The Asset Audit") — every art-bearing feature is audited for reuse first; only genuinely-new assets land here. **You're the inventory authority:** if a task says 🆕 NEW but an existing asset/master already covers it, downgrade it to ♻️ REUSE and tell the engineer the key (a cheap check that saves the work).

- ◻️ 🔧 **Commit two untracked source masters** (↳ from ENG, 2026-06-13) — `art/world/obelisk.png` and
  `art/reference images/new level up screen (no pause).png` sit untracked in the working tree; the obelisk
  engineer-handoff cites the master as committed ("Source master `art/world/obelisk.png`"), so the record is
  ahead of the repo. Commit them in your lane (`art/` paths only — masters aren't deploy-affecting).

- ◻️ 🎨 **No-pause level-up sidebar — painted-frame / icon pass** (↳ from ENG, 2026-06-11 · ref `art/reference images/new level up screen (no pause).png`) — the sidebar shipped functional with the existing CSS ornate frame (`.lvl-portrait`) + the existing `assets/portraits/cilia.jpg` portrait. To reach the mockup's fidelity: a **painted panel frame** (the ornate gilt border around the card list, not just the portrait), **per-card-row icons** (the draft uses emoji glyphs today — `CARD_ICON_ART`-style overrides), and **rarity filigree**. Cards are now horizontal rows (icon-ring · rarity · name · desc · Favor chip), stacked vertically in a left-docked panel. Engineer wires assets per manifest once sliced. *(Overlaps the existing "Level-up screen art-direction pass" / `specs/levelup-screen.md` — fold together; that spec predates the no-pause reflow, so re-baseline it against the new row layout.)*

- ◻️ 🎨 **Cilia in-game sprite — from the new full-body master** (↳ from Josh, 2026-06-12) — source master parked at `art/gods/cilia full body.png` (1535×1024, full standing figure, transparent-ready). Josh: "will be used as an in-game sprite of Cilia." **Pipeline decision pending** before slicing: what *kind* of in-game presence is she — a single static NPC at the shrine (one cutout, feet-anchored, `world.cilia`-style key), or a directional/animated avatar (needs a turnaround, not one pose)? Confirm the use with Josh/PM, then bg-remove → size to the established char/world scale → `ART_MANIFEST` handoff to Engineer. Don't slice until the use is settled (one pose vs. turnaround changes everything).

- ◻️ 🎨 **God-skill icons — Cilia set (3), SHARED draft-card + HUD action-bar** (↳ from PM, Josh-approved 2026-06-12 · spec [`specs/mana-economy.md`](../specs/mana-economy.md) Phase 3 "God-Skill Action Bar") — **one icon per god skill, used in BOTH** the level-up draft card **and** the new HUD action-bar slot (author one set, not two). Cilia launch = **3 icons**: **Burning Body** (ignite-aura / AOE burst-fire), **Trail of Embers** (burning trail), **Pyroclasm** (ranged fire pillars). Read clearly at small HUD size *and* on the draft card; fit the existing `CARD_ICON_ART` keying (`specs/levelup-screen.md` image-icon override) — slice + manifest snippet to Engineer with a stable `iconKey`. Each reads as a *Cilia/fire* skill (warm palette) to pair with the fire-red god border. +1 icon per future god skill. *(Pairs with the two Engineer-lane action-bar tasks.)*

- *(eye-glow look **decided & handed to Engineer** 2026-06-11: eyes-only, subtle, yellow→red; full-body tint tried & rejected. See the Engineer-lane handoff + Done.)*

---

## ✅ Done (recent track record — prune to git history as it grows)

- **2026-06-12 — Title/landing-screen logos prepped (2)** (Artist, ↳ from Josh) — bg-removed + halo-cleaned the two
  new title masters (`art/reference images/title screen {welcome,survive}.png`) for a **temporary Pages landing
  screen**. Same opaque-painted-checkerboard gen art as the FX → real `--bg white` edge-seeded cut + `--dewhite`
  (the ornate logos have black smoke + dark iron filigree = the neutral-halo case); light `--erode 1` to spare the
  sharp filigree spikes; no `--global` needed (open spiky frame → all gaps border-connected, no enclosed pockets).
  Downscaled to 1280-px longest side + optimized (welcome 1019 KB, survive 529 KB). New **`assets/ui/` kind**
  (`ui/title/welcome.png` + `survive.png`), documented in `assets/README.md` (folds by UI surface). Engineer handoff
  filed (Engineer lane) with composition intent + the HiDPI/load-weight notes. Committed (deploy-affecting — push w/ Josh).
- **2026-06-12 — Dragonfire/chaosfire FX sprite set sliced (6 sprites)** (Artist, ↳ from Josh) — cut six per-substance
  fire FX from new masters for the 3 Cilia God Skills: **pillars** (`dragonfire-/chaosfire-pillar`, tight-AR, reskin
  `FP_SPR`/`gFirePillars`), **bursts** (`-explosion`, reskin `FIREEXPLOSION_SPR`), **ground decals** (`-ground`,
  scorched-floor disk). The "transparent" gen art was actually an **opaque painted near-white checkerboard** → real
  bg-removal, edge-seeded `--bg white` keying (white-hot dragonfire cores survive as interior). **Josh flagged a white
  halo on the 3 black-smoke sprites** (both grounds + chaos pillar): the AA edge was figure-blended-with-white = pale
  *neutral* ramp surviving the brightness key. Fixed with a new **`slice-single-fx.py --dewhite`** pass (neutral-gated
  white-spill alpha suppression — fades the grey ramp to transparent, leaves saturated flame wisps) + erode 2; all 6
  QA-clean over a **dark** bg (the worst case — magenta misled me). Added `--frame tight` (keep native AR for tall
  pillars/jets) + `--dewhite` to the tool. Engineer handoff filed (Engineer lane) — **key flag: chaosfire = NORMAL
  alpha** (black smoke is the art; additive erases it), dragonfire = additive. Masters in `art/fx/cilia/`. ~565 KB.
  Committed locally (assets/tool/docs — deploy-affecting assets await Josh push auth).
- **2026-06-12 — Asset-folder stewardship: scheme set, fold tooling ready** (Artist, ↳ from Josh — new standing
  responsibility) — Josh assigned the Artist ongoing **upkeep of `assets/`** as the game scales across areas
  (`world/` was filling from one area's set-dressing). Decided axis (Josh-approved): **`world/` folds by AREA**
  (`goblin-forest/` · `sanctum/` · `_shared/` for cross-area props) — a new area = a new folder. **`tile/` stays
  FLAT** (decided via the follow-up spec — type is already in the id; area, the only new fact, isn't a tile
  property). Recorded the responsibility in `agents/artist/artist.md`
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
- **2026-06-11 — Threat-tier glow look decided** (Artist) — eyes-only, subtle, yellow→red. A full-body tint was prototyped and rejected ("looks terrible"); the eyes-only direction is set and handed to Engineer (lane). *Process lesson: a runtime draw-effect is engineer-owned and must be prototyped in-canvas/in-game, not in an offline raster mock — the Artist sets the look direction + palette, not a simulated render.*
- **2026-06-11 — Player WALK cutout halo + boot loss RESOLVED** (Artist) — defringe-v2 (full antialiased ramp to `α<245`) + `--shadow-bg`/`--shadow-lum 13 --shadow-band 0.90` boot-protected re-cut of E/NE/SE (+mirrors). All 8 dirs full-ring fringe ~12–17 (idle 18–22), boots intact, registration unchanged → no `index.html`/manifest change. Lessons crystallized in `agents/artist/memory.md`. *(Verify in-game with a hard-refresh; reopen here if a halo persists.)*
- **2026-06-11 — `slice-turnaround.py` per-type-folder native** (Artist) — the slicer now auto-routes its 8 cutouts into `assets/char/<group>/<type>/` and emits the two-level manifest paths + the `player→knight` key rename, driven by importing `reclass-char.py`'s `classify`/`TYPE_GROUP`/`TYPE_RENAME` (single source of truth — adding a new enemy stays one line there). Unknown id → loud WARN + flat `assets/char/` fallback; `--assets-dir` is the manual escape hatch (verbatim, no routing/rename). Verified: `route()` correct for all enemy/player/knight/unmapped cases, real goblin re-slice landed in `goblins/goblin/` with `char.goblin.*` keys (QA CLEAN, reverted), `slice-variants.py` import chain intact, `--help` fixed on cp1252 (two pre-existing `→`→`->`). Tooling-only, not deploy-affecting. *Closes the "migrate the tool when you migrate the pipeline" debt from the per-type reclass.*
