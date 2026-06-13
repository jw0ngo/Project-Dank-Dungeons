#!/usr/bin/env node
// run.mjs — headless in-browser canary for the §8 Sim harness (Infra-1).
//
// Closes the "⚠ in-browser canary pending — needs a live browser" gap: an agent can now
// drive the REAL game (no mocks) from the CLI and read the result + every console error.
//
//   node tools/canary/run.mjs                      # preset: boot (loads game, asserts no errors)
//   node tools/canary/run.mjs --batch 3            # 3 headless bot runs -> balance report
//   node tools/canary/run.mjs --check draft        # preset from checks.mjs
//   node tools/canary/run.mjs --expr "Sim.observe().player"   # any (async-ok) expression
//   node tools/canary/run.mjs --headful            # watch it (debugging the canary itself)
//
// Spawns its own plain `python -m http.server` (default port 5599) so it never fights a
// running `python dev.py`; pass --url to target an already-running server instead.
// Exit 0 = clean. Exit 1 = page error, console.error, or a failed check/expr.
// console.warn lines (e.g. gInitArt's "[art] missing") are REPORTED but don't fail the run.

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import { CHECKS } from './checks.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// ---- args ----
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : null;
};
const has = (name) => args.includes('--' + name);
const batchN = opt('batch') ? parseInt(opt('batch'), 10) : null;
const expr = opt('expr');
const checkName = opt('check') || (batchN === null && !expr ? 'boot' : null);
const port = opt('port') || '5599';
const url = opt('url') || `http://localhost:${port}/index.html`;
const headful = has('headful');

if (checkName && !CHECKS[checkName]) {
  console.error(`unknown --check '${checkName}' — available: ${Object.keys(CHECKS).join(', ')}`);
  process.exit(2);
}

// ---- own static server (skipped when --url points elsewhere) ----
let server = null;
if (!opt('url')) {
  server = spawn('python', ['-m', 'http.server', port, '--bind', 'localhost'], {
    cwd: ROOT, stdio: 'ignore',
  });
  const deadline = Date.now() + 15000;
  let up = false;
  while (Date.now() < deadline && !up) {
    try { up = (await fetch(url, { method: 'HEAD' })).ok; }
    catch { await new Promise((r) => setTimeout(r, 200)); }
  }
  if (!up) { console.error(`server on :${port} never came up`); server.kill(); process.exit(2); }
}

// ---- drive the page ----
const t0 = Date.now();
const out = { ok: false, consoleErrors: [], consoleWarnings: [], pageErrors: [] };
const browser = await chromium.launch({ headless: !headful });
try {
  const page = await browser.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') out.consoleErrors.push(m.text());
    else if (m.type() === 'warning') out.consoleWarnings.push(m.text());
  });
  page.on('pageerror', (e) => out.pageErrors.push(String(e)));

  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(
    () => window.Sim && typeof window.Sim.batch === 'function',
    null, { timeout: 30000 },
  );

  if (checkName) {
    out.check = checkName;
    out.result = await CHECKS[checkName].run(page);
  }
  if (batchN !== null) {
    out.result = await page.evaluate(
      async (n) => (await window.Sim.batch(n)).report, batchN,
    );
  }
  if (expr) {
    out.result = await page.evaluate(
      // top-level let/const in the game script are visible to evaluated code
      async (src) => await new Function('return (async()=>(' + src + '))()')(), expr,
    );
  }

  const failed =
    out.pageErrors.length > 0 ||
    out.consoleErrors.length > 0 ||
    (out.result && out.result.__failed);
  out.ok = !failed;
} catch (e) {
  out.pageErrors.push(String(e));
  out.ok = false;
} finally {
  await browser.close();
  if (server) server.kill();
}

out.durationMs = Date.now() - t0;
console.log(JSON.stringify(out, null, 2));
process.exit(out.ok ? 0 : 1);
