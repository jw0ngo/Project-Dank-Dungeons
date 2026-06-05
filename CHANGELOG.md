# Changelog

All notable changes to Dungeon Forge are recorded here. Versions follow
[Semantic Versioning](https://semver.org/) (pre-1.0: minor = features, patch = fixes).

Tag each release in git: `git tag -a vX.Y.Z -m "..." && git push origin vX.Y.Z`.

## [Unreleased]

### Added
- **Image-based tile art** — stone dungeon floors (`tile.floor.0–3`) and dirt patches
  (`tile.dirt.0–3`) render painterly art from `ART_MANIFEST` instead of procedural
  fills. Sliced from 2×2 source sheets (`art/tile stone.png`, `art/tile dirt.png`).
- **Fire-wave sprite** — Cilia's Fire imbued normal-attack wave uses a flame-crescent
  sprite (`FW_SPR`), blitted additively, replacing the procedural arc.
- **Goblin King art** — static 8-directional sprite (`char.king.*`), cut from a
  white-background turnaround sheet (whiteness-keyed on `min(R,G,B)` + connected-component
  isolation per pose); replaces the procedural pixel sprite. Drawn upright like the
  goblin/archer (no rotation), facing the target via the 8-way octant.
- **Local dev convenience** — `tools/dev-window.ps1` + a personal PostToolUse hook
  reopen the live-reload dev window (`localhost:5500`) if it's closed when `index.html`
  is edited; `tools/doc-drift-check.ps1` (Stop hook) nudges when `index.html` changed
  but the tracking docs didn't.

### Changed
- **Goblin King size** — sprite scaled to 5.36× player size (a giant boss); body and
  attack hitboxes scaled to match (`radius` 18→44, swipe/jump/spin zones proportional),
  the body hitbox kept just inside the visible sprite for playability.
- **Fire pillars (Cilia heavy)** — sprite 2× larger; pillars now require ≥50% charge
  (the hitbox telegraph flashes red when armed) and begin at 50% of the heavy's range.
- **Whirlwind** — spinning visual reuses the normal-attack slash sprite (`fx.slash`)
  instead of placeholder swords; fiery-red tint when imbued with Cilia's Fire.

### Fixed
- **Tile variants no longer form a diagonal pattern** — art-tile variant selection now
  uses the shared `gWallVar` random table (the procedural/grass source) instead of a
  multiplicative coordinate hash whose low bits are linear in (tx,ty) and showed
  through `% 4`.
- **Dungeon framerate regression from tile art** — removed a per-tile
  `imageSmoothingEnabled` toggle (a dungeon viewport is ~all floor); smoothing is now
  set once per frame.

## [0.9.0] - 2026-06-05

First formally versioned release. Consolidates the work from development
sessions 1–9 into a single source-controlled project.

### Project
- Promoted the git repository to the project root; the live game is now the
  tracked `index.html` (previously an untracked `latest build.html`).
- Replaced the old filename-suffix versioning (`_v1`, `_v2`, `_MP_Build`,
  `_refactored`, …) with git history + tags. Old snapshots remain recoverable
  in git history.
- Documentation consolidated under `docs/`, older snapshots under `docs/archive/`.

### Game (state at session 9)
- Wilderness survival mode (600×300 seeded map: villages, obelisks, shrines, fog of war).
- Enemy roster: goblin, archer, warrior, bomber, shaman, king (boss milestones).
- MOBA skill system: heavy attack, dash, whirlwind, leap — unlocked via skill points.
- Four patron-god shrines (Cilia/Ikras/Bhumi/Boreas).
- Firebase Realtime Database multiplayer (delta-compressed, ~8 Hz).
