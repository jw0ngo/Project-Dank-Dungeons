# assets/fx/ — world & combat FX sprites

Runtime visual-effect sprites (the procedural-draw overrides loaded into `index.html` via sprite
`new Image().src` or `ART_MANIFEST` `fx.*` keys). **UI art does not live here** — skill icons, frames, and
other interface art go in `assets/ui/`.

## Organization — by **owner**, not by skill

```
assets/fx/
  _shared/   god-agnostic FX reused across kits (basic-attack arcs, generic bursts)
  cilia/     the fire god's kit FX (+ her substances)
  boreas/    ikras/  bhumi/   one folder per patron god, added as they ship
```

- **A folder per god** holds that god's whole kit. **Gods are the stable unit** — individual *skills* get
  renamed/reworked constantly, so we organize on the durable axis. A skill rename never moves a file.
- **Substances live at the god level** (e.g. `cilia/chaosfire-circle.png`, `cilia/dragonfire-circle.png`) —
  they're shared across that god's skills (Burning Body, Dance of Fire, …), so they don't belong to any one skill.
- **`_shared/`** is for FX tied to no god — the basic swing/heavy arcs (`slash`, `thrust`), generic bursts
  (`explosion-*`), impact sparks, etc.
- **Flat within a god** until a folder gets large (>~12 files); only then sub-group by skill.

## Conventions

- **Black background, additive.** FX are composited `'lighter'` (black drops out) unless explicitly cut
  transparent. Floor the source's ambient to true black so nothing washes a square halo (`tools/fx-ring-heatfill.py`).
- **Code references the path directly.** Moving or renaming a file means updating its `.src` / manifest path
  in `index.html` — that's an **engineer** edit (the Artist moves the file + hands off the path map). The
  file move and the path edits must reach `main` in the **same push**, or the deploy ships 404'd FX.
- **Source masters** (full-res, pre-slice) live under `art/fx/`, not here — this folder holds only the
  sized-down runtime outputs.
