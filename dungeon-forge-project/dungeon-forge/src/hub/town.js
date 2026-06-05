// ═══════════════════════════════════════════════════════════════════
// ════════════ TOWN (HUB WORLD) SYSTEM ══════════════════════════════
// ═══════════════════════════════════════════════════════════════════
//
// Millhaven runs through the existing dungeon engine (gameLoad +
// startGameLoop). No separate loop, no separate canvas, no gctx swap.
// inTown flag gates combat and enables hub presence rendering.

let inTown = false;

// Remote hub players: { [id]: { wx,wy,angle,moving,walkFrame,_tx,_ty,_spriteCanvas,color } }
const hubPlayers = {};
let hubPresenceRef = null;

// ── Enter / leave town ────────────────────────────────────────────
function goTown() {
  inTown = true;
  const map = JSON.parse(JSON.stringify(HUB_MAP));
  // Make decoratives indestructible in town
  map.entities = map.entities.map(e =>
    (e.kind==='barrel'||e.kind==='crate') ? {...e, _indestructible:true} : e);
  gameLoad(map);
  document.getElementById('g-area').textContent = 'THE SANCTUM';
  document.getElementById('g-kills').textContent = '';
  document.getElementById('g-ww').textContent = '';
  showScreen('game'); // startGameLoop called inside showScreen
  townStartPresence();
  document.getElementById('gc').focus();
}

function leaveTown() {
  if (!inTown) return;
  inTown = false;
  portalOpen = false;
  townSendPresence._last = null; // reset presence delta cache
  document.getElementById('portal-overlay').style.display = 'none';
  townStopPresence();
  if (gLoopId) { cancelAnimationFrame(gLoopId); gLoopId = null; }
}

// ── Hub presence — Firebase write/read ────────────────────────────
function townStartPresence() {
  if (!window._FB) return;
  const db      = window._FB.db;
  const selfRef = db.ref(`hub/players/${LOCAL_ID}`);
  selfRef.onDisconnect().remove();
  const spriteData = localStorage.getItem('df_player_sprite') || null;
  selfRef.update({ sprite: spriteData, color: mpNextColor(), t: Date.now() });
  hubPresenceRef = db.ref('hub/players');
  hubPresenceRef.on('child_added',   snap => townOnHubPlayer(snap));
  hubPresenceRef.on('child_changed', snap => townOnHubPlayer(snap));
  hubPresenceRef.on('child_removed', snap => { delete hubPlayers[snap.key]; });
}

function townOnHubPlayer(snap) {
  const pid  = snap.key;
  if (pid === LOCAL_ID) return;
  const data = snap.val();
  if (!data) return;
  if (!hubPlayers[pid]) {
    hubPlayers[pid] = { color: data.color || '#ff6060' };
    if (data.sprite) {
      try { hubPlayers[pid]._spriteCanvas = ccPixelsToCanvas(JSON.parse(data.sprite)); } catch(e) {}
    }
  }
  const p = hubPlayers[pid];
  if (data.wx != null) { p._tx = data.wx; p._ty = data.wy; }
  if (data.wx != null && p.wx == null) { p.wx = data.wx; p.wy = data.wy; }
  p.angle = data.angle || 0; p.moving = !!data.moving;
  p.walkFrame = data.walkFrame || 0; p._activeWeapon = data.weapon || 'sword';
  if (data.t && Date.now() - data.t > 12000) {
    delete hubPlayers[pid];
    window._FB.db.ref(`hub/players/${pid}`).remove();
  }
}

function townSendPresence() {
  if (!window._FB || !gPlayer || !inTown) return;
  const wx = Math.round(gPlayer.wx), wy = Math.round(gPlayer.wy);
  const ang = +gPlayer.angle.toFixed(3);
  const mv = !!gPlayer.moving, wf = gPlayer.walkFrame||0;
  // Skip write if nothing changed — saves Firebase writes when standing still
  if(townSendPresence._last &&
     townSendPresence._last.wx===wx && townSendPresence._last.wy===wy &&
     townSendPresence._last.ang===ang && townSendPresence._last.mv===mv &&
     townSendPresence._last.wf===wf) return;
  townSendPresence._last = {wx,wy,ang,mv,wf};
  window._FB.db.ref(`hub/players/${LOCAL_ID}`).update({
    wx, wy, angle: ang, moving: mv, walkFrame: wf,
    weapon: gActiveWeapon, t: Date.now(),
  });
}

function townStopPresence() {
  if (hubPresenceRef) { hubPresenceRef.off(); hubPresenceRef = null; }
  if (window._FB) window._FB.db.ref(`hub/players/${LOCAL_ID}`).remove();
}

// ── Draw remote hub players (called from gRender when inTown) ─────
function townDrawHubPlayers() {
  for (const p of Object.values(hubPlayers)) {
    if (p.wx == null) continue;
    // Interpolate
    if (p._tx != null) {
      p.wx += (p._tx - p.wx) * 0.18;
      p.wy += (p._ty - p.wy) * 0.18;
    }
    const fake = {
      wx: p.wx, wy: p.wy, angle: p.angle || 0,
      moving: !!p.moving, walkFrame: p.walkFrame || 0,
      r: 11, iFrames: 0, dead: false,
      swinging: false, swingTimer: 0, swingDir: 1,
      swingStartAngle: 0, swingEndAngle: 0, swingAimAngle: 0,
      charging: false, chargeTick: 0, wwActive: false, smear: null,
      _spriteCanvas: p._spriteCanvas || null,
      _activeWeapon: p._activeWeapon || 'sword',
    };
    drawAnyPlayer(fake, p.color || '#ff6060');
  }
}

// ── Portal arch glow (rendered in gRender when inTown) ─────────────
function townDrawPortal() {
  const px = 19.5 * T - camX, py = 5 * T - camY;
  if (px < -T*4||px > VW+T*4||py < -T*4||py > VH+T*4) return;
  const pulse = 0.4 + 0.2 * Math.sin(gFrame * 0.03);
  // Glow
  const grd = gctx.createRadialGradient(px, py, 0, px, py, T*2.5);
  grd.addColorStop(0, `rgba(160,80,255,${pulse})`);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  gctx.fillStyle = grd;
  gctx.beginPath(); gctx.arc(px, py, T*2.5, 0, Math.PI*2); gctx.fill();
  // Proximity ring — brightens when player is close
  if (portalNearby) {
    const rp = 0.5 + 0.5 * Math.sin(gFrame * 0.1);
    gctx.strokeStyle = `rgba(220,160,255,${0.4+rp*0.4})`;
    gctx.lineWidth = 2;
    gctx.beginPath(); gctx.arc(px, py, PORTAL_RADIUS, 0, Math.PI*2); gctx.stroke();
  }
  // Label
  gctx.fillStyle = `rgba(200,140,255,${0.5+pulse*0.5})`;
  gctx.font = 'bold 8px monospace';
  gctx.textAlign = 'center';
  gctx.fillText('DUNGEON GATE', px, py + T*2.2);
  gctx.textAlign = 'left';
}


// ═══════════════════════════════════════════════════════════════════
// ════════════ PORTAL SYSTEM ═════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
//
// When the player is near the portal arch in The Sanctum, they are
// prompted to press E. This opens the dungeon selection overlay.
// Host picks a map → everyone enters. Solo → enters immediately.

const PORTAL_WX = 19.5 * T;  // portal world-space centre X
const PORTAL_WY = 5   * T;   // portal world-space centre Y
const PORTAL_RADIUS = T * 3; // proximity trigger radius

let portalNearby    = false;  // player is close enough to interact
let portalOpen      = false;  // overlay is showing

// ── Check proximity each frame (called from gRender when inTown) ──
function portalCheckProximity() {
  if (!gPlayer || !inTown) return;
  const d = Math.hypot(gPlayer.wx - PORTAL_WX, gPlayer.wy - PORTAL_WY);
  portalNearby = d < PORTAL_RADIUS;
}

// ── Draw proximity prompt ─────────────────────────────────────────
function portalDrawPrompt() {
  if (!portalNearby || portalOpen) return;
  const sx = PORTAL_WX - camX, sy = PORTAL_WY - camY + T * 2.8;
  const pulse = 0.7 + 0.3 * Math.sin(gFrame * 0.06);
  gctx.save();
  gctx.globalAlpha = pulse;
  gctx.fillStyle = '#c080ff';
  gctx.font = 'bold 9px monospace';
  gctx.textAlign = 'center';
  gctx.fillText('[E] ENTER DUNGEON', sx, sy);
  gctx.textAlign = 'left';
  gctx.restore();
}

// ── Open dungeon selection overlay ───────────────────────────────
function portalOpenOverlay() {
  if (!inTown || !portalNearby) return;
  portalOpen = true;
  const ov   = document.getElementById('portal-overlay');
  const list = document.getElementById('portal-map-list');
  const sub  = document.getElementById('portal-sub');
  list.innerHTML = '';

  // If joining player in MP — show waiting state
  if (MP.active && !MP.isHost) {
    sub.textContent = 'Waiting for the host to choose a dungeon...';
    ov.style.display = 'flex';
    return;
  }

  sub.textContent = 'Choose a dungeon to enter.';

  // Build map list: Demo + saved maps
  const maps = [
    { id: 'demo', name: 'Goblin Cave (Demo)', isDemo: true },
    ...getAllMaps(),
  ];

  maps.forEach(m => {
    const btn = document.createElement('button');
    btn.textContent = m.name;
    btn.style.cssText = `background:#1a1428;border:1px solid #5a3a9a;color:#c0a0ff;
      padding:10px 14px;font-family:inherit;font-size:10px;letter-spacing:1px;
      border-radius:3px;cursor:pointer;text-align:left;transition:all .12s;`;
    btn.onmouseover = () => { btn.style.borderColor='#9060d0'; btn.style.color='#e0c0ff'; };
    btn.onmouseout  = () => { btn.style.borderColor='#5a3a9a'; btn.style.color='#c0a0ff'; };
    btn.onclick = () => portalEnterDungeon(m);
    list.appendChild(btn);
  });

  ov.style.display = 'flex';
}

function portalClose() {
  portalOpen = false;
  document.getElementById('portal-overlay').style.display = 'none';
}

// ── Enter a dungeon ───────────────────────────────────────────────
function portalEnterDungeon(m) {
  portalClose();
  const mapData = m.isDemo
    ? JSON.parse(JSON.stringify(DEMO_MAP))
    : storeGet(m.id);
  if (!mapData) return;

  if (MP.active && MP.isHost) {
    // MP host: broadcast map to all clients then launch
    mpStartGame(mapData);
  } else {
    // Solo play
    leaveTown();
    currentMapData = mapData;
    gameLoad(mapData);
    showScreen('game'); // startGameLoop called inside showScreen
  }
}

// ═══════════════════════════════════════════════════════════════
