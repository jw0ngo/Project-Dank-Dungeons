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

### 🟡 `wildDmgMult` (`_wdm`) applied inconsistently across damage sources
The normal swing multiplies its damage by `gPlayer.wildDmgMult` (`_wdm`), but whirlwind, leap, and heavy do **not**. `wildDmgMult` is currently an inert hook (initialized to `1`, set to `1` at run start, never changed), so this has **no live effect** today.

**Why deferred:** harmless while the value is always `1`. But if `wildDmgMult` ever gets wired to a real multiplier, the swing would scale and the other skills wouldn't — a silent balance bug.
**Fix:** either remove `_wdm` entirely (it's a no-op), or apply it uniformly across all player damage sources the way `damagePct` (`_dbuf`) already is.

### 🟡 Inert STR/DEX/INT scaling shims still multiply ~50 call-sites
The STR/DEX/INT system is retired, but its multiplier shims remain as neutral stubs called throughout combat: `W_scalingMult()` / `weaponScalingMult()` / `skillScalingMult()` all `return 1`, and `wildStrMaxHp` / `wildStrHpRegen` / `wildIntMagicMult` / `wildIntMaxMp` / `wildIntMpRegen` / `wildDexSpeedMult` (and friends) all `return 0`/`1`.

**Why deferred:** intentionally kept as shims so the ~50 call-sites that multiply by them keep working unchanged — ripping them out is a wide, mechanical edit best scripted in one pass (per the "3+ sites → script the edit" rule).
**Fix:** script a sweep that deletes the `* W_scalingMult()` / `* skillScalingMult()` factors and the `+ wildStr*()/wildInt*()` terms at every call-site, then delete the shim definitions. Report OK/SKIP/FAIL per site.

### 🟢 Skill-detail tooltips show base damage, not live (buffed) damage
The character-screen skill tooltips (`_charSkillDetail`) display base weapon/skill damage and don't reflect the player's live `damagePct` (obelisk + level-up cards) or crit. So the tooltip can read "Damage: 18" while the hero actually hits for more.

**Why deferred:** it's a display-fidelity decision (show base stats vs. show your current real numbers), not a correctness bug — and all the skill tooltips are consistently base-only today.
**Fix:** if we want live numbers, multiply the displayed values by the same `_dbuf` the combat code uses, and decide whether to surface crit chance/multiplier too. Do it for all skills at once so they stay consistent.

### 🟢 Bow kill awards a kill but no XP orb
`gKillEnemy` notes this divergence in a comment: environmental kills pass `{credit:false,xpOrb:false}`, but the **bow** passes `{xpOrb:false}` — so bow kills credit the player but drop no XP orb, unlike every melee path.

**Why deferred:** flagged in-code as a "known divergence," likely once-intentional; needs a design call on whether the bow *should* be XP-neutral.
**Fix:** if unintended, drop the `xpOrb:false` on the bow kill path so it matches melee.

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
