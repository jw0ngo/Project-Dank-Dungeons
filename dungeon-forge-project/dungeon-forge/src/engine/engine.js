// ── §6.3a  Enemy arrows — move, wall/destructible/player collision ──────────────
// Only enemy (archer) arrows. Never hits enemies. Runs host-only inside gUpdateEnemies.
function gUpdateArrows(dt=1){
  for(let i=gArrows.length-1;i>=0;i--){
    const a=gArrows[i];
    if(!Number.isFinite(a.wx)||!Number.isFinite(a.wy)||
       !Number.isFinite(a.vx)||!Number.isFinite(a.vy)||
       !Number.isFinite(a.angle)||!Number.isFinite(a.life)){
      gArrows.splice(i,1); continue;
    }
    a.life-=dt;
    if(a.life<=0){gArrows.splice(i,1);continue;}

    const steps=Math.ceil(EntityDefs.archer.arrowSpeed*dt/4+1);
    const sx2=a.vx*dt/steps, sy2=a.vy*dt/steps;
    let killed=false;

    for(let s=0;s<steps;s++){
      a.wx+=sx2; a.wy+=sy2;

      // ── Wall check ─────────────────────────────────────────────
      const tx=Math.floor(a.wx/T), ty=Math.floor(a.wy/T);
      const hitWall = !gIsWalk(tx,ty)
        || !gIsWalk(Math.floor((a.wx+2)/T), Math.floor(a.wy/T))
        || !gIsWalk(Math.floor((a.wx-2)/T), Math.floor(a.wy/T))
        || !gIsWalk(Math.floor(a.wx/T), Math.floor((a.wy+2)/T))
        || !gIsWalk(Math.floor(a.wx/T), Math.floor((a.wy-2)/T));
      if(hitWall){gArrows.splice(i,1);killed=true;break;}

      // ── Destructible check ─────────────────────────────────────
      let hitD=false;
      for(const d of gDestructibles){
        if(d.broken)continue;
        if(Math.hypot(a.wx-d.wx,a.wy-d.wy)<d.r+4){
          d.hp=0; d.broken=true; d.breakAnim=20;
          gPlayWoodBreak(); spawnGP(d.wx,d.wy,'#c89050',10,3);
          gMaybeDropPotion(d.wx,d.wy); mpSyncDestructibles(); mpSyncPotions();
          gRebuildNav(); for(const e of gEnemies){e.path=null;e.pathTimer=0;}
          gArrows.splice(i,1); hitD=true; killed=true; break;
        }
      }
      if(hitD)break;

      // ── Player hit (enemy arrows only — never friendly fire here) ──
      if(gPlayer&&!gPlayer.dead&&gPlayer.iFrames<=0){
        if(Math.hypot(a.wx-gPlayer.wx,a.wy-gPlayer.wy)<gPlayer.r+4){
          gArrows.splice(i,1);killed=true;
          gPlayer.hp=Math.max(0,gPlayer.hp-EntityDefs.archer.arrowDamage);
          gPlayer.iFrames=50; gShake(6,9);
          spawnGP(gPlayer.wx,gPlayer.wy,'#c06020',6,3);
          addGDmg(gPlayer.wx,gPlayer.wy-18,EntityDefs.archer.arrowDamage,'#ffaa44');
          gPlayArrowHit(); gPlayGrunt();
          if(gPlayer.hp<=0)gPlayer.dead=true;
          break;
        }
      }
    }
  }
}

// ── §6.3b  Player arrows — move, wall/destructible/enemy collision ───────────
// Only player-fired arrows. Never hits player. Runs host-only (host is authoritative).
// Damage values, pierce, and visual style are independent of enemy arrows.
function gUpdatePlayerArrows(dt=1){
  for(let i=gPlayerArrows.length-1;i>=0;i--){
    const a=gPlayerArrows[i];
    if(!Number.isFinite(a.wx)||!Number.isFinite(a.wy)||
       !Number.isFinite(a.vx)||!Number.isFinite(a.vy)||
       !Number.isFinite(a.angle)||!Number.isFinite(a.life)){
      gPlayerArrows.splice(i,1); continue;
    }
    a.life-=dt;
    if(a.life<=0){gPlayerArrows.splice(i,1);continue;}

    const steps=Math.ceil((a.speed||WeaponRegistry.bow.arrowSpeed)*dt/4+1);
    const sx2=a.vx*dt/steps, sy2=a.vy*dt/steps;
    let killed=false;

    for(let s=0;s<steps;s++){
      a.wx+=sx2; a.wy+=sy2;

      // ── Wall check ─────────────────────────────────────────────
      const tx=Math.floor(a.wx/T), ty=Math.floor(a.wy/T);
      const hitWall = !gIsWalk(tx,ty)
        || !gIsWalk(Math.floor((a.wx+2)/T), Math.floor(a.wy/T))
        || !gIsWalk(Math.floor((a.wx-2)/T), Math.floor(a.wy/T))
        || !gIsWalk(Math.floor(a.wx/T), Math.floor((a.wy+2)/T))
        || !gIsWalk(Math.floor(a.wx/T), Math.floor((a.wy-2)/T));
      if(hitWall){gPlayerArrows.splice(i,1);killed=true;break;}

      // ── Destructible check ─────────────────────────────────────
      let hitD=false;
      for(const d of gDestructibles){
        if(d.broken)continue;
        if(Math.hypot(a.wx-d.wx,a.wy-d.wy)<d.r+4){
          d.hp=0; d.broken=true; d.breakAnim=20;
          gPlayWoodBreak(); spawnGP(d.wx,d.wy,'#c89050',10,3);
          gMaybeDropPotion(d.wx,d.wy); mpSyncDestructibles(); mpSyncPotions();
          gRebuildNav(); for(const e of gEnemies){e.path=null;e.pathTimer=0;}
          if(a.pierce>0 && Math.random()<a.pierce){
            hitD=false; // arrow passes through
          } else {
            gPlayerArrows.splice(i,1); hitD=true; killed=true;
          }
          break;
        }
      }
      if(hitD)break;

      // ── Enemy hit ──────────────────────────────────────────────
      if(!a._hitEnemies) a._hitEnemies = new Set();
      let hitEnemy=false;
      for(const en of gEnemies){
        if(en.dead||a._hitEnemies.has(en))continue;
        if(Math.hypot(a.wx-en.wx,a.wy-en.wy)<en.r+5){
          const dmg = a.dmg || WeaponRegistry.bow.arrowDamage;
          en.hp-=dmg; en.hitFlash=14;
          spawnGP(en.wx,en.wy,'#ff4422',5,2.5);
          addGDmg(en.wx,en.wy-16,dmg,'#ffe066');
          gPlayHit();
          if(en.hp<=0){
            en.dead=true;
            if(gPlayer) gPlayer.kills=(gPlayer.kills||0)+1;
            document.getElementById('g-kills').textContent='Goblins: '+gPlayer.kills;
            spawnGP(en.wx,en.wy,'#cc2222',18,5);
          }
          if(a.pierce>0 && Math.random()<a.pierce){
            a._hitEnemies.add(en);
            hitEnemy=false;
          } else {
            gPlayerArrows.splice(i,1); killed=true; hitEnemy=true;
          }
          break;
        }
      }
      if(hitEnemy)break;
    }
  }
}


function gameLoad(mapData) {
  gMapW=mapData.width; gMapH=mapData.height;
  gTiles = tilesFromRows(mapData.rows, gMapW, gMapH);
  gEntsRaw = JSON.parse(JSON.stringify(mapData.entities || []));
  gDestructibles=[]; gEnemies=[]; gTorches=[]; gArrows=[]; gPlayerArrows=[]; gTraps=[]; gPotions=[];
  exitReached=false; gPaused=false;
  gParticles.length=0; gDmgNums.length=0;
  gShakeX=0;gShakeY=0;gShakeDur=0;camX=0;camY=0;

  const ps = gEntsRaw.find(e=>e.kind==='player') || {tx:3,ty:3};
  gPlayer = makePlayerState(ps.tx*T+T/2, ps.ty*T+T/2);
  gPlayer.startTX = ps.tx; gPlayer.startTY = ps.ty;

  gEntsRaw.forEach(e=>{
    if(e.kind==='goblin') gEnemies.push(makeGoblinEnt(e.tx,e.ty));
    if(e.kind==='archer') gEnemies.push(makeArcherEnt(e.tx,e.ty));
    if(e.kind==='warrior') gEnemies.push(makeWarriorEnt(e.tx,e.ty));
    if(e.kind==='barrel') gDestructibles.push({type:'barrel',wx:e.tx*T+T/2,wy:e.ty*T+T/2,hp:e._indestructible?999:1,maxHp:e._indestructible?999:1,broken:false,breakAnim:0,r:10,indestructible:!!e._indestructible});
    if(e.kind==='crate')  gDestructibles.push({type:'crate', wx:e.tx*T+T/2,wy:e.ty*T+T/2,hp:e._indestructible?999:1,maxHp:e._indestructible?999:1,broken:false,breakAnim:0,r:10,indestructible:!!e._indestructible});
    if(e.kind==='torch')  gTorches.push({tx:e.tx,ty:e.ty});
    if(e.kind==='fire-trap'||e.kind==='fire-n'||e.kind==='fire-s'||e.kind==='fire-e'||e.kind==='fire-w'){
      const dirMap={n:{dx:0,dy:-1},s:{dx:0,dy:1},e:{dx:1,dy:0},w:{dx:-1,dy:0}};
      const legacyDir={'fire-n':'n','fire-s':'s','fire-e':'e','fire-w':'w'};
      const dir=e.dir||(legacyDir[e.kind]||'e');
      const dv=dirMap[dir];
      const phase=e.phase||0; // 0 | 0.25 | 0.5 | 0.75
      // phaseOffset: how many frames into the global cycle this trap considers frame 0
      // e.g. phase 0.5 → offset = 21, so when gFrame=0 this trap acts as if it's frame 21
      const phaseOffset=phase*FIRE_PERIOD; // ms offset into global cycle
      gTraps.push({wx:e.tx*T+T/2,wy:e.ty*T+T/2,tx:e.tx,ty:e.ty,
        dx:dv.dx,dy:dv.dy,dir,phase,phaseOffset,
        on:false,activated:false,beams:[]});
    }
  });

  gRebuildNav();
  invInit();
  document.getElementById('g-area').textContent = mapData.name || 'DUNGEON';
  document.getElementById('g-death').classList.remove('show');
  document.getElementById('g-complete').classList.remove('show');
  document.getElementById('g-pause').style.display='none';
  document.getElementById('ghp').style.width='100%';
  document.getElementById('g-kills').textContent='Goblins: 0';
}

// ── SP respawn (internal) ────────────────────────────────────────
function _doRespawn() {
  if (!currentMapData) return;
  gameLoad(currentMapData);
  if (gPlayer) { gPlayer.charging=false; gPlayer.chargeTick=0; }
  if (gLoopId) cancelAnimationFrame(gLoopId);
  startGameLoop();
}

// ── MP: show mission failed screen on any player death ───────────
function mpShowDeath(isLocalDeath) {
  const sub = isLocalDeath
    ? 'Your party has been defeated...'
    : 'Your ally has fallen...';
  const el = document.getElementById('g-death-sub');
  if (el) el.textContent = sub;
  document.getElementById('g-death').classList.add('show');
  // Disable respawn button briefly to avoid double-fire
  const btn = document.getElementById('g-respawn-btn');
  if (btn) btn.disabled = false;
}

// ── Called by Respawn button ──────────────────────────────────────
function mpRespawn() {
  if (MP.active && MP.isHost) {
    // Host: signal all clients to respawn, then do it locally
    window._FB && window._FB.db
      .ref(`rooms/${MP.roomId}/signal`)
      .set({ type: 'respawn', ts: Date.now() });
    _doRespawn();
  } else if (MP.active && !MP.isHost) {
    // Client: request host to trigger respawn for everyone
    window._FB && window._FB.db
      .ref(`rooms/${MP.roomId}/signal`)
      .set({ type: 'respawn', ts: Date.now() });
    // Also do it locally immediately (host sync will follow)
    _doRespawn();
  } else {
    // Singleplayer
    _doRespawn();
  }
}

// ── Called by Leave button ────────────────────────────────────────
function mpLeaveAfterDeath() {
  goHub();
}

// ── §6.2  Input & combat ────────────────────────────────────────
let gPaused = false;

// ═══════════════════════════════════════════════════════════════
// §6  DUNGEON ENGINE
// ═══════════════════════════════════════════════════════════════

// ── §6.1  Player state ──────────────────────────────────────────
// All per-player mutable state lives here — one instance per player.
// gPlayer is the local player. MP.players[id] holds snapshots of
// remote players received over the network.
function makePlayerState(wx, wy) {
  return {
    // Position & physics
    wx, wy, r: 11, speed: 2.4,
    // Vitals
    hp: 100, maxHp: 100, iFrames: 0, dead: false, kills: 0,
    // Look
    angle: 0,
    // Sword swing
    swinging: false, swingTimer: 0, swingCooldown: 0,
    swingStartAngle: 0, swingEndAngle: 0,
    swingDir: 1, swingAimAngle: 0,
    _chargeDmg: null, hitRegistry: null,
    // Charge attack — per-player, not global
    charging: false, chargeTick: 0,
    // Input buffer — queued actions during swing/cooldown
    _pendingSwing:  false,  // quick click queued: fire normal swing when cooldown clears
    _pendingCharge: false,  // LMB held during cooldown: start charge when cooldown clears
    _pendingAngle:  0,      // aim angle captured at time of queued click
    // Whirlwind — per-player, not global
    wwTargeting: false, wwActive: null, wwCooldown: 0,
    // Smear visual — per-player, not global
    smear: null,
    // Screen freeze — per-player, not global
    freezeUntil: 0,
    // Movement animation
    moving: false, walkFrame: 0, walkTimer: 0, stepTimer: 0,
    // Equipment (future armour layers)
    equipment: { weapon:'sword', helmet:null, body:null, gloves:null, boots:null, cape:null, offhand:null },
  };
}

function gResume(){
  gPaused = false;
  document.getElementById('g-pause').style.display='none';
  gc.focus();
}

function isGameActive(){
  return document.getElementById('game').classList.contains('active');
}

gc.addEventListener('mousemove', e=>{
  const r=gc.getBoundingClientRect();
  gMouseX=(e.clientX-r.left)*(VW/r.width);
  gMouseY=(e.clientY-r.top)*(VH/r.height);
});

gc.addEventListener('mousedown', e=>{
  if(e.button!==0)return;
  gc.focus();
  if(gPaused||!gPlayer||gPlayer.dead||exitReached||inTown)return;
  if(gActiveWeapon==='bow'){
    bowStartCharge();
    return;
  }
  if(gPlayer.wwTargeting){gStartWhirlwind();}
  else if(!gPlayer.wwActive&&!gPlayer.swinging&&gPlayer.swingCooldown<=0){
    gPlayer.charging=true;gPlayer.chargeTick=0;
  } else if(!gPlayer.wwActive){
    // Busy (swinging or in cooldown) — buffer the charge intent
    gPlayer._pendingCharge=true;
    gPlayer._pendingAngle=gPlayer.angle;
  }
});
gc.addEventListener('mouseup', e=>{
  if(e.button!==0)return;
  if(gActiveWeapon==='bow'){
    bowRelease();
    return;
  }
  if(gPlayer&&gPlayer.charging&&!gPlayer.swinging&&gPlayer.swingCooldown<=0&&!gPlayer.wwActive){
    gReleaseCharge();
  } else if(gPlayer&&gPlayer._pendingCharge&&!gPlayer.charging){
    // Released before charge started — convert to buffered normal swing
    gPlayer._pendingSwing=true;
    gPlayer._pendingAngle=gPlayer.angle;
  }
  if(gPlayer){gPlayer.charging=false;gPlayer._pendingCharge=false;}
});

// Single document-level key handler — no canvas focus dependency
document.addEventListener('keydown', function(e){
  if(!isGameActive()) return;

  const key = e.key; // use raw e.key, not lowercased, for space check

  // Always handle pause toggle
  if(key === 'Escape'){
    e.preventDefault();
    // Close portal overlay if open
    if(portalOpen){ portalClose(); return; }
    // Close hub overlay if open
    const hub = document.getElementById('hub');
    if(hub && hub.classList.contains('active')){ hubClose(); return; }
    // Close inventory first if open
    const ov = document.getElementById('inv-overlay');
    if(ov && ov.classList.contains('show')){ invClose(); return; }
    // In The Sanctum — open menu overlay instead of pause screen
    if(inTown){ hubOpen(); return; }
    if(gPaused){ gResume(); }
    else {
      gPaused = true;
      if(gPlayer) gPlayer.wwTargeting = false;
      document.getElementById('g-pause').style.display='flex';
    }
    return;
  }

  if(gPaused) return;

  // Movement keys
  const k = key.toLowerCase();
  gKeys[k] = true;

  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(key)){
    e.preventDefault();
  }

  // Inventory toggle — only during active play
  if(k === 'i'){
    if(!gPlayer||gPlayer.dead||exitReached) return;
    invToggle();
    return;
  }

  // Portal interaction
  if(k === 'e'){
    if(inTown && portalNearby) { portalOpenOverlay(); return; }
    return;
  }

  // Quick-swap weapon
  if(k === 'q'){
    if(!gPlayer||gPlayer.dead||exitReached) return;
    invQuickSwap();
    return;
  }

  // Whirlwind / dodge roll on spacebar
  if(key === ' '){
    if(!gPlayer||gPlayer.dead||exitReached||inTown) return;
    if(gActiveWeapon === 'bow'){
      bowDodgeRoll();
      return;
    }
    if(gPlayer.wwActive) return;
    if(gPlayer.wwCooldown>0){ gPlayer.wwTargeting=false; return; }
    gPlayer.wwTargeting = !gPlayer.wwTargeting;
  }
});

document.addEventListener('keyup', function(e){
  if(!isGameActive()) return;
  gKeys[e.key.toLowerCase()] = false;
});

function gReleaseCharge(){
  // chargeRatio 0→1; damage scales 18 (uncharged) → 36 (full)
  const ratio=Math.min(1,gPlayer.chargeTick/W().chargeMax);
  const dmg=Math.round(W().baseDamage + W().baseDamage*ratio);
  gPlayer.charging=false;gPlayer.chargeTick=0;
  if(!gPlayer||gPlayer.swinging||gPlayer.swingCooldown>0)return;
  gPlayer.swinging=true;gPlayer.swingTimer=0;gPlayer.swingDir*=-1;
  gPlayer.swingAimAngle=gPlayer.angle;
  gPlayer.swingStartAngle=gPlayer.swingAimAngle-(W().swingArc/2)*gPlayer.swingDir;
  gPlayer.swingEndAngle=gPlayer.swingAimAngle+(W().swingArc/2)*gPlayer.swingDir;
  gPlayer.hitRegistry=new Set();
  gPlayer._chargeDmg=dmg; // store for gCheckHits
  gPlayer.smear={cx:gPlayer.wx,cy:gPlayer.wy,startAngle:gPlayer.swingStartAngle,
    sweepEnd:gPlayer.swingStartAngle,endAngle:gPlayer.swingEndAngle,
    innerR:W().smearInner,outerR:W().smearOuter,life:1,fading:false};
  // Bigger smear for full charge
  if(ratio>0.5){gPlayer.smear.outerR=W().smearOuter+Math.round((W().smearOuter*0.5)*((ratio-0.5)*2));}
  gPlaySwish();
}

function gDoSwing(){
  gDoSwingAt(gPlayer?gPlayer.angle:0);
}

// Fire a normal swing at a specific aim angle (used by input buffer to preserve click direction)
function gDoSwingAt(aimAngle){
  if(!gPlayer||gPlayer.swinging||gPlayer.swingCooldown>0)return;
  gPlayer.swinging=true;gPlayer.swingTimer=0;gPlayer.swingDir*=-1;
  gPlayer.swingAimAngle=aimAngle;
  gPlayer.swingStartAngle=gPlayer.swingAimAngle-(W().swingArc/2)*gPlayer.swingDir;
  gPlayer.swingEndAngle=gPlayer.swingAimAngle+(W().swingArc/2)*gPlayer.swingDir;
  gPlayer.hitRegistry=new Set();
  gPlayer.smear={cx:gPlayer.wx,cy:gPlayer.wy,startAngle:gPlayer.swingStartAngle,sweepEnd:gPlayer.swingStartAngle,endAngle:gPlayer.swingEndAngle,innerR:W().smearInner,outerR:W().smearOuter,life:1,fading:false};
  gPlaySwish();
}

function gCheckHits(p){
  p=p||gPlayer;
  if(!p.smear||!p.swinging||!p.hitRegistry)return;
  const smr=p.smear;
  let anyHit=false;
  // Collect hits to report to host (clients are non-authoritative on enemy hp)
  const pendingHits=[];
  for(const e of gEnemies){
    if(e.dead||p.hitRegistry.has(e))continue;
    if(!Number.isFinite(e.wx)||!Number.isFinite(e.wy))continue;
    const pts=[[e.wx,e.wy],[e.wx+e.r,e.wy],[e.wx-e.r,e.wy],[e.wx,e.wy+e.r],[e.wx,e.wy-e.r]];
    if(!pts.some(([ex,ey])=>pInArc(smr,ex,ey)))continue;
    p.hitRegistry.add(e);anyHit=true;
    const hitDmg=p._chargeDmg||W().baseDamage;
    const idx=gEnemies.indexOf(e);
    if(MP.active&&!MP.isHost){
      // Client: record hit for host, apply visuals only (hp/dead applied when host syncs back)
      pendingHits.push({idx,dmg:hitDmg});
      e.hitFlash=12; // visual feedback immediately
    } else {
      // Host or singleplayer: apply directly
      e.hp-=hitDmg;e.hitFlash=12;
      if(e.hp<=0){e.dead=true;p.kills++;spawnGP(e.wx,e.wy,'#cc2222',18,5);}
    }
    const kbA=Math.atan2(e.wy-p.wy,e.wx-p.wx);
    e.vx=Math.cos(kbA)*18;e.vy=Math.sin(kbA)*18;
    spawnGP(e.wx,e.wy,'#ff4444',8,3.5);addGDmg(e.wx,e.wy-16,hitDmg,'#fff');
    gShake(5,7);gPlayHit();
  }
  // Send hit report to host
  if(pendingHits.length) Net.sendHits(pendingHits);

  // Destructibles — host/SP applies directly; client reports to host via hits channel
  for(const d of gDestructibles){
    if(d.broken||p.hitRegistry.has(d))continue;
    const pts=[[d.wx,d.wy],[d.wx+d.r,d.wy],[d.wx-d.r,d.wy],[d.wx,d.wy+d.r],[d.wx,d.wy-d.r]];
    if(!pts.some(([ex,ey])=>pInArc(smr,ex,ey)))continue;
    p.hitRegistry.add(d); anyHit=true;
    if(MP.active&&!MP.isHost){
      // Client: send break report — host applies authoritatively and syncs to all
      const dIdx=gDestructibles.indexOf(d);
      Net.sendHits([{destructIdx:dIdx}]);
      // Apply visuals immediately for responsive feel
      d.hp--; if(d.hp<=0){d.broken=true;d.breakAnim=20;}
      gPlayWoodHit();spawnGP(d.wx,d.wy,'#c89050',5,2);
    } else {
      // Host or singleplayer: apply directly
      d.hp--;
      if(d.hp<=0){d.broken=true;d.breakAnim=20;gPlayWoodBreak();spawnGP(d.wx,d.wy,'#c89050',10,3);gMaybeDropPotion(d.wx,d.wy);mpSyncDestructibles();mpSyncPotions();gRebuildNav();for(const e of gEnemies){e.path=null;e.pathTimer=0;}}
      else{gPlayWoodHit();spawnGP(d.wx,d.wy,'#c89050',5,2);}
    }
  }
  if(anyHit&&p.freezeUntil===0)p.freezeUntil=performance.now()+40;
}

// Trace whirlwind dash endpoint — stops at first wall collision
function wwEndpoint(sx,sy,angle){
  const dx=Math.cos(angle),dy=Math.sin(angle);
  let dist=0;
  while(dist<W().wwRange){
    const step=Math.min(8,WW_RANGE-dist);
    const nx=sx+dx*(dist+step),ny=sy+dy*(dist+step);
    if(!gIsWalk(Math.floor(nx/T),Math.floor(ny/T)))break;
    dist+=step;
  }
  return{ex:sx+dx*dist,ey:sy+dy*dist,dist};
}

function gStartWhirlwind(){
  const p=gPlayer;
  if(!p||p.dead||p.wwCooldown>0||p.wwActive)return;
  p.wwTargeting=false;
  const ang=p.angle;
  const{ex,ey,dist}=wwEndpoint(p.wx,p.wy,ang);
  if(dist<8)return;
  p.wwActive={sx:p.wx,sy:p.wy,ex,ey,angle:ang,traveled:0,dist,hitSet:new Set(),spinAngle:0};
  p.swinging=false;p.smear=null;
  p.iFrames=999;
  gPlayWhirlwind();
}

function gUpdateWhirlwind(p,dt){
  p=p||gPlayer;
  const ww=p.wwActive;
  if(!ww)return;
  const step=Math.min(W().wwSpeed,ww.dist-ww.traveled);
  p.wx+=Math.cos(ww.angle)*step;
  p.wy+=Math.sin(ww.angle)*step;
  let[rx,ry]=gRC(p.wx,p.wy,p.r);
  [rx,ry]=gRCDestructibles(rx,ry,p.r);
  [rx,ry]=gRCTraps(rx,ry,p.r);
  p.wx=rx;p.wy=ry;
  ww.traveled+=step;
  ww.spinAngle+=0.18;
  for(const t of [...gEnemies,...gDestructibles]){
    if(ww.hitSet.has(t))continue;
    if(t.dead||t.broken)continue;
    const dd=Math.hypot(p.wx-t.wx,p.wy-t.wy);
    if(dd>W().wwRadius+t.r)continue;
    ww.hitSet.add(t);
    if(t.maxHp!==undefined&&t.attackCooldown!==undefined){
      const wwDmg=W().wwDamage;
      const tIdx=gEnemies.indexOf(t);
      if(MP.active&&!MP.isHost){
        // Client: report hit to host, apply visuals only
        if(tIdx>=0) Net.sendHits([{idx:tIdx,dmg:wwDmg}]);
        t.hitFlash=14;
      } else {
        t.hp-=wwDmg;t.hitFlash=14;
        if(t.hp<=0){t.dead=true;p.kills++;spawnGP(t.wx,t.wy,'#cc2222',20,5);}
      }
      const perpA=ww.angle+Math.PI/2*(Math.sign(Math.sin(Math.atan2(t.wy-p.wy,t.wx-p.wx)-ww.angle))||1);
      t.vx=Math.cos(perpA)*18;t.vy=Math.sin(perpA)*18;
      spawnGP(t.wx,t.wy,'#ff6622',10,4);addGDmg(t.wx,t.wy-16,wwDmg,'#ffcc44');
      gPlayHit();p.freezeUntil=performance.now()+40;
    } else {
      // Destructible hit by whirlwind
      if (MP.active && !MP.isHost) {
        // Client: report to host and apply visuals only
        const dIdx = gDestructibles.indexOf(t);
        if (dIdx >= 0) Net.sendHits([{destructIdx: dIdx}]);
        t.broken = true; t.breakAnim = 20;
        gPlayWoodBreak(); spawnGP(t.wx,t.wy,'#c89050',14,4);
      } else {
        // Host or singleplayer: apply directly
        t.hp=0;t.broken=true;t.breakAnim=20;gPlayWoodBreak();
        spawnGP(t.wx,t.wy,'#c89050',14,4);spawnGP(t.wx,t.wy,'#ffcc88',6,3);
        gMaybeDropPotion(t.wx,t.wy);mpSyncDestructibles();mpSyncPotions();
        gRebuildNav();for(const e of gEnemies){e.path=null;e.pathTimer=0;}
      }
      p.freezeUntil=performance.now()+40;
    }
  }
  spawnGP(p.wx+Math.cos(ww.spinAngle)*20,p.wy+Math.sin(ww.spinAngle)*20,'#aaccff',2,2.5);
  spawnGP(p.wx+Math.cos(ww.spinAngle+Math.PI)*20,p.wy+Math.sin(ww.spinAngle+Math.PI)*20,'#88aaff',2,2.5);
  if(ww.traveled>=ww.dist-0.5||!gIsWalk(Math.floor(p.wx/T),Math.floor(p.wy/T))){
    p.wwActive=null;p.wwCooldown=W().wwCooldown;p.iFrames=0;gShake(4,6);
  }
}

function gUpdatePlayer(dt=1){
  const p = gPlayer;
  if(!p||p.dead||exitReached||gPaused)return;
  p.iFrames=Math.max(0,p.iFrames-dt);
  p.swingCooldown=Math.max(0,p.swingCooldown-dt);
  if(p.wwCooldown>0)p.wwCooldown=Math.max(0,p.wwCooldown-dt);
  p.angle=Math.atan2(gMouseY-(p.wy-camY),gMouseX-(p.wx-camX));
  // ── Input buffer: consume pending actions once cooldown clears ──
  if(!p.swinging&&p.swingCooldown<=0&&!p.wwActive&&gActiveWeapon!=='bow'){
    if(p._pendingSwing){
      // Queued normal swing — fire immediately with the angle captured at click time
      p._pendingSwing=false;p._pendingCharge=false;
      gDoSwingAt(p._pendingAngle);
    } else if(p._pendingCharge){
      // LMB still held from before — start charging now
      p._pendingCharge=false;
      p.charging=true;p.chargeTick=0;
    }
  }
  // Whirlwind dash takes over movement for this frame
  if(p.wwActive){gUpdateWhirlwind(p,dt);camX=Math.max(0,Math.min(gMapW*T-VW,p.wx-VW/2));camY=Math.max(0,Math.min(gMapH*T-VH,p.wy-VH/2));return;}
  let dx=0,dy=0;
  if(gKeys['w']||gKeys['arrowup'])dy--;if(gKeys['s']||gKeys['arrowdown'])dy++;if(gKeys['a']||gKeys['arrowleft'])dx--;if(gKeys['d']||gKeys['arrowright'])dx++;
  p.moving=!!(dx||dy);if(p.moving){const l=Math.hypot(dx,dy);dx/=l;dy/=l;}
  if(gActiveWeapon==='bow') bowUpdate(p,dt);
  if(gActiveWeapon!=='bow'&&p.charging&&!p.swinging&&!p.wwActive){
    // Charge accumulates even during cooldown — swing fires when cooldown clears
    p.chargeTick=Math.min(W().chargeMax,p.chargeTick+dt);
  }
  const csm=(gActiveWeapon!=='bow'&&(p.charging||p.swinging))?0.4:1.0;
  p.wx+=dx*p.speed*csm*dt;p.wy+=dy*p.speed*csm*dt;
  let[rx,ry]=gRC(p.wx,p.wy,p.r);[rx,ry]=gRCDestructibles(rx,ry,p.r);[rx,ry]=gRCTraps(rx,ry,p.r);p.wx=rx;p.wy=ry;
  if(p.moving){p.walkTimer+=dt;if(p.walkTimer>=8){p.walkTimer=0;p.walkFrame=(p.walkFrame+1)%4;if(p.walkFrame===1||p.walkFrame===3)gPlayStep();}p.stepTimer+=dt;}else{p.walkFrame=0;p.walkTimer=0;}
  if(p.swinging){p.swingTimer+=dt;if(p.smear){p.smear.cx=p.wx;p.smear.cy=p.wy;p.smear.sweepEnd=p.swingStartAngle+(p.swingEndAngle-p.swingStartAngle)*easeSwing(p.swingTimer/W().swingDur);}gCheckHits(p);if(p.swingTimer>=W().swingDur){p.swinging=false;p.swingCooldown=W().swingCd;if(p.smear)p.smear.fading=true;p._chargeDmg=null;}}
  if(p.smear&&p.smear.fading){p.smear.life-=0.1*dt;if(p.smear.life<=0)p.smear=null;}
  // Per-player freeze (hit-stop) — only pauses THIS player's frame, not the whole loop
  if(p.freezeUntil>0&&performance.now()<p.freezeUntil){}
  else p.freezeUntil=0;
  camX=Math.max(0,Math.min(gMapW*T-VW,p.wx-VW/2));
  camY=Math.max(0,Math.min(gMapH*T-VH,p.wy-VH/2));
  const etx=Math.floor(p.wx/T),ety=Math.floor(p.wy/T);
  if(!exitReached&&(gTileAt(etx,ety)===TILE_EXIT||gTileAt(etx+1,ety)===TILE_EXIT||gTileAt(etx-1,ety)===TILE_EXIT||gTileAt(etx,ety+1)===TILE_EXIT)){
    exitReached=true;
    document.getElementById('gc-kills').textContent='GOBLINS SLAIN: '+gPlayer.kills;
    document.getElementById('g-complete').classList.add('show');
  }
}

// Returns the nearest alive player to world position (ex,ey).
function mpNearestTarget(ex, ey) {
  let best = gPlayer, bestD = gPlayer ? Math.hypot(ex-gPlayer.wx, ey-gPlayer.wy) : Infinity;
  if (MP.active) {
    for (const p of Object.values(MP.players)) {
      // p.wx==null means no position received yet; p.dead skips dead players
      if (p.wx == null || p.dead) continue;
      const d = Math.hypot(ex-p.wx, ey-p.wy);
      if (d < bestD) { bestD=d; best=p; }
    }
  }
  return best || gPlayer;
}

// Returns the nearest target for an enemy, caching the result for ~15 frames.
// Stagger updates by enemy index to avoid all enemies recalculating the same frame.
// ── §6.4  Fire traps ────────────────────────────────────────────
// Each trap alternates on/off every 0.7 s (42 frames at 60fps).
// When on, it casts a beam up to 7 tiles until a wall.
// Damage: EntityDefs.goblin.meleeDamage * 3 per frame while touching the beam.

const FIRE_RANGE   = 7;      // max tiles the beam travels
const FIRE_PERIOD  = 4000; // full on+off cycle in ms (4s) — wall clock, same on all peers
const FIRE_HALF    = 1000; // ms ON per cycle (1s fire, 3s rest)
const FIRE_DMG_VAL = EntityDefs.goblin.meleeDamage * 3; // damage per hit
const FIRE_IFRAMES = 60;  // 1 hit per second max — fire is dangerous but survivable

function gUpdateTraps(dt=1){
  const TRAP_ACTIVATE_DIST = 8 * T; // tiles to world px
  for(const trap of gTraps){
    // Check if any player is within activation range
    const nearestD = mpNearestTarget(trap.wx,trap.wy);
    const distToPlayer = nearestD ? Math.hypot(trap.wx-nearestD.wx, trap.wy-nearestD.wy) : Infinity;
    if(!trap.activated && distToPlayer <= TRAP_ACTIVATE_DIST) trap.activated=true;
    if(!trap.activated){ trap.beams=[]; continue; }

    // Derive on/off from global frame counter — all same-phase traps are always in sync
    trap.on = ((performance.now() + trap.phaseOffset) % FIRE_PERIOD) < FIRE_HALF;
    if(!trap.on){ trap.beams=[]; continue; }

    // Cast beam tile by tile until we hit a wall or reach max range
    trap.beams=[];
    for(let i=1;i<=FIRE_RANGE;i++){
      const btx=trap.tx+trap.dx*i, bty=trap.ty+trap.dy*i;
      if(!gIsWalk(btx,bty)) break; // wall — beam stops here
      const bwx=btx*T+T/2, bwy=bty*T+T/2;
      trap.beams.push({wx:bwx,wy:bwy,tx:btx,ty:bty});
    }

    // ── Beam vs gPlayer ──────────────────────────────────────
    if(gPlayer&&!gPlayer.dead&&gPlayer.iFrames<=0){
      for(const b of trap.beams){
        if(Math.hypot(gPlayer.wx-b.wx,gPlayer.wy-b.wy)<gPlayer.r+T*0.45){
          gPlayer.hp=Math.max(0,gPlayer.hp-FIRE_DMG_VAL);
          gPlayer.iFrames=FIRE_IFRAMES;
          gShake(6,9);
          spawnGP(gPlayer.wx,gPlayer.wy,'#ff6622',8,3);
          addGDmg(gPlayer.wx,gPlayer.wy-18,FIRE_DMG_VAL,'#ff8844');
          gPlayGrunt();
          if(gPlayer.hp<=0) gPlayer.dead=true;
          break;
        }
      }
    }

    // ── Beam vs enemies ──────────────────────────────────────
    for(const e of gEnemies){
      if(e.dead) continue;
      for(const b of trap.beams){
        if(Math.hypot(e.wx-b.wx,e.wy-b.wy)<e.r+T*0.45){
          e.hp-=FIRE_DMG_VAL; e.hitFlash=FIRE_IFRAMES;
          spawnGP(e.wx,e.wy,'#ff4422',6,2.5);
          if(e.hp<=0){ e.dead=true; spawnGP(e.wx,e.wy,'#cc2222',18,5); }
          break;
        }
      }
    }

    // ── Beam vs destructibles (host-only — synced to clients via mpSyncDestructibles) ──
    if (!MP.active || MP.isHost) {
      for(const d of gDestructibles){
        if(d.broken) continue;
        for(const b of trap.beams){
          if(Math.hypot(d.wx-b.wx,d.wy-b.wy)<d.r+T*0.45){
            d.hp=0; d.broken=true; d.breakAnim=20;
            gPlayWoodBreak();
            spawnGP(d.wx,d.wy,'#c89050',12,4);
            gMaybeDropPotion(d.wx,d.wy);mpSyncDestructibles();mpSyncPotions();gRebuildNav();
            break;
          }
        }
      }
    }
  }
}

function gDrawTraps(){
  const now=Date.now();
  for(const trap of gTraps){
    const sx=trap.wx-camX, sy=trap.wy-camY;
    if(sx<-T*2||sx>VW+T*2||sy<-T*2||sy>VH+T*2) continue;

    // ── Draw the stone base ───────────────────────────────────
    gctx.save();
    gctx.translate(sx,sy);
    gctx.fillStyle='#5a5060';
    gctx.fillRect(-9,-9,18,18);
    gctx.fillStyle='#3a3048';
    gctx.fillRect(-9,-9,18,3);
    gctx.fillRect(-9,6,18,3);
    gctx.fillRect(-9,-9,3,18);
    gctx.fillRect(6,-9,3,18);
    // Nozzle — a short protrusion in fire direction
    const nx=trap.dx*9, ny=trap.dy*9;
    gctx.fillStyle='#2a2038';
    gctx.fillRect(nx-3,ny-3,6,6);
    gctx.restore();

    // ── Draw the fire beam ────────────────────────────────────
    if(trap.on && trap.beams.length>0){
      const pulse = 0.7 + 0.3*Math.sin(now*0.018);
      for(let i=0;i<trap.beams.length;i++){
        const b=trap.beams[i];
        const bsx=b.wx-camX, bsy=b.wy-camY;
        const fade=1-(i/FIRE_RANGE)*0.5; // beam fades toward tip
        // Outer flame
        gctx.save();
        gctx.globalAlpha=0.55*fade*pulse;
        gctx.fillStyle='#ff4400';
        gctx.beginPath();
        if(trap.dx!==0){
          gctx.ellipse(bsx,bsy,T*0.6,T*0.35,0,0,Math.PI*2);
        }else{
          gctx.ellipse(bsx,bsy,T*0.35,T*0.6,0,0,Math.PI*2);
        }
        gctx.fill();
        // Inner bright core
        gctx.globalAlpha=0.8*fade*pulse;
        gctx.fillStyle='#ffcc44';
        gctx.beginPath();
        gctx.arc(bsx,bsy,T*0.18,0,Math.PI*2);
        gctx.fill();
        gctx.restore();
        // Occasional sparks
        if(Math.random()<0.15){
          spawnGP(b.wx+(Math.random()-.5)*T*.4, b.wy+(Math.random()-.5)*T*.4,
            Math.random()<0.5?'#ff6622':'#ffcc44', 1, 1.5);
        }
      }
    }

    // ── Idle glow when off — small ember ─────────────────────
    if(!trap.on){
      const glow=0.15+0.1*Math.sin(now*0.006);
      gctx.save();
      gctx.globalAlpha=glow;
      gctx.fillStyle='#ff4400';
      gctx.beginPath();
      gctx.arc(sx+nx*0.5,sy+ny*0.5,3,0,Math.PI*2);
      gctx.fill();
      gctx.restore();
    }
  }
}


// ── §6.3 Potions ─────────────────────────────────────────────────
const POTION_HEAL   = 0.5;   // fraction of maxHp restored
const POTION_RADIUS = 10;    // pickup radius px
const POTION_DROP   = 0.10;  // 10% drop chance

function gMaybeDropPotion(wx, wy) {
  if (Math.random() < POTION_DROP) {
    gPotions.push({wx, wy, pulse: Math.random() * Math.PI * 2});
  }
}

function gUpdatePotions(dt=1) {
  for (let i = gPotions.length - 1; i >= 0; i--) {
    const pot = gPotions[i];
    pot.pulse += 0.08;
    // Check local player
    if (gPlayer && !gPlayer.dead &&
        Math.hypot(gPlayer.wx - pot.wx, gPlayer.wy - pot.wy) < POTION_RADIUS + gPlayer.r) {
      const heal = Math.round(gPlayer.maxHp * POTION_HEAL);
      gPlayer.hp = Math.min(gPlayer.maxHp, gPlayer.hp + heal);
      addGDmg(gPlayer.wx, gPlayer.wy - 20, '+' + heal, '#ff6666');
      spawnGP(gPlayer.wx, gPlayer.wy, '#ff4444', 10, 2.5);
      gPotions.splice(i, 1);
      mpSyncPotions();
      continue;
    }
    // In MP, also check remote players (host removes potion; client sees it disappear next sync)
    if (MP.active && MP.isHost) {
      for (const p of Object.values(MP.players)) {
        if (p.wx == null || p.dead) continue;
        if (Math.hypot(p.wx - pot.wx, p.wy - pot.wy) < POTION_RADIUS + 11) {
          // Remote player picks it up — remove on host; client HP handled by sendInput packet
          gPotions.splice(i, 1);
          mpSyncPotions();
          break;
        }
      }
    }
  }
}

function gDrawPotions() {
  const now = Date.now();
  for (const pot of gPotions) {
    const sx = pot.wx - camX, sy = pot.wy - camY;
    if (sx < -20 || sx > VW + 20 || sy < -20 || sy > VH + 20) continue;
    const pulse = 0.75 + 0.25 * Math.sin(pot.pulse);
    gctx.save();
    gctx.translate(sx, sy);
    // Glow
    gctx.globalAlpha = 0.25 * pulse;
    gctx.fillStyle = '#ff3030';
    gctx.beginPath(); gctx.arc(0, 0, 11, 0, Math.PI * 2); gctx.fill();
    gctx.globalAlpha = 1;
    // Flask body
    gctx.fillStyle = '#8b1a1a';
    gctx.fillRect(-4, -1, 8, 7);
    gctx.fillStyle = '#e03030';
    gctx.fillRect(-3, 0, 6, 5);
    // Flask neck
    gctx.fillStyle = '#1a8040';
    gctx.fillRect(-2, -5, 4, 4);
    // Cork
    gctx.fillStyle = '#8b5c2a';
    gctx.fillRect(-2, -7, 4, 2);
    // Shine
    gctx.globalAlpha = 0.5;
    gctx.fillStyle = '#ffaaaa';
    gctx.fillRect(-2, 1, 2, 3);
    gctx.restore();
  }
}

function eNearestTarget(e, idx){
  e._tgtTimer--;
  if(e._tgtTimer<=0||!e._tgt||e._tgt.dead){
    e._tgt=mpNearestTarget(e.wx,e.wy);
    e._tgtTimer=12+((idx*7)%8); // 12-19 frames, staggered
    return e._tgt;
  }
  // Also refresh early if a remote player is now significantly closer than the cached target.
  // This ensures joining players activate enemies even while the cache is still warm.
  if(MP.active && Object.keys(MP.players).length > 0){
    const cachedD = Math.hypot(e.wx-e._tgt.wx, e.wy-e._tgt.wy);
    for(const p of Object.values(MP.players)){
      if(p.wx==null||p.dead) continue;
      if(Math.hypot(e.wx-p.wx,e.wy-p.wy) < cachedD - 48){ // 2 tiles closer = refresh
        e._tgt=mpNearestTarget(e.wx,e.wy);
        e._tgtTimer=12+((idx*7)%8);
        break;
      }
    }
  }
  return e._tgt;
}

// Returns true if any player (local or remote) is within `range` px of (ex,ey).
// Used for activation checks — bypasses the target cache so joining players
// activate enemies independently of who the enemy is currently chasing.
function eAnyPlayerNear(ex, ey, range) {
  if (gPlayer && !gPlayer.dead && Math.hypot(ex-gPlayer.wx, ey-gPlayer.wy) < range) return true;
  if (MP.active) {
    for (const p of Object.values(MP.players)) {
      if (p.wx==null || p.dead) continue;
      if (Math.hypot(ex-p.wx, ey-p.wy) < range) return true;
    }
  }
  return false;
}

function gUpdateEnemies(dt=1){
  if(gPaused)return;
  gRebuildNav();

  // Melee goblins
  for(let _gi=0;_gi<gEnemies.length;_gi++){
    const e=gEnemies[_gi];
    if(e.dead||e.isArcher||e.isWarrior)continue;
    e.hitFlash=Math.max(0,e.hitFlash-dt);e.attackCooldown=Math.max(0,e.attackCooldown-dt);e.vx*=Math.pow(.78,dt);e.vy*=Math.pow(.78,dt);
    const tgt=eNearestTarget(e,_gi);
    const d=Math.hypot(e.wx-tgt.wx,e.wy-tgt.wy);
    e.angle=Math.atan2(tgt.wy-e.wy,tgt.wx-e.wx);
    const STOP=(tgt.r||11)+e.r+14;
    if(eAnyPlayerNear(e.wx,e.wy,300)){
      e.activated=true;
      if(d>STOP){
        e.pathTimer--;
        if(e.pathTimer<=0||!e.path||e._pathTarget!==tgt){
          if(!Number.isFinite(tgt.wx)||!Number.isFinite(tgt.wy)){e.path=null;e.pathTimer=10;}
          else { e.path=gAstar(e.wx,e.wy,tgt.wx,tgt.wy);
          e.pathIdx=0;e.pathTimer=PATH_INT+Math.floor(Math.random()*15);e._pathTarget=tgt; }
        }
        let mx,my;
        if(e.path&&e.path.length>0){
          const wp=e.path[Math.min(e.pathIdx,e.path.length-1)];
          const wdx=wp.wx-e.wx,wdy=wp.wy-e.wy,wd=Math.hypot(wdx,wdy)||1;
          if(wd<T*.7&&e.pathIdx<e.path.length-1)e.pathIdx++;
          mx=wdx/wd;my=wdy/wd;
        }else{mx=Math.cos(e.angle);my=Math.sin(e.angle);}
        e.vx+=mx*e.speed;e.vy+=my*e.speed;
      }
    }else{
      e.path=null;e._pathTarget=null;
      if(e.activated){e.patrolTimer+=dt;if(e.patrolTimer>80){e.patrolAngle+=(Math.random()-.5)*1.2;e.patrolTimer=0;}e.vx+=Math.cos(e.patrolAngle)*.15*dt;e.vy+=Math.sin(e.patrolAngle)*.15*dt;}
    }
    if(Math.hypot(e.vx,e.vy)>.2){e.walkTimer++;if(e.walkTimer%10===0)e.walkFrame=(e.walkFrame+1)%4;}else{e.walkFrame=0;e.walkTimer=0;}
    // Melee hit — only damage local gPlayer; remote players handled client-side
    if(tgt===gPlayer&&d<=(gPlayer.r)+e.r+12&&e.attackCooldown<=0&&gPlayer.iFrames<=0&&!gPlayer.dead){
      gPlayer.hp=Math.max(0,gPlayer.hp-EntityDefs.goblin.meleeDamage);
      gPlayer.iFrames=50;e.attackCooldown=EntityDefs.goblin.meleeCooldown;
      gShake(5,8);spawnGP(gPlayer.wx,gPlayer.wy,'#e08040',5,2.5);
      addGDmg(gPlayer.wx,gPlayer.wy-18,EntityDefs.goblin.meleeDamage,'#e08855');
      gPlayGrunt();if(gPlayer.hp<=0)gPlayer.dead=true;
    }
    e.wx+=e.vx*dt;e.wy+=e.vy*dt;
    let[ex2,ey2]=gRC(e.wx,e.wy,e.r);[ex2,ey2]=gRCDestructibles(ex2,ey2,e.r);[ex2,ey2]=gRCTraps(ex2,ey2,e.r);e.wx=ex2;e.wy=ey2;
  }

  // Archer AI + arrow update
  gUpdateArrows();
  for(let _ai=0;_ai<gEnemies.length;_ai++){
    const e=gEnemies[_ai];
    if(e.dead||!e.isArcher)continue;
    e.hitFlash=Math.max(0,e.hitFlash-1);e.attackCooldown=Math.max(0,e.attackCooldown-1);e.vx*=.78;e.vy*=.78;
    const tgt=eNearestTarget(e,_ai);
    const d=Math.hypot(e.wx-tgt.wx,e.wy-tgt.wy);
    if(eAnyPlayerNear(e.wx,e.wy,EntityDefs.archer.arrowRange+20)){
      e.activated=true;
      // Only compute angle when in range — saves atan2 cost for distant archers
      e.angle=Math.atan2(tgt.wy-e.wy,tgt.wx-e.wx);
      // Retreat if player too close — but not if a wall blocks the retreat direction
      if(d<90){
        const rdx=-Math.cos(e.angle), rdy=-Math.sin(e.angle);
        const rtx=Math.floor((e.wx+rdx*T)/T), rty=Math.floor((e.wy+rdy*T)/T);
        if(gIsWalk(rtx,rty)){
          e.vx-=Math.cos(e.angle)*.7*dt;e.vy-=Math.sin(e.angle)*.7*dt;
        }
      }
      // Fire only when cooldown clear AND has line of sight
      if(e.attackCooldown<=0&&gLos(e.wx,e.wy,tgt.wx,tgt.wy)){
        const ang=e.angle+(Math.random()-.5)*0.12;
        const spd=EntityDefs.archer.arrowSpeed;
        gArrows.push({wx:e.wx,wy:e.wy,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,angle:ang,life:EntityDefs.archer.arrowLife});
        gPlayTwang();
        e.attackCooldown=EntityDefs.archer.attackCdMin+Math.floor(Math.random()*EntityDefs.archer.attackCdRange);
      }
    }else{
      // Out of range — patrol if already activated, otherwise stand still
      if(e.activated){e.patrolTimer++;if(e.patrolTimer>80){e.patrolAngle+=(Math.random()-.5)*1.2;e.patrolTimer=0;}e.vx+=Math.cos(e.patrolAngle)*.15;e.vy+=Math.sin(e.patrolAngle)*.15;}
    }
    e.wx+=e.vx;e.wy+=e.vy;
    let[ex2,ey2]=gRC(e.wx,e.wy,e.r);[ex2,ey2]=gRCDestructibles(ex2,ey2,e.r);[ex2,ey2]=gRCTraps(ex2,ey2,e.r);e.wx=ex2;e.wy=ey2;
  }


  // ── Goblin Warrior AI ──────────────────────────────────────────
  for(let _wi=0;_wi<gEnemies.length;_wi++){
    const e=gEnemies[_wi];
    if(e.dead||!e.isWarrior)continue;
    const d=EntityDefs.warrior;

    // Timers — mirror goblin pattern exactly
    e.hitFlash=Math.max(0,e.hitFlash-dt);
    e.attackCooldown=Math.max(0,e.attackCooldown-dt);
    // Friction — same as goblin (.78 per frame)
    e.vx*=Math.pow(.78,dt);e.vy*=Math.pow(.78,dt);

    const tgt=eNearestTarget(e,_wi);
    const dist=Math.hypot(e.wx-tgt.wx,e.wy-tgt.wy);
    const inRange=eAnyPlayerNear(e.wx,e.wy,d.activationRange);
    if(inRange) e.activated=true;
    e.angle=Math.atan2(tgt.wy-e.wy,tgt.wx-e.wx);

    // ── Charging: move directly (no vx/vy) ───────────────────────
    if(e.phase==='charging'){
      const step=Math.min(d.chargeSpeed*dt, d.chargeRange-e.chargeTraveled);
      const nx=e.wx+Math.cos(e.chargeAngle)*step;
      const ny=e.wy+Math.sin(e.chargeAngle)*step;
      const ntx=Math.floor(nx/T),nty=Math.floor(ny/T);
      const hitWall=!gIsWalk(ntx,nty);
      if(!hitWall){e.wx=nx;e.wy=ny;}
      e.chargeTraveled+=step;
      // Hit player during charge
      if(Math.hypot(tgt.wx-e.wx,tgt.wy-e.wy)<(tgt.r||11)+e.r+6){
        if(tgt===gPlayer&&gPlayer.iFrames<=0){
          gPlayer.hp=Math.max(0,gPlayer.hp-d.chargeDamage);
          gPlayer.iFrames=60;gShake(8,12);
          spawnGP(gPlayer.wx,gPlayer.wy,'#cc3333',10,4);
          addGDmg(gPlayer.wx,gPlayer.wy-18,d.chargeDamage,'#ff4444');
          gPlayGrunt();if(gPlayer.hp<=0)gPlayer.dead=true;
        }
        e.phase='recovering';e.phaseTimer=d.recoverTime;
      } else if(hitWall||e.chargeTraveled>=d.chargeRange){
        e.phase='recovering';e.phaseTimer=d.recoverTime;
      }
    }
    // ── Windup phases: stand still ────────────────────────────────
    else if(e.phase==='swing-windup'){
      e.phaseTimer-=dt;
      if(e.phaseTimer<=0){
        // Execute swing
        const half=d.swingArc/2;
        if(!tgt.dead&&tgt.iFrames<=0){
          const dd=Math.hypot(tgt.wx-e.wx,tgt.wy-e.wy);
          if(dd<=d.swingRange){
            const ang=Math.atan2(tgt.wy-e.wy,tgt.wx-e.wx);
            let diff=ang-e.angle;
            while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
            if(Math.abs(diff)<=half&&tgt===gPlayer){
              gPlayer.hp=Math.max(0,gPlayer.hp-d.swingDamage);
              gPlayer.iFrames=45;gShake(5,8);
              spawnGP(gPlayer.wx,gPlayer.wy,'#cc3333',6,3);
              addGDmg(gPlayer.wx,gPlayer.wy-18,d.swingDamage,'#ff6666');
              gPlayGrunt();if(gPlayer.hp<=0)gPlayer.dead=true;
            }
          }
        }
        e.phase='idle';
        e.attackCooldown=d.attackCdMin+Math.floor(Math.random()*d.attackCdRange);
      }
    }
    else if(e.phase==='charge-windup'){
      e.phaseTimer-=dt;
      if(e.phaseTimer<=0){
        e.phase='charging';e.chargeTraveled=0;
        // Lock charge angle at moment windup completes
        e.chargeAngle=e.angle;
      }
    }
    else if(e.phase==='recovering'){
      e.phaseTimer-=dt;
      if(e.phaseTimer<=0){
        e.phase='idle';
        e.attackCooldown=d.attackCdMin+Math.floor(Math.random()*d.attackCdRange);
      }
    }
    // ── Idle: path toward player, same as goblin ──────────────────
    else {
      // e.phase==='idle'
      if(e.activated&&inRange){
        const STOP=(tgt.r||11)+e.r+14;
        if(dist>STOP){
          e.pathTimer-=dt;
          if(e.pathTimer<=0||!e.path||e._pathTarget!==tgt){
            if(!Number.isFinite(tgt.wx)||!Number.isFinite(tgt.wy)){e.path=null;e.pathTimer=10;}
            else{e.path=gAstar(e.wx,e.wy,tgt.wx,tgt.wy);e.pathIdx=0;e.pathTimer=PATH_INT+Math.floor(Math.random()*15);e._pathTarget=tgt;}
          }
          let mx=Math.cos(e.angle),my=Math.sin(e.angle);
          if(e.path&&e.path.length>0){
            const wp=e.path[Math.min(e.pathIdx,e.path.length-1)];
            const wdx=wp.wx-e.wx,wdy=wp.wy-e.wy,wd=Math.hypot(wdx,wdy)||1;
            if(wd<T*.7&&e.pathIdx<e.path.length-1)e.pathIdx++;
            mx=wdx/wd;my=wdy/wd;
          }
          e.vx+=mx*e.speed;e.vy+=my*e.speed;
        }
        // Choose attack
        if(e.attackCooldown<=0&&dist<d.activationRange){
          if(dist>d.chargeDist){
            e.phase='charge-windup';e.phaseTimer=d.chargeWindup;e.chargeAngle=e.angle;
          } else {
            e.phase='swing-windup';e.phaseTimer=d.swingWindup;
          }
        }
      } else if(e.activated){
        e.patrolTimer+=dt;if(e.patrolTimer>80){e.patrolAngle+=(Math.random()-.5)*1.2;e.patrolTimer=0;}
        e.vx+=Math.cos(e.patrolAngle)*.15*dt;e.vy+=Math.sin(e.patrolAngle)*.15*dt;
      }
    }

    // Walk anim — same as goblin
    if(Math.hypot(e.vx,e.vy)>.2){e.walkTimer++;if(e.walkTimer%10===0)e.walkFrame=(e.walkFrame+1)%4;}
    else{e.walkFrame=0;e.walkTimer=0;}

    // Apply vx/vy (not used during charge — warrior moves directly then)
    if(e.phase!=='charging'){
      e.wx+=e.vx*dt;e.wy+=e.vy*dt;
    }
    let[ex3,ey3]=gRC(e.wx,e.wy,e.r);[ex3,ey3]=gRCDestructibles(ex3,ey3,e.r);[ex3,ey3]=gRCTraps(ex3,ey3,e.r);
    e.wx=ex3;e.wy=ey3;
  }
  // Separate enemies from local player and each other
  for(const e of gEnemies){if(e.dead)continue;const s=gSep(e.wx,e.wy,e.r,gPlayer.wx,gPlayer.wy,gPlayer.r);if(s){e.wx+=s.x;e.wy+=s.y;}}
  for(let i=0;i<gEnemies.length;i++)for(let j=i+1;j<gEnemies.length;j++){const a=gEnemies[i],b=gEnemies[j];if(a.dead||b.dead)continue;const s=gSep(a.wx,a.wy,a.r,b.wx,b.wy,b.r);if(s){a.wx+=s.x;a.wy+=s.y;b.wx-=s.x;b.wy-=s.y;}}
}
function bobY(wf,mv){if(!mv)return 0;return[0,-2,0,2][wf];}

function gDrawTile(sx,sy,sz,tid,tx,ty){
  if(tid===TILE_VOID){gctx.fillStyle='#060408';gctx.fillRect(sx,sy,sz,sz);return;}
  if(tid===TILE_WALL){const fB=gIsWalk(tx,ty+1),fA=gIsWalk(tx,ty-1),fL=gIsWalk(tx-1,ty),fR=gIsWalk(tx+1,ty);const v=gWallVar[ty*120+tx]%4;if(!fB&&!fA&&!fL&&!fR)gctx.fillStyle='#080610';else if(fB)gctx.fillStyle=['#3a3040','#352b3a','#403545','#383040'][v];else gctx.fillStyle=['#3a3040','#352b3a','#403545','#383040'][v];gctx.fillRect(sx,sy,sz,sz);if(fB||fL||fR){gctx.fillStyle='rgba(0,0,0,.28)';if(v===0)gctx.fillRect(sx+4,sy+6,2,8);if(v===1)gctx.fillRect(sx+14,sy+4,3,6);if(v===2)gctx.fillRect(sx+8,sy+10,2,5);if(v===3){gctx.fillRect(sx+6,sy+5,1,4);gctx.fillRect(sx+16,sy+8,1,3);}if(fB){gctx.fillStyle='rgba(255,220,160,.06)';gctx.fillRect(sx,sy+sz-3,sz,3);}}return;}
  if(tid===TILE_FLOOR){const v=gWallVar[ty*120+tx]%4;gctx.fillStyle=['#1a1825','#1c1a28','#181622','#1b1926'][v];gctx.fillRect(sx,sy,sz,sz);return;}
  if(tid===TILE_EXIT){gctx.fillStyle='#0d0510';gctx.fillRect(sx,sy,sz,sz);const pulse=.3+.15*Math.sin(Date.now()*.003);gctx.fillStyle=`rgba(150,80,220,${pulse})`;gctx.fillRect(sx+4,sy+4,sz-8,sz-8);gctx.fillStyle=`rgba(210,130,255,${pulse*.5})`;gctx.fillRect(sx+8,sy+8,sz-16,sz-16);}
}

function gDrawTorches(){
  for(const t of gTorches){
    const sx=t.tx*T+T/2-camX, sy=t.ty*T-camY;
    if(sx<-50||sx>VW+50||sy<-50||sy>VH+50)continue;
    const fl=.7+.3*Math.sin(gFrame*.08+t.tx*2.3),fl2=.6+.4*Math.sin(gFrame*.13+t.ty*1.7);
    const grd=gctx.createRadialGradient(sx,sy,0,sx,sy,38*fl);grd.addColorStop(0,`rgba(255,180,60,${.18*fl})`);grd.addColorStop(1,'rgba(255,120,20,0)');gctx.fillStyle=grd;gctx.beginPath();gctx.arc(sx,sy,38*fl,0,Math.PI*2);gctx.fill();
    gctx.fillStyle='#6a4a2a';gctx.fillRect(sx-2,sy-2,4,8);
    gctx.fillStyle=`rgba(255,200,60,${fl})`;gctx.beginPath();gctx.ellipse(sx,sy-4,3,5,0,0,Math.PI*2);gctx.fill();
    gctx.fillStyle=`rgba(255,120,20,${fl2})`;gctx.beginPath();gctx.ellipse(sx+1,sy-5,2,3,0,0,Math.PI*2);gctx.fill();
    gctx.fillStyle='rgba(255,255,200,.8)';gctx.beginPath();gctx.arc(sx,sy-5,1,0,Math.PI*2);gctx.fill();
  }
}

function gDrawSmear(){const smear=gPlayer&&gPlayer.smear;if(!smear)return;const sx=smear.cx-camX,sy=smear.cy-camY;if(Math.abs(smear.sweepEnd-smear.startAngle)<.01)return;const{startAngle,sweepEnd,innerR,outerR,life}=smear;if(!Number.isFinite(outerR)||outerR<=0||!Number.isFinite(innerR))return;const ccw=sweepEnd<startAngle,a=life;gctx.save();gctx.lineCap='round';gctx.globalAlpha=a*.2;gctx.fillStyle='#bbddff';gctx.beginPath();gctx.moveTo(sx,sy);gctx.arc(sx,sy,outerR,startAngle,sweepEnd,ccw);gctx.closePath();gctx.fill();gctx.globalAlpha=a*.28;gctx.strokeStyle='#88bbff';gctx.lineWidth=12;gctx.beginPath();gctx.arc(sx,sy,outerR+4,startAngle,sweepEnd,ccw);gctx.stroke();gctx.globalAlpha=a*.82;gctx.strokeStyle='#ddeeff';gctx.lineWidth=2;gctx.beginPath();gctx.arc(sx,sy,outerR,startAngle,sweepEnd,ccw);gctx.stroke();if(!smear.fading){gctx.globalAlpha=a*.9;gctx.strokeStyle='#fff';gctx.lineWidth=2;gctx.beginPath();gctx.moveTo(sx+Math.cos(sweepEnd)*innerR,sy+Math.sin(sweepEnd)*innerR);gctx.lineTo(sx+Math.cos(sweepEnd)*outerR,sy+Math.sin(sweepEnd)*outerR);gctx.stroke();}gctx.globalAlpha=1;gctx.restore();}

function gDrawSprite(spr,wx,wy,scale,flash,by,flashCol){by=by||0;flashCol=flashCol||'255,255,255';const sx=wx-camX,sy=wy-camY;gctx.save();gctx.translate(sx,sy+by);const hw=scale/2;gctx.drawImage(spr,-hw,-hw,scale,scale);if(flash){gctx.globalCompositeOperation='source-atop';gctx.fillStyle=`rgba(${flashCol},${flash})`;gctx.fillRect(-hw,-hw,scale,scale);gctx.globalCompositeOperation='source-over';}gctx.restore();}

// Draw the player's bow — held at the side, pointed toward aim angle.
// px,py = world-space attachment point; ang = aim angle; chargeRatio 0→1
function gDrawBow(px, py, ang, chargeRatio) {
  const sc = SSCALE * 0.9;
  gctx.save();
  gctx.translate(px, py);
  gctx.rotate(ang);

  // Bowstring — pulls back with charge
  const pull = chargeRatio * sc * 3.5;

  // Stave (curved arc — drawn as a thick rotated ellipse)
  gctx.strokeStyle = '#8b5c2a';
  gctx.lineWidth   = sc * 1.1;
  gctx.lineCap     = 'round';
  gctx.beginPath();
  gctx.arc(sc * 3.5, 0, sc * 5, -Math.PI * 0.45, Math.PI * 0.45);
  gctx.stroke();

  // Bowstring
  gctx.strokeStyle = chargeRatio > 0 ? '#ffe080' : '#c0b040';
  gctx.lineWidth   = sc * 0.6;
  const tipY = Math.sin(0.45) * sc * 5;
  const tipX = Math.cos(0.45) * sc * 5 + sc * 3.5;
  // Two lines from tips to draw point
  gctx.beginPath();
  gctx.moveTo(tipX,  tipY);
  gctx.lineTo(tipX - pull, 0);
  gctx.lineTo(tipX, -tipY);
  gctx.stroke();

  // Arrow on string when charging
  if (chargeRatio > 0.05) {
    const arrowLen = sc * 8;
    const notchX   = tipX - pull;
    gctx.strokeStyle = '#c8a030';
    gctx.lineWidth   = sc * 0.8;
    gctx.beginPath();
    gctx.moveTo(notchX, 0);
    gctx.lineTo(notchX + arrowLen, 0);
    gctx.stroke();
    // Tip
    gctx.fillStyle = '#c0c0a0';
    gctx.beginPath();
    gctx.moveTo(notchX + arrowLen, 0);
    gctx.lineTo(notchX + arrowLen - sc, -sc * 0.8);
    gctx.lineTo(notchX + arrowLen + sc * 1.2, 0);
    gctx.lineTo(notchX + arrowLen - sc,  sc * 0.8);
    gctx.closePath();
    gctx.fill();
    // Fletching
    gctx.fillStyle = '#8b3a1a';
    gctx.beginPath();
    gctx.moveTo(notchX, 0);
    gctx.lineTo(notchX + sc, -sc);
    gctx.lineTo(notchX + sc * 0.8, 0);
    gctx.closePath();
    gctx.fill();
    gctx.beginPath();
    gctx.moveTo(notchX, 0);
    gctx.lineTo(notchX + sc,  sc);
    gctx.lineTo(notchX + sc * 0.8, 0);
    gctx.closePath();
    gctx.fill();
  }

  gctx.restore();
}

function gGetSword(prog,p){
  p=p||gPlayer;const by=bobY(p.walkFrame,p.moving),scx=p.wx-camX,scy=p.wy-camY;let sa,px,py;
  if(p.swinging){const e=easeSwing(prog);sa=p.swingStartAngle+(p.swingEndAngle-p.swingStartAngle)*e;const pa=p.swingAimAngle+Math.PI/2*p.swingDir;px=scx+Math.cos(pa)*(PSCALE*.28);py=scy+Math.sin(pa)*(PSCALE*.28)+by;}
  else{sa=p.angle+Math.PI+.4*(-p.swingDir);const pa=p.angle+Math.PI/2*(-p.swingDir);px=scx+Math.cos(pa)*(PSCALE*.28);py=scy+Math.sin(pa)*(PSCALE*.28)+by;}
  return{px,py,sa};
}

// Draw any player (local or remote) — single unified function.
// tint: optional colour string e.g. '#ff6060' for remote players; null for local.
function drawAnyPlayer(p, tint){
  if(!p||p.dead)return;
  if(p===gPlayer&&p.iFrames>0&&Math.floor(p.iFrames/8)%2===0)return;
  const sx=p.wx-camX, sy=p.wy-camY;
  if(sx<-60||sx>VW+60||sy<-60||sy>VH+60)return;
  const by=bobY(p.walkFrame,p.moving);
  // Shadow
  gctx.save();gctx.globalAlpha=.2;gctx.fillStyle='#000';
  gctx.beginPath();gctx.ellipse(sx,sy+PSCALE*.44,PSCALE*.3,PSCALE*.1,0,0,Math.PI*2);gctx.fill();gctx.restore();
  // Sword behind
  const prog=p.swinging?(p.swingTimer||0)/W().swingDur:0;
  const{px:spx,py:spy,sa}=gGetSword(prog,p);
  // Draw weapon — bow or sword depending on equipment
  const _isBow = (p===gPlayer) ? gActiveWeapon==='bow' : p._activeWeapon==='bow';
  if(_isBow){
    // Bow held at side, aimed at player angle, charge shown if local
    const chargeRatio = (p===gPlayer) ? Math.min(1,(p.bowChargeTick||0)/WeaponRegistry.bow.chargeMax) : 0;
    const by2=bobY(p.walkFrame,p.moving);
    const bowPa=p.angle+Math.PI*.5*(-p.swingDir||1);
    const bowPx=(p.wx-camX)+Math.cos(bowPa)*(PSCALE*.22);
    const bowPy=(p.wy-camY)+Math.sin(bowPa)*(PSCALE*.22)+by2;
    gDrawBow(bowPx,bowPy,p.angle,chargeRatio);
  } else if(!p.swinging){
    gDrawSword(spx,spy,sa,.9,false);
  }
  // Sprite
  const pFlash=(!tint&&p.iFrames>0)?Math.min(0.7,p.iFrames/50*0.7):0;
  // Use custom sprite if available (local = SpriteRegistry, remote = _spriteCanvas)
  const _spr = tint ? (p._spriteCanvas || SpriteRegistry.get('player').canvas || playerSpr)
                     : (SpriteRegistry.get('player').canvas || playerSpr);
  gDrawSprite(_spr,p.wx,p.wy,PSCALE,pFlash,by,'220,60,60');
  // Colour tint overlay for remote players (drawn on top of their custom sprite)
  if(tint){
    gctx.save();gctx.translate(sx,sy);
    const hw=PSCALE/2;
    gctx.drawImage(_spr,-hw,-hw,PSCALE,PSCALE);
    gctx.globalCompositeOperation='source-atop';
    gctx.fillStyle=tint+'44';gctx.fillRect(-hw,-hw,PSCALE,PSCALE);
    gctx.restore();
  }
  // Sword in front when swinging
  if(!_isBow&&p.swinging)gDrawSword(spx,spy,sa,1,true);
  // Smear for remote players
  if(p!==gPlayer&&p.smear){
    const sm=p.smear;
    if(Math.abs(sm.sweepEnd-sm.startAngle)>.01){
      const ssx=sm.cx-camX,ssy=sm.cy-camY,ccw=sm.sweepEnd<sm.startAngle,a=sm.life;
      gctx.save();gctx.lineCap='round';
      gctx.globalAlpha=a*.2;gctx.fillStyle='#bbddff';
      gctx.beginPath();gctx.moveTo(ssx,ssy);gctx.arc(ssx,ssy,sm.outerR,sm.startAngle,sm.sweepEnd,ccw);gctx.closePath();gctx.fill();
      gctx.globalAlpha=a*.7;gctx.strokeStyle='#88bbff';gctx.lineWidth=8;
      gctx.beginPath();gctx.arc(ssx,ssy,sm.outerR,sm.startAngle,sm.sweepEnd,ccw);gctx.stroke();
      gctx.restore();
    }
  }
  // WW spinning sword — visible to everyone (remote uses _wwSpinAngle)
  if(p.wwActive){
    const spinAng = (p===gPlayer) ? p.wwActive.spinAngle : (p._wwSpinAngle||0);
    gctx.save();gctx.globalAlpha=0.6;
    gctx.strokeStyle='#aaddff';gctx.lineWidth=2;
    gctx.beginPath();gctx.arc(sx,sy,W().wwRadius,0,Math.PI*2);gctx.stroke();
    for(let i=0;i<3;i++){
      const a=spinAng+i*(Math.PI*2/3);
      const sx3=sx+Math.cos(a)*20, sy3=sy+Math.sin(a)*20;
      gctx.globalAlpha=0.5;
      gDrawSword(sx3,sy3,a+Math.PI/2,0.55,false);
    }
    gctx.restore();
    // Trail particles for remote WW (local WW trail spawned in gUpdateWhirlwind)
    if(p!==gPlayer){
      spawnGP(p.wx+Math.cos(spinAng)*20,   p.wy+Math.sin(spinAng)*20,   '#aaccff',1,2);
      spawnGP(p.wx+Math.cos(spinAng+Math.PI)*20, p.wy+Math.sin(spinAng+Math.PI)*20, '#88aaff',1,2);
    }
  }
  // Remote player label + HP bar
  if(tint){
    gctx.save();gctx.font='7px monospace';gctx.textAlign='center';
    gctx.fillStyle=tint;gctx.globalAlpha=0.9;
    const label=p._mpLabel||'P?';
    gctx.fillText(label,sx,sy-PSCALE*.65);
    if(p.hp!=null){
      const bw=PSCALE,bh=3,bx2=sx-bw/2,by2=sy-PSCALE*.65-6;
      gctx.globalAlpha=.7;gctx.fillStyle='#2a1010';gctx.fillRect(bx2,by2,bw,bh);
      gctx.fillStyle=tint;gctx.fillRect(bx2,by2,bw*(Math.max(0,p.hp)/100),bh);
    }
    gctx.restore();
  }
}
function gDrawPlayer(){drawAnyPlayer(gPlayer,null);}


function gDrawWarrior(e){
  if(e.dead)return;
  const sx=e.wx-camX,sy=e.wy-camY;
  if(sx<-40||sx>VW+40||sy<-40||sy>VH+40)return;
  const d=EntityDefs.warrior;
  const by=bobY(e.walkFrame,Math.hypot(e.vx,e.vy)>.2);
  const flash=e.hitFlash>0?Math.min(1,e.hitFlash/8):0;

  // ── Attack indicators (drawn under sprite) ──────────────────────
  if(e.phase==='swing-windup'){
    const ratio=1-(e.phaseTimer/d.swingWindup);
    const half=d.swingArc/2;
    gctx.save();
    gctx.translate(sx,sy);
    gctx.rotate(e.angle);
    // Clip to the full cone shape so fill never escapes it
    gctx.beginPath();gctx.moveTo(0,0);
    gctx.arc(0,0,d.swingRange,-half,half);
    gctx.closePath();gctx.clip();
    // Background cone — faint outline of full cone
    gctx.globalAlpha=0.08;
    gctx.fillStyle='#ff2222';
    gctx.beginPath();gctx.moveTo(0,0);
    gctx.arc(0,0,d.swingRange,-half,half);
    gctx.closePath();gctx.fill();
    // Fill cone progressively from tip outward: radius grows with ratio
    gctx.globalAlpha=0.18+ratio*0.32;
    gctx.fillStyle='#ff3333';
    gctx.beginPath();gctx.moveTo(0,0);
    gctx.arc(0,0,d.swingRange*ratio,-half,half);
    gctx.closePath();gctx.fill();
    // Bright leading edge arc at current fill radius
    gctx.globalAlpha=0.7+ratio*0.3;
    gctx.strokeStyle='#ff6666';gctx.lineWidth=1.5;
    gctx.beginPath();
    gctx.arc(0,0,d.swingRange*ratio,-half,half);
    gctx.stroke();
    gctx.restore();
  }
  else if(e.phase==='charge-windup'){
    const ratio=1-(e.phaseTimer/d.chargeWindup);
    const len=d.chargeRange*ratio;
    const arrowW=10;
    gctx.save();
    gctx.translate(sx,sy);
    gctx.rotate(e.chargeAngle);
    // Arrow body
    gctx.globalAlpha=0.15+ratio*0.3;
    gctx.fillStyle='#ff4400';
    gctx.fillRect(0,-arrowW/2,len,arrowW);
    // Arrow head
    gctx.globalAlpha=0.4+ratio*0.45;
    gctx.fillStyle='#ff6622';
    gctx.beginPath();
    gctx.moveTo(len+16,0);
    gctx.lineTo(len-4,-arrowW);
    gctx.lineTo(len-4,arrowW);
    gctx.closePath();gctx.fill();
    // Pulsing edge
    gctx.strokeStyle='#ff4400';gctx.lineWidth=1.5;
    gctx.globalAlpha=0.6+ratio*0.3;
    gctx.beginPath();gctx.moveTo(0,0);gctx.lineTo(len,0);gctx.stroke();
    gctx.restore();
  }
  else if(e.phase==='charging'){
    // Motion trail during charge
    gctx.save();
    gctx.globalAlpha=0.35;
    gctx.fillStyle='#ff4400';
    gctx.beginPath();gctx.arc(sx,sy,e.r*1.4,0,Math.PI*2);gctx.fill();
    gctx.restore();
  }

  // ── Shadow ──────────────────────────────────────────────────────
  gctx.save();gctx.globalAlpha=.2;gctx.fillStyle='#000';
  gctx.beginPath();gctx.ellipse(sx,sy+PSCALE*.44,PSCALE*.35,PSCALE*.12,0,0,Math.PI*2);gctx.fill();gctx.restore();

  // ── Sprite ──────────────────────────────────────────────────────
  gDrawSprite(SpriteRegistry.get('warrior').canvas||warriorSpr,e.wx,e.wy,PSCALE*1.1,flash,by,'200,50,50');

  // ── HP bar ──────────────────────────────────────────────────────
  const bw=PSCALE*1.1;
  gctx.fillStyle='#2a1010';gctx.fillRect(sx-bw/2,sy-PSCALE*.65,bw,4);
  gctx.fillStyle='#e03333';gctx.fillRect(sx-bw/2,sy-PSCALE*.65,bw*(e.hp/e.maxHp),4);
}
function gDrawEnemy(e){if(e.dead)return;const sx=e.wx-camX,sy=e.wy-camY;if(sx<-30||sx>VW+30||sy<-30||sy>VH+30)return;const by=bobY(e.walkFrame,Math.hypot(e.vx,e.vy)>.2);const flash=e.hitFlash>0?Math.min(1,e.hitFlash/8):0;gctx.save();gctx.globalAlpha=.2;gctx.fillStyle='#000';gctx.beginPath();gctx.ellipse(sx,sy+PSCALE*.44,PSCALE*.3,PSCALE*.1,0,0,Math.PI*2);gctx.fill();gctx.restore();gDrawSprite(SpriteRegistry.get(e.defId||'goblin').canvas||goblinSpr,e.wx,e.wy,PSCALE,flash,by);const bw=PSCALE;gctx.fillStyle='#2a1010';gctx.fillRect(sx-bw/2,sy-PSCALE*.6,bw,4);gctx.fillStyle='#e05555';gctx.fillRect(sx-bw/2,sy-PSCALE*.6,bw*(e.hp/e.maxHp),4);}

function gDrawArcher(e){
  if(e.dead)return;
  const sx=e.wx-camX,sy=e.wy-camY;
  if(sx<-30||sx>VW+30||sy<-30||sy>VH+30)return;
  const flash=e.hitFlash>0?Math.min(1,e.hitFlash/8):0;
  // Shadow
  gctx.save();gctx.globalAlpha=.2;gctx.fillStyle='#000';
  gctx.beginPath();gctx.ellipse(sx,sy+PSCALE*.44,PSCALE*.3,PSCALE*.1,0,0,Math.PI*2);gctx.fill();gctx.restore();
  // Sprite
  gDrawSprite(SpriteRegistry.get('archer').canvas||archerSpr,e.wx,e.wy,PSCALE,flash,0);
  // Health bar
  const bw=PSCALE;
  gctx.fillStyle='#2a1010';gctx.fillRect(sx-bw/2,sy-PSCALE*.6,bw,4);
  gctx.fillStyle='#e07722';gctx.fillRect(sx-bw/2,sy-PSCALE*.6,bw*(e.hp/e.maxHp),4);
  // Draw bow arm pointing toward player when attacking
  if(e.attackCooldown<20&&e.activated){
    gctx.save();gctx.translate(sx,sy);gctx.rotate(e.angle);
    gctx.strokeStyle='#8b5c2a';gctx.lineWidth=2;
    gctx.beginPath();gctx.arc(0,0,10,-Math.PI*.55,Math.PI*.55);gctx.stroke();
    // Arrow on bow
    gctx.strokeStyle='#c0b040';gctx.lineWidth=1;
    gctx.beginPath();gctx.moveTo(-2,0);gctx.lineTo(12,0);gctx.stroke();
    gctx.restore();
  }
}

function gDrawArrows(){
  // ── Enemy arrows — warm wood tones ──────────────────────────────
  for(const a of gArrows){
    if(!Number.isFinite(a.wx)||!Number.isFinite(a.wy)||!Number.isFinite(a.angle))continue;
    const sx=a.wx-camX,sy=a.wy-camY;
    if(sx<-20||sx>VW+20||sy<-20||sy>VH+20)continue;
    gctx.save();gctx.translate(sx,sy);gctx.rotate(a.angle);
    gctx.strokeStyle='#c8a030';gctx.lineWidth=2;
    gctx.beginPath();gctx.moveTo(-9,0);gctx.lineTo(6,0);gctx.stroke();
    gctx.fillStyle='#c0c0a0';
    gctx.beginPath();gctx.moveTo(6,0);gctx.lineTo(6,-2);gctx.lineTo(10,0);gctx.lineTo(6,2);gctx.closePath();gctx.fill();
    gctx.fillStyle='#8b3a1a';
    gctx.beginPath();gctx.moveTo(-9,0);gctx.lineTo(-6,-3);gctx.lineTo(-5,0);gctx.closePath();gctx.fill();
    gctx.beginPath();gctx.moveTo(-9,0);gctx.lineTo(-6,3);gctx.lineTo(-5,0);gctx.closePath();gctx.fill();
    gctx.restore();
  }
  // ── Player arrows — white/silver with cool blue glow ────────────
  for(const a of gPlayerArrows){
    if(!Number.isFinite(a.wx)||!Number.isFinite(a.wy)||!Number.isFinite(a.angle))continue;
    const sx=a.wx-camX,sy=a.wy-camY;
    if(sx<-20||sx>VW+20||sy<-20||sy>VH+20)continue;
    if(a.isPower) bowDrawPowerTrail(a);
    gctx.save();gctx.translate(sx,sy);gctx.rotate(a.angle);
    if(a.isPower){
      // Power shot — bright golden-white bolt
      gctx.shadowColor='#ffffaa'; gctx.shadowBlur=10;
      gctx.strokeStyle='#fffde0'; gctx.lineWidth=3;
      gctx.beginPath();gctx.moveTo(-12,0);gctx.lineTo(8,0);gctx.stroke();
      gctx.fillStyle='#ffffff';
      gctx.beginPath();gctx.moveTo(8,0);gctx.lineTo(6,-3);gctx.lineTo(15,0);gctx.lineTo(6,3);gctx.closePath();gctx.fill();
      gctx.fillStyle='#ffeeaa';
      gctx.beginPath();gctx.moveTo(10,0);gctx.lineTo(9,-1.5);gctx.lineTo(15,0);gctx.lineTo(9,1.5);gctx.closePath();gctx.fill();
      gctx.fillStyle='#ddddff';
      gctx.beginPath();gctx.moveTo(-12,0);gctx.lineTo(-8,-4);gctx.lineTo(-7,0);gctx.closePath();gctx.fill();
      gctx.beginPath();gctx.moveTo(-12,0);gctx.lineTo(-8,4);gctx.lineTo(-7,0);gctx.closePath();gctx.fill();
    } else {
      // Standard — white shaft, silver tip, pale blue fletching
      gctx.shadowColor='#99bbff'; gctx.shadowBlur=5;
      gctx.strokeStyle='#eef2ff'; gctx.lineWidth=2;
      gctx.beginPath();gctx.moveTo(-9,0);gctx.lineTo(6,0);gctx.stroke();
      gctx.shadowBlur=0;
      // Silver-white tip with blue core
      gctx.fillStyle='#ffffff';
      gctx.beginPath();gctx.moveTo(6,0);gctx.lineTo(5,-2);gctx.lineTo(12,0);gctx.lineTo(5,2);gctx.closePath();gctx.fill();
      gctx.fillStyle='#aaccff';
      gctx.beginPath();gctx.moveTo(8,0);gctx.lineTo(7.5,-1);gctx.lineTo(12,0);gctx.lineTo(7.5,1);gctx.closePath();gctx.fill();
      // Pale blue-white fletching
      gctx.fillStyle='#c8dcff';
      gctx.beginPath();gctx.moveTo(-9,0);gctx.lineTo(-6,-3);gctx.lineTo(-5,0);gctx.closePath();gctx.fill();
      gctx.beginPath();gctx.moveTo(-9,0);gctx.lineTo(-6,3);gctx.lineTo(-5,0);gctx.closePath();gctx.fill();
    }
    gctx.restore();
  }
}

function gDrawDestructible(d){
  if(d.broken){if(d.breakAnim>0){const a=d.breakAnim/20;gctx.save();gctx.globalAlpha=a;gctx.fillStyle=d.type==='barrel'?'#8b5c2a':'#c8a060';for(let i=0;i<4;i++){const ang=i*Math.PI/2,dist=(1-a)*14;gctx.fillRect(d.wx-camX+Math.cos(ang)*dist-3,d.wy-camY+Math.sin(ang)*dist-3,6,6);}gctx.restore();}return;}
  const sx=d.wx-camX,sy=d.wy-camY;if(sx<-24||sx>VW+24||sy<-24||sy>VH+24)return;
  gctx.save();gctx.translate(sx,sy);const fl=d.hp<d.maxHp?.3:0;
  if(d.type==='barrel'){gctx.fillStyle=fl?'#e08050':'#8b5c2a';gctx.fillRect(-8,-10,16,18);gctx.fillStyle='#5a3a18';gctx.fillRect(-8,-10,16,3);gctx.fillRect(-8,2,16,3);gctx.fillRect(-8,7,16,3);gctx.fillStyle='#6a4a20';gctx.fillRect(-2,-13,4,4);}
  else{gctx.fillStyle=fl?'#d8a060':'#c8a060';gctx.fillRect(-10,-8,20,16);gctx.fillStyle='#8a6030';gctx.fillRect(-10,-8,20,3);gctx.fillRect(-10,-8,3,16);gctx.fillRect(7,-8,3,16);gctx.strokeStyle='#7a5028';gctx.lineWidth=1;gctx.strokeRect(-9,-7,18,14);}
  if(fl){gctx.globalAlpha=.35;gctx.fillStyle='#ff9050';gctx.fillRect(-10,-12,20,20);}
  gctx.restore();
}

function gRender(){
  if(!gPlayer)return;
  gctx.save();
  gctx.setTransform(1,0,0,1,0,0);
  if(gShakeDur>0){gShakeX=(Math.random()-.5)*gShakeMag*2;gShakeY=(Math.random()-.5)*gShakeMag*2;gShakeDur=Math.max(0,gShakeDur-gLastDt);}else{gShakeX=0;gShakeY=0;}
  gctx.save();gctx.translate(gShakeX,gShakeY);
  gctx.fillStyle='#060408';gctx.fillRect(0,0,VW,VH);
  const c0=Math.max(0,Math.floor(camX/T)-1),c1=Math.min(gMapW-1,Math.ceil((camX+VW)/T)+1);
  const r0=Math.max(0,Math.floor(camY/T)-1),r1=Math.min(gMapH-1,Math.ceil((camY+VH)/T)+1);
  for(let ty=r0;ty<=r1;ty++)for(let tx=c0;tx<=c1;tx++)gDrawTile(tx*T-camX,ty*T-camY,T,gTiles[ty*gMapW+tx],tx,ty);
  gDrawTorches();
  gDrawTraps();
  gDrawPotions();
  for(const d of gDestructibles)gDrawDestructible(d);
  gDrawSmear();
  // Bow charge cone and dodge roll trail
  if(gPlayer && gActiveWeapon==='bow'){ bowDrawCone(gPlayer); if(gPlayer.rollActive){const sx=gPlayer.wx-camX,sy=gPlayer.wy-camY;const prog=1-(gPlayer.rollTick||0)/WeaponRegistry.bow.rollDuration;gctx.save();gctx.globalAlpha=prog*0.38;gctx.fillStyle='#7777dd';gctx.beginPath();gctx.arc(sx,sy,gPlayer.r*1.3,0,Math.PI*2);gctx.fill();gctx.restore();} }
  // Charge cone (dungeon)
  if(gPlayer&&gPlayer.charging&&!gPlayer.swinging&&gPlayer.swingCooldown<=0&&!gPlayer.wwActive){
    const ratio=Math.min(1,gPlayer.chargeTick/W().chargeMax);
    const px2=gPlayer.wx-camX,py2=gPlayer.wy-camY;
    const ang=gPlayer.angle,half=W().swingArc/2;
    const nextDir=gPlayer.swingDir*-1;
    const startA=ang-half*nextDir,endA=ang+half*nextDir;
    const leftA=ang+(endA-ang)*ratio,rightA=ang+(startA-ang)*ratio;
    gctx.save();
    const lineCol=ratio>=1?'#88bbff':'#88bbff';
    gctx.globalAlpha=ratio*0.08;
    gctx.fillStyle='#bbddff';
    gctx.beginPath();gctx.moveTo(px2,py2);
    gctx.arc(px2,py2,W().smearOuter+ratio*W().smearOuter*0.5,rightA,leftA,nextDir<0);
    gctx.closePath();gctx.fill();
    gctx.globalAlpha=0.55+ratio*0.35;gctx.strokeStyle=lineCol;gctx.lineWidth=ratio>=1?2.5:1.8;gctx.lineCap='round';
    gctx.beginPath();gctx.moveTo(px2+Math.cos(ang)*W().smearInner,py2+Math.sin(ang)*W().smearInner);
    gctx.lineTo(px2+Math.cos(leftA)*(W().smearInner+(W().smearOuter-W().smearInner)*ratio),py2+Math.sin(leftA)*(W().smearInner+(W().smearOuter-W().smearInner)*ratio));gctx.stroke();
    gctx.beginPath();gctx.moveTo(px2+Math.cos(ang)*W().smearInner,py2+Math.sin(ang)*W().smearInner);
    gctx.lineTo(px2+Math.cos(rightA)*(W().smearInner+(W().smearOuter-W().smearInner)*ratio),py2+Math.sin(rightA)*(W().smearInner+(W().smearOuter-W().smearInner)*ratio));gctx.stroke();
    if(ratio>=1){gctx.globalAlpha=0.55+0.35*Math.sin(gFrame*.12);gctx.strokeStyle='#88bbff';gctx.lineWidth=2;gctx.beginPath();gctx.arc(px2,py2,W().smearOuter*1.5,startA,endA,nextDir<0);gctx.stroke();}
    gctx.globalAlpha=1;gctx.restore();
  }
  for(let i=gParticles.length-1;i>=0;i--){const p=gParticles[i];p.x+=p.vx*gLastDt;p.y+=p.vy*gLastDt;p.vx*=Math.pow(.88,gLastDt);p.vy*=Math.pow(.88,gLastDt);p.life-=p.decay*gLastDt;if(p.life<=0){gParticles.splice(i,1);continue;}const pr=p.r*p.life;if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(pr)||pr<=0){gParticles.splice(i,1);continue;}gctx.globalAlpha=p.life;gctx.fillStyle=p.col;gctx.beginPath();gctx.arc(p.x-camX,p.y-camY,pr,0,Math.PI*2);gctx.fill();}gctx.globalAlpha=1;
  const drawables=[{y:gPlayer.dead?-999:gPlayer.wy,fn:gDrawPlayer},...gEnemies.filter(e=>!e.dead).map(e=>({y:e.wy,fn:()=>e.isArcher?gDrawArcher(e):e.isWarrior?gDrawWarrior(e):gDrawEnemy(e)}))]; gDrawArrows();
  drawables.sort((a,b)=>a.y-b.y).forEach(d=>d.fn());
  if(inTown) townDrawHubPlayers();
  if(inTown) townDrawPortal();
  if(inTown){ portalCheckProximity(); portalDrawPrompt(); }
  mpDrawRemotePlayers();
  gctx.textAlign='center';
  for(let i=gDmgNums.length-1;i>=0;i--){const d=gDmgNums[i];d.x+=d.vx*gLastDt;d.y+=d.vy*gLastDt;d.life-=.022*gLastDt;if(d.life<=0){gDmgNums.splice(i,1);continue;}gctx.globalAlpha=d.life;gctx.fillStyle=d.col;gctx.font=`bold ${10+Math.round((1-d.life)*5)}px monospace`;gctx.fillText(d.val,d.x-camX,d.y-camY);}gctx.globalAlpha=1;
  // Whirlwind targeting arrow
  if(gPlayer&&gPlayer.wwTargeting&&!gPlayer.wwActive){
    const ang=gPlayer.angle;
    const{ex,ey,dist}=wwEndpoint(gPlayer.wx,gPlayer.wy,ang);
    const sx2=gPlayer.wx-camX,sy2=gPlayer.wy-camY;
    const ex2=ex-camX,ey2=ey-camY;
    const pulse=0.55+0.25*Math.sin(gFrame*0.06);
    gctx.save();
    // Trajectory line
    gctx.globalAlpha=pulse*0.85;
    gctx.strokeStyle='#55ccff';
    gctx.lineWidth=4;
    gctx.setLineDash([8,5]);
    gctx.beginPath();gctx.moveTo(sx2,sy2);gctx.lineTo(ex2,ey2);gctx.stroke();
    gctx.setLineDash([]);
    // Sweep zone circles along path (show reach)
    const steps=Math.max(2,Math.floor(dist/32));
    for(let i=1;i<=steps;i++){
      const t2=i/steps;
      const cx2=sx2+(ex2-sx2)*t2,cy2=sy2+(ey2-sy2)*t2;
      gctx.globalAlpha=pulse*0.18;
      gctx.fillStyle='#55ccff';
      gctx.beginPath();gctx.arc(cx2,cy2,W().wwRadius,0,Math.PI*2);gctx.fill();
    }
    // Arrowhead at endpoint
    gctx.globalAlpha=pulse*0.85;
    gctx.fillStyle='#aaddff';
    gctx.strokeStyle='#88ddff';
    gctx.lineWidth=2;
    const headLen=16;
    const leftAng=ang+Math.PI*0.75;
    const rightAng=ang-Math.PI*0.75;
    gctx.beginPath();
    gctx.moveTo(ex2,ey2);
    gctx.lineTo(ex2+Math.cos(leftAng)*headLen,ey2+Math.sin(leftAng)*headLen);
    gctx.lineTo(ex2+Math.cos(rightAng)*headLen,ey2+Math.sin(rightAng)*headLen);
    gctx.closePath();gctx.fill();gctx.stroke();
    // Cooldown label when on cooldown
    if(gPlayer&&gPlayer.wwCooldown>0){
      gctx.globalAlpha=0.75;gctx.fillStyle='#ff8844';gctx.font='bold 11px monospace';gctx.textAlign='center';
      gctx.fillText('COOLDOWN '+(Math.ceil(gPlayer.wwCooldown/60))+'s',sx2,sy2-28);
    } else {
      gctx.globalAlpha=pulse*0.8;gctx.fillStyle='#aaddff';gctx.font='bold 10px monospace';gctx.textAlign='center';
      gctx.fillText('CLICK TO DASH',sx2,sy2-28);
    }
    gctx.restore();
  }
  // Whirlwind active — spinning sword rings
  // WW spinning sword drawn inside drawAnyPlayer (shared for local + remote)
  // Whirlwind cooldown bar (bottom-center when on cooldown)
  if(gPlayer&&gPlayer.wwCooldown>0&&!gPlayer.wwTargeting){
    const bw=80,bh=4,bx=(VW-bw)/2,by2=VH-52;
    gctx.save();gctx.globalAlpha=0.7;
    gctx.fillStyle='#1a1a2e';gctx.fillRect(bx,by2,bw,bh);
    gctx.fillStyle='#44aadd';gctx.fillRect(bx,by2,bw*(1-gPlayer.wwCooldown/W().wwCooldown),bh);
    gctx.fillStyle='#88ccee';gctx.font='8px monospace';gctx.textAlign='center';
    gctx.fillText('WHIRLWIND',VW/2,by2-3);
    gctx.restore();
  }
  // Fog + vignette — dungeon only, not in The Sanctum
  if(!inTown){
    const pfx=gPlayer.wx-camX,pfy=gPlayer.wy-camY;
    const fog=gctx.createRadialGradient(pfx,pfy,30,pfx,pfy,230);fog.addColorStop(0,'rgba(0,0,0,0)');fog.addColorStop(.5,'rgba(0,0,0,.2)');fog.addColorStop(1,'rgba(0,0,0,.88)');gctx.fillStyle=fog;gctx.fillRect(0,0,VW,VH);
    const vig=gctx.createRadialGradient(VW/2,VH/2,VH*.3,VW/2,VH/2,VH*.75);vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,.45)');gctx.fillStyle=vig;gctx.fillRect(0,0,VW,VH);
  }
  // Minimap
  const mw=110,mh=Math.max(40,Math.round(gMapH/gMapW*mw)),mx=VW-mw-8,my=8;
  gctx.save();gctx.globalAlpha=.7;gctx.fillStyle='#0a0a14';gctx.fillRect(mx,my,mw,mh);gctx.strokeStyle='#3a2a1a';gctx.lineWidth=1;gctx.strokeRect(mx,my,mw,mh);
  const msx=mw/gMapW,msy=mh/gMapH;
  for(let r=0;r<gMapH;r++)for(let c=0;c<gMapW;c++){const t=gTiles[r*gMapW+c];if(t===TILE_FLOOR){gctx.fillStyle='#2a2235';gctx.fillRect(mx+c*msx,my+r*msy,msx+.5,msy+.5);}else if(t===TILE_EXIT){gctx.fillStyle='#8040cc';gctx.fillRect(mx+c*msx,my+r*msy,msx+1,msy+1);}}
  gctx.fillStyle='#5588ff';gctx.beginPath();gctx.arc(mx+gPlayer.wx/T*msx,my+gPlayer.wy/T*msy,2,0,Math.PI*2);gctx.fill();
  for(const e of gEnemies){if(e.dead||!e.activated)continue;gctx.fillStyle='#cc3322';gctx.beginPath();gctx.arc(mx+e.wx/T*msx,my+e.wy/T*msy,1.5,0,Math.PI*2);gctx.fill();}
  gctx.globalAlpha=1;gctx.restore();
  // Cursor
  gctx.save();gctx.translate(gMouseX,gMouseY);gctx.strokeStyle='rgba(255,255,255,.65)';gctx.lineWidth=1.5;gctx.beginPath();gctx.moveTo(-7,0);gctx.lineTo(-3,0);gctx.stroke();gctx.beginPath();gctx.moveTo(3,0);gctx.lineTo(7,0);gctx.stroke();gctx.beginPath();gctx.moveTo(0,-7);gctx.lineTo(0,-3);gctx.stroke();gctx.beginPath();gctx.moveTo(0,3);gctx.lineTo(0,7);gctx.stroke();gctx.restore();
  gctx.restore();
  document.getElementById('ghp').style.width=(gPlayer.hp/gPlayer.maxHp*100)+'%';
  gctx.restore(); // matches the outer save at top of gRender
  document.getElementById('g-kills').textContent='Goblins: '+gPlayer.kills;
  const wwEl=document.getElementById('g-ww');
  if(wwEl){
    if(gPlayer&&gPlayer.wwActive) wwEl.textContent='⚡ DASHING';
    else if(gPlayer&&gPlayer.wwTargeting) wwEl.textContent='⚡ CLICK TO DASH';
    else if(gPlayer&&gPlayer.wwCooldown>0) wwEl.textContent='⚡ '+Math.ceil(gPlayer.wwCooldown/60)+'s';
    else wwEl.textContent='[SPACE] ⚡';
  }
  if(gPlayer.dead){
    if(!document.getElementById('g-death').classList.contains('show')){
      mpShowDeath(true);
    }
  }
}

// ── Update bow HUD indicator ───────────────────────────────────────
function bowUpdateHUD() {
  const el = document.getElementById('g-ww');
  if (!el || !gPlayer) return;
  if (gActiveWeapon !== 'bow') return; // sword HUD handled elsewhere
  const bw    = WeaponRegistry.bow;
  const ratio = Math.min(1, (gPlayer.bowChargeTick || 0) / bw.chargeMax);
  const onCd  = (gPlayer.rollCooldown || 0) > 0;
  const cdPct = Math.round(((gPlayer.rollCooldown || 0) / bw.rollCooldown) * 100);

  if (ratio >= BOW_FULL_RATIO) {
    el.textContent  = '⬛ POWER SHOT';
    el.style.color  = '#ffdd44';
  } else if (ratio > 0) {
    const bars = Math.round(ratio * 8);
    el.textContent = '▶ ' + '█'.repeat(bars) + '░'.repeat(8 - bars);
    el.style.color = '#aabbff';
  } else if (onCd) {
    el.textContent = '↻ ROLL ' + cdPct + '%';
    el.style.color = '#888';
  } else {
    el.textContent = '[BOW] ROLL ready';
    el.style.color = '#aabbff';
  }
}

// ── §6.6  Game loop & MP client checks ──────────────────────────
// The host runs full AI. Clients receive enemy positions via Firebase
// but gUpdateEnemies() is skipped for them. This function runs on
// clients only and checks melee/arrow hits against the local gPlayer.
function mpCheckEnemyAttacks(){
  if(!MP.active||MP.isHost||!gPlayer||gPlayer.dead||gPaused) return;

  // Melee goblin hits
  for(const e of gEnemies){
    if(e.dead||e.isArcher||e.isWarrior) continue;
    e.hitFlash=Math.max(0,(e.hitFlash||0)-gLastDt);
    e.attackCooldown=Math.max(0,(e.attackCooldown||0)-gLastDt);
    const d=Math.hypot(e.wx-gPlayer.wx,e.wy-gPlayer.wy);
    if(d<=gPlayer.r+e.r+12&&e.attackCooldown<=0&&gPlayer.iFrames<=0){
      const dmg=EntityDefs.goblin.meleeDamage;
      gPlayer.hp=Math.max(0,gPlayer.hp-dmg);
      gPlayer.iFrames=50;
      e.attackCooldown=EntityDefs.goblin.meleeCooldown;
      gShake(5,8);
      spawnGP(gPlayer.wx,gPlayer.wy,'#e08040',5,2.5);
      addGDmg(gPlayer.wx,gPlayer.wy-18,dmg,'#e08855');
      gPlayGrunt();
      if(gPlayer.hp<=0) gPlayer.dead=true;
    }
  }

  // Arrow hit detection is handled in the unified client arrow loop (startGameLoop)
}

function startGameLoop(){
  if(gLoopId){cancelAnimationFrame(gLoopId);gLoopId=null;}
  gLastTS = 0;
  const myGen = ++gLoopGen; // this loop's generation — any older loop will self-terminate
  function loop(now){
    if(myGen !== gLoopGen) return; // stale loop — a newer startGameLoop was called, stop
    if(!document.getElementById('game').classList.contains('active'))return;
    // Fix 3: skip update when tab is hidden — saves CPU when backgrounded
    if(document.visibilityState==='hidden'){gLoopId=requestAnimationFrame(loop);return;}
    // dt: time-scale factor — 1.0 at 60fps, 2.0 at 30fps
    // Never goes below 1.0 — preserves original 60fps calibration as the minimum.
    // Capped at 2.5 so a backgrounded tab doesn't simulate many frames at once.
    // On first frame (gLastTS===0) use dt=1 to avoid a huge initial step.
    const dt = gLastTS === 0 ? 1 : Math.min(Math.max((now - gLastTS) / (1000/60), 1), 2.5);
    gLastTS = now;
    gLastDt = dt;
    gFrame++;
    // Restore dungeon canvas/dims (base/town loops reassign these)
    gctx = gc.getContext('2d');
    VW = 700; VH = 420;
    // Per-player freeze (hit-stop) only pauses that player — never the whole loop
    if(gPlayer)gUpdatePlayer(dt);
    if(gPlayer&&!gPlayer.dead&&(!MP.active||MP.isHost)){gUpdateEnemies(dt);gUpdatePlayerArrows(dt);}
    if(gPlayer&&!gPlayer.dead)gUpdateTraps(dt); // all peers run traps — state derived from gFrame
    if(gPlayer)gUpdatePotions(dt);
    if(gPlayer&&!gPlayer.dead)mpCheckEnemyAttacks();
    mpInterpolateEnemies(); // smooth enemy positions on client between world syncs
    // Client arrow passes — enemy and player arrows are completely separate
    if(MP.active&&!MP.isHost&&gPlayer&&!gPlayer.dead){

      // ── Enemy arrows: advance + player hit check ──────────────
      for(let i=gArrows.length-1;i>=0;i--){
        const a=gArrows[i];
        if(!Number.isFinite(a.vx)||!Number.isFinite(a.vy)||
           !Number.isFinite(a.wx)||!Number.isFinite(a.wy)||!Number.isFinite(a.angle)){
          gArrows.splice(i,1); continue;
        }
        a.wx+=a.vx*gLastDt; a.wy+=a.vy*gLastDt; a.life-=gLastDt;
        if(a.life<=0){gArrows.splice(i,1); continue;}
        if(gPlayer.iFrames<=0&&Math.hypot(a.wx-gPlayer.wx,a.wy-gPlayer.wy)<gPlayer.r+4){
          gArrows.splice(i,1);
          const dmg=EntityDefs.archer.arrowDamage;
          gPlayer.hp=Math.max(0,gPlayer.hp-dmg);
          gPlayer.iFrames=50; gShake(3,5);
          spawnGP(gPlayer.wx,gPlayer.wy,'#c06020',6,3);
          addGDmg(gPlayer.wx,gPlayer.wy-18,dmg,'#ffaa44');
          gPlayArrowHit(); gPlayGrunt();
          if(gPlayer.hp<=0) gPlayer.dead=true;
        }
      }

      // ── Player arrows: advance + enemy/destructible hit → sendHits ──
      for(let i=gPlayerArrows.length-1;i>=0;i--){
        const a=gPlayerArrows[i];
        if(!Number.isFinite(a.vx)||!Number.isFinite(a.vy)||
           !Number.isFinite(a.wx)||!Number.isFinite(a.wy)||!Number.isFinite(a.angle)){
          gPlayerArrows.splice(i,1); continue;
        }
        a.wx+=a.vx*gLastDt; a.wy+=a.vy*gLastDt; a.life-=gLastDt;
        if(a.life<=0){gPlayerArrows.splice(i,1); continue;}

        // Wall check (client-side — remove arrow so it doesn't linger visually)
        const ctx2=Math.floor(a.wx/T), cty2=Math.floor(a.wy/T);
        if(!gIsWalk(ctx2,cty2)){gPlayerArrows.splice(i,1); continue;}

        // Enemy hit
        if(!a._hitEnemies) a._hitEnemies = new Set();
        let hitEnemy=false;
        for(const en of gEnemies){
          if(en.dead||a._hitEnemies.has(en)) continue;
          if(Math.hypot(a.wx-en.wx,a.wy-en.wy)<en.r+5){
            const dmg = a.dmg || WeaponRegistry.bow.arrowDamage;
            Net.sendHits([{idx: gEnemies.indexOf(en), dmg}]);
            spawnGP(en.wx,en.wy,'#ff4422',5,2.5);
            addGDmg(en.wx,en.wy-16,dmg,'#ffe066');
            gPlayHit();
            if(a.pierce>0 && Math.random()<a.pierce){
              a._hitEnemies.add(en);
            } else {
              gPlayerArrows.splice(i,1); hitEnemy=true;
            }
            break;
          }
        }
        if(hitEnemy) continue;

        // Destructible hit
        if(gPlayerArrows[i]===a){
          for(const d of gDestructibles){
            if(d.broken) continue;
            if(Math.hypot(a.wx-d.wx,a.wy-d.wy)<d.r+4){
              Net.sendHits([{destructIdx: gDestructibles.indexOf(d)}]);
              d.broken=true; d.breakAnim=20;
              gPlayWoodBreak(); spawnGP(d.wx,d.wy,'#c89050',10,3); gRebuildNav();
              if(!(a.pierce>0 && Math.random()<a.pierce)){
                gPlayerArrows.splice(i,1);
              }
              break;
            }
          }
        }
      }
    }
    for(const d of gDestructibles){if(d.breakAnim>0)d.breakAnim=Math.max(0,d.breakAnim-gLastDt);}
    gRender();
    if(inTown && gFrame % 3 === 0) townSendPresence();
    if(MP.active) mpTick();
    gLoopId=requestAnimationFrame(loop);
  }
  gLoopId=requestAnimationFrame(loop);
}



// ── §6.5  Rendering ─────────────────────────────────────────────
// ctx   : canvas 2d context
// camX/Y: world-space camera offset
// wx/wy : player world position
// cs    : combat state {angle,swinging,swingTimer,swingDir,
//          swingStartAngle,swingEndAngle,swingAimAngle,swingCooldown,iFrames}
// walkFrame, moving: for bob
// ═══════════════════════════════════════════════════════════════
