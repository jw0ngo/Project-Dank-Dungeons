# art/fx/ — FX **source masters** (humans-only)

Full-res, pre-slice master art for visual effects. The game does **not** load these — it loads the
sized-down runtime outputs under `assets/fx/`. This tree is for humans: keep, re-slice, and iterate masters here.

## Organization — mirrors `assets/fx/`, by **owner**

```
art/fx/
  _shared/   god-agnostic masters (jump-impact, sword-slash, heavy-stab, …)
  cilia/     fire-god kit masters (rings, pillar, wave, cross, chaosfire/dragonfire + grounds/circles)
  boreas/    ice-fx        (frost god)
  ikras/     wind-fx       (mobility god)
  bhumi/     plant-fx      (earth/thorns god)
  _particles/  pipeline staging — sliced particle cutouts by substance (left flat; not a master set)
```

Same rule as `assets/fx/` (see `assets/fx/README.md` for the full rationale): **a folder per god** because
gods are the durable unit and skills churn; **`_shared/`** for FX tied to no god; substances live at the god
level. `_particles/` is intermediate tooling output (its own `.gitignore`), left as-is.

> When a master moves/renames here it has **no code impact** (nothing references `art/fx/`); the runtime copy
> under `assets/fx/` is the one whose path the engineer wires.
