# 2026-06-11 — An art handoff's "new prop" framing can really be a "replace the placeholder" job — reconcile the spec against what's already on screen

*(Archived verbatim from `agents/engineer/memory.md` during the 2026-06-13 compaction; a condensed stub remains there.)*

- **Principle:** An Artist render-spec tells you how the *art* works, not what *product role* it plays in the
  live game. The tree handoff said "NEW world-prop, scatter, NOT a tile" — so I built an open-field scatter
  layer beside the existing procedural `TILE_TREE` forest. The CD actually wanted those painted sprites to
  *replace* the placeholder forest. Both readings satisfy the literal spec; only looking at what's already
  rendered distinguishes them. Before wiring a "new" asset, ask: **is there an existing procedural/placeholder
  thing this art is meant to supersede?** If yes, the job is a swap (retarget placement onto the old thing's
  positions + delete the old draw), not an addition.
- **The tell + the disambiguation were both cheap.** The user's word **"still"** ("still getting placeholder
  trees") points at something that *predates* your change — i.e. not the thing you just added. And the
  "which placeholder?" question settled in two greps: there was **no** pre-existing tree entity/sprite, and
  `gInitArt` + valid case-correct PNGs meant the new art *does* load — so the only thing left that could read
  as "placeholder" was the procedural `TILE_TREE` tile draw. Enumerate the candidate sources and eliminate
  by evidence instead of guessing or rebuilding twice.
- **Reusable mechanics (good first-cut, survived the pivot):** a scatter/overflow world-prop is the `gRocks`
  family — off-grid `{wx,wy,variant,scale}` generated in the **seeded** map gen (so MP-deterministic), returned
  as `kind:` entities, unpacked at load, and pushed into the **y-sorted `drawables`** so it occludes/tucks
  with characters (NOT drawn in the tile pass, which always sits under entities). Feet-anchor by the
  **measured alpha-bbox foot** (PIL `getbbox` over the PNGs → the base sits ~0.93 down; one shared `*_FOOT`
  const), never the canvas bottom. Only the *placement source* changed in the pivot (open grass → forest
  tiles) — the render/draw/load machinery was right the first time.
- **How to apply:** for any art-wiring handoff, hold the spec next to a live look (or a precise mental model)
  of what currently occupies that visual slot; when the art is a quality upgrade of an existing element, plan
  for swap-and-delete (retarget + remove the superseded draw + its now-dead consts) and expose density/size as
  named knobs for the CD to tune live — a visual feature's final spec converges on his eyeball, not your first
  guess. Sibling of the 2026-06-11 fog lesson (pull the visual forks before a big rewrite) and the
  display-text-vs-frozen-token rename split.
