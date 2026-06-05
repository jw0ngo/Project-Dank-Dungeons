# Dungeon Forge

A browser action-RPG — vanilla JS + Canvas, with Firebase Realtime Database
multiplayer. The entire game is one self-contained file: **`index.html`**
(CSS, JS, and pixel-art all inlined). No build step — open it in a browser.

## Run it

Open `index.html` directly, or serve the folder:

```sh
# any static server works, e.g.
python -m http.server 8000
# then visit http://localhost:8000
```

The game boots straight into the town hub (The Sanctum).

## Repository layout

| Path | What it is |
|------|------------|
| `index.html` | **The game.** The canonical, version-controlled build — edit this. |
| `art/` | Source PNGs for the patron gods (embedded into the game as base64). |
| `docs/` | Architecture reference, session journal, working agreement. |
| `docs/archive/` | Older documentation snapshots. |
| `dungeon-forge-project/` | A parallel (stale) experiment to split the game into Vite ES modules. Not the live game. |
| `CHANGELOG.md` | Per-release notes. |

## Versioning

This project uses **git history + tags** for versioning — not duplicated files.

- Edit `index.html` in place; commit each meaningful change.
- For a release: add a `CHANGELOG.md` entry, then tag it:
  ```sh
  git tag -a v0.10.0 -m "v0.10.0 — <summary>"
  git push origin main --tags
  ```
- Pushing `main` deploys the latest `index.html` via GitHub Pages.

See `docs/` (start with `DUNGEON_FORGE_CTO_DOC.md`) for architecture, and
`CLAUDE.md` for guidance when working with AI assistants.
