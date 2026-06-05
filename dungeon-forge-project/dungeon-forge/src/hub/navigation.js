// §3  HUB & NAVIGATION
//     Screen routing, map list, hub UI
// ═══════════════════════════════════════════════════════════════
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function refreshHub() {
  const maps = getAllMaps();
  document.getElementById('map-count').textContent = maps.length + ' map' + (maps.length !== 1 ? 's' : '');
  const list = document.getElementById('maps-list');
  if (!maps.length) {
    list.innerHTML = '<div class="empty-state">No maps yet.<br>Create one to get started.</div>';
    return;
  }
  list.innerHTML = '';
  maps.forEach(m => {
    const goblins = (m.entities || []).filter(e => e.kind === 'goblin' || e.kind === 'warrior' || e.kind === 'archer').length;
    const date = new Date(m.updatedAt).toLocaleDateString();
    const card = document.createElement('div');
    card.className = 'map-card';
    card.innerHTML = `
      <div class="map-card-info">
        <div class="map-card-name">${esc(m.name)}</div>
        <div class="map-card-meta">${m.width}×${m.height} · ${goblins} goblins · ${date}</div>
      </div>
      <div class="map-card-btns">
        <button class="mc-btn play"   onclick="playMapById('${esc(m.id)}')">▶ PLAY</button>
        <button class="mc-btn"        onclick="editMapById('${esc(m.id)}')">✏ EDIT</button>
        <button class="mc-btn seed"   onclick="seedShowExport('${esc(m.id)}')">⚿ SEED</button>
        <button class="mc-btn del"    onclick="deleteMapById('${esc(m.id)}')">✕</button>
      </div>`;
    list.appendChild(card);
  });
}

function newMap() {
  const overlay = document.getElementById('new-map-overlay');
  const input   = document.getElementById('new-map-name');
  input.value   = 'New Dungeon';
  overlay.style.display = 'flex';
  setTimeout(() => { input.focus(); input.select(); }, 50);
}

function newMapConfirm() {
  const name = document.getElementById('new-map-name').value.trim() || 'New Dungeon';
  document.getElementById('new-map-overlay').style.display = 'none';
  const m = emptyMap(40, 24, name);
  currentMapData = m;
  editorLoad(m);
  showScreen('editor');
  edCentreView();
}

function newMapCancel() {
  document.getElementById('new-map-overlay').style.display = 'none';
}

function editMapById(id) {
  const m = storeGet(id);
  if (!m) return;
  currentMapData = m;
  editorLoad(m);
  showScreen('editor');
  edCentreView();
}

function playMapById(id) {
  const m = storeGet(id);
  if (!m) return;
  leaveTown();
  currentMapData = m;
  gameLoad(m);
  showScreen('game');
}

function deleteMapById(id) {
  if (!confirm('Delete this map?')) return;
  storeDel(id);
  refreshHub();
}

function loadDemo() {
  leaveTown();
  currentMapData = JSON.parse(JSON.stringify(DEMO_MAP));
  gameLoad(currentMapData);
  showScreen('game');
}

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(name).classList.add('active');
  if (name === 'editor') { document.getElementById('ed-canvas').focus(); }
  if (name === 'game') { startGameLoop(); document.getElementById('gc').focus(); }
  if (name === 'town') { /* townLoad/startTownLoop called from goTown() directly */ tCanvas && tCanvas.focus(); }
  if (name === 'cc-screen') { ccInit(); }
}

function goHub() {
  invClose();
  leaveTown(); // stop presence + clear inTown flag
  if (gLoopId) { cancelAnimationFrame(gLoopId); gLoopId = null; }
  mpLeave();
  goTown();
}

// Return to town from hub menu (back button in hub menu)
function returnToTown() {
  hubClose();
}

function hubOpen() {
  refreshHub();
  document.getElementById('hub').classList.add('active');
}

function hubClose() {
  document.getElementById('hub').classList.remove('active');
  // Ensure town is running if we're on the town screen
  if (document.getElementById('town').classList.contains('active')) {
    if (!tRunning) { startTownLoop(); townStartPresence(); }
    tCanvas && tCanvas.focus();
  }
}

// ═══════════════════════════════════════════════════════
// MAP HELPERS
// ═══════════════════════════════════════════════════════
function emptyMap(w, h, name) {
  const rows = [];
  for (let y = 0; y < h; y++) { let r = ''; for (let x = 0; x < w; x++) r += 'W'; rows.push(r); }
  return { id: Date.now() + '', name: name || 'Dungeon', width: w, height: h, rows, entities: [], createdAt: Date.now(), updatedAt: Date.now() };
}

function rowsFromTiles(tiles, w, h) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    let r = '';
    for (let x = 0; x < w; x++) {
      const t = tiles[y * w + x];
      r += t === TILE_FLOOR ? 'F' : t === TILE_EXIT ? 'E' : 'W';
    }
    rows.push(r);
  }
  return rows;
}

function tilesFromRows(rows, w, h) {
  const tiles = new Uint8Array(w * h).fill(TILE_WALL);
  rows.forEach((row, r) => {
    [...row.toUpperCase()].forEach((ch, c) => {
      if (ch === 'F') tiles[r * w + c] = TILE_FLOOR;
      else if (ch === 'E') tiles[r * w + c] = TILE_EXIT;
    });
  });
  return tiles;
}

// ═══════════════════════════════════════════════════════════════
