// §8  CHARACTER CREATOR
//     16×16 pixel editor · PNG import · named saves · MP sprite sync
// ═══════════════════════════════════════════════════════════════

const CC_SIZE = 16;   // sprite dimensions
const CC_SCALE = 16;  // canvas pixels per sprite pixel (256/16 = 16)

// State
let ccPixels = new Array(CC_SIZE * CC_SIZE).fill(null); // null = transparent
let ccCurrentColor = '#d0b080';
let ccTool = 'paint';
let ccPainting = false;
let ccLastCell = -1;

// Preset palette — covers most sprite needs
const CC_PALETTE_PRESETS = [
  '#000000','#ffffff','#888888','#444444',
  '#cc2222','#e87040','#e8c040','#60c840',
  '#2288cc','#6040c8','#c040a0','#40c8c8',
  '#f4c88a','#c87840','#7a5030','#3a2010',
  '#3a7a2a','#2a5a1a','#c8e870','#8b3a1a',
  '#3a7bd5','#1e4a8a','#6699ee','#304090',
  '#d03030','#ff6644','#ffcc44','#88ff44',
];

let ccCustomColors = [];

function ccGetCanvas(){ return document.getElementById('cc-canvas'); }
function ccGetCtx(){ return ccGetCanvas().getContext('2d'); }
function ccGetPreview(){ return document.getElementById('cc-preview'); }
function ccGetPreviewCtx(){ return ccGetPreview().getContext('2d'); }
function ccIdx(x,y){ return y*CC_SIZE+x; }

// ── Init ──────────────────────────────────────────────────────
function ccInit(){
  // Load saved sprite if exists
  const saved = localStorage.getItem('df_player_sprite');
  if(saved){
    try{ ccPixels = JSON.parse(saved); }
    catch(e){ ccFillDefault(); }
  } else {
    ccFillDefault();
  }
  ccBuildPalette();
  ccRender();
  ccRenderPreview();
  ccBindEvents();
  ccRenderCharList();
}

// Fill with the current default player sprite
function ccFillDefault(){
  // Convert PPX (2D array) to flat ccPixels
  const palette = {
    ol:'#000000',dk:'#404040',sv:'#b0b0b0',
    sk:'#d0b080',rd:'#d03030',bl:'#304090'
  };
  // Resolve the PPX grid using the live Pc palette from the game
  const rows = PPX; // PPX is already defined in scope
  ccPixels = new Array(CC_SIZE*CC_SIZE).fill(null);
  for(let y=0;y<CC_SIZE;y++){
    for(let x=0;x<CC_SIZE;x++){
      const v = rows[y][x];
      ccPixels[ccIdx(x,y)] = v || null;
    }
  }
}

function ccClear(){
  ccPixels = new Array(CC_SIZE*CC_SIZE).fill(null);
  ccRender();
  ccRenderPreview();
}

// ── Palette ───────────────────────────────────────────────────
function ccBuildPalette(){
  const container = document.getElementById('cc-palette');
  container.innerHTML = '';
  const all = [...CC_PALETTE_PRESETS, ...ccCustomColors];
  all.forEach(col => {
    const s = document.createElement('div');
    s.className = 'cc-swatch' + (col === ccCurrentColor ? ' active' : '');
    s.style.background = col;
    s.title = col;
    s.onclick = () => ccSelectColor(col);
    container.appendChild(s);
  });
  // Eraser swatch
  const e = document.createElement('div');
  e.className = 'cc-eraser' + (ccTool==='erase'?' active':'');
  e.id = 'cc-eraser-swatch';
  e.textContent = '✕';
  e.title = 'Erase (transparent)';
  e.onclick = () => ccSetTool('erase');
  container.appendChild(e);
}

function ccSelectColor(col){
  ccCurrentColor = col;
  if(ccTool === 'erase') ccSetTool('paint');
  ccBuildPalette();
  document.getElementById('cc-colorpicker').value = col;
  document.getElementById('cc-hexinput').value = col;
}

function ccAddCustomColor(){
  const hex = document.getElementById('cc-hexinput').value.trim();
  if(!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  if(!ccCustomColors.includes(hex)) ccCustomColors.push(hex);
  ccSelectColor(hex);
}

// ── Tools ─────────────────────────────────────────────────────
function ccSetTool(tool){
  ccTool = tool;
  ['paint','fill','erase'].forEach(t => {
    const el = document.getElementById('cc-tool-'+t);
    if(el) el.classList.toggle('active', t===tool);
  });
  const eraser = document.getElementById('cc-eraser-swatch');
  if(eraser) eraser.classList.toggle('active', tool==='erase');
  ccGetCanvas().style.cursor = tool==='fill' ? 'cell' : 'crosshair';
}

// ── Paint / Fill ──────────────────────────────────────────────
function ccCellFromEvent(e){
  const rect = ccGetCanvas().getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / CC_SCALE);
  const y = Math.floor((e.clientY - rect.top)  / CC_SCALE);
  if(x<0||x>=CC_SIZE||y<0||y>=CC_SIZE) return -1;
  return ccIdx(x,y);
}

function ccApplyTool(cellIdx){
  if(cellIdx < 0 || cellIdx === ccLastCell) return;
  ccLastCell = cellIdx;
  if(ccTool==='erase'){
    ccPixels[cellIdx] = null;
  } else if(ccTool==='paint'){
    ccPixels[cellIdx] = ccCurrentColor;
  }
  ccRender();
  ccRenderPreview();
}

function ccFloodFill(startIdx, newCol){
  const targetCol = ccPixels[startIdx];
  if(targetCol === newCol) return;
  const stack = [startIdx];
  const visited = new Set();
  while(stack.length){
    const idx = stack.pop();
    if(visited.has(idx)) continue;
    if(ccPixels[idx] !== targetCol) continue;
    visited.add(idx);
    ccPixels[idx] = newCol;
    const x = idx % CC_SIZE, y = Math.floor(idx/CC_SIZE);
    if(x>0)           stack.push(ccIdx(x-1,y));
    if(x<CC_SIZE-1)   stack.push(ccIdx(x+1,y));
    if(y>0)           stack.push(ccIdx(x,y-1));
    if(y<CC_SIZE-1)   stack.push(ccIdx(x,y+1));
  }
  ccRender();
  ccRenderPreview();
}

function ccBindEvents(){
  const canvas = ccGetCanvas();
  // Remove old listeners by cloning
  const fresh = canvas.cloneNode(true);
  canvas.parentNode.replaceChild(fresh, canvas);
  fresh.id = 'cc-canvas';

  fresh.addEventListener('mousedown', e=>{
    if(e.button!==0) return;
    const cell = ccCellFromEvent(e);
    if(cell<0) return;
    if(ccTool==='fill'){
      ccFloodFill(cell, ccTool==='erase' ? null : ccCurrentColor);
    } else {
      ccPainting = true;
      ccLastCell = -1;
      ccApplyTool(cell);
    }
  });
  fresh.addEventListener('mousemove', e=>{
    if(!ccPainting) return;
    ccApplyTool(ccCellFromEvent(e));
  });
  fresh.addEventListener('mouseleave', ()=>{ ccPainting=false; ccLastCell=-1; });

  // Color picker sync
  const picker = document.getElementById('cc-colorpicker');
  const hexIn  = document.getElementById('cc-hexinput');
  if(picker){
    picker.oninput = ()=>{
      hexIn.value = picker.value;
      ccCurrentColor = picker.value;
      if(ccTool==='erase') ccSetTool('paint');
      ccBuildPalette();
    };
  }
  if(hexIn){
    hexIn.onchange = ()=>{
      const v = hexIn.value.trim();
      if(/^#[0-9a-fA-F]{6}$/.test(v)){
        picker.value = v;
        ccCurrentColor = v;
        if(ccTool==='erase') ccSetTool('paint');
        ccBuildPalette();
      }
    };
  }
}

document.addEventListener('mouseup', ()=>{ ccPainting=false; ccLastCell=-1; });

// ── Render ────────────────────────────────────────────────────
function ccRender(){
  const ctx = ccGetCtx();
  ctx.clearRect(0,0,256,256);
  for(let y=0;y<CC_SIZE;y++){
    for(let x=0;x<CC_SIZE;x++){
      const col = ccPixels[ccIdx(x,y)];
      if(!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x*CC_SCALE, y*CC_SCALE, CC_SCALE, CC_SCALE);
    }
  }
  // Grid overlay
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 0.5;
  for(let i=0;i<=CC_SIZE;i++){
    ctx.beginPath();ctx.moveTo(i*CC_SCALE,0);ctx.lineTo(i*CC_SCALE,256);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,i*CC_SCALE);ctx.lineTo(256,i*CC_SCALE);ctx.stroke();
  }
}

function ccRenderPreview(){
  const ctx = ccGetPreviewCtx();
  ctx.clearRect(0,0,52,52);
  // Draw at PSCALE (26px) centered in 52px canvas
  const off = 13;
  for(let y=0;y<CC_SIZE;y++){
    for(let x=0;x<CC_SIZE;x++){
      const col = ccPixels[ccIdx(x,y)];
      if(!col) continue;
      ctx.fillStyle = col;
      // Map 16 sprite pixels → 26px render (same as game)
      const sx = off + Math.floor(x*26/16);
      const sy = off + Math.floor(y*26/16);
      const sw = Math.ceil((x+1)*26/16) - Math.floor(x*26/16);
      const sh = Math.ceil((y+1)*26/16) - Math.floor(y*26/16);
      ctx.fillRect(sx,sy,sw,sh);
    }
  }
}

// ── Upload ────────────────────────────────────────────────────
function ccTriggerUpload(){
  document.getElementById('cc-file-input').click();
}

function ccHandleUpload(evt){
  const file = evt.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      // Draw image scaled to 16×16 on a temp canvas
      const tmp = document.createElement('canvas');
      tmp.width = tmp.height = 16;
      const tc = tmp.getContext('2d');
      tc.imageSmoothingEnabled = false;
      tc.drawImage(img, 0, 0, 16, 16);
      const imgData = tc.getImageData(0,0,16,16).data;
      for(let i=0;i<256;i++){
        const r=imgData[i*4], g=imgData[i*4+1], b=imgData[i*4+2], a=imgData[i*4+3];
        if(a<128){ ccPixels[i]=null; continue; }
        ccPixels[i] = '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
      }
      ccRender();
      ccRenderPreview();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  // Reset so same file can be re-uploaded
  evt.target.value = '';
}

// ── Mirror / flip ─────────────────────────────────────────────
function ccMirrorH(){
  const flipped = new Array(256).fill(null);
  for(let y=0;y<16;y++){
    for(let x=0;x<16;x++){
      flipped[y*16+(15-x)] = ccPixels[y*16+x];
    }
  }
  ccPixels = flipped;
  ccRender();
  ccRenderPreview();
}

// ── Named character library ───────────────────────────────────
// Stored in localStorage as df_characters: [{id,name,pixels}]
function ccGetChars(){
  try{ return JSON.parse(localStorage.getItem('df_characters')||'[]'); }
  catch(e){ return []; }
}
function ccSetChars(chars){
  localStorage.setItem('df_characters', JSON.stringify(chars));
}

// Save current canvas as a named character
function ccSaveNamed(){
  const name = (document.getElementById('cc-char-name').value||'').trim() || 'Unnamed';
  const chars = ccGetChars();
  // Update existing if same name, else append
  const existing = chars.findIndex(c=>c.name===name);
  const entry = {id: Date.now(), name, pixels:[...ccPixels]};
  if(existing>=0){ entry.id=chars[existing].id; chars[existing]=entry; }
  else { chars.push(entry); }
  ccSetChars(chars);
  ccRenderCharList();
}

// Load a named character into the editor
function ccLoadChar(id){
  const chars = ccGetChars();
  const entry = chars.find(c=>c.id===id);
  if(!entry) return;
  ccPixels = [...entry.pixels];
  document.getElementById('cc-char-name').value = entry.name;
  ccRender();
  ccRenderPreview();
  ccRenderCharList(id);
}

// Delete a named character
function ccDeleteChar(id){
  const chars = ccGetChars().filter(c=>c.id!==id);
  ccSetChars(chars);
  ccRenderCharList();
}

// Render the character list panel
function ccRenderCharList(activeId){
  const container = document.getElementById('cc-chars-list');
  if(!container) return;
  const chars = ccGetChars();
  if(chars.length===0){
    container.innerHTML='<div style="font-size:9px;color:var(--dim);padding:8px 0;">No saved characters yet.</div>';
    return;
  }
  container.innerHTML = chars.map(c=>{
    const isActive = c.id===activeId;
    // Build a tiny thumbnail data-url
    const thumbCanvas = ccPixelsToCanvas(c.pixels);
    const thumb = thumbCanvas.toDataURL();
    return `<div class="cc-char-row${isActive?' cc-char-active':''}">
      <img class="cc-char-thumb" src="${thumb}" width="26" height="26">
      <span class="cc-char-name">${c.name}</span>
      <button class="cc-char-btn" onclick="ccLoadChar(${c.id})">LOAD</button>
      <button class="cc-char-btn" onclick="ccUseChar(${c.id})">USE</button>
      <button class="cc-char-btn del" onclick="ccDeleteChar(${c.id})">✕</button>
    </div>`;
  }).join('');
}

// Load + immediately apply a named character
function ccUseChar(id){
  ccLoadChar(id);
  ccSave();
}

// ── Save & apply ──────────────────────────────────────────────
function ccSave(){
  // Persist as the active sprite
  localStorage.setItem('df_player_sprite', JSON.stringify(ccPixels));

  // Build a new canvas sprite from ccPixels
  const spr = ccPixelsToCanvas(ccPixels);

  // Replace the live playerSpr and re-register
  SpriteRegistry.register('player', spr, PSCALE);

  // If in a multiplayer session, broadcast sprite to others
  if(MP.active && window._FB){
    window._FB.db
      .ref(`rooms/${MP.roomId}/sprites/${MP.localId}`)
      .set(ccPixels);
  }

  hubOpen();
}

// ── Pixels → canvas (used for both save and MP receive) ───────
function ccPixelsToCanvas(pixels){
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  for(let i=0;i<256;i++){
    if(!pixels[i]) continue;
    ctx.fillStyle = pixels[i];
    ctx.fillRect(i%16, Math.floor(i/16), 1, 1);
  }
  return c;
}

// Load saved sprite on startup so it persists across sessions
(function ccLoadOnBoot(){
  const saved = localStorage.getItem('df_player_sprite');
  if(!saved) return;
  try{
    const pixels = JSON.parse(saved);
    const spr = ccPixelsToCanvas(pixels);
    SpriteRegistry.register('player', spr, PSCALE);
  } catch(e){}
})();


// ═══════════════════════════════════════════════════════════════
