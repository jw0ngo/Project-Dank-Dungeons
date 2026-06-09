# To Dust — Session Journal
**Append-only log of sessions, decisions, and hard-won debugging lessons**

Each entry captures: what was built, what broke badly, and what the root cause taught us. The debugging lessons are the most portable value — they represent understanding that cannot be derived from the code alone.

---

> **Older sessions (1-13) are archived** in [`docs/archive/session-journal-2026H1.md`](archive/session-journal-2026H1.md).
> Their still-live, distilled value survives in the **Debugging Heuristics Reference** table below and in
> `docs/learnings/engineer.md`. This live file keeps only the **most recent sessions** + the reference tables,
> so a session loads the running context without the full back-catalogue. Archive older sessions here as it grows.

---
## Session 14 — Image-Art Combat Pass, Card Pool Expansion, Weighty Heavy, Level-Up Redesign
*June 2026 | engineer (+ a parallel playtest session sharing the tree)*

### Built
- **Image-art combat poses across the whole cast.** Player normal-attack + heavy-attack + a
  procedural walk bob; every enemy got an attack pose wired to its real attack state (goblin
  `goblinatk` on the new cone windup, archer `archeratk` on `shootWindup`, warrior `warrioratk` on
  `swing-windup`/`charging`, bomber `bomberatk` on a new throw windup, shaman `shamanatk` on cast,
  king `kingatk` on any attack phase); bomber/shaman upgraded from procedural to directional art.
- **Goblin telegraphed melee** — plant → fill a red cone over `atkWindup` → strike only if still in
  cone (dodgeable); plus body **contact chip** on its own cooldown so a swarm can't be walked through.
- **Removed post-hit i-frames** (a swarm can't be cheesed by a mercy window); dash/leap/roll evasion
  i-frames kept; fire-beam trap moved to its own `_beamCd`; visual-only `_hitFlash` keeps the red flash.
- **Card Pool Expansion (Now #2, shipped):** Stage 1 per-player swing/heavy/dash stat migration to
  `pSkillStat`; Stage 2 the swing/heavy/dash cards (+ `pSkillSpeed` % form) + HP-regen nerf; Stage 3
  the **crit** system (chance/damage, host-side roll on `gDealEnemyDamage`, gold crit numbers).
- **Weighty heavy attack** — doubled commitment window (active swing + planted recovery), true
  movement lock (the `p.smashing`→`p.heavySwinging` bug), feet-anchored pose scale.
- **Level-up "Choose a Blessing" redesign** — CSS chrome (frame/title/cards/buttons), themed by patron
  (Cilia warm / Nameless-Knight cool), figures as image cutouts, semi-transparent backdrop.
- **Sprite-keying tooling** hardened (`--erode` halo, `--global` pockets, `--sever` detail-equals-bg)
  + a size-consistency step — see the Sprite Import Checklist below.

### Lessons
- **Parallel Claude sessions on ONE shared working tree → divergent history; reconcile by CONTENT,
  not by panic or commit-message.** An eng session and a playtest session both committed to the same
  tree and pushed; `main` diverged from origin (ahead 2 / behind 1) with two *same-named* "full-res
  sprites" commits on each line. The safe reconcile that loses nothing:
  1. **Commit your own uncommitted work FIRST** — a real commit can't be lost in a merge; a dirty
     tree can.
  2. **`git diff <localHEAD> origin/main --stat`** to see the *real* content delta. Here it was **only
     `index.html`** — the 24 sprite PNGs + slicer were byte-identical on both lines (one line just had
     an extra "combined index.html" checkpoint). Identical content on both sides ⇒ the merge is
     conflict-free. **Don't trust commit-hash/message identity — diff the bytes.**
  3. **`git merge` (NOT rebase).** Rebase would re-apply the duplicate file-adds onto origin and
     conflict ("already exists"); merge with identical content just records the history join.
  4. **Verify the merged file parses and carries markers from BOTH lines** before pushing.
- **Speed cards are a different shape than flat cards.** Attack-speed / charge-speed must be a
  *diminishing percent* (`base/(1+Σ%/100)`, via `pSkillSpeed`), not a flat `skillMods` add — flat
  frames stack linearly to zero and violate the "no frames in card text" rule.
- **A flag that's never set silently disables a guard.** The heavy movement-lock gated on `p.smashing`
  (never assigned anywhere) instead of `p.heavySwinging`, so the player could run mid-smash for ages.
  Grep that a guard's flag is actually *written* somewhere, not just read.

---

## Sprite Import Checklist (run this for EVERY new sprite)

Cutting a sprite out of its background — and matching its size to the rest of the character's frames —
keeps re-introducing the same handful of bugs. `tools/slice-turnaround.py` has the keying levers + an
automatic QA pass; steps 1–4 are keying, step 5 is **size consistency**, step 6 is **geometry recovery**
(figures drawn larger than their cell). Run all of it every time:

1. **Slice it**, then **look at the magenta QA contact sheet** the tool prints (`contact.png`). White/dark
   halos and any background showing through pop instantly against magenta. The tool also prints a
   per-direction **`bg-leak Npx`** count and a final **`QA: CLEAN / CHECK`** verdict — a non-trivial leak is a bug.
2. **Edge halo** (thin white/dark fringe at the silhouette = anti-aliased bg-blended pixels left opaque):
   add **`--erode 1`** (tightens the alpha mask ~1px); raise to 2 if it persists. A small `--feather` then softens.
3. **Background showing through an enclosed pocket** (gap inside a drawn bow/string, between shrine pillars —
   anything the figure encloses): the default edge-seeded flood fill can't reach it. Use **`--global`** to cut
   *all* background-coloured pixels. Only safe when interior detail isn't the same colour as the bg.
4. **Chunks of the figure missing / fragmented** (dark armour on a black sheet, light stone on a white sheet —
   interior detail shares the bg colour): first try **lowering `--thresh`** toward the true bg brightness (e.g.
   the goblin warrior idle needed `--thresh 24` on its near-black sheet). If the detail is *genuinely* the same
   colour as the bg so no threshold separates them (the player **normal-attack** lunge — dark steel armour on a
   ~25-brightness sheet), use **`--sever N`** instead: it erodes the background mask to cut the thin channels
   that connect interior recesses to the exterior, then floods from the border, so the recesses stay filled.
   In `--sever` mode the `bg-leak` metric over-reports (the kept detail *is* bg-coloured) — judge by the magenta
   contact, not the number.
5. **Size consistency — the new pose must render at the SAME on-screen body size as the character's idle/base
   sprite.** Source sheets are often drawn at a *different zoom* (an attack/swing sheet zoomed out to fit the
   motion → figure physically smaller in its cell). **Do not scale-match by the bounding box** — it's polluted
   by extended weapons (a sword/bow flings the bbox wide) and crouched stances (shortens it). Match a
   **pose-invariant body feature: helmet/shoulder width in a FRONT view** (`'s'`/`'n'`) — measure it in the new
   frame vs the idle frame; the ratio is the correction. Fix by re-slicing at a corrected `side`, or (to keep an
   extended weapon from clipping) a **feet-anchored draw multiplier** that grows the pose upward from the foot
   line (see the player heavy `HEAVY_DRAW_MULT` = 1.3, the measured idle/heavy helmet ratio). **Measure, don't
   eyeball** — coarse visual steps overshoot (1.5× looked right; the measured truth was 1.3×). Confirm by
   rendering the new pose next to idle, bottom-aligned, heads matching. (Hit on the king, bomber, and player heavy.)
6. **Figure sliced flat at an edge / paws-tail-nose cut off** (wide **lunge / attack** poses drawn *larger than
   their 3×3 cell* — they overflow into the empty centre, and the rigid per-cell crop throws those pixels away):
   use **`--bleed N`**. First **diagnose**: get each figure's true connected-blob bbox and compare it to its cell
   *and* to the sheet edge. If the blob overflows the **cell** but not the **sheet edge**, the pixels exist on the
   sheet (just in the empty centre) and `--bleed` recovers them — it cuts on a window expanded N px past each cell,
   then keeps only the component that *owns* the cell (neighbours pulled into the window are dropped). Set N a bit
   above the worst overflow (the wolf-mother attack lunge spilled ~145px → `--bleed 170`). If a blob overflows the
   **sheet edge**, those pixels are genuinely gone — re-generate the source smaller in-cell; no flag recovers them.
   The attack-pose case is usually **both** problems at once — overflowing *and* white-on-white — so the wolf-mother
   attack sheet wanted `--bleed 170 --sever 2`. Owner-selection assumes figures don't touch (clean bg gap between
   cells); watch the per-direction `comps=N` print and the magenta contact for a dropped real part.

Single one-off images (not 3×3 turnarounds, e.g. `world.shrine`) aren't run through the slicer, but apply the
*same* global-key + erode + magenta-check by hand. The shrine needed both (`--global` for the pillar gaps, 1px
erode for the halo).

---

## Debugging Heuristics Reference

| Symptom | First thing to check |
|---------|---------------------|
| Enemy unkillable from spawn | Missing `hp` in EntityDefs |
| Enemy has wrong AI / double movement | `isXxx` missing from goblin exclusion list |
| Scaling/buff has no effect | Duplicate function declaration |
| Enemies missing when area discovered | Despawn radius + `isHeld` flag |
| Click handler fires but nothing happens | Parent `pointer-events:none` |
| Generator produces wrong pattern on circles | Duplicate tile positions before sequence logic |
| `const` variable undefined at runtime | Declaration order — `const` does not hoist |
| `beforeunload` not showing dialog | Handler must be unconditional |
| Bitwise hash gives constant values | `Date.now()` overflows 32-bit |
| Buff system makes enemies unkillable | maxHp division of rounded integers; store original |
| Tiles/variants form a repeating pattern | `hash % 2^k` reads low bits — use the `gWallVar` table |
| Sudden FPS drop after a draw change | Per-primitive canvas state toggle in a hot loop |
| On-hit flash shows a square box | `source-atop` fill on the shared canvas tints the opaque bg too — tint an offscreen sprite copy |
| Sprite looks wrong size vs. another | Per-entity draw multiplier (e.g. `PLAYER_DRAW_SCALE`), not the sprite/box |
| Overlapping AoE patches over-damage | Per-patch hit-cooldowns multi-hit — use one shared per-enemy cooldown |
| `node --check` unavailable / parser rejects valid code | No Node here; use esprima-python but neutralize ES2019+ first (`catch{}`, `??`, `?.`-before-ident, BigInt `0n`) — and skip the parse entirely for numeric/comment-only edits |
| Deleting a stat used in 50+ places | Neuter the helper to its neutral return (1/0); don't edit every call-site (works when the stat's baseline is 0) |
| MP: one player's upgrade buffs everyone | A shared registry (`WeaponRegistry`) was mutated for a per-player effect — use a per-player modifier map read at use-time |
| Map/field read throws on remote peers | Route single→map reads through one null-safe helper (`gIsImbued` guards `p && p.imbues`) |
| White/dark halo around a cut-out sprite | Anti-aliased bg-blended edge pixels left opaque — `--erode 1` in the slicer (tighten the mask) |
| Background showing through inside a sprite | Enclosed pocket the flood fill can't reach (bow gap, shrine pillars) — `--global` key |
| Chunks of a sprite missing / fragmented | Interior detail shares the bg colour — lower `--thresh`; if detail truly matches the bg, `--sever N` (morphological channel cut) |
| New pose renders bigger/smaller than idle | Source sheet drawn at a different zoom — match by front-view helmet width (not the bbox); re-slice `side` or feet-anchored draw mult |
| Sprite clipped flat at a cell edge / limbs cut off | Figure drawn larger than its 3×3 cell, overflowing into the empty centre — `--bleed N` (cut on an expanded window, keep the cell's owner blob). Confirm overflow is past the cell, not the sheet edge, first |

---

## Session 15 — Neutral Wolf Camps (spine)
*June 2026 | engineer | ~12,800 lines*

### Built
- **Neutral Wolf Camps** — the final mechanical-slice feature (spec `docs/specs/neutral-camps.md`).
  40 fixed crescent rock dens at world-gen, each a neutral pack (1 Alpha + 2–4 Direwolves) guarding a
  chest. New `direwolf`/`alphawolf` EntityDefs + `makeWolfEnt` + one shared `_aiWolf` (neutral until
  hit; circle-to-flank; telegraphed lunge-bite with an exposed recovery; `WOLF_LEASH_R` hard-leash →
  disengage + full-heal). Camp-linked wake (`_wolfWakeCamp` from the `gDealEnemyDamage` chokepoint so a
  one-shot still propagates). `gUpdateWolfCamps` inside `gSimUpdate` runs the 3-min respawn + chest-on-
  clear (2–4 Favor via `gGrantFavor`) off the run clock. Crescents carved into the existing `rocks`
  layer (no new tile art); minimap dots; editor palette. Sprites/draw-scales were pre-wired by the
  Artist (`char.{direwolf,alphawolf}.*`, `ENEMY_DRAW_SCALE`).

### Lessons
- **Reuse the village template, but diverge on the *one* new axis.** Camps are villages-shaped (placed
  at gen → `gWildCamps[]` of `data` objects → runtime `_wolves` populated in `goWilderness` → per-frame
  update + chest-on-proximity + minimap dots). The *only* genuinely new code is the behavior that
  differs — neutrality + leash-heal in `_aiWolf`. Copying the surrounding scaffold (despawn exemption,
  reset sites, entity-load `forEach`, draw dispatch) is mechanical; spend the thought on the delta.
- **Wake on the damage chokepoint, not the kill path.** Hooking pack-wake into `gDealEnemyDamage`
  *before* the `hp<=0` branch (not in `gKillEnemy` or the non-fatal `_villageCheckDamageAlert` else)
  means a one-shot killing blow on one wolf still wakes the rest — the obvious "wake on hit" spot misses
  the lethal hit.
- **`SpriteRegistry.get()` falls back to `player`, so the eager fallback arg in `gDrawEnemy` is
  crash-safe** for a brand-new `defId` even before art loads — but the *real* art still renders because
  `gDirBody` finds `char.<id>.<dir>`. New enemy types don't need a pixel-array sprite registered first.
- **Verification reality (no node here):** confirmed syntax by a **differential bracket-balance** of the
  extracted `<script>` vs `git show HEAD:index.html` (identical residual = no nesting broken), plus
  targeted greps for every wiring site + a duplicate-declaration scan. The runtime `await Sim.batch(3)`
  canary and visual playtest remain the browser-side loop (`python dev.py`).

---

## Session 16 — Art externalized (index.html 14 MB → 650 KB)

**Built:** Moved all inline base64 image art out of `index.html` into files under a new `assets/` tree.
A census (`tools/census-base64.py`) found 179 inline blobs — 172 `ART_MANIFEST` entries, 5 `F*_SPR` fire
sprites, 2 figure consts — plus the 4 shrine god-card `<img>`s (12 MB of base64). One scripted pass
(`tools/externalize-art.py`) decoded each blob to a file (named from its manifest key / var), rewrote the
reference to the path, and relocated the POC god cards into `assets/gods/`. `gInitArt` already did
`im.src = ART_MANIFEST[key]`, so a path is interchangeable with a data-URL — the change is
behaviour-preserving. Result: 183 asset files, `index.html` 14 MB → ~650 KB.

**Lesson — externalizing inline art is a value-rewrite, not an engine change, *when* the loader is already
src-generic.** The whole migration was "decode blob → write file → swap the string literal." Zero draw-code
changes. The precondition that made it safe: the only consumer of a manifest value was `im.src = value`
(grep-confirmed — no `atob`, no `startsWith('data:')`, no base64 slicing anywhere). Before externalizing
any inlined data, **grep for code that introspects the value as a data-URI**; if nothing does, it's a
mechanical swap.

**Lesson — for art changes, "no 404s" is the real correctness check, not `node --check`.** A typo'd path
passes syntax check, returns 404 at runtime, and **silently falls back to the procedural sprite** — looks
plausible, art just quietly missing. Verified instead by HEAD-ing every `assets/` path referenced in the
HTML over a local server (183/183 reachable) and headless-rendering the town (Chrome `--headless=new
--screenshot` over `python -m http.server`). The screenshot caught that real sprites loaded; the reachability
sweep caught that nothing was orphaned.

**Lesson — `<img src>` relative paths load from `file://`, but a headless full-boot needs a server.** The
POC confirmed the four god cards render from a bare `file://` double-click (image loads aren't CORS-blocked).
But headless-booting the *whole game* from `file://` produced no screenshot (Firebase remote `<script>`s /
virtual-time timing) — over `http://localhost` it rendered fine. So: `file://` is OK for the shipped game,
but verify headless over HTTP.

**Tooling friction:** `tools/slice-turnaround.py` still emits base64 manifest snippets — now a step behind
the file-based pipeline (logged in `CLEANUP_BACKLOG.md`, flagged in `ART_PIPELINE.md`).

---

## Architecture Decisions Log

| Decision | Rationale | Session |
|----------|-----------|---------|
| Single HTML file | Portability, no build step, easy Claude.ai deployment | 1 |
| Art externalized to `assets/` files (was inline base64) | `index.html` 14 MB → 650 KB; greppable/diffable again; HTTP-cached; lazy-load now possible. Loader was already `im.src=value`, so behaviour-preserving | 16 |
| EnemyRegistry pattern | Decouples AI dispatch from entity creation, easy to add types | 7 |
| `isHeld` universal hold-position | Replaces `isVillage` + `isShrineGuard` redundancy | 9 |
| `gBombFireZones` separate array | Bombs and fire are separate lifecycles; don't mix | 9 |
| Skill points on player object | Persists across level-up screen close, accessible anywhere | 9 |
| `_shamanBaseMaxHp` stored on entity | Avoids rounding drift on buff expiry | 9 |
| Shrine always visible on minimap | Player needs to locate it; fog-gating would make it unfindable | 9 |
| `beforeunload` unconditional | Conditional guards are pre-classified as non-blocking by browsers | 9 |
| Art-tile variants via `gWallVar` table | Coordinate hash `% 4` showed a diagonal pattern; the table is structure-free | 10 |
| Tile art baked to device size, smoothing off | 1:1 blit; per-tile smoothing toggle killed dungeon FPS | 10 |
| FX sprites (fire pillar/wave) additive on black | Black bg drops out, flames glow over the scene | 10 |
| Imbued effects as `gFire*` arrays (ring/cross/trail) | One shape per effect: spawn/update/draw + `gDealEnemyDamage`; MP-synced via cast seq / dash flag | 11 |
| Shared per-enemy trail cooldown (`gTrailHits`) | Overlapping patches would otherwise multi-hit; keep DPS predictable | 11 |
| Engineering Charter as standing operating model | Codifies CTO authority, refactor cadence, and repo verification reality | 11 |
