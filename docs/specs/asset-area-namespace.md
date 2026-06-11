# Spec — Area as a first-class, machine-queryable dimension of the asset namespace

**Status:** proposal (Artist-authored; engine key-contract change → engineer-executed, PM-prioritized)
**Author:** Artist · 2026-06-12
**Context:** Follow-up to the `assets/` fold (`assets/README.md`, `tools/fold-assets.py`). Josh asked whether
the folder reorg actually helps the *AI* working on the game or is purely human-readable. This specs the
change that would make it genuinely AI-native.

---

## The problem (honest framing)

The fold we just landed makes `assets/world/` **human-readable** and adds exactly **one** machine-usable fact:
*area membership* now lives on the filesystem (`assets/world/goblin-forest/…`). But the part of the system
the **code and the agents actually reason over** is the `ART_MANIFEST` **key** (`world.foresttree.0`), and the
key does **not** carry area. So today:

- An agent answering "what belongs to the Goblin Forest?" must read the *filesystem*, not the code. A `git mv`
  could relocate a file and the key — the thing everything references — wouldn't change, so the structure is
  one move away from being invisible to anything that reads keys.
- The runtime can't act on area at all: `gInitArt` eagerly loads **every** manifest entry into `gArtReg`
  regardless of which area is active. With one area that's free; with ten it's wasted memory + load time.

So: the fold is ~80% human tidiness. To make area *machine-native* we have to put it where machines look —
the **key**, the **runtime registry**, or a **generated index** — not just the directory tree.

## How keys actually work today (the contract we'd be changing)

Grounded in `index.html` (read-only audit):

- **Keys are built by string concatenation at each draw site**, never parsed into structured fields:
  - `gArtReg[(t.small?'world.treesmall.':'world.tree.')+t.variant]`  (`~index.html:9016`)
  - `gArtReg['tile.'+name+'.'+vi]`  (`~:8072`)  ·  `gArtReg['world.favorcoin'|'world.chest-open'|'world.shrine']`
- **The only key-*parsing* site** is `gInitArt` counting tile variants: `key.split('.')[1]` → `gTileVarCount[nm]`
  (`~:8037`). This reads segment **[1]** as the tile *type* — so **inserting a segment into `tile.*` keys would
  break variant counting.** (Another reason tiles stay `tile.<type>.<n>` — see "Drop the tile fold" below.)

Implication: an area segment is viable for **`world.*` only**, and the cost is **editing every `world.*` key
string** — both the `ART_MANIFEST` definitions and the ~5 concatenation sites that build them (trees, favorcoin,
chest×2, shrine) + the 3 pending unwired sets (foresttree, barrel, crate). Modest and greppable, but a typo'd
key silently falls back to the procedural sprite (`node --check` won't catch it), so each constructed key must
be grep-verified to resolve.

---

## Options

### A. Area in the key — `world.<area>.<id>[.<n>]`
`world.goblin-forest.foresttree.0`, `world.sanctum.market-stall`, `world.shared.barrel`.

- **Pro:** area is now in the namespace the code + agents reason over. `grep "world.goblin-forest\."` finds every
  reference *in code*. Key and folder reinforce each other; meaning can't silently desync. Purest model.
- **Pro:** unlocks **area-scoped loading** — `gInitArt` can group by the area segment and load/unload per area.
- **Con:** the biggest churn — rename every `world.*` `ART_MANIFEST` entry + every concatenation site in draw
  code, atomically, deploy-gated, with per-key grep-verify. Slicers must emit area-keys (another tool migration).
  Mixed arity (`world.shared.barrel` 3-part vs `world.goblin-forest.foresttree.0` 4-part) — fine for
  concatenation, but anything that ever `split('.')`s a world key must count from the right.

### B+. Derive area at boot from the path — **near-free, reuses the fold**
Keys stay flat (`world.foresttree.0`). `gInitArt` already sees each entry's **path**
(`assets/world/goblin-forest/foresttree-0.png`); add ~5 lines to parse the `/world/<area>/` segment into a
runtime map `gAreaAssets[area] = [key, …]` (and `gAssetArea[key] = area`).

- **Pro:** makes area a **queryable runtime fact** and enables area-scoped load/unload — **without renaming a
  single key or touching one draw site.** The fold we already did becomes the data source.
- **Pro:** zero new authored data; can't drift from the folders (it's derived from them).
- **Con:** membership lives on the *path*, so it's only as stable as the folder layout — a `git mv` without the
  manifest update still desyncs (but that's already an invariant we enforce via `fold-assets.py`). Agents reading
  *static* code still see flat keys; the area map only exists at runtime (mitigated by C).

### C. Generated `AREA_MANIFEST` index — explicit, static, decoupled
A committed, **generated** map `AREA_MANIFEST = { 'goblin-forest': ['world.foresttree','world.tree',…],
'sanctum': […], 'shared': [...] }`, produced by a tool from the `FAMILIES` map (single source of truth) and
checked into `index.html`/a JSON sibling.

- **Pro:** area-membership is a **static, machine-readable artifact** an agent reads without running the game,
  and the engine uses for area-scoped loading. Decoupled from both folder layout *and* key spelling.
- **Pro:** generated from `FAMILIES`, so it can't drift; regenerate on any asset add.
- **Con:** one more generated file to regenerate (a tool + a discipline). Membership keyed by id-prefix, not the
  literal per-variant key, unless we expand it.

---

## Recommendation

**Do B+ now; add C if/when a second area ships. Do *not* do A yet.**

- **B+** captures the two benefits that actually matter — *machine-queryable area* + *area-scoped
  load/unload* — at ~5 lines, reusing the fold, with no key churn and no new failure surface. It's the
  honest "make it AI-native" move with the best cost/benefit.
- **C** is the natural escalation when areas multiply and an agent needs to reason about membership *statically*
  (without booting). It's cheap because `FAMILIES` already holds the area→id mapping — the generator is ~30 lines
  and slots beside `fold-assets.py`.
- **A** is the purest but the cost (rename the whole `world.*` keyspace + every draw site, deploy-gated, typo =
  silent fallback) buys little over B+/C: the same area-scoped loading and grep-ability are reachable without it.
  Revisit only if we want area to be literally un-loseable in the namespace and are renaming keys anyway.

### Companion: drop the `tile/` fold
Tile foldering by type is **redundant for machines** — the type is already in the id (`tile.grass.*`,
`tile.rock.*`), so `grep tile.grass` was already precise, and `gInitArt`'s `split('.')[1]` already treats segment
[1] as the type. The folder just restates the filename. Recommend **leaving `tile/` flat** (revert the planned
`tile` fold; keep the `FAMILIES['tile']` entry out or commented). Tiles gain nothing an agent can't already do;
`world/` is where area is the new, non-redundant fact. (This also keeps `gTileVarCount`'s `split('.')[1]`
assumption untouched — no tile-key arity risk.)

---

## Migration sketch (recommended path: B+, tiles flat)

1. **Engineer** — in `gInitArt` (`~index.html:8034`), after resolving each entry's path, parse
   `assets/world/<area>/` → `gAssetArea[key]=area` and `(gAreaAssets[area] ||= []).push(key)`. Entries not under
   an area folder (or non-`world`) → area `'shared'` / skip. ~5–8 lines; pure addition, no key/draw changes.
2. **Engineer (optional, same change)** — gate eager image loads so only the active area + `shared` load at boot;
   add `gLoadArea(area)` / `gUnloadArea(area)` that flip `gArtReg[key].img`. Wire to area-enter/exit. *Deferred
   until a 2nd area exists — land the map first, the loader when it pays.*
3. **Artist** — keep `world/` foldered by area (done); **revert tile fold** (leave `assets/tile/` flat; drop the
   `--apply` for tile from the engineer handoff; keep `slice-variants` routing for `world` only).
4. **If/when C** — add `tools/gen-area-manifest.py` (reads `FAMILIES` + `ART_MANIFEST`) → emits `AREA_MANIFEST`;
   engineer pastes/imports it; regenerate on asset add (same atomic-with-index.html discipline as `fold-assets`).

## Cost / risk summary

| Option | Engineer edits | New failure surface | AI benefit | Runtime benefit |
|---|---|---|---|---|
| B+ (rec.) | ~5–8 lines in `gInitArt` | none (pure addition) | area queryable at runtime | enables area load/unload |
| C (later) | import 1 generated map | regen discipline | area queryable **statically** | same |
| A | rename whole `world.*` keyspace + ~5 draw sites + slicers, deploy-gated | typo → silent procedural fallback | area in the key | same as B+ |

**Net:** B+ delivers the real AI-native wins (queryable area + scoped loading) for ~the cost of a helper, by
*reusing the fold we already did*. The fold wasn't wasted — it's the data source — but the **key-level** purity
of A isn't worth its churn until we're renaming keys for another reason. Tiles should stay flat.
