// §4  MAP EDITOR
//     Tile painter · entity placement · undo · zoom/pan
// ═══════════════════════════════════════════════════════════════
let edMapW = 40, edMapH = 24;
let edTiles = new Uint8Array(edMapW * edMapH).fill(TILE_WALL);
let edEnts = [];
let edZoom = 1.4, edPanX = 20, edPanY = 20;
let edPainting = false, edPanning = false;
let edPanSX = 0, edPanSY = 0, edPanCX = 0, edPanCY = 0;
let edLastTX = -1, edLastTY = -1, edLastMX = 0, edLastMY = 0;
let edTool = 'paint', edSel = null, edUndo = [];
let currentMapData = null;

const TERRAIN_PAL = [
  { id:'wall',  label:'Wall',  tid:TILE_WALL  },
  { id:'floor', label:'Floor', tid:TILE_FLOOR },
  { id:'exit',  label:'Exit',  tid:TILE_EXIT  },
  { id:'void',  label:'Void',  tid:TILE_VOID  },
];
const ENTITY_PAL = [
  { id:'player',   label:'Player'  },
  { id:'goblin',   label:'Goblin'  },
  { id:'archer',   label:'Archer'  },
  { id:'warrior',  label:'Warrior' },
  { id:'barrel',   label:'Barrel'  },
  { id:'crate',    label:'Crate'   },
  { id:'torch',    label:'Torch'   },
  { id:'fire-trap', label:'Fire Trap' },
];

// Icon draw functions
const iconFns = {
  wall:   (c,s) => { c.fillStyle='#2a2040';c.fillRect(0,0,s,s);c.fillStyle='rgba(0,0,0,.3)';c.fillRect(4,8,3,12);c.fillRect(16,4,2,8);c.fillStyle='rgba(255,200,100,.07)';c.fillRect(0,s-4,s,4); },
  floor:  (c,s) => { c.fillStyle='#1a1825';c.fillRect(0,0,s,s);c.fillStyle='rgba(255,255,255,.04)';c.fillRect(2,s-5,s-4,1); },
  exit:   (c,s) => { c.fillStyle='#0d0510';c.fillRect(0,0,s,s);c.fillStyle='rgba(150,80,220,.7)';c.fillRect(4,4,s-8,s-8);c.fillStyle='rgba(210,130,255,.35)';c.fillRect(10,10,s-20,s-20); },
  void:   (c,s) => { c.fillStyle='#060408';c.fillRect(0,0,s,s);c.strokeStyle='#2a2040';c.lineWidth=1;c.strokeRect(.5,.5,s-1,s-1); },
  player: (c,s) => { c.fillStyle='#3a7bd5';c.fillRect(10,8,12,10);c.fillStyle='#f4c88a';c.fillRect(12,3,8,7);c.fillStyle='#1e4a8a';c.fillRect(8,14,6,8);c.fillRect(18,14,6,8);c.fillStyle='#5588ff';c.fillRect(22,12,4,2); },
  goblin: (c,s) => { c.fillStyle='#3a7a2a';c.fillRect(10,5,12,9);c.fillStyle='#c8e870';c.fillRect(11,6,10,7);c.fillStyle='#ff2222';c.fillRect(13,8,3,3);c.fillRect(19,8,3,3);c.fillStyle='#8b3a1a';c.fillRect(9,14,6,8);c.fillRect(17,14,6,8); },
  archer: (c,s) => { c.fillStyle='#7a4a18';c.fillRect(8,2,16,10);c.fillStyle='#c8e870';c.fillRect(9,4,14,8);c.fillStyle='#ff8800';c.fillRect(11,6,3,3);c.fillRect(18,6,3,3);c.fillStyle='#3a7a2a';c.fillRect(6,12,20,8);c.strokeStyle='#8b5c2a';c.lineWidth=2;c.beginPath();c.arc(4,16,6,-Math.PI*.6,Math.PI*.6);c.stroke();c.strokeStyle='#c0b040';c.lineWidth=1;c.beginPath();c.moveTo(4,16);c.lineTo(26,16);c.stroke(); },
  warrior:(c,s) => { c.fillStyle='#2a5a1a';c.fillRect(8,2,16,12);c.fillStyle='#445566';c.fillRect(7,4,18,10);c.fillStyle='#a8c860';c.fillRect(9,5,14,8);c.fillStyle='#ff0000';c.fillRect(11,7,3,3);c.fillRect(18,7,3,3);c.fillStyle='#445566';c.fillRect(6,14,20,10);c.fillStyle='#223344';c.fillRect(6,14,20,3);c.strokeStyle='#888888';c.lineWidth=2;c.beginPath();c.moveTo(2,18);c.lineTo(22,18);c.stroke();c.fillStyle='#666';c.beginPath();c.moveTo(22,18);c.lineTo(18,14);c.lineTo(18,22);c.closePath();c.fill(); },
  barrel: (c,s) => { c.fillStyle='#8b5c2a';c.fillRect(8,6,16,20);c.fillStyle='#5a3a18';c.fillRect(8,6,16,3);c.fillRect(8,13,16,3);c.fillRect(8,19,16,3);c.fillStyle='#6a4a20';c.fillRect(13,2,6,5); },
  crate:  (c,s) => { c.fillStyle='#c8a060';c.fillRect(6,8,20,18);c.fillStyle='#8a6030';c.fillRect(6,8,20,3);c.fillRect(6,8,3,18);c.fillRect(23,8,3,18);c.strokeStyle='#7a5028';c.lineWidth=1;c.strokeRect(7,9,18,16); },
  torch:  (c,s) => { c.fillStyle='#6a4a2a';c.fillRect(14,14,4,12);c.fillStyle='rgba(255,200,60,.9)';c.beginPath();c.ellipse(16,12,4,7,0,0,Math.PI*2);c.fill();c.fillStyle='rgba(255,255,200,.8)';c.beginPath();c.arc(16,9,1.5,0,Math.PI*2);c.fill(); },
  'fire-trap': (c,s) => {
    // Stone base
    c.fillStyle='#5a5060';c.fillRect(8,8,16,16);
    c.fillStyle='#3a3048';c.fillRect(8,8,16,3);c.fillRect(8,8,3,16);c.fillRect(21,8,3,16);c.fillRect(8,21,16,3);
    // Default nozzle pointing right + flame
    c.fillStyle='#2a2038';c.fillRect(21,12,4,8);
    c.fillStyle='rgba(255,120,20,.9)';c.beginPath();c.moveTo(30,16);c.lineTo(24,12);c.lineTo(24,20);c.closePath();c.fill();
    c.fillStyle='rgba(255,220,60,.8)';c.beginPath();c.arc(27,16,2.5,0,Math.PI*2);c.fill();
  },
};

function mkIcon(fn) {
  const oc = document.createElement('canvas');
  oc.width = oc.height = 32; oc.style.width = oc.style.height = '32px';
  fn(oc.getContext('2d'), 32); return oc;
}

function buildEdPalette() {
  const tg = document.getElementById('pal-terrain');
  const eg = document.getElementById('pal-entities');
  [...TERRAIN_PAL, ...ENTITY_PAL].forEach(item => {
    const div = document.createElement('div');
    div.className = 'pal-item'; div.dataset.id = item.id;
    div.appendChild(mkIcon(iconFns[item.id] || ((c,s)=>{ c.fillStyle='#333';c.fillRect(0,0,s,s); })));
    const sp = document.createElement('span'); sp.textContent = item.label; div.appendChild(sp);
    div.addEventListener('click', () => edSelectItem(item));
    (item.tid !== undefined ? tg : eg).appendChild(div);
  });
  edSelectItem(TERRAIN_PAL[0]);
}

function edSelectItem(item) {
  edSel = item;
  document.querySelectorAll('.pal-item').forEach(e => e.classList.remove('sel'));
  document.querySelector(`.pal-item[data-id="${item.id}"]`)?.classList.add('sel');
}

document.querySelectorAll('#ed-tools .t-btn').forEach(b => {
  b.addEventListener('click', () => {
    edTool = b.dataset.tool;
    document.querySelectorAll('#ed-tools .t-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
  });
});

const edCanvas = document.getElementById('ed-canvas');
const edCtx = edCanvas.getContext('2d');
edCtx.imageSmoothingEnabled = false;
const edWrap = document.getElementById('ed-canvas-wrap');

function edResizeCanvas() { edCanvas.width = edWrap.clientWidth; edCanvas.height = edWrap.clientHeight; }
window.addEventListener('resize', () => {
  if (document.getElementById('editor').classList.contains('active')) { edResizeCanvas(); editorRender(); }
});

function edTileIdx(x, y) { return y * edMapW + x; }
function edInBounds(x, y) { return x >= 0 && y >= 0 && x < edMapW && y < edMapH; }
function edScToTile(sx, sy) {
  const r = edCanvas.getBoundingClientRect();
  return [Math.floor((sx - r.left - edPanX) / (T * edZoom)), Math.floor((sy - r.top - edPanY) / (T * edZoom))];
}

function edPushUndo() {
  edUndo.push({ tiles: new Uint8Array(edTiles), entities: JSON.parse(JSON.stringify(edEnts)) });
  if (edUndo.length > 50) edUndo.shift();
}

function edApply(tx, ty, erase) {
  if (!edInBounds(tx, ty)) return;
  if (erase || !edSel) {
    edEnts = edEnts.filter(e => !(e.tx === tx && e.ty === ty));
    edTiles[edTileIdx(tx, ty)] = TILE_WALL;
  } else if (edSel.tid !== undefined) {
    edTiles[edTileIdx(tx, ty)] = edSel.tid;
    if (edSel.tid === TILE_WALL) edEnts = edEnts.filter(e => !(e.tx === tx && e.ty === ty));
  } else {
    edTiles[edTileIdx(tx, ty)] = TILE_FLOOR;
    edEnts = edEnts.filter(e => !(e.tx === tx && e.ty === ty));
    if (edSel.id === 'player') edEnts = edEnts.filter(e => e.kind !== 'player');
    const ent = { kind: edSel.id, tx, ty };
    if (edSel.id === 'fire-trap') { ent.dir = 'e'; ent.phase = 0; } // default: east, phase 0%
    edEnts.push(ent);
  }
}

function edFloodFill(tx, ty) {
  if (!edInBounds(tx, ty) || !edSel || edSel.tid === undefined) return;
  const target = edTiles[edTileIdx(tx, ty)], rep = edSel.tid;
  if (target === rep) return;
  edPushUndo();
  const stack = [[tx, ty]], vis = new Uint8Array(edMapW * edMapH);
  while (stack.length) {
    const [cx, cy] = stack.pop();
    if (!edInBounds(cx, cy) || vis[edTileIdx(cx, cy)] || edTiles[edTileIdx(cx, cy)] !== target) continue;
    vis[edTileIdx(cx, cy)] = 1; edTiles[edTileIdx(cx, cy)] = rep;
    stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
  }
}

function edPick(tx, ty) {
  if (!edInBounds(tx, ty)) return;
  const ent = edEnts.find(e => e.tx === tx && e.ty === ty);
  if (ent) { const item = [...TERRAIN_PAL,...ENTITY_PAL].find(i => i.id === ent.kind); if (item) edSelectItem(item); return; }
  const item = TERRAIN_PAL.find(i => i.tid === edTiles[edTileIdx(tx, ty)]);
  if (item) edSelectItem(item);
}

edCanvas.addEventListener('mousedown', e => {
  e.preventDefault(); edCanvas.focus();
  const [tx, ty] = edScToTile(e.clientX, e.clientY);
  if (e.button === 1) { edPanning=true; edPanSX=e.clientX; edPanSY=e.clientY; edPanCX=edPanX; edPanCY=edPanY; edCanvas.style.cursor='grabbing'; return; }
  if (e.button === 2) { edPushUndo(); edPainting=true; edApply(tx,ty,true); editorRender(); return; }
  if (edTool === 'pick') { edPick(tx,ty); return; }
  if (edTool === 'fill') { edFloodFill(tx,ty); editorRender(); return; }
  // Fire-trap: left-click cycles direction, shift+click cycles phase
  if (edTool === 'paint') {
    const existing = edEnts.find(en => en.tx===tx && en.ty===ty && en.kind==='fire-trap');
    if (existing) {
      edPushUndo();
      if (e.shiftKey) {
        const phases = [0, 0.25, 0.5, 0.75];
        existing.phase = phases[(phases.indexOf(existing.phase||0)+1)%4];
      } else {
        const dirs = ['n','e','s','w'];
        existing.dir = dirs[(dirs.indexOf(existing.dir||'e')+1)%4];
      }
      editorRender(); return;
    }
  }
  edPushUndo(); edPainting=true; edLastTX=tx; edLastTY=ty;
  edApply(tx, ty, edTool === 'erase'); editorRender();
});

edCanvas.addEventListener('mousemove', e => {
  edLastMX = e.clientX; edLastMY = e.clientY;
  const [tx, ty] = edScToTile(e.clientX, e.clientY);
  document.getElementById('ed-pos').textContent = `X:${tx} Y:${ty}`;
  if (edInBounds(tx, ty)) {
    const ent = edEnts.find(e2 => e2.tx===tx && e2.ty===ty);
    let hoverLabel = ent ? ent.kind : (['Void','Floor','Wall','?','?','Exit'][edTiles[edTileIdx(tx,ty)]] || '?');
    if(ent&&ent.kind==='fire-trap'){
      const dirLabel={n:'↑',s:'↓',e:'→',w:'←'}[ent.dir||'e']||'→';
      const pct=Math.round((ent.phase||0)*100);
      hoverLabel='fire-trap '+dirLabel+(pct?' '+pct+'%':'');
    }
    document.getElementById('ed-hover').textContent = hoverLabel;
  }
  if (edPanning) { edPanX=edPanCX+(e.clientX-edPanSX); edPanY=edPanCY+(e.clientY-edPanSY); editorRender(); return; }
  if (!edPainting) return;
  if (tx===edLastTX && ty===edLastTY) return;
  edLastTX=tx; edLastTY=ty;
  edApply(tx, ty, e.buttons===2 || edTool==='erase'); editorRender();
});

window.addEventListener('mouseup', () => { edPainting=false; if(edPanning){edPanning=false;edCanvas.style.cursor='crosshair';} });

edCanvas.addEventListener('wheel', e => {
  e.preventDefault();
  const f = e.deltaY < 0 ? 1.1 : 0.9;
  edZoom = Math.max(0.3, Math.min(4, edZoom * f));
  const r = edCanvas.getBoundingClientRect();
  const cx = e.clientX - r.left, cy = e.clientY - r.top;
  edPanX = cx - (cx - edPanX)*f; edPanY = cy - (cy - edPanY)*f;
  document.getElementById('ed-zoom').textContent = Math.round(edZoom*100) + '%';
  editorRender();
}, { passive: false });

edCanvas.addEventListener('contextmenu', e => e.preventDefault());

edCanvas.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k==='p') document.querySelector('.t-btn[data-tool="paint"]').click();
  if (k==='e') document.querySelector('.t-btn[data-tool="erase"]').click();
  if (k==='f') document.querySelector('.t-btn[data-tool="fill"]').click();
  if (k==='i') document.querySelector('.t-btn[data-tool="pick"]').click();
  if (k==='z' && e.ctrlKey) { e.preventDefault(); if(edUndo.length){const s=edUndo.pop();edTiles=s.tiles;edEnts=s.entities;editorRender();} }
});

// Wall texture seed
const edWallVar = new Uint8Array(120*80);
for (let i = 0; i < edWallVar.length; i++) edWallVar[i] = Math.floor(Math.random()*4);

function edIsFl(x, y) {
  if (x<0||y<0||x>=edMapW||y>=edMapH) return false;
  return edTiles[edTileIdx(x,y)]===TILE_FLOOR || edTiles[edTileIdx(x,y)]===TILE_EXIT;
}

function drawEdTile(sx, sy, sz, tid, tx, ty) {
  if (tid===TILE_VOID) { edCtx.fillStyle='#060408'; edCtx.fillRect(sx,sy,sz,sz); return; }
  if (tid===TILE_WALL) {
    const fB=edIsFl(tx,ty+1),fA=edIsFl(tx,ty-1),fL=edIsFl(tx-1,ty),fR=edIsFl(tx+1,ty);
    const v=edWallVar[ty*120+tx]%4;
    if(!fB&&!fA&&!fL&&!fR) edCtx.fillStyle='#090710';
    else if(fB) edCtx.fillStyle=['#3a3040','#352b3a','#403545','#383040'][v];
    else edCtx.fillStyle=['#1e1828','#1c1520','#201a2c','#1c1625'][v];
    edCtx.fillRect(sx,sy,sz,sz);
    if((fB||fL||fR)&&sz>5){
      edCtx.fillStyle='rgba(0,0,0,.25)';
      if(v===0)edCtx.fillRect(sx+sz*.16,sy+sz*.25,sz*.08,sz*.5);
      if(v===1)edCtx.fillRect(sx+sz*.55,sy+sz*.16,sz*.12,sz*.35);
      if(fB){edCtx.fillStyle='rgba(255,200,100,.05)';edCtx.fillRect(sx,sy+sz-Math.max(1,sz*.12),sz,Math.max(1,sz*.12));}
    }
    return;
  }
  if (tid===TILE_FLOOR) {
    const v=edWallVar[ty*120+tx]%4;
    edCtx.fillStyle=['#1a1825','#1c1a28','#181622','#1b1926'][v];
    edCtx.fillRect(sx,sy,sz,sz); return;
  }
  if (tid===TILE_EXIT) {
    edCtx.fillStyle='#0d0510'; edCtx.fillRect(sx,sy,sz,sz);
    const p=0.4+0.18*Math.sin(Date.now()*.003);
    edCtx.fillStyle=`rgba(150,80,220,${p})`; edCtx.fillRect(sx+sz*.15,sy+sz*.15,sz*.7,sz*.7);
    edCtx.fillStyle=`rgba(210,130,255,${p*.5})`; edCtx.fillRect(sx+sz*.3,sy+sz*.3,sz*.4,sz*.4);
  }
}

function drawEdEntity(sx, sy, sz, kind, e) {
  const pad=sz*.1, x=sx+pad, y=sy+pad, w=sz-pad*2, h=sz-pad*2;
  edCtx.save();
  if(kind==='archer'){
    edCtx.fillStyle='rgba(120,72,24,.85)';edCtx.beginPath();edCtx.arc(sx+sz/2,sy+sz/2,sz*.38,0,Math.PI*2);edCtx.fill();
    edCtx.fillStyle='#c8e870';edCtx.beginPath();edCtx.arc(sx+sz/2,sy+sz*.42,sz*.24,0,Math.PI*2);edCtx.fill();
    edCtx.fillStyle='#ff8800';edCtx.fillRect(sx+sz*.3,sy+sz*.36,sz*.1,sz*.09);edCtx.fillRect(sx+sz*.56,sy+sz*.36,sz*.1,sz*.09);
    edCtx.strokeStyle='#8b5c2a';edCtx.lineWidth=Math.max(1.5,sz*.07);
    edCtx.beginPath();edCtx.arc(sx+sz*.12,sy+sz*.5,sz*.3,-Math.PI*.6,Math.PI*.6);edCtx.stroke();
    edCtx.strokeStyle='#c0b040';edCtx.lineWidth=Math.max(1,sz*.04);
    edCtx.beginPath();edCtx.moveTo(sx+sz*.12,sy+sz*.5);edCtx.lineTo(sx+sz*.9,sy+sz*.5);edCtx.stroke();
  }
  else if(kind==='warrior'){edCtx.fillStyle='rgba(30,80,20,.9)';edCtx.beginPath();edCtx.arc(sx+sz/2,sy+sz/2,sz*.45,0,Math.PI*2);edCtx.fill();edCtx.fillStyle='#a8c860';edCtx.beginPath();edCtx.arc(sx+sz/2,sy+sz*.42,sz*.3,0,Math.PI*2);edCtx.fill();edCtx.fillStyle='#ff0000';edCtx.fillRect(sx+sz*.28,sy+sz*.36,sz*.12,sz*.1);edCtx.fillRect(sx+sz*.56,sy+sz*.36,sz*.12,sz*.1);edCtx.strokeStyle='#888';edCtx.lineWidth=2;edCtx.beginPath();edCtx.moveTo(sx+sz*.1,sy+sz*.5);edCtx.lineTo(sx+sz*.55,sy+sz*.5);edCtx.stroke();}
  else if(kind==='goblin'){edCtx.fillStyle='rgba(40,100,30,.8)';edCtx.beginPath();edCtx.arc(sx+sz/2,sy+sz/2,sz*.4,0,Math.PI*2);edCtx.fill();edCtx.fillStyle='#c8e870';edCtx.beginPath();edCtx.arc(sx+sz/2,sy+sz*.42,sz*.28,0,Math.PI*2);edCtx.fill();edCtx.fillStyle='#ff2222';edCtx.fillRect(sx+sz*.3,sy+sz*.38,sz*.12,sz*.1);edCtx.fillRect(sx+sz*.58,sy+sz*.38,sz*.12,sz*.1);}
  else if(kind==='player'){edCtx.fillStyle='rgba(30,60,180,.8)';edCtx.beginPath();edCtx.arc(sx+sz/2,sy+sz/2,sz*.38,0,Math.PI*2);edCtx.fill();edCtx.strokeStyle='#88aaff';edCtx.lineWidth=Math.max(1,sz*.06);edCtx.beginPath();edCtx.arc(sx+sz/2,sy+sz/2,sz*.38,0,Math.PI*2);edCtx.stroke();edCtx.fillStyle='#aaccff';edCtx.font=`bold ${Math.max(8,sz*.35)}px monospace`;edCtx.textAlign='center';edCtx.textBaseline='middle';edCtx.fillText('P',sx+sz/2,sy+sz/2);}
  else if(kind==='barrel'){edCtx.fillStyle='#8b5c2a';edCtx.fillRect(x+w*.15,y,w*.7,h);edCtx.fillStyle='#5a3a18';edCtx.fillRect(x+w*.15,y,w*.7,h*.15);edCtx.fillRect(x+w*.15,y+h*.42,w*.7,h*.12);edCtx.fillRect(x+w*.15,y+h*.7,w*.7,h*.12);edCtx.fillStyle='#6a4a20';edCtx.fillRect(x+w*.35,y-h*.12,w*.3,h*.15);}
  else if(kind==='crate'){edCtx.fillStyle='#c8a060';edCtx.fillRect(x,y+h*.1,w,h*.8);edCtx.fillStyle='#8a6030';edCtx.fillRect(x,y+h*.1,w,h*.1);edCtx.fillRect(x,y+h*.1,w*.1,h*.8);edCtx.fillRect(x+w*.9,y+h*.1,w*.1,h*.8);edCtx.strokeStyle='#7a5028';edCtx.lineWidth=Math.max(.5,sz*.03);edCtx.strokeRect(x+sz*.06,y+h*.16,w-sz*.12,h*.68);}
  else if(kind==='fire-trap'){
    // Stone base
    edCtx.fillStyle='#5a5060';edCtx.fillRect(x+w*.1,y+h*.1,w*.8,h*.8);
    edCtx.fillStyle='#3a3048';
    edCtx.fillRect(x+w*.1,y+h*.1,w*.8,h*.12);edCtx.fillRect(x+w*.1,y+h*.78,w*.8,h*.12);
    edCtx.fillRect(x+w*.1,y+h*.1,w*.12,h*.8);edCtx.fillRect(x+w*.78,y+h*.1,w*.12,h*.8);
    // Nozzle + arrow showing direction
    const dir2=e&&e.dir?e.dir:'e';
    const dmap2={n:[0,-1],e:[1,0],s:[0,1],w:[-1,0]};
    const [ddx,ddy]=dmap2[dir2]||[1,0];
    const cx2=sx+sz/2,cy2=sy+sz/2;
    const nozzleX=cx2+ddx*sz*.28,nozzleY=cy2+ddy*sz*.28;
    // Nozzle protrusion
    edCtx.fillStyle='#2a2038';
    edCtx.fillRect(nozzleX-sz*.08,nozzleY-sz*.08,sz*.16,sz*.16);
    // Arrow
    edCtx.save();edCtx.translate(cx2,cy2);edCtx.rotate(Math.atan2(ddy,ddx));
    edCtx.fillStyle='rgba(255,120,20,.9)';
    edCtx.beginPath();edCtx.moveTo(sz*.45,0);edCtx.lineTo(sz*.28,-sz*.12);edCtx.lineTo(sz*.28,sz*.12);edCtx.closePath();edCtx.fill();
    // Ember glow
    edCtx.fillStyle='rgba(255,200,60,.7)';edCtx.beginPath();edCtx.arc(sz*.36,0,sz*.07,0,Math.PI*2);edCtx.fill();
    edCtx.restore();
    // Phase badge — small label in bottom-right corner
    const phasePct = Math.round((e&&e.phase!=null?e.phase:0)*100);
    if(phasePct>0){
      edCtx.fillStyle='rgba(0,0,0,.65)';edCtx.fillRect(sx+sz*.55,sy+sz*.72,sz*.38,sz*.24);
      edCtx.fillStyle='#ffcc44';edCtx.font=`bold ${Math.max(7,sz*.18)}px monospace`;
      edCtx.textAlign='center';edCtx.textBaseline='middle';
      edCtx.fillText(phasePct+'%',sx+sz*.74,sy+sz*.84);
    }
  }
  else if(kind==='torch'){edCtx.fillStyle='#6a4a2a';edCtx.fillRect(sx+sz*.44,sy+sz*.5,sz*.12,sz*.45);const fl=.7+.3*Math.sin(Date.now()*.008+sx*.1);edCtx.fillStyle=`rgba(255,200,60,${fl*.9})`;edCtx.beginPath();edCtx.ellipse(sx+sz/2,sy+sz*.38,sz*.15,sz*.22,0,0,Math.PI*2);edCtx.fill();const grd=edCtx.createRadialGradient(sx+sz/2,sy+sz*.35,0,sx+sz/2,sy+sz*.35,sz*.5);grd.addColorStop(0,`rgba(255,180,60,${.14*fl})`);grd.addColorStop(1,'rgba(0,0,0,0)');edCtx.fillStyle=grd;edCtx.beginPath();edCtx.arc(sx+sz/2,sy+sz*.35,sz*.5,0,Math.PI*2);edCtx.fill();}
  edCtx.restore();
}

let edAnimFrame = null;
function editorRender() {
  if (edAnimFrame) return;
  edAnimFrame = requestAnimationFrame(() => {
    edAnimFrame = null;
    _editorRenderSync();
  });
}

function _editorRenderSync() {
  const W = edCanvas.width, H = edCanvas.height, ts = T * edZoom;
  edCtx.clearRect(0, 0, W, H);
  const x0=Math.max(0,Math.floor(-edPanX/ts)-1), x1=Math.min(edMapW-1,Math.ceil((W-edPanX)/ts)+1);
  const y0=Math.max(0,Math.floor(-edPanY/ts)-1), y1=Math.min(edMapH-1,Math.ceil((H-edPanY)/ts)+1);
  for (let ty=y0;ty<=y1;ty++) for (let tx=x0;tx<=x1;tx++)
    drawEdTile(edPanX+tx*ts, edPanY+ty*ts, ts, edTiles[edTileIdx(tx,ty)], tx, ty);
  if (edZoom >= 0.7) {
    edCtx.strokeStyle='rgba(70,50,90,.3)'; edCtx.lineWidth=0.5;
    for(let tx=x0;tx<=x1+1;tx++){edCtx.beginPath();edCtx.moveTo(edPanX+tx*ts,edPanY+y0*ts);edCtx.lineTo(edPanX+tx*ts,edPanY+(y1+1)*ts);edCtx.stroke();}
    for(let ty=y0;ty<=y1+1;ty++){edCtx.beginPath();edCtx.moveTo(edPanX+x0*ts,edPanY+ty*ts);edCtx.lineTo(edPanX+(x1+1)*ts,edPanY+ty*ts);edCtx.stroke();}
  }
  edCtx.strokeStyle='rgba(200,144,80,.45)'; edCtx.lineWidth=2;
  edCtx.strokeRect(edPanX-1, edPanY-1, edMapW*ts+2, edMapH*ts+2);
  for (const ent of edEnts) {
    const sx=edPanX+ent.tx*ts, sy=edPanY+ent.ty*ts;
    if(sx<-ts||sx>W||sy<-ts||sy>H) continue;
    drawEdEntity(sx, sy, ts, ent.kind, ent);
  }
  const [ptx, pty] = edScToTile(edLastMX, edLastMY);
  if (edInBounds(ptx, pty) && edTool !== 'pan') {
    edCtx.strokeStyle='rgba(200,200,255,.55)'; edCtx.lineWidth=1.5;
    edCtx.strokeRect(edPanX+ptx*ts+1, edPanY+pty*ts+1, ts-2, ts-2);
  }
}

// Animate exit tiles & torches in editor
setInterval(() => { if (document.getElementById('editor').classList.contains('active')) _editorRenderSync(); }, 120);

function editorLoad(mapData) {
  edMapW = mapData.width; edMapH = mapData.height;
  edTiles = tilesFromRows(mapData.rows, edMapW, edMapH);
  edEnts = JSON.parse(JSON.stringify(mapData.entities || []));
  edUndo = [];
  document.getElementById('ed-name').value = mapData.name || 'Dungeon';
  document.getElementById('ed-w').value = edMapW;
  document.getElementById('ed-h').value = edMapH;
  // Centring is deferred to edCentreView(), called after the screen is visible
}

// Centre and fit the map in the editor viewport.
// Must be called after the editor screen is visible so canvas has real dimensions.
function edCentreView() {
  edResizeCanvas();
  edZoom = Math.min(1.8, Math.min(edCanvas.width / (edMapW*T), edCanvas.height / (edMapH*T)) * 0.9);
  edPanX = (edCanvas.width  - edMapW * T * edZoom) / 2;
  edPanY = (edCanvas.height - edMapH * T * edZoom) / 2;
  document.getElementById('ed-zoom').textContent = Math.round(edZoom*100) + '%';
  editorRender();
}

function edResize() {
  const nw = Math.max(10,Math.min(120, parseInt(document.getElementById('ed-w').value)||40));
  const nh = Math.max(8, Math.min(80,  parseInt(document.getElementById('ed-h').value)||24));
  edPushUndo();
  const nt = new Uint8Array(nw*nh).fill(TILE_WALL);
  for(let y=0;y<Math.min(nh,edMapH);y++) for(let x=0;x<Math.min(nw,edMapW);x++) nt[y*nw+x]=edTiles[edTileIdx(x,y)];
  edMapW=nw; edMapH=nh; edTiles=nt;
  edEnts = edEnts.filter(e => e.tx<nw && e.ty<nh);
  editorRender();
}
function edFill(tid) { edPushUndo(); edTiles.fill(tid); if(tid===TILE_WALL) edEnts=[]; editorRender(); }
function edClear() { if(!confirm('Clear map?')) return; edPushUndo(); edTiles.fill(TILE_WALL); edEnts=[]; editorRender(); }

function mapDataFromEditor() {
  const name = document.getElementById('ed-name').value || 'Dungeon';
  const rows = rowsFromTiles(edTiles, edMapW, edMapH);
  return { ...currentMapData, name, width:edMapW, height:edMapH, rows, entities:JSON.parse(JSON.stringify(edEnts)), updatedAt:Date.now() };
}

function saveMap() {
  const data = mapDataFromEditor();
  if (!data.id || data.id === 'builtin-goblin-cave') data.id = Date.now()+'';
  data.createdAt = data.createdAt || Date.now();
  currentMapData = data;
  storeSet(data.id, data);
  const btn = document.querySelector('.tbar-btn.save');
  const orig = btn.textContent; btn.textContent = '✓ SAVED';
  setTimeout(() => btn.textContent = orig, 1500);
}

function testPlay() {
  leaveTown();
  const data = mapDataFromEditor();
  // Auto-save so hub Play button reflects current editor state
  if (!data.id || data.id === 'builtin-goblin-cave') data.id = Date.now()+'';
  data.createdAt = data.createdAt || Date.now();
  storeSet(data.id, data);
  currentMapData = data;
  gameLoad(data);
  showScreen('game');
}

// ═══════════════════════════════════════════════════════════════
//  GAME ENGINE
// ═══════════════════════════════════════════════════════════════
let VW=700, VH=420;
const gc   = document.getElementById('gc');
let gctx = gc.getContext('2d');
gctx.imageSmoothingEnabled = false;

let gMapW=80, gMapH=36;
let gTiles = new Uint8Array(gMapW*gMapH).fill(TILE_WALL);
let gEntsRaw = [];
let camX=0, camY=0;
let gDestructibles=[], gEnemies=[], gTorches=[], gArrows=[], gPlayerArrows=[], gTraps=[], gPotions=[];
let gPlayer=null;
let gLoopId=null;
let gLoopGen=0; // incremented each time a new loop starts — stale loops self-terminate
let gFrame=0, gLastTS=0, exitReached=false;
let gLastDt=1; // most recent frame dt — used by client arrow loops
let gShakeX=0, gShakeY=0, gShakeDur=0, gShakeMag=0;
const gParticles=[], gDmgNums=[];
const gKeys={}; let gMouseX=VW/2, gMouseY=VH/2;

function gTileAt(tx,ty){if(tx<0||ty<0||tx>=gMapW||ty>=gMapH)return TILE_WALL;return gTiles[ty*gMapW+tx];}
function gIsWalk(tx,ty){const t=gTileAt(tx,ty);return t===TILE_FLOOR||t===TILE_EXIT;}

// Sprites
const _n=null;
const Pc={ol:'#000000',dk:'#404040',sv:'#b0b0b0',sk:'#d0b080',rd:'#d03030',bl:'#304090',ey:'#1a1a2e'};
const Gc={gn:'#3a7a2a',gd:'#2a5a1a',sk:'#c8e870',ey:'#ff2222',wh:'#fff',br:'#6b4c2a',bt:'#1a1a0a',cl:'#8b3a1a'};
const PPX=[
[null,null,null,null,Pc.ol,Pc.ol,Pc.ol,Pc.ol,Pc.ol,Pc.ol,Pc.ol,null,null,null,null,null],
[null,null,null,Pc.ol,Pc.sv,Pc.sv,Pc.sv,Pc.sv,Pc.dk,Pc.dk,Pc.dk,Pc.ol,null,null,null,null],
[null,null,Pc.ol,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.sv,Pc.ol,null,null,null],
[null,null,Pc.ol,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.sv,Pc.ol,null,null,null],
[null,null,Pc.dk,Pc.sk,Pc.sk,Pc.dk,Pc.dk,Pc.dk,Pc.sk,Pc.sk,Pc.dk,Pc.dk,Pc.ol,null,null,null],
[null,null,Pc.dk,Pc.ol,null,Pc.sk,Pc.dk,Pc.sk,Pc.ol,null,Pc.dk,Pc.dk,Pc.ol,null,null,null],
[null,null,Pc.dk,Pc.ol,null,Pc.sk,Pc.dk,Pc.sk,Pc.ol,null,Pc.dk,Pc.dk,Pc.ol,null,null,null],
[null,null,Pc.dk,Pc.sk,Pc.sk,Pc.sk,Pc.sk,Pc.sk,Pc.sk,Pc.sk,Pc.dk,Pc.sk,Pc.ol,null,null,null],
[null,Pc.ol,Pc.dk,Pc.sv,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.sv,Pc.sv,Pc.dk,Pc.sv,Pc.ol,null,null],
[Pc.ol,Pc.sv,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.rd,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.sv,Pc.ol,null],
[Pc.ol,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.rd,Pc.rd,Pc.rd,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.ol,null],
[null,Pc.ol,Pc.dk,Pc.ol,Pc.dk,Pc.dk,Pc.dk,Pc.rd,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.ol,null],
[null,Pc.ol,Pc.sk,Pc.ol,Pc.dk,Pc.dk,Pc.dk,Pc.rd,Pc.dk,Pc.dk,Pc.dk,Pc.sk,Pc.sk,Pc.ol,null,null],
[null,null,Pc.ol,Pc.ol,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.dk,Pc.ol,Pc.ol,null,null,null],
[null,null,null,Pc.ol,Pc.bl,Pc.bl,Pc.bl,Pc.bl,Pc.bl,Pc.bl,Pc.bl,Pc.ol,null,null,null,null],
[null,null,null,Pc.ol,Pc.bl,Pc.ol,null,null,null,Pc.ol,Pc.bl,Pc.ol,null,null,null,null]
];
const GPX=[[_n,_n,_n,_n,_n,_n,_n,_n,_n,_n,_n,_n,_n,_n,_n,_n],[_n,_n,_n,_n,_n,Gc.gd,Gc.gd,Gc.gd,Gc.gd,Gc.gd,_n,_n,_n,_n,_n,_n],[_n,_n,_n,_n,Gc.gd,Gc.gn,Gc.gn,Gc.gn,Gc.gn,Gc.gn,Gc.gd,_n,_n,_n,_n,_n],[_n,_n,_n,Gc.gd,Gc.sk,Gc.sk,Gc.ey,Gc.sk,Gc.ey,Gc.sk,Gc.sk,Gc.gd,_n,_n,_n,_n],[_n,_n,_n,Gc.gd,Gc.sk,Gc.sk,Gc.wh,Gc.sk,Gc.wh,Gc.sk,Gc.sk,Gc.gd,_n,_n,_n,_n],[_n,_n,_n,Gc.gd,Gc.sk,Gc.sk,Gc.sk,Gc.sk,Gc.sk,Gc.sk,Gc.sk,Gc.gd,_n,_n,_n,_n],[_n,_n,Gc.gd,Gc.gn,Gc.cl,Gc.cl,Gc.cl,Gc.cl,Gc.cl,Gc.cl,Gc.cl,Gc.gn,Gc.gd,_n,_n,_n],[_n,Gc.gd,Gc.gn,Gc.cl,Gc.cl,Gc.br,Gc.br,Gc.br,Gc.br,Gc.br,Gc.cl,Gc.cl,Gc.gn,Gc.gd,_n,_n],[_n,Gc.gd,Gc.gn,Gc.cl,Gc.cl,Gc.cl,Gc.cl,Gc.cl,Gc.cl,Gc.cl,Gc.cl,Gc.cl,Gc.gn,Gc.gd,_n,_n],[_n,_n,Gc.gd,Gc.gn,Gc.gn,Gc.gn,Gc.gn,Gc.gn,Gc.gn,Gc.gn,Gc.gn,Gc.gn,Gc.gd,_n,_n,_n],[_n,_n,_n,Gc.gd,Gc.br,Gc.gn,Gc.gd,Gc.gd,Gc.gd,Gc.gd,Gc.gn,Gc.br,Gc.gd,_n,_n,_n],[_n,_n,_n,Gc.gd,Gc.gn,Gc.gn,Gc.gd,_n,_n,Gc.gd,Gc.gn,Gc.gn,Gc.gd,_n,_n,_n],[_n,_n,_n,Gc.gd,Gc.gn,Gc.gn,Gc.gd,_n,_n,Gc.gd,Gc.gn,Gc.gn,Gc.gd,_n,_n,_n],[_n,_n,_n,Gc.gd,Gc.gd,Gc.gd,Gc.gd,_n,_n,Gc.gd,Gc.gd,Gc.gd,Gc.gd,_n,_n,_n],[_n,_n,_n,Gc.bt,Gc.bt,Gc.bt,Gc.bt,_n,_n,Gc.bt,Gc.bt,Gc.bt,Gc.bt,_n,_n,_n],[_n,_n,_n,Gc.bt,Gc.bt,_n,Gc.bt,_n,_n,Gc.bt,Gc.bt,_n,Gc.bt,_n,_n,_n]];
function bsc(px){const o=document.createElement('canvas');o.width=o.height=16;const c=o.getContext('2d');c.imageSmoothingEnabled=false;for(let y=0;y<16;y++)for(let x=0;x<16;x++){const v=px[y][x];if(!v)continue;c.fillStyle=v;c.fillRect(x,y,1,1);}return o;}
const playerSpr=bsc(PPX), goblinSpr=bsc(GPX);

// ═══════════════════════════════════════════════════════════════
