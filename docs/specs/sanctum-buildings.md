# Sanctum buildings — regeneration briefs

**Status:** briefs ready, generation pending
**Style bible:** `art/reference images/Todust starting town.png` (the Creative Director's target
look for the home base). The town's *props and ground* were extracted directly from this image
(`tools/extract-town-props.py` → `assets/world/*`, `assets/tile/cobble-*`). The **buildings** were
deliberately NOT extracted — several touch the image edge (pixels never drawn), they carry baked
directional torch-glow, and they occlude each other — so each is regenerated as a standalone
sprite using the reference as the style guide. Decision: Josh, 2026-06-10.

## Global generation rules (apply to every brief below)

- **View:** top-down three-quarter view, same camera angle as the reference image — match it by
  eye against the reference's inn before accepting any output.
- **Background:** pure white, single standalone building per image, nothing else in frame —
  no ground plane, no cobblestone, no neighbouring props; at most a tight contact shadow.
- **Style:** the house style (dark-fantasy hand-painted, clean silhouette, simple-to-medium cel
  shading with painterly gradients) in this reference's palette: weathered timber brown, dark
  slate/charcoal roofs, cold grey stone, warm amber window glow, muted purple accents only where
  arcane. Rim light: warm gold one edge, cool blue-grey the other.
- **Scale anchor:** the front door is the unit — every building's door should be drawn at the
  same height so the set scales consistently. Target proportion: door ≈ 1.1× the knight's height;
  cottages ≈ 2.5 door-heights tall at the roofline, the church ≈ 5.
- **No text** baked anywhere EXCEPT the diegetic signs specified per-brief.
- **Lighting:** neutral ambient; lit windows are part of the asset (warm amber), but NO baked
  directional ground-glow — torch pools come from in-game light sources.

## Per-building briefs

### 1. Church / cathedral (reference: top-left)
Tall narrow gothic stone chapel. Steep dark-slate roof, pointed-arch doorway up a short flight of
stone steps, two storeys of arched windows with warm light, small steeple. Weathered grey-black
masonry, moss in crevices. The most vertical silhouette in the set.

### 2. Inn (reference: right side)
Two-storey timber-frame inn, the widest commoner building. Dark wood plank walls, sagging ridge
line, stone chimney with a smoke wisp, generous lit windows, hanging board sign reading **INN**
over the door. Welcoming but worn.

### 3. Shop row / market house (reference: top-right)
Timber storefront with a canvas awning over a counter window, crates and sacks built into the
facade. Single sprite reading as "a shop"; one or two variants (general goods / smithy — the
smithy variant gets a small chimney and an anvil-and-tools counter instead of sacks).

### 4–5. Cottages (reference: left and bottom-left) — generate as a 3×3 VARIANT sheet
Nine small one-storey peasant cottages on one 3×3 white-bg sheet (same shape as the rock/fence
variant sheets — slice with `tools/slice-variants.py <sheet> cottage --bg white`). Wood-shingle
or thatch roofs, stone footings, one lit window each; one variant with a boarded window, one with
a purple-lit window (the reference's occult touch), one half-ruined. Same footprint across all 9.

### Minor props (regen leftovers — small, blended too hard to extract from the scene)
One 3×3 white-bg variant sheet of yard clutter: wooden crate ×2, barrel ×2, stacked barrels,
rail-fence segment ×2 (straight + corner), handcart. Slice with `slice-variants.py <sheet> clutter
--bg white`.

## Post-generation pipeline

1. Source PNG into `art/world/sanctum/` (masters).
2. Variant sheets → `tools/slice-variants.py`; single landmarks are white-bg cuts (edge flood —
   any of the slicers' `cut_cell` path handles a single image trivially).
3. QA on magenta, then `assets/world/<name>.png` + a `'world.<name>'` manifest snippet → engineer.
4. Buildings are solid colliders — flag footprint ↔ blocking-tile coupling in the handoff so the
   engineer sizes the collision rect with the sprite in the same commit.
