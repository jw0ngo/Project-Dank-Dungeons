// §7  MULTIPLAYER
//     NetAdapter pattern — swap Net.* to migrate from Firebase to WebSockets
//     Phase 1 (now):  Firebase Realtime DB, host-authoritative
//     Phase 2 (next): WebSocket server, server-authoritative
// ═══════════════════════════════════════════════════════════════

// ── §7.1  Constants & session state ─────────────────────────────
const MP_MAX_PLAYERS    = 4;     // hard cap for Phase 1 MVP
const MP_FRIENDLY_FIRE  = false; // set true to enable PvP arrow damage between players
const MP_INPUT_HZ     = 20;    // how often clients send input state
const MP_ENEMY_HZ     = 8;     // how often host broadcasts enemy state
const MP_ENEMY_DELTA  = 2;     // px threshold — skip enemy if barely moved
const MP_LERP_SPEED   = 0.18;  // remote player position interpolation (0-1)


const MP = {
  active:    false,
  isHost:    false,
  roomId:    null,
  localId:   null,
  players:   {},      // pid → RemotePlayer
  colorIdx:  0,
  sendTick:  0,
  _listeners:[],      // [{r, ev, cb}] torn down in Net.disconnect()
  COLORS: ['#ff6060','#60ff80','#60c0ff','#ffcc40','#ff60d0','#80ffcc'],
};

// RemotePlayer shape:
// { wx, wy, _tx, _ty, angle, hp, dead, swinging, walkFrame, moving, color }
// _tx/_ty = target position for interpolation

function mpNextColor(){ return MP.COLORS[MP.colorIdx++ % MP.COLORS.length]; }

function mpGenCode(){
  const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s='';for(let i=0;i<6;i++)s+=c[Math.floor(Math.random()*c.length)];return s;
}


let _prevEnemyState    = [];
let _prevArrowState       = [];
let _prevPlayerArrowState = [];
// _prevDestructState and _prevPotionState removed — event-driven sync needs no prev state

// ── §7.2  Net adapter (Firebase) ────────────────────────────────
const Net = {

  // ── Lifecycle ────────────────────────────────────────────────

  /** Host: create a room, write map data, listen for joiners */
  async host(roomId, mapData) {
    const db = window._FB.db;
    await db.ref(`rooms/${roomId}`).set({
      map:      JSON.stringify(mapData),
      hostId:   MP.localId,
      started:  false,
      players:  0,
      ts:       Date.now(),
    });
    db.ref(`rooms/${roomId}`).onDisconnect().remove();

    // Watch joining players
    const playersRef = db.ref(`rooms/${roomId}/players`);
    Net._on(playersRef, 'child_added',   Net._onPlayerAdded);
    Net._on(playersRef, 'child_changed', Net._onPlayerChanged);
    Net._on(playersRef, 'child_removed', Net._onPlayerRemoved);

    // Host: listen for hit reports from clients
    const hitsRef = db.ref(`rooms/${roomId}/hits`);
    Net._on(hitsRef, 'child_added', (snap) => {
      const hits = snap.val();
      if (!hits || !Array.isArray(hits)) return;
      let destructChanged = false;
      hits.forEach(hit => {
        if (hit.destructIdx !== undefined) {
          // Destructible break report from a client
          const d = gDestructibles[hit.destructIdx];
          if (!d || d.broken) return;
          d.hp--;
          if (d.hp <= 0) {
            d.broken = true; d.breakAnim = 20;
            gPlayWoodBreak(); spawnGP(d.wx, d.wy, '#c89050', 10, 3);
            gMaybeDropPotion(d.wx, d.wy);
            gRebuildNav(); for(const e of gEnemies){e.path=null;e.pathTimer=0;}
            destructChanged = true;
          }
        } else {
          // Enemy damage report from a client
          const e = gEnemies[hit.idx];
          if (!e || e.dead) return;
          e.hp -= hit.dmg;
          e.hitFlash = 12;
          if (e.hp <= 0) { e.dead = true; }
        }
      });
      if (destructChanged) { mpSyncDestructibles(); mpSyncPotions(); }
      // Acknowledge — clear the hit report so it doesn't re-fire
      snap.ref.remove();
    });

    // Host: listen for custom sprites from joiners
    Net._on(db.ref(`rooms/${roomId}/sprites`), 'child_added', (snap) => {
      const pid = snap.key;
      const pixels = snap.val();
      if (!pixels || pid === MP.localId) return;
      if (MP.players[pid]) {
        MP.players[pid]._spriteCanvas = ccPixelsToCanvas(pixels);
      }
    });
    Net._on(db.ref(`rooms/${roomId}/sprites`), 'child_changed', (snap) => {
      const pid = snap.key;
      const pixels = snap.val();
      if (!pixels || pid === MP.localId) return;
      if (MP.players[pid]) {
        MP.players[pid]._spriteCanvas = ccPixelsToCanvas(pixels);
      }
    });

    // Host: listen for respawn signal (from any player, including self)
    Net._on(db.ref(`rooms/${roomId}/signal`), 'value', (snap) => {
      const sig = snap.val();
      if (!sig || sig.type !== 'respawn') return;
      // Clear signal then respawn
      snap.ref.remove();
      _doRespawn();
    });
  },

  /** Client: join an existing room */
  async join(roomId) {
    const db   = window._FB.db;
    const snap = await db.ref(`rooms/${roomId}`).get();
    const room = snap.val();
    if (!room) throw new Error('Room not found');

    // Enforce player cap
    const playerCount = Object.keys(room.players||{}).length + 1; // +1 for host
    if (playerCount >= MP_MAX_PLAYERS) throw new Error(`Room full (max ${MP_MAX_PLAYERS} players)`);

    db.ref(`rooms/${roomId}/players/${MP.localId}`).onDisconnect().remove();

    const playersRef = db.ref(`rooms/${roomId}/players`);
    Net._on(playersRef, 'child_added',   Net._onPlayerAdded);
    Net._on(playersRef, 'child_changed', Net._onPlayerChanged);
    Net._on(playersRef, 'child_removed', Net._onPlayerRemoved);

    // Four independent listeners — each system owns its own path and handler
    Net._on(db.ref(`rooms/${roomId}/world/enemies`),       'value', Net._onEnemiesUpdate);
    Net._on(db.ref(`rooms/${roomId}/world/arrows`),        'value', Net._onArrowsUpdate);
    Net._on(db.ref(`rooms/${roomId}/world/player-arrows`), 'value', Net._onPlayerArrowsUpdate);
    Net._on(db.ref(`rooms/${roomId}/world/destructibles`), 'value', Net._onDestructiblesUpdate);
    Net._on(db.ref(`rooms/${roomId}/world/potions`),       'value', Net._onPotionsUpdate);

    // Client: listen for custom sprites from all players
    Net._on(db.ref(`rooms/${roomId}/sprites`), 'child_added', (snap) => {
      const pid = snap.key;
      const pixels = snap.val();
      if (!pixels || pid === MP.localId) return;
      if (MP.players[pid]) {
        MP.players[pid]._spriteCanvas = ccPixelsToCanvas(pixels);
      } else {
        // Store for when player object is created
        if (!window._pendingSprites) window._pendingSprites = {};
        window._pendingSprites[pid] = pixels;
      }
    });
    Net._on(db.ref(`rooms/${roomId}/sprites`), 'child_changed', (snap) => {
      const pid = snap.key;
      const pixels = snap.val();
      if (!pixels || pid === MP.localId) return;
      if (MP.players[pid]) MP.players[pid]._spriteCanvas = ccPixelsToCanvas(pixels);
    });

    // Client: listen for respawn signal from host
    Net._on(db.ref(`rooms/${roomId}/signal`), 'value', (snap) => {
      const sig = snap.val();
      if (!sig || sig.type !== 'respawn') return;
      _doRespawn();
    });

    return room;
  },

  /** Signal game start (host only) — writes atomically so client reads correct map */
  start(roomId, mapData) {
    const db = window._FB.db;
    // Write everything in one atomic update — guarantees client reads the new map
    // when the started:true listener fires
    db.ref(`rooms/${roomId}`).update({
      startFrame: gFrame,
      map:        JSON.stringify(mapData),
      started:    true,
    });
  },

  /** Watch for game-start signal (client) */
  onStart(roomId, cb) {
    const db      = window._FB.db;
    const roomRef = db.ref(`rooms/${roomId}`);
    const handler = snap => {
      const room = snap.val();
if (!room || room.started !== true) return;
      roomRef.off('value', handler); // self-unsubscribe — fires exactly once
      cb(room); // room already contains the updated map — no second fetch needed
    };
    roomRef.on('value', handler);
    MP._listeners.push({r: roomRef, ev: 'value', cb: handler});
  },

  /** Tear down all listeners and remove our data */
  disconnect() {
    Net._offAll();
    if (window._FB && MP.roomId) {
      const db = window._FB.db;
      db.ref(`rooms/${MP.roomId}/players/${MP.localId}`).remove();
      if (MP.isHost) db.ref(`rooms/${MP.roomId}`).remove();
    }
  },

  // ── Send ─────────────────────────────────────────────────────

  /**
   * Broadcast local INPUT state.
   * Phase 1: we send full position (host-authoritative simulation on host side).
   * Phase 2 migration: change this to send only { keys, angle, actions } and
   *   let the server compute resulting position.
   */
  sendInput() {
    if (!MP.active || !gPlayer || !window._FB) return;
    MP.sendTick++;
    if (MP.sendTick % Math.round(60 / MP_INPUT_HZ) !== 0) return;
    // Skip write if position/state unchanged since last send
    const p = gPlayer;
    const _wx = Math.round(p.wx), _wy = Math.round(p.wy);
    const _ang = +p.angle.toFixed(3);
    const _mv = !!p.moving, _wf = p.walkFrame||0, _dead = !!p.dead;
    if(Net._lastInput &&
       Net._lastInput.wx===_wx && Net._lastInput.wy===_wy &&
       Net._lastInput.ang===_ang && Net._lastInput.mv===_mv &&
       Net._lastInput.wf===_wf && Net._lastInput.dead===_dead) return;
    Net._lastInput = {wx:_wx,wy:_wy,ang:_ang,mv:_mv,wf:_wf,dead:_dead};

    // INPUT packet — what the player is doing, not just where they are.
    // This is the Phase 2-ready format. Host currently uses wx/wy directly,
    // but a future server would apply these inputs to its own simulation.
    const packet = {
      wx:  Math.round(p.wx), wy: Math.round(p.wy),
      dx:  (gKeys['a']||gKeys['arrowleft']?-1:0)+(gKeys['d']||gKeys['arrowright']?1:0),
      dy:  (gKeys['w']||gKeys['arrowup']?-1:0)+(gKeys['s']||gKeys['arrowdown']?1:0),
      ang: +p.angle.toFixed(3),
      hp:  p.hp, dead: !!p.dead,
      weapon:   gActiveWeapon,
      swinging: !!p.swinging,
      swingTimer: p.swingTimer||0,
      swingDir:   p.swingDir||1,
      swingStartAngle: +(p.swingStartAngle||0).toFixed(3),
      swingEndAngle:   +(p.swingEndAngle||0).toFixed(3),
      swingAimAngle:   +(p.swingAimAngle||0).toFixed(3),
      charging:   !!p.charging,
      chargeTick: p.chargeTick||0,
      walkFrame:  p.walkFrame||0,
      moving:     !!p.moving,
      wwActive:   !!p.wwActive,
      wwSpinAngle: p.wwActive ? +p.wwActive.spinAngle.toFixed(3) : 0,
      // Smear — send minimal data for remote rendering
      smear: p.smear ? {
        cx:+p.smear.cx.toFixed(1), cy:+p.smear.cy.toFixed(1),
        startAngle:+p.smear.startAngle.toFixed(3),
        sweepEnd:+p.smear.sweepEnd.toFixed(3),
        endAngle:+p.smear.endAngle.toFixed(3),
        innerR:p.smear.innerR, outerR:p.smear.outerR,
        life:+p.smear.life.toFixed(2), fading:!!p.smear.fading,
      } : null,
    };

    window._FB.db
      .ref(`rooms/${MP.roomId}/players/${MP.localId}`)
      .set(packet);
  },

  /**
   * Host: broadcast world state (enemies).
   * Uses delta compression — only writes enemies that changed meaningfully.
   * Phase 2: server sends this automatically; remove from client entirely.
   */
  /** Client: report sword/ww hits to host so it can apply them authoritatively */
  sendHits(hits) {
    if (!MP.active || MP.isHost || !window._FB || !hits.length) return;
    // push() gives each report a unique key — guarantees child_added fires every time.
    // set() on the same key only fires child_added once then child_changed,
    // which would require a second listener and risks reports overwriting each other.
    window._FB.db
      .ref(`rooms/${MP.roomId}/hits`)
      .push(hits);
  },

  /** §7.2a  Stream: enemy positions + state (8 hz, delta-compressed) */
  sendEnemies() {
    if (!MP.active || !MP.isHost || !window._FB) return;
    if (MP.sendTick % Math.round(60 / MP_ENEMY_HZ) !== 0) return;

    const snapshot = gEnemies.map(e => ({
      wx:   Math.round(e.wx),
      wy:   Math.round(e.wy),
      hp:   e.hp,
      dead: !!e.dead,
      attackCooldown: e.attackCooldown||0,
      hitFlash: e.hitFlash||0,
    }));

    // Delta — only write when something meaningful changed
    let changed = snapshot.length !== _prevEnemyState.length;
    if (!changed) {
      for (let i = 0; i < snapshot.length; i++) {
        const p = _prevEnemyState[i], n = snapshot[i];
        if (!p ||
            Math.abs(n.wx - p.wx) > MP_ENEMY_DELTA ||
            Math.abs(n.wy - p.wy) > MP_ENEMY_DELTA ||
            n.hp !== p.hp || n.dead !== p.dead) {
          changed = true; break;
        }
      }
    }
    if (!changed) return;
    _prevEnemyState = snapshot;
    window._FB.db.ref(`rooms/${MP.roomId}/world/enemies`).set(snapshot);
  },

  /** §7.2b  Stream: arrow positions + physics (8 hz) */
  sendArrows() {
    if (!MP.active || !MP.isHost || !window._FB) return;
    if (MP.sendTick % Math.round(60 / MP_ENEMY_HZ) !== 0) return;

    // Enemy arrows
    const eSnap = gArrows
      .filter(a => Number.isFinite(a.wx) && Number.isFinite(a.wy) &&
                   Number.isFinite(a.vx) && Number.isFinite(a.vy) &&
                   Number.isFinite(a.angle) && Number.isFinite(a.life))
      .map(a => ({
        wx: Math.round(a.wx), wy: Math.round(a.wy),
        vx: +a.vx.toFixed(2), vy: +a.vy.toFixed(2),
        angle: +a.angle.toFixed(3), life: a.life,
      }));
    const eChanged = JSON.stringify(eSnap) !== JSON.stringify(_prevArrowState);
    if (eChanged) {
      _prevArrowState = eSnap;
      window._FB.db.ref(`rooms/${MP.roomId}/world/arrows`).set(eSnap);
    }

    // Player arrows — separate path, separate delta check
    const pSnap = gPlayerArrows
      .filter(a => Number.isFinite(a.wx) && Number.isFinite(a.wy) &&
                   Number.isFinite(a.vx) && Number.isFinite(a.vy) &&
                   Number.isFinite(a.angle) && Number.isFinite(a.life))
      .map(a => ({
        wx: Math.round(a.wx), wy: Math.round(a.wy),
        vx: +a.vx.toFixed(2), vy: +a.vy.toFixed(2),
        angle: +a.angle.toFixed(3), life: a.life,
        isPower: a.isPower ? 1 : 0,
      }));
    const pChanged = JSON.stringify(pSnap) !== JSON.stringify(_prevPlayerArrowState);
    if (pChanged) {
      _prevPlayerArrowState = pSnap;
      window._FB.db.ref(`rooms/${MP.roomId}/world/player-arrows`).set(pSnap);
    }
  },

  // ── Receive handlers ──────────────────────────────────────────

  _onPlayerAdded(snap) {
    const pid = snap.key;
    if (pid === MP.localId) return;
    const data = snap.val() || {};
    if (!MP.players[pid]) {
      MP.players[pid] = { color: mpNextColor() };
    }
    const p = MP.players[pid];
    // Set both real and interpolation target positions
    p.wx = data.wx || 0; p.wy = data.wy || 0;
    p._tx = data.wx || 0; p._ty = data.wy || 0;
    Object.assign(p, data);
    // Apply sprite if it arrived before player object was created
    if(window._pendingSprites && window._pendingSprites[pid]){
      p._spriteCanvas = ccPixelsToCanvas(window._pendingSprites[pid]);
      delete window._pendingSprites[pid];
    }
    mpUpdateHUD();
  },

  _onPlayerChanged(snap) {
    const pid = snap.key;
    if (pid === MP.localId) return;
    const data = snap.val() || {};
    if (!MP.players[pid]) {
      MP.players[pid] = { color: mpNextColor(), wx: data.wx||0, wy: data.wy||0,
        _tx: data.wx||0, _ty: data.wy||0 };
    }
    const p = MP.players[pid];
    // Interpolation target
    if (data.wx != null){ p._tx = data.wx; p._ty = data.wy; }
    if (!p.wx && data.wx){ p.wx = data.wx; p.wy = data.wy; }
    // Combat state for rendering
    p.angle         = data.ang || 0;
    p.hp            = data.hp;
    const wasDead = p.dead;
    p.dead          = !!data.dead;
    // If a remote player just died, show mission failed for everyone
    if (!wasDead && p.dead && !gPlayer.dead) {
      mpShowDeath(false);
    }
    p.swinging      = !!data.swinging;
    p.swingTimer    = data.swingTimer || 0;
    p.swingDir      = data.swingDir || 1;
    p.swingStartAngle = data.swingStartAngle || 0;
    p.swingEndAngle   = data.swingEndAngle   || 0;
    p.swingAimAngle   = data.swingAimAngle   || 0;
    p.charging      = !!data.charging;
    p.chargeTick    = data.chargeTick || 0;
    p.walkFrame     = data.walkFrame  || 0;
    p.moving        = !!data.moving;
    p.wwActive      = !!data.wwActive;
    p._wwSpinAngle  = data.wwSpinAngle || 0;
    p._activeWeapon = data.weapon || 'sword';
    // Smear — reconstruct from serialised form
    p.smear = data.smear || null;
  },

  _onPlayerRemoved(snap) {
    delete MP.players[snap.key];
    mpUpdateHUD();
  },

  // ── §7.2a  Receive: enemy positions + state ───────────────────
  _onEnemiesUpdate(snap) {
    if (!MP.active || MP.isHost) return;
    const src = snap.val();
    if (!src) return;
    const len = Math.min(src.length, gEnemies.length);
    for (let i = 0; i < len; i++) {
      const e = src[i], g = gEnemies[i];
      if (!g) continue;
      const wasAlive  = !g.dead;
      const hadNoFlash = (g.hitFlash||0) === 0;
      const prevHp    = g.hp;
      g._tx = e.wx; g._ty = e.wy;
      if (g.wx === undefined || g.dead || !!e.dead) { g.wx = e.wx; g.wy = e.wy; }
      g.hp             = e.hp;
      g.dead           = !!e.dead;
      g.attackCooldown = e.attackCooldown || 0;
      g.hitFlash       = e.hitFlash || 0;
      if (hadNoFlash && g.hitFlash > 0 && wasAlive) {
        const dmg = prevHp - g.hp;
        if (dmg > 0) addGDmg(g.wx, g.wy-16, dmg, '#fff');
        spawnGP(g.wx, g.wy, '#ff4444', 6, 3);
        gShake(3, 5); gPlayHit();
      }
      if (wasAlive && g.dead) spawnGP(g.wx, g.wy, '#cc2222', 18, 5);
    }
  },

  // ── §7.2b  Receive: arrow positions + physics ─────────────────
  // ── §7.2b  Receive: enemy arrow positions ─────────────────────
  _onArrowsUpdate(snap) {
    if (!MP.active || MP.isHost) return;
    const src = snap.val();
    if (!src) { gArrows.length = 0; return; }
    while (gArrows.length > src.length) gArrows.pop();
    src.forEach((a, i) => {
      if (!Number.isFinite(a.wx) || !Number.isFinite(a.wy) ||
          !Number.isFinite(a.vx) || !Number.isFinite(a.vy) ||
          !Number.isFinite(a.angle) || !Number.isFinite(a.life)) return;
      if (gArrows[i]) {
        gArrows[i].wx = a.wx; gArrows[i].wy = a.wy;
        gArrows[i].vx = a.vx; gArrows[i].vy = a.vy;
        gArrows[i].angle = a.angle; gArrows[i].life = a.life;
      } else {
        gArrows.push({wx:a.wx, wy:a.wy, vx:a.vx, vy:a.vy, angle:a.angle, life:a.life});
      }
    });
  },

  // ── §7.2b2 Receive: player arrow positions ────────────────────
  _onPlayerArrowsUpdate(snap) {
    if (!MP.active || MP.isHost) return;
    const src = snap.val();
    if (!src) { gPlayerArrows.length = 0; return; }
    while (gPlayerArrows.length > src.length) gPlayerArrows.pop();
    src.forEach((a, i) => {
      if (!Number.isFinite(a.wx) || !Number.isFinite(a.wy) ||
          !Number.isFinite(a.vx) || !Number.isFinite(a.vy) ||
          !Number.isFinite(a.angle) || !Number.isFinite(a.life)) return;
      if (gPlayerArrows[i]) {
        gPlayerArrows[i].wx = a.wx; gPlayerArrows[i].wy = a.wy;
        gPlayerArrows[i].vx = a.vx; gPlayerArrows[i].vy = a.vy;
        gPlayerArrows[i].angle = a.angle; gPlayerArrows[i].life = a.life;
        gPlayerArrows[i].isPower = !!a.isPower;
      } else {
        gPlayerArrows.push({wx:a.wx, wy:a.wy, vx:a.vx, vy:a.vy, angle:a.angle, life:a.life, isPower:!!a.isPower});
      }
    });
  },

  // ── §7.2c  Receive: destructible broken state (event-driven) ──
  _onDestructiblesUpdate(snap) {
    if (!MP.active || MP.isHost) return;
    const src = snap.val();
    if (!src || !Array.isArray(src)) return;
    src.forEach((broken, i) => {
      const d = gDestructibles[i];
      if (!d || !broken || d.broken) return;
      d.broken = true; d.breakAnim = 20;
      spawnGP(d.wx, d.wy, '#c89050', 10, 3);
      gRebuildNav();
    });
  },

  // ── §7.2d  Receive: potion positions (event-driven) ───────────
  _onPotionsUpdate(snap) {
    if (!MP.active || MP.isHost) return;
    const src = snap.val();
    gPotions.length = 0;
    if (!src) return;
    src.forEach(p => {
      if (Number.isFinite(p.wx) && Number.isFinite(p.wy))
        gPotions.push({wx:p.wx, wy:p.wy, pulse:Math.random()*Math.PI*2});
    });
  },

  // Trap on/off is derived from gFrame locally — no sync needed
  // (see gUpdateTraps: trap.on = ((gFrame + phaseOffset) % FIRE_PERIOD) < FIRE_HALF)

  // ── Listener management ───────────────────────────────────────

  _on(dbRef, event, cb) {
    // Bind cb so `this` works in handlers
    const bound = cb.bind(Net);
    dbRef.on(event, bound);
    MP._listeners.push({r: dbRef, ev: event, cb: bound});
  },

  _offAll() {
    MP._listeners.forEach(({r, ev, cb}) => { try { r.off(ev, cb); } catch(e){} });
    MP._listeners = [];
  },
};

// ── §7.3  Session management — lobby, host/join, HUD ────────────

function mpShowLobby(){
  document.getElementById('mp-lobby').style.display = 'flex';
  document.getElementById('mp-code-display').style.display = 'none';
  document.getElementById('mp-room-input').value = '';
  document.getElementById('mp-status').textContent = '';
}
function mpCloseLobby(){ document.getElementById('mp-lobby').style.display = 'none'; }
function mpSetStatus(msg){ document.getElementById('mp-status').textContent = msg; }
function mpShowHUD(){ document.getElementById('mp-hud').style.display = 'block'; mpUpdateHUD(); }
function mpHideHUD(){ document.getElementById('mp-hud').style.display = 'none'; }
function mpUpdateHUD(){
  document.getElementById('mp-hud-code').textContent = '⚔ ' + MP.roomId;
  const n = 1 + Object.keys(MP.players).length;
  document.getElementById('mp-hud-players').textContent = n + ' player' + (n > 1 ? 's' : '');
}

// ── Host flow ───────────────────────────────────────────────────
function mpHost(){
  if (!_fbInit()) { mpSetStatus('Firebase not ready — try again'); return; }
  if (MP.active)  { mpSetStatus('Already in a session — cancel first'); return; }

  const code = mpGenCode();
  MP.roomId  = code;
  MP.localId = SESSION_ID;
  MP.isHost  = true;
  MP.active  = true;
  MP.players = {};
  MP.colorIdx = 0;
  // Host Sanctum — dungeon is chosen later at the portal
  window._mpMapData = JSON.parse(JSON.stringify(HUB_MAP));

  Net.host(code, window._mpMapData)
    .then(() => {
      document.getElementById('mp-code-val').textContent = code;
      document.getElementById('mp-code-display').style.display = 'block';
      mpSetStatus('');
      mpCloseLobby();
      // Host enters their Sanctum immediately; dungeon chosen at portal
      _mpSanctumLaunch();
      console.log('[Net] Room hosted:', code);
    })
    .catch(err => {
      mpSetStatus('Error creating room: ' + err.message);
      MP.active = false;
      console.error('[Net] host error:', err);
    });
}

// mpStartGame — now triggered from portal dungeon selection (Phase 2 flow)
// Kept for compatibility; host calls this after choosing a dungeon at the portal
function mpStartGame(mapData){
  if (!MP.active || !MP.isHost) return;
  const md = mapData || window._mpMapData;
  Net.start(MP.roomId, md);
  _mpLaunch(md);
}

// ── Client flow ─────────────────────────────────────────────────
function mpJoin(){
  if (!_fbInit()) { mpSetStatus('Firebase not ready — try again'); return; }
  if (MP.active)  { mpSetStatus('Already in a session — cancel first'); return; }

  const code = document.getElementById('mp-room-input').value.trim().toUpperCase();
  if (code.length !== 6) { mpSetStatus('Enter a 6-letter room code'); return; }

  mpSetStatus('Connecting...');
  MP.localId  = SESSION_ID;
  MP.isHost   = false;
  MP.players  = {};
  MP.colorIdx = 0;

  Net.join(code)
    .then(room => {
      MP.roomId = code;
      MP.active = true;
      // Always enter the Sanctum immediately — _mpClientStart handles
      // both "room not started yet" and "host already in a dungeon"
      _mpClientStart(room);
    })
    .catch(err => {
      mpSetStatus(err.message);
      MP.localId = null;
      console.error('[Net] join error:', err);
    });
}

// ── Sanctum launch (MP) — both host and client enter Sanctum together ──
function _mpSanctumLaunch(){
  inTown = true;
  const map = JSON.parse(JSON.stringify(HUB_MAP));
  map.entities = map.entities.map(e =>
    (e.kind==='barrel'||e.kind==='crate') ? {...e, _indestructible:true} : e);
  gameLoad(map);
  document.getElementById('g-area').textContent = 'THE SANCTUM';
  document.getElementById('g-kills').textContent = '';
  document.getElementById('g-ww').textContent = '';
  showScreen('game'); // showScreen('game') already calls startGameLoop() internally
  mpShowHUD();
  // Broadcast sprite
  setTimeout(()=>{
    const saved = localStorage.getItem('df_player_sprite');
    if(saved && window._FB && MP.roomId){
      try{ window._FB.db.ref(`rooms/${MP.roomId}/sprites/${MP.localId}`).set(JSON.parse(saved)); }catch(e){}
    }
  }, 500);
}

// ── Shared launch ───────────────────────────────────────────────
function _mpLaunch(mapData){
leaveTown(); // stop town loop before entering dungeon
  currentMapData = mapData;
  gameLoad(mapData);
  _prevEnemyState = []; _prevArrowState = []; _prevPlayerArrowState = [];
  showScreen('game');
  mpShowHUD();
  // Broadcast own sprite to room so others can see it
  setTimeout(()=>{
    const saved = localStorage.getItem('df_player_sprite');
    if(saved && window._FB && MP.roomId){
      try{
        window._FB.db.ref(`rooms/${MP.roomId}/sprites/${MP.localId}`).set(JSON.parse(saved));
      }catch(e){}
    }
  }, 500);
}

function _mpClientStart(room){
  mpCloseLobby();
  if (room && room.started) {
    // Host is already in a dungeon — join it directly
    const mapData = (() => {
      try { return JSON.parse(room.map); } catch(e) { return DEMO_MAP; }
    })();
    _mpLaunch(mapData);
  } else {
    // Host is in The Sanctum — join them there, wait for dungeon pick
    _mpSanctumLaunch();
    Net.onStart(MP.roomId, freshRoom => {
      const mapData = (() => {
        try { return JSON.parse(freshRoom.map); } catch(e) { return DEMO_MAP; }
      })();
      _mpLaunch(mapData);
    });
  }
}

// ── Game loop integration ───────────────────────────────────────
// Called every frame from startGameLoop() when MP.active === true
function mpTick(){
  Net.sendInput();
  Net.sendEnemies();
  Net.sendArrows();
}

/** Event-driven: call whenever a destructible breaks. Host-only. */
function mpSyncDestructibles() {
  if (!MP.active || !MP.isHost || !window._FB) return;
  window._FB.db
    .ref(`rooms/${MP.roomId}/world/destructibles`)
    .set(gDestructibles.map(d => d.broken ? 1 : 0));
}

/** Event-driven: call whenever a potion spawns or is picked up. Host-only. */
function mpSyncPotions() {
  if (!MP.active || !MP.isHost || !window._FB) return;
  window._FB.db
    .ref(`rooms/${MP.roomId}/world/potions`)
    .set(gPotions.map(p => ({wx: Math.round(p.wx), wy: Math.round(p.wy)})));
}

// ── Remote player interpolation ─────────────────────────────────
// Smooth enemy movement on clients — lerp toward host-authoritative positions
function mpInterpolateEnemies(){
  if (!MP.active || MP.isHost) return;
  for (const e of gEnemies) {
    if (e.dead || e._tx == null) continue;
    e.wx += (e._tx - e.wx) * 0.25;
    e.wy += (e._ty - e.wy) * 0.25;
  }
}

function mpInterpolateRemotes(){
  let idx=2;
  for (const [id,p] of Object.entries(MP.players)){
    if (p._tx != null){
      p.wx += (p._tx - p.wx) * MP_LERP_SPEED;
      p.wy += (p._ty - p.wy) * MP_LERP_SPEED;
    }
    // Assign stable display label
    p._mpLabel = id==='host'?'HOST':'P'+idx++;
  }
}

// ── Draw remote players ─────────────────────────────────────────
function mpDrawRemotePlayers(){
  if (!MP.active) return;
  mpInterpolateRemotes();
  for (const [id,p] of Object.entries(MP.players)){
    if (p.wx == null) continue;
    drawAnyPlayer(p, p.color||'#ff6060');
  }
}

// ── Session teardown ────────────────────────────────────────────
function mpLeave(){
  if (!MP.active) return;
  Net._lastInput = null; // reset input delta cache
  Net.disconnect();
  MP.active    = false; MP.isHost   = false;
  MP.players   = {};    MP.roomId   = null;
  MP.localId   = null;  MP.colorIdx = 0;
  MP.sendTick  = 0;     MP._listeners = [];
  _prevEnemyState = []; _prevArrowState = []; _prevPlayerArrowState = [];
  mpHideHUD();
}


// ═══════════════════════════════════════════════════════════════
