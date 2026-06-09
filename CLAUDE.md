# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Roles & context routing

This repo is operated by two roles, each with its own context:

- **Engineer / CTO — the default (this file).** Owns *how*: builds and refactors `index.html`,
  the systems, the art pipeline, releases. This file auto-loads into every session, so unless
  you switch, **you are the engineer.** Full operating model: `docs/ENGINEERING_CHARTER.md`.
- **Product Manager — opt-in.** Owns *what* and *why*: the roadmap. Operating context is
  `product/CLAUDE.md` (model: `docs/PRODUCT_MANIFESTO.md`). Switch into it with **`/pm`**.

The two roles hand off through `docs/ROADMAP.md` (PM fills it; engineer builds from *Now*).
Switch roles explicitly: **`/pm`** to become the Product Manager, **`/cto`** to return to (or
assert) the engineer role. Everything below this section is the engineer's context.

## What this is

**Dungeon Forge** — a browser action-RPG written in vanilla JS + Canvas API, with Firebase Realtime Database for multiplayer. The whole game is one self-contained HTML file with all CSS, JS, and base64 art inlined. No framework, no transpile.

### The active artifact

`index.html` at the repo root (~12,600 lines) is the canonical, current game. **This is what you edit.** It is opened directly in a browser — there is no build step, no bundler, no install. Everything (CSS, JS, base64 art) is inlined in this one file.

Other paths are historical/parallel and are NOT the live game:
- `dungeon-forge-project/dungeon-forge/` — an April attempt to split the game into Vite ES modules (`src/engine/`, `src/hub/`, etc.). Stale. Only touch it if explicitly asked to work on the modular port.
- `art/` — source PNGs sliced/encoded into `index.html` as base64 (see Art pipeline below); the
  game never loads these at runtime, so they're organized purely for humans, in kebab-case
  subfolders: `art/player/` (warrior idle/attack/heavy turnarounds), `art/enemies/` (goblin family
  — idle `goblin-*.png` and matching `*-attack.png`, incl. `goblin-king-white-bg.png`),
  `art/gods/` (four patrons `bhumi/boreas/ikras/cilia`, some with a `-bg-removed` variant),
  `art/tiles/` (`dirt/grass/stone.png` source sheets + `sliced/*_floor_*.png`), `art/fx/`
  (`fire-*`, `burning-ground`, `jump-impact`, `sword-slash`, `heavy-stab`), `art/world/`
  (`shrine-of-the-gods.png`).
- `docs/` — the authoritative project docs (see below); `docs/archive/` holds older snapshots.

## Versioning

The project root is a git repository (GitHub remote `jw0ngo/Project-Dank-Dungeons`, branch `main`). **Versioning is git history + tags, not duplicated files** — do NOT create `_v2` / `_refactored` copies of `index.html`; edit it in place and commit.

- Releases get a `CHANGELOG.md` entry and an annotated tag (`git tag -a vX.Y.Z`). Pre-1.0: minor = features, patch = fixes.
- Pushing `main` deploys the latest `index.html` via GitHub Pages, so commit deliberately.

### Where previous builds live
- **`main` history + annotated tags** — every commit's `index.html` is recoverable (`git show vX.Y.Z:index.html` or `git checkout vX.Y.Z`). Named releases are the tags (`v0.9.0`, `v0.10.0`, …).
- **`origin/archive/legacy-builds`** — the old pre-consolidation filename-versioned snapshots (`dungeon_forge_MP_v2.html`, `build_47.html`, etc.), quarantined off `main`.
- GitHub Pages does **not** keep old deploys — it only serves current `main`. Old builds survive only via git history / tags / the archive branch.

### Cutting a release (the habit)
Every deploy to `main` should become a **named version**, not just a loose commit:
1. Commit (and push) your build to `main` as usual.
2. Run **`.\tools\release.ps1 <X.Y.Z> ["message"]`** — it promotes the `CHANGELOG.md` `[Unreleased]` section to `## [X.Y.Z] - <date>` (leaving a fresh empty `[Unreleased]`), commits that, creates the annotated `vX.Y.Z` tag, and pushes `main` + the tag. It refuses to run off `main`, on a duplicate tag, with an empty `[Unreleased]`, or with other uncommitted tracked changes (so a tag always points at a committed build).
   - Manual equivalent: edit `CHANGELOG.md`, then `git tag -a vX.Y.Z -m "…" && git push origin main vX.Y.Z`.

> A modular split of `index.html` is on the table (an earlier doc called the single-file form a hard constraint — it is not). If asked to refactor toward modules, the stale `dungeon-forge-project/` Vite scaffold is the reference for the intended structure.

## Companion docs — read before working

Living documentation lives in `docs/`:
- `ENGINEERING_CHARTER.md` — **read first.** The standing operating model: you are CTO & lead engineer with standing authority to keep the codebase healthy. Bias to act on in-codebase changes; check in only when the cost of being wrong is high; preserve behavior in refactors; refactor on a cadence; no half-measures. Includes how the charter's generic assumptions (tests, build, deps) map onto this repo's reality.
- `PRODUCT_MANIFESTO.md` — the operating model for the **Product Manager** role (parallel to the engineering charter, on the product side): the pillars (game feel, build-craft depth, mastery, co-op), the developer's taste, the decision-ready proposal format, the approval gate, and roadmap cadence. Read this when generating product direction or running the PM agent.
- `DUNGEON_FORGE_CTO_DOC.md` — system-by-system architecture reference (enemy registry, wilderness gen, shrines, skills, audio map). Keep current as systems change.
- `SESSION_JOURNAL.md` — append-only log of debugging lessons. The most portable value in the repo; read the recent entries before debugging.
- `WORKING_AGREEMENT.md` — collaboration mechanics (terse requests, screenshots are bug reports, "assess" = diagnose before fixing).

## Workflow & verification

There is no test suite and no lint config. The verification loop is:

1. Make the change in `index.html`.
2. Extract the `<script>` JS and run `node --check` on it to confirm no syntax error.
3. Run a **targeted** check (grep or a small node snippet) proving the change is present and correct — `node --check` alone is not sufficient.
4. For behavior, run `python dev.py` — serves `index.html` at `http://localhost:5500` and auto-reloads the browser on every save (the game boots straight into the town hub via `goTown()`). Testing is local; `git push` is only for publishing to GitHub Pages. No Node toolchain is installed — Python 3 is the only runtime here, so the nested `dungeon-forge-project/` Vite project cannot be run as-is.

**Caveat:** `node --check` passes even with **duplicate function declarations**. A later duplicate silently shadows an earlier one, so a system can look wired yet have no effect. When a feature seems connected but does nothing, grep for duplicate `function name(` first.

For changes that span 3+ sites, script the edit (report OK/SKIP/FAIL per site) rather than doing serial single-line replacements that can leave the file half-patched.

Modular Vite port only (`dungeon-forge-project/dungeon-forge/`): `npm install` then `npm run dev` / `npm run build` / `npm run preview`.

## Architecture

### Code layout (`index.html`)
One `<script>` divided by `§` section banners. Grep for the banner to jump:

- `§1 CONFIG & STORAGE` · `§2 DEMO MAP & CONSTANTS` · `§3 HUB & NAVIGATION` · `§4 MAP EDITOR`
- `§5 REGISTRIES` — SpriteRegistry, WeaponRegistry, EntityDefs, pathfinding
- `§6 DUNGEON ENGINE` — `§6a` player · `§6b` sword/whirlwind/dash/leap/heavy · `§6c` hazards/pickups · `§6d` training dummy · `§6e` enemy system · `§6f` render · `§6g` game loop
- `§7 MULTIPLAYER` — Firebase adapter, delta-compressed entity/arrow streams

### Game modes
Three mutually-exclusive states driven by two flags: `inTown` (The Sanctum hub), `inWilderness` (open survival run), or neither (dungeon instance). State lives in module-global `g*` variables (`gPlayer`, `gEnemies`, `gTiles`, `camX/camY`, `gFrame`, …), not in objects.

### Registries — the extension points
Adding content means registering it, not editing the loop:
- **`SpriteRegistry`** — `register(id, canvas, scale)`; draw code calls `.get(id)`. Sprites are pixel arrays compiled via `bsc()`.
- **`EntityDefs`** — per-enemy stats. **Every entry MUST have an `hp` field** — `makeGoblinEnt` copies `d.hp`, and `undefined <= 0` is `false` in JS, so a missing `hp` produces an unkillable enemy with an empty health bar.
- **`EnemyRegistry`** — maps enemy type → `{ ai, flagProp }`. Goblin uses `flagProp: null` plus an explicit **exclusion list**. Any new enemy NOT added to that exclusion list runs *both* its own AI and goblin AI (double-movement bug). The in-file comment at `§5`/`§6e` lists the full "add a new enemy" recipe (def → registry → exclusion list → sprite → editor palette).

`_wildScaleEnt` early-returns when `!inWilderness`, so its stat scaling applies only to wilderness enemies; dungeon enemies use raw `EntityDefs` values.

### Art pipeline (image-based art)
Two art layers coexist. **Pixel-array sprites** (`bsc()` / `SpriteRegistry`) are the blocky retro fallbacks. **Base64 PNG art** lives in `ART_MANIFEST` (keyed `char.<id>.<dir>`, `tile.<name>.<n>`, `fx.<name>`) → loaded into `gArtReg` and, when present, overrides the procedural draw.
- **Adding art:** save the PNG under `art/`, slice if it's a sheet, base64-encode, add a manifest entry. Tiles auto-wire: `gTileArt` maps `TILE_FLOOR→'floor'`, `TILE_DIRT→'dirt'`, `TILE_GRASS→'grass'`, and `gInitArt` counts `tile.<name>.*` into `gTileVarCount`. No draw-loop edits needed.
- **Tiles bake to device size** (`gRebakeTiles`, on resize) so `gDrawTile` blits 1:1 — leave smoothing off, never toggle it per tile (see gotchas).
- **Tile variant selection uses the `gWallVar` random table** (`gWallVar[(ty*120+tx)%len] % n`), NOT a coordinate hash — a multiplicative hash `% (power of two)` shows a diagonal pattern (see gotchas).
- **FX sprites with a black background** (fire pillar `FP_SPR`, fire wave `FW_SPR`) are blitted with `globalCompositeOperation='lighter'` so the black drops out and flames glow.
- **Character cutouts from a turnaround sheet** (`char.<id>.<dir>`, e.g. the Goblin King): prefer a **white-background** source and key on `min(R,G,B)` (dark internal shadows stay opaque, white → transparent) — a black bg can't be keyed by brightness without eating same-colour shadows. Isolate each pose with **connected-component labeling** (its own blob mask), not a fixed grid, so neighbours don't bleed in. The King draws **upright** (no rotation) via `gDirBody('king', oct, …)`, facing the target by 8-way octant — same pattern as goblin/archer. Its draw size (`KING_SCALE`) is independent of its body hitbox (`EntityDefs.king.radius`) and attack-zone radii (`swipeRange`/`jumpRadius`/`spinRadius`) — resize all together.

### Local dev
`tools/dev-window.ps1` + a personal PostToolUse hook (in `.claude/settings.local.json`, gitignored) reopen the live-reload dev window if it's closed when `index.html` is edited. It detects an open window via the livereload websocket on port 5500 — no polling. `tools/doc-drift-check.ps1` (Stop hook) nudges when `index.html` changed but the tracking docs (CHANGELOG/SESSION_JOURNAL/CLAUDE.md) didn't.

### Product roadmap (engineer's handoff)
Sanctioned product work lands in **`docs/ROADMAP.md`** under *Now* with status `approved` — treat that as the build queue. Producing and approving those items is a separate **Product Manager** role with its own operating context under **`product/`** (`product/CLAUDE.md`) — the engineer doesn't load or maintain that; it just consumes `ROADMAP.md`.

### Multiplayer
Firebase Realtime DB. Config is embedded near the top of the file (`§1` region) and exposed as `window._FB`. Streams run at ~8 Hz, delta-compressed. All net code is gated on `window._FB && window._FB.db`, so single-player works if Firebase never initializes.

## AI-native — keep the game agent-playable

**Standing project goal: Dungeon Forge must stay playable by AI agents and scripted bots**,
for automated playtesting and balance simulation. Treat agent-playability as a first-class
constraint, like not breaking the build — every new mechanic should remain *observable* and
*drivable* by a non-human player.

The harness is **`window.Sim`** (`§8` in `index.html`) plus **`tools/ai-playtest/`** (a local
Claude key-proxy for LLM-driven play; the API key lives server-side, never in `index.html`).
All run paths — real play, `Sim.demo`, `Sim.aiConnect`, and headless `Sim.runFast`/`Sim.batch`
— funnel through one extracted `gSimUpdate(dt)` step. The scripted bot (`Sim.batch`) needs **no
API credits** and is the tool for balance simulation at scale; the LLM path is optional,
model-configurable, and can run on a local model (e.g. Ollama) for $0 or on Claude for the
sharpest play.

Maintenance invariants (so the harness doesn't rot as features land):
- **New per-frame systems go inside `gSimUpdate(dt)`**, not loose in `loop()` — otherwise
  headless runs silently skip them.
- **A new game-pausing modal/choice (like the level-up draft) MUST add a programmatic hook**
  (mirror the `gSimDraft` pattern in `_renderDraft`), or headless runs stall forever.
- **New player state the agent should react to → add it to `Sim.observe()`.**
- **New ability/weapon/input → add a `Sim.act` primitive** (+ `execIntent`/`bot` handling and,
  for the Claude path, an `Intent` schema field in `tools/ai-playtest/server.py`).
- **Canary after notable changes: `await Sim.batch(3)`.** A stall (hits the step cap without
  dying) or a throw means a coupling broke.

(The product framing — "AI-native" as a player/positioning pillar — is the PM role's call;
record it via `/pm` in `docs/PRODUCT_MANIFESTO.md` / `docs/ROADMAP.md`. This section is the
engineering commitment.)

## Hard-won gotchas (from the journal)

- **Enemies vanishing unexpectedly?** Check the invisible 85-tile despawn radius first. `isPatrol` and `isHeld` enemies are exempt; village/shrine guardians rely on `isHeld`.
- **`beforeunload` must be unconditional** — always call `preventDefault()` and set `returnValue`. A conditional guard makes the browser pre-classify the handler as non-blocking, and the "lose your run" warning silently stops firing.
- **Never use `Date.now()` in bitwise/hash operations** — it overflows 32-bit precision. Use tile-coordinate hashes (e.g. `((tx*2999)^(ty*6571)) >>> 0`) for deterministic placement.
- **Click handler attached but not firing?** Check the parent container's `pointer-events` before debugging the handler. `#skill-bar` must stay `pointer-events:auto`; slots default to `none`.
- **maxHP buffs** must store the original value (`_shamanBaseMaxHp`, etc.) and restore from it — never divide back out, integer rounding is lossy.
- In large procedural generators, **declaration order matters**: if a later step's data is referenced earlier, move the declaration up.
- **Tiles/variants forming a visible repeating pattern?** A multiplicative coordinate hash `% (power of two)` only reads the hash's low bits (linear in tx,ty). Use the `gWallVar` random table for variant selection, not the hash.
- **Sudden FPS drop in dungeons after a draw change?** Look for per-primitive canvas state changes (e.g. `imageSmoothingEnabled` toggled per tile) in the densest loop — a dungeon viewport is ~all `TILE_FLOOR`. Hoist state out of hot loops; baked tiles blit 1:1 and need no smoothing.
