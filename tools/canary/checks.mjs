// checks.mjs — named canary presets for run.mjs (--check <name>).
// A check returns a JSON-able result; set `__failed: true` (with a `why`) to fail the run.
// Console/page errors fail the run regardless — checks only add positive assertions.

export const CHECKS = {
  // The game boots clean: Sim is up, three idle seconds produce no errors, observe() answers.
  boot: {
    desc: 'load the game, idle 3s, Sim.observe() answers',
    run: (page) => page.evaluate(async () => {
      await new Promise((r) => setTimeout(r, 3000));
      const obs = window.Sim.observe();
      if (!obs || typeof obs.mode === 'undefined') {
        return { __failed: true, why: 'Sim.observe() returned no mode', obs };
      }
      return { mode: obs.mode };
    }),
  },

  // Two fast headless bot runs complete and report.
  batch: {
    desc: 'Sim.batch(2) completes with a report',
    run: (page) => page.evaluate(async () => {
      const { report } = await window.Sim.batch(2);
      if (!report || report.runs !== 2) {
        return { __failed: true, why: 'batch did not report 2 runs', report };
      }
      return report;
    }),
  },

  // The card-draft pipeline resolves headlessly — balance-independent: grant XP
  // directly (gWildGrantXP) instead of hoping the bot survives to level, then step
  // briefly so the queued drafts auto-resolve via Sim.bot.pickCard. The item-10 class
  // of bug (dangling card id, a draft that never unpauses) surfaces as a console
  // error, a stuck gSimDraft, or zero cards picked.
  draft: {
    desc: 'grant XP -> level-ups draft and resolve headlessly (>= 1 card picked)',
    run: (page) => page.evaluate(async () => {
      window.Sim.startRun();
      // gWildGrantXP is a top-level function declaration -> window-visible
      window.gWildGrantXP(1000, 0, 0);
      const r = await window.Sim.runFast({ maxSteps: 600 }); // ~10 game-seconds
      const picked = Object.values(r.cards || {}).reduce((s, v) => s + v, 0);
      if (r.level < 2 || picked < 1) {
        return { __failed: true, why: `level ${r.level}, ${picked} cards picked`, run: r };
      }
      return { level: r.level, cardsPicked: picked, cards: r.cards };
    }),
  },

  // Every §6i fire-FX family ticks, hits, and expires headlessly: plant an
  // unkillable goblin point-blank, spawn each family at/toward it, step ~12
  // game-seconds, then assert the goblin took damage and every fx array
  // drained (a stuck array = a lifecycle regression; zero damage = a hit-path
  // regression). NOTE: top-level let/const globals (gPlayer, gFireWaves, T)
  // are global-lexical, not window props — reference them bare.
  firefx: {
    desc: 'all 9 fire-FX families hit a planted enemy and their arrays drain',
    run: (page) => page.evaluate(async () => {
      Sim.startRun();
      await Sim.runFast({ maxSteps: 30 });
      const p = gPlayer;
      const e = makeGoblinEnt(Math.floor(p.wx / T), Math.floor(p.wy / T));
      e.wx = p.wx + 40; e.wy = p.wy; e.hp = e.maxHp = 999999; e.isHeld = true;
      gEnemies.push(e);
      const hp0 = e.hp;
      gSpawnFireWave(p.wx, p.wy, 0, 20);
      gSpawnEmberlance(p.wx, p.wy, 0, 20);
      gSpawnFireRing(p.wx, p.wy, 20, {});
      gSpawnFireBurst(e.wx, e.wy, 30);
      gSpawnFireCross(e.wx, e.wy, 20);
      gSpawnFireTrail(e.wx, e.wy, 20, false, { substance: 'dragonfire', heal: 5, reach: 40 });
      gSpawnFireField(p.wx, p.wy, 80, 30, 'chaosfire', 10, 5, 0, 3);
      gSpawnFireJet(p.wx, p.wy, 0, 200, 20, 10, 120, 0);
      gSpawnFirePillars(e.wx, e.wy, 0, 40, 1, 10);
      await Sim.runFast({ maxSteps: 700 });
      const left = {
        waves: gFireWaves.length, rings: gFireRings.length, bursts: gFireBursts.length,
        crosses: gFireCrosses.length, trails: gFireTrails.length, pillars: gFirePillars.length,
        embers: gEmberShots.length, jets: gFireJets.length, fields: gFireFields.length,
      };
      const dmg = hp0 - e.hp;
      const leftover = Object.entries(left).filter(([, n]) => n > 0).map(([k]) => k);
      if (dmg <= 0) return { __failed: true, why: 'planted enemy took no fire damage', dmg, left };
      if (leftover.length) return { __failed: true, why: `fx arrays not drained: ${leftover.join(',')}`, dmg, left };
      return { dmg, left };
    }),
  },
};
