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

### 🔴 Player WALK cutouts have a loose gray halo — re-key tighter to match the idle (ENG → ARTIST, 2026-06-10)

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

---

## Wilderness / spawning

### 🟡 All 40 wolf camps spawn their packs up front (~160 always-live enemies)
`goWilderness` calls `_wolfSpawnPack` for **every** camp at run start, and camp wolves are despawn-exempt (`campId` set), so ~160 wolves sit in `gEnemies` for the whole run — running AI + separation every frame even when far off-screen. This already bit the **night stream** (the siege live-cap census counted them and starved the stream — fixed by excluding `campId`/`isHeld` in `gWildSpawnTick`), but the perf cost (and the conceptual oddity of every den being "loaded" at once) remains.

**Why deferred:** the stream bug is fixed without it; lazy spawning changes the wolf system's lifecycle and wants its own focused pass + playtest.
**Fix:** spawn a camp's pack lazily when the player nears (mirror the village/ambient pattern), despawn when far, and persist `cleared`/`respawnAt` on the camp so the 3-min cycle survives unload. Keeps the "fixed, revisitable den" model while bounding live-enemy count.

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
