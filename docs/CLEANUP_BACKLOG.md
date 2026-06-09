# To Dust — Clean-Up Backlog

**A running list of known-but-deferred issues: dead code, legacy vestiges, inconsistencies, and low-priority bugs.**

This is the parking lot for findings we spot while doing other work but deliberately *don't* fix in the moment — because they're out of scope, low-impact, or carry enough risk (e.g. multiplayer serialization) that they deserve their own focused pass. When there's no higher-priority work in `ROADMAP.md` *Now*, pull from here.

**How to use this doc**
- When you spot something but decide not to fix it now, **add a row here instead of leaving it only in a commit message or your memory.** Note where it is, why it was deferred, and the suggested fix.
- When you fix one, move it to **Resolved** at the bottom (with the commit/date) or just delete it — git history keeps the record.
- Severity: **🔴 bug** (wrong behavior) · **🟡 cruft** (dead/misleading code, no behavior impact) · **🟢 polish** (fidelity/consistency nicety).
- Keep entries terse. Link to `file:line` where it helps, but line numbers drift — prefer a greppable symbol name.

---

## Combat / damage

### 🟡 Vestigial sword-charge state still exists and is multiplayer-synced
The hold-to-charge mechanic for the **normal sword attack** was removed, but the player state that drove it is still alive:
- `gPlayer.charging` / `gPlayer.chargeTick` are still initialized, set in the input buffer (`p.charging=true;p.chargeTick=0`), and **serialized over the network** in `sendState` / `_onPlayerChanged`.
- `WeaponRegistry.sword` no longer carries `chargeMax` (removed), and the swing damage is flat — so this state feeds nothing.

**Why deferred:** removing the fields touches the MP wire format (`charging` / `chargeTick` keys in the player delta), so it needs a deliberate pass with an MP smoke-test, not a drive-by edit.
**Fix:** drop `charging`/`chargeTick` from the player object, the input-buffer write, and both MP serialize/deserialize sites. Confirm an older client/host can't choke on the missing keys (they're already optional-with-default on read).

---

## Wilderness / spawning

### 🟡 All 40 wolf camps spawn their packs up front (~160 always-live enemies)
`goWilderness` calls `_wolfSpawnPack` for **every** camp at run start, and camp wolves are despawn-exempt (`campId` set), so ~160 wolves sit in `gEnemies` for the whole run — running AI + separation every frame even when far off-screen. This already bit the **night stream** (the siege live-cap census counted them and starved the stream — fixed by excluding `campId`/`isHeld` in `gWildSpawnTick`), but the perf cost (and the conceptual oddity of every den being "loaded" at once) remains.

**Why deferred:** the stream bug is fixed without it; lazy spawning changes the wolf system's lifecycle and wants its own focused pass + playtest.
**Fix:** spawn a camp's pack lazily when the player nears (mirror the village/ambient pattern), despawn when far, and persist `cleared`/`respawnAt` on the camp so the 3-min cycle survives unload. Keeps the "fixed, revisitable den" model while bounding live-enemy count.

---

## Character / inventory screen

### 🟢 Custom-sprite character creator may now be orphaned
The previews (`charDrawPreview`, `invRenderCharPreview`) no longer read `df_player_sprite` / call `ccPixelsToCanvas` — they render the knight portrait instead. If the in-game character creator that writes `df_player_sprite` is no longer reachable from the UI, its code (creator screen, `cc*` helpers, the `df_player_sprite` localStorage contract) is dead weight.

**Why deferred:** needs verification of whether the creator is still linked anywhere before deleting anything.
**Fix:** audit reachability of the character creator. If it's gone, remove the screen + `cc*` helpers + the localStorage key. If it's meant to stay, decide how a custom sprite should surface now that previews show the portrait.

---

## Art / animation

### 🟡 `tools/slice-turnaround.py` still emits a base64 manifest snippet (post-externalization)
Art was externalized from inline base64 into files under `assets/` (`ART_MANIFEST` values are now paths
like `'char.goblin.n':'assets/char/goblin-n.png'`). The slice tool, though, still outputs a
`'char.<id>.<dir>':'data:image/png;base64,…'` snippet — the old inline form — so its output is a step
behind the pipeline. Until updated, the Artist hand-bridges it (drop the cutout PNGs in `assets/char/`,
write path entries instead of pasting base64). See the migration note in `docs/ART_PIPELINE.md`.

**Why deferred:** out of scope of the externalization itself (engine + existing manifest), and it's
Artist-domain tooling with its own QA (contact sheet, naming). Wants a focused pass.
**Fix (artist-ownable):** have the tool write its 8 cutouts straight into `assets/char/` as
`<id>-<dir>.png` and emit a path-based manifest snippet (`'char.<id>.<dir>':'assets/char/<id>-<dir>.png'`).
Drop the base64 encode step. Keep the magenta QA contact sheet.

### 🟢 Wolf lunge-bite attack frame displays too briefly (playtest feedback)
The wolf attack sprite (`char.{direwolf,alphawolf}atk.*`) is swapped in by `_wolfBiting` in `gDrawEnemy`
while `e.biteWindup>0 || e.biteStrike>0`. After the pounce resolves, `_aiWolf` sets `e.biteStrike=12`
(~0.2s @60fps), so the **lunge/pounce pose only holds ~12 frames** before reverting to the idle
turnaround — playtest read it as flashing past too fast to register the bite.

**Why deferred:** the obvious lever (`biteStrike`) is also the **combat follow-through window** (engineer-
owned timing in `_aiWolf`), so bumping it changes feel/recovery, not just the art. Wants a small, isolated
pass.
**Fix (artist-ownable, draw-only):** add a display-only hold — set an `e._biteHold` (~22–28 frames) when
the lunge fires and add `|| e._biteHold>0` to `_wolfBiting`, ticking it down in `gSimUpdate`/draw. The
pose lingers without touching `biteStrike`/`lungeTimer` (the actual hit + exposed-recovery math stays
put). Tune the hold against the lunge so the bite *reads* at gameplay speed.

---

## Docs / naming

### 🟡 `DUNGEON_FORGE_CTO_DOC.md` filename still carries the old game name
The *Dungeon Forge → To Dust* rename updated display text everywhere but **left filenames/paths frozen
on purpose** (lower risk). The CTO architecture doc is still `docs/DUNGEON_FORGE_CTO_DOC.md`.

**Why deferred:** the filename is referenced from `CLAUDE.md`, `AGENTS.md`, `product/CLAUDE.md`,
`.claude/commands/*`, `.claude/agents/*`, `.codex/agents/product-manager.toml`, `tools/pm-bot/pm_bot.py`,
`tools/doc-drift-check.ps1`, and `docs/PRODUCT_MANIFESTO.md` — a `git mv` needs all of them updated in
one pass (and `doc-drift-check.ps1` has the name in a regex).
**Fix:** `git mv docs/DUNGEON_FORGE_CTO_DOC.md docs/TO_DUST_CTO_DOC.md` and update every reference above
in the same commit. (The `DF1` seed prefix and `dungeon-forge:map:` localStorage key are **not** in
scope — those are frozen for save/seed compatibility.)

---

## Resolved
*(Move items here with a date when fixed, or just delete them — git history is the real record.)*

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
