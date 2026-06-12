# assets/ — runtime art the game loads

These are the sized-down files the game loads (via `ART_MANIFEST` `<kind>.*` keys or sprite `.src`).
Full-res **source masters** live under `art/`, organized to mirror this tree.

## Organizing principle (long-term)

> **Top level = asset *kind*** (a durable domain). **Within a kind, fold on *that kind's* natural family
> axis — but only once volume warrants, and keep it shallow.** When a folder's paths are code-referenced
> (in `ART_MANIFEST`), **migrate by script + verify + push atomically** (`tools/fold-assets.py`), never by hand —
> a typo'd path silently falls back to the procedural sprite, which `node --check` won't catch.

The family axis is **chosen per kind** — it is *not* one axis everywhere. Each kind folds on whatever
durable thing it's naturally born of:

| Kind | Family axis | Folders |
|---|---|---|
| `char/` | **faction → type** (two levels: each character TYPE owns a folder for its whole anim set) | `player/knight/` · `goblins/{goblin,archer,warrior,shaman,bomber,king}/` · `wolves/{direwolf,alphawolf,wolfmother}/` |
| `fx/` | **owner** (FX belong to a god's kit *or a character class*) | `_shared/` · `knight/` · `cilia/` · `boreas/` · `ikras/` · `bhumi/` |
| `world/` | **area** (set-dressing is born of an area) + `_shared/` for cross-area props | `goblin-forest/` · `sanctum/` · `_shared/` |
| `tile/` | **flat — deliberately NOT foldered** (type is already in the id) | `tile.grass.*`, `tile.rock.*`, … (no subfolders) |
| `ui/` | **UI surface** | `title/` (landing/title-screen logos) · `skill-icons/` · `frames/` … |
| `gods/`, `portraits/` | — (too few to fold) | flat |

Pick the **durable** axis: areas/factions/types rarely churn; *skill names* churn constantly, so we never
fold on those. Keep folders shallow — only sub-group a family when it gets crowded (>~12).

**`world/` folds by AREA** because a prop's home is the place it dresses — trees belong to the Goblin
Forest, the market stall to the Sanctum. **A new area = a new folder** (`world/<area>/`); the structure
scales by *adding* folders, never by growing one flat pile. Cross-area interactables (barrel, crate,
chest, favor coin) live in **`world/_shared/`** (mirrors `fx/_shared/`). Area is also lifted into the
**runtime** (the path's `world/<area>/` segment → `gAreaAssets` at boot, enabling per-area load/unload) —
see `docs/specs/asset-area-namespace.md`, the "B+" approach.

**`tile/` stays FLAT — a deliberate non-fold.** The terrain type is already in the id (`tile.grass.*`,
`tile.rock.*`) and `gInitArt` reads it via `key.split('.')[1]`, so a `grass/` folder would just restate the
filename — redundant for machines, and area (the only *new* fact) isn't a tile property (the same dirt/grass
recur across biomes). Don't area-fy or type-fold tiles. (Rationale: same spec.)

**`char/` is two levels** so each character's growing animation set (idle + atk + hurt + walk + future
sheets) stays self-contained instead of dumped flat into a faction bucket. **The player's visual class is
`knight`** (`char/player/knight/`, keys `char.knight.*`) — kept distinct from the game-logic hero identity:
the entity `kind:'player'` and the pixel-art `SpriteRegistry('player')` fallback STAY `player` (the
`player` entity *wears* a class). A second class is just `char/player/<class>/` + `char.<class>.*`.

## Migrating a kind into folders

Two migration tools, both **dry-run by default**, both atomic (`git mv` + `index.html` rewrite in one
commit), both **run with `--apply` by the engineer** (sole editor of `index.html`); the Artist dry-runs to
verify the plan first:

- **`tools/fold-assets.py --domain <kind>`** — flat → **one-level** family folders, routed by the `FAMILIES`
  map (path-only; manifest keys unchanged). Use for a new kind (e.g. `tile/`).
- **`tools/reclass-char.py`** — `char/` → **per-type** two-level folders, driven by the actual files (so it
  also relocates *unwired* sprites that have no manifest entry). Also renames the player class `player →
  knight` (manifest keys `char.player.* → char.knight.*`) and moves its attack FX to `fx/knight/`. The
  player **draw-code** string literals can't be auto-edited (they'd collide with the game-logic `'player'`
  identity), so the tool prints the exact engineer edit-list to apply in the same commit.

The move and the path/key rewrite are inseparable — half-done = 404'd art on `main` that silently falls back
to the procedural sprite (`node --check` won't catch it).

## Conventions
- Code references the path directly — moving/renaming a file means updating its manifest/`.src` path
  (engineer). A new asset must land in (and its snippet must cite) the **foldered** path, or it re-introduces
  a flat file the next fold has to sweep up.
- **`slice-variants.py` auto-routes `world` outputs** through `fold-assets.py`'s `FAMILIES` map: it writes the
  cutout into `assets/world/<area>/` and emits the foldered manifest path. So slicing a new forest tree lands it
  in `world/goblin-forest/` and the snippet already says so. A `world` id that matches no area warns + falls back
  flat — **add it to `FAMILIES['world']` first** (the map is the single source of truth for both the fold and the
  slicer). `tile/` is not in `FAMILIES`, so tile slices stay flat (correct — see above). `char/` slices route via
  `reclass-char.py`'s classifier; `fx/` is owner-based (manual).
- See per-kind READMEs for specifics (e.g. `assets/fx/README.md`).
