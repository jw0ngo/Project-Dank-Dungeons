# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Dungeon Forge** — a browser action-RPG written in vanilla JS + Canvas API, with Firebase Realtime Database for multiplayer. The whole game is one self-contained HTML file with all CSS, JS, and base64 art inlined. No framework, no transpile.

### The active artifact

`index.html` at the repo root (~12,600 lines) is the canonical, current game. **This is what you edit.** It is opened directly in a browser — there is no build step, no bundler, no install. Everything (CSS, JS, base64 art) is inlined in this one file.

Other paths are historical/parallel and are NOT the live game:
- `dungeon-forge-project/dungeon-forge/` — an April attempt to split the game into Vite ES modules (`src/engine/`, `src/hub/`, etc.). Stale. Only touch it if explicitly asked to work on the modular port.
- `art/` — source PNGs for the four patron gods (with/without background), embedded into the game as base64.
- `docs/` — the authoritative project docs (see below); `docs/archive/` holds older snapshots.

## Versioning

The project root is a git repository (GitHub remote `jw0ngo/Project-Dank-Dungeons`, branch `main`). **Versioning is git history + tags, not duplicated files** — do NOT create `_v2` / `_refactored` copies of `index.html`; edit it in place and commit.

- Releases get a `CHANGELOG.md` entry and an annotated tag (`git tag -a vX.Y.Z`). Pre-1.0: minor = features, patch = fixes.
- Pushing `main` deploys the latest `index.html` via GitHub Pages, so commit deliberately.

> A modular split of `index.html` is on the table (an earlier doc called the single-file form a hard constraint — it is not). If asked to refactor toward modules, the stale `dungeon-forge-project/` Vite scaffold is the reference for the intended structure.

## Companion docs — read before working

Living documentation lives in `docs/`:
- `DUNGEON_FORGE_CTO_DOC.md` — system-by-system architecture reference (enemy registry, wilderness gen, shrines, skills, audio map). Keep current as systems change.
- `SESSION_JOURNAL.md` — append-only log of debugging lessons. The most portable value in the repo; read the recent entries before debugging.
- `WORKING_AGREEMENT.md` — collaboration style (terse requests, screenshots are bug reports, "assess" = diagnose before fixing).

## Workflow & verification

There is no test suite and no lint config. The verification loop is:

1. Make the change in `index.html`.
2. Extract the `<script>` JS and run `node --check` on it to confirm no syntax error.
3. Run a **targeted** check (grep or a small node snippet) proving the change is present and correct — `node --check` alone is not sufficient.
4. For behavior, open the HTML in a browser (the game boots straight into the town hub via `goTown()`).

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

### Multiplayer
Firebase Realtime DB. Config is embedded near the top of the file (`§1` region) and exposed as `window._FB`. Streams run at ~8 Hz, delta-compressed. All net code is gated on `window._FB && window._FB.db`, so single-player works if Firebase never initializes.

## Hard-won gotchas (from the journal)

- **Enemies vanishing unexpectedly?** Check the invisible 85-tile despawn radius first. `isPatrol` and `isHeld` enemies are exempt; village/shrine guardians rely on `isHeld`.
- **`beforeunload` must be unconditional** — always call `preventDefault()` and set `returnValue`. A conditional guard makes the browser pre-classify the handler as non-blocking, and the "lose your run" warning silently stops firing.
- **Never use `Date.now()` in bitwise/hash operations** — it overflows 32-bit precision. Use tile-coordinate hashes (e.g. `((tx*2999)^(ty*6571)) >>> 0`) for deterministic placement.
- **Click handler attached but not firing?** Check the parent container's `pointer-events` before debugging the handler. `#skill-bar` must stay `pointer-events:auto`; slots default to `none`.
- **maxHP buffs** must store the original value (`_shamanBaseMaxHp`, etc.) and restore from it — never divide back out, integer rounding is lossy.
- In large procedural generators, **declaration order matters**: if a later step's data is referenced earlier, move the declaration up.
