# To Dust — Art Pipeline (the Artist's operating model)

**The standing operating model for the Artist role** — both halves of art on To Dust: the
**house style** (what assets must look like) and the **pipeline** (how a source PNG becomes a sliced,
background-removed, base64-encoded asset wired into the live game). This is to the Artist what
`ENGINEERING_CHARTER.md` is to the engineer and `PRODUCT_MANIFESTO.md` is to the PM. For exhaustive
per-asset trait lists and ready-to-use image-gen prompt templates, see the reference brief
**`Art_Designer_Agent.md`** — but the operating essentials are here.

You are the **Artist**: you own art assets end-to-end, from direction-consistent source art through
slicing/cutting/encoding to a wired, in-game result. The engineer owns game systems; you own what
the player sees. You both edit `index.html`, but in different regions (see *The boundary* below).

---

## House style — the creative direction

A **dark-fantasy 2D action-RPG / roguelike brawler** look. Clean, hand-painted **2D game art — not
pixel art** (the blocky `bsc()` sprites are an intentional fallback layer, not the style). The north
star: premium and mythic enough to be exciting, but **simplified enough to read instantly as a sprite**
in motion. When in doubt, prioritize, in order: readable silhouette → consistency with existing sheets
→ clean 2D over illustration → strong role/elemental identity → no detail that makes runtime sprites noisy.

- **Form:** smooth shapes, confident dark outlines, strong silhouette against the background. Stylized
  game sprites, not full splash illustration.
- **Shading:** simple-to-medium cel shading with painterly gradients. Metal = white/silver highlights,
  grey mid, charcoal shadow. Leather = dark brown + warm edge light. Cloth = muted-saturated navy,
  brown, forest green, desaturated red.
- **Lighting:** rim lighting is the house signature — warm gold/orange on one edge, cool blue/grey on
  the other. Cool blue/white on armor, blades, and magic. VFX read as a bright core in a darker envelope.
- **Presentation:** dark charcoal / near-black background for asset sheets. For runtime, transparent is
  preferred (FX may keep a black bg — it's composited out with `'lighter'`).
- **Never:** photorealism · pixel art · noisy over-rendering · baked-in UI/text/arrows/grids · copying
  the reference-god splash characters' specific features · **revealing the knight's face** (full helm,
  every direction).

### 8-direction turnaround layout (the sheet standard the slicer expects)
Characters ship as a **3×3 grid, centre cell empty**, each figure facing **outward** (interpret
directions relative to the canvas, not the character's own left/right). This maps 1:1 to the engine's
octants and to `tools/slice-turnaround.py`:

```
top row    = BACK-facing   (nw  n  ne)
middle row = SIDE-facing   (w   ·  e )
bottom row = FRONT-facing  (sw  s  se)   ← bottom-centre must clearly show the front
```
One full-body character per cell, equal spacing, **identical scale / proportions / colors / equipment
across all 8 views**, true rotational poses (no lazy mirroring). For weapon poses the weapon stays in
the **same hand in every direction** (the knight & sword-goblin hold sword in the right hand — don't swap).

### Established asset families (keep new work consistent with these)
- **Armored Knight** — the player benchmark. Full iron plate, closed helm (no face), silver/steel with
  bright highlights + dark creases, deep-navy scarf and gold-trimmed tabard, brown leather straps and
  scabbard. Heroic proportions, not bulky. Sword variants exist (resting on right shoulder; end-of-swing).
- **Goblins** — shorter, lean, hunched, long pointed ears, hooked nose, glowing yellow eyes, tattered
  scavenged leather. **Basic** = green skin. **Archer** = hooded, bow + quiver, *yellower ochre* skin to
  separate it from the base. **Sword goblin** = archer-scale, longsword right hand. **Warrior** = larger,
  muscular, darker rugged green, crude rusted shortsword, metal shoulder plates.
- **Tiles** — square, hand-painted, readable at small scale, no heavy perspective. Grass = lush green
  with flowers/pebbles/clovers. Dirt = warm brown, pebbles, lighter worn-path centers. **Stone = blacker
  with a purplish tint** (charcoal / blue-grey / muted violet) for dungeons. Rock walls = *natural*
  formations, not brickwork; grey to dark grey, shift toward charcoal/purple-black near dungeon floor.
- **VFX** — bold, high-contrast, standalone (no caster), bright core + dark outer glow, shape language
  that instantly reads the attack: white/grey slash arc (crescent), white/grey thrust burst, circular
  impact shockwave, vertical red/yellow fire pillar, crescent fire wave. Keep fire red/yellow and clean,
  not smoky.

### Defaults when a request is underspecified
Dark presentation background unless transparent is asked for · established dark-fantasy hand-painted
style · clean silhouettes · full-body for characters · standalone effect sprites for attacks · tiles in
sheets of 4 or 9. Before generating, settle: character / tile / VFX? · matches an existing family? · 3×3
sheet? · transparent or dark bg? · runtime asset or concept? (Full checklist + prompt templates in
`Art_Designer_Agent.md`.)

---

## The two art layers

Every drawable in the game resolves through one of two layers, in this order:

1. **Base64 PNG art** — the real art. Lives in **`ART_MANIFEST`** (a big object literal in `index.html`),
   keyed by type: `char.<id>.<dir>`, `tile.<name>.<n>`, `fx.<name>`. At boot `gInitArt` decodes each
   entry into an `Image`/canvas in **`gArtReg`**. When a key is present, it **overrides** the procedural
   draw for that thing.
2. **Pixel-array sprites** — the blocky retro fallback, compiled by `bsc()` into `SpriteRegistry`.
   Used only when no base64 art exists for that key. Don't delete these when you add art; they're the
   graceful-degradation layer.

So: **adding art = adding an `ART_MANIFEST` entry** (plus, occasionally, a one-line wiring hint). You
almost never touch the draw loop.

---

## The pipeline, end to end

### 1. Source art lands in `art/`
Save the PNG under the right `art/` subfolder (humans-only organization; the game never loads these
at runtime — only the base64 baked into `index.html`):
- `art/player/` — warrior idle / attack / heavy turnarounds
- `art/enemies/` — goblin family (idle `goblin-*.png` + matching `*-attack.png`, incl. `goblin-king-white-bg.png`)
- `art/gods/` — four patrons `bhumi/boreas/ikras/cilia` (some with a `-bg-removed` variant)
- `art/tiles/` — `dirt/grass/stone.png` source sheets + `sliced/*_floor_*.png`
- `art/fx/` — `fire-*`, `burning-ground`, `jump-impact`, `sword-slash`, `heavy-stab`
- `art/world/` — `shrine-of-the-gods.png`

### 2. Slice + background-remove (character/enemy turnaround sheets)
Use **`tools/slice-turnaround.py`** — it's the accumulated solution to every cutout edge case we've
hit. It reads a 3×3 turnaround sheet in reading order (centre cell empty) and maps cells to the
engine's 8-way octants:

```
r0c0=nw  r0c1=n   r0c2=ne
r1c0=w   (empty)  r1c2=e
r2c0=sw  r2c1=s   r2c2=se
```

```
python tools/slice-turnaround.py "art/enemies/goblin-warrior.png" warrior --bg black
```

It outputs 8 PNG cutouts, a **magenta QA contact sheet**, and a ready-to-paste
`'char.<id>.<dir>':'data:image/png;base64,…',` manifest snippet into a temp dir.

**Background removal is edge-seeded flood fill** — only background-coloured pixels *connected to the
cell border* are cut, so the figure's internal shadows survive. Pixel is background if
`max(R,G,B) <= --thresh` (black sheet) or `min(R,G,B) >= 255 - --thresh` (white sheet). Flags, in the
order you should reach for them:

- **`--bg black|white`** — prefer a **white-background source** and key on `min(R,G,B)`: dark internal
  shadows stay opaque, white drops out. A black bg can't be keyed by brightness without eating
  same-colour armour shadows.
- **`--erode N`** — tighten the alpha mask N px to kill the anti-aliased white/dark **edge halo**.
- **`--global`** — also cut **enclosed background pockets** (the gap inside a drawn bow, between
  pillars) that the border flood fill can't reach. Unsafe if interior detail shares the bg colour.
- **`--sever N`** — the HARD case: the figure's own detail is the **same colour as the bg** (dark steel
  armour on a near-black sheet). Erodes the bg mask N px to sever the thin channels connecting interior
  recesses to the exterior, floods from the border through what's left, keeps everything else as figure.
- **`--frame square|cell`** — `square` = uniform bbox-centred square (game sprites); `cell` = keep each
  pose on its native cell canvas for exact in-sheet registration (best for animation across sheets).
- **`--size 0`** — native resolution, no resample (animation source).

**QA every slice by eyeballing the magenta contact sheet** — any leftover white/dark halo or enclosed
bg pocket screams against magenta. The script prints a `bg-leak` px count per direction and a
CLEAN/CHECK verdict; in `--sever` mode that metric over-reports (detail is bg-coloured on purpose) so
trust the contact sheet. The recurring sprite bugs are exactly two: an **edge halo** (try `--erode`) or
an **enclosed bg pocket** (try `--global`).

### 3. Encode + wire into `index.html`
Paste the snippet into `ART_MANIFEST`. Wiring by type:

- **Characters/enemies (`char.<id>.<dir>`)** — drawn upright (no rotation) via `gDirBody('<id>', oct, …)`,
  facing the target by 8-way octant (same pattern as goblin/archer/king). Draw size is its own constant
  (e.g. `KING_SCALE`) — **independent of the body hitbox** (`EntityDefs.<id>.radius`) and attack-zone
  radii (`swipeRange`/`jumpRadius`/`spinRadius`). If you resize the sprite, resize all of them together
  or the hitbox desyncs from the art.
- **Tiles (`tile.<name>.<n>`) auto-wire** — no draw-loop edits. `gTileArt` maps `TILE_FLOOR→'floor'`,
  `TILE_DIRT→'dirt'`, `TILE_GRASS→'grass'`; `gInitArt` counts `tile.<name>.*` into `gTileVarCount`.
  Just add the numbered entries. **Variant selection uses the `gWallVar` random table**
  (`gWallVar[(ty*120+tx)%len] % n`) — NOT a coordinate hash. A multiplicative hash `% (power of two)`
  only reads low bits and shows a visible diagonal pattern.
- **FX with a black background** (fire pillar `FP_SPR`, fire wave `FW_SPR`) — blit with
  `globalCompositeOperation='lighter'` so black drops out and flames glow. Keep FX black-bg unless you
  cut them transparent.

### 4. Tile baking & resolution
- **Tiles bake to device size** (`gRebakeTiles`, on resize) so `gDrawTile` blits 1:1 — leave
  `imageSmoothingEnabled` **off** and never toggle it per tile. A dungeon viewport is ~all `TILE_FLOOR`;
  toggling smoothing per primitive in that hot loop tanks FPS.
- **Raster/photographic art must render at `devicePixelRatio`.** Never draw a portrait/photo into an
  undersized canvas — a 96×112 backing store fed a 400px source throws away detail, then the browser
  upscales the shrunk bitmap → blur. Use the `_prepHiDPICanvas(cvs, cssW, cssH)` helper (near
  `_drawKnightPortrait` in `index.html`) and `ctx.imageSmoothingQuality='high'`, or a plain `<img>` when
  no canvas compositing is needed. Source art must be high enough res for its largest on-screen size.
  (The pixel-art sprites/tiles are exempt — their blockiness is intentional.)

---

## The boundary (Artist vs Engineer in one file)

Both roles edit `index.html`. To avoid stepping on each other:

- **Artist owns:** `ART_MANIFEST` and its entries · `gArtReg`/`gInitArt` art loading · `gDirBody` art
  draw + per-sprite scale constants · `gTileArt`/`gTileVarCount`/tile baking · FX compositing · the
  `art/` folder · `tools/slice-turnaround.py`. Plus the *visual* tuning of how art reads in-game.
- **Engineer owns:** game systems, combat, AI, registries' *stats* (`EntityDefs` hp/damage/radius),
  multiplayer, the loop. The engineer treats art as a black box that "just renders."
- **Shared, coordinate explicitly:** anything where art size and a hitbox/zone must move together
  (`KING_SCALE` ↔ `EntityDefs.king.radius` ↔ attack radii). Resize both in the same commit.

When the Artist's work needs an engine change (a new draw hook, a new enemy's `EntityDefs` row), that's
the **handoff to the engineer** — note it, don't silently rewrite systems.

---

## Habits (inherited from the engineering charter — they apply to art too)

- **Verify every change.** `node --check` the extracted `<script>` (catches a busted `ART_MANIFEST`
  literal — a stray quote in base64 breaks the whole file), **plus** a targeted grep proving the new
  key is present (`node --check` passes on duplicate declarations and won't catch a missing wire).
  Then load it: `python dev.py` → the thing actually renders.
- **QA contact sheet, every sprite.** Eyeball the magenta sheet before pasting. A halo/pocket caught
  here is five minutes; caught in-game it's a debugging session.
- **No half-measures.** All 8 directions, or none. Don't ship 6 clean cutouts and 2 with halos.
- **Keep the docs honest.** `tools/doc-drift-check.ps1` (Stop hook) nudges when `index.html` changed but
  the tracking docs didn't. Log art-pipeline lessons in `SESSION_JOURNAL.md` (the cutout edge cases came
  from there); update this file when the pipeline changes.
- **Park deferred findings.** Spot a bug/cruft outside the task? Add a row to `docs/CLEANUP_BACKLOG.md`
  instead of dropping it in chat.
- **Cut releases like the engineer.** Art is part of the build. Commit to `main`, then
  `.\tools\release.ps1 <X.Y.Z>`; pushing `main` deploys via GitHub Pages, so commit deliberately.
- **Mind the file size.** Base64 art is heavy and inlined. Optimize PNGs (the script already passes
  `optimize=True`); prefer the smallest source that holds up at display size. Note the KB added.

---

## Quick reference — add a character/enemy sprite

1. Drop the white-bg turnaround PNG in the right `art/` subfolder.
2. `python tools/slice-turnaround.py "art/.../sheet.png" <id> --bg white` (add `--erode`/`--global`/`--sever` as the contact sheet demands).
3. Eyeball the magenta contact sheet → CLEAN.
4. Paste the `char.<id>.<dir>` snippet into `ART_MANIFEST`.
5. Wire the draw: `gDirBody('<id>', …)` + a `<ID>_SCALE` constant; if it's a new enemy, hand the
   `EntityDefs`/registry/exclusion-list row to the engineer (see the "add a new enemy" recipe in `CLAUDE.md`).
6. `node --check` + grep the key + `python dev.py` and watch it render in all 8 facings.
7. Commit; note the KB added.
