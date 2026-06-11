# Changelog — Dungeon Forge (pre-rename archive)

This is the pre-rename **Dungeon Forge** changelog: versions **0.9.0–0.11.0** (June 2026).
It was archived from the root `CHANGELOG.md` when the game was renamed to **To Dust** and
versioning was reset to 0.1.0. The live changelog now begins at `## [0.1.0]`; everything below
is the legacy era, preserved verbatim.

---

## [0.11.0] - 2026-06-05

### Added
- **Goblin Warrior art** — static 8-directional sprite (`char.warrior.*`), cut from a
  black-background turnaround sheet (`art/enemy goblin warrior.png`) via edge-seeded
  flood fill (preserves internal shadows) + connected-component isolation per pose.
  Replaces the procedural pixel sprite; drawn upright like the goblin/archer/king,
  facing the target via the 8-way octant. New reusable slicer: `tools/slice-turnaround.py`.
- **Cilia's Fire — imbued Whirlwind** — channelling the whirlwind while fire-imbued emits
  an expanding ring of fire every 2 seconds. Each ring travels outward from the player and
  ignites every enemy its edge sweeps over (impact + 3s burn, once per enemy). Uses the new
  `art/fire ring.png` sprite (black-bg, blitted additively). Damage routes through
  `gDealEnemyDamage` (MP-safe), and the ring replays as a render-only visual on remote peers
  via a per-player `fr` cast signal (mirrors the fire wave's `fw`) — no double damage.
- **Cilia's Fire — imbued Leap** — a fire-imbued leap leaves a burning cross (X) of flames at
  the impact point (`art/fire X.png`, blitted additively as a floor decal beneath characters).
  It lingers ~2s and burns enemies standing on either diagonal arm, re-ticking every 0.5s with
  a refreshing 3s burn. Damage
  via `gDealEnemyDamage` (MP-safe); replays render-only on peers via a per-player `fc` signal.
- **Cilia's Fire — imbued Dash** — a fire-imbued dash leaves a trail of burning ground in its
  wake (`art/burning ground.png`, black keyed to transparent so it reads as a scorched floor
  decal under characters). Patches drop every ~18px along the dash, linger ~1.6s, and burn
  enemies on them (re-tick every 0.4s + 3s burn). Damage via `gDealEnemyDamage` (MP-safe);
  peers replay a damage-free trail under a remote fire-dasher via a per-player `df` flag.
  This completes the four imbued warrior sword skills (swing, whirlwind, leap, dash).

### Changed
- **Enemy sizes** — Goblin Warrior sprite drawn 2× larger; normal Goblin sprite ~1.33×
  (≈⅔ the player's height) and Goblin Archer ~1.2× (≈90% of the goblin). Each enemy's
  body hitbox (`radius`) and ground shadow scale with its sprite; HP bars are unchanged.
- **Thinner enemy health bars** — all in-world enemy HP bars reduced from 4px (King 6px)
  to 1.5px thick (≈⅓–¼) so they take up less screen space; bar widths unchanged.
- **Player hitbox** — collision radius 11→9 so it hugs the body silhouette just inside the
  2× player sprite (was overshooting the visible body).
- **Imbue balance pass** — fire-dash trail patches overlapped (~3 deep) and each ticked the
  same enemy independently, so standing on a trail dealt ~3× intended (~60 DPS on a cheap
  mobility skill). Trail damage now shares one per-enemy cooldown across all patches
  (predictable ~25 DPS regardless of overlap); per-tick base 8→10 to offset the change.

### Fixed
- **Hit-flash red box** — the on-hit red flash tinted the opaque tile background inside the
  sprite's bounding box (a flashing red square), because `gDrawSprite` filled `source-atop`
  directly on the main canvas. Now it tints a sprite-shaped offscreen copy and blits that, so
  only the sprite itself flashes red. Fixes the player and all enemies.
- **Dash white box** — dashing (evasion) drew a white rectangle overlay (`#aabbcc`,
  `lighter`) around the player. Removed; the dash now flashes the player **sprite** white
  for its i-frame window (and the dash's `iFrames=999` no longer triggers the red hit flash).

## [0.10.0] - 2026-06-05

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
