# Changelog

All notable changes to Dungeon Forge are recorded here. Versions follow
[Semantic Versioning](https://semver.org/) (pre-1.0: minor = features, patch = fixes).

Tag each release in git: `git tag -a vX.Y.Z -m "..." && git push origin vX.Y.Z`.

## [Unreleased]

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
