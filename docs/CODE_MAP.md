# To Dust — Code Map (GENERATED — DO NOT EDIT)

*Regenerated from `index.html`'s `// §` banners by `tools/gen-code-map.py` (2026-06-13, 17940 lines). Re-run the tool after adding/moving a section or a notable system; **edit the banners, not this file.** Sections appear in FILE ORDER (the § numbers are stable names, not positions — e.g. §10 INIT lives near the end).*

## (pre-§1)  HTML / CSS / boot script before the first banner
*lines 1–1195* · 1 function(s) · 0 knob(s)

**Functions:** `_fbInit`

## §1  CONFIG & STORAGE
*lines 1196–1238* · 6 function(s) · 3 knob(s)

**Functions:** `getLocalId` · `storeList` · `storeGet` · `storeSet` · `storeDel` · `getAllMaps`

**Knobs (UPPER consts):** `STORE_PREFIX` · `LOCAL_ID` · `SESSION_ID`

## §2  DEMO MAP & CONSTANTS
*lines 1239–1380* · 0 function(s) · 10 knob(s)

**Knobs (UPPER consts):** `TILE_VOID` · `TILE_GRASS` · `TILE_DIRT` · `TILE_TREE` · `TILE_ROCK` · `TILE_SPIKE` · `TILE_HUT` · `DEMO_MAP` · `HUB_MAP` · `HUB_SPAWN`

## §3  HUB & NAVIGATION
*lines 1381–1553* · 17 function(s) · 0 knob(s)

**Functions:** `esc` · `refreshHub` · `newMap` · `newMapConfirm` · `newMapCancel` · `editMapById` · `playMapById` · `deleteMapById` · `loadDemo` · `showScreen` · `goHub` · `returnToTown` · `hubOpen` · `hubClose` · `emptyMap` · `rowsFromTiles` · `tilesFromRows`

## §4  MAP EDITOR
*lines 1554–2123* · 30 function(s) · 6 knob(s)

**Functions:** `mkIcon` · `buildEdPalette` · `edSelectItem` · `edResizeCanvas` · `scaleGameToFit` · `edTileIdx` · `edInBounds` · `edScToTile` · `edPushUndo` · `edApply` · `edFloodFill` · `edPick` · `edIsFl` · `drawEdTile` · `drawEdEntity` · `editorRender` · `_editorRenderSync` · `editorLoad` · `edCentreView` · `edResize` · `edFill` · `edClear` · `mapDataFromEditor` · `saveMap` · `testPlay` · `gTileAt` · `gIsWalk` · `gIsWalkWolf` · `gTreeSlow` · `bsc`

**Knobs (UPPER consts):** `TERRAIN_PAL` · `ENTITY_PAL` · `BASE_W` · `BASE_BLOCK_H` · `PPX` · `GPX`

## §5  REGISTRIES
*lines 2124–3530* · 62 function(s) · 28 knob(s)

**Functions:** `gDrawSword` · `gCI` · `ghp` · `gpp` · `gRebuildNav` · `gBlockRockFootprint` · `gAstar` · `gLos` · `gSmooth` · `gRC` · `gRCDestructibles` · `gRCTraps` · `gRCRocks` · `gRCTrees` · `gRCObelisks` · `gSep` · `gRCEnemies` · `gAudio` · `gpfx` · `gPlayStep` · `gPlaySwish` · `gPlayHit` · `gPlayWhirlwind` · `gPlayGrunt` · `gPlayWoodBreak` · `gPlayExplosion` · `gPlayWoodHit` · `gPlayFireTick` · `W` · `pSkillStat` · `pSkillSpeed` · `gCritRoll` · `easeSwing` · `spawnGP` · `spawnGPCustom` · `addGDmg` · `gAddXpPopup` · `gDrawXpPopup` · `gShake` · `gNotEnoughMana` · `pInArc` · `_wildScaleEnt` · `makeGoblinEnt` · `gPlayTwang` · `gPlayArrowHit` · `gPlayJump` · `gPlayLand` · `makeArcherEnt` · `makeKingEnt` · `makeBomberEnt` · `makeWarriorEnt` · `makeShamanEnt` · `makeWolfEnt` · `gUpdateArrows` · `gUpdatePlayerArrows` · `gClientEnemyArrowTick` · `gClientPlayerArrowTick` · `gameLoad` · `_doRespawn` · `mpShowDeath` · `mpRespawn` · `mpLeaveAfterDeath`

**Knobs (UPPER consts):** `APX` · `PSCALE` · `WRPX` · `BPXR` · `SPXR` · `KPXR` · `KING_SCALE` · `ENEMY_DRAW_SCALE` · `SPX` · `SSCALE` · `TREE_BASE_RX_FRAC` · `TREE_BASE_RY_FRAC` · `PATH_INT` · `SKILL_STAT_FLOOR` · `CRIT_BASE_MULT` · `SMEAR_INNER` · `SMEAR_OUTER` · `SWING_ARC` · `SWING_DUR` · `SWING_CD` · `CHARGE_MAX` · `WW_SPEED` · `WW_RADIUS` · `WW_DMG` · `WW_CD_FRAMES` · `MAX_PARTICLES` · `XP_POPUP_WINDOW` · `XP_POPUP_FADE`

## §6  DUNGEON ENGINE
*lines 3531–3534* · 0 function(s) · 0 knob(s)

## §6a  PLAYER SYSTEM
*lines 3535–3785* · 3 function(s) · 0 knob(s)

**Functions:** `makePlayerState` · `gResume` · `isGameActive`

## §6b  SWORD & WHIRLWIND SYSTEM
*lines 3786–5108* · 42 function(s) · 7 knob(s)

**Functions:** `gDoSwing` · `gDoSwingAt` · `gCheckHits` · `gToggleWhirlwind` · `gUpdateWhirlwind` · `gSyncGodSkillOrder` · `gGodSkillHud` · `gToggleGodSkillByKey` · `gGodSkillRunning` · `gGodSkillDisplay` · `gGodSkillBaseChunk` · `gGodSkillEmitInterval` · `gGodSkillEmitCost` · `gGodSkillDrainPerSec` · `gUpdateGodSkillHud` · `gUpdateGodSkills` · `gTickBurningBody` · `gTickTrailOfEmbers` · `gToeLayLine` · `gToeLayCone` · `gUpdateTrailBombs` · `gTickPyroclasm` · `gPyroAimDist` · `gPyroPlan` · `gPyroPushPillar` · `gPyroFire` · `gDrawPyroTelegraph` · `gDoEvasion` · `gUpdateEvasion` · `_leapClampedTarget` · `gToggleLeap` · `gFireLeap` · `gUpdateLeap` · `pInHeavyAtkRect` · `gDoHeavyAtk` · `gReleaseHeavyAtk` · `_fireHeavyAtk` · `gUpdateHeavyAtk` · `gOutOfCombat` · `gSpawnRegenMote` · `gSpendMana` · `gUpdatePlayer`

**Knobs (UPPER consts):** `SWING_LUNGE_SPEED` · `SWING_LUNGE_FRAC` · `HEAVY_LUNGE_FACTOR` · `HEAVY_LUNGE_CHARGE_K` · `OOC_REGEN_DELAY` · `OOC_MP_REGEN` · `OOC_HP_REGEN`

## §6c  HAZARDS & PICKUPS
*lines 5109–5453* · 11 function(s) · 10 knob(s)

**Functions:** `mpNearestTarget` · `_bombExplodeFeedback` · `gUpdateBombs` · `gClientBombTick` · `gUpdateTraps` · `gDrawTraps` · `gMaybeDropPotion` · `gUpdatePotions` · `gDrawPotions` · `eNearestTarget` · `eAnyPlayerNear`

**Knobs (UPPER consts):** `FIRE_RANGE` · `HIT_FLASH_DUR` · `FIRE_PERIOD` · `FIRE_HALF` · `FIRE_DMG_VAL` · `FIRE_IFRAMES` · `TRAP_ACTIVATE_DIST` · `POTION_HEAL` · `POTION_RADIUS` · `POTION_DROP`

## §6d  TRAINING DUMMY & SANCTUM PROPS
*lines 5454–5681* · 11 function(s) · 3 knob(s)

**Functions:** `initTrainingDummy` · `updateTrainingDummy` · `hitTrainingDummy` · `drawTrainingDummy` · `initForgeProp` · `initStatForgeProp` · `gStatForgeInteract` · `drawStatForgeProp` · `gForgeInteract` · `drawForgeProp` · `checkDummyHit`

**Knobs (UPPER consts):** `DUMMY_TX` · `FORGE_TX` · `STATFORGE_TX`

## §6h  PLAYER DAMAGE & GRIT
*lines 5682–5776* · 11 function(s) · 4 knob(s)

**Functions:** `gDamagePlayer` · `gHitPlayer` · `_gm` · `gGritShield` · `gGritDuration` · `gGritCapPct` · `gGritStreak` · `gGritCap` · `gGritGain` · `gShieldAbsorb` · `gUpdateShield`

**Knobs (UPPER consts):** `GRIT_SHIELD` · `GRIT_DURATION` · `GRIT_CAP_PCT` · `GRIT_ATK_STREAK`

## §6e  ENEMY SYSTEM
*lines 5777–6481* · 15 function(s) · 5 knob(s)

**Functions:** `_aiGoblin` · `_wolfPackKey` · `_aiWolf` · `_wolfWakeCamp` · `_aiArcher` · `_aiWarrior` · `_aiShaman` · `_shamanFireFireball` · `_shamanCastBuff` · `gUpdateShamanFireballs` · `gUpdateBurn` · `gWithin` · `gKillEnemy` · `_enemyKbMult` · `gDealEnemyDamage`

**Knobs (UPPER consts):** `STOP` · `WOLF_LEASH_R` · `WOLF_LEAP_MAX` · `WOLF_LUNGE_COMMIT_FRAC` · `WOLF_LUNGE_RECOVER`

## §6i  FIRE FX — Cilia's god-skill arsenal
*lines 6482–7764* · 52 function(s) · 129 knob(s)

**Functions:** `_fxTargetable` · `_fxHitFeedback` · `_fxOwnerGroundTick` · `gSpawnFireWave` · `gSpawnEmberlance` · `gFireShootEmber` · `gSpawnRemoteEmberlance` · `gUpdateEmberShots` · `gDrawEmberShots` · `gSpawnCinderRing` · `_danceLeafDef` · `gSpawnFireField` · `gUpdateFireFields` · `gDrawFireFields` · `gDanceComboSwing` · `gSpawnFireJet` · `gUpdateFireJets` · `gDrawFireJets` · `gSpawnRemoteFireWave` · `gUpdateFireWaves` · `gApplyEnemyBurn` · `gBurnExplode` · `gUpdateEnemyBurn` · `gSpawnFireRing` · `gSpawnRemoteFireRing` · `gUpdateFireRings` · `gLayChaosfireRing` · `_laySettleRing` · `gScatterChaosfireGround` · `gDragonbreathRadius` · `gDrawBurningBodyAura` · `gDrawFireRings` · `gSpawnFireBurst` · `gBurstAndSync` · `gUpdateFireBursts` · `gDrawFireBursts` · `gSpawnFireCross` · `gSpawnRemoteFireCross` · `_fcOnArm` · `gUpdateFireCrosses` · `gDrawFireCrosses` · `gSpawnFireTrail` · `gUpdateFireTrails` · `gDrawFireTrails` · `gDrawFireWaves` · `gSpawnFirePillars` · `gUpdateFirePillars` · `gDrawFirePillars` · `gUpdateFireFx` · `gDrawFireFxUnder` · `gDrawFireFxOver` · `gResetFireFx`

**Knobs (UPPER consts):** `FW_RANGE_TILES` · `FW_SPEED` · `FW_HALF_ANGLE` · `FW_DMG_MULT` · `FW_BURN_FRAMES` · `FW_BURN_RATIO` · `FW_BURN_MIN` · `FW_DRAW_FUDGE` · `FW_MIN_LAT` · `FW_FAR_DMG` · `FW_FAR_KB` · `EMBER_SPEED` · `EMBER_R` · `EMBER_BASE_COUNT` · `EMBER_FAN` · `EMBER_RANGE_MULT` · `BURN_EXPLODE_R` · `BURN_EXPLODE_FRAMES` · `FW_SPR` · `FR_INTERVAL` · `FR_RANGE_TILES` · `FR_SPEED` · `FR_DMG_MULT` · `FR_BURN_FRAMES` · `FR_BURN_RATIO` · `FR_BURN_MIN` · `AURA_RADIUS` · `AURA_TICK` · `AURA_BURN_FRAMES` · `BB_AURA_INTERVAL` · `BB_RING_INTERVAL` · `BB_BURST_INTERVAL` · `BB_AURA_PULSE_DUR` · `BB_RING_WINDUP` · `BB_BREATH_DUR` · `BB_NOVA_SPEED` · `BB_BREATH_SPEED` · `CHAOS_CROWN_LIFE` · `CATACLYSM_SAFE_R` · `FR_RING_FRAC` · `FR_SPR` · `DRAGONFIRE_CIRCLE_SPR` · `CHAOSFIRE_CIRCLE_SPR` · `DRAGONFIRE_PILLAR_SPR` · `CHAOSFIRE_PILLAR_SPR` · `DRAGONFIRE_GROUND_SPR` · `CHAOSFIRE_GROUND_SPR` · `FIREEXPLOSION_SPR` · `FIREBURST_LIFE` · `FC_REACH` · `FC_ARM_HALF` · `FC_LIFE` · `FC_TICK` · `FC_DMG_RATIO` · `FC_BURN_FRAMES` · `FC_BURN_RATIO` · `FC_BURN_MIN` · `FC_SPR` · `FT_SPACING` · `FT_REACH` · `FT_DRAW` · `FT_LIFE` · `FT_TICK` · `FT_DMG_BASE` · `FT_BURN_FRAMES` · `FT_BURN_RATIO` · `FT_BURN_MIN` · `FT_SPR` · `DANCE_COMBO_WINDOW` · `DANCE_GROUND_LIFE` · `DRAGONFIRE_HEAL_RATIO` · `CHAOSFIRE_SELF_RATIO` · `TOE_PATCH_DIST` · `TOE_CONE_N` · `TOE_CONE_LEN` · `TOE_CONE_BACK` · `TOE_STEP_DIST` · `TOE_DRAGONFEET_FUSE` · `TOE_BOMB_FUSE` · `TOE_BOMB_R` · `TOE_BOMB_DMG_MULT` · `PYRO_INTERVAL` · `PYRO_TELEGRAPH` · `PYRO_TELE_PULSES` · `PYRO_FINALE_SCALE` · `PYRO_FINALE_DMG` · `PYRO_WALL_COUNT` · `PYRO_WALL_GAP` · `PYRO_WALL_STAGGER` · `PYRO_WALL_SPAN` · `PYRO_REERUPT` · `PYRO_REERUPT_GAP` · `PYRO_RIFT_HALFSPAN` · `PYRO_RIFT_STEP` · `PYRO_RIFT_TELE_STEP` · `PYRO_RIFT_JITTER` · `PYRO_RIFT_DELAY` · `PYRO_RIFT_DMG` · `PYRO_RIFT_BURN` · `PYRO_RIFT_GROUND_LIFE` · `PYRO_RIFT_PILLAR_LIFE` · `FLAMEOFCHAOS_TILES` · `FLAMEOFCHAOS_SPEED` · `FLAMEOFCHAOS_BALL_R` · `FLAMEOFCHAOS_TRAIL_SP` · `DRAGONFIRE_JET_TILES` · `DRAGONFIRE_JET_SPREAD` · `DRAGONFIRE_JET_TRAIL_SP` · `DRAGONFIRE_JET_LIFE` · `DRAGONFIRE_JET_WIDTH` · `FIREFIELD_EYE` · `FP_MIN` · `FP_MAX` · `FP_STEP_TILES` · `FP_START_TILES` · `FP_RADIUS` · `FP_STEP_DELAY` · `FP_WARN` · `FP_ACTIVE` · `FP_DMG_RATIO` · `FP_BURN_FRAMES` · `FP_BURN_RATIO` · `FP_BURN_MIN` · `FP_SPRITE_H` · `FP_SPRITE_AR` · `FP_SPR` · `FIREFX_UPDATE` · `FIREFX_DRAW_UNDER` · `FIREFX_DRAW_OVER`

## §6e-ii  ENEMY SYSTEM (cont.)
*lines 7765–8319* · 8 function(s) · 1 knob(s)

**Functions:** `gUpdateShamanBuffs` · `gDrawShamanFireballs` · `gDrawShamanEffects` · `_aiKing` · `_aiBomber` · `gUpdateEnemies` · `gCheckEnemyDamage` · `mpCheckEnemyAttacks`

**Knobs (UPPER consts):** `CELL`

## §6f  RENDER
*lines 8320–10334* · 35 function(s) · 14 knob(s)

**Functions:** `bobY` · `gDrawTile` · `gDrawTorches` · `drawHeavyAtkRect` · `_slashTintCanvas` · `drawSmearAt` · `gDrawSmear` · `gRebakeTiles` · `gInitArt` · `gTileArt` · `gTileProp` · `gBody` · `gOctant8` · `gDirBody` · `gDrawSprite` · `gDrawBow` · `gGetSword` · `drawAnyPlayer` · `gDrawPlayer` · `gDrawWarrior` · `gDrawKing` · `gDrawShaman` · `gDrawBomber` · `gUpdateBombFireZones` · `gDrawBombFireZones` · `gDrawBombs` · `gDrawEnemy` · `gDrawThreatGlow` · `gDrawArcher` · `gDrawArrows` · `gDrawDestructible` · `gDrawRock` · `gDrawTree` · `_genRockOutcrop` · `gRender`

**Knobs (UPPER consts):** `PLAYER_BOB` · `HEAVY_DRAW_MULT` · `WINDUP_DRAW_MULT` · `WINDUP_PLANT` · `ART_MANIFEST` · `PLAYER_WALK_OCT` · `PLAYER_DRAW_SCALE` · `ROCK_BASE` · `ROCK_FOOT` · `TREE_BASE` · `TREE_FOOT` · `TREE_FADE_ALPHA` · `TREE_FADE_BLEND` · `PLAYER_VIS_H`

## §6g  GAME LOOP
*lines 10335–10788* · 9 function(s) · 2 knob(s)

**Functions:** `bowUpdateHUD` · `_skTipEl` · `_skShowTip` · `_skHideTip` · `initSkillBar` · `updateSkillBar` · `startGameLoop` · `loop` · `gSimUpdate`

**Knobs (UPPER consts):** `SKILL_DEFS` · `SKILL_DESC`

## §7  MULTIPLAYER
*lines 10789–11809* · 21 function(s) · 6 knob(s)

**Functions:** `mpNextColor` · `mpGenCode` · `mpShowLobby` · `mpCloseLobby` · `mpSetStatus` · `mpShowHUD` · `mpHideHUD` · `mpUpdateHUD` · `mpHost` · `mpStartGame` · `mpJoin` · `_mpSanctumLaunch` · `_mpLaunch` · `_mpClientStart` · `mpTick` · `mpSyncDestructibles` · `mpSyncPotions` · `mpInterpolateEnemies` · `mpInterpolateRemotes` · `mpDrawRemotePlayers` · `mpLeave`

**Knobs (UPPER consts):** `MP_MAX_PLAYERS` · `MP_FRIENDLY_FIRE` · `MP_INPUT_HZ` · `MP_ENEMY_HZ` · `MP_ENEMY_DELTA` · `MP_LERP_SPEED`

## §7b  CHARACTER CREATOR  (MP-cosmetic sprite editor; was a duplicate §8 — §8 is the Sim harness)
*lines 11810–12234* · 30 function(s) · 3 knob(s)

**Functions:** `ccGetCanvas` · `ccGetCtx` · `ccGetPreview` · `ccGetPreviewCtx` · `ccIdx` · `ccInit` · `ccFillDefault` · `ccClear` · `ccBuildPalette` · `ccSelectColor` · `ccAddCustomColor` · `ccSetTool` · `ccCellFromEvent` · `ccApplyTool` · `ccFloodFill` · `ccBindEvents` · `ccRender` · `ccRenderPreview` · `ccTriggerUpload` · `ccHandleUpload` · `ccMirrorH` · `ccGetChars` · `ccSetChars` · `ccSaveNamed` · `ccLoadChar` · `ccDeleteChar` · `ccRenderCharList` · `ccUseChar` · `ccSave` · `ccPixelsToCanvas`

**Knobs (UPPER consts):** `CC_SIZE` · `CC_SCALE` · `CC_PALETTE_PRESETS`

## §9  MAP SEED SYSTEM
*lines 12235–13753* · 78 function(s) · 16 knob(s)

**Functions:** `b62Encode` · `b62Decode` · `seedEncode` · `seedDecode` · `read` · `seedModalClose` · `seedShowExport` · `seedShowImport` · `seedCopy` · `fallbackCopy` · `seedImportConfirm` · `bowStartCharge` · `bowRelease` · `bowFireArrow` · `bowDodgeRoll` · `bowUpdate` · `bowDrawCone` · `bowDrawPowerTrail` · `invInit` · `invRender` · `invRenderEquipSlots` · `invRenderGrid` · `_getKnightPortrait` · `_prepHiDPICanvas` · `_drawKnightPortrait` · `invRenderCharPreview` · `invMakeItemEl` · `invDrawItemIcon` · `invDragStart` · `invDragEnd` · `invDragOver` · `invDragLeave` · `invDrop` · `invApplyEquipment` · `gIsImbued` · `gImbuePath` · `gImbueRank` · `gImbueForm` · `gImbueAscension` · `_addImbuePathMod` · `gGodPool` · `gGodSkillTree` · `gIsGodSkill` · `gOwnsGodSkill` · `gOwnedGodSkills` · `gGodFireParam` · `gGodSkillWindow` · `gFireWaveParams` · `gSkillImbuePatron` · `gActivePatron` · `gIsPatronActive` · `gImbueEffectText` · `_charSkillDetail` · `charRender` · `charDrawPreview` · `charOpen` · `charClose` · `charToggle` · `invOpen` · `invClose` · `invToggle` · `invQuickSwap` · `goTown` · `leaveTown` · `townStartPresence` · `townOnHubPlayer` · `townSendPresence` · `townStopPresence` · `townDrawHubPlayers` · `townDrawPortal` · `townDrawWildernessPortal` · `portalCheckProximity` · `portalDrawPrompt` · `_makeMapBtn` · `_makeSectionLabel` · `portalOpenOverlay` · `portalClose` · `portalEnterDungeon`

**Knobs (UPPER consts):** `SEED_VERSION` · `SEED_ENTITY_KINDS` · `SEED_TILE` · `SEED_TILE_REV` · `B62_CHARS` · `BOW_FULL_RATIO` · `ITEM_DEFS` · `IMBUE_GODS` · `IMBUE_EFFECTS` · `PORTAL_WX` · `PORTAL_WY` · `PORTAL_RADIUS` · `WILDERNESS_PORTAL_WX` · `WILDERNESS_PORTAL_WY` · `WILDERNESS_PORTAL_RADIUS` · `FEATURED_MAPS`

## §11  WILDERNESS MODE
*lines 13754–14462* · 5 function(s) · 10 knob(s)

**Functions:** `_wildRng` · `generateWildernessMap` · `gShowTitleCard` · `gShowHintCard` · `goWilderness`

**Knobs (UPPER consts):** `WILD_W` · `WILD_H` · `SHRINE_R` · `SHRINE_MARGIN` · `NUM_CAMPS` · `CAMP_ROCK_CLUMPS` · `NUM_OUTCROPS` · `TREE_FORMATION_RATE` · `TREE_WALK_GAP` · `TREE_CELL`

## §12  WILDERNESS — XP, LEVELLING & THREAT SCALING
*lines 14463–16018* · 64 function(s) · 28 knob(s)

**Functions:** `wildXpToNext` · `wildThreatMult` · `wildSpeedMult` · `wildDmgMult` · `gWildThreatTier` · `gWildSpawnXPOrb` · `gUpdateXPOrbs` · `gDrawXPOrbs` · `gGrantFavor` · `gWildSpawnFavorOrb` · `gUpdateFavorOrbs` · `gDrawFavorOrbs` · `gWildGrantXP` · `wildDexCdMult` · `_wildApplyStats` · `rollCardRarity` · `_addSkillMod` · `_addGritMod` · `_applyMastery` · `gImbueCardWindow` · `gIsSkillUnlocked` · `gGritUnlocked` · `_cardValue` · `gCardAvailable` · `gGodSkillCards` · `gDrawCards` · `gDraftQueue` · `gDraftGenerate` · `_draftUpgradeCard` · `_draftBuyRank` · `gDraftReroll` · `_draftUpdateConfirm` · `_draftUpdateReroll` · `_draftUpdateFavor` · `gDraftSelect` · `gDraftPaint` · `gDraftSetupTheme` · `gDraftOpen` · `gDraftClose` · `gDraftUpdateFab` · `gDraftCamShift` · `gDraftConfirm` · `gDraftReset` · `gWildSyncUnlocks` · `gWildLevelUp` · `gWildTick` · `gWildUpdateHUD` · `gWildDayNightTick` · `_wildOnNightBegin` · `_wildHordeSize` · `_wildNightStreamRate` · `_wildSwarmType` · `_wildSpawnHorde` · `_wildSpawnKings` · `gAmbientDeaggroR` · `gWildAmbientTarget` · `_wildSpawnAmbientPack` · `gWildPatrolTick` · `wildCurrentCap` · `_wildPickSpawnPos` · `_wildSpawnEnemy` · `gWildSpawnTick` · `gWildEnd` · `gWildReset`

**Knobs (UPPER consts):** `WILD_MAX_THREAT` · `WILD_DAY_DURATION` · `WILD_NIGHT_DURATION` · `WILD_XP_TABLE` · `WILD_TIER1_THREAT` · `WILD_TIER2_THREAT` · `FAVORCOIN_PX` · `CARD_RARITIES` · `PASSIVE_CARDS` · `WW_MASTERY` · `LEAP_MASTERY` · `DASH_MASTERY` · `SKILL_CARDS` · `GRIT_MASTERY` · `GRIT_CARDS` · `PATRON_CARD_CHANCE` · `GODSKILL_CARD_CHANCE` · `PATRON_CARDS` · `IMBUE_PATHS` · `IMBUE_CARDS` · `CILIA_FIG_IMG` · `KNIGHT_FIG_IMG` · `GOD_DATA` · `DRAFT_RETRACT_MS` · `SKILL_UNLOCK_LEVEL` · `GRIT_UNLOCK_LEVEL` · `AMBIENT_PULL_R` · `AMBIENT_RESPAWN_INTERVAL`

## §12b  OBELISK SYSTEM
*lines 16019–16190* · 6 function(s) · 12 knob(s)

**Functions:** `_obeliskPct` · `_obeliskPickBuffs` · `gShowObeliskBuffs` · `gUpdateObelisks` · `gDrawObelisks` · `_drawObeliskStone`

**Knobs (UPPER consts):** `OBELISK_RADIUS` · `OBELISK_CHANNEL` · `OBELISK_DRAW_H` · `OBELISK_FOOT` · `OBELISK_FADE_ALPHA` · `OBELISK_COLLIDE_R` · `OBELISK_PCT_BASE` · `OBELISK_PCT_PER_LEVEL` · `OBELISK_MAXMANA_BASE` · `OBELISK_REGEN_BASE` · `OBELISK_MAXHP_BASE` · `OBELISK_BUFFS`

## §13  FOG OF WAR
*lines 16191–16540* · 9 function(s) · 10 knob(s)

**Functions:** `fogVisRadius` · `fogVisRadiusVisualPx` · `gHiddenByFog` · `gFogInit` · `gFogReveal` · `_fogEnsureOffscreen` · `_fogEnsureLow` · `gDrawFog` · `gDrawMinimap`

**Knobs (UPPER consts):** `FOG_REVEAL_EASE` · `FOG_VIS_DAY` · `FOG_VIS_NIGHT` · `ENEMY_DEAGGRO_TILES` · `FOG_VIS_FRAC` · `FOG_SIGHT_SOFT` · `FOG_SIGHT_EDGE` · `FOG_SHROUD_A` · `FOG_SHROUD_A_N` · `FOG_UNSEEN_A`

## §14  GOBLIN VILLAGE SYSTEM
*lines 16541–16597* · 2 function(s) · 0 knob(s)

**Functions:** `_villageAlert` · `gUpdateVillages`

## §14b  NEUTRAL WOLF CAMPS  (specs/neutral-camps.md)
*lines 16598–16828* · 8 function(s) · 5 knob(s)

**Functions:** `_wolfSpawnPack` · `gUpdateWolfCamps` · `_villageCheckDamageAlert` · `gDrawVillages` · `_chestDrawAlpha` · `_drawChestSprite` · `gDrawWolfCamps` · `_drawVillageDotsMinimap`

**Knobs (UPPER consts):** `WOLF_CAMP_RESPAWN` · `WOLF_CAMP_SPAWN_R` · `CHEST_HOLD_SECS` · `CHEST_FADE_SECS` · `CHEST_PX`

## §15  SHRINE SYSTEM
*lines 16829–16926* · 3 function(s) · 1 knob(s)

**Functions:** `gDrawShrine` · `gUpdateShrine` · `gShrineInteract`

**Knobs (UPPER consts):** `SHRINE_PX`

## §10  INIT
*lines 16927–17478* · 33 function(s) · 2 knob(s)

**Functions:** `gInitShrineLocks` · `gImbuableSkills` · `gImbuedCount` · `gImbueAllowance` · `gShrineHasUnclaimed` · `gOpenImbueMenu` · `gRenderImbueCards` · `gCloseImbueMenu` · `gPendingEvolution` · `_evolutionOptions` · `_chooseEvolution` · `_renderEvolutionCards` · `gOpenEvolutionMenu` · `gCloseEvolutionMenu` · `gForgeGodSkills` · `_forgeEnsurePatron` · `gForgeAcquire` · `gForgeRankSkill` · `gForgeMaxSkill` · `gRenderSkillforge` · `gOpenSkillforge` · `gCloseSkillforge` · `gRenderStatForge` · `gOpenStatForge` · `gCloseStatForge` · `gImbueSelectSkill` · `_imbueAnimateBg` · `draw` · `gOpenShrineMenu` · `gCloseShrineMenu` · `gShrineSelectGod` · `_shrineAnimateBg` · `draw`

**Knobs (UPPER consts):** `SKILLFORGE_GOD` · `STAT_FORGE_STATS`

## §8  SIM / PLAYTEST HARNESS  (window.Sim)
*lines 17479–17940* · 6 function(s) · 0 knob(s)

**Functions:** `installClock` · `restoreClock` · `freshMetrics` · `installHooks` · `stopRafLoop` · `finishRun`
