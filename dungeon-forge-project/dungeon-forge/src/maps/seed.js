// §9  MAP SEED SYSTEM
//     DF1: base62 encoding — 3 bytes per entity, RLE tiles, version-tagged
// ═══════════════════════════════════════════════════════════════
//
// Seed format: DF1:<base62 payload>
//
// VERSION PREFIX:
//   DF1: = Dungeon Forge v1 encoding. If the schema ever changes
//   (new tile types, entity fields) we bump to DF2: and keep the
//   old decoder. Seeds never break across updates.
//
// PAYLOAD (binary, then base62-encoded):
//   Byte 0:   width  (1–255)
//   Byte 1:   height (1–255)
//   Bytes 2…: tile RLE pairs [tile_byte, run_length_byte] …
//             tile_byte: 0=wall 1=floor 2=exit
//             run_length_byte: 1–255 (split longer runs)
//   After tiles: entity list, each 3 bytes [kind_idx, tx, ty]
//             kind_idx maps to SEED_ENTITY_KINDS (append-only — never reorder)
//
// BASE62: chars 0-9A-Za-z — URL-safe, copy-paste friendly, no padding

const SEED_VERSION = 'DF1:';

// Entity kind index — APPEND ONLY. Never reorder or remove.
// Old seeds referencing idx 0 will always mean 'player'.
const SEED_ENTITY_KINDS = [
  'player',  // 0
  'goblin',  // 1
  'archer',  // 2
  'barrel',  // 3
  'crate',   // 4
  'torch',   // 5
  'fire-n',   // 6  fire-trap dir:n phase:0%
  'fire-s',   // 7  fire-trap dir:s phase:0%
  'fire-e',   // 8  fire-trap dir:e phase:0%
  'fire-w',   // 9  fire-trap dir:w phase:0%
  'fire-n-1', // 10 fire-trap dir:n phase:25%
  'fire-s-1', // 11 fire-trap dir:s phase:25%
  'fire-e-1', // 12 fire-trap dir:e phase:25%
  'fire-w-1', // 13 fire-trap dir:w phase:25%
  'fire-n-2', // 14 fire-trap dir:n phase:50%
  'fire-s-2', // 15 fire-trap dir:s phase:50%
  'fire-e-2', // 16 fire-trap dir:e phase:50%
  'fire-w-2', // 17 fire-trap dir:w phase:50%
  'fire-n-3', // 18 fire-trap dir:n phase:75%
  'fire-s-3', // 19 fire-trap dir:s phase:75%
  'fire-e-3', // 20 fire-trap dir:e phase:75%
  'fire-w-3', // 21 fire-trap dir:w phase:75%
  'warrior',  // 22 goblin warrior
  // future: 'skeleton', 'troll', 'chest' …
];

// Tile encoding — values stored in RLE stream
const SEED_TILE = { W:0, F:1, E:2 };
const SEED_TILE_REV = ['W','F','E'];

// ── Base62 codec ──────────────────────────────────────────────
const B62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function b62Encode(bytes) {
  // Convert byte array to BigInt then to base62 string
  let n = 0n;
  for (const b of bytes) { n = n * 256n + BigInt(b); }
  if (n === 0n) return '0';
  let s = '';
  while (n > 0n) { s = B62_CHARS[Number(n % 62n)] + s; n /= 62n; }
  // Preserve leading zero-bytes as leading '0' chars
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) s = '0' + s;
  return s;
}

function b62Decode(str) {
  let n = 0n;
  for (const ch of str) {
    const v = B62_CHARS.indexOf(ch);
    if (v < 0) throw new Error('Invalid base62 character: ' + ch);
    n = n * 62n + BigInt(v);
  }
  // Convert BigInt back to byte array
  const bytes = [];
  while (n > 0n) { bytes.unshift(Number(n & 255n)); n >>= 8n; }
  // Restore leading zeros
  for (let i = 0; i < str.length && str[i] === '0'; i++) bytes.unshift(0);
  return new Uint8Array(bytes);
}

// ── Encode a mapData object → seed string ─────────────────────
function seedEncode(mapData) {
  const bytes = [];

  // Header: width, height
  bytes.push(mapData.width & 0xff);
  bytes.push(mapData.height & 0xff);

  // Tiles: flatten rows to tile values, then RLE-encode
  const tileVals = [];
  for (const row of mapData.rows) {
    for (const ch of row.toUpperCase()) {
      tileVals.push(SEED_TILE[ch] ?? SEED_TILE.W);
    }
  }
  // RLE: [value, runLength] pairs, max run 255
  let i = 0;
  while (i < tileVals.length) {
    const v = tileVals[i];
    let run = 1;
    while (i + run < tileVals.length && tileVals[i + run] === v && run < 255) run++;
    bytes.push(v, run);
    i += run;
  }

  // Entities: [kind_idx, tx, ty] per entity — skip unknown kinds
  for (const e of (mapData.entities || [])) {
    let kindStr = e.kind;
    // fire-trap encodes direction + phase as one of 16 kind indices
    if (kindStr === 'fire-trap') {
      const phaseIdx = [0, 0.25, 0.5, 0.75].indexOf(e.phase || 0);
      const p = phaseIdx < 0 ? 0 : phaseIdx;
      kindStr = 'fire-' + (e.dir || 'e') + (p > 0 ? '-' + p : '');
    }
    const idx = SEED_ENTITY_KINDS.indexOf(kindStr);
    if (idx < 0) continue; // unknown kind — skip, don't break encoding
    bytes.push(idx & 0xff, e.tx & 0xff, e.ty & 0xff);
  }

  return SEED_VERSION + b62Encode(new Uint8Array(bytes));
}

// ── Decode a seed string → mapData object ─────────────────────
function seedDecode(seed) {
  seed = seed.trim();
  if (!seed.startsWith(SEED_VERSION)) {
    throw new Error('Not a valid Dungeon Forge seed (must start with ' + SEED_VERSION + ')');
  }
  const payload = seed.slice(SEED_VERSION.length);
  if (!payload) throw new Error('Seed is empty');

  const bytes = b62Decode(payload);
  let pos = 0;

  function read() {
    if (pos >= bytes.length) throw new Error('Seed data truncated');
    return bytes[pos++];
  }

  // Header
  const width  = read();
  const height = read();
  if (width < 4 || width > 255 || height < 4 || height > 255) {
    throw new Error('Invalid map dimensions in seed');
  }
  const totalTiles = width * height;

  // RLE tile decode
  const tileVals = [];
  while (tileVals.length < totalTiles) {
    const v   = read();
    const run = read();
    if (run === 0) throw new Error('Zero-length run in tile data');
    for (let r = 0; r < run && tileVals.length < totalTiles; r++) {
      tileVals.push(v);
    }
  }

  // Convert flat tile values back to rows
  const rows = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      row += SEED_TILE_REV[tileVals[y * width + x]] || 'W';
    }
    rows.push(row);
  }

  // Entity decode: groups of 3 bytes until end
  const entities = [];
  while (pos + 2 < bytes.length) {
    const kindIdx = read();
    const tx      = read();
    const ty      = read();
    let kindStr = SEED_ENTITY_KINDS[kindIdx];
    if (!kindStr) continue; // future entity type — skip gracefully
    // All 16 fire-trap variants decode to {kind:'fire-trap', dir, phase}
    const fireDecodeMap = {
      'fire-n':{dir:'n',phase:0},   'fire-s':{dir:'s',phase:0},
      'fire-e':{dir:'e',phase:0},   'fire-w':{dir:'w',phase:0},
      'fire-n-1':{dir:'n',phase:.25},'fire-s-1':{dir:'s',phase:.25},
      'fire-e-1':{dir:'e',phase:.25},'fire-w-1':{dir:'w',phase:.25},
      'fire-n-2':{dir:'n',phase:.5}, 'fire-s-2':{dir:'s',phase:.5},
      'fire-e-2':{dir:'e',phase:.5}, 'fire-w-2':{dir:'w',phase:.5},
      'fire-n-3':{dir:'n',phase:.75},'fire-s-3':{dir:'s',phase:.75},
      'fire-e-3':{dir:'e',phase:.75},'fire-w-3':{dir:'w',phase:.75},
    };
    if (fireDecodeMap[kindStr]) {
      const fd = fireDecodeMap[kindStr];
      entities.push({ kind:'fire-trap', dir:fd.dir, phase:fd.phase, tx, ty });
    } else {
      entities.push({ kind:kindStr, tx, ty });
    }
  }

  return {
    id:        Date.now() + '',
    name:      'Imported Map',
    width, height, rows, entities,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ── Modal helpers ─────────────────────────────────────────────
function seedModalClose() {
  document.getElementById('seed-modal').classList.remove('show');
}

function seedShowExport(mapId) {
  const m = storeGet(mapId);
  if (!m) return;
  const seed = seedEncode(m);
  document.getElementById('seed-modal-title').textContent = 'MAP SEED — ' + m.name.toUpperCase();
  document.getElementById('seed-string').textContent = seed;
  document.getElementById('seed-export-view').style.display = '';
  document.getElementById('seed-import-view').style.display = 'none';
  document.getElementById('seed-modal').classList.add('show');
}

function seedShowImport() {
  document.getElementById('seed-modal-title').textContent = 'IMPORT MAP SEED';
  document.getElementById('seed-export-view').style.display = 'none';
  document.getElementById('seed-import-view').style.display = '';
  document.getElementById('seed-import-err').textContent = '';
  document.getElementById('seed-import-input').value = '';
  document.getElementById('seed-modal').classList.add('show');
  setTimeout(() => document.getElementById('seed-import-input').focus(), 60);
}

function seedCopy() {
  const el = document.getElementById('seed-string');
  const s = el.textContent;
  const btn = document.querySelector('#seed-export-view .seed-btn.primary');
  const flashBtn = () => {
    const orig = btn.textContent;
    btn.textContent = '✓ COPIED';
    setTimeout(() => btn.textContent = orig, 1500);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(s).then(flashBtn).catch(() => fallbackCopy(el, flashBtn));
  } else {
    fallbackCopy(el, flashBtn);
  }
}

function fallbackCopy(el, done) {
  // Select only the text inside the seed element, not the whole page
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  try { document.execCommand('copy'); } catch(e) {}
  sel.removeAllRanges();
  done();
}

function seedImportConfirm() {
  const raw = document.getElementById('seed-import-input').value.trim();
  const errEl = document.getElementById('seed-import-err');
  errEl.textContent = '';
  if (!raw) { errEl.textContent = 'Please paste a seed code.'; return; }
  let mapData;
  try {
    mapData = seedDecode(raw);
  } catch(e) {
    errEl.textContent = e.message || 'Invalid seed.';
    return;
  }
  // Ask for a name
  const name = prompt('Name this imported map:', 'Imported Map');
  if (name === null) return; // user cancelled
  mapData.name = name.trim() || 'Imported Map';
  storeSet(mapData.id, mapData);
  seedModalClose();
  refreshHub();
}

// Close modal on backdrop click
document.getElementById('seed-modal').addEventListener('click', function(e) {
  if (e.target === this) seedModalClose();
});


// ═══════════════════════════════════════════════════════════════════
// ════════════ BOW SYSTEM ════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
//
// Attack modes:
//   Normal (uncharged / partial charge): 3 arrows in a 30° spread
//   Power shot (full charge):            1 massive arrow + visual trail
//
// Spacebar: dodge roll — brief dash in movement direction + iFrames
//
// Per-player bow state (stored on gPlayer):
//   bowCharging    — bool: LMB held
//   bowChargeTick  — frames held
//   bowCooldown    — frames until next shot
//   rollActive     — bool: currently rolling
//   rollTick       — frames elapsed in roll
//   rollCooldown   — frames until next roll
//   rollVx/rollVy  — roll velocity

const BOW_FULL_RATIO = 0.85; // charge ratio that triggers power shot

// ── Charge start / release ────────────────────────────────────────
function bowStartCharge() {
  if (!gPlayer || gPlayer.dead || exitReached) return;
  if ((gPlayer.bowCooldown || 0) > 0) return;
  gPlayer.bowCharging   = true;
  gPlayer.bowChargeTick = 0;
}

function bowRelease() {
  if (!gPlayer || !gPlayer.bowCharging) return;
  gPlayer.bowCharging = false;
  if ((gPlayer.bowCooldown || 0) > 0) { gPlayer.bowChargeTick = 0; return; }

  const bw    = WeaponRegistry.bow;
  const ratio = Math.min(1, (gPlayer.bowChargeTick || 0) / bw.chargeMax);
  const ang   = gPlayer.angle;

  if (ratio >= BOW_FULL_RATIO) {
    // ── Power shot: full pierce ────────────────────────────────────
    bowFireArrow(ang, bw.arrowSpeed * 1.35, bw.arrowLife + 30, bw.arrowDamageMax, true, 1.0);
    gPlayTwang();
  } else {
    // ── 3-arrow spread: pierce scales with charge ratio ────────────
    const spread = bw.spreadAngle * (1 - ratio * 0.55);
    const dmg    = bw.arrowDamage + Math.round((bw.arrowDamageMax - bw.arrowDamage) * ratio * 0.4);
    const pierce = ratio * 0.6; // 0% uncharged → 60% at threshold
    bowFireArrow(ang,              bw.arrowSpeed,        bw.arrowLife, dmg, false, pierce);
    bowFireArrow(ang - spread / 2, bw.arrowSpeed * 0.95, bw.arrowLife, dmg, false, pierce);
    bowFireArrow(ang + spread / 2, bw.arrowSpeed * 0.95, bw.arrowLife, dmg, false, pierce);
    gPlayTwang();
  }

  gPlayer.bowChargeTick = 0;
  gPlayer.bowCooldown   = bw.shotCooldown;
}

function bowFireArrow(angle, speed, life, dmg, isPower, pierce) {
  if (!Number.isFinite(angle) || !Number.isFinite(speed)) return;
  gPlayerArrows.push({
    wx: gPlayer.wx, wy: gPlayer.wy,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    angle, life,
    dmg,
    isPower: !!isPower,
    pierce: pierce || 0,
    speed,  // stored for sub-step calculation
  });
}

// ── Dodge roll ────────────────────────────────────────────────────
function bowDodgeRoll() {
  if (!gPlayer || gPlayer.dead || exitReached) return;
  if (gPlayer.rollActive) return;
  if ((gPlayer.rollCooldown || 0) > 0) return;

  const bw  = WeaponRegistry.bow;
  const mvx = gPlayer.vx || 0, mvy = gPlayer.vy || 0;
  const spd = Math.hypot(mvx, mvy);
  const rdx = spd > 0.1 ? mvx / spd : Math.cos(gPlayer.angle);
  const rdy = spd > 0.1 ? mvy / spd : Math.sin(gPlayer.angle);

  gPlayer.rollActive    = true;
  gPlayer.rollTick      = 0;
  gPlayer.rollVx        = rdx * bw.rollSpeed;
  gPlayer.rollVy        = rdy * bw.rollSpeed;
  gPlayer.iFrames       = bw.rollIFrames;
  gPlayer.bowCharging   = false;
  gPlayer.bowChargeTick = 0;

  spawnGP(gPlayer.wx, gPlayer.wy, '#8888ff', 6, 2);
}

// ── Per-frame bow state update (called from gUpdatePlayer) ────────
function bowUpdate(p, dt=1) {
  const bw = WeaponRegistry.bow;
  if ((p.bowCooldown  || 0) > 0) p.bowCooldown  = Math.max(0, p.bowCooldown  - dt);
  if ((p.rollCooldown || 0) > 0) p.rollCooldown = Math.max(0, p.rollCooldown - dt);

  if (p.bowCharging && (p.bowCooldown || 0) === 0) {
    p.bowChargeTick = Math.min((p.bowChargeTick || 0) + dt, bw.chargeMax);
  }

  if (p.rollActive) {
    p.rollTick = (p.rollTick || 0) + dt;
    p.wx += p.rollVx * dt;
    p.wy += p.rollVy * dt;
    const [rx, ry] = gRC(p.wx, p.wy, p.r);
    p.wx = rx; p.wy = ry;
    // Leave motion trail particles
    if (p.rollTick % 3 === 0) spawnGP(p.wx, p.wy, '#6666cc', 3, 1.2);
    if (p.rollTick >= bw.rollDuration) {
      p.rollActive   = false;
      p.rollCooldown = bw.rollCooldown;
      spawnGP(p.wx, p.wy, '#9999ee', 5, 1.8);
    }
  }
}

// ── Draw charge cone ──────────────────────────────────────────────
function bowDrawCone(p) {
  if (!p || !p.bowCharging && !(p.bowChargeTick > 0)) return;
  const bw    = WeaponRegistry.bow;
  const ratio = Math.min(1, (p.bowChargeTick || 0) / bw.chargeMax);
  if (ratio <= 0) return;

  const isPower = ratio >= BOW_FULL_RATIO;
  const sx = p.wx - camX, sy = p.wy - camY;
  const ang = p.angle;
  const len = 55 + ratio * 45;
  const alpha = 0.2 + ratio * 0.55;

  gctx.save();
  gctx.translate(sx, sy);

  if (isPower) {
    // Single bright converged beam
    gctx.globalAlpha = alpha;
    gctx.strokeStyle = '#ffdd44';
    gctx.lineWidth   = 3;
    gctx.shadowColor = '#ffaa00';
    gctx.shadowBlur  = 8;
    gctx.beginPath();
    gctx.moveTo(0, 0);
    gctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
    gctx.stroke();
    // Arrowhead at tip — matches player arrow style
    const tx = Math.cos(ang) * len, ty = Math.sin(ang) * len;
    gctx.globalAlpha = alpha;
    gctx.shadowColor = '#ffaa00';
    gctx.shadowBlur  = 10;
    // Outer white head
    gctx.fillStyle = '#ffffff';
    gctx.beginPath();
    gctx.moveTo(tx + Math.cos(ang) * 10, ty + Math.sin(ang) * 10);
    gctx.lineTo(tx + Math.cos(ang + Math.PI * 0.75) * 7, ty + Math.sin(ang + Math.PI * 0.75) * 7);
    gctx.lineTo(tx + Math.cos(ang - Math.PI * 0.75) * 7, ty + Math.sin(ang - Math.PI * 0.75) * 7);
    gctx.closePath();
    gctx.fill();
    // Golden inner highlight
    gctx.fillStyle = '#ffeeaa';
    gctx.beginPath();
    gctx.moveTo(tx + Math.cos(ang) * 10, ty + Math.sin(ang) * 10);
    gctx.lineTo(tx + Math.cos(ang + Math.PI * 0.75) * 4, ty + Math.sin(ang + Math.PI * 0.75) * 4);
    gctx.lineTo(tx + Math.cos(ang - Math.PI * 0.75) * 4, ty + Math.sin(ang - Math.PI * 0.75) * 4);
    gctx.closePath();
    gctx.fill();
  } else {
    // Three converging lines — outer lines close toward centre as ratio increases
    const spread = bw.spreadAngle * (1 - ratio * 0.9);
    const offsets = [-spread / 2, 0, spread / 2];
    offsets.forEach((off, i) => {
      const a2 = ang + off;
      gctx.globalAlpha = i === 1 ? alpha * 0.85 : alpha * 0.45;
      gctx.strokeStyle = '#aabbff';
      gctx.lineWidth   = i === 1 ? 1.5 : 1;
      gctx.beginPath();
      gctx.moveTo(0, 0);
      gctx.lineTo(Math.cos(a2) * len, Math.sin(a2) * len);
      gctx.stroke();
    });
  }

  gctx.restore();
}

// ── Draw power arrow trail ────────────────────────────────────────
// Called from gDrawArrows for arrows with isPower:true
function bowDrawPowerTrail(a) {
  const sx = a.wx - camX, sy = a.wy - camY;
  const trail = 22;
  const tx = sx - Math.cos(a.angle) * trail;
  const ty = sy - Math.sin(a.angle) * trail;
  const grd = gctx.createLinearGradient(tx, ty, sx, sy);
  grd.addColorStop(0, 'rgba(255,180,0,0)');
  grd.addColorStop(1, 'rgba(255,220,60,0.75)');
  gctx.save();
  gctx.lineWidth   = 4;
  gctx.strokeStyle = grd;
  gctx.shadowColor = '#ffaa00';
  gctx.shadowBlur  = 8;
  gctx.beginPath();
  gctx.moveTo(tx, ty);
  gctx.lineTo(sx, sy);
  gctx.stroke();
  gctx.restore();
}


// ═══════════════════════════════════════════════════════════════════
