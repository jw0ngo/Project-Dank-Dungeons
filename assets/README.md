# assets/ — runtime art the game loads

These are the sized-down files the game loads (via `ART_MANIFEST` `<kind>.*` keys or sprite `.src`).
Full-res **source masters** live under `art/`, organized to mirror this tree.

## Organizing principle (long-term)

> **Top level = asset *kind*** (a durable domain). **Within a kind, fold on *that kind's* natural family
> axis — but only once volume warrants, and keep it shallow.** When a folder's paths are code-referenced
> (in `ART_MANIFEST`), **migrate by script + verify + push atomically** (`tools/fold-assets.py`), never by hand —
> a typo'd path silently falls back to the procedural sprite, which `node --check` won't catch.

The family axis is chosen per kind — it is **not** "by god everywhere":

| Kind | Family axis | Folders |
|---|---|---|
| `char/` | **faction → type** (two levels: each character TYPE owns a folder for its whole anim set) | `player/knight/` · `goblins/{goblin,archer,warrior,shaman,bomber,king}/` · `wolves/{direwolf,alphawolf,wolfmother}/` |
| `fx/` | **owner** (FX belong to a god's kit *or a character class*) | `_shared/` · `knight/` · `cilia/` · `boreas/` · `ikras/` · `bhumi/` |
| `ui/` | **UI surface** | `skill-icons/` · `frames/` … |
| `tile/` | **terrain type** (planned) | `floor/` · `dirt/` · `grass/` · `cobble/` · `rock/` … |
| `world/` | props vs set-pieces (planned) | `props/` · `setpieces/` |
| `gods/`, `portraits/` | — (too few to fold) | flat |

Pick the **durable** axis: gods/factions/types rarely churn; *skill names* churn constantly, so we never
fold on those. Keep folders shallow — only sub-group a family when it gets crowded (>~12).

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
  (engineer). The slice tools should emit the **foldered** path for a kind once it's foldered, or every new
  asset re-introduces a flat file.
- See per-kind READMEs for specifics (e.g. `assets/fx/README.md`).
