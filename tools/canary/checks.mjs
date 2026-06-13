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
};
