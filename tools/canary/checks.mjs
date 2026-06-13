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

  // Perf ceiling probe: spawn escalating live-enemy counts (a realistic late-night mix) around the
  // player and measure true per-FRAME cost by driving gSimUpdate(1) + gRender() directly (manual frames
  // sidestep any headless rAF throttling). Reports p50/p95 ms for update and render at each N so the
  // night live-cap can be set at the count where p95 crosses the frame budget (16.7ms=60fps, 33ms=30fps).
  // Not a pass/fail check — it returns a table for a human to read. Run: node tools/canary/run.mjs --check perfspawn
  perfspawn: {
    desc: 'frame-time (gSimUpdate+gRender) vs live enemy count — finds the perf ceiling',
    run: (page) => page.evaluate(async () => {
      Sim.startRun();
      await Sim.runFast({ maxSteps: 30 });        // settle: player placed, map/fog ready
      const p = gPlayer;
      p.hp = p.maxHp = 1e9;                         // invincible so the swarm can't end the probe
      gEnemies.length = 0;                          // exact counts — clear any standing population

      // Inline night-12 weighted mix (mirrors _wildSwarmType at threat 12) — robust to not being
      // able to reassign the wildThreatLevel lexical binding from evaluated code.
      const POOL = [];
      const w = (t, n) => { for (let i = 0; i < n; i++) POOL.push(t); };
      w('goblin', 60); w('archer', 40); w('bomber', 30); w('warrior', 40); w('shaman', 20); w('king', 5);
      const pick = () => POOL[(Math.random() * POOL.length) | 0];
      const live = () => gEnemies.filter(e => !e.dead && !e.isHeld && e.campId === undefined).length;
      const topUp = (N) => {
        while (live() < N) {
          const a = Math.random() * Math.PI * 2, r = (8 + Math.random() * 6) * T;
          _wildSpawnEnemy(pick(), p.wx + Math.cos(a) * r, p.wy + Math.sin(a) * r);
        }
      };
      const pct = (arr, q) => { const s = arr.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * q))]; };
      const measure = (frames) => {
        const upd = [], ren = [];
        for (let f = 0; f < frames; f++) {
          p.hp = p.maxHp;                            // keep invincible each frame
          const t0 = performance.now(); gSimUpdate(1);
          const t1 = performance.now(); let rok = true;
          try { gRender(); } catch (e) { rok = false; }
          const t2 = performance.now();
          upd.push(t1 - t0); if (rok) ren.push(t2 - t1);
        }
        return {
          updP50: +pct(upd, .5).toFixed(2), updP95: +pct(upd, .95).toFixed(2),
          renP50: ren.length ? +pct(ren, .5).toFixed(2) : null, renP95: ren.length ? +pct(ren, .95).toFixed(2) : null,
          renOK: ren.length > 0,
        };
      };

      const table = [];
      for (const N of [40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 260]) {
        topUp(N);
        measure(8);                                  // warm-up (JIT, fog/grid caches)
        topUp(N);                                     // restore exact N after warm-up attrition
        const m = measure(60);
        table.push({ N, live: live(), ...m, totalP95: +((m.updP95 || 0) + (m.renP95 || 0)).toFixed(2) });
      }
      return { renderedHeadless: table[0].renOK, budget60fps: 16.7, budget30fps: 33.3, table };
    }),
  },

  // Night siege spawns at a fixed RATE for the WHOLE night — no per-night total, no concurrent cap. This
  // reproduces Josh's night-1 no-kill case: step the full 120s night with NO kills and assert the horde
  // keeps growing the entire night (still climbing in the back half — does NOT stop at ~300 / mid-night),
  // reaching ≈ rate×120 + horde by dawn, with goblins present. A mid-night plateau = the regression.
  // Run: --check nightgrow
  nightgrow: {
    desc: 'night stream grows at a fixed rate ALL night (no total cap) — night1 no-kill reaches ~410, still climbing late',
    run: (page) => page.evaluate(async () => {
      Sim.startRun();
      await Sim.runFast({ maxSteps: 30 });          // settle the run
      gEnemies.length = 0;                           // exact counts
      wildNight = 0;                                 // _wildOnNightBegin will ++ to 1 (Josh's repro night)
      _wildOnNightBegin();                           // arms the siege: rate, siegeHordePending
      wildIsNight = true;                            // night fog-vis radius for _wildPickSpawnPos
      gPlayer.hp = gPlayer.maxHp = 1e9;
      const live = () => gEnemies.filter(e => !e.dead && !e.isHeld && e.campId === undefined).length;
      // Walk the whole night second-by-second (no combat → nothing dies); sample live mid- and late-night.
      let liveMid = 0, liveLate = 0;
      for (let t = 0; t <= 120; t++) {
        wildDayTimer = t; gPlayer.hp = gPlayer.maxHp; gWildSpawnTick(60);
        if (t === 60) liveMid = live();
        if (t === 110) liveLate = live();
      }
      const liveEnd = live();
      const breakdown = {};
      for (const e of gEnemies) if (!e.dead && !e.isHeld && e.campId === undefined) breakdown[e.defId] = (breakdown[e.defId] || 0) + 1;
      const goblins = breakdown.goblin || 0;
      const rate = +siegeSpawnRate.toFixed(2);        // _wildNightRate(1) = 3.25
      // Still climbing in the back half = no mid-night stop/cap (the bug was "stops ~300 around min 4").
      if (liveLate <= liveMid + 80) return { __failed: true, why: `horde stopped growing: mid ${liveMid} -> late ${liveLate}`, liveMid, liveLate, rate };
      if (liveEnd < 360) return { __failed: true, why: `night-1 no-kill reached only ${liveEnd} (expected ~410)`, liveEnd, rate };
      if (goblins < 1) return { __failed: true, why: 'no goblins in the mix', breakdown };
      return { rate, liveMid, liveLate, liveEnd, goblins, breakdown };
    }),
  },

  // Every enemy type's AI dispatches under gUpdateEnemies' positive defId dispatch:
  // plant one of each type point-blank, step ~2 game-seconds, assert each one's AI
  // actually ran (it moved). A dispatch regression (type routed to no AI, or the old
  // double-AI footgun returning) shows as a stuck enemy or a console error.
  enemyai: {
    desc: 'all 8 enemy types dispatch their AI (each moves) under positive defId dispatch',
    run: (page) => page.evaluate(async () => {
      Sim.startRun();
      await Sim.runFast({ maxSteps: 30 });
      const p = gPlayer, tx = Math.floor(p.wx / T), ty = Math.floor(p.wy / T);
      const make = {
        goblin: (x, y) => makeGoblinEnt(x, y), archer: (x, y) => makeArcherEnt(x, y),
        king: (x, y) => makeKingEnt(x, y), bomber: (x, y) => makeBomberEnt(x, y),
        warrior: (x, y) => makeWarriorEnt(x, y), shaman: (x, y) => makeShamanEnt(x, y),
        direwolf: (x, y) => makeWolfEnt(x, y, 'direwolf'), alphawolf: (x, y) => makeWolfEnt(x, y, 'alphawolf'),
      };
      const ents = Object.keys(make).map((t, i) => {
        const e = make[t](tx + 3 + i, ty);
        e.wx = p.wx + 120 + i * 10; e.wy = p.wy;
        gEnemies.push(e);
        return { t, e, x0: e.wx, y0: e.wy };
      });
      await Sim.runFast({ maxSteps: 120 });
      const stuck = ents.filter(o => !o.e.dead && Math.hypot(o.e.wx - o.x0, o.e.wy - o.y0) < 0.5).map(o => o.t);
      const moved = ents.map(o => ({ type: o.t, defId: o.e.defId, moved: +Math.hypot(o.e.wx - o.x0, o.e.wy - o.y0).toFixed(1) }));
      if (stuck.length) return { __failed: true, why: `enemy AI did not run for: ${stuck.join(',')}`, moved };
      return { moved };
    }),
  },
};
