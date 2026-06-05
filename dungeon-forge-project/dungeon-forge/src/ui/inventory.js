// ═══════════════════════════════════════════════════════════════════
// ════════════ INVENTORY SYSTEM ══════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// gInventory: 9-slot array, each null or {id, name, type, icon}
// gEquipment: {weapon, helmet, chest, gloves, boots} — null or item
//
// Items:
//   id:'sword'  name:'Iron Sword' type:'weapon'
//   id:'bow'    name:'Shortbow'   type:'weapon'
//
// Active weapon: gActiveWeapon (already exists) — updated on equip

const ITEM_DEFS = {
  sword: { id:'sword', name:'Iron Sword',  type:'weapon', desc:'Reliable melee weapon. Hold to charge.' },
  bow:   { id:'bow',   name:'Shortbow',    type:'weapon', desc:'Ranged weapon. Hold to charge, release to fire.' },
};

let gInventory = Array(9).fill(null);  // 9 inventory slots
let gEquipment = { weapon:null, helmet:null, chest:null, gloves:null, boots:null };

// Initialise default loadout — sword equipped, bow in slot 0
function invInit() {
  gEquipment.weapon = {...ITEM_DEFS.sword};
  gInventory[0]     = {...ITEM_DEFS.bow};
  gActiveWeapon     = 'sword';
  invRender();
}

// ── Rendering ─────────────────────────────────────────────────────
function invRender() {
  invRenderEquipSlots();
  invRenderGrid();
  invRenderCharPreview();
}

function invRenderEquipSlots() {
  const slots = ['weapon','helmet','chest','gloves','boots'];
  for (const slot of slots) {
    const el = document.getElementById('inv-equip-' + slot);
    if (!el) continue;
    el.innerHTML = '';
    el.classList.remove('equipped');
    const item = gEquipment[slot];
    if (item) {
      el.classList.add('equipped');
      el.appendChild(invMakeItemEl(item, 'equip:' + slot));
    }
  }
}

function invRenderGrid() {
  const grid = document.getElementById('inv-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'inv-cell';
    cell.dataset.cell = i;
    cell.addEventListener('dragover', e => invDragOver(e, cell));
    cell.addEventListener('dragleave', () => invDragLeave(cell));
    cell.addEventListener('drop', e => invDrop(e, cell));
    const item = gInventory[i];
    if (item) cell.appendChild(invMakeItemEl(item, 'inv:' + i));
    grid.appendChild(cell);
  }
}

function invRenderCharPreview() {
  const cvs = document.getElementById('inv-char-canvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, 64, 64);
  // Draw player sprite centred, using custom sprite if available
  const spr = (() => {
    const saved = localStorage.getItem('df_player_sprite');
    if (saved) {
      try {
        const px = JSON.parse(saved);
        return ccPixelsToCanvas(px);
      } catch(e) {}
    }
    return SpriteRegistry.get('player').canvas;
  })();
  const scale = 3;
  const sw = spr.width * scale, sh = spr.height * scale;
  const ox = Math.round((64 - sw) / 2), oy = Math.round((64 - sh) / 2);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(spr, ox, oy, sw, sh);
}

// ── Item element factory ───────────────────────────────────────────
function invMakeItemEl(item, srcKey) {
  const el = document.createElement('div');
  el.className = 'inv-item';
  el.draggable = true;
  el.dataset.src = srcKey;
  el.dataset.itemId = item.id;

  // Icon canvas
  const ic = document.createElement('canvas');
  ic.width = ic.height = 36;
  ic.style.width = ic.style.height = '36px';
  ic.style.imageRendering = 'pixelated';
  invDrawItemIcon(ic, item.id);
  el.appendChild(ic);

  // Tooltip
  const tip = document.createElement('div');
  tip.className = 'inv-item-tip';
  tip.textContent = item.name + (item.desc ? ' — ' + item.desc : '');
  el.appendChild(tip);

  el.addEventListener('dragstart', e => invDragStart(e, el));
  el.addEventListener('dragend',   () => invDragEnd());
  return el;
}

// ── Item icons (drawn on a 36×36 canvas) ──────────────────────────
function invDrawItemIcon(canvas, itemId) {
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, 36, 36);
  if (itemId === 'sword') {
    // Blade
    c.fillStyle = '#aabcdd'; c.fillRect(16,4,4,20);
    c.fillStyle = '#e8f0ff'; c.fillRect(17,4,2,18);
    // Guard
    c.fillStyle = '#f0c040'; c.fillRect(12,22,12,4);
    // Grip
    c.fillStyle = '#8b5c2a'; c.fillRect(16,26,4,8);
    // Pommel
    c.fillStyle = '#c09000'; c.fillRect(15,33,6,3);
  } else if (itemId === 'bow') {
    // Bow stave
    c.strokeStyle = '#8b5c2a'; c.lineWidth = 3;
    c.beginPath(); c.arc(22, 18, 12, -Math.PI*0.6, Math.PI*0.6); c.stroke();
    // Bowstring
    c.strokeStyle = '#c0b040'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(22-Math.cos(0.6)*12+2, 18-Math.sin(0.6)*12);
                   c.lineTo(22-Math.cos(0.6)*12+2, 18+Math.sin(0.6)*12); c.stroke();
    // Arrow on bow
    c.strokeStyle = '#d4a060'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(8,18); c.lineTo(24,18); c.stroke();
    c.fillStyle = '#888'; c.beginPath(); c.moveTo(8,18); c.lineTo(12,15); c.lineTo(12,21); c.closePath(); c.fill();
  }
}

// ── Drag and Drop ──────────────────────────────────────────────────
let _invDragSrc  = null; // 'inv:N' or 'equip:slotName'
let _invDragItem = null; // item object

function invDragStart(e, el) {
  _invDragSrc  = el.dataset.src;
  _invDragItem = ITEM_DEFS[el.dataset.itemId] ? {...ITEM_DEFS[el.dataset.itemId]} : null;
  e.dataTransfer.effectAllowed = 'move';
  // Ghost
  const ghost = document.getElementById('inv-ghost-canvas');
  if (ghost) invDrawItemIcon(ghost, el.dataset.itemId);
  setTimeout(() => { el.style.opacity = '0.4'; }, 0);
}

function invDragEnd() {
  document.querySelectorAll('.inv-item').forEach(el => el.style.opacity = '');
  document.querySelectorAll('.inv-cell,.inv-slot').forEach(el => el.classList.remove('drag-over'));
}

function invDragOver(e, el) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  el.classList.add('drag-over');
}

function invDragLeave(el) {
  el.classList.remove('drag-over');
}

function invDrop(e, el) {
  e.preventDefault();
  el.classList.remove('drag-over');
  if (!_invDragItem || !_invDragSrc) return;

  const dst = el.dataset.slot  // equip slot
           || el.dataset.cell; // or inventory cell index
  const dstType = el.dataset.slot ? 'equip' : 'inv';

  // Validate: only weapons go in the weapon slot; no armour slots yet (they accept nothing)
  if (dstType === 'equip') {
    const slot = el.dataset.slot;
    if (_invDragItem.type !== slot && !(slot === 'weapon' && _invDragItem.type === 'weapon')) return;
    if (slot !== 'weapon') return; // armour slots reserved for future items
  }

  // Get current occupant of destination
  let dstItem = null;
  if (dstType === 'equip') {
    dstItem = gEquipment[el.dataset.slot] ? {...gEquipment[el.dataset.slot]} : null;
  } else {
    dstItem = gInventory[parseInt(dst)] ? {...gInventory[parseInt(dst)]} : null;
  }

  // Move dragged item to destination
  if (dstType === 'equip') {
    gEquipment[el.dataset.slot] = _invDragItem;
  } else {
    gInventory[parseInt(dst)] = _invDragItem;
  }

  // Move displaced item (if any) back to source
  if (_invDragSrc.startsWith('equip:')) {
    const srcSlot = _invDragSrc.slice(6);
    gEquipment[srcSlot] = dstItem;
  } else {
    const srcIdx = parseInt(_invDragSrc.slice(4));
    gInventory[srcIdx] = dstItem;
  }

  invApplyEquipment();
  invRender();

  _invDragSrc  = null;
  _invDragItem = null;
}

// ── Apply equipment → update gActiveWeapon ────────────────────────
function invApplyEquipment() {
  const wItem = gEquipment.weapon;
  gActiveWeapon = (wItem && wItem.id === 'bow') ? 'bow' : 'sword';
}

// ── Open / close ──────────────────────────────────────────────────
function invOpen() {
  if(!isGameActive()) return;
  invRenderCharPreview();
  invRender();
  document.getElementById('inv-overlay').classList.add('show');
}

function invClose() {
  document.getElementById('inv-overlay').classList.remove('show');
}

function invToggle() {
  if(!isGameActive()) return;
  const ov = document.getElementById('inv-overlay');
  if (ov.classList.contains('show')) invClose();
  else invOpen();
}

// ── Q quick-swap ──────────────────────────────────────────────────
function invQuickSwap() {
  // Find the other weapon (the one not currently equipped)
  const curId = gEquipment.weapon ? gEquipment.weapon.id : null;
  const otherWeaponSlot = gInventory.findIndex(
    item => item && item.type === 'weapon' && item.id !== curId
  );
  if (otherWeaponSlot < 0) return; // no other weapon available

  const other = gInventory[otherWeaponSlot];
  gInventory[otherWeaponSlot] = gEquipment.weapon; // swap equipped → inventory
  gEquipment.weapon = other;                         // swap inventory → equipped
  invApplyEquipment();
  invRender();

  // Brief HUD flash to indicate swap
  const ww = document.getElementById('g-ww');
  if (ww) {
    const name = other.name.toUpperCase();
    ww.textContent = name + ' ⇄';
    ww.style.color = gActiveWeapon === 'bow' ? '#f0c040' : '#aabcdd';
    clearTimeout(ww._swapTimer);
    ww._swapTimer = setTimeout(() => {
      ww.textContent = '';
      ww.style.color = '#55ccff';
    }, 1200);
  }
}


// ═══════════════════════════════════════════════════════════════════
