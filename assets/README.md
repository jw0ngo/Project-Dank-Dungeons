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
| `char/` | **faction / entity** (a goblin isn't a god's) | `player/` · `goblins/` · `wolves/` … |
| `fx/` | **owner** (FX belong to a god's kit) | `_shared/` · `cilia/` · `boreas/` · `ikras/` · `bhumi/` |
| `ui/` | **UI surface** | `skill-icons/` · `frames/` … |
| `tile/` | **terrain type** (planned) | `floor/` · `dirt/` · `grass/` · `cobble/` · `rock/` … |
| `world/` | props vs set-pieces (planned) | `props/` · `setpieces/` |
| `gods/`, `portraits/` | — (too few to fold) | flat |

Pick the **durable** axis: gods/factions/types rarely churn; *skill names* churn constantly, so we never
fold on those. Keep folders shallow — only sub-group a family when it gets crowded (>~12).

## Migrating a flat kind into folders

`tools/fold-assets.py --domain <kind>` (default dry-run) routes each file by the `FAMILIES` map, then
`--apply` does the `git mv` **and** rewrites the manifest paths in `index.html` in one shot — because the
move and the path rewrite are inseparable (half-done = 404'd art on `main`). **The engineer runs `--apply`**
(sole editor of `index.html`) so both halves land in a single commit; the Artist dry-runs to verify first.

## Conventions
- Code references the path directly — moving/renaming a file means updating its manifest/`.src` path
  (engineer). The slice tools should emit the **foldered** path for a kind once it's foldered, or every new
  asset re-introduces a flat file.
- See per-kind READMEs for specifics (e.g. `assets/fx/README.md`).
