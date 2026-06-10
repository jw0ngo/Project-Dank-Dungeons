# To Dust — Clean-Up Backlog

**A running list of known-but-deferred issues: dead code, legacy vestiges, inconsistencies, and low-priority bugs.**

This is the parking lot for findings we spot while doing other work but deliberately *don't* fix in the moment — because they're out of scope, low-impact, or carry enough risk (e.g. multiplayer serialization) that they deserve their own focused pass. When there's no higher-priority work in `ROADMAP.md` *Now*, pull from here.

**How to use this doc**
- When you spot something but decide not to fix it now, **add a row here instead of leaving it only in a commit message or your memory.** Note where it is, why it was deferred, and the suggested fix.
- When you fix one, move it to **Resolved** at the bottom (with the commit/date) or just delete it — git history keeps the record.
- Severity: **🔴 bug** (wrong behavior) · **🟡 cruft** (dead/misleading code, no behavior impact) · **🟢 polish** (fidelity/consistency nicety).
- Keep entries terse. Link to `file:line` where it helps, but line numbers drift — prefer a greppable symbol name.

---

## Art / sprites

### 🟢 UNWIRED ART INVENTORY (audit 2026-06-10) — prepped + committed to `assets/`, zero refs in `index.html`

A batch of Artist-prepped art is committed to `assets/` but **not referenced anywhere in `index.html`**
(verified: the whole `ART_MANIFEST` wires only `tile.grass`/`tile.floor`/`tile.dirt` + `world.shrine` +
the character sprites). No engineering handoff was queued for most of it, so it was untracked until this
audit. Each row is a wiring to-do; they are **not** all the same kind of work (tiles auto-wire; props need
per-object draw hooks). The two pre-existing handoffs below (hurt poses, chests+coin) are the only parts
that were already tracked.

| Asset set | Files | Commit | Status / wiring path |
|---|---|---|---|
| ~~**Rock tiles**~~ | `assets/tile/rock-0..8` (9) | `c7ddc67` | ✅ **WIRED 2026-06-10.** Turned out **not** mechanical: the cuts are **transparent cutouts** (a rock silhouette, ~45% alpha), not opaque ground — so the `gTileArt` blit-and-return path is wrong (would show black gaps). Wired via a new `gTileProp` overlay path in `gDrawTile`: draw a **grass** ground base, then blit the rock cutout; procedural `R` draw kept as fallback. |
| ~~**Wooden spike-fence tiles**~~ | `assets/tile/spike-0..8` (9) | `c7ddc67` | ✅ **WIRED 2026-06-10.** Same overlay path (cutout ~55% alpha). Ground base = **dirt** (village palisade). The art cutout is a fixed-orientation fence segment — unlike the procedural draw it isn't neighbor-edge-aware, so a fence line draws same-facing segments; acceptable first wire, flag if it reads wrong. |
| **Cobble tiles** | `assets/tile/cobble-0..3` (4) | `2da0b0a` | ⏸️ **Deferred (Josh's call 2026-06-10).** Resolved the open question: cobble is **opaque ground**, and the town (HUB_MAP) ground is all `TILE_FLOOR` — the *same* id as the dungeon floor (dark `floor` art). Wiring it means either a Sanctum-only `inTown` branch in `gTileArt` (cobble in town, dark stone in dungeon) **or** replacing `floor` globally. Josh chose to leave it unwired for now. Pick it up by deciding that fork. |
| **Sanctum set-piece props** | `assets/world/`: `well`, `fountain`, `barrel`, `banner-large`, `banner-small`, `dungeon-gate`, `market-stall`, `target-stand`, `todust-sign`, `torch-post`, `training-dummy`, `weapon-rack` (12) | `2da0b0a` | **Per-prop work** — each is a town set-piece needing a draw hook (most town props load via a separate pipeline, not the manifest; only `world.shrine` is a manifest entry today). Check whether each currently renders procedurally and is meant to *replace* that draw. Raster art → draw at `devicePixelRatio` (`_prepHiDPICanvas`). **Some of these map to existing town objects** (training-dummy, target-stand, weapon-rack, torch-post, well, fountain) — confirm the object exists and where it's drawn before wiring. |

**Lesson (corrects this entry's first draft):** "tiles auto-wire, mechanical" was wrong for rock/spike —
**always check a tile cut's alpha before assuming the tile-art path.** Opaque → `gTileArt` (blit-and-return);
**transparent cutout → an overlay path that draws ground first** (`gTileProp`). The Sanctum props still want a
per-prop pass (confirm the draw site for each, decide procedural-replace vs new object), better sized as their
own focused session; which props matter is partly an art-direction/PM call.

**Cross-ref:** the chest/coin (`world.favorcoin`/`chest-closed`/`chest-open`) and the enemy hurt poses are
tracked separately in the two handoff entries immediately below (also still unwired).

---

### 🟢 ENGINEER HANDOFF (Artist → Eng, 2026-06-10) — wire the enemy HURT pose sprites

Art is committed (`art(enemies): hurt-pose sprite sheets…`): 32 cutouts in `assets/char/<id>hurt-<dir>.png`
for `goblinhurt` / `archerhurt` / `direwolfhurt` / `alphawolfhurt`, sliced to each family's idle/atk frame
size (goblins 192, wolves 256) so they swap at the same per-enemy `gs`. **This is a NEW pose state the
engine doesn't have yet** — `gDrawEnemy` (the `_bid` selection, ~`index.html:7784`) only picks idle/atk.
- **Add to `ART_MANIFEST`** (no-separator id convention, like `goblinatk`):
  ```
  'char.goblinhurt.nw':'assets/char/goblinhurt-nw.png', …(8 dirs)… 'char.goblinhurt.se':'assets/char/goblinhurt-se.png',
  'char.archerhurt.<8 dirs>':'assets/char/archerhurt-<dir>.png',
  'char.direwolfhurt.<8 dirs>':'assets/char/direwolfhurt-<dir>.png',
  'char.alphawolfhurt.<8 dirs>':'assets/char/alphawolfhurt-<dir>.png',
  ```
  (full 32-line snippet was in the Artist handoff; all are `assets/char/<id>-<dir>.png`.)
- **Draw intent:** select `char.<defId>hurt.<dir>` while the damage-flash is active (`e.hitFlash>0`),
  priority over idle (your call vs mid-attack), drawn at the **same `gs`** — there is no per-pose draw-mult.
- **Two flags:** (a) `hitFlash` is ~8 frames — likely too brief to read; give the swap its own short
  `_hurtHold` if it flickers (the wolf-bite `biteStrike` flash-past lesson). (b) **Scale parity:**
  `check-pose-scale.py` vs idle reads goblin ~0.97 / alphawolf ~0.99 (ship at parity) but archer ~0.84 /
  direwolf ~0.88 measure *wider* (hunched recoils). Since there's no per-pose lever, if the archer/wolf
  flinch reads oversized in-game either add a per-pose mult in `gDrawEnemy` or ping the Artist to re-pad.
- **Verify:** `node --check` + grep each new key + `python dev.py`, all 8 facings, hard-refresh.

### 🟢 ENGINEER HANDOFF (Artist → Eng, 2026-06-10) — wire the world props (favor coin + treasure chests)

Art is committed (`art(world): favor coin + treasure chest props…`): `assets/world/favorcoin.png`,
`chest-closed.png`, `chest-open.png` (transparent cutouts). **These are new world OBJECTS with no draw
hook or entity kind yet** — more than a manifest paste; it's systems work (coin = a Favor-currency pickup
drop; chest = an interactable that swaps closed→open on open).
- **Manifest keys:** `'world.favorcoin':'assets/world/favorcoin.png'`, `'world.chest-closed':…`,
  `'world.chest-open':…` (most town props load via a separate pipeline; only `world.shrine` is currently a
  manifest entry, so confirm the load path).
- **Raster art:** painted/photographic → draw at `devicePixelRatio` (`_prepHiDPICanvas`/`<img>`, not an
  undersized backing store). Size from the longest side (coin 190×192, chests ~224–256 tall); source
  masters are large enough to scale up.

### ✅ RESOLVED 2026-06-10 — Player WALK cutouts had a loose gray halo + E/W shoe (defringe-v2 + boot-protected re-cut)

**Resolution (Artist, three causes — each invisible to the previous fix's metric):**
1. **Grey semi-transparent fringe** (all directions): `tools/defringe-sprite.py` luminance-clamps the
   fringe to the idle outline tone. **defringe-v2 fix:** v1 clamped only `8<α<200` and its `--check`
   measured the same soft band — but the visible halo is the **near-opaque rim** (`α 200–239`, bright
   grey ~113 vs idle ~48), so v1 false-passed (measured "11" yet still haloed in-game). v2 covers the
   full ramp to `α<245` (`FRINGE_HI`); a separate `SOLID_A=200` still drives `--trim`. **Always QA a
   fringe metric against the idle's FULL ring (`8≤α<245` = 18–22), never a soft sub-band.**
2. **Cast floor shadow** (the clip-derived dirs): the studio clip's cast shadow (lum 3–13, darker than
   its lum-26 backdrop) shipped as an opaque smudge trailing the feet — invisible to the fringe metric
   (α=255). Fixed by `--shadow-bg` seeding in `slice-walk-video.py` (seeds the shadow as definite bg).
   **Extended to the DIAGONALS:** the first pass only re-cut E/W; NE/SE were still the pre-`--shadow-bg`
   morning cuts (Josh's "diagonals still haloed"). Re-cut **E, NE, SE** from their source clips
   (`east/northeast/southeast walk.mp4`) with `--shadow-bg`, re-mirrored **W, NW, SW**.
3. **`--shadow-bg` ate the boot** (Josh's "part of the shoe isn't appearing", E/W): the shadow seed
   keyed on `lum<bg_med-10` over the bottom *quarter* of the figure rect — the dark leather/steel boots
   fall in that band and GrabCut removed the front shoe. **Fix:** an absolute darkness ceiling
   `--shadow-lum` (default 16; the cast shadow is lum 3–13, boots are brighter) + a narrower
   `--shadow-band` (0.80 = bottom 20%). Boots survive; shadow still removed.

**State:** all 8 dirs full-ring fringe **14.9–17.4** (idle 18–22), boots intact, registration unchanged
(size 192, feet 189, match-bodyh 181) → same filenames, **no `index.html` / manifest change, no
re-wiring**. QA'd over forest + dirt ground at game scale (`art/player/_haloqa/FINAL_all8.png`). N/S have
no source clip and weren't part of either report — left as-is (defringed). **Verify in-game with a
hard-refresh** (`Ctrl+Shift+R`; the dev server sends no cache headers, so an in-place re-cut otherwise
serves the stale image).

> **Follow-up (Artist, 2026-06-10, same day — completes round 1):** round-1's "10.8–17.3" was a
> **defringe-v1 false-pass**. v1 trusted every `α≥200` pixel as figure and clamped only the `8<α<200`
> soft band, and its `--check` metric only measured that band — but the visible halo lives in the
> **near-opaque rim** (`α 200–239`), which on the bad frames was bright grey (lum ~113 vs the idle's
> ~48). So a haloed frame measured "clean" yet Josh still saw it in-game (E/W worst). **Fixed in
> defringe-v2:** the clamp + metric now cover the full antialiased ramp to `α<245` (`FRINGE_HI`); a
> separate `SOLID_A=200` still defines "solid body" for `--trim`. Re-ran all 32 frames →
> **full-ring lum 12.2–17.3** (idle 18–22); QA'd over forest ground at game scale
> (`art/player/_haloqa/QA-after_idle-vs-walk.png`), idle-vs-walk match confirmed e/s/n/se. This stacks
> *on top of* round-2's `--shadow-bg` re-cut (alpha/geometry) — v2 is RGB-only, doesn't touch alpha.
> **No re-wiring / no `index.html` change.** Verify in-game with a **hard-refresh** (`Ctrl+Shift+R` —
> the dev server sends no cache headers, so an in-place re-cut otherwise serves the stale image).
> **Lesson:** QA a fringe metric against the idle's FULL ring (`8≤α<245`), never a soft sub-band, and
> trust the over-ground render — not the number alone.

> **Follow-up (Artist, 2026-06-10 — item 3's `--shadow-lum 16` was insufficient; boots still eaten):**
> Josh flagged `warrior-se` (head) and `playerwalk2-ne` (foot) as broken and suspected the *new* hurt/prop
> slicing was corrupting existing PNGs. **It wasn't** — `git diff HEAD` was empty for both and the slicer
> only ever writes `{id}-{dir}.png` for its `id` arg (proven). `warrior-se` is a pre-existing original cut
> (untouched since the externalize commit). But `playerwalk2-ne` **was** a real regression from this same
> walk-halo session: a sweep of all 32 frames vs the pre-halo version showed **14 frames** lost foot area —
> **E/W −31…−54%, SE/SW −11…−21%, the worst diagonals (ne2/ne4) −29%** — i.e. item 3's `--shadow-lum 16 /
> --shadow-band 0.80` did **not** actually save the side/diagonal boots; the planted side-profile foot sits
> deepest in the seed band. **Real fix:** re-cut E/NE/SE (+ mirrors W/NW/SW), 24 frames, with a tighter seed
> **`--shadow-lum 13 --shadow-band 0.90`** (only the lum 3–13 shadow core, bottom 10% — boots at lum≥13
> survive), then **re-ran defringe-v2** (the re-cut from the mp4 reintroduced the bright-grey halo, edge
> ring ~125; back to ~17 after). Same frames/size 192/feet 189/match-bodyh 181 → registration + manifest
> keys unchanged, **no `index.html` change**. N/S un-touched (0–2% loss, no baked shadow). **Lessons:**
> (a) the feet-area pixel count is a *false metric* here — it conflates intended shadow removal with boot
> loss, so the −44% was mostly shadow; verify boots by the **render**, not the count. (b) "boots survive"
> in a backlog note is a claim to **re-measure across every affected facing**, not assert from the easy
> frames. (c) an mp4 re-cut is **alpha+RGB** — it undoes any prior RGB-only defringe, so defringe must
> follow every re-cut. Verify in-game with a hard-refresh.

**Why NOT the suggested re-key:** tested and rejected — a `--tol` sweep (24→48) on the south set
showed the figure pixel count collapsing (9.5k→4.8k) before the fringe got clean: the knight's
neutral-grey steel sits inside any colour-distance that cuts the grey band (the same fg/bg-overlap
that forced GrabCut for the video cuts). Also rejected: nearest-solid-pixel RGB bleed (pulls bright
armour highlights outward — fringe got *worse*, 21→61). The defect was never alpha/keying — it's the
**RGB of the semi-transparent edge pixels** (grey bg blend instead of the house-style dark outline),
so the fix is colour-only: luminance-clamp the fringe to the idle outline tone (~18).

<details><summary>Original report (ENG → ARTIST, 2026-06-10)</summary>

**Symptom (reported in-game):** while moving, the knight shows a **dark halo** around the figure and the
**gap between the legs reads wrong**. (The leg gap itself is correct cutout transparency — it only looks
buggy by contrast with the haloed edge.) Idle sprite is clean; only the walk frames are affected.

**This is NOT a render regression — it's baked into the walk PNGs.** Verified: (1) the full eng session
diff touches **zero** lines of the player-sprite path (`drawAnyPlayer`/`gDrawSprite`/`gDirBody`/
`PLAYER_WALK_OCT`/`_smooth`/`PSCALE` all untouched; the only render line added all session is a
`save()/restore()`-wrapped, player-exempt composite op in the enemy threat-glow); (2) the runtime art in
`assets/char/` has no working-tree changes. The artifact is a **background-removal quality** issue from
`tools/slice-walk-cycle.py`: the bad frames carry a **wide band of ~mid-gray semi-transparent edge
pixels** (vs the idle's tight, dark fringe). Blitted upscaled with `imageSmoothingEnabled` over the dark
forest ground, that gray band spreads into the visible halo.

**Evidence — alpha-fringe measurement (avg brightness of the 8<α<200 edge band; lower+fewer = cleaner):**

| Facing | Frames | avg fringe brightness | status |
|---|---|---|---|
| **idle (all 8 dirs)** | — | **13–16** (≈650–830 px) | ✅ the target |
| **`-s` (south)** | 1,2,3,4 | **59–64** (1074–1607 px) | 🔴 worst — all 4 frames |
| **`-n` (north)** | 1,2,3,4 | **53–58** (1032–1513 px) | 🔴 worst — all 4 frames |
| `-se` / `-sw` | **1 & 3** | **79 / 133** | 🔴 frame 3 especially |
| `-ne` / `-nw` | **3** | **108** | 🔴 frame 3 |
| `-se`/`-sw`/`-ne`/`-nw` | 2 & 4 | 23–31 | 🟡 borderline |
| `-e` / `-w` | 1 & 4 | 21–24 | ✅ closest (re-cut last) |
| `-e` / `-w` | 2 & 3 | 34–37 | 🟡 borderline |

**Proof it's fixable in-pipeline:** the `-e`/`-w` frames were *re-cut from the clip* (commit `6b5208e`) and
came out clean (21–24) — same slicer, tighter result. The `-n`/`-s` frames (cut first, 09:50) and the
mirror-derived `-3` frames never got that pass.

**Fix (Artist-owned — slicing/keying is yours; engineer only wires):** re-cut the haloed frames with
`tools/slice-walk-cycle.py`, tightening the key so the fringe goes dark-and-thin like the idle:
- **`--tol`** (bg color-distance tolerance, default **24**) — too low here, so the gray bg-adjacent band
  survives as semi-transparent fringe. Raise it until the gray band is cut.
- **`--erode`** (figure-edge erode px, default **1**, "halo kill") — bump to 2 to shave the residual fringe.
- QA each re-cut with **`--compare assets/char/player-<dir>.png`** against the idle.
- **Priority:** `-n` and `-s` (all 4 frames) first, then the `-3` frames of `-ne/-nw/-se/-sw`, then the
  borderline rest. Same filenames → no re-wiring; the manifest already points at them.

**Target:** avg fringe brightness **≲ 20** and fringe-pixel count near the idle's (~650–830). **Engineer
will re-run the alpha-edge measurement on redelivery to confirm** (the script above lives in this session's
diagnosis; ask the engineer to re-verify or fold it into the slicer's `--compare` QA output).

</details>

---

## Character / inventory screen

### 🟢 Your own custom sprite is invisible to you (only other players see it)
**Audited 2026-06-09 — NOT dead code.** The character creator is reachable (hub "🎨 CHARACTER"
button → `showScreen('cc-screen');ccInit()`), and the `df_player_sprite` localStorage contract +
`ccPixelsToCanvas` are **live in multiplayer**: your sprite is broadcast to the room on launch
(`_mpSanctumLaunch`/`_mpLaunch`) and `ccPixelsToCanvas` renders *other* players' sprites. So the
original "orphaned, delete it" framing was wrong — removing any of it would break MP custom sprites.
(The `charDrawPreview`/`invRenderCharPreview` functions the old note named no longer exist.)

The real residue is a **cosmetic inconsistency**: your custom sprite shows to everyone *else*, but your
own local player render + character/inventory previews still draw the knight portrait. So you can't see
your own creation in singleplayer.

**Why deferred:** it's a design call (should the local hero reflect the custom sprite, or is the knight
the canonical protagonist now?), not a correctness bug — and it's harmless today.
**Fix (design-gated):** if custom sprites should be self-visible, route the local player draw + previews
through `ccPixelsToCanvas(JSON.parse(df_player_sprite))` with the knight as fallback. If the knight is
now canonical, consider demoting the creator to an MP-cosmetic-only feature (or cutting it) — but that's
a CD/PM call, not an engineer drive-by.

---

## Resolved
*(Move items here with a date when fixed, or just delete them — git history is the real record.)*

- **2026-06-10 — Wolf camps stream their packs in/out instead of all spawning up front.** `goWilderness`
  no longer pre-spawns all 40 packs (~160 always-live wolves). `gUpdateWolfCamps` now instantiates a
  camp's pack when the player comes within `WOLF_CAMP_SPAWN_R` (45 tiles) and sheds a *pristine* pack
  (none dead, none engaged) once they pass `WOLF_CAMP_DESPAWN_R` (62 tiles) — both well outside the
  22.6-tile leash, so a struck pack leashes home + de-aggros before it's shed and half-fought/cleared
  state is preserved. Per-camp `cleared`/`respawnAt`/`chest`/`_wolves` live on `gWildCamps`, so the
  3-min clear→reward→respawn cycle survives unload; the rock crescent (tile layer) + chest still render
  at any range. New `camp._spawned` flag tracks instantiation; respawn now just clears the cooldown and
  lets the streaming spawn re-arm the den. `node --check` + grep-verified; behavior canary
  (`Sim.batch`) is browser-side.
- **2026-06-09 — `slice-turnaround.py` is path-native.** The slice tool now writes its 8 cutouts
  straight into `assets/char/` as `<id>-<dir>.png` (hyphen = manifest convention) and emits a path-based
  `'char.<id>.<dir>':'assets/char/<id>-<dir>.png',` snippet — base64 encode step removed, `import io`/
  `base64` gone. New `--assets-dir` overrides the destination; contact sheet now built from in-memory
  cutouts (no temp-file re-open). Smoke-tested on `goblin-warrior.png`; `docs/ART_PIPELINE.md` updated.
- **2026-06-09 — Wolf lunge-bite pose now reads (draw-only hold).** Added `e._biteHold` (24f), set
  alongside `biteStrike=12` when the lunge fires, ticked in `_aiWolf`, OR'd into `_wolfBiting` in
  `gDrawEnemy`. The pounce pose lingers ~0.4s instead of flashing past in ~0.2s. `biteStrike`/`lungeTimer`
  (the actual hit + exposed-recovery timing) untouched — pure display dwell, runs through `gSimUpdate`.
- **2026-06-09 — Inert STR/DEX/INT scaling shims removed.** Deleted `W_scalingMult` /
  `weaponScalingMult` / `skillScalingMult` / `wildStrMaxHp` / `wildStrHpRegen` / `wildIntMagicMult` /
  `wildIntMaxMp` / `wildIntMpRegen` / `wildDexSpeedMult` / `wildDexAtkMult` and stripped their no-op
  `*1`/`+0` factors from every call-site (combat, regen, speed, attack-timing, `_charSkillDetail`,
  `_wildApplyStats`). Live helper `wildDexCdMult()` (driven by `wildBuffs.cdPct`) kept.
- **2026-06-09 — `wildDmgMult` (`_wdm`) removed entirely.** The inert per-run damage hook (always `1`,
  only multiplied the normal swing) is gone — field init + run-start reset + the swing factor all
  deleted. %damage now flows uniformly through `wildBuffs.damagePct` (`_dbuf`) for every source.
- **2026-06-09 — Skill tooltips show live (buffed) damage.** `_charSkillDetail` now multiplies every
  damage line by the same `_dbuf` (obelisk + level-up %damage) combat uses; crit left out (it's
  probabilistic, so these are the guaranteed-hit numbers).
- **2026-06-09 — Bow kill now drops an XP orb.** Bow death path calls `gKillEnemy(en)` with defaults
  instead of `{xpOrb:false}`, matching every melee path.
- **2026-06-09 — Removed the vestigial sword-charge player state.** The old hold-to-charge normal-attack
  mechanic was gone but its state lingered: `charging`/`chargeTick` (player init, `_doRespawn` reset, the
  unreachable `_pendingCharge` input-buffer branch, the remote-player draw stub) and the two MP
  serialize/deserialize keys. All removed. Wire-compat holds both directions — read sites already use
  `!!`/`||0` defaults, so an old client sending the keys is ignored and a new client omitting them reads
  `false`. The live `_chargeDmg` swing-damage carrier and the bow's `chargeMax`/`bowChargeTick` and enemy
  `phase==='charging'` are unrelated and untouched.
- **2026-06-09 — Renamed `DUNGEON_FORGE_CTO_DOC.md` → `TO_DUST_CTO_DOC.md`.** `git mv` + updated all 14
  referencing files (CLAUDE/AGENTS/README, `product/CLAUDE.md`, `.claude/commands/*`, `.claude/agents/*`,
  `.codex/agents/*.toml`, `tools/pm-bot/pm_bot.py`, `tools/doc-drift-check.ps1` regex, ENGINEERING_CHARTER,
  PRODUCT_MANIFESTO, learnings/engineer, and the doc's own self-ref) in one pass. The `DF1` seed prefix
  and `dungeon-forge:map:` localStorage key stay frozen (save/seed compat).
